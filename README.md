# Investate - Distributed Real Estate Ownership

## Overview
Investate is a modern, distributed platform designed to facilitate real estate ownership and investment. The platform is architected using a microservices pattern on the backend to ensure scalability, resilience, and maintainability, paired with a highly responsive React frontend. 

The application streamlines processes such as real estate listing, tokenized investments, user authentication, marketplace operations, and real-time communications.

## System Architecture

The project is structured as a monorepo containing both the frontend application and backend microservices.

### Frontend
- Located in the `frontend/` directory.
- Built as a Single Page Application (SPA).
- Communicates with backend services via the API Gateway.

### Backend Microservices
Located in the `services/` directory. The backend consists of the following isolated services:
- **API Gateway**: Entry point for all client requests, routing traffic to appropriate backend services.
- **Auth Service**: Manages user authentication, authorization, and session handling.
- **Listing Service**: Handles property listings, details, and search capabilities.
- **Token Service**: Manages real estate tokenization and digital assets.
- **Investment Service**: Processes user investments, portfolio tracking, and transactions.
- **Marketplace Service**: Facilitates secondary market trading of real estate tokens.
- **Chat Service**: Provides real-time messaging capabilities between users.
- **Notification Service**: Manages system alerts, emails, and in-app notifications.
- **File Service**: Handles secure file uploads, storage, and retrieval.

## Technology Stack

### Frontend
- React 19
- Vite
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- TanStack Query (Data Fetching)
- React Router DOM

### Backend
- Node.js (Alpine Linux Docker containers)
- TypeScript
- Shared packages architecture

### Infrastructure & External Services
- **Database**: Supabase (PostgreSQL)
- **Caching**: Upstash Redis
- **Email Delivery**: Resend
- **Deployment**: Google Cloud Run via Google Artifact Registry (GAR)
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites
- Node.js (v20+)
- npm
- Docker (optional, for local container testing)

### Environment Variables
To run the project locally, copy the provided `.env` template or refer to the required configurations below. A `.env` file must be present at the root directory.

Required variables include:
- Supabase credentials (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`)
- Upstash Redis credentials (`UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`)
- JWT configuration (`JWT_SECRET`, `JWT_REFRESH_SECRET`)
- Resend API key (`RESEND_API_KEY`)
- System variables (`FROM_EMAIL`)

### Local Development

1. **Install Dependencies**
From the root directory, install all workspace dependencies:
```bash
npm install
```

2. **Run Services Locally**
You can run individual services using npm scripts defined in the root `package.json`.
For example, to start the API Gateway and Frontend:
```bash
npm run dev:gateway
npm run dev:frontend
```

Other available scripts include `dev:auth`, `dev:listing`, `dev:token`, `dev:investment`, `dev:chat`, `dev:marketplace`, `dev:notification`, and `dev:file`.

## Deployment

The platform is configured for automated deployment to Google Cloud Run utilizing GitHub Actions. 

### CI/CD Workflow
The CI/CD pipeline is defined in `.github/workflows/deploy-services.yml`.
- **Triggers**: The pipeline executes automatically on pushes to the `main` branch when changes are detected in service directories, shared packages, or deployment configuration files. Manual deployment is also available via GitHub Actions `workflow_dispatch`.
- **Process**:
  1. Authenticates securely with Google Cloud using configured service account credentials.
  2. Dynamically substitutes service definitions in the `Dockerfile.template`.
  3. Builds Docker container images for each updated service.
  4. Pushes the built images to Google Artifact Registry.
  5. Deploys the images to Google Cloud Run with the necessary environment variables injected securely from GitHub Secrets.

### Required GitHub Secrets
To facilitate automated deployments, the following secrets must be configured in the GitHub repository:
- `GCP_PROJECT_ID`
- `GCP_SA_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `UPSTASH_REDIS_URL`
- `UPSTASH_REDIS_TOKEN`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `RESEND_API_KEY`
- `FROM_EMAIL`
