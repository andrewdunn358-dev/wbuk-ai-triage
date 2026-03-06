import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Lock, 
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle
} from "lucide-react";
import { startChat, sendMessage, getChatHistory, verifySession } from "@/lib/api";
import { toast } from "sonner";

// WBUK Logo Component
const WBUKLogo = ({ className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="flex flex-col leading-none">
      <span className="font-heading font-extrabold text-lg tracking-tight text-black">WB</span>
      <span className="font-heading font-extrabold text-lg tracking-tight text-black">UK</span>
    </div>
    <div className="hidden sm:block">
      <span className="font-heading font-bold text-sm text-black">AI Triage</span>
    </div>
  </div>
);

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
        await verifySession(sessionToken);
        
        const history = await getChatHistory(sessionToken);
        if (history.messages && history.messages.length > 0) {
          setMessages(history.messages);
        } else {
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
    return content.split("\n").map((line, i) => {
      line = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center rounded-none border-t-4 border-wbuk-red">
          <AlertCircle className="h-12 w-12 text-wbuk-red mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Session Expired</h2>
          <p className="text-gray-600 mb-6">
            Your session has expired or is invalid. Please start a new confidential session.
          </p>
          <Button 
            onClick={() => navigate("/")} 
            className="bg-wbuk-red hover:bg-red-700 rounded-none"
            data-testid="new-session-button"
          >
            Start New Session
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white border-b-4 border-wbuk-red">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              className="hover:bg-gray-100"
              data-testid="back-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <WBUKLogo />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-wbuk-red bg-red-50 px-3 py-1.5 rounded-none border border-wbuk-red">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Confidential</span>
            </div>
            {messages.length >= 4 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewSummary}
                className="rounded-none border-wbuk-red text-wbuk-red hover:bg-red-50"
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
      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col bg-gray-50">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 pb-4">
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
                      ? "bg-wbuk-red text-white rounded-lg rounded-br-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-lg rounded-bl-none shadow-sm"
                  }`}
                >
                  <div className="text-sm md:text-base leading-relaxed">
                    {formatMessage(message.content)}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start message-animate">
                <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="typing-dot w-2 h-2 bg-wbuk-red rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-wbuk-red rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-wbuk-red rounded-full" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Press Enter to send)"
                className="min-h-[60px] max-h-[200px] resize-none rounded-none border-gray-300 focus:border-wbuk-red focus:ring-wbuk-red"
                disabled={isLoading}
                data-testid="chat-input"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-wbuk-red hover:bg-red-700 rounded-none px-6"
                data-testid="send-message-button"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This conversation is confidential and encrypted. No IP addresses are logged.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
