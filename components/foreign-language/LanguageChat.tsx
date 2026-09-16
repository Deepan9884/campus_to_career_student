import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageSquare, Bot } from "lucide-react";
import { LanguageChatMessage, sendLanguageChat } from "@/lib/foreign-language-api";
import { GlassCard } from "@/components/GlassCard";

interface LanguageChatProps {
  language: string;
  history: LanguageChatMessage[];
  onMessageSent: (message: LanguageChatMessage) => void;
  activeMaterialCount: number;
}

export function LanguageChat({ language, history, onMessageSent, activeMaterialCount }: LanguageChatProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    
    if (activeMaterialCount === 0) {
      alert("Please activate at least one study material in the vault to chat.");
      return;
    }

    const userMsg = input.trim();
    setInput("");
    setIsSending(true);

    // Optimistically add user message
    onMessageSent({ role: "user", content: userMsg, timestamp: new Date().toISOString() });

    try {
      const res = await sendLanguageChat(language, userMsg);
      onMessageSent({ role: "assistant", content: res.response, timestamp: new Date().toISOString() });
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <GlassCard className="flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/20 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">{language} Study Buddy</h2>
          <p className="text-xs text-muted-foreground">
            {activeMaterialCount} active material(s) linked
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 opacity-50">
            <MessageSquare className="w-12 h-12" />
            <p>Ask a question about your {language} study materials!</p>
          </div>
        ) : (
          history.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted/50 border rounded-tl-sm prose prose-sm dark:prose-invert"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-muted/50 border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-muted/10">
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about grammar, vocabulary, or concepts..."
            className="w-full glass-input rounded-full pl-4 pr-12 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            disabled={isSending || activeMaterialCount === 0}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending || activeMaterialCount === 0}
            className="absolute right-2 p-2 rounded-full text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
