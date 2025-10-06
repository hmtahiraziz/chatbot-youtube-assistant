import { useState } from "react";

/**
 * useYouTubeQA
 * - manages video id, messages, loading, and calls backend endpoints
 */
export const useYouTubeQA = () => {
  const [videoId, setVideoId] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "system-welcome",
      role: "system",
      text: "Welcome — paste a YouTube video ID in the sidebar and click Process. Then ask questions about the video.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  // helper to push message
  const pushMessage = (role, text) => {
    setMessages((m) => [
      ...m,
      { id: `${role}-${Date.now()}`, role, text },
    ]);
  };

  // process video (starts background processing on backend)
  const processVideo = async (vid) => {
    if (!vid?.trim()) throw new Error("Missing video id");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: vid }),
      });
      const data = await res.json();
      setVideoId(vid);
      pushMessage("system", `Processing started for video ${vid}.`);
      return data;
    } catch (err) {
      pushMessage("system", `Error starting processing: ${err.message || err}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ask a question — posts to /ask and appends assistant response
  const askQuestion = async (question) => {
    if (!videoId) {
      pushMessage("system", "Please process a video first (enter video ID in sidebar).");
      return;
    }
    if (!question?.trim()) return;

    // append user message
    pushMessage("user", question);

    setLoading(true);
    pushMessage("assistant", "…"); // placeholder while waiting

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId, question }),
      });
      const data = await res.json();
      // replace the last assistant placeholder with the real answer
      setMessages((prev) => {
        const withoutLastAssistant = prev.slice(0, -1);
        return [...withoutLastAssistant, { id: `assistant-${Date.now()}`, role: "assistant", text: data.answer || data.error || "No response" }];
      });
    } catch (err) {
      // replace the last assistant placeholder with error
      setMessages((prev) => {
        const withoutLastAssistant = prev.slice(0, -1);
        return [...withoutLastAssistant, { id: `assistant-${Date.now()}`, role: "assistant", text: `Error: ${err.message || err}` }];
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    videoId,
    setVideoId,
    messages,
    loading,
    processVideo,
    askQuestion,
    pushMessage,
  };
};
