# Activity App - API Specification

## Overview

This document outlines all the APIs required for the Activity App. The app currently uses mock data, but these APIs should be implemented on your backend server.

## Base URL

```
https://your-api-domain.com/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## 1. Authentication APIs

### 1.1 User Login

**POST** `/auth/login`

**Payload:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "12345",
      "email": "user@example.com",
      "name": "Demo User",
      "isVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

### 1.2 User Registration

**POST** `/auth/register`

**Payload:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "new-user-123",
      "email": "john@example.com",
      "name": "John Doe",
      "isVerified": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

### 1.3 Forgot Password

**POST** `/auth/forgot-password`

**Payload:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

### 1.4 Refresh Token

**POST** `/auth/refresh`

**Payload:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### 1.5 Logout

**POST** `/auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 1.6 Get User Profile

**GET** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "12345",
    "email": "user@example.com",
    "name": "Demo User",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 2. Activity Management APIs

### 2.1 Get All Activities

**GET** `/api/activities`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `date` (optional): Filter by date (YYYY/MM/DD)
- `category` (optional): Filter by category
- `status` (optional): Filter by status (running, completed, future)

**Response:**

```json
{
  "success": true,
  "activities": [
    {
      "id": "1",
      "title": "Gym",
      "category": "Personal",
      "startDate": "2024/01/15",
      "endDate": "2024/01/15",
      "duration": "01:30:00",
      "color": "#00E5FF",
      "elapsedSeconds": 0,
      "priority": 1,
      "isRunning": false,
      "isCompleted": false
    }
  ]
}
```

### 2.2 Create Activity

**POST** `/api/activities`

**Headers:** `Authorization: Bearer <token>`

**Payload:**

```json
{
  "title": "New Activity",
  "category": "Work",
  "startDate": "2024/01/15",
  "endDate": "2024/01/15",
  "duration": "02:00:00",
  "color": "#5B86E5",
  "priority": 1
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "new-activity-123",
    "title": "New Activity",
    "category": "Work",
    "startDate": "2024/01/15",
    "endDate": "2024/01/15",
    "duration": "02:00:00",
    "color": "#5B86E5",
    "priority": 1,
    "elapsedSeconds": 0,
    "isRunning": false,
    "isCompleted": false
  },
  "message": "Activity created successfully"
}
```

### 2.3 Update Activity

**PUT** `/api/activities/{id}`

**Headers:** `Authorization: Bearer <token>`

**Payload:** Same as Create Activity

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Updated Activity",
    "category": "Work",
    "startDate": "2024/01/15",
    "endDate": "2024/01/15",
    "duration": "02:00:00",
    "color": "#5B86E5",
    "priority": 1,
    "elapsedSeconds": 0,
    "isRunning": false,
    "isCompleted": false
  },
  "message": "Activity updated successfully"
}
```

### 2.4 Delete Activity

**DELETE** `/api/activities/{id}`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

### 2.5 Start Activity Timer

**POST** `/api/activities/{id}/start`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Activity timer started",
  "data": {
    "startTime": "2024-01-15T10:00:00Z",
    "isRunning": true
  }
}
```

### 2.6 Stop Activity Timer

**POST** `/api/activities/{id}/stop`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Activity timer stopped",
  "data": {
    "endTime": "2024-01-15T11:30:00Z",
    "elapsedSeconds": 5400,
    "isRunning": false
  }
}
```

### 2.7 Complete Activity

**POST** `/api/activities/{id}/complete`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Activity marked as completed",
  "data": {
    "isCompleted": true,
    "completedAt": "2024-01-15T11:30:00Z"
  }
}
```

---

## 3. Task Management APIs

### 3.1 Get All Tasks

**GET** `/api/tasks`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `date` (optional): Filter by due date (YYYY/MM/DD)
- `status` (optional): Filter by status (completed, pending, overdue)
- `category` (optional): Filter by category

**Response:**

```json
{
  "success": true,
  "tasks": [
    {
      "id": "1",
      "title": "Complete project proposal",
      "description": "Finalize the project proposal for the client meeting",
      "category": "Work",
      "dueDate": "2024/01/17",
      "isCompleted": false,
      "color": "#5B86E5",
      "priority": 1,
      "createdAt": "2024/01/12"
    }
  ]
}
```

### 3.2 Create Task

**POST** `/api/tasks`

**Headers:** `Authorization: Bearer <token>`

**Payload:**

```json
{
  "title": "New Task",
  "description": "Task description",
  "category": "Work",
  "dueDate": "2024/01/20",
  "color": "#5B86E5",
  "priority": 1
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "new-task-123",
    "title": "New Task",
    "description": "Task description",
    "category": "Work",
    "dueDate": "2024/01/20",
    "isCompleted": false,
    "color": "#5B86E5",
    "priority": 1,
    "createdAt": "2024/01/15"
  },
  "message": "Task created successfully"
}
```

