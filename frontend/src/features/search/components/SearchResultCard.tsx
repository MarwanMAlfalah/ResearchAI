import { Button, MetadataGrid, Pill, SectionCard } from "../../../components/ui";
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

function concepts(result: SearchPaperResult): string[] {
  return result.concepts
    .map((concept) => concept.name?.trim() ?? "")
    .filter((name) => name.length > 0)
    .slice(0, 6);
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
  const conceptList = concepts(result);

  return (
    <SectionCard
      className="overflow-hidden"
      action={
        <Button
          variant={imported ? "success" : "primary"}
          onClick={() => (openalexId ? onImport(openalexId) : Promise.resolve())}
          disabled={disableImport}
        >
          {importing ? "Importing..." : imported ? "Imported" : "Import record"}
        </Button>
      }
      contentClassName="grid gap-5"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={imported ? "success" : "accent"}>{imported ? "Imported" : "OpenAlex result"}</Pill>
            <span className="text-xs text-slate-500">ID: {openalexId ?? "Unavailable"}</span>
          </div>

          <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
            {result.title ?? "Untitled paper"}
          </h3>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            {result.abstract?.trim() || "No abstract preview available for this record."}
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Import readiness</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            {openalexId
              ? "This record has a stable OpenAlex identifier and can be imported into the ResearchGraph knowledge base."
              : "This record is missing a usable OpenAlex identifier, so import is currently unavailable."}
          </p>
        </div>
      </div>

      <MetadataGrid
        items={[
          { label: "Publication Year", value: result.publication_year ?? "N/A" },
          { label: "Cited By", value: formatCount(result.cited_by_count) },
          { label: "Authors", value: authorsText(result) },
        ]}
      />

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Concepts</p>
        {conceptList.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {conceptList.map((concept) => (
              <Pill key={`${openalexId ?? result.title}-${concept}`} tone="info" className="normal-case tracking-[0.04em]">
                {concept}
              </Pill>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No concept metadata available for this record.</p>
        )}
      </div>

      {importError ? (
        <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {importError}
        </div>
      ) : null}
    </SectionCard>
  );
}
