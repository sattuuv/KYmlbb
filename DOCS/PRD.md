# MLBB Counter Pro - Product Requirements Document

## Overview
MLBB Counter Pro is a web application that helps Mobile Legends: Bang Bang players counter-pick enemy heroes in the draft phase. The "Brain" is the core intelligence engine that analyzes enemy team composition and recommends optimal counters.

## Core Features (Brain Component)

### 1. Hero & Item Data Pipeline
- **Source**: MLBB Fandom Wiki (scraped)
- **Data**: Hero names, roles, damage types, play styles, item stats
- **Schedule**: Daily refresh via Vercel Cron Job (6:00 AM UTC)
- **Storage**: MongoDB Atlas (free tier)

### 2. Counter Recommendation API
- **Endpoint**: `POST /api/counter`
- **Input**: Array of 1-5 enemy hero names
- **Output**: Top 3 counter heroes (with scores) + Top 3 counter items (with explanations)
- **Algorithm**: Multi-dimensional scoring (role, damage type, play style, CC, mobility, range)

### 3. Technical Requirements
- **Database**: MongoDB with collections: heroes, items, counters
- **Scraper**: Python (BeautifulSoup + requests) - robust for Vercel serverless + cron
- **Resolver**: Node.js/Next.js API route
- **Response time**: < 500ms (cached computation)

## Data Schema

### Hero Collection
```
{
  _id: ObjectId,
  heroId: Number,
  name: String,
  title: String,
  role: String,
  damageType: String,
  playStyle: String,
  mobility: String,
  crowdControl: String,
  range: String,
  survivability: String,
  powerSpike: String,
  tags: [String],
  imageUrl: String,
  stats: { hp, mana, physicalAttack, magicPower, physicalDef, magicDef, ... },
  skills: [{ name, description, type }],
  updatedAt: Date
}
```

### Item Collection
```
{
  _id: ObjectId,
  itemId: Number,
  name: String,
  type: String,
  cost: Number,
  stats: { physicalDef, magicDef, hp, regen, ... },
  passive: String,
  tags: [String],
  counters: [String],   // what threats this item counters
  updatedAt: Date
}
```

### Counter Relationships (pre-computed)
```
{
  _id: ObjectId,
  heroId: Number,
  counters: [{ againstHeroId, score, reason }],
  counteredBy: [{ byHeroId, score, reason }],
  updatedAt: Date
}
```

## Constraints
- Scraper must be robust to minor HTML changes on Fandom
- No hardcoded stats - always source from database
- Must gracefully handle unknown heroes (return partial results)
- Vercel-free tier compatible (10s function timeout, 512MB memory)