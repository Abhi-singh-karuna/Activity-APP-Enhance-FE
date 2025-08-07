# ActivityScreen REST API Documentation

## Overview

This document outlines all the REST API endpoints needed for the ActivityScreen to replace socket functionality with REST API calls.

## Base Configuration

- **Base URL**: `https://api.activityapp.com/v1`
- **Content-Type**: `application/json`
- **Authentication**: Bearer Token (JWT)

## Authentication Headers

```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

---

## 1. Core Activity APIs

### 1.1 Get All Activities

**GET** `/activities`

**Query Parameters:**

- `category` (optional): Filter by category (Workout, Work, Personal)
- `is_completed` (optional): Filter by completion status (true/false)
- `is_running` (optional): Filter by running status (true/false)
- `sort_by` (optional): Sort by (recent, priority, duration, completion)
- `limit` (optional): Items per page (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity_123",
        "title": "Morning Workout",
        "category": "Workout",
        "startDate": "2025/08/02",
        "endDate": "2025/08/02",
        "duration": "01:00:00",
        "color": "#00E5FF",
        "priority": 1,
        "isRunning": true,
        "isCompleted": false,
        "isPaused": false,
        "isFuture": false,
        "currentTimer": "00:45:30",
        "remainingSeconds": 870,
        "elapsedSeconds": 870,
        "totalTimeSpent": 870,
        "completionPercentage": 25,
        "streak": 5,
        "lastStartTime": 1704067200000,
        "lastCompletedDate": "2025/08/01",
        "createdAt": "2025-08-01T08:00:00Z",
        "updatedAt": "2025-08-02T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 1.2 Create Activity

**POST** `/activities`

**Request Body:**

```json
{
  "title": "New Activity",
  "category": "Workout",
  "startDate": "2025/08/02",
  "endDate": "2025/08/02",
  "duration": "01:00:00",
  "color": "#00E5FF",
  "priority": 1
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "activity": {
      "id": "activity_123",
      "title": "New Activity",
      "category": "Workout",
      "startDate": "2025/08/02",
      "endDate": "2025/08/02",
      "duration": "01:00:00",
      "color": "#00E5FF",
      "priority": 1,
      "isRunning": false,
      "isCompleted": false,
      "isPaused": false,
      "currentTimer": "01:00:00",
      "remainingSeconds": 3600,
      "elapsedSeconds": 0,
      "totalTimeSpent": 0,
      "completionPercentage": 0,
      "streak": 0
    }
  }
}
```

### 1.3 Update Activity

**PUT** `/activities/{id}`

**Request Body:** Same as Create Activity

**Response:**

```json
{
  "success": true,
  "data": {
    "activity": {
      "id": "activity_123",
      "title": "Updated Activity",
      "category": "Work",
      "startDate": "2025/08/03",
      "endDate": "2025/08/03",
      "duration": "00:30:00",
      "color": "#9C6CDA",
      "priority": 2,
      "isRunning": false,
      "isCompleted": false,
      "isPaused": false,
      "currentTimer": "00:30:00",
      "remainingSeconds": 1800,
      "elapsedSeconds": 0,
      "totalTimeSpent": 0,
      "completionPercentage": 0,
      "streak": 0
    }
  }
}
```

### 1.4 Delete Activity

**DELETE** `/activities/{id}`

**Response:**

```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

### 1.5 Get Single Activity

**GET** `/activities/{id}`

**Response:**

```json
{
  "success": true,
  "data": {
    "activity": {
      "id": "activity_123",
      "title": "Morning Workout",
      "category": "Workout",
      "startDate": "2025/08/02",
      "endDate": "2025/08/02",
      "duration": "01:00:00",
      "color": "#00E5FF",
      "priority": 1,
      "isRunning": true,
      "isCompleted": false,
      "isPaused": false,
      "currentTimer": "00:45:30",
      "remainingSeconds": 870,
      "elapsedSeconds": 870,
      "totalTimeSpent": 870,
      "completionPercentage": 25,
      "streak": 5,
      "lastStartTime": 1704067200000,
      "lastCompletedDate": "2025/08/01"
    }
  }
}
```

---

## 2. Timer Management APIs

### 2.1 Start Activity Timer

**POST** `/activities/{id}/start`

**Response:**

```json
{
  "success": true,
  "message": "Activity timer started",
  "data": {
    "activity": {
      "id": "activity_123",
      "isRunning": true,
      "isPaused": false,
      "currentTimer": "01:00:00",
      "remainingSeconds": 3600,
      "elapsedSeconds": 0,
      "lastStartTime": 1704067200000
    }
  }
}
```

### 2.2 Stop Activity Timer

**POST** `/activities/{id}/stop`

**Response:**

```json
{
  "success": true,
  "message": "Activity timer stopped",
  "data": {
    "activity": {
      "id": "activity_123",
      "isRunning": false,
      "isPaused": false,
      "currentTimer": "00:45:30",
      "remainingSeconds": 870,
      "elapsedSeconds": 2730,
      "totalTimeSpent": 2730,
      "lastStartTime": null
    }
  }
}
```

### 2.3 Pause Activity Timer

**POST** `/activities/{id}/pause`

**Response:**

```json
{
  "success": true,
  "message": "Activity timer paused",
  "data": {
    "activity": {
      "id": "activity_123",
      "isRunning": false,
      "isPaused": true,
      "currentTimer": "00:45:30",
      "remainingSeconds": 870,
      "elapsedSeconds": 2730,
      "totalTimeSpent": 2730
    }
  }
}
```

### 2.4 Resume Activity Timer

**POST** `/activities/{id}/resume`

**Response:**

