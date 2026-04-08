import { FormEvent, useMemo, useState } from "react";

import { getOpenAlexId, importPaperByOpenAlexId, searchPapers } from "../features/search/api/searchApi";
import SearchResultsPanel from "../features/search/components/SearchResultsPanel";
import type { SearchPaperResult } from "../features/search/types/search";

const DEFAULT_QUERY = "knowledge graph recommender systems";
const DEFAULT_LIMIT = 10;

type ImportStatus = {
  state: "idle" | "importing" | "imported" | "error";
  message?: string;
};

type SearchPageProps = {
  activeUserId?: string;
};

export default function SearchPage({ activeUserId }: SearchPageProps): JSX.Element {
  const [query, setQuery] = useState<string>(DEFAULT_QUERY);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [results, setResults] = useState<SearchPaperResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [importStateById, setImportStateById] = useState<Record<string, ImportStatus>>({});

  const resultCount = useMemo(() => results.length, [results.length]);

  async function handleSearch(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      setError("Please enter at least 2 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchPapers(cleanQuery, limit);
      setResults(data);
      setHasSearched(true);

      const nextImportState: Record<string, ImportStatus> = {};
      data.forEach((result) => {
        const openalexId = getOpenAlexId(result);
        if (openalexId && importStateById[openalexId]?.state === "imported") {
          nextImportState[openalexId] = importStateById[openalexId];
        }
      });
      setImportStateById(nextImportState);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to search papers.";
      setError(message);
      setResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(openalexId: string): Promise<void> {
    setImportStateById((prev) => ({
      ...prev,
      [openalexId]: { state: "importing" },
    }));

    try {
      await importPaperByOpenAlexId(openalexId);
      setImportStateById((prev) => ({
        ...prev,
        [openalexId]: { state: "imported" },
      }));
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Import failed.";
      setImportStateById((prev) => ({
        ...prev,
        [openalexId]: { state: "error", message },
      }));
    }
  }

  return (
    <main className="app-shell">
      <section className="app-container">
        <header className="page-header">
          <h1 className="page-title">Search and Import</h1>
          <p className="page-subtitle">
            Discover papers from OpenAlex and import selected records directly into the ResearchGraph knowledge graph.
          </p>
          {activeUserId ? (
            <p className="page-caption">
              Active user context: <span className="font-semibold text-slate-700">{activeUserId}</span>
            </p>
          ) : null}
        </header>

        <form className="form-card sm:grid-cols-[1fr_140px_auto]" onSubmit={handleSearch}>
          <label className="field">
            <span className="field-label">Search Query</span>
            <input
              className="input-control"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find papers by topic, method, or keyword"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Limit</span>
            <input
              type="number"
              min={1}
              max={50}
              className="input-control"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary h-fit self-end"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <div className="mt-3 text-xs text-slate-500">
          Results: <span className="font-semibold text-slate-700">{hasSearched ? resultCount : 0}</span>
        </div>

        <SearchResultsPanel
          loading={loading}
          error={error}
          hasSearched={hasSearched}
          results={results}
          importStateById={importStateById}
          onImport={handleImport}
        />
      </section>
    </main>
  );
}
