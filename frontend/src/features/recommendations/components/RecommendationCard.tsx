import { MetadataGrid, Pill, SectionCard } from "../../../components/ui";
import type { ExplainedRecommendation, StrengthBucket } from "../types/recommendation";

type RecommendationCardProps = {
  recommendation: ExplainedRecommendation;
  rank: number;
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

function bucketTone(bucket: StrengthBucket): "success" | "warning" | "muted" {
  if (bucket === "high") {
    return "success";
  }

  if (bucket === "medium") {
    return "warning";
  }

  return "muted";
}

export default function RecommendationCard({ recommendation, rank }: RecommendationCardProps): JSX.Element {
  const evidence = recommendation.evidence;

  return (
    <SectionCard
      className="overflow-hidden"
      contentClassName="grid gap-6"
      action={<Pill tone="accent">Rank #{rank}</Pill>}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Recommended paper</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              {recommendation.title ?? "Untitled paper"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">Paper ID: {recommendation.paper_id}</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Why it fits</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">{recommendation.explanation_text}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Top signals</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {recommendation.top_contributing_signals.map((signal) => (
                <Pill key={`${recommendation.paper_id}-${signal}`} tone="info" className="normal-case tracking-[0.04em]">
                  {formatSignalName(signal)}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-5 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Final score</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight">{formatScore(recommendation.final_score)}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">Composite score from semantic similarity, graph centrality, and recency.</p>

          <div className="mt-5 grid gap-3">
            <ScoreBar label="Semantic" value={recommendation.semantic_similarity} />
            <ScoreBar label="Centrality" value={recommendation.graph_centrality} />
            <ScoreBar label="Recency" value={recommendation.recency} />
          </div>
        </div>
      </div>

      <MetadataGrid
        items={[
          { label: "Publication Year", value: evidence.publication_year ?? "N/A" },
          { label: "Cited By Count", value: evidence.cited_by_count ?? "N/A" },
          { label: "Centrality Source", value: evidence.centrality_source },
          { label: "Embedding Model", value: evidence.embedding_model ?? "N/A" },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <Pill tone={bucketTone(evidence.semantic_strength_bucket)} className="normal-case tracking-[0.04em]">
          Semantic: {evidence.semantic_strength_bucket}
        </Pill>
        <Pill tone={bucketTone(evidence.centrality_strength_bucket)} className="normal-case tracking-[0.04em]">
          Centrality: {evidence.centrality_strength_bucket}
        </Pill>
        <Pill tone={bucketTone(evidence.recency_strength_bucket)} className="normal-case tracking-[0.04em]">
          Recency: {evidence.recency_strength_bucket}
        </Pill>
      </div>
    </SectionCard>
  );
}

type ScoreBarProps = {
  label: string;
  value: number;
};

function ScoreBar({ label, value }: ScoreBarProps): JSX.Element {
  const progress = Math.max(6, Math.min(100, Math.round(value * 100)));

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</p>
        <p className="text-sm font-semibold text-white">{formatScore(value)}</p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-sky-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
