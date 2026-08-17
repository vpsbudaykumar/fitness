"use client";

import { useState } from "react";
import {
  ArrowUp,
  Bot,
  Dumbbell,
  Lightbulb,
  MessageCircle,
  Sparkles,
  User,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

type Message = {
  role: "user" | "assistant";
  message: string;
};

const suggestions = [
  {
    icon: Dumbbell,
    title: "Modify today&apos;s workout",
    text: "Make today&apos;s workout easier",
  },
  {
    icon: Lightbulb,
    title: "Exercise alternative",
    text: "Suggest an alternative exercise",
  },
  {
    icon: MessageCircle,
    title: "Understand my plan",
    text: "Why is this workout structured this way?",
  },
];

export default function Coach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [id, setId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send(messageOverride?: string) {
    const user = (messageOverride ?? text).trim();

    if (!user || loading) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        role: "user",
        message: user,
      },
    ]);

    setText("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: user,
          conversationId: id,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof data.error === "string"
            ? data.error
            : "Could not send message."
        );
      }

      setId(data.conversationId);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          message: data.message,
        },
      ]);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not send message."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      void send();
    }
  }

  return (
    <AppShell>
      <main className="pb-28">
        <div className="mx-auto max-w-4xl">
          {/* Header */}

          <section className="home-greeting">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7657F6]/10">
                <Sparkles
                  size={22}
                  className="text-[#7657F6]"
                />
              </div>

              <div>
                <p className="eyebrow text-[#7657F6]">
                  Training support
                </p>

                <h1 className="page-title mt-1">
                  Coach
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#66727F]">
                  Ask for workout adjustments, exercise
                  alternatives, or help understanding
                  your training plan.
                </p>
              </div>
            </div>
          </section>

          {/* Chat */}

          <section className="mt-7 overflow-hidden rounded-3xl border border-[#E7ECEA] bg-white shadow-sm">
            {/* Chat header */}

            <div className="flex items-center gap-3 border-b border-[#EDF1EF] px-5 py-4 sm:px-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#08A6A6]/10">
                <Bot
                  size={19}
                  className="text-[#08A6A6]"
                />
              </div>

              <div>
                <p className="text-sm font-bold text-[#17212B]">
                  FORM//COACH
                </p>

                <p className="text-xs text-[#9AA5AF]">
                  Training assistant
                </p>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#08A6A6]" />

                <span className="hidden text-xs font-medium text-[#66727F] sm:block">
                  Ready
                </span>
              </div>
            </div>

            {/* Messages */}

            <div className="min-h-[420px] space-y-4 bg-[#FBFCFC] p-4 sm:p-6">
              {messages.length === 0 ? (
                <div className="flex min-h-[350px] flex-col items-center justify-center px-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7657F6]/10">
                    <Bot
                      size={28}
                      className="text-[#7657F6]"
                    />
                  </div>

                  <h2 className="mt-5 font-[Space_Grotesk] text-xl font-bold text-[#17212B]">
                    What can I help with?
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-[#7B8792]">
                    Tell me how you&apos;re feeling,
                    what you want to change, or what
                    you don&apos;t understand about
                    today&apos;s training.
                  </p>

                  <div className="mt-7 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                    {suggestions.map(
                      ({
                        icon: Icon,
                        title,
                        text: suggestion,
                      }) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() =>
                            void send(
                              suggestion
                            )
                          }
                          className="group rounded-2xl border border-[#E7ECEA] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#7657F6]/30 hover:shadow-sm"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7657F6]/8">
                            <Icon
                              size={17}
                              className="text-[#7657F6]"
                            />
                          </div>

                          <p className="mt-3 text-xs font-bold text-[#17212B]">
                            {title}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#89939D]">
                            {suggestion}
                          </p>
                        </button>
                      )
                    )}
                  </div>

                  <p className="mt-6 max-w-md text-[11px] leading-5 text-[#A0A9B1]">
                    Your coach keeps safety-related
                    responses separate from normal
                    workout adjustments.
                  </p>
                </div>
              ) : (
                <>
                  {messages.map(
                    (message, index) => {
                      const isUser =
                        message.role === "user";

                      return (
                        <div
                          key={`${message.role}-${index}`}
                          className={`flex gap-3 ${
                            isUser
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {!isUser && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#7657F6]/10">
                              <Bot
                                size={15}
                                className="text-[#7657F6]"
                              />
                            </div>
                          )}

                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                              isUser
                                ? "rounded-br-md bg-[#08A6A6] text-white"
                                : "rounded-bl-md border border-[#E7ECEA] bg-white text-[#34414D]"
                            }`}
                          >
                            <p
                              className={`mb-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                                isUser
                                  ? "text-white/65"
                                  : "text-[#7657F6]"
                              }`}
                            >
                              {isUser
                                ? "You"
                                : "Coach"}
                            </p>

                            <p className="whitespace-pre-wrap">
                              {message.message}
                            </p>
                          </div>

                          {isUser && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#08A6A6]/10">
                              <User
                                size={15}
                                className="text-[#08A6A6]"
                              />
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}

                  {loading && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7657F6]/10">
                        <Bot
                          size={15}
                          className="text-[#7657F6]"
                        />
                      </div>

                      <div className="rounded-2xl rounded-bl-md border border-[#E7ECEA] bg-white px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7657F6]" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7657F6] [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7657F6] [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Error */}

            {error && (
              <div className="border-t border-[#FF735C]/15 bg-[#FF735C]/5 px-4 py-3 text-sm text-[#D9513D] sm:px-6">
                {error}
              </div>
            )}

            {/* Input */}

            <div className="border-t border-[#EDF1EF] bg-white p-3 sm:p-4">
              <div className="flex items-center gap-2 rounded-2xl border border-[#DDE5E1] bg-[#F8FAF9] p-1.5 transition focus-within:border-[#08A6A6]/50 focus-within:ring-4 focus-within:ring-[#08A6A6]/5">
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-[#17212B] outline-none placeholder:text-[#9AA5AF]"
                  value={text}
                  onChange={(e) =>
                    setText(e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your workout..."
                  maxLength={2000}
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={
                    loading || !text.trim()
                  }
                  aria-label="Send message"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#08A6A6] text-white transition hover:bg-[#078F8F] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp
                    size={19}
                    strokeWidth={2.2}
                  />
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between px-2">
                <p className="text-[10px] text-[#A0A9B1]">
                  Press Enter to send
                </p>

                <p className="text-[10px] text-[#A0A9B1]">
                  {text.length}/2000
                </p>
              </div>
            </div>
          </section>

          {/* Safety */}

          <section className="mt-5 rounded-2xl border border-[#F1A74B]/15 bg-[#FFF9EE] px-4 py-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F1A74B]/10">
                <Lightbulb
                  size={15}
                  className="text-[#D68A21]"
                />
              </div>

              <div>
                <p className="text-xs font-bold text-[#6D572F]">
                  Training guidance
                </p>

                <p className="mt-1 text-xs leading-5 text-[#8B7958]">
                  Use the coach for training guidance
                  and workout adjustments. Stop an
                  exercise if something causes pain or
                  feels unsafe.
                </p>
              </div>
            </div>
          </section>

          <div className="pb-8 pt-8 text-center">
            <p className="text-xs text-[#A4AEA9]">
              FORM//COACH · Your training assistant
            </p>
          </div>
        </div>
      </main>
    </AppShell>
  );
}