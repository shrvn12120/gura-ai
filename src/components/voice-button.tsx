"use client";

import { useRef, useState } from "react";
import { Button } from "./ui/button";

export default function VoiceButton({
  onMessage,
}: {
  onMessage: (msg: string, data?: any) => void;
}) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= START RECORDING ================= */

  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        try {
          setLoading(true);

          const audioBlob = new Blob(
            chunksRef.current,
            {
              type: "audio/webm",
            }
          );

          const formData = new FormData();
          formData.append("audio", audioBlob);

          const res = await fetch("/api/chat", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          // send text back to UI
          onMessage(data.message, data);

          // =========================
          // PLAY AUDIO (if voice mode)
          // =========================
          if (data.audio) {
            const audio = new Audio(
              `data:audio/mp3;base64,${data.audio}`
            );

            audio.play();
          }
        } catch (err) {
          console.error(
            "VOICE REQUEST ERROR:",
            err
          );
        } finally {
          setLoading(false);
        }
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("MIC ERROR:", err);
    }
  };

  /* ================= STOP RECORDING ================= */

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <Button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      disabled={loading}
      className={`rounded-full px-4 py-3 text-white transition ${
        recording
          ? "bg-red-500"
          : "bg-blue-600"
      }`}
    >
      {loading
        ? "Processing..."
        : recording
        ? "🎙️ Listening..."
        : "🎤 Talk"}
    </Button>
  );
}