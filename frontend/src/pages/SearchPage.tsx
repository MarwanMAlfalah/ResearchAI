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

export default function SearchPage(): JSX.Element {
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
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Search and Import</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Discover papers from OpenAlex and import selected records directly into the ResearchGraph knowledge graph.
          </p>
        </header>

        <form
          className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_140px_auto]"
          onSubmit={handleSearch}
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Search Query</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find papers by topic, method, or keyword"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Limit</span>
            <input
              type="number"
              min={1}
              max={50}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-fit self-end rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <div className="mt-3 text-xs text-slate-500">Results: {hasSearched ? resultCount : 0}</div>

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
