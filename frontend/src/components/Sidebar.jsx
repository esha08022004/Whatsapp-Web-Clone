import React from "react";

export default function Sidebar({ conversations, activeChat, setActiveChat }) {
  return (
    <div className="w-80 border-r border-gray-300 flex flex-col">
      <div className="p-4 font-bold text-xl border-b border-gray-300">
        WhatsApp Clone
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.wa_id}
            className={`cursor-pointer p-4 hover:bg-gray-200 ${
              activeChat?.wa_id === conv.wa_id ? "bg-gray-300" : ""
            }`}
            onClick={() => setActiveChat(conv)}
          >
            <div className="font-semibold">{conv.name || "Unknown User"}</div>
            <div className="text-sm text-gray-600 truncate">
              {conv.lastMessage || "No messages yet"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
