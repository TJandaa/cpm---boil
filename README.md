# CPM (Critical Path Method) Web Application

A web-based application for project management using the Critical Path Method, built with SvelteKit, TypeScript, PostgreSQL, and Docker.

## Features

- Create and manage projects
- Add activities/tasks with durations and dependencies
- Automatically calculate the critical path
- Visualize project networks and timelines
- Calculate early start, early finish, late start, late finish, and slack times

## Project Structure

```
cpm-app/
├── src/
│   ├── lib/
│   │   ├── components/     # UI components
│   │   ├── utils/          # Utility functions (including CPM calculations)
│   │   └── types/          # TypeScript type definitions
│   ├── routes/             # SvelteKit pages and API routes
│   └── app.html            # HTML template
├── static/                 # Static assets
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Docker configuration for SvelteKit
├── package.json            # Node.js dependencies
└── tsconfig.json           # TypeScript configuration
```

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) (v18 or later) and npm for local development

### Development Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd cpm-app
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your database connection:

```
DATABASE_URL=postgres://cpmuser:cpmpassword@localhost:5432/cpmdb
```

4. Start the PostgreSQL database with Docker:

```bash
docker-compose up -d db
```

5. Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173.

### Running with Docker Compose

To run the complete application with Docker Compose:

```bash
docker-compose up -d
```

The application will be available at http://localhost:3000.

## Deployment

To build the application for production:

```bash
npm run build
```

## Database Schema

The application uses the following database tables:

- `projects`: Project information
- `activities`: Project activities/tasks with CPM attributes
- `activity_dependencies`: Relationships between activities

## CPM Calculation

The Critical Path Method calculations are implemented in `src/lib/utils/cpm.ts` and include:

- Forward pass (early start, early finish)
- Backward pass (late start, late finish, slack)
- Critical path identification
- Support for both Activity-on-Node (AoN) and Activity-on-Arrow (AoA) approaches

## UI Components

- **ProjectInfo**: Displays project summary statistics
- **TaskForm**: Input form for adding and editing tasks
- **TaskList**: Displays list of project tasks
- **DependencySelector**: Multi-select component for choosing task dependencies
- **CPMTable**: Table displaying detailed CPM calculation results
- **CPMGraph**: Interactive network diagram visualization using D3.js

## License

[MIT License](LICENSE)