# Activity Hub API Documentation

## Base URL

```
https://api.activityhub.com/v1
```

## Authentication

All API requests require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication APIs

### 1.1 User Login

**POST** `/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "https://example.com/avatar.jpg"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  },
  "message": "Login successful"
}
```

### 1.2 User Registration

**POST** `/auth/register`

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securepassword123",
  "confirmPassword": "securepassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  },
  "message": "Registration successful"
}
```

### 1.3 Forgot Password

**POST** `/auth/forgot-password`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### 1.4 Verify OTP

**POST** `/auth/verify-otp`

**Request Body:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "resetToken": "reset_token_here"
  },
  "message": "OTP verified successfully"
}
```

### 1.5 Reset Password

**POST** `/auth/reset-password`

**Request Body:**

```json
{
  "resetToken": "reset_token_here",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 2. Activity Management APIs

### 2.1 Get All Activities

**GET** `/activities`

**Query Parameters:**

- `category` (optional): Filter by category (Workout, Work, Personal)
- `status` (optional): Filter by status (active, completed, future)
- `sortBy` (optional): Sort by (recent, priority, duration, completion)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

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
        "remainingSeconds": 2730,
        "completionPercentage": 25,
        "elapsedSeconds": 870,
        "totalTimeSpent": 870,
        "streak": 7,
        "lastStartTime": 1703123456789,
        "isCompleted": false,
        "isPaused": false,
        "isFuture": false,
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  },
  "message": "Activities retrieved successfully"
}
```

### 2.2 Create Activity

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
      "currentTimer": "01:00:00",
      "remainingSeconds": 3600,
      "completionPercentage": 0,
      "elapsedSeconds": 0,
      "totalTimeSpent": 0,
      "streak": 0,
      "isCompleted": false,
      "isPaused": false,
      "isFuture": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  },
  "message": "Activity created successfully"
}
```

### 2.3 Update Activity

**PUT** `/activities/:id`

**Request Body:**

```json
{
  "title": "Updated Activity",
  "category": "Work",
  "startDate": "2025/08/03",
  "endDate": "2025/08/03",
  "duration": "00:30:00",
  "color": "#9C6CDA",
  "priority": 2
}
```

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
      "currentTimer": "00:30:00",
      "remainingSeconds": 1800,
      "completionPercentage": 0,
      "elapsedSeconds": 0,
      "totalTimeSpent": 0,
      "streak": 0,
      "isCompleted": false,
      "isPaused": false,
      "isFuture": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  },
  "message": "Activity updated successfully"
}
```

### 2.4 Delete Activity

**DELETE** `/activities/:id`

**Response:**

```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

### 2.5 Get Activity Details

**GET** `/activities/:id`

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
      "currentTimer": "00:45:30",
      "remainingSeconds": 2730,
      "completionPercentage": 25,
      "elapsedSeconds": 870,
      "totalTimeSpent": 870,
      "streak": 7,
      "lastStartTime": 1703123456789,
      "isCompleted": false,
      "isPaused": false,
      "isFuture": false,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  },
  "message": "Activity details retrieved successfully"
}
```

---

## 3. Timer Management APIs

### 3.1 Start Timer

**POST** `/activities/:id/start`

**Response:**

```json
{
  "success": true,
  "data": {
    "activity": {
      "id": "activity_123",
      "isRunning": true,
      "lastStartTime": 1703123456789,
      "currentTimer": "00:45:30",
      "remainingSeconds": 2730
    }
  },
  "message": "Timer started successfully"
}
```

### 3.2 Pause Timer

**POST** `/activities/:id/pause`

**Response:**

```json
{
  "success": true,
  "data": {
    "activity": {
      "id": "activity_123",
      "isRunning": false,
      "isPaused": true,
      "currentTimer": "00:45:30",
      "remainingSeconds": 2730,
      "totalTimeSpent": 870
    }
  },
  "message": "Timer paused successfully"
}
```

### 3.3 Resume Timer

**POST** `/activities/:id/resume`

**Response:**

```json
{
  "success": true,
  "data": {
    "activity": {
      "id": "activity_123",
      "isRunning": true,
      "isPaused": false,
      "lastStartTime": 1703123456789
    }
  },
  "message": "Timer resumed successfully"
}
```

### 3.4 Stop Timer

**POST** `/activities/:id/stop`

**Response:**

```json
{
  "success": true,
  "data": {
    "activity": {
      "id": "activity_123",
      "isRunning": false,
      "isCompleted": true,
      "completionPercentage": 100,
      "totalTimeSpent": 3600,
      "streak": 8,
      "lastCompletedDate": "2025/08/02"
    }
  },
  "message": "Activity completed successfully"
}
```

---

## 4. Statistics & Analytics APIs

### 4.1 Get Activity Statistics

**GET** `/analytics/activities`

**Query Parameters:**

