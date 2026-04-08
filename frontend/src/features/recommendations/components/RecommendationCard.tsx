import type { ExplainedRecommendation } from "../types/recommendation";

type RecommendationCardProps = {
  recommendation: ExplainedRecommendation;
};

function formatScore(value: number): string {
  return value.toFixed(3);
}

function formatSignalName(signal: string): string {
  return signal
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function strengthBadgeClass(strength: string): string {
  if (strength === "high") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (strength === "medium") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-slate-200 text-slate-800";
}

export default function RecommendationCard({ recommendation }: RecommendationCardProps): JSX.Element {
  const evidence = recommendation.evidence;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{recommendation.title ?? "Untitled Paper"}</h3>
          <p className="mt-1 text-xs text-slate-500">Paper ID: {recommendation.paper_id}</p>
        </div>

        <div className="rounded-lg bg-slate-900 px-3 py-2 text-right text-white">
          <p className="text-[10px] uppercase tracking-wide text-slate-300">Final Score</p>
          <p className="text-lg font-semibold">{formatScore(recommendation.final_score)}</p>
        </div>
      </header>

      <section className="mt-4 grid gap-2 sm:grid-cols-3">
        <Metric label="Semantic" value={recommendation.semantic_similarity} />
        <Metric label="Centrality" value={recommendation.graph_centrality} />
        <Metric label="Recency" value={recommendation.recency} />
      </section>

      <section className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Top Signals</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {recommendation.top_contributing_signals.map((signal) => (
            <span
              key={`${recommendation.paper_id}-${signal}`}
              className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
            >
              {formatSignalName(signal)}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Explanation</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{recommendation.explanation_text}</p>
      </section>

      <section className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Evidence</p>
        <dl className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <EvidenceItem label="Publication Year" value={evidence.publication_year ?? "N/A"} />
          <EvidenceItem label="Cited By Count" value={evidence.cited_by_count ?? "N/A"} />
          <EvidenceItem label="Centrality Source" value={evidence.centrality_source} />
          <EvidenceItem label="Embedding Model" value={evidence.embedding_model ?? "N/A"} />
        </dl>

        <div className="mt-3 flex flex-wrap gap-2">
          <StrengthPill label="Semantic" bucket={evidence.semantic_strength_bucket} />
          <StrengthPill label="Centrality" bucket={evidence.centrality_strength_bucket} />
          <StrengthPill label="Recency" bucket={evidence.recency_strength_bucket} />
        </div>
      </section>
    </article>
  );
}

type MetricProps = {
  label: string;
  value: number;
};

function Metric({ label, value }: MetricProps): JSX.Element {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{formatScore(value)}</p>
    </div>
  );
}

type EvidenceItemProps = {
  label: string;
  value: string | number;
};

function EvidenceItem({ label, value }: EvidenceItemProps): JSX.Element {
  return (
    <div className="rounded-md bg-slate-50 px-2 py-1">
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}

type StrengthPillProps = {
  label: string;
  bucket: string;
};

function StrengthPill({ label, bucket }: StrengthPillProps): JSX.Element {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${strengthBadgeClass(bucket)}`}>
      {label}: {bucket}
    </span>
  );
}
