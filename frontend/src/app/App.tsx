import { useState } from "react";

import ProfilePage from "../pages/ProfilePage";
import RecommendationsPage from "../pages/RecommendationsPage";

type AppPage = "profile" | "recommendations";

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
        </div>
      </nav>

      {activePage === "profile" ? (
        <ProfilePage
          initialUserId={activeUserId}
          onUserIdReady={setActiveUserId}
          onNavigateToRecommendations={() => setActivePage("recommendations")}
        />
      ) : (
        <RecommendationsPage initialUserId={activeUserId} onUserIdChange={setActiveUserId} />
      )}
    </div>
  );
}
