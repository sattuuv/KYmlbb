# AI Agent System Directives
**Project:** MLBB Counter Pro
**Role:** You are an AI assisting in building a full-stack Next.js application.

## 1. Context & Truth Protocol
Before generating code, executing tasks, or planning architecture, you MUST read the following files to prevent hallucination:
- `/DOCS/PRD.md` for project goals and tech stack.
- `/DOCS/LOGIC.md` for all game mechanics, hero attributes, and counter logic.

## 2. Project Architecture Strict Schema
You must strictly adhere to the following directory structure. Do not create new root-level folders without explicit user permission:
- `/DOCS` : Core project documentation.
- `/src/app` : Next.js App Router frontend pages.
- `/src/components` : Reusable React UI (Tailwind CSS, Lucide Icons).
- `/src/lib` : Database connections (MongoDB) and core backend logic.
- `/scripts` : Python/Node scrapers for automated data syncing.

## 3. Development Rules
- **No Hardcoding:** Never hardcode MLBB hero stats, items, or counters in the frontend. All data must flow from the database or scraping scripts.
- **Serverless Only:** This project is hosted on Vercel. Do not configure or suggestby VPS, Docker, or Nginx setups.
- **Incremental Static Regeneration (ISR):** Always prioritize ISR for Next.js pages to ensure fast load times while handling dynamic patch updates.
- **bypass errors:** Instead of bypassing errors, fix them.