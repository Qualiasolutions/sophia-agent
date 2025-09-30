# SophiaAI

AI-powered real estate assistant providing property insights, document generation, and communication management via WhatsApp, Telegram, and email.

## Overview

SophiaAI is a comprehensive real estate agent assistant that helps streamline property management workflows through:

- **WhatsApp Integration**: Automated client communication and inquiry handling
- **Document Generation**: Create professional real estate documents (POAs, contracts, etc.)
- **Property Calculators**: Built-in tools for mortgage, ROI, and rental yield calculations
- **Listing Management**: Centralized property listing organization and search
- **Email Integration**: Gmail-based email management and tracking
- **Telegram Dashboard**: Admin interface for monitoring and management

## Prerequisites

- **Node.js**: v20.x or later
- **npm**: v9.x or later
- **Git**: Latest version

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Qualiasolutions/sophia-agent.git
cd sophia-agent
```

### 2. Install dependencies

```bash
cd apps/web
npm install
```

### 3. Configure environment variables

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials. See [Environment Variables](#environment-variables) section for details.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

All required environment variables are documented in `.env.example`. Key services include:

- **Supabase**: PostgreSQL database and authentication
- **Upstash Redis**: Caching and rate limiting
- **OpenAI**: AI-powered intent classification and responses
- **WhatsApp Business API**: Meta Cloud API integration
- **Telegram Bot API**: Admin dashboard bot
- **Gmail API**: Email integration with OAuth
- **Zyprus API**: Real estate data provider
- **NextAuth**: Authentication and session management
- **Sentry**: Error tracking and monitoring

## Development Commands

```bash
npm run dev      # Start development server (with Turbopack)
npm run build    # Build production bundle
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run test suite (Vitest)
```

## Project Structure

```
sophiaai/
├── apps/web/              # Next.js application
│   ├── src/app/           # Next.js App Router
│   │   └── api/           # API routes
│   ├── package.json
│   └── tsconfig.json
├── packages/              # Shared packages (coming soon)
├── docs/                  # Documentation
│   ├── architecture/      # Architecture documentation
│   └── prd/              # Product requirements
├── .env.example           # Environment variable template
└── README.md              # This file
```

## Deployment

This project is configured for automatic deployment on Vercel:

1. **Main branch**: Automatically deploys to production on push to `main`
2. **Pull requests**: Preview deployments created automatically for each PR
3. **Environment variables**: Configure in Vercel dashboard

### Manual Deployment

```bash
npm run build              # Build locally
vercel --prod             # Deploy to production (requires Vercel CLI)
```

## Documentation

- **Architecture**: See [docs/architecture/](docs/architecture/) for detailed system design
- **Product Requirements**: See [docs/prd/](docs/prd/) for feature specifications
- **Stories**: See [docs/stories/](docs/stories/) for development tasks

## Health Check

The application includes a health check endpoint at `/api/health`:

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-30T18:00:00.000Z",
  "environment": "development"
}
```

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS 4.x
- **Database**: PostgreSQL via Supabase
- **Caching**: Upstash Redis
- **AI**: OpenAI GPT-4o-mini
- **Testing**: Vitest + Playwright
- **Deployment**: Vercel
- **Monitoring**: Sentry

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -m "feat: add your feature"`
3. Push to the branch: `git push origin feature/your-feature`
4. Create a Pull Request

Follow [Conventional Commits](https://www.conventionalcommits.org/) format for commit messages.

## License

Proprietary - All rights reserved
