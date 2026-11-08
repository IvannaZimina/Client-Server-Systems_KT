# Client-Server Systems (Klient-server süsteemid — 6 EAP)

Repository containing practical assignments, checkpoints, and the ongoing comprehensive project (**Piletikassa**) developed throughout the Client-Server Systems course.

## Repository Structure & Monorepo Layout

The repository follows a monorepo structure. Each control work (KT) is stored in a separate directory.

### Completed Assignments

- `KT_1/` — Introduction to client-server systems: requirements, role models, system overview, and development environment setup.
- `KT_2/` — Client-side development: semantic HTML, accessibility, responsive design, form validation, CSS architecture, cascade layers, design tokens, Vanilla JavaScript, and DOM interaction.
- `KT_3/` — Client-side logic and architecture: arrays and objects, closures, DOM performance measurements, state-to-view patterns, and Web Components. Includes a `ticket-card` component using Shadow DOM and dynamic module loading.
- `KT_4/` — HTTP communication and data transfer: request methods, status codes, query parameters, URL-encoded data, JSON, multipart forms, content types, and character encoding. Also covers cookies, browser security, origins, and CORS.
- `KT_5/` — Further client-server communication topics and practical work related to HTTP requests, asynchronous operations, and browser-server interaction.
- `KT_6/` — Server-side development with Node.js: HTTP server implementation, environment configuration and validation, routing, request body processing, error handling, and server-side API endpoints.
- `KT_7/` — API connection management and API styles: base URL configuration, environment-dependent connections, and reconnection handling.
- `KT_8/` — Real-time communication and server operations: communication channels, file uploads and access control, background tasks, caching, scaling, and stateless server architecture.

### Upcoming Assignments

- `KT_9/`–`KT_16/` — Further course assignments and project milestones will be added as the course progresses.

## Comprehensive Course Project: *Piletikassa*

Throughout the course, practical assignments contribute to the development of a single application: **Piletikassa**, an event ticket sales platform.

### Core Domain & Goals

- **The Core Challenge:** Selling a limited number of event seats when multiple buyers attempt to book the same seat simultaneously. Atomicity, concurrency control, and database transactions ensure that only one buyer can secure a particular seat.
- **Identity & Roles:** Email-based authentication using magic links or passwords. Two global roles (User and System Administrator). Event creation grants temporary or scoped organizer rights for that event.
- **Seating & Holds:** Interactive seat maps with numbered seats or general admission limits. Temporary 10-minute holds expire automatically to prevent overbooking.
- **Purchases & Offline Tickets:** Payment integration simulation, immutable sales records, and mobile-friendly tickets designed to work at venue entrances without network coverage.
- **Check-in & Analytics:** QR/code scanning with offline support and background synchronization, attendance tracking, and sales reports.

## Technology Stack

The course covers the following technologies and tools:

- **Frontend:** HTML5, CSS3, Bootstrap 5, Sass.
- **Client-Side Logic:** Vanilla JavaScript (ES2024+), ES Modules, DOM, Web Components.
- **Backend:** Node.js, Express.
- **Databases & Storage:** MySQL, MongoDB Atlas, Firestore, Object Storage (Azure Blob / S3).
- **Cloud & DevOps:** Firebase, Microsoft Azure, Docker, GitHub Actions CI/CD.
- **Tooling:** VS Code / WebStorm, Git, npm, Postman / REST Client, Browser DevTools.

## Course Syllabus & Lecture Roadmap

| Lectures  | Core Topic & Project Milestone                                                                                                                                                                         |
| :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**     | **Web, Client-Server Model & Presentation Layer:** Request-response cycle, stateless protocols, DNS, TLS, DOM/CSSOM, critical rendering path, and DevTools.                                            |
| **2–3**   | **Client-Side Layer in Depth:** Semantics, accessibility (ARIA), Constraint Validation API, CSS layers (`@layer`), containers, Flexbox/Grid, Vanilla JS modules, closures, and state-to-view patterns. |
| **4–5**   | **Client-Server Communication:** HTTP anatomy, methods, status codes, CORS, caching, Fetch API, asynchronous JavaScript (`async/await`), error handling, and offline service workers.                  |
| **6–8**   | **Server-Side Application:** Node.js, Express routing/middleware, layered architecture, REST API design, OpenAPI documentation, WebSockets/SSE, file uploads, and background jobs (BullMQ).            |
| **9–10**  | **Data Layer:** Relational databases (MySQL, `mysql2`, connection pools, parameterized queries, transactions) and NoSQL (MongoDB, Firestore, real-time listeners).                                     |
| **11–12** | **Authentication & Web Security:** Password hashing (bcrypt/argon2), JWT, session cookies, magic links, OWASP Top 10 (SQLi, XSS, CSRF), security headers, and automated testing.                       |
| **13–14** | **Cloud Services:** Firebase (Auth, Firestore, Storage, Hosting, Functions), Supabase, Microsoft Azure (App Service, Azure Database for MySQL, Key Vault), and edge computing.                         |
| **15–16** | **Deployment & Operations:** Environments, Docker containerization, CI/CD with GitHub Actions, Nginx reverse proxy, monitoring (Sentry), logging, and production load testing.                         |

## Running the Projects Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/IvannaZimina/Client-Server-Systems_KT.git
   cd Client-Server-Systems_KT
   ```

2. Open the required assignment directory:

   ```bash
   cd KT_1
   ```

3. Follow the instructions and README files inside the selected assignment directory to install dependencies and run the project, where applicable.

Each control work contains its own practical tasks, source files, and documentation.