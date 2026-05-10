# MLBB Counter Pro

A professional Mobile Legends: Bang Bang counter picker and strategy tool built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Hero Selection Grid**: Browse and select from a comprehensive list of MLBB heroes
- **Counter Dashboard**: Get real-time counter recommendations for selected heroes
- **Role-based Filtering**: Filter heroes by their roles (Tank, Fighter, Assassin, Mage, Marksman, Support)
- **Hero Statistics**: View detailed stats including damage, defense, mobility, and crowd control
- **Responsive Design**: Optimized for desktop and mobile devices
- **Gaming Aesthetic**: Modern, dark-themed UI designed for gaming enthusiasts
- **ISR Support**: Incremental Static Regeneration for optimal performance

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom gaming theme
- **Icons**: Lucide React
- **Data**: JSON-based hero data with API fallback

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd KYmlbb
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   │   └── heroes/     # Heroes API endpoint with ISR
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── CounterDashboard.tsx
│   └── HeroGrid.tsx
├── data/              # Static data
│   └── heroes.json    # Hero data with counter relationships
├── lib/               # Utility functions
│   └── utils.ts
└── types/             # TypeScript type definitions
    └── hero.ts
```

## Data Structure

Each hero contains:
- Basic info (name, role, difficulty, description)
- Statistics (damage, defense, mobility, crowd control)
- Counter relationships (counters and counteredBy arrays)
- Avatar placeholder

## API Endpoints

### GET /api/heroes

Returns all heroes data with ISR caching:
- Cache: 1 hour
- Stale-while-revalidate: 24 hours

## Customization

### Adding New Heroes

1. Update `src/data/heroes.json` with new hero data
2. Ensure counter relationships are properly defined
3. The API will automatically pick up the changes

### Styling

The project uses a custom gaming theme defined in `tailwind.config.js`:
- Gaming color palette
- Custom animations (glow, pulse-slow)
- Gaming-specific utility classes

## Performance Features

- **ISR**: Heroes API uses Incremental Static Regeneration
- **Lazy Loading**: Components load data on-demand
- **Optimized Images**: Placeholder system for hero avatars
- **Responsive Design**: Mobile-first approach with breakpoints

## Future Enhancements

- Real hero avatars integration
- Advanced filtering options
- Team composition analyzer
- Win rate statistics
- Patch notes integration
- User preferences

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

Built with ❤️ for the Mobile Legends community
