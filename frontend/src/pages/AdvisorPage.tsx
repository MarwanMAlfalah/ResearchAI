import { FormEvent, useEffect, useState } from "react";

import { sendAdvisorChat } from "../features/advisor/api/advisorApi";
import AdvisorMessageList from "../features/advisor/components/AdvisorMessageList";
import type { AdvisorMessage } from "../features/advisor/types/advisor";

type AdvisorPageProps = {
  initialUserId?: string;
  onUserIdChange?: (userId: string) => void;
};

const DEFAULT_USER_ID = "user_001";

const QUICK_PROMPTS = [
  "Explain my recommendations",
  "What should I learn next?",
  "Which paper should I start with first?",
  "Summarize my profile",
];

export default function AdvisorPage({ initialUserId, onUserIdChange }: AdvisorPageProps): JSX.Element {
  const [userId, setUserId] = useState<string>(initialUserId ?? DEFAULT_USER_ID);
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialUserId) {
      return;
    }
    setUserId((prev) => (prev === initialUserId ? prev : initialUserId));
  }, [initialUserId]);

  function handleUserIdChange(value: string): void {
    setUserId(value);
    onUserIdChange?.(value);
  }

  function appendUserMessage(text: string): void {
    const next: AdvisorMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, next]);
  }

  function appendAdvisorMessage(params: {
    text: string;
    detectedIntent: string;
    supportingItems: AdvisorMessage["supportingItems"];
  }): void {
    const next: AdvisorMessage = {
      id: `advisor-${Date.now()}`,
      role: "advisor",
      text: params.text,
      detectedIntent: params.detectedIntent,
      supportingItems: params.supportingItems,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, next]);
  }

  async function handleSend(messageText: string): Promise<void> {
    const cleanUserId = userId.trim();
    const cleanMessage = messageText.trim();

    if (!cleanUserId) {
      setError("Please provide a user ID before sending a question.");
      return;
    }

    if (!cleanMessage) {
      return;
    }

    setError(null);
    setLoading(true);
    appendUserMessage(cleanMessage);

    try {
      const response = await sendAdvisorChat({
        user_id: cleanUserId,
        message: cleanMessage,
      });

      appendAdvisorMessage({
        text: response.answer,
        detectedIntent: response.detected_intent,
        supportingItems: response.supporting_items,
      });

      onUserIdChange?.(cleanUserId);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Advisor request failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const messageText = input;
    setInput("");
    await handleSend(messageText);
  }

  async function handleQuickPrompt(prompt: string): Promise<void> {
    await handleSend(prompt);
  }

  return (
    <main className="app-shell">
      <section className="app-container">
        <header className="page-header">
          <h1 className="page-title">Advisor</h1>
          <p className="page-subtitle">
            Ask focused questions about your profile, recommendations, and skill direction using deterministic backend analysis.
          </p>
          <p className="page-caption">Uses `/api/v1/advisor/chat` with your active research context.</p>
        </header>

        <section className="form-card sm:grid-cols-[220px_1fr]">
          <label className="field">
            <span className="field-label">User ID</span>
            <input
              className="input-control"
              value={userId}
              onChange={(event) => handleUserIdChange(event.target.value)}
              placeholder="user_001"
              required
            />
          </label>

          <div className="field">
            <span className="field-label">Quick Prompts</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void handleQuickPrompt(prompt)}
                  disabled={loading}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error ? (
          <section className="state-panel state-panel-error mt-6">
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </section>
        ) : null}

        {loading ? (
          <section className="state-panel state-panel-loading mt-6">
            <p className="text-sm text-slate-600">Advisor is preparing a response...</p>
          </section>
        ) : null}

        <AdvisorMessageList messages={messages} />

        <form className="form-card mt-6 sm:grid-cols-[1fr_auto]" onSubmit={(event) => void onSubmit(event)}>
          <label className="field">
            <span className="field-label">Message</span>
            <textarea
              className="textarea-control min-h-[90px]"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about recommendations, skill direction, or where to start..."
              disabled={loading}
              required
            />
          </label>

          <button type="submit" disabled={loading || input.trim().length === 0} className="btn-primary h-fit self-end">
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </main>
  );
}
