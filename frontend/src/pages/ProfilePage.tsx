import { useEffect, useMemo, useState } from "react";

import { ActionBar, Button, PageHeader, Pill, SectionCard, StatCard } from "../components/ui";
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

  useEffect(() => {
    if (!initialUserId) {
      return;
    }
    setForm((prev) => (prev.user_id === initialUserId ? prev : { ...prev, user_id: initialUserId }));
  }, [initialUserId]);

  function handleChange(field: EditableProfileField, value: string): void {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field === "user_id") {
      onUserIdReady?.(value.trim());
    }
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
    <main className="app-shell">
      <section className="app-container">
        <PageHeader
          eyebrow="Research Context"
          title="Profile workspace"
          description="Manage the researcher identity, interests, and skills that power recommendations, skill analysis, graph exploration, and advisor responses."
          meta={
            <>
              <span>Global user context stays in sync from this page.</span>
              <Pill tone={savedProfile ? "success" : "muted"}>{savedProfile ? "Profile saved" : "Draft mode"}</Pill>
            </>
          }
          stats={
            <>
              <StatCard label="Active User" value={form.user_id || "Unassigned"} hint="Shared across the workspace." />
              <StatCard
                label="Skills Listed"
                value={parseSkillsInput(skillsInput).length}
                hint="Comma-separated skills used by downstream analysis."
                tone="accent"
              />
              <StatCard
                label="Status"
                value={savedProfile ? "Connected" : "Needs Save"}
                hint={savedProfile ? "Persisted profile loaded successfully." : "Load or save to confirm persisted state."}
                tone={savedProfile ? "success" : "warning"}
              />
            </>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
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

        <ActionBar>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-950">Ready for the next step</p>
            <p className="text-sm leading-6 text-slate-600">
              Once the profile is saved, move directly into recommendation review with the same active researcher context.
            </p>
          </div>
          <Button onClick={onNavigateToRecommendations} disabled={!canNavigate} className="sm:min-w-[220px]">
            Go to recommendations
          </Button>
        </ActionBar>

        <SectionCard
          eyebrow="Why This Matters"
          title="Profile quality drives the rest of the workspace"
          description="A clear research profile improves retrieval relevance, makes graph exploration easier to interpret, and gives the advisor better grounding."
          tone="subtle"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <StatCard label="Recommendations" value="Better ranking" hint="Skills and interests sharpen semantic relevance." />
            <StatCard label="Skill Gap" value="Clearer gaps" hint="The system compares strengths against evidence-backed next skills." />
            <StatCard label="Advisor" value="More grounded" hint="Assistant answers stay aligned with the active researcher context." />
          </div>
        </SectionCard>
      </section>
    </main>
  );
}
