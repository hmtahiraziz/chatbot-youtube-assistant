import { useState } from "react";

const Sidebar = ({ onProcess, currentVideoId, loading }) => {
  const [localVid, setLocalVid] = useState("");

  const handleProcessClick = async () => {
    if (!localVid.trim()) return alert("Enter video ID");
    try {
      await onProcess(localVid);
      setLocalVid("");
    } catch (err) {
      console.error(err);
      alert("Error starting processing");
    }
  };

  return (
    <aside className="w-72 bg-[#111827] text-gray-100 flex-shrink-0 h-screen p-4 flex flex-col border-r border-gray-800">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">YouTube Q&A</h2>
        <p className="text-xs text-gray-400 mt-1">Paste a video ID and click Process</p>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-300">Video ID</label>
        <input
          className="mt-2 w-full px-3 py-2 rounded bg-[#0b1220] text-white border border-gray-700"
          placeholder="e.g. dQw4w9WgXcQ"
          value={localVid}
          onChange={(e) => setLocalVid(e.target.value)}
        />
        <button
          onClick={handleProcessClick}
          disabled={loading}
          className="mt-3 w-full bg-green-500 hover:bg-green-600 text-black py-2 rounded font-semibold disabled:opacity-60"
        >
          {loading ? "Starting…" : "Process"}
        </button>
      </div>

      <div className="mt-auto text-xs text-gray-400">
        <div>Current video:</div>
        <div className="mt-1 text-sm text-gray-200 break-all">{currentVideoId || "none"}</div>
      </div>
      
    </aside>
  );
};

export default Sidebar;
