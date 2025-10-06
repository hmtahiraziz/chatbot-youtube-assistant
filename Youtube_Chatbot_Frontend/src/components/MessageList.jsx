import { useEffect, useRef } from "react";


const MessageBubble = ({ role, text }) => {
  const isUser = role === "user";
  const isSystem = role === "system";

  const base = "max-w-[80%] px-4 py-2 rounded-lg whitespace-pre-wrap";
  const userStyle = `${base} self-end bg-blue-600 text-white rounded-br-md rounded-tl-md`;
  const assistantStyle = `${base} self-start bg-gray-100 text-gray-900 rounded-bl-md rounded-tr-md`;
  const systemStyle = `${base} self-center bg-transparent text-gray-400 italic text-sm`;

  if (isSystem) {
    return <div className={systemStyle}>{text}</div>;
  }

  return <div className={isUser ? userStyle : assistantStyle}>{text}</div>;
};


const MessageList = ({ messages }) => {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      id="message-list"
      className="flex-1 p-6 overflow-y-auto flex flex-col gap-4"
      style={{ maxHeight: "calc(100vh - 150px)" }}
    >
      {messages.map((m) => (
        <div key={m.id} className="flex">
          <MessageBubble role={m.role} text={m.text} />
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
