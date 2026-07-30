// Google Classroom access via the official Composio TypeScript SDK (0.14.x).
// Docs: https://docs.composio.dev — toolkit slug "google_classroom".
//
// Every call takes an explicit connectedAccountId (stored on our
// google_connections row) rather than relying on Composio's "look up this
// user's account" auto-resolution — that auto-lookup throws the moment a
// user has more than one connected account under the same auth config.
import { Composio } from "@composio/core";

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  // Manual tool execution requires a real pinned version string — "latest"
  // is rejected. Check docs.composio.dev/toolkits/google_classroom
  // periodically and bump this if you want newer tool behavior.
  toolkitVersions: { google_classroom: "20260424_00" }
});

// Thrown when a stored connectedAccountId no longer resolves to a live,
// usable connection on Composio's side — e.g. it was deleted from the
// Composio dashboard, or the OAuth grant was revoked and the refresh token
// expired. Callers use this to distinguish "Classroom is genuinely broken,
// go mark it that way" from any other kind of failure.
export class ComposioConnectionInvalidError extends Error {}

function toConnectionError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  const status = (err as any)?.status ?? (err as any)?.cause?.status;
  const looksInvalid =
    status === 404 ||
    status === 401 ||
    /not.?found/i.test(message) ||
    /inactive/i.test(message) ||
    /expired/i.test(message) ||
    /revoked/i.test(message);
  return looksInvalid ? new ComposioConnectionInvalidError(message) : (err as Error);
}

// Kicks off the OAuth connect flow for a teacher. redirectUrl is where
// Composio sends the browser back to once Google auth completes (appends
// ?status=success&connected_account_id=... automatically). link() already
// refuses to create a second ACTIVE connection for the same (userId,
// authConfigId) pair as of Composio SDK 0.13+, so no allowMultiple needed —
// it reuses the flow safely even if called more than once.
export async function startGoogleClassroomConnection(teacherId: string, redirectUrl: string) {
  const connectionRequest = await composio.connectedAccounts.link(
    teacherId,
    process.env.COMPOSIO_GOOGLE_CLASSROOM_AUTH_CONFIG_ID!,
    { callbackUrl: redirectUrl }
  );
  return { redirectUrl: connectionRequest.redirectUrl };
}

// Called on sign-out so a teacher's Classroom access doesn't sit connected
// under a browser session they've left. Deletion (not just disable) is
// intentional here: the teacher's own request was "sign out of Google
// Classroom too" — a clean slate on next sign-in, not a paused connection
// that silently resumes.
export async function disconnectGoogleClassroom(connectedAccountId: string): Promise<void> {
  await composio.connectedAccounts.delete(connectedAccountId);
}

export interface GoogleClassroomCourse {
  googleCourseId: string;
  name: string;
  section: string;
}

interface CoursesListPayload {
  courses?: Array<{ id?: string; name?: string; section?: string }>;
  nextPageToken?: string;
}

/**
 * Composio wraps each tool's native response in its own execution response.
 * For GOOGLE_CLASSROOM_COURSES_LIST that means the actual Google payload is
 * result.data.data, not result.data. Keeping this extraction here prevents a
 * silent "successful" sync that imports zero rows.
 */
function coursesListPayload(data: unknown): CoursesListPayload {
  if (!data || typeof data !== "object") return {};

  const wrapped = data as { data?: unknown; courses?: unknown; nextPageToken?: unknown };
  if (wrapped.data && typeof wrapped.data === "object") {
    return wrapped.data as CoursesListPayload;
  }

  // Preserve compatibility with an unwrapped response should Composio change
  // this tool's response shape in a future toolkit version.
  return wrapped as CoursesListPayload;
}

export async function fetchClasses(
  teacherId: string,
  connectedAccountId: string
): Promise<GoogleClassroomCourse[]> {
  try {
    const courses: GoogleClassroomCourse[] = [];
    let pageToken: string | undefined;

    do {
      const result = await composio.tools.execute("GOOGLE_CLASSROOM_COURSES_LIST", {
        userId: teacherId,
        connectedAccountId,
        arguments: {
          teacherId: "me",
          courseStates: ["ACTIVE"],
          pageSize: 100,
          ...(pageToken ? { pageToken } : {})
        }
      });

      if (!result.successful) {
        throw new Error(result.error ?? "Google Classroom could not list courses");
      }

      const payload = coursesListPayload(result.data);
      for (const course of payload.courses ?? []) {
        if (!course.id || !course.name) continue;
        courses.push({
          googleCourseId: course.id,
          name: course.name,
          section: course.section ?? ""
        });
      }
      pageToken = payload.nextPageToken;
    } while (pageToken);

    return courses;
  } catch (err) {
    throw toConnectionError(err);
  }
}

