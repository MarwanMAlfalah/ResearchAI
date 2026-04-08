import { useMemo, useState } from "react";

import { getUserProfile, saveUserProfile } from "../features/profile/api/profileApi";
import ProfileForm from "../features/profile/components/ProfileForm";
import ProfileSummary from "../features/profile/components/ProfileSummary";
import type { UserProfileResponse, UserProfileUpsertRequest } from "../features/profile/types/profile";

type ProfilePageProps = {
  initialUserId?: string;
  onUserIdReady?: (userId: string) => void;
  onNavigateToRecommendations?: () => void;
};

const DEFAULT_FORM: UserProfileUpsertRequest = {
  user_id: "user_001",
  name: "",
  interests_text: "",
  skills: [],
};

type EditableProfileField = "user_id" | "name" | "interests_text";

function parseSkillsInput(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item, index, all) => item.length > 0 && all.indexOf(item) === index);
}

function profileToForm(profile: UserProfileResponse): UserProfileUpsertRequest {
  return {
    user_id: profile.user_id,
    name: profile.name,
    interests_text: profile.interests_text,
    skills: profile.skills,
  };
}

export default function ProfilePage({
  initialUserId,
  onUserIdReady,
  onNavigateToRecommendations,
}: ProfilePageProps): JSX.Element {
  const [form, setForm] = useState<UserProfileUpsertRequest>({
    ...DEFAULT_FORM,
    user_id: initialUserId ?? DEFAULT_FORM.user_id,
  });
  const [skillsInput, setSkillsInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [savedProfile, setSavedProfile] = useState<UserProfileResponse | null>(null);

  const canNavigate = useMemo(
    () => Boolean(savedProfile?.user_id && onNavigateToRecommendations),
    [savedProfile?.user_id, onNavigateToRecommendations]
  );

  function handleChange(field: EditableProfileField, value: string): void {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function setFormFromProfile(profile: UserProfileResponse): void {
    setForm(profileToForm(profile));
    setSkillsInput(profile.skills.join(", "));
    setSavedProfile(profile);
    onUserIdReady?.(profile.user_id);
  }

  async function handleLoad(): Promise<void> {
    if (form.user_id.trim().length === 0) {
      setErrorMessage("Please provide a user ID before loading a profile.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const profile = await getUserProfile(form.user_id.trim());
      setFormFromProfile(profile);
      setStatusMessage(`Loaded profile for ${profile.user_id}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load profile.";
      setErrorMessage(message);
      setSavedProfile(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(): Promise<void> {
    const payload: UserProfileUpsertRequest = {
      user_id: form.user_id.trim(),
      name: form.name.trim(),
      interests_text: form.interests_text.trim(),
      skills: parseSkillsInput(skillsInput),
    };

    if (payload.user_id.length === 0 || payload.name.length === 0) {
      setErrorMessage("User ID and name are required.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const profile = await saveUserProfile(payload);
      setFormFromProfile(profile);
      setStatusMessage(`Saved profile for ${profile.user_id}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save profile.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Profile Setup</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Manage user profile metadata and skills before generating recommendations.
          </p>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <ProfileForm
            form={form}
            skillsInput={skillsInput}
            loading={loading}
            onChange={handleChange}
            onSkillsInputChange={setSkillsInput}
            onLoad={handleLoad}
            onSave={handleSave}
          />

          <ProfileSummary profile={savedProfile} statusMessage={statusMessage} errorMessage={errorMessage} />
        </div>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Next Action</h2>
          <p className="mt-1 text-sm text-slate-600">
            After saving a profile, continue to recommendations and use the same user ID.
          </p>
          <button
            type="button"
            onClick={onNavigateToRecommendations}
            disabled={!canNavigate}
            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Go to Recommendations
          </button>
        </section>
      </section>
    </main>
  );
}
