# certification.yatricloud.com

Yatri Cloud Certification Practice Hub - Free practice tests and exam preparation resources for cloud certifications.

## Features

- 🎯 **Free Practice Tests** - Access practice tests for AWS, Azure, GCP, and more
- 📚 **Exam Guides** - Step-by-step certification roadmaps
- 📖 **Study Materials** - Curated notes and cheat sheets
- 🎥 **Video Tutorials** - In-depth concept explanations
- 👥 **Expert Instructors** - Learn from certified cloud professionals
- 🔄 **Updated Weekly** - Fresh content regularly

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Backend**: Express.js (Proxy server for Udemy API)
- **State Management**: React Query

## Setup

### Prerequisites

- Node.js 18+ and npm
- Udemy Instructor API tokens (for course data)

### Installation

```bash
# Clone the repository
git clone https://github.com/yatricloud/certification.yatricloud.com.git
cd certification.yatricloud.com

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Udemy API tokens to .env
```

### Environment Variables

Create a `.env` file with:

```env
UDEMY_INSTRUCTOR_TOKEN=your_yatharth_token
UDEMY_INSTRUCTOR_TOKEN_NENSI=your_nensi_token
```

### Development

```bash
# Start frontend dev server
npm run dev

# Start backend proxy server (in separate terminal)
npm run server

# Or run both concurrently
npm run dev:all
```

## Deployment

### Render (Recommended)

1. Connect your GitHub repository to Render
2. Create a new **Web Service**
3. Build Command: `npm install && npm run build`
4. Start Command: `npm run preview` (for frontend only)
5. Add environment variables in Render dashboard

**Note**: For full functionality, you'll need to deploy the backend proxy server separately or use Render's background worker.

### Vercel (Alternative)

1. Import your GitHub repository to Vercel
2. Framework Preset: Vite
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add environment variables

### Netlify (Alternative)

1. Connect repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

## Project Structure

```
├── src/
│   ├── components/       # React components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   └── data/             # Static data
├── server.js             # Backend proxy server
└── package.json
```

## License

© 2025 Yatri Cloud. All rights reserved.
