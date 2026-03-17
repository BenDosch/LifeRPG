"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASKS_SECRET_HEADER = exports.TASKS_INTERNAL_SECRET = void 0;
exports.enqueueTask = enqueueTask;
exports.getFunctionBaseUrl = getFunctionBaseUrl;
exports.deleteTask = deleteTask;
const tasks_1 = require("@google-cloud/tasks");
// These values must be set as environment variables or Firebase config
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'REPLACE_WITH_PROJECT_ID';
const LOCATION = process.env.FUNCTION_REGION || 'us-central1';
const QUEUE_NAME = 'liferpg-notifications';
const QUEUE_PATH = `projects/${PROJECT_ID}/locations/${LOCATION}/queues/${QUEUE_NAME}`;
const tasksClient = new tasks_1.CloudTasksClient();
// ---------------------------------------------------------------------------
// Internal shared secret — set CLOUD_TASKS_SECRET in your Cloud Functions
// environment to a long random string. The same value is checked by the
// HTTP alert functions to prevent unauthenticated invocations.
// ---------------------------------------------------------------------------
exports.TASKS_INTERNAL_SECRET = (_a = process.env.CLOUD_TASKS_SECRET) !== null && _a !== void 0 ? _a : '';
exports.TASKS_SECRET_HEADER = 'x-liferpg-tasks-secret';
async function enqueueTask(payload) {
    const taskName = `${QUEUE_PATH}/tasks/${payload.taskId}`;
    const headers = { 'Content-Type': 'application/json' };
    if (exports.TASKS_INTERNAL_SECRET) {
        headers[exports.TASKS_SECRET_HEADER] = exports.TASKS_INTERNAL_SECRET;
    }
    const task = {
        name: taskName,
        scheduleTime: {
            seconds: Math.floor(payload.scheduleTime.getTime() / 1000),
        },
        httpRequest: {
            httpMethod: 'POST',
            url: payload.url,
            headers,
            body: Buffer.from(JSON.stringify(payload.body)).toString('base64'),
        },
    };
    try {
        await tasksClient.createTask({ parent: QUEUE_PATH, task });
    }
    catch (err) {
        // ALREADY_EXISTS means a task with this ID is already scheduled — that's fine
        if (err.code !== 6)
            throw err;
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
function getFunctionBaseUrl() {
    var _a, _b, _c;
    // Allow explicit override for gen-2 / custom domains
    if (process.env.FUNCTION_BASE_URL)
        return process.env.FUNCTION_BASE_URL.replace(/\/$/, '');
    const projectId = (_b = (_a = process.env.GCLOUD_PROJECT) !== null && _a !== void 0 ? _a : process.env.GOOGLE_CLOUD_PROJECT) !== null && _b !== void 0 ? _b : 'REPLACE_WITH_PROJECT_ID';
    const region = (_c = process.env.FUNCTION_REGION) !== null && _c !== void 0 ? _c : 'us-central1';
    return `https://${region}-${projectId}.cloudfunctions.net`;
}
async function deleteTask(taskId) {
    const taskName = `${QUEUE_PATH}/tasks/${taskId}`;
    try {
        await tasksClient.deleteTask({ name: taskName });
    }
    catch (err) {
        // NOT_FOUND means the task already ran or doesn't exist — that's fine
        if (err.code !== 5)
            throw err;
    }
}
//# sourceMappingURL=tasks.js.map