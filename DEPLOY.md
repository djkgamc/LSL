# Deployment Instructions

## Database Setup (Railway)

1.  **Create a Project on Railway**.
2.  **Add a PostgreSQL Database**:
    *   Railway will automatically provide a `DATABASE_URL` environment variable.
3.  **Deploy the Server**:
    *   Connect your GitHub repo.
    *   Add the Server service.
    *   Ensure the `DATABASE_URL` variable is available to the Server service (Railway usually does this automatically if they are in the same project).
    *   The server will automatically create the necessary tables (`players`, `chat_messages`) on startup via `initDB()`.

## Server Environment Variables

Ensure the following environment variables are set in your production environment (Railway):

*   `PORT`: (Optional) Defaults to 3000. Railway sets this automatically.
*   `DATABASE_URL`: Connection string for PostgreSQL.
*   `CLIENT_URL`: URL of your frontend (Netlify) to allow CORS. Example: `https://your-game.netlify.app`.

## Local Development

1.  **Prerequisites**:
    *   PostgreSQL installed and running.
    *   Node.js installed.
2.  **Setup**:
    *   Create a `.env` file in the `server` directory:
        ```env
        DATABASE_URL=postgresql://user:password@localhost:5432/lsl_mmorpg
        ```
    *   Run `npm install`.
    *   Run `npm run server` to start the backend.
    *   Run `npm run client` to start the frontend.

## Netlify (Client)

1.  **Build Command**: `npm run build` (if you have a build step) or just deploy the `client` folder.
2.  **Environment Variables**:
    *   You might need to configure the client to point to the Railway server URL.
    *   Update `client/src/network/socket.js` (or wherever the socket connection is defined) to use the production server URL.
