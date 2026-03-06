import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ShieldCheck, 
  Send, 
  Lock, 
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle
} from "lucide-react";
import { startChat, sendMessage, getChatHistory, verifySession } from "@/lib/api";
import { toast } from "sonner";

export default function ChatPage() {
  const navigate = useNavigate();
  const { sessionToken } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionValid, setSessionValid] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      if (!sessionToken) {
        navigate("/");
        return;
      }

      try {
        // Verify session
        await verifySession(sessionToken);
        
        // Try to get existing history
        const history = await getChatHistory(sessionToken);
        if (history.messages && history.messages.length > 0) {
          setMessages(history.messages);
        } else {
          // Start new chat
          const welcomeMessage = await startChat(sessionToken);
          if (welcomeMessage && welcomeMessage.content) {
            setMessages([welcomeMessage]);
          }
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        if (error.response?.status === 404 || error.response?.status === 401) {
          setSessionValid(false);
          toast.error("Session expired or invalid. Please start a new session.");
        }
      }
    };

    initializeChat();
  }, [sessionToken, navigate]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      message_id: `temp-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await sendMessage(sessionToken, userMessage.content);
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
      // Remove the temporary user message on error
      setMessages((prev) => prev.filter((m) => m.message_id !== userMessage.message_id));
      setInputValue(userMessage.content);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleViewSummary = () => {
    navigate(`/summary/${sessionToken}`);
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content.split("\n").map((line, i) => {
      // Bold
      line = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      // Bullet points
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="ml-4" dangerouslySetInnerHTML={{ __html: line.substring(2) }} />
        );
      }
      return (
        <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: line }} />
      );
    });
  };

  if (!sessionValid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-2">Session Expired</h2>
          <p className="text-slate-600 mb-6">
            Your session has expired or is invalid. Please start a new confidential session.
          </p>
          <Button onClick={() => navigate("/")} data-testid="new-session-button">
            Start New Session
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              data-testid="back-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-teal-700" />
              <span className="font-serif font-bold text-slate-900">Confidential Triage</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Encrypted</span>
            </div>
            {messages.length >= 4 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewSummary}
                data-testid="view-summary-button"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Summary
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 pb-4">
            {messages.map((message, index) => (
              <div
                key={message.message_id || index}
                className={`flex message-animate ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] px-5 py-4 ${
                    message.role === "user"
                      ? "chat-bubble-user"
                      : "chat-bubble-assistant"
                  }`}
                >
                  <div className="markdown-content text-sm md:text-base leading-relaxed">
                    {formatMessage(message.content)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start message-animate">
                <div className="chat-bubble-assistant px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="min-h-[60px] max-h-[200px] resize-none"
                disabled={isLoading}
                data-testid="chat-input"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-teal-600 hover:bg-teal-700 px-6"
                data-testid="send-message-button"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              This conversation is confidential and encrypted. No IP addresses are logged.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
