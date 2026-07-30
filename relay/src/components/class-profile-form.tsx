"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROUTINE_FIELDS = [
  { 
    key: "arrival_registration", 
    label: "Arrival & Registration / Roll Call",
    placeholder: "e.g., Attendance on tablet by 8:45 AM, morning warm-up on the board."
  },
  { 
    key: "bathroom_passes", 
    label: "Bathroom & Hall Pass Policy",
    placeholder: "e.g., One student at a time, sign-out sheet by the door."
  },
  { 
    key: "tech_policy", 
    label: "Device & Tech Policy",
    placeholder: "e.g., Chromebooks for assigned work only. Phones kept in backpacks."
  },
  { 
    key: "materials", 
    label: "Classroom Materials & Storage",
    placeholder: "e.g., Extra pencils in blue bin, turned-in work goes in Tray B."
  },
  { 
    key: "behavior_rewards", 
    label: "Behavior Expectations & Rewards/Consequences",
    placeholder: "e.g., Use the House Points system; issue 1 warning before calling office."
  },
  { 
    key: "reliable_students", 
    label: "Classroom Helpers (2-3 Reliable Students)",
    placeholder: "e.g., Sarah and Liam can help with distributing sheets or tech setup."
  },
  { 
    key: "dismissal", 
    label: "Dismissal Routine",
    placeholder: "e.g., Chairs stacked at 2:50 PM, bus riders leave first."
  }
];

interface SupportProfile {
  studentName: string;
  note: string;
}

export default function ClassProfileForm({
  classId,
  initialRoutines,
  initialSupportProfiles
}: {
  classId: string;
  initialRoutines: Record<string, string>;
  initialSupportProfiles: SupportProfile[];
}) {
  const router = useRouter();
  const [routines, setRoutines] = useState<Record<string, string>>(initialRoutines ?? {});
  const [profiles, setProfiles] = useState<SupportProfile[]>(initialSupportProfiles ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function addProfile() {
    setProfiles([...profiles, { studentName: "", note: "" }]);
  }

  function updateProfile(index: number, field: keyof SupportProfile, value: string) {
    const next = [...profiles];
    next[index] = { ...next[index], [field]: value };
    setProfiles(next);
  }

  function removeProfile(index: number) {
    setProfiles(profiles.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/classes/${classId}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classroomRoutines: routines, studentSupportProfiles: profiles })
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <section>
        <p className="label-eyebrow mb-4">Classroom routines</p>
        <div className="space-y-4">
          {ROUTINE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-sm font-medium block mb-1.5">{f.label}</label>
              <textarea
                className="w-full border border-line rounded-md p-3 text-sm bg-paper focus:border-primary outline-none"
                rows={2}
                value={routines[f.key] ?? ""}
                onChange={(e) => setRoutines({ ...routines, [f.key]: e.target.value })}
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="label-eyebrow">Student support profiles</p>
          <button onClick={addProfile} className="text-sm text-primary hover:underline">
            + Add student
          </button>
        </div>
        <div className="space-y-3">
          {profiles.map((p, i) => (
            <div key={i} className="card flex gap-3 items-start">
              <div className="flex-1 space-y-2">
                <input
                  className="w-full border border-line rounded-md p-2 text-sm bg-white"
                  placeholder="Student name"
                  value={p.studentName}
                  onChange={(e) => updateProfile(i, "studentName", e.target.value)}
                />
                <textarea
                  className="w-full border border-line rounded-md p-2 text-sm bg-white"
                  rows={2}
                  placeholder="Accommodation, support need, or note for a substitute"
                  value={p.note}
                  onChange={(e) => updateProfile(i, "note", e.target.value)}
                />
              </div>
              <button onClick={() => removeProfile(i)} className="text-muted hover:text-ink text-sm">
                Remove
              </button>
            </div>
          ))}
          {profiles.length === 0 && (
            <p className="text-sm text-muted">No student support profiles added yet.</p>
          )}
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save classroom profile"}
        </button>
        {saved && <span className="text-sm text-primary">Saved</span>}
      </div>
    </div>
  );
}
