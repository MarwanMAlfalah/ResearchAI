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
    <section className="card-panel">
      <h2 className="text-lg font-semibold text-slate-900">User Profile</h2>
      <p className="mt-1 text-sm text-slate-600">
        Create or update a user profile that powers downstream recommendation scoring.
      </p>

      <div className="mt-5 grid gap-4">
        <label className="field">
          <span className="field-label">User ID</span>
          <input
            className="input-control"
            value={form.user_id}
            onChange={(event) => onChange("user_id", event.target.value)}
            placeholder="e.g. user_001"
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Name</span>
          <input
            className="input-control"
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="Full name"
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Interests</span>
          <textarea
            className="textarea-control"
            value={form.interests_text}
            onChange={(event) => onChange("interests_text", event.target.value)}
            placeholder="Research interests, topics, and methods..."
          />
        </label>

        <label className="field">
          <span className="field-label">Skills (comma-separated)</span>
          <input
            className="input-control"
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
          className="btn-secondary"
        >
          {loading ? "Loading..." : "Load Profile"}
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={loading || form.user_id.trim().length === 0 || form.name.trim().length === 0}
          className="btn-primary"
        >
          {loading ? "Saving..." : "Save / Update Profile"}
        </button>
      </div>
    </section>
  );
}
