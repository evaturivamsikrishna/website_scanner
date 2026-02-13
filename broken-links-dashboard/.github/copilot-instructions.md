# Broken Links Dashboard - Copilot Instructions

## Project Overview

This is a modern React + TypeScript + Vite dashboard application for monitoring broken links across multiple locales. The project is configured for deployment to GitHub Pages and production use.

## Project Structure

- **src/components/** - React components (Dashboard, Analytics, Locales)
- **src/data/** - Mock data and data types
- **src/** - Main App and entry point
- **public/** - Static assets
- **dist/** - Production build output

## Key Technologies

- React 18 + TypeScript
- Vite (fast build tool)
- Tailwind CSS (styling)
- Recharts (data visualization)
- Lucide Icons (icons)

## Available Scripts

- `npm run dev` - Start development server at http://localhost:5173
- `npm run build` - Create optimized production build
- `npm run preview` - Preview production build locally
- `npm run deploy` - Build and deploy to GitHub Pages

## Development Guidelines

1. All components should be placed in `src/components/`
2. Data structures and mocks should be in `src/data/`
3. Use Tailwind CSS for styling (avoid inline styles)
4. Maintain type safety with TypeScript
5. Charts use Recharts library
6. Icons use Lucide React

## GitHub Pages Deployment

The app is configured to deploy to: `https://username.github.io/Website_Runner/broken-links-dashboard/`

Configured in `vite.config.ts` with `base: '/Website_Runner/broken-links-dashboard/'`

## Project Status

✅ Scaffolding complete
✅ All dependencies installed
✅ Build verified working
✅ Development server running
✅ GitHub Pages configured