export interface CourseworkItem {
  title: string;
  description: string;
  dueDate?: string;
  materials: string[];
}

interface CourseWorkListPayload {
  courseWork?: Array<{
    title?: string;
    description?: string;
    dueDate?: unknown;
    materials?: Array<{ link?: { url?: string } }>;
    creationTime?: string;
  }>;
}

interface CourseWorkMaterialListPayload {
  courseWorkMaterial?: Array<{
    title?: string;
    description?: string;
    materials?: Array<{ link?: { url?: string } }>;
    creationTime?: string;
  }>;
}

// Same double-wrapping Composio applies to GOOGLE_CLASSROOM_COURSES_LIST
// (see coursesListPayload above) also applies here — the real payload is
// result.data.data, not result.data.
function courseworkListPayload(data: unknown): CourseWorkListPayload {
  if (!data || typeof data !== "object") return {};

  const wrapped = data as { data?: unknown; courseWork?: unknown };
  if (wrapped.data && typeof wrapped.data === "object") {
    return wrapped.data as CourseWorkListPayload;
  }
  return wrapped as CourseWorkListPayload;
}

function courseworkMaterialListPayload(data: unknown): CourseWorkMaterialListPayload {
  if (!data || typeof data !== "object") return {};

  const wrapped = data as { data?: unknown; courseWorkMaterial?: unknown };
  if (wrapped.data && typeof wrapped.data === "object") {
    return wrapped.data as CourseWorkMaterialListPayload;
  }
  return wrapped as CourseWorkMaterialListPayload;
}

function withinLastTwoDays(creationTime: string | undefined): boolean {
  if (!creationTime) return false;
  const created = new Date(creationTime).getTime();
  const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
  return !Number.isNaN(created) && created >= cutoff;
}

// Pulls coursework posted today and yesterday, per the Context Builder Agent spec.
// Google Classroom splits teacher posts across two separate API resources
// depending on how the teacher created them: "Assignment"/"Question" posts
// live under courseWork, while "Material" posts (readings, videos, links
// with no due date or grading) live under the entirely separate
// courseWorkMaterials resource. Both must be queried, or anything posted as
// a Material — a very common way to post lesson notes — is silently missed.
export async function fetchRecentCoursework(
  teacherId: string,
  connectedAccountId: string,
  googleCourseId: string
): Promise<CourseworkItem[]> {
  try {
    const [courseWorkResult, materialsResult] = await Promise.all([
      composio.tools.execute("GOOGLE_CLASSROOM_COURSE_WORK_LIST", {
        userId: teacherId,
        connectedAccountId,
        // Google defaults to PUBLISHED-only if states are omitted — include
        // DRAFT too, since a teacher prepping ahead of time may not have
        // published yet.
        arguments: { courseId: googleCourseId, courseWorkStates: ["PUBLISHED", "DRAFT"] }
      }),
      composio.tools.execute("GOOGLE_CLASSROOM_COURSE_WORK_MATERIALS_LIST", {
        userId: teacherId,
        connectedAccountId,
        arguments: { courseId: googleCourseId, courseWorkMaterialStates: ["PUBLISHED", "DRAFT"] }
      })
    ]);

    if (!courseWorkResult.successful) {
      throw new Error(courseWorkResult.error ?? "Google Classroom could not list coursework");
    }
    if (!materialsResult.successful) {
      throw new Error(materialsResult.error ?? "Google Classroom could not list course materials");
    }

    // Temporary debug log — remove once materials fetching is confirmed working.
    console.log("GOOGLE_CLASSROOM_COURSE_WORK_MATERIALS_LIST raw result:", JSON.stringify(materialsResult, null, 2));

    const assignments = (courseworkListPayload(courseWorkResult.data).courseWork ?? [])
      .filter((w) => withinLastTwoDays(w.creationTime))
      .map((w) => ({
        title: w.title ?? "",
        description: w.description ?? "",
        dueDate: typeof w.dueDate === "string" ? w.dueDate : undefined,
        materials: (w.materials ?? []).map((m) => m.link?.url).filter((url): url is string => Boolean(url))
      }));

    const materials = (courseworkMaterialListPayload(materialsResult.data).courseWorkMaterial ?? [])
      .filter((m) => withinLastTwoDays(m.creationTime))
      .map((m) => ({
        title: m.title ?? "",
        description: m.description ?? "",
        materials: (m.materials ?? []).map((x) => x.link?.url).filter((url): url is string => Boolean(url))
      }));

    return [...assignments, ...materials];
  } catch (err) {
    throw toConnectionError(err);
  }
}