- `period` (optional): Time period (today, week, month, year)
- `category` (optional): Filter by category

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalActivities": 25,
      "activeActivities": 3,
      "completedActivities": 18,
      "completionRate": 72,
      "totalTimeSpent": "45:30:15",
      "averageStreak": 5.2
    },
    "categoryBreakdown": [
      {
        "category": "Workout",
        "count": 10,
        "completionRate": 80,
        "totalTime": "15:20:30"
      },
      {
        "category": "Work",
        "count": 8,
        "completionRate": 75,
        "totalTime": "20:15:45"
      },
      {
        "category": "Personal",
        "count": 7,
        "completionRate": 65,
        "totalTime": "9:54:00"
      }
    ],
    "streakData": {
      "currentStreak": 7,
      "longestStreak": 15,
      "averageStreak": 5.2,
      "streakHistory": [
        {
          "date": "2025-08-01",
          "streak": 5
        },
        {
          "date": "2025-08-02",
          "streak": 6
        }
      ]
    },
    "timeDistribution": {
      "daily": [
        {
          "date": "2025-08-01",
          "timeSpent": 1800
        },
        {
          "date": "2025-08-02",
          "timeSpent": 2400
        }
      ],
      "weekly": [
        {
          "week": "2025-W31",
          "timeSpent": 12600
        }
      ]
    }
  },
  "message": "Analytics retrieved successfully"
}
```

### 4.2 Get User Profile Stats

**GET** `/analytics/profile`

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "user@example.com",
      "joinDate": "2024-01-01T00:00:00Z",
      "totalActivities": 150,
      "totalTimeSpent": "120:45:30",
      "longestStreak": 25,
      "currentStreak": 7,
      "favoriteCategory": "Workout",
      "achievements": [
        {
          "id": "achievement_1",
          "name": "First Activity",
          "description": "Complete your first activity",
          "earnedAt": "2024-01-02T00:00:00Z"
        }
      ]
    }
  },
  "message": "Profile stats retrieved successfully"
}
```

---

## 5. Task Management APIs

### 5.1 Get All Tasks

**GET** `/tasks`

**Query Parameters:**

- `status` (optional): Filter by status (pending, in_progress, completed)
- `priority` (optional): Filter by priority (low, medium, high)
- `category` (optional): Filter by category

**Response:**

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_123",
        "title": "Complete Project",
        "description": "Finish the React Native project",
        "category": "Work",
        "priority": "high",
        "status": "in_progress",
        "dueDate": "2025-08-15T00:00:00Z",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 30,
      "totalPages": 2
    }
  },
  "message": "Tasks retrieved successfully"
}
```

### 5.2 Create Task

**POST** `/tasks`

**Request Body:**

```json
{
  "title": "New Task",
  "description": "Task description",
  "category": "Work",
  "priority": "medium",
  "dueDate": "2025-08-15T00:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task_123",
      "title": "New Task",
      "description": "Task description",
      "category": "Work",
      "priority": "medium",
      "status": "pending",
      "dueDate": "2025-08-15T00:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  },
  "message": "Task created successfully"
}
```

---

## 6. Settings APIs

### 6.1 Get User Settings

**GET** `/settings`

**Response:**

```json
{
  "success": true,
  "data": {
    "settings": {
      "notifications": {
        "enabled": true,
        "reminders": true,
        "achievements": true,
        "streakAlerts": true
      },
      "appearance": {
        "theme": "dark",
        "accentColor": "#00E5FF",
        "compactMode": false
      },
      "privacy": {
        "shareStats": false,
        "publicProfile": false
      }
    }
  },
  "message": "Settings retrieved successfully"
}
```

### 6.2 Update User Settings

**PUT** `/settings`

**Request Body:**

```json
{
  "notifications": {
    "enabled": true,
    "reminders": true,
    "achievements": true,
    "streakAlerts": true
  },
  "appearance": {
    "theme": "dark",
    "accentColor": "#00E5FF",
    "compactMode": false
  },
  "privacy": {
    "shareStats": false,
    "publicProfile": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "settings": {
      "notifications": {
        "enabled": true,
        "reminders": true,
        "achievements": true,
        "streakAlerts": true
      },
      "appearance": {
        "theme": "dark",
        "accentColor": "#00E5FF",
        "compactMode": false
      },
      "privacy": {
        "shareStats": false,
        "publicProfile": false
      }
    }
  },
  "message": "Settings updated successfully"
}
```

---

## Error Responses

All APIs return consistent error responses:

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "Email is required"
    }
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong"
  }
}
```

---

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **Activity/Task endpoints**: 100 requests per minute
- **Analytics endpoints**: 30 requests per minute
- **Settings endpoints**: 20 requests per minute

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## WebSocket Events (Real-time Updates)

### Connection

```
wss://api.activityhub.com/v1/ws
```

### Events

#### Timer Updates

```json
{
  "type": "timer_update",
  "data": {
    "activityId": "activity_123",
    "currentTimer": "00:45:30",
    "remainingSeconds": 2730,
    "isRunning": true
  }
}
```

#### Activity Status Changes

```json
{
  "type": "activity_status_change",
  "data": {
    "activityId": "activity_123",
    "status": "completed",
    "completionPercentage": 100,
    "streak": 8
  }
}
```

#### Streak Updates

```json
{
  "type": "streak_update",
  "data": {
    "activityId": "activity_123",
    "newStreak": 8,
    "previousStreak": 7
  }
}
```
