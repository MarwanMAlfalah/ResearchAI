export type NormalizedAuthor = {
  name: string | null;
  openalex_id: string | null;
  orcid: string | null;
};

export type NormalizedConcept = {
  name: string | null;
  openalex_id: string | null;
  score: number | null;
};

export type SearchPaperResult = {
  title: string | null;
  abstract: string | null;
  authors: NormalizedAuthor[];
  publication_year: number | null;
  cited_by_count: number | null;
  concepts: NormalizedConcept[];
  ids: Record<string, string | null>;
};

export type ImportPaperCounts = {
  paper_id: string;
  authors_merged: number;
  topics_merged: number;
  author_ids: string[];
  topic_names: string[];
};

export type ImportPaperResponse = {
  status: string;
  openalex_id: string;
  imported: ImportPaperCounts;
};
