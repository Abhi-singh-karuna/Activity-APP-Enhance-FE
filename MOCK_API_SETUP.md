# Mock API Integration Setup Guide

## Overview

This guide explains how to set up and use the mock API integration for the Activity App. The app has been completely refactored to use a clean, well-structured API architecture that can easily switch between mock and real servers.

## 🚀 Quick Start

### 1. Update Mock Server URL

Edit `src/config/api.ts` and update the mock server URL:

```typescript
MOCK_SERVER: {
  baseURL: "https://your-actual-mock-server.com/api", // Replace with your mock server URL
  timeout: 10000,
},
```

### 2. Import Postman Collection

Import the provided Postman collection (`001 - Activity App [ MOCK ] API.postman_collection.json`) into your Postman app.

### 3. Set Environment Variables

In Postman, create an environment with these variables:

- `baseUrl`: Your mock server base URL
- `accessToken`: Will be automatically set after login
- `refreshToken`: Will be automatically set after login

## 📁 Project Structure

```
src/
├── api/
│   ├── apiClient.ts          # Core API client with interceptors
│   ├── index.ts              # Service exports
│   └── services/
│       ├── authService.ts    # Authentication APIs
│       ├── activityService.ts # Activity management APIs
│       ├── taskService.ts    # Task management APIs
│       ├── statsService.ts   # Statistics APIs
│       ├── settingsService.ts # Settings APIs
│       └── appService.ts     # App management APIs
├── config/
│   └── api.ts               # API configuration
└── context/
    └── AppContext.tsx       # Updated to use new API services
```

## 🔧 API Architecture

### Core Components

#### 1. API Client (`apiClient.ts`)

- **Axios Instance**: Configured with interceptors
- **Token Management**: Automatic token refresh
- **Error Handling**: Centralized error processing
- **Request/Response Interceptors**: Auth headers, error handling

#### 2. Service Layer

Each service follows the same pattern:

```typescript
export const serviceName = async (params): Promise<ApiResponse<T>> => {
  try {
    const response = await apiRequest({
      method: "GET/POST/PUT/DELETE",
      url: "/endpoint",
      data: params,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: {
        code: "ERROR_CODE",
        message: "User-friendly error message",
      },
    };
  }
};
```

#### 3. Type Safety

All API responses are typed with TypeScript interfaces:

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

## 📱 Screen Integration

### Login Screen

- ✅ Integrated with `authService.login()`
- ✅ Proper error handling
- ✅ Token storage
- ✅ Navigation on success

### App Context

- ✅ Updated to use new API services
- ✅ Settings management
- ✅ Authentication state
- ✅ Data persistence

## 🔄 Available APIs

### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/forgot-password` - Password reset
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout
- `GET /users/profile` - Get user profile

### Activities

- `GET /activities` - Get all activities
- `POST /activities` - Create activity
- `PUT /activities/:id` - Update activity
- `DELETE /activities/:id` - Delete activity
- `POST /activities/:id/start` - Start timer
- `POST /activities/:id/stop` - Stop timer
- `POST /activities/:id/complete` - Complete activity

### Tasks

- `GET /tasks` - Get all tasks
- `POST /tasks` - Create task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `PUT /tasks/:id/toggle` - Toggle completion

### Statistics

- `GET /stats` - Get statistics data

### Settings

- `GET /settings` - Get user settings
- `PUT /settings` - Update user settings
- `GET /settings/categories` - Get categories
- `PUT /settings/categories` - Update categories
- `GET /settings/skip-reasons` - Get skip reasons
- `PUT /settings/skip-reasons` - Update skip reasons
- `GET /settings/skip-day-entries` - Get skip day entries
- `POST /settings/skip-day-entries` - Add skip day entry
- `PUT /settings/skip-day-entries/:id` - Update skip day entry
- `DELETE /settings/skip-day-entries/:id` - Delete skip day entry

### App Management

- `GET /app/init` - Initialize app
- `GET /app/updates` - Check for updates
- `GET /app/announcements` - Get announcements
- `POST /app/announcements/acknowledge` - Acknowledge announcement
- `GET /app/maintenance` - Check maintenance status
- `POST /app/feedback` - Send feedback
- `POST /app/errors` - Log errors
- `GET /app/config` - Get remote config

## 🛠️ Usage Examples

### Login

```typescript
import { authService } from "../api";

const handleLogin = async () => {
  const response = await authService.login({
    email: "user@example.com",
    password: "password123",
  });

  if (response.success) {
    // Navigate to main app
  } else {
    // Show error message
    console.error(response.error?.message);
  }
};
```

### Get Activities

```typescript
import { activityService } from "../api";

const loadActivities = async () => {
  const response = await activityService.getActivities({
    date: "2024/01/15",
    category: "Work",
  });

  if (response.success) {
    setActivities(response.data?.activities || []);
  }
};
```

### Create Task

```typescript
import { taskService } from "../api";

const createNewTask = async () => {
  const response = await taskService.createTask({
    title: "New Task",
    description: "Task description",
    category: "Work",
    dueDate: "2024/01/20",
    color: "#5B86E5",
    priority: 1,
  });

  if (response.success) {
    // Task created successfully
  }
};
```

## 🔧 Configuration

### Environment Switching

Edit `src/config/api.ts` to switch between environments:

```typescript
export const getApiConfig = () => {
  const environment = process.env.NODE_ENV || "development";

  switch (environment) {
    case "production":
      return API_CONFIG.PRODUCTION;
    case "development":
      return API_CONFIG.DEVELOPMENT;
    default:
      return API_CONFIG.MOCK_SERVER; // Default to mock server
  }
};
```

### Error Handling

The API client includes comprehensive error handling:

- Network errors
- Authentication errors
- Server errors
- Validation errors
- Timeout errors

### Token Management

- Automatic token refresh
- Secure token storage
- Logout cleanup

## 🧪 Testing

### Mock Server Testing

1. Start your mock server
2. Update the base URL in `src/config/api.ts`
3. Test all endpoints using the Postman collection
4. Verify error handling with invalid requests

### Error Scenarios

- Network connectivity issues
- Invalid credentials
- Server errors
- Token expiration
- Validation errors

## 📝 Next Steps

### For Real API Integration

1. Update `src/config/api.ts` with your production server URL
2. Ensure all endpoints match your backend API
3. Test authentication flow
4. Verify all CRUD operations
5. Test error scenarios

### For Additional Features

1. Add new services for additional features
2. Extend TypeScript interfaces
3. Add new API endpoints
4. Implement caching if needed
5. Add offline support

## 🐛 Troubleshooting

### Common Issues

1. **Network Error**: Check mock server URL and connectivity
2. **Authentication Error**: Verify login credentials and token handling
3. **CORS Error**: Ensure mock server allows requests from your app
4. **TypeScript Errors**: Check interface definitions match API responses

### Debug Tips

- Check console logs for API errors
- Use Postman to test endpoints directly
- Verify token storage in AsyncStorage
- Check network tab for request/response details

## 📚 Additional Resources

- [Axios Documentation](https://axios-http.com/)
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

This integration provides a solid foundation for your Activity App with clean architecture, proper error handling, and easy switching between mock and real APIs.
