# Phishing Detection Dashboard - PishLense

## Project Overview

**PishLense** is a comprehensive Phishing Detection Dashboard designed to help users identify, analyze, and protect themselves from phishing threats. This application provides real-time phishing detection, detailed scan analysis, and educational resources to improve online security awareness.

## Features

- 🔍 **Real-time Phishing Detection** - Scan websites and URLs for phishing threats
- 📊 **Detailed Analytics** - View comprehensive reports on phishing risks and patterns
- 📚 **Educational Resources** - Learn about phishing detection and cybersecurity best practices
- ⚙️ **Customizable Settings** - Configure detection rules and preferences
- 🎯 **Risk Assessment** - Get detailed risk ratings and recommendations

## Getting Started

### Prerequisites

- Node.js (v16 or higher) & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Bun (optional, for faster package management)

### Installation Steps

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd PishLense/website

# Step 3: Install dependencies
npm install
# or if using bun
bun install

# Step 4: Start the development server
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:8080`

### Alternative Setup Methods

**Edit on GitHub**

- Navigate to the desired file(s)
- Click the "Edit" button (pencil icon) at the top right
- Make your changes and commit

**Use GitHub Codespaces**

- Go to the repository's main page
- Click "Code" → "Codespaces" → "New codespace"
- Edit files directly in the browser and push changes

## Technologies Used

This project is built with modern web technologies:

- **Vite** - Lightning-fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library for building interfaces
- **shadcn/ui** - Beautiful, accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Vitest** - Unit testing framework

## Build & Deployment Scripts

```sh
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## Deployment

The application can be deployed to various platforms:

```sh
# Build the project
npm run build

# Deploy the 'dist' folder to your hosting platform
# Recommended platforms: Vercel, Netlify, GitHub Pages, or any static host
```

### Quick Deploy to Vercel

```sh
npm install -g vercel
vercel
```

## Project Structure

```
src/
├── components/     # Reusable React components
├── pages/          # Page components for different routes
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and helpers
├── types/          # TypeScript type definitions
├── contexts/       # React Context providers
├── App.tsx         # Main App component
└── main.tsx        # Application entry point
```

## Contributing

Community contributions are welcome! Please feel free to submit issues and pull requests to help improve this project.

## Support & Documentation

For more information about the technologies used:
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## License

This project is open source and available under the MIT License.
