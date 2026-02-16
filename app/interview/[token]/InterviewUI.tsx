"use client";

import { useState, useCallback, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Loader2, CheckCircle } from "lucide-react";
import { saveAndAnalyzeInterview } from "@/app/interview/actions";

type InterviewUIProps = {
  token: string;
  agentId: string;
  dynamicVariables: Record<string, string>;
};

export function InterviewUI({
  token,
  agentId,
  dynamicVariables,
}: InterviewUIProps) {
  const [started, setStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  const conversation = useConversation({
    onDisconnect: () => {
      setStarted(false);
    },
  });

  const handleStart = useCallback(async () => {
    if (!agentId) {
      setEndError("Agent ID not configured. Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID.");
      return;
    }
    setIsStarting(true);
    setEndError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const id = await conversation.startSession({
        agentId,
        connectionType: "webrtc",
        dynamicVariables,
      });
      conversationIdRef.current = id;
      setStarted(true);
    } catch (err) {
      setEndError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setIsStarting(false);
    }
  }, [agentId, conversation, dynamicVariables]);

  const handleEnd = useCallback(async () => {
    setEndError(null);
    const conversationId = conversation.getId() ?? conversationIdRef.current;
    if (!conversationId) {
      setEndError("Conversation ID not available. Please try again.");
      setStarted(false);
      return;
    }
    try {
      await conversation.endSession();
      setStarted(false);
      setIsAnalyzing(true);
      const result = await saveAndAnalyzeInterview(conversationId, token);
      if (result.error) {
        setEndError(result.error);
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setEndError(err instanceof Error ? err.message : "Failed to end");
    } finally {
      setIsAnalyzing(false);
      conversationIdRef.current = null;
    }
  }, [conversation, token]);

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

  // Success screen
  if (isSuccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="size-10 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-black">
          Thank you. Your feedback has been recorded.
        </h2>
        <p className="text-center text-zinc-600">
          We appreciate you taking the time for this interview.
        </p>
      </div>
    );
  }

  // Analyzing state (after call ended)
  if (isAnalyzing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <Loader2 className="size-12 animate-spin text-zinc-600" />
        <p className="text-center font-medium text-black">Analyzing answers…</p>
        <p className="text-sm text-zinc-500">
          This may take a few seconds.
        </p>
        {endError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {endError}
          </p>
        )}
      </div>
    );
  }

  // Pre-call: Start button
  if (!started) {
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
        {endError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {endError}
          </p>
        )}
      </div>
    );
  }

  // During call
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full border-2 border-black transition-all ${
          conversation.isSpeaking ? "animate-pulse scale-110 bg-zinc-100" : "bg-white"
        }`}
      >
        <span className="text-2xl" aria-hidden>
          {conversation.isSpeaking ? "♪" : "○"}
        </span>
      </div>
      <p className="text-sm font-medium text-black">{statusLabel}</p>
      {endError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {endError}
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
