import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

function App() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  // Fetch conversations on mount
  useEffect(() => {
    // Replace with your real API call
    fetch("/api/conversations")
      .then(res => res.json())
      .then(data => setConversations(data))
      .catch(console.error);
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
      />

      {/* Chat Window */}
      {activeChat ? (
        <ChatWindow conversation={activeChat} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a chat to start messaging
        </div>
      )}
    </div>
  );
}

export default App;
