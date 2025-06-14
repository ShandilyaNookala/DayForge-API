# DayForge API

DayForge API is an Express based REST service used for managing tasks and related records for students. It uses MongoDB with Mongoose models and provides JWT based authentication.

## Features

- Manage tasks and positions for students
- Record daily work/results and compute next steps
- Define custom rules with points and threshold logic
- User authentication with JWT cookies
- Optional integration endpoints for external testing applications

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   Copy `config.example.env` to `config.env` and fill in the required values:
   ```
   DB_USERNAME=your_username
   PASSWORD=your_password
   DATABASE_DAYFORGE=your_database_connection_string
   DEFAULT_TIMEZONE=your_default_timezone
   SALT_COST_FACTOR=your_salt_cost_factor
   JWT_SECRET_FOR_DAYFORGE=your_jwt_secret
   JWT_EXPIRES_IN=your_jwt_expires_in
   ORIGIN_URL=your_origin_url
   COOKIE_NAME=your_cookie_name
   ```
3. **Run the server**
   ```bash
   npm start
   ```
   The server listens on port `8000`.

## Routes Overview

- `POST /auth/login` – log in and receive a JWT cookie
- `POST /auth/logout` – clear the cookie
- `POST /auth/is-logged-in` – check current user
- `/positions` – update or view positions (admin only)
- `/records` – manage records for tasks
- `/rules` – create and update rule definitions
- `/users` – create users (admin only)
- `/integrate-spellings-app` – integration endpoint for external test apps

## Development

The project uses ESLint for linting (`eslint.config.mjs`). Deployment to Google Cloud Functions is configured via `cloudbuild.yaml`.

## License

ISC © Shandilya Nookala
