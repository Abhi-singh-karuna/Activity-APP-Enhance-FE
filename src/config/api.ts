// API Configuration
export const API_CONFIG = {
  // Mock Server Configuration - Using a public mock API service
  MOCK_SERVER: {
    baseURL: "https://mock.apidog.com/m1/1023669-1010327-default", // Replace with your mock server URL
    timeout: 15000,
  },

  // Production Server Configuration
  PRODUCTION: {
    baseURL: "https://your-production-server.com/api", // Replace with your production server URL
    timeout: 10000,
  },

  // Development Server Configuration
  DEVELOPMENT: {
    baseURL: "http://localhost:3000/api", // Replace with your development server URL
    timeout: 10000,
  },
};

// Environment detection
export const getApiConfig = () => {
  // For now, always use mock server until you set up your own
  return API_CONFIG.MOCK_SERVER;

  // Uncomment this when you have different environments set up
  /*
  const environment = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      return API_CONFIG.PRODUCTION;
    case 'development':
      return API_CONFIG.DEVELOPMENT;
    default:
      return API_CONFIG.MOCK_SERVER;
  }
  */
};

// Current API configuration
export const CURRENT_API_CONFIG = getApiConfig();

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    PROFILE: "/users/profile",
  },

  // Activities
  ACTIVITIES: {
    LIST: "/activities",
    CREATE: "/activities",
    UPDATE: (id: string) => `/activities/${id}`,
    DELETE: (id: string) => `/activities/${id}`,
    START_TIMER: (id: string) => `/activities/${id}/start`,
    STOP_TIMER: (id: string) => `/activities/${id}/stop`,
    COMPLETE: (id: string) => `/activities/${id}/complete`,
  },

  // Tasks
  TASKS: {
    LIST: "/tasks",
    CREATE: "/tasks",
    UPDATE: (id: string) => `/tasks/${id}`,
    DELETE: (id: string) => `/tasks/${id}`,
    TOGGLE: (id: string) => `/tasks/${id}/toggle`,
  },

  // Statistics
  STATS: {
    GET: "/stats",
  },

  // Settings
  SETTINGS: {
    GET: "/settings",
    UPDATE: "/settings",
    CATEGORIES: "/settings/categories",
    SKIP_REASONS: "/settings/skip-reasons",
    SKIP_DAY_ENTRIES: "/settings/skip-day-entries",
    SKIP_DAY_ENTRY: (id: string) => `/settings/skip-day-entries/${id}`,
  },

  // App Management
  APP: {
    INIT: "/app/init",
    UPDATES: "/app/updates",
    ANNOUNCEMENTS: "/app/announcements",
    ANNOUNCEMENT_ACKNOWLEDGE: "/app/announcements/acknowledge",
    MAINTENANCE: "/app/maintenance",
    FEEDBACK: "/app/feedback",
    ERRORS: "/app/errors",
    CONFIG: "/app/config",
  },
};

// Headers configuration
export const getDefaultHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent": "ActivityApp/1.0.0",
});

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your internet connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "Access forbidden.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Login successful! Welcome back.",
  LOGOUT_SUCCESS: "Logged out successfully.",
  SAVE_SUCCESS: "Changes saved successfully.",
  DELETE_SUCCESS: "Item deleted successfully.",
  CREATE_SUCCESS: "Item created successfully.",
  UPDATE_SUCCESS: "Item updated successfully.",
};
