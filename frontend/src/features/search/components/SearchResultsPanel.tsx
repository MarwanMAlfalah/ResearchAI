import { EmptyState, StatusPanel } from "../../../components/ui";
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
      <StatusPanel tone="loading" title="Searching OpenAlex">
        Retrieving candidate papers and preparing import-ready metadata.
      </StatusPanel>
    );
  }

  if (error) {
    return (
      <StatusPanel tone="error" title="Search failed">
        {error}
      </StatusPanel>
    );
  }

  if (hasSearched && results.length === 0) {
    return (
      <EmptyState
        title="No papers matched this query"
        description="Try broadening the topic, using a different method keyword, or increasing the result limit."
      />
    );
  }

  if (!hasSearched) {
    return (
      <EmptyState
        title="No search run yet"
        description="Run a search to review external paper records and import strong candidates into the graph."
      />
    );
  }

  return (
    <section className="grid gap-5">
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
