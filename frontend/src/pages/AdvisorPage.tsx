import { FormEvent, useEffect, useState } from "react";

import { ActionBar, Button, FormField, PageHeader, Pill, SectionCard, StatCard, StatusPanel } from "../components/ui";
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
        <PageHeader
          eyebrow="Guidance"
          title="Advisor"
          description="Ask focused product questions about the active researcher profile, recommendations, and skill direction in a clean assistant workspace that stays grounded in backend analysis."
          meta={
            <>
              <span>Uses `/api/v1/advisor/chat` with your active research context.</span>
              <Pill tone={messages.length > 0 ? "success" : "muted"}>{messages.length > 0 ? "Conversation active" : "No messages yet"}</Pill>
            </>
          }
          stats={
            <>
              <StatCard label="User Context" value={userId || "Unassigned"} hint="Current advisor context." />
              <StatCard label="Messages" value={messages.length} hint="Total messages in the current thread." tone="accent" />
              <StatCard label="Status" value={loading ? "Responding" : "Ready"} hint="The assistant stays deterministic and context-aware." tone={loading ? "warning" : "success"} />
            </>
          }
        />

        <ActionBar>
          <FormField label="User ID" hint="The advisor uses this researcher ID to ground answers.">
            <input
              className="input-control"
              value={userId}
              onChange={(event) => handleUserIdChange(event.target.value)}
              placeholder="user_001"
              required
            />
          </FormField>

          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">Quick prompts</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleQuickPrompt(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </ActionBar>

        {error ? (
          <StatusPanel tone="error" title="Advisor request failed">
            {error}
          </StatusPanel>
        ) : null}

        {loading ? (
          <StatusPanel tone="loading" title="Advisor is responding">
            The assistant is preparing a grounded answer from the active research context.
          </StatusPanel>
        ) : null}

        <AdvisorMessageList messages={messages} />

        <SectionCard
          eyebrow="Compose"
          title="Ask a focused question"
          description="Keep prompts practical and specific so the advisor can respond with grounded, trustworthy guidance."
        >
          <form className="grid gap-4 sm:grid-cols-[1fr_auto]" onSubmit={(event) => void onSubmit(event)}>
            <FormField label="Message" hint="Examples: where to start, what to learn next, or how to interpret a recommendation.">
              <textarea
                className="textarea-control min-h-[120px]"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about recommendations, skill direction, or where to start next..."
                disabled={loading}
                required
              />
            </FormField>

            <Button type="submit" disabled={loading || input.trim().length === 0} className="h-fit self-end sm:min-w-[160px]">
              {loading ? "Sending..." : "Send message"}
            </Button>
          </form>
        </SectionCard>
      </section>
    </main>
  );
}
