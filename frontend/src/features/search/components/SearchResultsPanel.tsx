import { getOpenAlexId } from "../api/searchApi";
import type { SearchPaperResult } from "../types/search";
import SearchResultCard from "./SearchResultCard";

type ImportStatus = {
  state: "idle" | "importing" | "imported" | "error";
  message?: string;
};

type SearchResultsPanelProps = {
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  results: SearchPaperResult[];
  importStateById: Record<string, ImportStatus>;
  onImport: (openalexId: string) => Promise<void>;
};

export default function SearchResultsPanel({
  loading,
  error,
  hasSearched,
  results,
  importStateById,
  onImport,
}: SearchResultsPanelProps): JSX.Element {
  if (loading) {
    return (
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Searching papers...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-rose-700">{error}</p>
      </section>
    );
  }

  if (hasSearched && results.length === 0) {
    return (
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">No papers matched your query.</p>
      </section>
    );
  }

  if (!hasSearched) {
    return (
      <section className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6">
        <p className="text-sm text-slate-600">Run a search to view papers and import them into the graph.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 grid gap-4">
      {results.map((result, index) => {
        const openalexId = getOpenAlexId(result);
        const key = openalexId ?? `${result.title ?? "paper"}-${index}`;
        const importStatus = openalexId ? importStateById[openalexId] : undefined;

        return (
          <SearchResultCard
            key={key}
            result={result}
            openalexId={openalexId}
            importing={importStatus?.state === "importing"}
            imported={importStatus?.state === "imported"}
            importError={importStatus?.state === "error" ? importStatus.message ?? "Import failed." : null}
            onImport={onImport}
          />
        );
      })}
    </section>
  );
}
