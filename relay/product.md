# 1. What Relay Is

Relay is an AI-powered classroom continuity platform that helps teachers maintain learning continuity during unexpected or planned absences.

Instead of requiring teachers to manually prepare substitute lesson plans, Relay combines existing classroom context with teacher instructions to produce a structured, substitute-ready **Relay Pack**.

Relay is designed to work alongside Google Classroom rather than replace it. Google Classroom remains the source of truth for coursework, announcements, teaching materials, and student assignments, while Relay provides the operational context and classroom guidance that existing learning management systems do not capture.

Relay focuses on maintaining continuity across three phases of an absence:

1. **Preparing the substitute** before class.
2. **Assisting the substitute** during class.
3. **Helping the returning teacher** quickly understand what occurred during the absence.

The platform minimizes teacher effort by retrieving classroom information automatically whenever possible and only requesting additional input when necessary.

---

# 2. Problem Statement

Teacher absences create a significant operational disruption in classrooms.

Although many schools use digital learning platforms such as Google Classroom, these systems primarily organize instructional materials and student submissions. They do not preserve the operational knowledge that substitutes need to successfully manage an unfamiliar classroom.

Current substitute preparation typically relies on one or more of the following:

- Handwritten notes
- Printed lesson plans
- Email instructions
- Shared documents
- Last-minute verbal communication
- Existing Google Classroom coursework

These approaches introduce several problems:

### Lack of Classroom Context
Substitutes rarely understand how the classroom normally operates. Important information such as classroom routines, behavioral expectations, seating considerations, student accommodations, and instructional preferences often exists only in the teacher's memory.

---

# 3. Core Product Features

Relay consists of several integrated product features that together support the complete substitute teaching workflow.

### Google Authentication
- Teachers authenticate using their Google account through **Supabase Authentication**.
- Authentication provides secure access to the Relay dashboard while simplifying onboarding for schools already using Google Workspace.
- Authenticated sessions are maintained using Supabase session management.

### Connect Google Classroom
After signing in, teachers connect their Google Classroom account. Relay retrieves classroom information through **Composio's Google Classroom toolkit**.

Retrieved information includes:
- Active classes
- Course metadata
- Coursework
- Teaching materials
- Announcements
- Attached learning resources

*Google Classroom remains the primary source of instructional content throughout the application.*

### Teacher Classroom Profiles
Each class maintains operational information that cannot be retrieved from Google Classroom. 

This information includes:
- Classroom routines
- Student support profiles
- Behavioral expectations
- Teacher instructional preferences

Teachers configure this information once, allowing Relay to reuse it whenever substitute preparation is required.

### "I'm Out Today"
This is the primary entry point into the product. Teachers initiate substitute preparation by selecting the **"I'm Out Today"** action from the dashboard.

The workflow is intentionally designed for speed and minimal interaction:
- Teachers may describe how learning should continue using natural language.
- Teachers can use predefined suggestion chips to quickly populate common instructional prompts.
- Teachers can long-press the "I'm Out Today" action to dictate instructions using voice input.

*Teacher instructions represent instructional intent rather than detailed substitute lesson plans. Relay combines these instructions with existing classroom context to prepare substitute-ready guidance.*

### AI-Assisted Relay Pack Generation
Relay automatically builds a structured classroom context before invoking AI. Depending on the teacher's instructional intent, Relay may:
- Organize existing classroom information.
- Draft supporting instructional artifacts such as practice questions or review quizzes.

Any AI-generated instructional artifact must be reviewed by the teacher before becoming part of the final Relay Pack.

The completed Relay Pack combines:
- Teacher instructional intent
- Classroom guidance
- Classroom routines
- Student support information
- AI-generated instructional content (when applicable)

### Secure Substitute Access
- Each generated Relay Pack receives its own secure access link.
- Substitutes access Relay Packs without creating an account or signing into Relay.
- The secure link provides access only to the substitute information associated with that specific absence.

### Voice Handover
After completing the class, substitutes record a short voice handover. The recording captures operational classroom information such as:
- Lesson progress
- Student observations
- Classroom behavior
- Follow-up recommendations

Relay converts the recording into structured information that supports teacher reintegration.

### Reintegration Brief
When the teacher returns, Relay presents a concise **Reintegration Brief** summarizing the substitute's handover.

Rather than listening to the complete recording, teachers receive structured insights describing:
- Completed work
- Outstanding work
- Student observations
- Operational issues requiring follow-up

---

# 4. Teacher Experience

The Teacher Experience is designed around a single objective: **prepare an entire substitute-ready classroom with minimal effort during an absence.**

Rather than requiring teachers to manually create substitute lesson plans, Relay automatically retrieves classroom context and combines it with the teacher's instructional intent to generate a structured Relay Pack.

