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
      <section className="state-panel state-panel-empty mt-6 border-dashed">
        <p className="text-sm text-slate-600">Ask the advisor a focused question to get guidance from your current graph context.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 grid gap-3">
      {messages.map((message) => {
        const isUser = message.role === "user";

        return (
          <article
            key={message.id}
            className={`rounded-xl border p-4 shadow-sm ${
              isUser ? "ml-8 border-slate-200 bg-slate-900 text-white" : "mr-8 border-slate-200 bg-white text-slate-800"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`text-xs font-semibold uppercase tracking-wide ${isUser ? "text-slate-300" : "text-slate-500"}`}>
                {isUser ? "You" : "Advisor"}
              </p>
              {message.detectedIntent ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                  {formatIntent(message.detectedIntent)}
                </span>
              ) : null}
            </div>

            <p className={`mt-2 text-sm leading-relaxed ${isUser ? "text-white" : "text-slate-700"}`}>{message.text}</p>

            {!isUser && message.supportingItems && message.supportingItems.length > 0 ? (
              <AdvisorSupportingItems items={message.supportingItems} />
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
