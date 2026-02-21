"use client";

import { useState, useRef, useCallback } from "react";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

interface UseWebRTCReturn {
  state: ConnectionState;
  error: string | null;
  transcript: TranscriptEntry[];
  isAssistantSpeaking: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useWebRTC(): UseWebRTCReturn {
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addTranscript = useCallback((role: "user" | "assistant", text: string) => {
    setTranscript((prev) => [...prev, { role, text, timestamp: Date.now() }]);
  }, []);

  const disconnect = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setState("disconnected");
    setIsAssistantSpeaking(false);
  }, []);

  const connect = useCallback(async () => {
    try {
      setState("connecting");
      setError(null);
      setTranscript([]);

      // 1. Get ephemeral token from our API
      const tokenRes = await fetch("/api/voice/session", { method: "POST" });
      if (!tokenRes.ok) {
        const errData = await tokenRes.json();
        throw new Error(errData.error || "Failed to get session token");
      }
      const session = await tokenRes.json();
      const ephemeralKey = session.client_secret?.value;
      if (!ephemeralKey) {
        throw new Error("No ephemeral key in session response");
      }

      // 2. Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3. Set up remote audio playback
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      pc.ontrack = (ev) => {
        audioEl.srcObject = ev.streams[0];
      };

      // 4. Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      pc.addTrack(stream.getTracks()[0]);

      // 5. Set up data channel for events
      const dc = pc.createDataChannel("oai-events");
      dc.onmessage = (ev) => {
        try {
          const event = JSON.parse(ev.data);

          if (event.type === "response.audio_transcript.done") {
            addTranscript("assistant", event.transcript);
          }
          if (event.type === "conversation.item.input_audio_transcription.completed") {
            addTranscript("user", event.transcript);
          }
          if (event.type === "response.audio.delta") {
            setIsAssistantSpeaking(true);
          }
          if (event.type === "response.audio.done" || event.type === "response.done") {
            setIsAssistantSpeaking(false);
          }
        } catch {
          // Ignore parse errors
        }
      };

      // 6. Create and set local SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 7. Send SDP to OpenAI Realtime and get answer
      const sdpRes = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );
      if (!sdpRes.ok) {
        throw new Error(`SDP exchange failed: ${sdpRes.status}`);
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          setState("connected");
        }
        if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
          disconnect();
          setError("Connection lost");
          setState("error");
        }
      };

      setState("connected");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setState("error");
      disconnect();
    }
  }, [disconnect, addTranscript]);

  return { state, error, transcript, isAssistantSpeaking, connect, disconnect };
}
