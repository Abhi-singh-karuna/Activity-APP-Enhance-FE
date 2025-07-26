# Activity App - React Native Frontend

A comprehensive time tracking and task management application built with React Native and Expo.

## Features

- **Activity Tracking**: Create, start, stop, and complete activities with timer functionality
- **Task Management**: Create, update, and track tasks with due dates and priorities
- **Statistics Dashboard**: View detailed analytics of your productivity
- **Settings & Customization**: Font scaling, categories, skip day entries, and more
- **Mock API Integration**: Fully functional with Postman mock server

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or Expo Go app)

### Installation

1. **Clone the repository and install dependencies:**

```bash
npm install
```

2. **Start the development server:**

```bash
npm start
```

3. **Run on your preferred platform:**

- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Press `w` for Web
- Scan QR code with Expo Go app

## Mock API Configuration

The app is configured to use a Postman mock server. The API configuration is in `src/config/api.ts`:

```typescript
MOCK_SERVER: {
  baseURL: "https://79ed90f2-b33a-4387-9043-861ee3ca954a.mock.pstmn.io/api",
  timeout: 15000,
}
```

### Testing with Mock API

1. Import the Postman collection (`001 - Activity App [ MOCK ] API - Complete.postman_collection.json`) into Postman
2. The app will automatically connect to the mock server
3. All API endpoints return realistic mock data for testing

## Project Structure

```
src/
├── api/                    # API services and client
│   ├── services/          # Feature-specific API services
│   ├── apiClient.ts       # HTTP client configuration
│   └── index.ts           # API exports
├── components/            # Reusable UI components
│   ├── AddActivityModal.tsx
│   ├── AddTaskModal.tsx
│   ├── DatePicker.tsx
│   ├── SkipDayList.tsx
│   ├── StyledText.tsx
│   └── Toast.tsx
├── config/               # App configuration
│   └── api.ts           # API endpoints and settings
├── context/             # React context providers
│   └── AppContext.tsx   # Global state management
├── navigation/          # Navigation setup
│   └── index.tsx        # Stack navigator configuration
├── screens/             # Screen components (organized by feature)
│   ├── auth/           # Authentication screens
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   ├── OTPVerificationScreen.tsx
│   │   ├── ResetPasswordScreen.tsx
│   │   └── index.ts
│   ├── core/           # Core application screens
│   │   ├── SplashScreen.tsx
│   │   └── index.ts
│   ├── activity/       # Activity management screens
│   │   ├── ActivityScreen.tsx
│   │   ├── ActivityDetailScreen.tsx
│   │   └── index.ts
│   ├── task/           # Task management screens
│   │   ├── TaskScreen.tsx
│   │   ├── TaskDetailScreen.tsx
│   │   └── index.ts
│   ├── analytics/      # Analytics and statistics screens
│   │   ├── StatsScreen.tsx
│   │   └── index.ts
│   ├── settings/       # Settings and configuration screens
│   │   ├── SettingsScreen.tsx
│   │   └── index.ts
│   └── index.ts        # Main screens export
├── types/              # TypeScript type definitions
│   └── index.ts
└── ReactotronConfig.ts # Development debugging
```

## Screen Organization

The screens are organized into logical groups for better maintainability:

### 🔐 Authentication (`src/screens/auth/`)

- **LoginScreen**: User login with email/password
- **SignupScreen**: New user registration
- **ForgotPasswordScreen**: Password recovery flow
- **OTPVerificationScreen**: OTP verification for password reset
- **ResetPasswordScreen**: New password setup

### 🚀 Core (`src/screens/core/`)

- **SplashScreen**: App initialization and loading

### ⏱️ Activity Management (`src/screens/activity/`)

- **ActivityScreen**: Main activity list with timer controls
- **ActivityDetailScreen**: Detailed activity view and editing

### 📋 Task Management (`src/screens/task/`)

- **TaskScreen**: Task list with creation and management
- **TaskDetailScreen**: Detailed task view and editing

### 📊 Analytics (`src/screens/analytics/`)

- **StatsScreen**: Productivity statistics and insights

### ⚙️ Settings (`src/screens/settings/`)

- **SettingsScreen**: App configuration and preferences

## Key Components

- **AppContext**: Global state management for settings, authentication, and data
- **API Services**: Modular services for auth, activities, tasks, stats, and settings
- **Navigation**: Stack-based navigation with TypeScript support
- **Mock Integration**: Complete API layer with fallback handling

## Development Features

- TypeScript support
- Reactotron debugging (development only)
- Error boundaries and fallback handling
- Responsive font scaling
- Production-ready architecture
- Organized screen structure for better maintainability

## Running in Production

To switch from mock to production API:

1. Update `src/config/api.ts` to point to your production server
2. Ensure all API endpoints match the specification in `API_SPECIFICATION.md`
3. Build and deploy using Expo build tools

## Troubleshooting

If you encounter issues:

1. **Clear cache**: `expo start --clear`
2. **Reinstall dependencies**: `rm -rf node_modules && npm install`
3. **Check network**: Ensure internet connection for mock API
4. **Review logs**: Check console for detailed error messages

## API Documentation

See `API_SPECIFICATION.md` for complete API documentation and `MOCK_API_SETUP.md` for mock server setup details.
