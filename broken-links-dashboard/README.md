# Broken Links Dashboard

A modern React + TypeScript + Tailwind CSS dashboard for monitoring and analyzing broken links across multiple locales.

## Features

- **Real-time Metrics**: Track total URLs, broken links, success rate, and response times
- **Interactive Charts**: Visualize trends, error distributions, and response time analysis
- **Locale Analysis**: Monitor broken links across different locales
- **Advanced Analytics**: Detailed insights into error types and patterns
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Dark theme with gradient effects and smooth animations

## Tech Stack

- **React 18**: For building the UI
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Beautiful React charts
- **Lucide Icons**: Modern icon library
- **Date-fns**: Date manipulation

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Production Build

```bash
npm run build
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx    # Overview tab with KPIs and trends
│   ├── Analytics.tsx    # Advanced analytics tab
│   ├── Locales.tsx      # Locale analysis tab
│   └── Card.tsx         # Reusable Card component
├── data/
│   └── mockData.ts      # Mock data (replace with real API)
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Tailwind styles
```

## Configuration

Edit `vite.config.ts` to update the base path for GitHub Pages deployment.

## License

MIT