The dashboard is intentionally simple and focuses on the actions teachers are most likely to perform during an absence.

---

## Dashboard

After authentication, teachers are presented with a dashboard displaying:

* Active classes connected from Google Classroom.
* Recent Relay Packs.
* Previous Reintegration Briefs.
* Teacher Classroom Profile status.
* The primary **"I'm Out Today"** action.

The dashboard avoids unnecessary complexity and keeps the substitute preparation workflow as the primary focus.

---

## Teacher Classroom Profile

Before using Relay for the first time, teachers complete a Classroom Profile for each class.

This profile stores operational classroom information that rarely changes between absences.

Examples include:

* Classroom routines.
* Student support profiles.
* Default lesson continuation preference.

Teachers can update this information at any time, but it is intended to be configured once and reused across future Relay Pack generations.

---

## "I'm Out Today" Workflow

The **"I'm Out Today"** action is the primary interaction within Relay.

A large, visually prominent button is displayed on the dashboard to allow teachers to quickly begin the substitute preparation process.

clicking this action opens the absence workflow.

---

### Instruction Input

Teachers describe how learning should continue during the absence.

Relay supports two input methods.

#### Text Input

Teachers type their instructional intent using natural language.

To reduce typing, Relay provides clickable suggestion chips such as:

* Continue today's lesson and generate practice questions.
* Continue today's lesson and generate a review quiz.
* Continue the current project.
* Reading activity.

Selecting a suggestion automatically inserts a starter prompt into the instruction field.

Teachers may edit, remove, or expand this prompt before continuing.

The suggestion serves only as a starting point and never limits the teacher's instructions.

---

#### Voice Input

Teachers may alternatively hold the **"I'm Out Today"** button to begin voice recording.

Relay converts the spoken instructions into editable text.

Teachers review the transcription before continuing.

Voice input provides a faster alternative for unexpected absences where typing may be inconvenient.

---

## AI Review

After the teacher submits their instructional intent, Relay prepares a draft Relay Pack.

If the AI generates instructional content such as practice questions or a review quiz, the generated content is presented separately for teacher review.

Teachers may:

* Approve.
* Edit.
* Regenerate.

Only approved instructional content becomes part of the final Relay Pack.

Existing classroom information, routines, and student support information are retrieved rather than regenerated.

---

## Relay Pack Generation

After approval, Relay generates a Relay Pack for each active class.

Each Relay Pack combines:

* Teacher instructional intent.
* Classroom guidance.
* Classroom routines.
* Student support information.
* Approved AI-generated instructional content (when applicable).

Each Relay Pack receives its own secure substitute access link.

Teachers may preview the Relay Pack exactly as substitutes will view it.

Previewing a Relay Pack is a read-only action and never modifies application state.

---

# 5. Substitute Experience

Substitutes access Relay through a secure link and are not required to create an account or sign in.

The interface is designed to reduce cognitive load by organizing information into focused sections rather than presenting a single long document.

Relay complements Google Classroom rather than replacing it. Students continue accessing classroom materials through Google Classroom while Relay provides the substitute with operational guidance.

---

## Today's Activity

This section describes what students should accomplish during the lesson.

Depending on the teacher's instructional intent, it may contain:

* AI-generated practice questions.
* AI-generated review quizzes.
* Project continuation instructions.
* Discussion prompts.
* Teacher-defined classroom activities.

When no instructional content is generated, this section presents the teacher's activity instructions in a structured format.

This is the primary section substitutes use while facilitating learning.

---

## Class Instructions

This section explains how the class should be managed throughout the lesson.

Examples include:

* Suggested lesson timing.
* Activity sequence.
* Teacher-specific classroom instructions.
* Transition guidance between activities.

Rather than repeating classroom content, this section focuses on helping the substitute facilitate the lesson effectively.

---

## Classroom

This section provides operational classroom information.

Examples include:

* Classroom routines.
* Behavioral expectations.
* Student support profiles.
* Important classroom considerations.

This information helps substitutes maintain consistency with the teacher's normal classroom environment.

---

## Voice Handover

At the conclusion of the lesson, substitutes record a short voice handover directly within Relay.

The recording interface guides substitutes using structured prompts that encourage consistent reporting.

Topics include:

* Lesson completion.
* Student engagement.
* Students requiring follow-up.
* Classroom observations.
* Important notes for the returning teacher.

After submission, Relay confirms that the handover has been successfully recorded.

---

# 6. Complete Product Workflow

The following example demonstrates the complete Relay workflow for a single teacher absence.

---

A teacher wakes up unexpectedly ill and opens Relay.

From the dashboard, the teacher selects **"I'm Out Today."**

The teacher chooses the suggestion:

> Continue today's lesson and generate practice questions.

The suggestion is inserted into the instruction field.

The teacher adds:

