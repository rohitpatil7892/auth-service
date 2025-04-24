# Auth Service

Auth-service is a Node.js Express microservice handling authentication, session management, and Google OAuth for users.

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Service](#running-the-service)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Authentication Endpoints](#authentication-endpoints)
    - [Initiate Google OAuth](#initiate-google-oauth)
    - [Google OAuth Callback](#google-oauth-callback)
    - [Google Token Authentication](#google-token-authentication)
    - [Create Session](#create-session)
    - [Logout User](#logout-user)
    - [Get Current User](#get-current-user)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [License](#license)

## Introduction

This microservice provides authentication functionality including Google OAuth, JWT-based token authentication, session creation, logout, and fetching the current user profile.

## Prerequisites

- Node.js v14+ and npm
- A PostgreSQL (or compatible) database
- Google OAuth2 credentials

## Installation

```bash
git clone <repository-url>
cd auth-service
npm install
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```dotenv
PORT=3000
DATABASE_URL=postgres://user:password@host:port/database
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=https://your-frontend-url.com
NODE_ENV=development
```

## Running the Service

Start the service in development mode:

```bash
npm start
```

By default, it will run on `http://localhost:3000`.

## API Endpoints

### Health Check

**GET /health**
- Description: Check if the service is running.
- Response:
  - Status: `200 OK`
  - Body:
    ```json
    {
      "status": "ok",
      "service": "auth-service"
    }
    ```

### Authentication Endpoints

#### Initiate Google OAuth

**GET /auth/google**
- Description: Redirects the user to Google for authentication.
- Response:
  - Status: `302 Found`
  - Location header pointing to Google’s OAuth endpoint.

#### Google OAuth Callback

**GET /auth/google/callback**
- Description: Google redirects back to this endpoint after authentication.
- Response:
  - On success, creates a session and redirects to `FRONTEND_URL?token=<session_token>`.
  - On failure, redirects to `FRONTEND_URL/login?error=session_creation_failed`.

#### Google Token Authentication

**POST /auth/google**
- Description: Authenticate using a Google ID token.
- Request:
  - Headers: `Content-Type: application/json`
  - Body:
    ```json
    {
      "token": "<Google ID token>"
    }
    ```
- Response:
  - Status: `200 OK`
  - Body:
    ```json
    {
      "token": "<session_token>",
      "user": {
        "id": 123,
        "email": "user@example.com",
        "name": "User Name",
        "picture": "https://..."
      }
    }
    ```
- Errors:
  - `400 Bad Request` if token missing.
  - `401 Unauthorized` if token invalid.

#### Create Session

**POST /auth/session**
- Description: Create a new session from an existing JWT.
- Request:
  - Headers: `Authorization: Bearer <jwt_token>`
- Response:
  - Status: `200 OK`
  - Body:
    ```json
    {
      "message": "Session created successfully",
      "token": "<new_session_token>"
    }
    ```
- Errors:
  - `401 Unauthorized` if no token or invalid token.

#### Logout User

**POST /auth/logout**
- Description: Invalidate the current session token.
- Request:
  - Headers: `Authorization: Bearer <session_token>`
- Response:
  - Status: `200 OK`
  - Body:
    ```json
    {
      "message": "Logged out successfully"
    }
    ```
- Errors:
  - `401 Unauthorized` if token missing or invalid.

#### Get Current User

**GET /auth/me**
- Description: Fetch the profile of the authenticated user.
- Request:
  - Headers: `Authorization: Bearer <session_token>`
- Response:
  - Status: `200 OK`
  - Body:
    ```json
    {
      "id": 123,
      "email": "user@example.com",
      "name": "User Name",
      "picture": "https://..."
    }
    ```
- Errors:
  - `401 Unauthorized` if token missing or invalid.
  - `404 Not Found` if user does not exist.

## Error Handling

All errors follow the JSON API error format with appropriate HTTP status codes and messages.

## Logging

Uses Winston for structured logging. Logs include request identifiers, timestamps, user IDs, and error stacks.

## License

MIT License
