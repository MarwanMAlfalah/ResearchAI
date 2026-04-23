import { Button, FormField, SectionCard } from "../../../components/ui";
import Pill from "../../../components/ui/Pill";
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

function skillCount(value: string): number {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;
}

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
    <SectionCard
      eyebrow="Profile"
      title="Researcher profile"
      description="Create or update the core user profile that recommendation, advisor, and skill-gap flows all read from."
      action={<Pill tone="info">{loading ? "Syncing" : "Ready"}</Pill>}
      contentClassName="grid gap-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="User ID" hint="This stays aligned with the global app context.">
          <input
            className="input-control"
            value={form.user_id}
            onChange={(event) => onChange("user_id", event.target.value)}
            placeholder="e.g. user_001"
            required
          />
        </FormField>

        <FormField label="Name" hint="Use the researcher name you want to display across the workspace.">
          <input
            className="input-control"
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="Full name"
            required
          />
        </FormField>
      </div>

      <FormField
        label="Interests"
        hint="Add research interests, problem areas, and methods so recommendations feel grounded and specific."
      >
        <textarea
          className="textarea-control min-h-[150px]"
          value={form.interests_text}
          onChange={(event) => onChange("interests_text", event.target.value)}
          placeholder="Research interests, topics, methods, preferred subfields..."
        />
      </FormField>

      <FormField
        label="Skills"
        hint={`Comma-separated skill inventory. ${skillCount(skillsInput)} skill${skillCount(skillsInput) === 1 ? "" : "s"} detected.`}
      >
        <input
          className="input-control"
          value={skillsInput}
          onChange={(event) => onSkillsInputChange(event.target.value)}
          placeholder="Python, Graph ML, NLP"
        />
      </FormField>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => void onLoad()}
          disabled={loading || form.user_id.trim().length === 0}
        >
          {loading ? "Loading..." : "Load profile"}
        </Button>

        <Button
          onClick={() => void onSave()}
          disabled={loading || form.user_id.trim().length === 0 || form.name.trim().length === 0}
        >
          {loading ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </SectionCard>
  );
}