> Allow students twenty minutes to review today's lesson before attempting the practice questions independently. Use the remaining time for discussion.

Relay combines the teacher's instructional intent with the existing classroom context retrieved from Google Classroom and the stored Classroom Profile.

The AI prepares a draft Relay Pack and generates a set of practice questions based on the current lesson.

Before the Relay Pack is finalized, the teacher reviews the generated practice questions.

The teacher approves the generated content.

Relay generates a Relay Pack for the class and creates a secure substitute access link.

The substitute opens the secure link before class.

Throughout the lesson, the substitute can uses Relay to:

* Review today's activity.
* Follow the class instructions.
* Reference classroom routines and student support information.

Students continue accessing their lesson materials through Google Classroom as they normally would.

At the end of class, the substitute records a voice handover summarizing lesson progress and classroom observations.

When the teacher returns, Relay presents a Reintegration Brief summarizing the substitute's handover, allowing the teacher to quickly understand what occurred during the absence and continue instruction without manually reconstructing the day.

---

# 7. AI System Overview

Relay uses three specialized AI agents that work together throughout the substitute preparation workflow.

Each agent has a single responsibility and performs only one stage of the overall process.

---

## Context Builder Agent

The Context Builder Agent prepares the complete classroom context before any AI generation occurs.

It gathers and organizes information from connected classroom sources and teacher configuration into a single structured classroom state.

This context includes:

* Current classroom information.
* Teacher instructional intent.
* Classroom routines.
* Student support profiles
* today's and yesterday Google Classroom course work.

The resulting classroom state becomes the foundation for all subsequent AI processing.

---

## Relay Pack Agent

The Relay Pack Agent transforms the prepared classroom context into a substitute-ready Relay Pack.

Its responsibilities include:

* Organizing classroom information.
* Structuring substitute guidance.
* Interpreting the teacher's instructional intent.
* Drafting instructional artifacts when appropriate.

Examples of instructional artifacts include:

* Practice questions.
* Review quizzes.
* Discussion prompts.

Generated instructional content is always presented to the teacher for review before becoming part of the final Relay Pack.

---

## Handover Agent

The Handover Agent processes the substitute's recorded voice handover after class.

It converts the recording into structured classroom information that can be easily reviewed by the returning teacher.

The resulting summary becomes the foundation of the Reintegration Brief.

---

## Voice Handover Framework

Voice exists for one purpose: to make substitute reporting effortless.

The substitute records a short audio summary (asynchronous audio recording taking under 60 seconds) guided by a clear four-point prompt:

    Lesson Coverage: What was completed, and what wasn't?
    Student Watchlist: Which specific students need academic or behavioral follow-up?
    Classroom Environment: Were there any disruptions or operational issues?
    Tomorrow's Handover: What is the single most important thing the returning teacher must know before opening class tomorrow
    
--- 
# 8. Authentication

Relay uses Google Sign-In through Supabase Authentication.

Teachers authenticate using their Google account and are securely redirected to the Relay dashboard after successful authentication.

Authenticated sessions allow teachers to:

* Manage classroom profiles.
* Generate Relay Packs.
* View Reintegration Briefs.
* Access all protected teacher features.

Substitutes do not require authentication.

Instead, they access Relay Packs through secure, temporary links generated for each absence.

This approach minimizes substitute onboarding while maintaining a simple teacher authentication experience.

---

# 9. External Integrations

Relay integrates with several external services to provide classroom continuity.

---

## Google Classroom

Google Classroom serves as the primary source of instructional content.

Relay retrieves classroom information such as:

* Classes.
* Coursework.
* Teaching materials.
* Announcements.
* Learning resources.

Students continue interacting with Google Classroom throughout the lesson.

Relay complements this experience by providing substitute guidance and operational classroom context.

---

## Composio

Relay communicates with Google Classroom through Composio.

Composio provides secure access to Google Classroom capabilities while simplifying integration management.

This allows Relay to retrieve classroom information without directly managing Google Classroom API implementations.

---

## Groq

Relay uses Groq as its Large Language Model provider.

Groq powers AI capabilities including:

* Relay Pack generation.
* Instruction interpretation.
* Practice question generation.
* Review quiz generation.
* Classroom guidance organization.
* Reintegration summaries.

---

## Deepgram

Relay uses Deepgram to convert substitute voice recordings into text.

The resulting transcript is processed to produce structured classroom handovers and Reintegration Briefs.

Deepgram enables substitutes to communicate naturally without requiring manual written reports.


## google classroom mapping:

step : 1

Teacher clicks:
Connect Google Classroom

step:2
Relay imports:

Algebra I
Biology
Physics

into your classes table.

Step 4

Teacher selects one imported class.

Step 5

Teacher configures only the Relay-specific information:
Classroom routines
Student support profiles