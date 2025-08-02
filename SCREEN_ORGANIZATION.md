# Screen Organization Structure

This document outlines the new organized screen structure for the Activity App frontend.

## Overview

The screens have been reorganized into logical groups based on their functionality and purpose. This improves code maintainability, makes the codebase easier to navigate, and follows best practices for React Native project structure.

## Directory Structure

```
src/screens/
├── index.ts                    # Main screens export
├── auth/                       # Authentication screens
│   ├── index.ts               # Auth screens export
│   ├── LoginScreen.tsx        # User login
│   ├── SignupScreen.tsx       # User registration
│   ├── ForgotPasswordScreen.tsx # Password recovery
│   ├── OTPVerificationScreen.tsx # OTP verification
│   └── ResetPasswordScreen.tsx # Password reset
├── core/                       # Core application screens
│   ├── index.ts               # Core screens export
│   └── SplashScreen.tsx       # App initialization
├── activity/                   # Activity management screens
│   ├── index.ts               # Activity screens export
│   ├── ActivityScreen.tsx     # Main activity list
│   └── ActivityDetailScreen.tsx # Activity details
├── task/                       # Task management screens
│   ├── index.ts               # Task screens export
│   ├── TaskScreen.tsx         # Main task list
│   └── TaskDetailScreen.tsx   # Task details
├── analytics/                  # Analytics and statistics screens
│   ├── index.ts               # Analytics screens export
│   └── StatsScreen.tsx        # Statistics dashboard
└── settings/                   # Settings and configuration screens
    ├── index.ts               # Settings screens export
    └── SettingsScreen.tsx     # App settings
```

## Screen Groups

### 🔐 Authentication (`src/screens/auth/`)

Contains all authentication-related screens:

- **LoginScreen**: User login with email/password authentication
- **SignupScreen**: New user registration and account creation
- **ForgotPasswordScreen**: Password recovery flow initiation
- **OTPVerificationScreen**: OTP verification for password reset
- **ResetPasswordScreen**: New password setup after verification

### 🚀 Core (`src/screens/core/`)

Contains core application screens:

- **SplashScreen**: App initialization, loading, and startup logic

### ⏱️ Activity Management (`src/screens/activity/`)

Contains activity tracking and management screens:

- **ActivityScreen**: Main activity list with timer controls and CRUD operations
- **ActivityDetailScreen**: Detailed activity view, editing, and history

### 📋 Task Management (`src/screens/task/`)

Contains task management screens:

- **TaskScreen**: Task list with creation, management, and status tracking
- **TaskDetailScreen**: Detailed task view, editing, and progress tracking

### 📊 Analytics (`src/screens/analytics/`)

Contains analytics and reporting screens:

- **StatsScreen**: Productivity statistics, charts, and insights dashboard

### ⚙️ Settings (`src/screens/settings/`)

Contains configuration and settings screens:

- **SettingsScreen**: App configuration, preferences, and account management

## Benefits of This Organization

1. **Logical Grouping**: Screens are grouped by functionality, making it easy to find related code
2. **Scalability**: New screens can be easily added to appropriate groups
3. **Maintainability**: Related screens are co-located, reducing cognitive load
4. **Import Clarity**: Index files provide clean import paths
5. **Team Collaboration**: Different team members can work on different feature groups
6. **Code Splitting**: Future code splitting can be done at the group level

## Import Usage

### Before (Old Structure)

```typescript
import LoginScreen from "../screens/LoginScreen";
import ActivityScreen from "../screens/ActivityScreen";
import SettingsScreen from "../screens/SettingsScreen";
```

### After (New Structure)

```typescript
// Option 1: Import from main index
import { LoginScreen, ActivityScreen, SettingsScreen } from "../screens";

// Option 2: Import from specific groups
import { LoginScreen } from "../screens/auth";
import { ActivityScreen } from "../screens/activity";
import { SettingsScreen } from "../screens/settings";

// Option 3: Direct import (still works)
import LoginScreen from "../screens/auth/LoginScreen";
```

## Navigation Updates

The navigation file (`src/navigation/index.tsx`) has been updated to use the new import structure:

```typescript
import {
  SplashScreen,
  LoginScreen,
  SignupScreen,
  ForgotPasswordScreen,
  OTPVerificationScreen as OtpVerificationScreen,
  ResetPasswordScreen,
  ActivityScreen,
  ActivityDetailScreen,
  TaskScreen,
  TaskDetailScreen,
  StatsScreen,
  SettingsScreen,
} from "../screens";
```

## Migration Notes

- All import paths in screen files have been updated to use `../../` instead of `../`
- Index files have been created for each group to enable clean imports
- The main screens index file exports all screens from their respective groups
- Navigation imports have been updated to use the new structure
- No functional changes were made to the screen components themselves

## Future Considerations

1. **Code Splitting**: Consider implementing lazy loading for screen groups
2. **Testing**: Group tests can be organized similarly to the screen structure
3. **Documentation**: Each group can have its own README for detailed documentation
4. **State Management**: Consider organizing context providers by feature groups
5. **API Services**: API services could be organized similarly to match screen groups