### 3.3 Update Task

**PUT** `/api/tasks/{id}`

**Headers:** `Authorization: Bearer <token>`

**Payload:** Same as Create Task

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Updated Task",
    "description": "Updated description",
    "category": "Work",
    "dueDate": "2024/01/20",
    "isCompleted": false,
    "color": "#5B86E5",
    "priority": 1,
    "createdAt": "2024/01/12"
  },
  "message": "Task updated successfully"
}
```

### 3.4 Delete Task

**DELETE** `/api/tasks/{id}`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

### 3.5 Toggle Task Completion

**PUT** `/api/tasks/{id}/toggle`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "isCompleted": true,
    "completedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Task completion status updated"
}
```

---

## 4. Statistics APIs

### 4.1 Get Statistics

**GET** `/api/stats`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `period` (required): Time period (yesterday, last_week, last_month, this_year, custom)
- `startDate` (optional): Start date for custom period (YYYY-MM-DD)
- `endDate` (optional): End date for custom period (YYYY-MM-DD)

**Response:**

```json
{
  "success": true,
  "data": {
    "totalHours": "26:50:32",
    "billableHours": "05:00:20",
    "billablePercentage": "33.04%",
    "completionRates": [
      {
        "category": "Sport",
        "percentage": 30
      },
      {
        "category": "Work",
        "percentage": 63
      }
    ],
    "dailyStats": [
      {
        "day": "MON",
        "hours": 4.5
      },
      {
        "day": "TUE",
        "hours": 3.2
      }
    ],
    "taskStats": {
      "completed": 15,
      "pending": 8,
      "overdue": 3,
      "total": 26
    },
    "taskCompletionByDay": [
      {
        "day": "MON",
        "completed": 3,
        "total": 4
      },
      {
        "day": "TUE",
        "completed": 2,
        "total": 3
      }
    ],
    "taskCompletionByCategory": [
      {
        "category": "Personal",
        "percentage": 75
      },
      {
        "category": "Work",
        "percentage": 45
      }
    ]
  }
}
```

---

## 5. Settings APIs

### 5.1 Get User Settings

**GET** `/settings`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "notificationsEnabled": true,
    "darkModeEnabled": true,
    "soundEnabled": true,
    "language": "en",
    "timeFormat": "24h",
    "dateFormat": "YYYY/MM/DD"
  }
}
```

### 5.2 Update User Settings

**PUT** `/settings`

**Headers:** `Authorization: Bearer <token>`

**Payload:**

```json
{
  "notificationsEnabled": true,
  "darkModeEnabled": false,
  "soundEnabled": true,
  "language": "en",
  "timeFormat": "24h",
  "dateFormat": "YYYY/MM/DD"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

### 5.3 Get Categories

**GET** `/settings/categories`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": ["Personal", "Work", "Workout", "Education", "Entertainment"]
}
```

### 5.4 Update Categories

**PUT** `/settings/categories`

**Headers:** `Authorization: Bearer <token>`

**Payload:**

```json
{
  "categories": ["Personal", "Work", "Workout", "Education", "Entertainment"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Categories updated successfully"
}
```

### 5.5 Get Skip Reasons

**GET** `/settings/skip-reasons`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": ["Sick", "Vacation", "Holiday", "Personal Day", "Emergency"]
}
```

### 5.6 Update Skip Reasons

**PUT** `/settings/skip-reasons`

**Headers:** `Authorization: Bearer <token>`

**Payload:**

```json
{
  "skipReasons": ["Sick", "Vacation", "Holiday", "Personal Day", "Emergency"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Skip reasons updated successfully"
}
```

### 5.7 Get Skip Day Entries

**GET** `/settings/skip-day-entries`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "sick-entry",
      "reason": "Sick",
      "dates": [
        {
          "date": "2024-01-15",
          "note": "Morning doctor appointment"
        }
      ],
      "generalNote": "Taking time off due to illness"
    }
  ]
}
```

### 5.8 Add Skip Day Entry

**POST** `/settings/skip-day-entries`

**Headers:** `Authorization: Bearer <token>`

**Payload:**

```json
{
  "reason": "Sick",
  "dates": [
    {
      "date": "2024-01-15",
      "note": "Morning doctor appointment"
    }
  ],
  "generalNote": "Taking time off due to illness"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "new-entry-123",
    "reason": "Sick",
    "dates": [
      {
        "date": "2024-01-15",
        "note": "Morning doctor appointment"
      }
    ],
    "generalNote": "Taking time off due to illness"
  },
  "message": "Skip day entry added successfully"
}
```

### 5.9 Update Skip Day Entry

**PUT** `/settings/skip-day-entries/{id}`

**Headers:** `Authorization: Bearer <token>`

**Payload:** Same as Add Skip Day Entry

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "sick-entry",
    "reason": "Sick",
    "dates": [
      {
        "date": "2024-01-15",
        "note": "Updated note"
      }
    ],
    "generalNote": "Updated general note"
  },
  "message": "Skip day entry updated successfully"
}
```

