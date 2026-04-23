import { FormEvent, useMemo, useState } from "react";

import { ActionBar, Button, FormField, PageHeader, Pill, StatCard } from "../components/ui";
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
  const importedCount = useMemo(
    () => Object.values(importStateById).filter((item) => item.state === "imported").length,
    [importStateById]
  );

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
        <PageHeader
          eyebrow="Acquisition"
          title="Search and import"
          description="Find papers from OpenAlex, inspect structured metadata, and import promising records directly into the ResearchGraph product flow."
          meta={
            <>
              {activeUserId ? <span>Active user context: {activeUserId}</span> : <span>Search works without an active user, but imports enrich the shared graph.</span>}
              <Pill tone={hasSearched ? "success" : "muted"}>{hasSearched ? "Search complete" : "Awaiting query"}</Pill>
            </>
          }
          stats={
            <>
              <StatCard label="Result Count" value={hasSearched ? resultCount : 0} hint="Records returned by the latest search." />
              <StatCard label="Imported" value={importedCount} hint="Results already moved into the graph." tone="success" />
              <StatCard label="Limit" value={limit} hint="Maximum records requested from OpenAlex." tone="accent" />
            </>
          }
        />

        <form onSubmit={handleSearch}>
          <ActionBar>
            <div className="grid flex-1 gap-4 sm:grid-cols-[minmax(0,1fr)_170px]">
              <FormField label="Search Query" hint="Search by topic, method, or domain language researchers would recognize.">
                <input
                  className="input-control"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find papers by topic, method, or keyword"
                  required
                />
              </FormField>

              <FormField label="Limit" hint="Up to 50 records per search.">
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="input-control"
                  value={limit}
                  onChange={(event) => setLimit(Number(event.target.value))}
                  required
                />
              </FormField>
            </div>

            <Button type="submit" disabled={loading} className="sm:min-w-[180px]">
              {loading ? "Searching..." : "Search records"}
            </Button>
          </ActionBar>
        </form>

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
