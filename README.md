# BoyAomGame Web

This repository holds the code for boyaomgame_web, a project containing multiple subsystems hosted behind an Express.js server which serves as a reverse proxy and static file host.

## Project Structure

- `server.js`: The main Express.js application acting as the entry point. It serves static files from the `root` directory, proxies requests matching `/api/userlooker` to a backend API (port 8001), and has a modular API router for the `parrot_system`.
- `ecosystem.config.js`: PM2 configuration for process management, defining the main Node server and the Next.js API for `userlooker`.
- `root/`: Directory containing static files served by Express. Includes `index.html` (the landing page) and static sites.
- `website_sys/`: Directory containing the project's subsystems.
  - `parrot_system/`: An API router and database management for the parrot feature.
  - `userlooker_sys/`: A system that includes a Next.js application frontend and a Python backend service.

## Setup and Running

1. Install dependencies:
   `npm install`

2. Run the application locally using PM2, which manages both the Express server and Next.js frontend:
   `pm2 start ecosystem.config.js`
   Or run the Express server directly:
   `node server.js`

3. Open your browser and navigate to `http://localhost:3000`.
