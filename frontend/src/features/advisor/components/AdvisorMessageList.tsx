import { EmptyState, Pill, SectionCard } from "../../../components/ui";
import type { AdvisorMessage } from "../types/advisor";
import AdvisorSupportingItems from "./AdvisorSupportingItems";

type AdvisorMessageListProps = {
  messages: AdvisorMessage[];
};

function formatIntent(intent: string): string {
  return intent
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdvisorMessageList({ messages }: AdvisorMessageListProps): JSX.Element {
  if (messages.length === 0) {
    return (
      <EmptyState
        title="No conversation yet"
        description="Ask the advisor a focused question to get guidance grounded in the current research profile, recommendations, and graph context."
      />
    );
  }

  return (
    <SectionCard
      eyebrow="Conversation"
      title="Advisor thread"
      description="Messages stay grounded in deterministic backend analysis rather than a generic chatbot flow."
    >
      <div className="grid gap-4">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <article
              key={message.id}
              className={`max-w-4xl rounded-[26px] border px-5 py-4 shadow-sm ${
                isUser
                  ? "ml-auto border-slate-900 bg-slate-950 text-white"
                  : "mr-auto border-slate-200 bg-white text-slate-800"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Pill tone={isUser ? "muted" : "accent"}>{isUser ? "You" : "Advisor"}</Pill>
                  <span className={`text-xs ${isUser ? "text-slate-300" : "text-slate-500"}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                {message.detectedIntent ? (
                  <Pill tone="default" className="normal-case tracking-[0.04em]">
                    {formatIntent(message.detectedIntent)}
                  </Pill>
                ) : null}
              </div>

              <p className={`mt-3 text-sm leading-7 ${isUser ? "text-white" : "text-slate-700"}`}>{message.text}</p>

              {!isUser && message.supportingItems && message.supportingItems.length > 0 ? (
                <AdvisorSupportingItems items={message.supportingItems} />
              ) : null}
            </article>
          );
        })}
      </div>
    </SectionCard>
  );
}
