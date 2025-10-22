import { useState, useEffect, useRef } from "react";
import "@/App.css";
import { MessageSquare, Users, ArrowRight, SkipForward, LogOut, Send, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AdminDashboard from "@/components/AdminDashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

function App() {
  const [screen, setScreen] = useState("landing"); // landing, matching, chatting, admin
  const [username, setUsername] = useState("");
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [partnerUsername, setPartnerUsername] = useState("");
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    const websocket = new WebSocket(`${WS_URL}/api/ws/${userId}?username=${encodeURIComponent(username)}`);

    websocket.onopen = () => {
      console.log("WebSocket Connected");
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "matched") {
        setPartnerUsername(data.partner_username);
        setSessionId(data.session_id);
        setScreen("chatting");
        setMessages([]);
        toast.success(`Connected with ${data.partner_username}!`);
      } else if (data.type === "message") {
        setMessages(prev => [...prev, {
          username: data.username,
          message: data.message,
          timestamp: data.timestamp,
          isMe: false
        }]);
        setIsPartnerTyping(false);
      } else if (data.type === "typing") {
        setIsPartnerTyping(data.is_typing);
      } else if (data.type === "partner_disconnected") {
        toast.info("Partner disconnected");
        setScreen("matching");
        setMessages([]);
        setPartnerUsername("");
        // Auto find new match
        setTimeout(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ type: "find_match" }));
          }
        }, 500);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast.error("Connection error. Please refresh.");
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setWs(null);
    };
  };

  const handleStartChat = () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    setScreen("matching");
    connectWebSocket();
  };

  useEffect(() => {
    if (ws && screen === "matching") {
      ws.send(JSON.stringify({ type: "find_match" }));
    }
  }, [ws, screen]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !ws) return;

    const messageData = {
      username: username,
      message: inputMessage,
      timestamp: new Date().toISOString(),
      isMe: true
    };

    setMessages(prev => [...prev, messageData]);
    ws.send(JSON.stringify({ type: "message", message: inputMessage }));
    setInputMessage("");
    
    // Stop typing indicator
    ws.send(JSON.stringify({ type: "typing", is_typing: false }));
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    if (ws) {
      // Send typing indicator
      ws.send(JSON.stringify({ type: "typing", is_typing: true }));
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        ws.send(JSON.stringify({ type: "typing", is_typing: false }));
      }, 1000);
    }
  };

  const handleSkip = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: "skip" }));
      setScreen("matching");
      setMessages([]);
      setPartnerUsername("");
      toast.info("Finding new partner...");
    }
  };

  const handleDisconnect = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: "disconnect" }));
      ws.close();
    }
    setScreen("landing");
    setMessages([]);
    setPartnerUsername("");
    setUsername("");
  };

  // Admin Dashboard
  if (screen === "admin") {
    return <AdminDashboard onBack={() => setScreen("landing")} />;
  }

  // Landing Screen
  if (screen === "landing") {
    return (
      <div className="min-h-screen landing-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="glass-card rounded-3xl p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-4 rounded-2xl">
                  <MessageSquare className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="hero-title text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                RandomChat
              </h1>
              <p className="text-lg text-gray-600">
                Connect with random people around the world
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose your username
                </label>
                <Input
                  data-testid="username-input"
                  type="text"
                  placeholder="Enter username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleStartChat()}
                  className="text-lg h-12"
                />
              </div>

              <Button
                data-testid="start-chat-button"
                onClick={handleStartChat}
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
              >
                Start Chatting
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200 space-y-3">
              <div className="flex items-start space-x-3 text-sm text-gray-600">
                <Users className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  No registration required. Just enter a username and start chatting with random strangers instantly!
                </p>
              </div>
              <Button
                data-testid="admin-dashboard-link"
                onClick={() => setScreen("admin")}
                variant="ghost"
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Matching Screen
  if (screen === "matching") {
    return (
      <div className="min-h-screen matching-bg flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                <Users className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-ping opacity-20"></div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Finding a match...</h2>
            <p className="text-lg text-gray-600">Connecting you with someone new</p>
          </div>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>
          <Button
            data-testid="cancel-matching-button"
            onClick={handleDisconnect}
            variant="outline"
            className="mt-4"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Chat Screen
  return (
    <div className="min-h-screen chat-bg flex flex-col">
      {/* Header */}
      <div className="glass-header border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{partnerUsername.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800" data-testid="partner-username">{partnerUsername}</h3>
              {isPartnerTyping && (
                <p className="text-xs text-gray-500" data-testid="typing-indicator">typing...</p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              data-testid="skip-button"
              onClick={handleSkip}
              variant="outline"
              size="sm"
              className="rounded-xl"
            >
              <SkipForward className="w-4 h-4 mr-1" />
              Skip
            </Button>
            <Button
              data-testid="disconnect-button"
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
              className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Exit
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <p>Start the conversation! Say hi 👋</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              data-testid={msg.isMe ? "my-message" : "partner-message"}
              className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md space-y-1`}>
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    msg.isMe
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="break-words">{msg.message}</p>
                </div>
                <p className={`text-xs text-gray-500 px-2 ${msg.isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-4xl mx-auto flex space-x-2">
          <Input
            data-testid="message-input"
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 h-12 rounded-xl"
          />
          <Button
            data-testid="send-button"
            onClick={sendMessage}
            className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;