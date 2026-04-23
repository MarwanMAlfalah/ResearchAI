import { EmptyState, MetadataGrid, Pill, SectionCard, StatusPanel } from "../../../components/ui";
import type { UserProfileResponse } from "../types/profile";

type ProfileSummaryProps = {
  profile: UserProfileResponse | null;
  statusMessage: string | null;
  errorMessage: string | null;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

export default function ProfileSummary({
  profile,
  statusMessage,
  errorMessage,
}: ProfileSummaryProps): JSX.Element {
  return (
    <SectionCard
      eyebrow="Snapshot"
      title="Profile status"
      description="Persisted profile details stay visible here so you can validate the context before moving into recommendations."
      contentClassName="grid gap-4"
    >
      {statusMessage ? (
        <StatusPanel tone="success" title="Saved state">
          {statusMessage}
        </StatusPanel>
      ) : null}

      {errorMessage ? (
        <StatusPanel tone="error" title="Action needed">
          {errorMessage}
        </StatusPanel>
      ) : null}

      {!profile ? (
        <EmptyState
          title="No persisted profile yet"
          description="Load an existing researcher or save this form to see the stored profile, metadata, and sync status."
        />
      ) : (
        <div className="grid gap-4">
          <MetadataGrid
            items={[
              { label: "User ID", value: profile.user_id },
              { label: "Name", value: profile.name },
              { label: "Embedding Model", value: profile.embedding_model ?? "N/A" },
              { label: "Created", value: formatDate(profile.created_at) },
              { label: "Updated", value: formatDate(profile.updated_at) },
            ]}
          />

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Skills</p>
            {profile.skills.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Pill key={skill} tone="accent" className="normal-case tracking-normal">
                    {skill}
                  </Pill>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No skills have been attached to this profile yet.</p>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
