"use client";

import { useState, useCallback, useRef, memo } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Loader2, CheckCircle } from "lucide-react";
import { processInterview } from "@/app/interview/actions";

type InterviewUIProps = {
  token: string;
  agentId: string;
  dynamicVariables: Record<string, string>;
};

type Phase = "idle" | "in_call" | "analyzing" | "success" | "error";

// Sous-composant mémorisé : évite que les re-renders (ex. isSpeaking) remontent et ne recréent les callbacks du hook
const InCallVisual = memo(function InCallVisual({
  isSpeaking,
  statusLabel,
}: {
  isSpeaking: boolean;
  statusLabel: string;
}) {
  return (
    <>
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full border-2 border-black transition-all ${
          isSpeaking ? "animate-pulse scale-110 bg-zinc-100" : "bg-white"
        }`}
      >
        <span className="text-2xl" aria-hidden>
          {isSpeaking ? "♪" : "○"}
        </span>
      </div>
      <p className="text-sm font-medium text-black">{statusLabel}</p>
    </>
  );
});

export function InterviewUI({
  token,
  agentId,
  dynamicVariables,
}: InterviewUIProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;

  const runProcessInterview = useCallback(
    async (conversationId: string) => {
      setError(null);
      setPhase("analyzing");
      await new Promise((r) => setTimeout(r, 2500));
      const result = await processInterview(conversationId, token);
      if (result.error) {
        setError(result.error);
        setPhase("error");
      } else {
        setPhase("success");
      }
    },
    [token]
  );

  const onDisconnect = useCallback(() => {
    const cid = conversationIdRef.current;
    conversationIdRef.current = null;
    const currentPhase = phaseRef.current;
    if (cid && currentPhase === "in_call") {
      runProcessInterview(cid);
    } else if (currentPhase === "in_call") {
      setPhase("idle");
    }
  }, [runProcessInterview]);

  const onError = useCallback((message: string) => {
    if (/websocket|CLOSING|CLOSED|connection/i.test(message)) {
      setConnectionError("Connection interrupted. End the call to save your responses.");
    } else {
      setConnectionError(message);
    }
  }, []);

  const conversation = useConversation({
    onDisconnect,
    onError,
  });

  const handleStart = useCallback(async () => {
    if (!agentId) {
      setError("Agent ID not configured. Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID.");
      return;
    }
    setIsStarting(true);
    setError(null);
    setConnectionError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      let conversationId: string;
      const signedRes = await fetch("/api/convai-signed-url").catch(() => null);
      if (signedRes?.ok) {
        const { signedUrl } = (await signedRes.json()) as { signedUrl: string };
        conversationId = await conversation.startSession({
          signedUrl,
          connectionType: "websocket",
          dynamicVariables,
        });
      } else {
        // Pas d'API key ou erreur : on utilise agentId comme avant (agent public)
        conversationId = await conversation.startSession({
          agentId,
          connectionType: "websocket",
          dynamicVariables,
        });
      }
      conversationIdRef.current = conversationId;
      setPhase("in_call");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setIsStarting(false);
    }
  }, [agentId, conversation, dynamicVariables]);

  const handleEnd = useCallback(async () => {
    setError(null);
    setConnectionError(null);
    const cid = conversationIdRef.current;
    conversationIdRef.current = null;
    try {
      await conversation.endSession();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/websocket|CLOSING|CLOSED|already/i.test(msg)) {
        // Connexion déjà fermée (bug connu SDK) : on ignore et on enchaîne avec l'analyse
      } else {
        setError(msg);
        setPhase("error");
        return;
      }
    }
    if (cid) {
      await runProcessInterview(cid);
    } else {
      setPhase("idle");
    }
  }, [conversation, runProcessInterview]);

  const statusLabel =
    conversation.status === "connecting"
      ? "Connecting…"
      : conversation.status === "disconnecting"
        ? "Ending…"
        : conversation.status === "connected"
          ? conversation.isSpeaking
            ? "Speaking"
            : "Listening"
          : "Ready";

  // Analyzing: loader pendant processInterview
  if (phase === "analyzing") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <Loader2 className="size-12 animate-spin text-zinc-600" />
        <p className="text-lg font-medium text-black">Analyzing your responses…</p>
        <p className="text-sm text-zinc-500">This may take a few seconds.</p>
      </div>
    );
  }

  // Success: une fois l'action terminée
  if (phase === "success") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <CheckCircle className="size-16 text-emerald-600" />
        <h2 className="text-center text-xl font-semibold text-black">
          Thanks for your insights — it&apos;s been really valuable.
        </h2>
        <p className="text-center text-zinc-600">You can close this page.</p>
      </div>
    );
  }

  // Error state (with option to go back to idle or show message)
  if (phase === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800">
          {error}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setPhase("idle");
            setError(null);
          }}
          className="border-zinc-300"
        >
          Back
        </Button>
      </div>
    );
  }

  // Idle: Start button
  if (phase === "idle") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4">
        <p className="text-center text-zinc-600">
          When you&apos;re ready, start the voice interview.
        </p>
        <Button
          size="lg"
          disabled={isStarting}
          onClick={handleStart}
          className="h-24 w-24 rounded-full bg-black text-white hover:bg-zinc-800 disabled:opacity-70"
        >
          {isStarting ? (
            <Loader2 className="size-10 animate-spin" />
          ) : (
            <span className="text-lg font-medium">Start</span>
          )}
        </Button>
        <p className="text-sm text-zinc-500">Start Interview</p>
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
      </div>
    );
  }

  // In call: status + End Call (+ banner if connection error)
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4">
      {connectionError && (
        <div className="w-full max-w-md rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {connectionError}
          <p className="mt-1 text-amber-700">Click &quot;End Call&quot; below to save your answers.</p>
        </div>
      )}
      <InCallVisual isSpeaking={conversation.isSpeaking} statusLabel={statusLabel} />
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <Button
        variant="outline"
        size="lg"
        onClick={handleEnd}
        className="border-zinc-300 text-black hover:bg-zinc-100"
      >
        <PhoneOff className="size-4" />
        End Call
      </Button>
    </div>
  );
}
