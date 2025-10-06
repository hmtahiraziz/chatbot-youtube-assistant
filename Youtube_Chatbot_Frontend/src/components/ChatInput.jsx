import { useState } from "react";

const ChatInput = ({ onSend, disabled }) => {
  const [text, setText] = useState("");

  const handleSend = async () => {
    if (!text.trim()) return;
    await onSend(text);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-800 bg-[#0f1724] p-4">
      <div className="max-w-3xl mx-auto flex gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question here — press Ctrl/Cmd+Enter to send"
          className="flex-1 rounded-lg bg-[#1a2335] text-white border border-gray-700 shadow-sm p-3 resize-none h-16 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
        <button
          onClick={handleSend}
          disabled={disabled}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-lg font-semibold disabled:opacity-60 transition-colors"
        >
          {disabled ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