```json
{
  "success": true,
  "message": "Activity timer resumed",
  "data": {
    "activity": {
      "id": "activity_123",
      "isRunning": true,
      "isPaused": false,
      "currentTimer": "00:45:30",
      "remainingSeconds": 870,
      "elapsedSeconds": 2730,
      "totalTimeSpent": 2730,
      "lastStartTime": 1704067200000
    }
  }
}
```

### 2.5 Complete Activity

**POST** `/activities/{id}/complete`

**Response:**

```json
{
  "success": true,
  "message": "Activity completed successfully",
  "data": {
    "activity": {
      "id": "activity_123",
      "isRunning": false,
      "isCompleted": true,
      "isPaused": false,
      "currentTimer": "00:00:00",
      "remainingSeconds": 0,
      "elapsedSeconds": 3600,
      "totalTimeSpent": 3600,
      "completionPercentage": 100,
      "lastCompletedDate": "2025/08/02"
    }
  }
}
```

### 2.6 Update Timer Progress (Polling)

**GET** `/activities/{id}/timer`

**Response:**

```json
{
  "success": true,
  "data": {
    "activity": {
      "id": "activity_123",
      "isRunning": true,
      "currentTimer": "00:44:30",
      "remainingSeconds": 870,
      "elapsedSeconds": 2730,
      "completionPercentage": 25
    }
  }
}
```

---

## 3. Search and Filter APIs

### 3.1 Search Activities

**GET** `/activities/search?query={search_term}`

**Response:**

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity_123",
        "title": "Morning Workout",
        "category": "Workout",
        "startDate": "2025/08/02",
        "endDate": "2025/08/02",
        "duration": "01:00:00",
        "color": "#00E5FF",
        "priority": 1,
        "isRunning": true,
        "currentTimer": "00:45:30",
        "remainingSeconds": 870,
        "completionPercentage": 25
      }
    ]
  }
}
```

### 3.2 Get Activity Statistics

**GET** `/activities/stats`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalActivities": 25,
    "runningActivities": 3,
    "completedActivities": 15,
    "futureActivities": 7,
    "totalTimeSpent": 45000,
    "averageCompletionRate": 75.5,
    "longestStreak": 12,
    "currentStreak": 5
  }
}
```

---

## 4. Bulk Operations APIs

### 4.1 Bulk Update Activities

**PUT** `/activities/bulk`

**Request Body:**

```json
{
  "activities": [
    {
      "id": "activity_123",
      "priority": 2
    },
    {
      "id": "activity_124",
      "isCompleted": true
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Activities updated successfully",
  "data": {
    "updatedCount": 2
  }
}
```

### 4.2 Delete All Activities

**DELETE** `/activities`

**Response:**

```json
{
  "success": true,
  "message": "All activities deleted successfully"
}
```

---

## 5. Implementation Notes

### 5.1 Polling Strategy

Instead of WebSocket connections, implement polling for real-time updates:

1. **Timer Updates**: Poll `/activities/{id}/timer` every 1 second for running activities
2. **Activity List**: Poll `/activities` every 5-10 seconds for general updates
3. **Statistics**: Poll `/activities/stats` every 30 seconds

### 5.2 Error Handling

```json
{
  "success": false,
  "error": {
    "code": "ACTIVITY_NOT_FOUND",
    "message": "Activity not found",
    "details": "The requested activity does not exist"
  }
}
```

### 5.3 Common Error Codes

- `ACTIVITY_NOT_FOUND`: Activity doesn't exist
- `TIMER_ALREADY_RUNNING`: Timer is already running
- `TIMER_NOT_RUNNING`: Timer is not running
- `ACTIVITY_ALREADY_COMPLETED`: Activity is already completed
- `INVALID_DURATION`: Invalid duration format
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Access denied

### 5.4 Rate Limiting

- **Standard requests**: 100 requests per minute
- **Timer polling**: 60 requests per minute per activity
- **Bulk operations**: 10 requests per minute

---

## 6. Frontend Integration

### 6.1 API Service Structure

```typescript
// activityService.ts
export const activityService = {
  // Core CRUD
  getActivities: (filters?: ActivityFilters) => Promise<ApiResponse>,
  getActivity: (id: string) => Promise<ApiResponse>,
  createActivity: (data: CreateActivityData) => Promise<ApiResponse>,
  updateActivity: (id: string, data: UpdateActivityData) =>
    Promise<ApiResponse>,
  deleteActivity: (id: string) => Promise<ApiResponse>,

  // Timer management
  startTimer: (id: string) => Promise<ApiResponse>,
  stopTimer: (id: string) => Promise<ApiResponse>,
  pauseTimer: (id: string) => Promise<ApiResponse>,
  resumeTimer: (id: string) => Promise<ApiResponse>,
  completeActivity: (id: string) => Promise<ApiResponse>,
  getTimerStatus: (id: string) => Promise<ApiResponse>,

  // Search and stats
  searchActivities: (query: string) => Promise<ApiResponse>,
  getStatistics: () => Promise<ApiResponse>,

  // Bulk operations
  bulkUpdate: (activities: BulkUpdateData[]) => Promise<ApiResponse>,
  deleteAll: () => Promise<ApiResponse>,
};
```

### 6.2 Polling Implementation

```typescript
// Timer polling for running activities
useEffect(() => {
  const interval = setInterval(() => {
    runningActivities.forEach((activity) => {
      activityService.getTimerStatus(activity.id);
    });
  }, 1000);

  return () => clearInterval(interval);
}, [runningActivities]);
```

This API structure provides all the functionality needed to replace WebSocket connections with REST API calls while maintaining real-time updates through strategic polling.
