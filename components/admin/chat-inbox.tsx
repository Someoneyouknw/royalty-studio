"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Send,
  ArrowLeft,
  MessagesSquare,
  Mail,
  Phone,
  CheckCheck,
  RotateCcw,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import type { Conversation, Message } from "@/types/database";
import { getBrowserClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/fetcher";
import { cn, timeAgo, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTitle } from "@/components/admin/page-title";

export function ChatInbox({ initial }: { initial: Conversation[] }) {
  const supabase = getBrowserClient();
  const [conversations, setConversations] = useState<Conversation[]>(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const refreshConversations = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .order("last_message_at", { ascending: false, nullsFirst: false });
    if (data) setConversations(data);
  }, [supabase]);

  // Realtime: any conversation change refreshes the list.
  useEffect(() => {
    const channel = supabase
      .channel("admin:conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => refreshConversations(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refreshConversations]);

  // Load + subscribe to the active conversation's messages.
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      if (active && data) {
        setMessages(data);
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView());
      }
      // Mark admin-read.
      await apiFetch(`/api/conversations/${activeId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "mark_read" }),
      }).catch(() => {});
    })();

    const channel = supabase
      .channel(`admin:messages:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
          requestAnimationFrame(() =>
            bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [activeId, supabase]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    setSending(true);
    try {
      await apiFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({ conversation_id: activeId, message: text }),
      });
    } catch {
      toast.error("Could not send message.");
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  async function convoAction(action: "close" | "reopen") {
    if (!activeId) return;
    await apiFetch(`/api/conversations/${activeId}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }).catch(() => toast.error("Action failed"));
    refreshConversations();
  }

  async function deleteConvo() {
    if (!activeId) return;
    if (!confirm("Delete this conversation and all its messages?")) return;
    await apiFetch(`/api/conversations/${activeId}`, { method: "DELETE" }).catch(() =>
      toast.error("Could not delete"),
    );
    setActiveId(null);
    refreshConversations();
  }

  const filtered = conversations.filter((c) => {
    if (unreadOnly && c.admin_unread === 0) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.visitor_name.toLowerCase().includes(q) ||
        (c.visitor_email ?? "").toLowerCase().includes(q) ||
        (c.visitor_phone ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <PageTitle title="Messages" description="Chat with website visitors in real time." />

      <div className="grid h-[calc(100dvh-13rem)] grid-cols-1 overflow-hidden rounded-xl border border-border bg-card md:grid-cols-[320px_1fr]">
        {/* List */}
        <div
          className={cn(
            "flex flex-col border-r border-border",
            activeId && "hidden md:flex",
          )}
        >
          <div className="space-y-2 border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations…" className="pl-9" />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
              Unread only
            </label>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={MessagesSquare} title="No conversations yet" className="py-8" />
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    activeId === c.id && "bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{c.visitor_name}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {c.last_message_at ? timeAgo(c.last_message_at) : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {c.visitor_email || c.visitor_phone || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      {c.status === "closed" && <Badge variant="neutral">Closed</Badge>}
                      {c.admin_unread > 0 && <Badge>{c.admin_unread}</Badge>}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className={cn("flex flex-col", !activeId && "hidden md:flex")}>
          {!active ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState icon={MessagesSquare} title="Select a conversation" description="Choose a conversation from the list to view and reply." />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border p-3">
                <button className="md:hidden" onClick={() => setActiveId(null)} aria-label="Back">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{active.visitor_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[active.visitor_email, active.visitor_phone].filter(Boolean).join(" · ") || "No contact details"}
                  </p>
                </div>
                {active.visitor_phone && (
                  <a href={`tel:${active.visitor_phone}`} className="rounded-md p-2 text-muted-foreground hover:text-foreground" aria-label="Call">
                    <Phone className="h-4 w-4" />
                  </a>
                )}
                {active.visitor_email && (
                  <a href={`mailto:${active.visitor_email}`} className="rounded-md p-2 text-muted-foreground hover:text-foreground" aria-label="Email">
                    <Mail className="h-4 w-4" />
                  </a>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-md p-2 text-muted-foreground hover:text-foreground" aria-label="Options">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {active.status === "open" ? (
                      <DropdownMenuItem onClick={() => convoAction("close")}>
                        <CheckCheck className="h-4 w-4" /> Mark closed
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => convoAction("reopen")}>
                        <RotateCcw className="h-4 w-4" /> Reopen
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem destructive onClick={deleteConvo}>
                      <Trash2 className="h-4 w-4" /> Delete conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex flex-col", m.sender_type === "admin" ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                        m.sender_type === "admin"
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-background text-foreground shadow-sm",
                      )}
                    >
                      {m.message}
                    </div>
                    <span className="mt-1 px-1 text-[10px] text-muted-foreground">
                      {formatDate(m.created_at, { hour: "numeric", minute: "2-digit" } as Intl.DateTimeFormatOptions)}
                    </span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type your reply…" />
                <Button type="submit" size="icon" loading={sending} disabled={!draft.trim()} aria-label="Send">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
