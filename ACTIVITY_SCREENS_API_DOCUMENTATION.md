# Activity Screens API Documentation

## Overview

This document outlines all the REST API endpoints used specifically in the Activity screens of the Activity App. All APIs return JSON responses and follow RESTful conventions.

## Base Configuration

- **Base URL**: `https://api.activityapp.com/v1` (configurable)
- **Content-Type**: `application/json`
- **Authentication**: Bearer Token (JWT)
- **Response Format**: JSON

## Authentication Headers

```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

## Standard Response Format

```json
{
  "status": boolean,
  "message": "string",
  "data": "object|array",
  "error": {
    "code": "string",
    "message": "string",
    "details": "string"
  },
  "total_count": "number"
}
```

---

## 1. ActivityScreen APIs

### 1.1 Get All Activities (ActivityScreen)

**GET** `/activities`

**Query Parameters:**

- `category` (optional): Filter by category (Workout, Work, Personal, etc.)
- `is_completed` (optional): Filter by completion status (true/false)
- `is_running` (optional): Filter by running status (true/false)
- `sort_by` (optional): Sort by field (recent, priority, duration, completion, alphabetical)
- `sort_order` (optional): asc or desc
- `limit` (optional): Number of items per page (default: 20, max: 100)
- `offset` (optional): Number of items to skip (default: 0)

**Response:**

```json
{
  "status": true,
  "data": {
    "activities": [
      {
        "id": "activity_123",
        "title": "Morning Workout",
        "category": "Workout",
        "startDate": "2025-08-02",
        "endDate": "2025-08-02",
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
        "lastCompletedDate": "2025-08-01",
        "tags": ["fitness", "morning"],
        "notes": "Focus on form and consistency",
        "createdAt": "2025-08-01T08:00:00Z",
        "updatedAt": "2025-08-02T08:00:00Z"
      }
    ]
  },
  "total_count": 1
}
```

### 1.2 Create Activity (ActivityScreen)

**POST** `/activities`

**Request Body:**

```json
{
  "title": "Morning Workout",
  "category": "Workout",
  "startDate": "2025-08-02",
  "endDate": "2025-08-02",
  "duration": "01:00:00",
  "color": "#00E5FF",
  "priority": 1,
  "tags": ["fitness", "morning"],
  "notes": "Focus on form and consistency"
}
```

**Response:**

```json
{
  "status": true,
  "message": "Activity created successfully",
  "data": {
    "activity": {
      "id": "activity_123",
      "title": "Morning Workout",
      "category": "Workout",
      "startDate": "2025-08-02",
      "endDate": "2025-08-02",
      "duration": "01:00:00",
      "color": "#00E5FF",
      "priority": 1,
      "isRunning": false,
      "isCompleted": false,
      "isPaused": false,
      "isFuture": false,
      "currentTimer": "01:00:00",
      "remainingSeconds": 3600,
      "elapsedSeconds": 0,
      "totalTimeSpent": 0,
      "completionPercentage": 0,
      "streak": 0,
      "tags": ["fitness", "morning"],
      "notes": "Focus on form and consistency",
      "createdAt": "2025-08-02T08:00:00Z",
      "updatedAt": "2025-08-02T08:00:00Z"
    }
  }
}
```

### 1.3 Delete Activity (ActivityScreen)

**DELETE** `/activities/{id}`

**Response:**

```json
{
  "status": true,
  "message": "Activity deleted successfully"
}
```

### 1.4 Update Timer (ActivityScreen)

**POST** `/activities/{id}/timer`

**Request Body:**

```json
{
  "isRunning": true,
  "isPaused": false,
  "remainingSeconds": 2700,
  "elapsedSeconds": 900
}
```

**Response:**

```json
{
  "status": true,
  "message": "Timer updated successfully",
  "data": {
    "activity": {
      "id": "activity_123",
      "isRunning": true,
      "isPaused": false,
      "currentTimer": "00:45:00",
      "remainingSeconds": 2700,
      "elapsedSeconds": 900,
      "totalTimeSpent": 900,
      "completionPercentage": 25
    }
  }
}
```

### 1.5 Complete Activity (ActivityScreen)

**POST** `/activities/{id}/complete`

**Request Body:**

```json
{}
```

**Response:**

```json
{
  "status": true,
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
      "lastCompletedDate": "2025-08-02"
    }
  }
}
```

### 1.6 Search Activities (ActivityScreen)

**GET** `/activities/search?query={search_term}`

**Response:**

```json
{
  "status": true,
  "data": {
    "activities": [
      {
        "id": "activity_123",
        "title": "Morning Workout",
        "category": "Workout",
        "startDate": "2025-08-02",
        "endDate": "2025-08-02",
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
        "lastCompletedDate": "2025-08-01",
        "tags": ["fitness", "morning"],
        "notes": "Focus on form and consistency",
        "createdAt": "2025-08-01T08:00:00Z",
        "updatedAt": "2025-08-02T08:00:00Z"
      }
    ]
  },
  "total_count": 1
}
```

---

## 2. ActivityDetailScreen APIs

### 2.1 Get Single Activity (ActivityDetailScreen)

**GET** `/activities/{id}`

**Response:**

```json
{
  "status": true,
  "data": {
    "activity": {
      "id": "activity_123",
      "title": "Morning Workout",
      "category": "Workout",
      "startDate": "2025-08-02",
      "endDate": "2025-08-02",
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
      "lastCompletedDate": "2025-08-01",
      "tags": ["fitness", "morning"],
      "notes": "Focus on form and consistency",
      "createdAt": "2025-08-01T08:00:00Z",
      "updatedAt": "2025-08-02T08:00:00Z",
      "sessions": [
        {
          "id": "session_123",
          "activityId": "activity_123",
          "date": "2025-08-02",
          "duration": "00:45:30",
          "durationSeconds": 2730,
          "notes": "Good session today",
          "isCompleted": true,
          "createdAt": "2025-08-02T08:00:00Z"
        }
      ]
    }
  }
}
```

### 2.2 Update Activity (ActivityDetailScreen)

**PUT** `/activities/{id}`

**Request Body:**

```json
{
  "title": "Updated Morning Workout",
  "category": "Workout",
  "startDate": "2025-08-02",
  "endDate": "2025-08-02",
  "duration": "01:30:00",
  "color": "#00E5FF",
  "priority": 2,
  "tags": ["fitness", "morning", "updated"],
  "notes": "Updated focus on form and consistency"
}
```

**Response:**

```json
{
  "status": true,
  "message": "Activity updated successfully",
  "data": {
    "activity": {
      "id": "activity_123",
      "title": "Updated Morning Workout",
      "category": "Workout",
      "startDate": "2025-08-02",
      "endDate": "2025-08-02",
      "duration": "01:30:00",
      "color": "#00E5FF",
      "priority": 2,
      "isRunning": false,
      "isCompleted": false,
      "isPaused": false,
      "currentTimer": "01:30:00",
      "remainingSeconds": 5400,
      "elapsedSeconds": 0,
      "totalTimeSpent": 0,
      "completionPercentage": 0,
      "streak": 0,
      "tags": ["fitness", "morning", "updated"],
      "notes": "Updated focus on form and consistency",
      "createdAt": "2025-08-02T08:00:00Z",
      "updatedAt": "2025-08-02T09:00:00Z"
    }
  }
}
```

---

## 3. OverviewScreen APIs

### 3.1 Get Activity Statistics (OverviewScreen)

**GET** `/activities/statistics`

**Response:**

```json
{
  "status": true,
  "data": {
    "statistics": {
      "totalActivities": 10,
      "activeActivities": 3,
      "completedActivities": 5,
      "pausedActivities": 2,
      "totalTimeSpent": 18000,
      "averageCompletionTime": 3600,
      "completionRate": 50,
      "streak": 7,
      "categoriesBreakdown": [
        {
          "category": "Workout",
          "count": 4,
          "totalTime": 7200
        },
        {
          "category": "Work",
          "count": 3,
          "totalTime": 5400
        },
        {
          "category": "Personal",
          "count": 3,
          "totalTime": 5400
        }
      ],
      "weeklyProgress": [
        {
          "date": "2025-08-01",
          "activitiesCompleted": 2,
          "timeSpent": 3600
        },
        {
          "date": "2025-08-02",
          "activitiesCompleted": 3,
          "timeSpent": 5400
        }
      ],
      "monthlyProgress": [
        {
          "month": "2025-08",
          "activitiesCompleted": 15,
          "timeSpent": 27000
        }
      ]
    }
  }
}
```

---

## 4. HistoryScreen APIs

### 4.1 Get Activity Sessions (HistoryScreen)

**GET** `/activities/{id}/sessions`

**Query Parameters:**

- `limit` (optional): Number of sessions to return (default: 20, max: 100)
- `offset` (optional): Number of sessions to skip (default: 0)
- `status` (optional): Filter by status (completed, paused, interrupted)
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)

**Response:**

```json
{
  "status": true,
  "data": {
    "sessions": [
      {
        "id": "session_123",
        "activityId": "activity_123",
        "date": "2025-08-02",
        "duration": "00:45:30",
        "durationSeconds": 2730,
        "startTime": "08:00",
        "endTime": "08:45",
        "status": "completed",
        "notes": "Excellent morning workout! Hit new PR on bench press (185lbs x 8). Energy was through the roof and form felt perfect on all lifts.",
        "progress": 100,
        "calories": 450,
        "intensity": "high",
        "mood": "great",
        "isCompleted": true,
        "createdAt": "2025-08-02T08:00:00Z"
      },
      {
        "id": "session_124",
        "activityId": "activity_123",
        "date": "2025-08-01",
        "duration": "00:35:00",
        "durationSeconds": 2100,
        "startTime": "07:30",
        "endTime": "08:05",
        "status": "paused",
        "notes": "Had to pause due to work emergency. Will continue tomorrow morning.",
        "progress": 65,
        "calories": 180,
        "intensity": "medium",
        "mood": "okay",
        "isCompleted": false,
        "createdAt": "2025-08-01T07:30:00Z"
      }
    ]
  },
  "total_count": 2
}
```

### 4.2 Create Activity Session (HistoryScreen)

**POST** `/activities/{id}/sessions`

**Request Body:**

```json
{
  "duration": "00:45:30",
  "startTime": "08:00",
  "endTime": "08:45",
  "status": "completed",
  "notes": "Excellent morning workout! Hit new PR on bench press (185lbs x 8).",
  "progress": 100,
  "calories": 450,
  "intensity": "high",
  "mood": "great"
}
```

**Response:**

```json
{
  "status": true,
  "message": "Session created successfully",
  "data": {
    "session": {
      "id": "session_123",
      "activityId": "activity_123",
      "date": "2025-08-02",
      "duration": "00:45:30",
      "durationSeconds": 2730,
      "startTime": "08:00",
      "endTime": "08:45",
      "status": "completed",
      "notes": "Excellent morning workout! Hit new PR on bench press (185lbs x 8).",
      "progress": 100,
      "calories": 450,
      "intensity": "high",
      "mood": "great",
      "isCompleted": true,
      "createdAt": "2025-08-02T08:00:00Z"
    }
  }
}
```

### 4.3 Get Session Statistics (HistoryScreen)

**GET** `/activities/{id}/sessions/statistics`

**Response:**

```json
{
  "status": true,
  "data": {
    "statistics": {
      "totalSessions": 25,
      "completedSessions": 22,
      "pausedSessions": 2,
      "interruptedSessions": 1,
      "totalTimeSpent": 18000,
      "averageSessionDuration": 720,
      "completionRate": 88,
      "averageCalories": 320,
      "mostCommonIntensity": "medium",
      "mostCommonMood": "good",
      "longestStreak": 7,
      "currentStreak": 3,
      "weeklyProgress": [
        {
          "week": "2025-W01",
          "sessions": 5,
          "totalTime": 3600,
          "averageCalories": 350
        },
        {
          "week": "2025-W02",
          "sessions": 4,
          "totalTime": 2880,
          "averageCalories": 320
        }
      ]
    }
  }
}
```

---

## 5. StreakScreen APIs

### 5.1 Get Activity Streak Data (StreakScreen)

**GET** `/activities/{id}/streak`

**Query Parameters:**

- `period` (optional): Time period for streak data (week, month, year, all) - default: "month"
- `startDate` (optional): Start date for custom period (YYYY-MM-DD)
- `endDate` (optional): End date for custom period (YYYY-MM-DD)

**Response:**

```json
{
  "status": true,
  "data": {
    "streak": {
      "currentStreak": 5,
      "longestStreak": 7,
      "averageTimePerDay": 35,
      "totalDaysCompleted": 22,
      "totalDays": 30,
      "completionRate": 73.3,
      "streakDays": [
        {
          "date": "2025-08-02",
          "completed": true,
          "timeSpent": 45,
          "streak": 5,
          "sessionId": "session_123"
        },
        {
          "date": "2025-08-01",
          "completed": true,
          "timeSpent": 30,
          "streak": 4,
          "sessionId": "session_124"
        },
        {
          "date": "2025-07-31",
          "completed": true,
          "timeSpent": 20,
          "streak": 3,
          "sessionId": "session_125"
        },
        {
          "date": "2025-07-30",
          "completed": true,
          "timeSpent": 40,
          "streak": 2,
          "sessionId": "session_126"
        },
        {
          "date": "2025-07-29",
          "completed": true,
          "timeSpent": 25,
          "streak": 1,
          "sessionId": "session_127"
        },
        {
          "date": "2025-07-28",
          "completed": false,
          "timeSpent": 0,
          "streak": 0,
          "sessionId": null
        }
      ],
      "streakHistory": [
        {
          "streakId": "streak_1",
          "startDate": "2025-07-29",
          "endDate": "2025-08-02",
          "length": 5,
          "totalTime": 160,
          "averageTime": 32
        },
        {
          "streakId": "streak_2",
          "startDate": "2025-07-24",
          "endDate": "2025-07-27",
          "length": 4,
          "totalTime": 140,
          "averageTime": 35
        }
      ],
      "milestones": [
        {
          "type": "streak_length",
          "value": 7,
          "achieved": true,
          "achievedDate": "2025-07-15"
        },
        {
          "type": "total_days",
          "value": 30,
          "achieved": false,
          "currentValue": 22
        }
      ]
    }
  }
}
```

### 5.2 Get Streak Calendar (StreakScreen)

**GET** `/activities/{id}/streak/calendar`

**Query Parameters:**

- `year` (optional): Year for calendar data (default: current year)
- `month` (optional): Month for calendar data (1-12, default: current month)

**Response:**

```json
{
  "status": true,
  "data": {
    "calendar": {
      "year": 2025,
      "month": 8,
      "days": [
        {
          "date": "2025-08-01",
          "dayOfWeek": "Friday",
          "completed": true,
          "timeSpent": 30,
          "streak": 4,
          "hasSession": true
        },
        {
          "date": "2025-08-02",
          "dayOfWeek": "Saturday",
          "completed": true,
          "timeSpent": 45,
          "streak": 5,
          "hasSession": true
        },
        {
          "date": "2025-08-03",
          "dayOfWeek": "Sunday",
          "completed": false,
          "timeSpent": 0,
          "streak": 0,
          "hasSession": false
        }
      ],
      "summary": {
        "totalDays": 31,
        "completedDays": 22,
        "completionRate": 71.0,
        "totalTime": 1650,
        "averageTime": 75
      }
    }
  }
}
```

---

## 6. NotesScreen APIs

### 6.1 Get Activity Notes (NotesScreen)

**GET** `/activities/{id}/notes`

**Query Parameters:**

- `limit` (optional): Number of notes to return (default: 20, max: 100)
- `offset` (optional): Number of notes to skip (default: 0)
- `pinned` (optional): Filter by pinned status (true/false)
- `folder` (optional): Filter by folder name
- `tags` (optional): Filter by tags (comma-separated)
- `sort_by` (optional): Sort by field (created_at, updated_at, title) - default: "created_at"
- `sort_order` (optional): asc or desc - default: "desc"

**Response:**

```json
{
  "status": true,
  "data": {
    "notes": [
      {
        "id": "note_123",
        "title": "Morning Workout Progress 💪",
        "content": "Completed 3x8 bench press @ 185lbs, 3x10 squats @ 225lbs, and 3x5 deadlifts @ 275lbs. Energy level was 9/10. Felt amazing today! New PR on bench press 🎉",
        "timestamp": "2025-01-15T08:45:00Z",
        "author": "John Doe",
        "isRichText": false,
        "tags": ["workout", "progress", "strength"],
        "color": "#4ECDC4",
        "pinned": true,
        "folder": "Fitness",
        "createdAt": "2025-01-15T08:45:00Z",
        "updatedAt": "2025-01-15T08:45:00Z"
      },
      {
        "id": "note_124",
        "title": "Nutrition Plan Update",
        "content": "Updated daily nutrition plan with oatmeal breakfast, pre-workout banana, and post-workout protein shake. Targeting 180g protein, 250g carbs, 70g fat.",
        "timestamp": "2025-01-14T07:30:00Z",
        "author": "John Doe",
        "isRichText": false,
        "tags": ["nutrition", "meal-prep", "health"],
        "color": "#FF9500",
        "pinned": false,
        "folder": "Health",
        "createdAt": "2025-01-14T07:30:00Z",
        "updatedAt": "2025-01-14T07:30:00Z"
      }
    ]
  },
  "total_count": 2
}
```

### 6.2 Create Note (NotesScreen)

**POST** `/activities/{id}/notes`

**Request Body:**

```json
{
  "title": "New Workout Note",
  "content": "Today's workout was amazing! Hit new personal records.",
  "isRichText": false,
  "tags": ["workout", "progress"],
  "color": "#00E5FF",
  "pinned": false,
  "folder": "Fitness"
}
```

**Response:**

```json
{
  "status": true,
  "message": "Note created successfully",
  "data": {
    "note": {
      "id": "note_125",
      "title": "New Workout Note",
      "content": "Today's workout was amazing! Hit new personal records.",
      "timestamp": "2025-01-16T09:00:00Z",
      "author": "John Doe",
      "isRichText": false,
      "tags": ["workout", "progress"],
      "color": "#00E5FF",
      "pinned": false,
      "folder": "Fitness",
      "createdAt": "2025-01-16T09:00:00Z",
      "updatedAt": "2025-01-16T09:00:00Z"
    }
  }
}
```

### 6.3 Update Note (NotesScreen)

**PUT** `/activities/{id}/notes/{noteId}`

**Request Body:**

```json
{
  "title": "Updated Workout Note",
  "content": "Today's workout was amazing! Hit new personal records. Updated with more details.",
  "isRichText": false,
  "tags": ["workout", "progress", "updated"],
  "color": "#9C6CDA",
  "pinned": true,
  "folder": "Fitness"
}
```

**Response:**

```json
{
  "status": true,
  "message": "Note updated successfully",
  "data": {
    "note": {
      "id": "note_125",
      "title": "Updated Workout Note",
      "content": "Today's workout was amazing! Hit new personal records. Updated with more details.",
      "timestamp": "2025-01-16T09:00:00Z",
      "author": "John Doe",
      "isRichText": false,
      "tags": ["workout", "progress", "updated"],
      "color": "#9C6CDA",
      "pinned": true,
      "folder": "Fitness",
      "createdAt": "2025-01-16T09:00:00Z",
      "updatedAt": "2025-01-16T10:30:00Z"
    }
  }
}
```

### 6.4 Delete Note (NotesScreen)

**DELETE** `/activities/{id}/notes/{noteId}`

**Response:**

```json
{
  "status": true,
  "message": "Note deleted successfully"
}
```

### 6.5 Toggle Note Pin (NotesScreen)

**PATCH** `/activities/{id}/notes/{noteId}/pin`

**Request Body:**

```json
{
  "pinned": true
}
```

**Response:**

```json
{
  "status": true,
  "message": "Note pin status updated successfully",
  "data": {
    "note": {
      "id": "note_125",
      "pinned": true,
      "updatedAt": "2025-01-16T11:00:00Z"
    }
  }
}
```

### 6.6 Get Note Statistics (NotesScreen)

**GET** `/activities/{id}/notes/statistics`

**Response:**

```json
{
  "status": true,
  "data": {
    "statistics": {
      "totalNotes": 25,
      "pinnedNotes": 5,
      "totalFolders": 3,
      "totalTags": 12,
      "mostUsedTags": [
        {
          "tag": "workout",
          "count": 15
        },
        {
          "tag": "progress",
          "count": 12
        },
        {
          "tag": "nutrition",
          "count": 8
        }
      ],
      "folderBreakdown": [
        {
          "folder": "Fitness",
          "count": 15
        },
        {
          "folder": "Health",
          "count": 8
        },
        {
          "folder": "General",
          "count": 2
        }
      ],
      "colorBreakdown": [
        {
          "color": "#4ECDC4",
          "count": 8
        },
        {
          "color": "#00E5FF",
          "count": 7
        },
        {
          "color": "#FF9500",
          "count": 5
        }
      ],
      "monthlyProgress": [
        {
          "month": "2025-01",
          "notesCreated": 15,
          "notesUpdated": 8
        },
        {
          "month": "2025-02",
          "notesCreated": 10,
          "notesUpdated": 5
        }
      ]
    }
  }
}
```

---

## 7. Bulk Operations APIs

### 7.1 Bulk Update Activities

**PUT** `/activities/bulk`

**Request Body:**

```json
{
  "updates": [
    {
      "id": "activity_123",
      "data": {
        "priority": 2,
        "isCompleted": true
      }
    },
    {
      "id": "activity_124",
      "data": {
        "priority": 1,
        "isRunning": true
      }
    }
  ]
}
```

**Response:**

```json
{
  "status": true,
  "message": "Activities updated successfully",
  "data": {
    "activities": [
      {
        "id": "activity_123",
        "priority": 2,
        "isCompleted": true
      },
      {
        "id": "activity_124",
        "priority": 1,
        "isRunning": true
      }
    ]
  }
}
```

### 7.2 Delete All Activities

**DELETE** `/activities`

**Response:**

```json
{
  "status": true,
  "message": "All activities deleted successfully"
}
```

---

## Error Codes

### Activity-Specific Error Codes

- `FETCH_ACTIVITIES_FAILED`: Failed to fetch activities
- `FETCH_ACTIVITY_FAILED`: Failed to fetch single activity
- `CREATE_ACTIVITY_FAILED`: Failed to create activity
- `UPDATE_ACTIVITY_FAILED`: Failed to update activity
- `DELETE_ACTIVITY_FAILED`: Failed to delete activity
- `UPDATE_TIMER_FAILED`: Failed to update timer
- `COMPLETE_ACTIVITY_FAILED`: Failed to complete activity
- `CREATE_SESSION_FAILED`: Failed to create session
- `FETCH_SESSIONS_FAILED`: Failed to fetch sessions
- `FETCH_STATISTICS_FAILED`: Failed to fetch statistics
- `SEARCH_ACTIVITIES_FAILED`: Failed to search activities
- `FETCH_STREAK_FAILED`: Failed to fetch streak data
- `FETCH_NOTES_FAILED`: Failed to fetch notes
- `CREATE_NOTE_FAILED`: Failed to create note
- `UPDATE_NOTE_FAILED`: Failed to update note
- `DELETE_NOTE_FAILED`: Failed to delete note
- `PIN_NOTE_FAILED`: Failed to pin/unpin note
- `BULK_UPDATE_FAILED`: Failed to bulk update activities
- `DELETE_ALL_ACTIVITIES_FAILED`: Failed to delete all activities

### Common Error Codes

- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Access denied
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (422): Invalid request data
- `SERVER_ERROR` (500): Internal server error
- `NETWORK_ERROR`: Network connectivity issue

---

## Rate Limiting

- **Requests per hour**: 1000
- **Requests per minute**: 60
- **Burst limit**: 10 requests per second

## Pagination

For endpoints that return lists, pagination is supported using:

- `limit`: Number of items per page (default: 20, max: 100)
- `offset`: Number of items to skip (default: 0)

## Mock API Implementation Notes

For implementing mock APIs for the activity screens, consider the following:

1. **Use a mock server** like JSON Server, MSW (Mock Service Worker), or similar
2. **Implement all CRUD operations** for activities, sessions, notes, and streaks
3. **Add realistic delays** (200-500ms) to simulate network latency
4. **Include proper error handling** with different error scenarios
5. **Use realistic data** that matches the expected response formats
6. **Implement search and filtering** functionality
7. **Add pagination support** for list endpoints
8. **Include authentication simulation** with token validation
9. **Add rate limiting simulation** if needed
10. **Implement proper status codes** and error messages
11. **Create realistic mock data** for:
    - Activities with different states (running, completed, paused, future)
    - Session history with various statuses and metrics
    - Streak data with calendar information
    - Notes with different types and metadata
    - Statistics and analytics data

## Testing Endpoints

You can test these endpoints using tools like:

- Postman
- Insomnia
- curl
- Thunder Client (VS Code extension)
- Any REST client

Remember to include the proper authentication headers and handle the response format consistently across all endpoints.
