import type { UserProfileUpsertRequest } from "../types/profile";

type EditableProfileField = "user_id" | "name" | "interests_text";

type ProfileFormProps = {
  form: UserProfileUpsertRequest;
  skillsInput: string;
  loading: boolean;
  onChange: (field: EditableProfileField, value: string) => void;
  onSkillsInputChange: (value: string) => void;
  onLoad: () => Promise<void>;
  onSave: () => Promise<void>;
};

export default function ProfileForm({
  form,
  skillsInput,
  loading,
  onChange,
  onSkillsInputChange,
  onLoad,
  onSave,
}: ProfileFormProps): JSX.Element {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">User Profile</h2>
      <p className="mt-1 text-sm text-slate-600">
        Create or update a user profile that powers downstream recommendation scoring.
      </p>

      <div className="mt-5 grid gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">User ID</span>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={form.user_id}
            onChange={(event) => onChange("user_id", event.target.value)}
            placeholder="e.g. user_001"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Name</span>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="Full name"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Interests</span>
          <textarea
            className="min-h-[120px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={form.interests_text}
            onChange={(event) => onChange("interests_text", event.target.value)}
            placeholder="Research interests, topics, and methods..."
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Skills (comma-separated)</span>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={skillsInput}
            onChange={(event) => onSkillsInputChange(event.target.value)}
            placeholder="Python, Graph ML, NLP"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onLoad}
          disabled={loading || form.user_id.trim().length === 0}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Loading..." : "Load Profile"}
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={loading || form.user_id.trim().length === 0 || form.name.trim().length === 0}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save / Update Profile"}
        </button>
      </div>
    </section>
  );
}
