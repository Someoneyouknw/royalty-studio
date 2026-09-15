"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, MessageCircle } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/client";
import type { Message, SiteSettings } from "@/types/database";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "royalty_chat_conversation";

type StoredConversation = { id: string; name: string };

function readStored(): StoredConversation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredConversation) : null;
  } catch {
    return null;
  }
}

export function ChatWidget({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<StoredConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [draft, setDraft] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const supabase = getBrowserClient();
  const wa = buildWhatsappLink(settings.whatsapp, settings.whatsapp_default_message);

  // Restore an existing conversation on mount.
  useEffect(() => {
    setConversation(readStored());
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
    );
  }, []);

  // Ensure the visitor has an (anonymous) auth session so RLS can scope rows.
  const ensureSession = useCallback(async (): Promise<string | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return user.id;
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) return null;
    return data.user.id;
  }, [supabase]);

  // Load history + subscribe to realtime updates for the active conversation.
  useEffect(() => {
    if (!conversation) return;
    let active = true;

    (async () => {
      await ensureSession();
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });
      if (active && data) {
        setMessages(data);
        scrollToBottom();
      }
      // Mark admin replies as read on the client side.
      await supabase
        .from("conversations")
        .update({ client_unread: 0 })
        .eq("id", conversation.id);
    })();

    const channel = supabase
      .channel(`chat:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
          scrollToBottom();
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [conversation, supabase, ensureSession, scrollToBottom]);

  async function startConversation(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !draft.trim()) return;
    setStarting(true);
    try {
      const uid = await ensureSession();
      if (!uid) {
        setError(
          "Live chat is unavailable right now. Please reach us on WhatsApp or the contact form.",
        );
        setStarting(false);
        return;
      }
      const isEmail = contact.includes("@");
      const { data: convo, error: convoErr } = await supabase
        .from("conversations")
        .insert({
          visitor_id: uid,
          visitor_name: name.trim(),
          visitor_email: isEmail ? contact.trim() : null,
          visitor_phone: !isEmail && contact.trim() ? contact.trim() : null,
          status: "open",
        })
        .select("id")
        .single();
      if (convoErr || !convo) throw convoErr ?? new Error("no conversation");

      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: convo.id,
        sender_type: "client",
        sender_id: uid,
        message: draft.trim(),
      });
      if (msgErr) throw msgErr;

      const stored = { id: convo.id, name: name.trim() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      } catch {
        /* ignore storage errors */
      }
      setDraft("");
      setConversation(stored);
    } catch {
      setError("We couldn't start the chat. Please try WhatsApp or the contact form.");
    } finally {
      setStarting(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!conversation || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    const uid = await ensureSession();
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_type: "client",
      sender_id: uid,
      message: text,
    });
    if (error) {
      setError("Message failed to send. Please try again.");
      setDraft(text);
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-4 z-40 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all duration-300 sm:right-5",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
        style={{ height: "min(32rem, calc(100dvh - 8rem))" }}
        role="dialog"
        aria-label="Chat with Royalty Studio"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center gap-3 bg-ink px-4 py-3 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{settings.studio_name}</p>
            <p className="text-xs text-white/60">Typically replies within a few hours</p>
          </div>
        </div>

        {/* Body */}
        {!conversation ? (
          <form onSubmit={startConversation} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Hi! Welcome to {settings.studio_name}. How can we help you today?
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="chat-name">Your name</Label>
              <Input
                id="chat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="chat-contact">Email or phone</Label>
              <Input
                id="chat-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="chat-message">Message</Label>
              <Textarea
                id="chat-message"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="I'd like to ask about…"
                className="min-h-[72px]"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" loading={starting} className="w-full">
              Start chat
            </Button>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[#128C7E] hover:underline"
              >
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp instead
              </a>
            )}
          </form>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
              <div className="rounded-lg bg-background p-3 text-sm text-muted-foreground shadow-sm">
                Thanks {conversation.name}! Your message has been received. Replies
                from our team will appear right here.
              </div>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col",
                    m.sender_type === "client" ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                      m.sender_type === "client"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-background text-foreground shadow-sm",
                    )}
                  >
                    {m.message}
                  </div>
                  <span className="mt-1 px-1 text-[10px] text-muted-foreground">
                    {timeAgo(m.created_at)}
                  </span>
                </div>
              ))}
              {error && <p className="text-center text-sm text-destructive">{error}</p>}
              <div ref={bottomRef} />
            </div>
            <form
              onSubmit={sendMessage}
              className="flex items-center gap-2 border-t border-border bg-background p-3"
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                aria-label="Message"
              />
              <Button type="submit" size="icon" aria-label="Send" disabled={!draft.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
