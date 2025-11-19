# Deployment Instructions

## Database Setup (Railway)

1.  **Create a Project on Railway**.
2.  **Add a PostgreSQL Database**:
    *   Railway will automatically provide a `DATABASE_URL` environment variable.
3.  **Deploy the Server**:
    *   Connect your GitHub repo.
    *   Add the Server service.
    *   **IMPORTANT**: Set the **Root Directory** to `server` in the service settings.
    *   Ensure the `DATABASE_URL` variable is available to the Server service (Railway usually does this automatically if they are in the same project).
    *   The server will automatically create the necessary tables (`players`, `chat_messages`) on startup via `initDB()`.
    *   **WebSocket Support**: Railway's proxy supports WebSockets by default, but ensure your service settings don't have any custom configurations blocking them.

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
    *   The server URL is configured in `client/src/main.js` and automatically uses `https://lsl-production-0181.up.railway.app` when not on localhost.

## Troubleshooting

### Socket.IO Connection Errors

If you see "Connection Error" in the browser console:

1.  **Check Railway Server Logs**:
    *   Look for `LSL MMORPG Server running on port XXXX` - confirms server is running
    *   Look for `Player connected: <socket-id>` - confirms connections are working
    *   Check for database connection errors

2.  **Verify Root Directory**:
    *   Railway service settings → Root Directory should be `server`
    *   Without this, Railway deploys from the wrong folder

3.  **Check Environment Variables**:
    *   `DATABASE_URL` must be set
    *   `CLIENT_URL` should be your Netlify URL (optional but recommended)
    *   `PORT` is set by Railway automatically

4.  **WebSocket Issues**:
    *   The server is now configured with increased timeouts for Railway's proxy
    *   Both client and server prefer WebSocket but fallback to polling
    *   Check browser console for specific transport errors

5.  **Database Connection**:
    *   If tables don't exist, check logs for `initDB()` errors
    *   Ensure DATABASE_URL is accessible from server service

