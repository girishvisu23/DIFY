# NutriTrack

NutriTrack is a unified nutrition assistant built with Next.js 16 and the App Router. It gives you:

- **Chat Assistant** powered by OpenAI (supports CSV uploads and summarises your nutrition data)
- **Calorie Tracker** with daily meal logging and macro totals
- **Automated Meal Planner** that reacts to user settings
- **Progress Dashboard** with charts and summaries

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
pnpm install
```

### Environment variables

Create a `.env.local` and configure:

```bash
OPENAI_API_KEY=your-key
# optional
OPENAI_DATA_FILE_ID=file-xxxxxxxxxxxxxxxx
```

### Development

```bash
pnpm dev
```

### Production build

```bash
pnpm build
pnpm start
```

## Features

- ShadCN UI components, Tailwind styling
- Zustand-style (React state) for planners and dashboards
- Local CSV parsing with Papaparse
- Responsive layout with light/green theme

## Deployment

This project is configured for deployment on Vercel. Set the environment variables in the Vercel dashboard and push the repository to trigger a build.

