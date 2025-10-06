import Sidebar from "./components/sidebar";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import { useYouTubeQA } from "./hooks/useYouTubeQA";

const App = () => {
  const { videoId, messages, loading, processVideo, askQuestion } = useYouTubeQA();

  return (
    <div className="flex h-screen text-sm">
      <Sidebar onProcess={processVideo} currentVideoId={videoId} loading={loading} />

      <div className="flex-1 flex flex-col bg-[#0f1724] text-white">
        {/* header */}
        <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xl font-semibold">YouTube Q&A</div>
            <div className="text-xs text-gray-400">Ask questions about processed videos</div>
          </div>
        </header>

        {/* messages */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full">
            <MessageList messages={messages} />
          </div>
        </main>

        {/* input */}
        <div>
          <ChatInput onSend={askQuestion} disabled={loading} />
        </div>
      </div>
    </div>
  );
};

export default App;
