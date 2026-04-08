import { useEffect, useState } from "react";

import AdvisorPage from "../pages/AdvisorPage";
import GraphExplorerPage from "../pages/GraphExplorerPage";
import ProfilePage from "../pages/ProfilePage";
import RecommendationsPage from "../pages/RecommendationsPage";
import SearchPage from "../pages/SearchPage";
import SkillGapPage from "../pages/SkillGapPage";

type AppPage = "profile" | "search" | "recommendations" | "graph-explorer" | "skill-gap" | "advisor";

export default function App(): JSX.Element {
  const [activePage, setActivePage] = useState<AppPage>("profile");
  const [activeUserId, setActiveUserId] = useState<string>("user_001");
  const [activeUserDraft, setActiveUserDraft] = useState<string>("user_001");

  useEffect(() => {
    setActiveUserDraft(activeUserId);
  }, [activeUserId]);

  function applyActiveUserId(): void {
    const next = activeUserDraft.trim();
    if (!next) {
      return;
    }
    setActiveUserId(next);
  }

  return (
    <div>
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActivePage("profile")}
              className={`btn-nav ${
                activePage === "profile" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setActivePage("recommendations")}
              className={`btn-nav ${
                activePage === "recommendations"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Recommendations
            </button>
            <button
              type="button"
              onClick={() => setActivePage("search")}
              className={`btn-nav ${
                activePage === "search" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setActivePage("graph-explorer")}
              className={`btn-nav ${
                activePage === "graph-explorer"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Graph Explorer
            </button>
            <button
              type="button"
              onClick={() => setActivePage("skill-gap")}
              className={`btn-nav ${
                activePage === "skill-gap" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Skill Gap
            </button>
            <button
              type="button"
              onClick={() => setActivePage("advisor")}
              className={`btn-nav ${
                activePage === "advisor" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Advisor
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Active User</span>
            <input
              className="input-control w-32 px-2 py-1"
              value={activeUserDraft}
              onChange={(event) => setActiveUserDraft(event.target.value)}
              placeholder="user_001"
            />
            <button
              type="button"
              onClick={applyActiveUserId}
              className="btn-primary px-2.5 py-1 text-xs"
            >
              Apply
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-5xl border-t border-slate-100 px-4 pb-3 pt-2 text-xs text-slate-500 sm:px-8">
          Current context: <span className="font-semibold text-slate-700">{activeUserId}</span>. User-aware pages are
          prefilled automatically.
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
