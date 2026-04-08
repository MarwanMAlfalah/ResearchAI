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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Profile Status</h2>

      {statusMessage ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {statusMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      {!profile ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-600">
          Load or save a profile to view persisted details.
        </p>
      ) : (
        <dl className="mt-4 grid gap-2 text-sm text-slate-700">
          <SummaryItem label="User ID" value={profile.user_id} />
          <SummaryItem label="Name" value={profile.name} />
          <SummaryItem label="Skills" value={profile.skills.length > 0 ? profile.skills.join(", ") : "None"} />
          <SummaryItem label="Embedding Model" value={profile.embedding_model ?? "N/A"} />
          <SummaryItem label="Created" value={formatDate(profile.created_at)} />
          <SummaryItem label="Updated" value={formatDate(profile.updated_at)} />
        </dl>
      )}
    </section>
  );
}

type SummaryItemProps = {
  label: string;
  value: string;
};

function SummaryItem({ label, value }: SummaryItemProps): JSX.Element {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
