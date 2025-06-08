# 🎬 CineVision - Movie Ranking & Recommendations

<div align="center">
  <p><strong>A modern web app for ranking movies and getting personalized AI-powered recommendations</strong></p>
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

## ✨ Features

- **Movie Search** - Smart autofill search with debouncing
- **Movie Details** - View comprehensive movie information including cast, crew, and synopsis
- **Rating System** - Rate movies on a 5-star scale
- **Personalized Recommendations** - Algorithm-based recommendations (60% your favorites, 40% trending)
- **AI Recommendations** - Get movie suggestions based on your mood and preferences
- **Favorites Management** - Track and sort your favorite movies (4+ stars)
- **Watchlist** - Save movies to watch later
- **Responsive Design** - Works seamlessly on mobile, tablet, and desktop

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **pnpm** (recommended package manager)
- **TMDB API Key** - Get one free at [themoviedb.org](https://www.themoviedb.org/settings/api)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd cinevision

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Add your TMDB API key to .env
# VITE_TMDB_API_KEY=your_api_key_here

# Start development server
pnpm dev
```

### Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Code Quality
pnpm biome:check  # Check code formatting and linting
pnpm biome:fix:unsafe # Fix code issues (unsafe)
```

## 📁 Project Structure

```
src/
├── app/
│   ├── routes/           # File-based routing
│   │   ├── __root.tsx   # Root layout with header
│   │   └── index.tsx    # Main app page
│   └── styles/          # Global styles
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── Header.tsx       # App header with login
│   ├── Search.tsx       # Movie search with autofill
│   ├── MovieCard.tsx    # Reusable movie card
│   ├── MovieDetailsModal.tsx
│   ├── SearchResultsModal.tsx
│   ├── Recommendations.tsx
│   ├── AIRecommendations.tsx
│   └── FavoritesTable.tsx
├── services/
│   ├── tmdb.ts          # TMDB API integration
│   ├── storage.ts       # Local storage for ratings
│   └── ai.ts            # AI recommendations service
├── hooks/
│   └── useDebounce.ts   # Debounce hook
└── utils/               # Utility functions
```

## 🎯 Core Technologies

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| **TanStack Start** | Full-stack React framework | [Docs](https://tanstack.com/start) |
| **React 19** | UI library | [Docs](https://react.dev/) |
| **TypeScript** | Type safety | [Docs](https://typescriptlang.org/) |
| **shadcn/ui** | Component library | [Docs](https://ui.shadcn.com/) |
| **Tailwind CSS v4** | Styling framework | [Docs](https://tailwindcss.com/) |
| **TMDB API** | Movie database | [Docs](https://developer.themoviedb.org/docs) |
| **Zod** | Schema validation | [Docs](https://zod.dev/) |

## 🔧 Configuration

### Environment Variables
Create a `.env` file with the following variables:

```env
# Required
VITE_TMDB_API_KEY=your_tmdb_api_key_here

# Optional (for full functionality)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_LLM_API_KEY=your_openai_api_key
VITE_LLM_API_URL=https://api.openai.com/v1/chat/completions
```

### API Keys
1. **TMDB API Key** (Required)
   - Sign up at [themoviedb.org](https://www.themoviedb.org/signup)
   - Go to Settings → API
   - Copy your API Key (v3 auth)

2. **Google OAuth** (Optional)
   - Currently implemented as a placeholder
   - Can be configured for real authentication

3. **LLM API** (Optional)
   - For AI-powered recommendations
   - Defaults to OpenAI API format
   - Falls back to genre-based recommendations if not configured

## 🚀 Deployment

### Build for Production
```bash
pnpm build
```

### Start Production Server
```bash
pnpm start
```

## 🎨 Features in Detail

### Search & Discovery
- **Smart Autofill**: Searches trigger after 3 characters with 300ms debounce
- **Article Handling**: Intelligently matches titles even without articles (e.g., "The")
- **Keyboard Navigation**: Full keyboard support for search suggestions

### Rating System
- **5-Star Ratings**: Click to rate, click same star to remove rating
- **Instant Persistence**: Ratings saved to local storage immediately
- **Favorites**: Movies rated 4+ stars appear in favorites table

### Recommendations Algorithm
- **Personalized Mix**: 60% based on your top-rated movies, 40% trending
- **Similar Movies**: Uses TMDB's similarity and recommendation APIs
- **Fallback**: Shows trending movies if no ratings exist

### AI Recommendations
- **Natural Language**: Describe what you're in the mood for
- **Context Aware**: Considers your rating history
- **Smart Fallbacks**: Genre-based recommendations if API unavailable

## 🐛 Troubleshooting

### Common Issues

1. **No movie posters showing**
   - Check your TMDB API key is correctly set in `.env`
   - Ensure you're connected to the internet

2. **AI recommendations not working**
   - Verify your LLM API key is set
   - Check the console for API errors
   - The app will fall back to genre-based recommendations

3. **Ratings not persisting**
   - Check browser's local storage isn't disabled
   - Try clearing local storage and refreshing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for movie enthusiasts</p>
</div>
