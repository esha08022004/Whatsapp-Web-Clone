import React, { useState, useEffect, useRef } from "react";

export default function ChatWindow({ conversation }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch messages for active chat
  useEffect(() => {
    if (!conversation) return;
    fetch(`/api/messages?wa_id=${conversation.wa_id}`)
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch(console.error);
  }, [conversation]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message handler (local save + API call)
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Optimistic UI update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      message: newMessage,
      timestamp: new Date().toISOString(),
      from: "me",
      status: "pending",
    };

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    // Save to backend
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wa_id: conversation.wa_id,
          message: newMessage,
          from: "me",
        }),
      });

      if (res.ok) {
        const savedMsg = await res.json();
        // Replace temp message with saved one
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? savedMsg : m))
        );
      }
    } catch (err) {
      console.error(err);
      // Optionally mark message as failed
    }
  };

  return (
    <div className="flex flex-col flex-1 border-l border-gray-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 font-semibold">
        {conversation.name || conversation.wa_id}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
        {messages.map((msg) => {
          const isMine = msg.from === "me";
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  isMine ? "bg-green-400 text-white" : "bg-white text-black"
                }`}
              >
                <div>{msg.message}</div>
                <div className="text-xs text-gray-200 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  {/* Status icon */}
                  {isMine && (
                    <span className="ml-1 text-xs">
                      {msg.status === "sent" && "✓"}
                      {msg.status === "delivered" && "✓✓"}
                      {msg.status === "read" && "✓✓ (blue)"}
                      {msg.status === "pending" && "⏳"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-gray-300 flex items-center space-x-4">
        <input
          type="text"
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
        />
        <button
          onClick={handleSendMessage}
          className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
