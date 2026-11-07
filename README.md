# Client-Server Systems (Klient-server süsteemid — 6 EAP)

Repository containing practical assignments, checkpoints, and the ongoing comprehensive project (**Piletikassa**) built throughout the "Client-Server Systems" course[cite: 30, 31].

---

## Repository Structure & Monorepo Layout

The repository follows a monorepo structure. Each control work (KT) is stored in a separate directory.
- `KT_1/` — Introduction, requirements, role models, system overview, and development environment setup.
- `KT_2/` — Client-side development: semantic HTML, accessibility, CSS architecture, responsive design, Vanilla JavaScript, DOM state management, and event handling.
- `KT_3/` — Client-side logic, array processing, object manipulation, closures, DOM performance benchmarks, and state-to-view architecture.
- `KT_4/`–`KT_5/` — Client-server communication and related practical assignments.
- `KT_6/` — Server-side development with Node.js: HTTP server, environment configuration, error handling, Express routing and middleware, streams, and process model measurements.
- `KT_7/`–`KT_16/` — Additional course assignments and project milestones will be added as the course progresses.

---

## Comprehensive Course Project: *Piletikassa*

Throughout the 16 lectures, all assignments contribute to building a single, robust, production-ready application: **Piletikassa** (Event Ticket Sales Platform)[cite: 30]. 

### Core Domain & Goals
* **The Core Challenge**: Selling limited event seats where hundreds of buyers attempt to book the exact same seat simultaneously[cite: 29, 30]. Atomicity, concurrency control, and database transactions (`F3.3`) ensure that *exactly one* buyer secures the seat instantly, while others are notified immediately[cite: 29].
* **Key Features**:
  * **Identity & Roles**: Email-based authentication (magic links/passwords). Two global roles (User, System Administrator). Event creation grants temporary/scoped organizer rights for that specific event[cite: 29].
  * **Seating & Holds**: Interactive seat maps (numbered or general admission with limits). Temporary 10-minute holds that expire automatically to prevent overbooking[cite: 29].
  * **Purchases & Offline Tickets**: External payment integration simulation, immutable sales records, and mobile-friendly tickets that function seamlessly even at venue entrances with zero network coverage (`F5.3`)[cite: 29].
  * **Check-in & Analytics**: QR/code scanner working offline with background synchronization, real-time attendance tracking, and comprehensive sales reports[cite: 29].

---

## Technology Stack

- **Frontend**: HTML5, CSS3, Bootstrap 5 (responsive design, Sass customization)[cite: 31]
- **Client-Side Logic**: Vanilla JavaScript (ES2024+), Modules, DOM, Web Components[cite: 31]
- **Backend**: Node.js 22 LTS, Express 5[cite: 31]
- **Databases & Storage**: MySQL 8.4 LTS, MongoDB Atlas, Firestore, Object Storage (Azure Blob / S3)[cite: 31]
- **Cloud & DevOps**: Firebase, Microsoft Azure, Docker, GitHub Actions CI/CD[cite: 31]
- **Tooling**: VS Code / WebStorm, Git, npm, Postman / REST Client, DevTools[cite: 31]

---

## Course Syllabus & Lecture Roadmap

| Lectures | Core Topic & Project Milestone |
| :--- | :--- |
| **1** | **Web, Client-Server Model & Presentation Layer**: Request-response cycle, stateless protocols, DNS, TLS, DOM/CSSOM, critical rendering path, and DevTools[cite: 32]. |
| **2–3** | **Client-Side Layer in Depth**: Semantics, accessibility (ARIA), Constraint Validation API, CSS layers (`@layer`), containers, Flexbox/Grid, Vanilla JS modules, closures, and state-to-view patterns[cite: 32]. |
| **4–5** | **Client-Server Communication**: HTTP anatomy, methods, status codes, CORS, caching, Fetch API, asynchronous JavaScript (`async/await`), error handling, and offline service workers[cite: 32]. |
| **6–8** | **Server-Side Application**: Node.js, Express routing/middleware, layered architecture, REST API design, OpenAPI documentation, WebSockets/SSE, file uploads, and background jobs (BullMQ)[cite: 32]. |
| **9–10** | **Data Layer**: Relational databases (MySQL, `mysql2`, connection pools, parameterized queries, transactions) and NoSQL (MongoDB, Firestore, real-time listeners)[cite: 32]. |
| **11–12** | **Authentication & Web Security**: Password hashing (bcrypt/argon2), JWT, session cookies, magic links, OWASP Top 10 (SQLi, XSS, CSRF), security headers, and automated testing[cite: 32]. |
| **13–14** | **Cloud Services**: Firebase (Auth, Firestore, Storage, Hosting, Functions), Supabase, Microsoft Azure (App Service, Azure Database for MySQL, Key Vault), and edge computing[cite: 32]. |
| **15–16** | **Deployment & Operations**: Environments, Docker containerization, CI/CD with GitHub Actions, Nginx reverse proxy, monitoring (Sentry), logging, and production load testing[cite: 32]. |

---

## Running the Projects Locally

1. Clone the monorepo:
   ```bash
    git clone https://github.com/IvannaZimina/Client-Server-Systems.git
    cd Client-Server-Systems
    ``` 