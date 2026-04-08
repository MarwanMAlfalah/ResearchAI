import { useState } from "react";

import ProfilePage from "../pages/ProfilePage";
import RecommendationsPage from "../pages/RecommendationsPage";
import SearchPage from "../pages/SearchPage";
import SkillGapPage from "../pages/SkillGapPage";

type AppPage = "profile" | "recommendations" | "search" | "skill-gap";

export default function App(): JSX.Element {
  const [activePage, setActivePage] = useState<AppPage>("profile");
  const [activeUserId, setActiveUserId] = useState<string>("user_001");

  return (
    <div>
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-8">
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
        <SearchPage />
      ) : (
        <SkillGapPage initialUserId={activeUserId} onUserIdChange={setActiveUserId} />
      )}
    </div>
  );
}
