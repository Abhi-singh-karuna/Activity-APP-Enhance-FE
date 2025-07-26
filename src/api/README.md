# Time Tracker App - API Integration

This directory contains the API integration for the Time Tracker App. The API services are organized into separate modules for better maintainability and separation of concerns.

## API Structure

- **index.ts**: Main entry point that exports all API services
- **services/**: Directory containing individual service modules
  - **authService.ts**: Authentication-related API endpoints (login, register, logout)
  - **settingsService.ts**: User settings and preferences API endpoints
  - **appService.ts**: App initialization and general app-related API endpoints

## Usage

Import the API modules in your components/screens:

```typescript
import api from "../api";

// Authentication
await api.auth.login({ email, password });
await api.auth.logout();

// Settings
const settings = await api.settings.getUserSettings();
await api.settings.updateFontSizeScale(1.2);

// App initialization
await api.app.initializeApp();
```

## API Configuration

The base URL for API endpoints is configured in each service file. Update the `API_BASE_URL` constant in each service file to point to your actual API endpoint:

```typescript
// Define base URL for the API
const API_BASE_URL = "https://your-api-endpoint.com/api"; // Replace with your actual API endpoint
```

## Authentication Flow

The API integration includes automatic token handling:

1. `login()` stores the authentication token in AsyncStorage
2. Request interceptors automatically attach the token to all subsequent requests
3. Response interceptors handle 401 errors with token refresh
4. `logout()` clears the token from AsyncStorage

## Offline Support

All API services include offline fallback support:

1. Data is cached in AsyncStorage when API calls are successful
2. If the API is unreachable, cached data is used as a fallback
3. User operations (create, update, delete) are still possible offline and stored locally

## API Response Format

All API endpoints return responses in a consistent format:

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
```

## Adding New API Services

To add a new API service:

1. Create a new file in the `services/` directory
2. Follow the existing pattern with interceptors and error handling
3. Export your service functions
4. Add the service to the main `index.ts` export

## Error Handling

The API integration includes comprehensive error handling:

1. All API calls are wrapped in try/catch blocks
2. Network errors fall back to local storage when possible
3. Authentication errors trigger logout when appropriate
4. Console logging for debugging purposes
