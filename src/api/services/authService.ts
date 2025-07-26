import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  apiRequest,
  setAuthTokens,
  clearAuthTokens,
  ApiResponse,
} from "../apiClient";

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  success: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  data?: {
    user?: {
      id: string;
      email: string;
      name: string;
      isVerified: boolean;
    };
    tokens?: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
  token?: string;
  refreshToken?: string;
  user?: any;
}

// Interface for registration request
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Interface for forgot password request
export interface ForgotPasswordRequest {
  email: string;
}

// Interface for OTP verification request
export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

// Interface for resend OTP request
export interface ResendOtpRequest {
  email: string;
}

// Interface for reset password request
export interface ResetPasswordRequest {
  email: string;
  otpToken: string;
  newPassword: string;
  confirmPassword: string;
}

// Interface for user profile
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  createdAt: string;
}

/**
 * Login user with email and password
 */
export const login = async (
  credentials: LoginRequest
): Promise<ApiResponse<LoginResponse["data"]>> => {
  try {
    const response = await apiRequest<LoginResponse["data"]>({
      method: "POST",
      url: "/auth/login",
      data: credentials,
    });

    // If login successful, save tokens
    if (response.success && response.data?.tokens) {
      const { accessToken, refreshToken } = response.data.tokens;
      await setAuthTokens(accessToken, refreshToken);

      // Save user data
      if (response.data.user) {
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(response.data.user)
        );
      }
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: {
        code: "LOGIN_FAILED",
        message: "Login failed. Please check your credentials and try again.",
      },
    };
  }
};

/**
 * Register a new user
 */
export const register = async (
  userData: RegisterRequest
): Promise<ApiResponse<LoginResponse["data"]>> => {
  try {
    const response = await apiRequest<LoginResponse["data"]>({
      method: "POST",
      url: "/auth/register",
      data: userData,
    });

    // If registration successful, save tokens
    if (response.success && response.data?.tokens) {
      const { accessToken, refreshToken } = response.data.tokens;
      await setAuthTokens(accessToken, refreshToken);

      // Save user data
      if (response.data.user) {
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(response.data.user)
        );
      }
    }

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: {
        code: "REGISTRATION_FAILED",
        message: "Registration failed. Please try again.",
      },
    };
  }
};

/**
 * Send a password reset email
 */
export const forgotPassword = async (
  request: ForgotPasswordRequest
): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/auth/forgot-password",
      data: request,
    });
    return response;
  } catch (error) {
    console.error("Forgot password error:", error);
    return {
      success: false,
      error: {
        code: "FORGOT_PASSWORD_FAILED",
        message: "Failed to send password reset email. Please try again.",
      },
    };
  }
};

/**
 * Verify OTP code
 */
export const verifyOtp = async (
  request: VerifyOtpRequest
): Promise<ApiResponse<{ token: string }>> => {
  try {
    const response = await apiRequest<{ token: string }>({
      method: "POST",
      url: "/auth/verify-otp",
      data: request,
    });
    return response;
  } catch (error) {
    console.error("OTP verification error:", error);
    return {
      success: false,
      error: {
        code: "OTP_VERIFICATION_FAILED",
        message: "OTP verification failed. Please try again.",
      },
    };
  }
};

/**
 * Resend OTP code
 */
export const resendOtp = async (
  request: ResendOtpRequest
): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/auth/resend-otp",
      data: request,
    });
    return response;
  } catch (error) {
    console.error("Resend OTP error:", error);
    return {
      success: false,
      error: {
        code: "RESEND_OTP_FAILED",
        message: "Failed to resend OTP. Please try again.",
      },
    };
  }
};

/**
 * Reset password with OTP token
 */
export const resetPassword = async (
  request: ResetPasswordRequest
): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/auth/reset-password",
      data: request,
    });
    return response;
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      error: {
        code: "RESET_PASSWORD_FAILED",
        message: "Failed to reset password. Please try again.",
      },
    };
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  refreshToken: string
): Promise<
  ApiResponse<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>
> => {
  try {
    const response = await apiRequest<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>({
      method: "POST",
      url: "/auth/refresh",
      data: { refreshToken },
    });

    // If refresh successful, save new tokens
    if (response.success && response.data) {
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      await setAuthTokens(accessToken, newRefreshToken);
    }

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return {
      success: false,
      error: {
        code: "TOKEN_REFRESH_FAILED",
        message: "Token refresh failed. Please login again.",
      },
    };
  }
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<ApiResponse> => {
  try {
    // Call logout endpoint
    const response = await apiRequest({
      method: "POST",
      url: "/auth/logout",
    });

    // Clear all authentication data regardless of response
    await clearAuthTokens();
    await AsyncStorage.removeItem("userData");
    await AsyncStorage.setItem("isLoggedIn", "false");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    // Even if server logout fails, clear local storage
    await clearAuthTokens();
    await AsyncStorage.removeItem("userData");
    await AsyncStorage.setItem("isLoggedIn", "false");

    return {
      success: true,
      message: "Logged out successfully",
    };
  }
};

/**
 * Get the current authenticated user profile
 */
export const getUserProfile = async (): Promise<ApiResponse<UserProfile>> => {
  try {
    const response = await apiRequest<UserProfile>({
      method: "GET",
      url: "/users/profile",
    });
    return response;
  } catch (error) {
    console.error("Get user profile error:", error);
    return {
      success: false,
      error: {
        code: "PROFILE_FETCH_FAILED",
        message: "Failed to fetch user profile.",
      },
    };
  }
};

/**
 * Check if user is currently authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
    return !!(token && isLoggedIn === "true");
  } catch (error) {
    console.error("Authentication check error:", error);
    return false;
  }
};

/**
 * Get stored user data
 */
export const getStoredUserData = async (): Promise<UserProfile | null> => {
  try {
    const userData = await AsyncStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Get stored user data error:", error);
    return null;
  }
};

export default {
  login,
  register,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
  refreshToken,
  logout,
  getUserProfile,
  isAuthenticated,
  getStoredUserData,
};
