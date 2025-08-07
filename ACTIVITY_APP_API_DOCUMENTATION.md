# Activity App API Documentation

## Overview

This document outlines all the REST API endpoints used in the Activity App. All APIs return JSON responses and follow RESTful conventions.

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

## 1. Authentication APIs

### 1.1 User Login

**POST** `/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "status": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 User Registration

**POST** `/auth/register`

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "status": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
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
  "status": true,
  "message": "Password reset email sent successfully"
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
  "status": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "reset_token_123"
  }
}
```

### 1.5 Resend OTP

**POST** `/auth/resend-otp`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "status": true,
  "message": "OTP resent successfully"
}
```

### 1.6 Reset Password

**POST** `/auth/reset-password`

**Request Body:**

```json
{
  "email": "user@example.com",
  "otpToken": "reset_token_123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:**

```json
{
  "status": true,
  "message": "Password reset successfully"
}
```

### 1.7 Refresh Token

**POST** `/auth/refresh`

**Request Body:**

```json
{
  "refreshToken": "refresh_token_123"
}
```

**Response:**

```json
{
  "status": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 3600
  }
}
```

### 1.8 Logout

**POST** `/auth/logout`

**Response:**

```json
{
  "status": true,
  "message": "Logged out successfully"
}
```

### 1.9 Get User Profile

**GET** `/users/profile`

**Response:**

```json
{
  "status": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "isVerified": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```
