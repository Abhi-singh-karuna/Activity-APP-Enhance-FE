### Activity Screen Integration Spec (REST + Local Storage)

#### Overview

- **Backend**: Source of truth for activities and final states.
- **Client**: Live per-second ticking kept locally; snapshots persisted to local storage.
- **Date-scoped list**: Client always sends `start_date`/`end_date` as `YYYY/MM/DD`.

## Backend APIs

- **List activities (date-scoped)**

  - Method/path: `GET /activities?start_date=YYYY/MM/DD&end_date=YYYY/MM/DD`
  - Optional query: `category`, `is_completed`, `sort_by`, `limit`, `offset`
  - Response: `ApiResponse<{ activities: ActivityResponse[] }>`

- **Update timer state (start/pause/tick sync)**
  - Method/path: `POST /activities/:id/timer`
  - Body example:

```json
{
  "isRunning": true,
  "isPaused": false,
  "remainingSeconds": 2390,
  "elapsedSeconds": 1210
}
```

- Response: `ApiResponse<{ activity: ActivityResponse }>`

- **Complete an activity**

  - Method/path: `POST /activities/:id/complete`
  - Body: `{}`
  - Response: `ApiResponse<{ activity: ActivityResponse }>`

- **Optional CRUD**
  - Create: `POST /activities` (simple or frequency payload)
  - Update: `PUT /activities/:id`
  - Delete: `DELETE /activities/:id`

## Response envelope (all endpoints)

```json
{
  "status": true,
  "message": "optional",
  "data": { ... },
  "error": { "code": "", "message": "", "details": "" },
  "total_count": 0
}
```

## Data model used by the Activity screen

- **Base Activity (required to render a card)**

  - `id`, `title`, `category` ("Personal" | "Work" | "Workout" | "Learning"), `startDate`, `endDate`, `duration` (HH:MM:SS), `color`, `priority`

- **ActivityResponse (optional fields to enhance UX if present)**

  - `isRunning`, `isPaused`, `isCompleted`, `currentTimer`, `remainingSeconds`, `elapsedSeconds`, `totalTimeSpent`, `lastStartTime`, `completionPercentage`, `streak`, `lastCompletedDate`, `tags`, `createdAt`, `updatedAt`

- **Example list response (date-scoped)**

```json
{
  "status": true,
  "data": {
    "activities": [
      {
        "id": "2",
        "title": "Team Meeting",
        "category": "Work",
        "startDate": "2025/01/18",
        "endDate": "2025/01/18",
        "duration": "00:30:00",
        "color": "#9C6CDA",
        "priority": 2,
        "isRunning": true,
        "isCompleted": false,
        "currentTimer": "00:25:00",
        "remainingSeconds": 1500,
        "elapsedSeconds": 300,
        "lastStartTime": 1737192000000,
        "completionPercentage": 17,
        "streak": 3
      }
    ]
  }
}
```

## Local storage (per-activity live timer)

- **Key**: `activity_timer_state:{activityId}`
- **Value**:

```json
{
  "isRunning": true,
  "isPaused": false,
  "remainingSeconds": 1234,
  "lastStartTime": 1737210000000,
  "updatedAt": 1737210010000
}
```

- Optional throttle key (per activity) to reduce API calls:
  - `activity_last_sync_at:{activityId}` → epoch ms

## Client flows (when each API is called)

- **On screen focus / pull-to-refresh (date aware)**

  - Call `GET /activities?start_date={D}&end_date={D}`.
  - Merge with local timer state; if `isRunning` and `lastStartTime`, recalc `remainingSeconds` using wall time.

- **On start or pause**

  - Persist local state immediately (snapshot structure above).
  - Fire-and-forget `POST /activities/:id/timer` with `{ isRunning, isPaused, remainingSeconds }`.

- **While running (throttled every 10–30s per activity)**

  - `POST /activities/:id/timer` with `{ isRunning: true, remainingSeconds, elapsedSeconds }`.

- **On completion (remainingSeconds reaches 0)**

  - Persist local stopped state.
  - `POST /activities/:id/complete`.
  - Optionally refresh the day: `GET /activities?start_date={D}&end_date={D}`.

- **On app background**

  - Persist all running timers locally.
  - Best-effort one `POST /activities/:id/timer` per running activity.

- **On app resume/launch**
  - Rehydrate from local storage; reconcile using `lastStartTime`.
  - `GET /activities?start_date={D}&end_date={D}`.
  - Optionally flush one `POST /activities/:id/timer` per running activity.

## Request payload snippets

- **Start**

```json
{ "isRunning": true, "isPaused": false, "remainingSeconds": 3600 }
```

- **Pause**

```json
{ "isRunning": true, "isPaused": true, "remainingSeconds": 2400 }
```

- **Tick (throttled)**

```json
{ "isRunning": true, "remainingSeconds": 2390, "elapsedSeconds": 1210 }
```

- **Complete**

```json
{}
```

## Date handling

- Always send `start_date` and `end_date` as `YYYY/MM/DD` (matches screen parsing and filters).
