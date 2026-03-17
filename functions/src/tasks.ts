import { CloudTasksClient } from '@google-cloud/tasks';

// These values must be set as environment variables or Firebase config
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'REPLACE_WITH_PROJECT_ID';
const LOCATION = process.env.FUNCTION_REGION || 'us-central1';
const QUEUE_NAME = 'liferpg-notifications';
const QUEUE_PATH = `projects/${PROJECT_ID}/locations/${LOCATION}/queues/${QUEUE_NAME}`;

const tasksClient = new CloudTasksClient();

export interface TaskPayload {
  url: string; // Cloud Function URL to call
  body: Record<string, unknown>;
  scheduleTime: Date; // When to fire the task
  taskId: string; // Unique ID (used to deduplicate/delete)
}

// ---------------------------------------------------------------------------
// Internal shared secret — set CLOUD_TASKS_SECRET in your Cloud Functions
// environment to a long random string. The same value is checked by the
// HTTP alert functions to prevent unauthenticated invocations.
// ---------------------------------------------------------------------------
export const TASKS_INTERNAL_SECRET = process.env.CLOUD_TASKS_SECRET ?? '';
export const TASKS_SECRET_HEADER = 'x-liferpg-tasks-secret';

export async function enqueueTask(payload: TaskPayload): Promise<void> {
  const taskName = `${QUEUE_PATH}/tasks/${payload.taskId}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (TASKS_INTERNAL_SECRET) {
    headers[TASKS_SECRET_HEADER] = TASKS_INTERNAL_SECRET;
  }

  const task = {
    name: taskName,
    scheduleTime: {
      seconds: Math.floor(payload.scheduleTime.getTime() / 1000),
    },
    httpRequest: {
      httpMethod: 'POST' as const,
      url: payload.url,
      headers,
      body: Buffer.from(JSON.stringify(payload.body)).toString('base64'),
    },
  };

  try {
    await tasksClient.createTask({ parent: QUEUE_PATH, task });
  } catch (err: any) {
    // ALREADY_EXISTS means a task with this ID is already scheduled — that's fine
    if (err.code !== 6) throw err;
  }
}

// ---------------------------------------------------------------------------
// URL helper — shared by notification files to build Cloud Function URLs.
// ---------------------------------------------------------------------------

/**
 * Returns the base URL for Cloud Functions v1 in the current project/region.
 * For Cloud Functions v2 (gen 2) you will need to supply the full URL directly
 * via an environment variable (FUNCTION_BASE_URL).
 */
export function getFunctionBaseUrl(): string {
  // Allow explicit override for gen-2 / custom domains
  if (process.env.FUNCTION_BASE_URL) return process.env.FUNCTION_BASE_URL.replace(/\/$/, '');
  const projectId = process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'REPLACE_WITH_PROJECT_ID';
  const region = process.env.FUNCTION_REGION ?? 'us-central1';
  return `https://${region}-${projectId}.cloudfunctions.net`;
}

export async function deleteTask(taskId: string): Promise<void> {
  const taskName = `${QUEUE_PATH}/tasks/${taskId}`;
  try {
    await tasksClient.deleteTask({ name: taskName });
  } catch (err: any) {
    // NOT_FOUND means the task already ran or doesn't exist — that's fine
    if (err.code !== 5) throw err;
  }
}
