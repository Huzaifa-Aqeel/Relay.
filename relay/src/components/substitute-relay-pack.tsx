"use client";

import { useId, useState } from "react";
import type { RelayPackContent } from "@/types";
import VoiceHandover from "@/components/voice-handover";

type Tab = "activity" | "routine" | "handover";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "activity", label: "TODAY'S ACTIVITY" },
  { id: "routine", label: "CLASS ROUTINE" },
  { id: "handover", label: "HANDOVER" }
];

function routineLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function SubstituteRelayPack({
  className,
  section,
  content,
  token,
  alreadySubmitted,
  preview = false
}: {
  className: string;
  section: string;
  content: RelayPackContent;
  token: string;
  alreadySubmitted: boolean;
  preview?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("activity");
  const tabIdPrefix = useId();

  return (
    <div>
      <header className="mb-8">
        <p className="label-eyebrow mb-1">RELAY PACK</p>
        <h1 className="text-3xl font-display font-semibold">
          {className} <span className="text-muted text-lg font-sans">— {section}</span>
        </h1>
      </header>

      <div className="border-b border-line mb-6" role="tablist" aria-label="Relay Pack sections">
        <div className="flex gap-5 overflow-x-auto" role="presentation">
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`${tabIdPrefix}-${tab.id}-tab`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`${tabIdPrefix}-${tab.id}-panel`}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 border-b-2 px-1 pb-3 text-xs font-mono tracking-wider transition-colors ${
                  selected
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:border-line hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "activity" && (
        <section
          id={`${tabIdPrefix}-activity-panel`}
          role="tabpanel"
          aria-labelledby={`${tabIdPrefix}-activity-tab`}
          className="card"
        >
          <p className="label-eyebrow mb-3 text-primary">Today&rsquo;s Activity</p>
          {content.teacherInstruction ? (
            <p className="mb-4 leading-relaxed">{content.teacherInstruction}</p>
          ) : (
            <p className="mb-4 leading-relaxed text-muted italic">
              No specific instruction was provided for this class.
            </p>
          )}
          {content.generatedContent && (
            <div className="bg-primary-light/40 rounded-md p-4">
              <p className="text-xs uppercase tracking-wide text-primary-dark mb-2 font-mono">
                {content.generatedContent.type === "practice_questions" ? "Practice questions" : "Review quiz"}
              </p>
              <ol className="space-y-2 list-decimal list-inside text-sm">
                {content.generatedContent.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}

      {activeTab === "routine" && (
        <section
          id={`${tabIdPrefix}-routine-panel`}
          role="tabpanel"
          aria-labelledby={`${tabIdPrefix}-routine-tab`}
        >
          <div className="card">
            <p className="label-eyebrow mb-3 text-primary">Class Routine</p>
            <div className="space-y-2 text-sm mb-4">
              {Object.entries(content.classroomInfo.routines)
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{routineLabel(key)}: </span>
                    <span className="text-muted">{String(value)}</span>
                  </div>
                ))}
            </div>
            {content.classroomInfo.studentSupportProfiles.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Student support</p>
                <ul className="text-sm space-y-2">
                  {content.classroomInfo.studentSupportProfiles.map((profile, index) => (
                    <li key={index} className="border-l-2 border-accent pl-3">
                      <span className="font-medium">{profile.studentName}</span> — {profile.note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "handover" && (
        <section
          id={`${tabIdPrefix}-handover-panel`}
          role="tabpanel"
          aria-labelledby={`${tabIdPrefix}-handover-tab`}
          className="card"
        >
          <p className="label-eyebrow mb-3 text-primary">End of Class — Voice Handover</p>
          {alreadySubmitted ? (
            <p className="text-sm text-muted">
              Handover already submitted for this class — thank you. The teacher has been sent your summary.
            </p>
          ) : preview ? (
            <p className="text-sm text-muted">
              The substitute will record their end-of-class handover here. Preview mode is read-only.
            </p>
          ) : (
            <VoiceHandover token={token} />
          )}
        </section>
      )}
    </div>
  );
}
