import { Suspense, lazy, useEffect, useMemo, useState } from "react";

import { Button, Pill } from "../components/ui";
import { cn } from "../lib/cn";
import ProfilePage from "../pages/ProfilePage";

const RecommendationsPage = lazy(() => import("../pages/RecommendationsPage"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const GraphExplorerPage = lazy(() => import("../pages/GraphExplorerPage"));
const SkillGapPage = lazy(() => import("../pages/SkillGapPage"));
const AdvisorPage = lazy(() => import("../pages/AdvisorPage"));

type AppPage = "profile" | "search" | "recommendations" | "graph-explorer" | "skill-gap" | "advisor";

type PageConfig = {
  id: AppPage;
  label: string;
  summary: string;
};

const PAGES: PageConfig[] = [
  {
    id: "profile",
    label: "Profile",
    summary: "Manage the researcher context that powers every downstream workflow.",
  },
  {
    id: "recommendations",
    label: "Recommendations",
    summary: "Review ranked papers with explanation signals and supporting evidence.",
  },
  {
    id: "search",
    label: "Search & Import",
    summary: "Find OpenAlex records and bring strong candidates into the graph.",
  },
  {
    id: "graph-explorer",
    label: "Graph Explorer",
    summary: "Inspect the connected research graph with filters and node-level details.",
  },
  {
    id: "skill-gap",
    label: "Skill Gap",
    summary: "Compare current strengths with the skills the system suggests learning next.",
  },
  {
    id: "advisor",
    label: "Advisor",
    summary: "Ask focused product questions grounded in the active research context.",
  },
];

export default function App(): JSX.Element {
  const [activePage, setActivePage] = useState<AppPage>("profile");
  const [activeUserId, setActiveUserId] = useState<string>("user_001");
  const [activeUserDraft, setActiveUserDraft] = useState<string>("user_001");

  useEffect(() => {
    setActiveUserDraft(activeUserId);
  }, [activeUserId]);

  const activePageConfig = useMemo(
    () => PAGES.find((page) => page.id === activePage) ?? PAGES[0],
    [activePage]
  );

  function applyActiveUserId(): void {
    const next = activeUserDraft.trim();
    if (!next) {
      return;
    }
    setActiveUserId(next);
  }

  function renderActivePage(): JSX.Element {
    if (activePage === "profile") {
      return (
        <ProfilePage
          initialUserId={activeUserId}
          onUserIdReady={setActiveUserId}
          onNavigateToRecommendations={() => setActivePage("recommendations")}
        />
      );
    }

    if (activePage === "recommendations") {
      return <RecommendationsPage initialUserId={activeUserId} onUserIdChange={setActiveUserId} />;
    }

    if (activePage === "search") {
      return <SearchPage activeUserId={activeUserId} />;
    }

    if (activePage === "graph-explorer") {
      return <GraphExplorerPage initialUserId={activeUserId} onUserIdChange={setActiveUserId} />;
    }

    if (activePage === "skill-gap") {
      return <SkillGapPage initialUserId={activeUserId} onUserIdChange={setActiveUserId} />;
    }

    return <AdvisorPage initialUserId={activeUserId} onUserIdChange={setActiveUserId} />;
  }

  return (
    <div className="workspace-shell">
      <nav className="workspace-nav">
        <div className="workspace-container py-2.5">
          <div className="rounded-[24px] border border-white/80 bg-white/95 px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.07)] sm:px-5">
            <div className="flex flex-wrap items-center gap-3 xl:grid xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-sm">
                  RG
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-semibold tracking-tight text-slate-950">ResearchGraph AI</p>
                    <Pill tone="muted">Research Workspace</Pill>
                  </div>
                </div>
              </div>

              <div className="order-3 w-full xl:order-none xl:w-auto">
                <div className="flex flex-wrap gap-2 xl:justify-center">
                  {PAGES.map((page) => {
                    const isActive = page.id === activePage;

                    return (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => setActivePage(page.id)}
                        className={cn(
                          "btn-nav min-h-10 border px-3.5 py-2 text-left whitespace-nowrap",
                          isActive
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950"
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {page.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="ml-auto flex min-w-0 items-center gap-2 rounded-[20px] border border-slate-200 bg-slate-50 px-2.5 py-2 xl:ml-0">
                <div className="min-w-0 border-r border-slate-200 pr-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Active User</p>
                  <p className="truncate text-sm font-semibold text-slate-950">{activeUserId}</p>
                </div>
                <input
                  className="input-control h-10 min-w-0 flex-1 bg-white px-3 py-2 sm:w-[150px]"
                  value={activeUserDraft}
                  onChange={(event) => setActiveUserDraft(event.target.value)}
                  placeholder="user_001"
                />
                <Button onClick={applyActiveUserId} className="min-h-10 px-3.5 py-2 text-sm">
                  Apply
                </Button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-2">
              <p className="min-w-0 text-xs leading-5 text-slate-500">{activePageConfig.summary}</p>
              <Pill tone="accent">{activePageConfig.label}</Pill>
            </div>
          </div>
        </div>
      </nav>

      <Suspense fallback={<PageLoadingFallback label={activePageConfig.label} />}>{renderActivePage()}</Suspense>
    </div>
  );
}

type PageLoadingFallbackProps = {
  label: string;
};

function PageLoadingFallback({ label }: PageLoadingFallbackProps): JSX.Element {
  return (
    <main className="app-shell">
      <section className="app-container">
        <section className="surface-panel px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Loading Page</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{label}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Preparing the workspace and loading the page bundle for this feature.
              </p>
            </div>
            <Pill tone="accent">Lazy loading</Pill>
          </div>
        </section>
      </section>
    </main>
  );
}
