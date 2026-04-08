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
      <section className="state-panel state-panel-loading mt-6">
        <p className="text-sm text-slate-600">Searching papers...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="state-panel state-panel-error mt-6">
        <p className="text-sm font-medium text-rose-700">{error}</p>
      </section>
    );
  }

  if (hasSearched && results.length === 0) {
    return (
      <section className="state-panel state-panel-empty mt-6 border-slate-200">
        <p className="text-sm text-slate-600">No papers matched your query.</p>
      </section>
    );
  }

  if (!hasSearched) {
    return (
      <section className="state-panel state-panel-empty mt-6 border-dashed">
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
