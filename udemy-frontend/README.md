# Udemy YatriCloud Frontend

A modern React + TypeScript frontend for the Udemy YatriCloud platform.

## Features

- View all Udemy courses
- Filter by instructor, category, and technology
- Responsive design with Tailwind CSS
- Dark mode support
- Real-time course data from backend
- Add new courses (authenticated users)
- Course management dashboard

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Query
- Framer Motion
- Shadcn UI Components

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Environment Variables

Create a `.env.local` file in the root directory:

```
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=Udemy YatriCloud
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Shadcn UI components
│   ├── udemy/        # Udemy-specific components
│   └── sections/     # Page sections
├── pages/            # Page components
├── contexts/         # React contexts
├── hooks/            # Custom hooks
├── lib/              # Utilities and helpers
├── data/             # Static data and constants
└── styles/           # Global styles
```

## License

MIT
