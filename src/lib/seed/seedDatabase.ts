/**
 * MLBB Counter Pro - Database Seeder
 * ------------------------------------
 * Seeds the MongoDB database with hero and item data.
 * Can be run as a script or triggered via API.
 *
 * Usage (via API): POST /api/seed
 * Usage (script): npx ts-node --compiler-options '{"module":"commonjs"}' src/lib/seed/seedDatabase.ts
 */

import { connectToDatabase } from "../db/mongodb";
import Hero from "../models/Hero";
import Item from "../models/Item";

import fs from 'fs';
import path from 'path';

// Note: DEFAULT_HERO_DATA and DEFAULT_ITEM_DATA are no longer used since we read directly from the generated JSON files.
// You can remove them or keep them as fallback. We will read from src/data/heroes.json and items.json.

export async function seedDatabase() {
  console.log("🌱 Seeding database...");

  await connectToDatabase();

  // Load data from generated JSON files
  const dataDir = path.join(process.cwd(), 'src', 'data');
  const heroesFile = path.join(dataDir, 'heroes.json');
  const itemsFile = path.join(dataDir, 'items.json');
  
  let heroesData = [];
  let itemsData = [];

  try {
    if (fs.existsSync(heroesFile)) {
      heroesData = JSON.parse(fs.readFileSync(heroesFile, 'utf8'));
    }
    if (fs.existsSync(itemsFile)) {
      itemsData = JSON.parse(fs.readFileSync(itemsFile, 'utf8'));
    }
  } catch (err) {
    console.error("❌ Failed to read data files. Did you run the scraper?", err);
  }

  // Clear old data to prevent duplicate key issues with changing IDs
  await Hero.deleteMany({});
  await Item.deleteMany({});

  // Seed heroes using bulkWrite (upsert)
  if (heroesData.length > 0) {
    const heroOps = heroesData.map((hero: any) => ({
      updateOne: {
        filter: { name: hero.name },
        update: { $set: hero },
        upsert: true
      }
    }));
    const heroResult = await Hero.bulkWrite(heroOps);
    console.log(`✅ Upserted ${heroResult.upsertedCount} new heroes, modified ${heroResult.modifiedCount} existing heroes (total ${heroesData.length})`);
  } else {
    console.log(`⏭️ No hero data found to seed. Skipping...`);
  }

  // Seed items using bulkWrite (upsert)
  if (itemsData.length > 0) {
    const itemOps = itemsData.map((item: any) => ({
      updateOne: {
        filter: { name: item.name },
        update: { $set: item },
        upsert: true
      }
    }));
    const itemResult = await Item.bulkWrite(itemOps);
    console.log(`✅ Upserted ${itemResult.upsertedCount} new items, modified ${itemResult.modifiedCount} existing items (total ${itemsData.length})`);
  } else {
    console.log(`⏭️ No item data found to seed. Skipping...`);
  }

  console.log("🌱 Database seeding complete!");
  return {
    seededHeroes: heroesData.length,
    seededItems: itemsData.length,
  };
}

// Run directly if called as script
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  seedDatabase()
    .then((result) => {
      console.log("Seed result:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}