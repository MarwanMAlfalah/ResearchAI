import { useEffect, useMemo, useState } from "react";

import { Button, Pill } from "../components/ui";
import { cn } from "../lib/cn";
import AdvisorPage from "../pages/AdvisorPage";
import GraphExplorerPage from "../pages/GraphExplorerPage";
import ProfilePage from "../pages/ProfilePage";
import RecommendationsPage from "../pages/RecommendationsPage";
import SearchPage from "../pages/SearchPage";
import SkillGapPage from "../pages/SkillGapPage";

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

  return (
    <div className="workspace-shell">
      <nav className="workspace-nav">
        <div className="workspace-container py-4">
          <div className="surface-panel overflow-hidden px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-sm">
                    RG
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold tracking-tight text-slate-950">ResearchGraph AI</p>
                      <Pill tone="muted">Research Workspace</Pill>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{activePageConfig.summary}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px] xl:min-w-[760px]">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-2">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {PAGES.map((page) => {
                      const isActive = page.id === activePage;

                      return (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => setActivePage(page.id)}
                          className={cn(
                            "btn-nav whitespace-nowrap",
                            isActive
                              ? "bg-slate-950 text-white shadow-sm"
                              : "bg-transparent text-slate-600 hover:bg-white hover:text-slate-950"
                          )}
                        >
                          {page.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Active User</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">{activeUserId}</p>
                    </div>
                    <Pill tone="accent">{activePageConfig.label}</Pill>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      className="input-control min-w-0 flex-1"
                      value={activeUserDraft}
                      onChange={(event) => setActiveUserDraft(event.target.value)}
                      placeholder="user_001"
                    />
                    <Button onClick={applyActiveUserId} className="sm:min-w-[92px]">
                      Apply
                    </Button>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Context-aware pages automatically use this researcher ID so you can move through the workspace without re-entering it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {activePage === "profile" ? (
        <ProfilePage
          initialUserId={activeUserId}
          onUserIdReady={setActiveUserId}
          onNavigateToRecommendations={() => setActivePage("recommendations")}
        />
      ) : activePage === "recommendations" ? (
        <RecommendationsPage initialUserId={activeUserId} onUserIdChange={setActiveUserId} />
      ) : activePage === "search" ? (
        <SearchPage activeUserId={activeUserId} />
      ) : activePage === "graph-explorer" ? (
        <GraphExplorerPage initialUserId={activeUserId} onUserIdChange={setActiveUserId} />
      ) : activePage === "skill-gap" ? (
        <SkillGapPage initialUserId={activeUserId} onUserIdChange={setActiveUserId} />
      ) : (
        <AdvisorPage initialUserId={activeUserId} onUserIdChange={setActiveUserId} />
      )}
    </div>
  );
}