### 5.10 Delete Skip Day Entry

**DELETE** `/settings/skip-day-entries/{id}`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Skip day entry deleted successfully"
}
```

### 5.11 Clear All User Data

**POST** `/settings/clear-data`

**Headers:** `Authorization: Bearer <token>`

**Payload:**

```json
{
  "password": "userpassword"
}
```

**Response:**

```json
{
  "success": true,
  "message": "All user data cleared successfully"
}
```

### 5.12 Delete User Account

**DELETE** `/settings/account`

**Headers:** `Authorization: Bearer <token>`

**Payload:**

```json
{
  "password": "userpassword"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User account deleted successfully"
}
```

---

## 6. App Management APIs

### 6.1 Initialize App

**GET** `/app/init`

**Response:**

```json
{
  "success": true,
  "data": {
    "appVersion": "1.0.0",
    "serverVersion": "1.0.0",
    "updates": {
      "available": false,
      "required": false,
      "url": null
    },
    "maintenance": {
      "active": false,
      "message": null,
      "estimatedEndTime": null
    },
    "announcements": []
  }
}
```

### 6.2 Check for Updates

**GET** `/app/updates`

**Response:**

```json
{
  "success": true,
  "updates": {
    "available": false,
    "required": false,
    "url": null
  }
}
```

### 6.3 Get Announcements

**GET** `/app/announcements`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "announcement-123",
      "title": "New Feature",
      "message": "We've added new features!",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-12-31T23:59:59Z",
      "priority": "medium",
      "acknowledge": false
    }
  ]
}
```

### 6.4 Acknowledge Announcement

**POST** `/app/announcements/acknowledge`

**Payload:**

```json
{
  "announcementId": "announcement-123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Announcement acknowledged"
}
```

### 6.5 Check Maintenance Status

**GET** `/app/maintenance`

**Response:**

```json
{
  "success": true,
  "maintenance": {
    "active": false,
    "message": null,
    "estimatedEndTime": null
  }
}
```

### 6.6 Send Feedback

**POST** `/app/feedback`

**Payload:**

```json
{
  "rating": 5,
  "message": "Great app!",
  "contactEmail": "user@example.com",
  "category": "general"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Feedback submitted successfully"
}
```

### 6.7 Log Error

**POST** `/app/errors`

**Payload:**

```json
{
  "message": "Error message",
  "stack": "Error stack trace",
  "context": {
    "screen": "ActivityScreen",
    "action": "startTimer"
  }
}
```

**Response:**

```json
{
  "success": true
}
```

### 6.8 Get Remote Configuration

**GET** `/app/config`

**Response:**

```json
{
  "success": true,
  "data": {
    "maxActivitiesPerDay": 10,
    "maxTasksPerDay": 20,
    "defaultTimerDuration": 25,
    "enableNotifications": true,
    "enableSound": true
  }
}
```

---

## Error Responses

All APIs can return the following error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Common Error Codes:

- `INVALID_CREDENTIALS`: Wrong email/password
- `UNAUTHORIZED`: Missing or invalid token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `SERVER_ERROR`: Internal server error
- `MAINTENANCE`: Server under maintenance

---

## API Summary by Page

| Page           | APIs Count | Endpoints                                                  |
| -------------- | ---------- | ---------------------------------------------------------- |
| LoginScreen    | 6          | login, register, forgot-password, refresh, logout, profile |
| ActivityScreen | 7          | CRUD activities + timer controls                           |
| TaskScreen     | 5          | CRUD tasks + toggle completion                             |
| StatsScreen    | 1          | get statistics                                             |
| SettingsScreen | 10         | settings, categories, skip reasons, skip entries, account  |
| SplashScreen   | 7          | app management                                             |

**Total: 36 APIs**

---

## Implementation Notes

1. **Authentication**: Use JWT tokens with refresh token mechanism
2. **Rate Limiting**: Implement rate limiting for all endpoints
3. **Validation**: Validate all input data on the server side
4. **Error Handling**: Return consistent error responses
5. **CORS**: Configure CORS for mobile app access
6. **Security**: Use HTTPS, validate tokens, sanitize inputs
7. **Database**: Use proper indexing for date-based queries
8. **Caching**: Cache frequently accessed data like settings
9. **Logging**: Log all API requests and errors
10. **Monitoring**: Monitor API performance and uptime
