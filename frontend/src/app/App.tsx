import { useEffect, useState } from "react";

import ProfilePage from "../pages/ProfilePage";
import RecommendationsPage from "../pages/RecommendationsPage";
import SearchPage from "../pages/SearchPage";
import SkillGapPage from "../pages/SkillGapPage";

type AppPage = "profile" | "recommendations" | "search" | "skill-gap";

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
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activePage === "profile" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setActivePage("recommendations")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
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
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activePage === "search" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setActivePage("skill-gap")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activePage === "skill-gap" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Skill Gap
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Active User</span>
            <input
              className="w-32 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={activeUserDraft}
              onChange={(event) => setActiveUserDraft(event.target.value)}
              placeholder="user_001"
            />
            <button
              type="button"
              onClick={applyActiveUserId}
              className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-slate-700"
            >
              Apply
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-3 text-xs text-slate-500 sm:px-8">
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
      ) : (
        <SkillGapPage initialUserId={activeUserId} onUserIdChange={setActiveUserId} />
      )}
    </div>
  );
}
