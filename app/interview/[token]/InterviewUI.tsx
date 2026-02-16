"use client";

import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Loader2 } from "lucide-react";
import { completeInterview } from "@/app/dashboard/actions";

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
  const [endError, setEndError] = useState<string | null>(null);

  const conversation = useConversation({
    onDisconnect: () => setStarted(false),
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
      await conversation.startSession({
        agentId,
        connectionType: "webrtc",
        dynamicVariables,
      });
      setStarted(true);
    } catch (err) {
      setEndError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setIsStarting(false);
    }
  }, [agentId, conversation, dynamicVariables]);

  const handleEnd = useCallback(async () => {
    setEndError(null);
    try {
      await conversation.endSession();
      await completeInterview(token);
    } catch (err) {
      setEndError(err instanceof Error ? err.message : "Failed to end");
    }
    setStarted(false);
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

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4">
      {!started ? (
        <>
          <p className="text-center text-zinc-600">
            When you’re ready, start the voice interview.
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
        </>
      ) : (
        <>
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full border-2 border-black transition-all ${
              conversation.isSpeaking ? "animate-pulse bg-zinc-100 scale-110" : "bg-white"
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
        </>
      )}
    </div>
  );
}
