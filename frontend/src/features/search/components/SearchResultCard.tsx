import type { SearchPaperResult } from "../types/search";

type SearchResultCardProps = {
  result: SearchPaperResult;
  openalexId: string | null;
  importing: boolean;
  imported: boolean;
  importError: string | null;
  onImport: (openalexId: string) => Promise<void>;
};

function formatCount(value: number | null): string {
  return value === null ? "N/A" : value.toLocaleString();
}

function authorsText(result: SearchPaperResult): string {
  const names = result.authors
    .map((author) => author.name?.trim() ?? "")
    .filter((name) => name.length > 0)
    .slice(0, 6);

  return names.length > 0 ? names.join(", ") : "N/A";
}

function conceptsText(result: SearchPaperResult): string {
  const topics = result.concepts
    .map((concept) => concept.name?.trim() ?? "")
    .filter((name) => name.length > 0)
    .slice(0, 5);

  return topics.length > 0 ? topics.join(", ") : "N/A";
}

export default function SearchResultCard({
  result,
  openalexId,
  importing,
  imported,
  importError,
  onImport,
}: SearchResultCardProps): JSX.Element {
  const disableImport = imported || importing || !openalexId;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{result.title ?? "Untitled Paper"}</h3>
          <p className="mt-1 text-xs text-slate-500">OpenAlex ID: {openalexId ?? "Unavailable"}</p>
        </div>

        <button
          type="button"
          disabled={disableImport}
          onClick={() => (openalexId ? onImport(openalexId) : Promise.resolve())}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
            imported ? "bg-emerald-100 text-emerald-700" : "bg-slate-900 text-white hover:bg-slate-700"
          }`}
        >
          {importing ? "Importing..." : imported ? "Imported" : "Import"}
        </button>
      </header>

      <section className="mt-4 grid gap-2 sm:grid-cols-2">
        <MetadataItem label="Publication Year" value={result.publication_year ?? "N/A"} />
        <MetadataItem label="Cited By" value={formatCount(result.cited_by_count)} />
        <MetadataItem label="Authors" value={authorsText(result)} />
        <MetadataItem label="Concepts" value={conceptsText(result)} />
      </section>

      {importError ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{importError}</p>
      ) : null}
    </article>
  );
}

type MetadataItemProps = {
  label: string;
  value: string | number;
};

function MetadataItem({ label, value }: MetadataItemProps): JSX.Element {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value}</p>
    </div>
  );
}
