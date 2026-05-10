/**
 * MLBB Counter Pro - Counter Logic Engine
 * -----------------------------------------
 * Implements the multi-dimensional scoring algorithm defined in DOCS/LOGIC.md.
 *
 * Works with both MongoDB (when available) and static JSON data.
 */

import { IHero } from "@/lib/models/Hero";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CounterScore {
  heroId: number;
  heroName: string;
  role: string;
  totalScore: number;
  breakdown: {
    roleAdvantage: number;
    damageTypeEdge: number;
    playStyleMatchup: number;
    ccMobilityFactor: number;
    rangeEngagement: number;
    teamSynergy: number;
  };
  reasons: string[];
}

export interface ItemRecommendation {
  itemId: number;
  itemName: string;
  score: number;
  reason: string;
  tags: string[];
}

export interface CounterResult {
  enemyTeam: Array<{
    heroId: number;
    name: string;
    role: string;
  }>;
  heroCounters: CounterScore[];
  sameRoleCounters: CounterScore[]; // Counters from same role as enemy heroes
  itemRecommendations: ItemRecommendation[];
  analysis: {
    teamDamageProfile: { physical: number; magic: number };
    teamCCLevel: string;
    teamPowerSpike: string;
    teamRoleComposition: Record<string, number>;
  };
}

// ---------------------------------------------------------------------------
// Role Counter Matrix
// ---------------------------------------------------------------------------

const ROLE_MATRIX: Record<string, Record<string, number>> = {
  Tank: { Tank: 0, Fighter: 0.5, Assassin: 1.0, Mage: 0, Marksman: 0.3, Support: 0.5 },
  Fighter: { Tank: 0, Fighter: 0, Assassin: 1.0, Mage: 0.3, Marksman: 0.8, Support: 0.5 },
  Assassin: { Tank: -0.5, Fighter: -0.3, Assassin: 0, Mage: 1.0, Marksman: 1.0, Support: 0.8 },
  Mage: { Tank: 0.8, Fighter: 0.5, Assassin: -0.3, Mage: 0, Marksman: 0.5, Support: 0.5 },
  Marksman: { Tank: 0.5, Fighter: 0, Assassin: -0.5, Mage: 0.3, Marksman: 0, Support: 0.3 },
  Support: { Tank: 0, Fighter: 0.3, Assassin: 0.8, Mage: 0, Marksman: 0.5, Support: 0 },
};

const DAMAGE_MATRIX: Record<string, Record<string, number>> = {
  physical: { physical: 0, magic: 0.4, mixed: 0.2 },
  magic: { magic: 0, physical: 0.4, mixed: 0.2 },
  mixed: { mixed: 0, physical: 0.2, magic: 0.2 },
};

const PLAYSTYLE_MATRIX: Record<string, Record<string, number>> = {
  burst: { burst: 0, sustain: -0.3, poke: 0.5 },
  sustain: { burst: 0.5, sustain: 0, poke: 0.3 },
  poke: { burst: 0.3, sustain: 0, poke: 0 },
};

const CC_MOBILITY_MATRIX: Record<string, Record<string, number>> = {
  none: { low: 0, medium: 0, high: 0 },
  soft: { low: 0.2, medium: 0.3, high: 0.5 },
  hard: { low: 0.3, medium: 0.5, high: 0.8 },
};

const MOBILITY_MATRIX: Record<string, Record<string, number>> = {
  low: { low: 0, medium: -0.3, high: -0.5 },
  medium: { low: 0.2, medium: 0, high: -0.3 },
  high: { low: 0.5, medium: 0.3, high: 0 },
};

const RANGE_MATRIX: Record<string, Record<string, number>> = {
  melee: { melee: 0, ranged: -0.3 },
  ranged: { melee: 0.3, ranged: 0 },
};

// ---------------------------------------------------------------------------
// Scoring Functions
// ---------------------------------------------------------------------------

function scoreRoleAdvantage(hero: IHero, enemies: IHero[]): number {
  if (enemies.length === 0) return 0;
  let total = 0;
  for (const enemy of enemies) total += ROLE_MATRIX[hero.role]?.[enemy.role] ?? 0;
  return total / enemies.length;
}

function scoreDamageTypeEdge(hero: IHero, enemies: IHero[]): number {
  if (enemies.length === 0) return 0;
  let total = 0;
  for (const enemy of enemies) {
    const attackEdge = DAMAGE_MATRIX[hero.damageType]?.[enemy.damageType] ?? 0;
    const defenseEdge = -(DAMAGE_MATRIX[enemy.damageType]?.[hero.damageType] ?? 0);
    total += attackEdge + defenseEdge;
  }
  return total / enemies.length;
}

function scorePlayStyleMatchup(hero: IHero, enemies: IHero[]): number {
  if (enemies.length === 0) return 0;
  let total = 0;
  for (const enemy of enemies) total += PLAYSTYLE_MATRIX[hero.playStyle]?.[enemy.playStyle] ?? 0;
  return total / enemies.length;
}

function scoreCCMobilityFactor(hero: IHero, enemies: IHero[]): number {
  if (enemies.length === 0) return 0;
  let total = 0;
  for (const enemy of enemies) {
    const ccScore = CC_MOBILITY_MATRIX[hero.crowdControl]?.[enemy.mobility] ?? 0;
    const mobScore = MOBILITY_MATRIX[hero.mobility]?.[enemy.mobility] ?? 0;
    total += ccScore + mobScore * 0.5;
  }
  return total / enemies.length;
}

function scoreRangeEngagement(hero: IHero, enemies: IHero[]): number {
  if (enemies.length === 0) return 0;
  let total = 0;
  for (const enemy of enemies) total += RANGE_MATRIX[hero.range]?.[enemy.range] ?? 0;
  return total / enemies.length;
}

function scoreTeamSynergy(hero: IHero, enemies: IHero[]): number {
  if (enemies.length === 0) return 0;
  let score = 0;
  const enemyRoles = enemies.map((e) => e.role);
  const enemyDamageTypes = enemies.map((e) => e.damageType);
  const hasTank = enemyRoles.includes("Tank");
  if (!hasTank && (hero.role === "Assassin" || hero.role === "Fighter")) score += 0.3;
  if (enemyDamageTypes.every((d) => d === "physical") && hero.role === "Tank") score += 0.3;
  if (enemyDamageTypes.every((d) => d === "magic") && hero.role === "Tank") score += 0.3;
  if (enemyRoles.includes("Marksman") && hero.role === "Assassin") score += 0.2;
  if (enemyRoles.includes("Assassin") && (hero.role === "Tank" || hero.role === "Support")) score += 0.2;
  return score;
}

function buildReasons(hero: IHero, enemies: IHero[], breakdown: CounterScore["breakdown"]): string[] {
  const reasons: string[] = [];
  const b = breakdown;
  if (b.roleAdvantage > 0.2) reasons.push(`Role advantage vs ${enemies.map(e => `${e.name} (${e.role})`).join(", ")}`);
  if (b.damageTypeEdge > 0.1) reasons.push(`Damage type edge: ${hero.damageType} exploits enemy composition`);
  if (b.playStyleMatchup > 0.1) reasons.push(`${hero.playStyle} playstyle counters enemy's`);
  if (b.ccMobilityFactor > 0.15) {
    const hardCC = enemies.filter((e) => hero.crowdControl === "hard" && e.mobility === "high");
    if (hardCC.length > 0) reasons.push(`Hard CC shuts down mobile threats like ${hardCC.map(e => e.name).join(", ")}`);
  }
  if (b.rangeEngagement > 0.1) {
    const outranged = enemies.filter((e) => hero.range === "ranged" && e.range === "melee");
    if (outranged.length > 0) reasons.push(`Range advantage over ${outranged.map(e => e.name).join(", ")}`);
  }
  if (b.teamSynergy > 0.1) reasons.push(`Fills team gaps against enemy composition`);
  if (reasons.length === 0) reasons.push(`Balanced matchup across all attributes`);
  return reasons;
}

function scoreItems(enemies: IHero[]): ItemRecommendation[] {
  const recommendations: ItemRecommendation[] = [];
  const enemyDamageTypes = enemies.map(e => e.damageType);
  const enemyRoles = enemies.map(e => e.role);
  const enemyPlayStyles = enemies.map(e => e.playStyle);
  const enemyTags = enemies.flatMap(e => e.tags);

  const isPhysicalHeavy = enemyDamageTypes.filter(d => d === "physical").length >= 3;
  const isMagicHeavy = enemyDamageTypes.filter(d => d === "magic").length >= 3;
  const hasHealers = enemyTags.includes("heal");
  const hasHighCC = enemies.filter(e => e.crowdControl === "hard").length >= 2;
  const hasBurst = enemyPlayStyles.filter(s => s === "burst").length >= 2;
  const hasAutoAttackers = enemyRoles.includes("Marksman") || enemyRoles.includes("Fighter");
  const hasSustain = enemyPlayStyles.filter(s => s === "sustain").length >= 2;

  const ITEM_KNOWLEDGE_BASE = [
    { name: "Antique Cuirass", tags: ["physical_def", "anti_burst"],
      scoreFn: (ctx: any) => ({ score: ctx.isPhysicalHeavy ? 95 : ctx.hasAutoAttackers ? 75 : 50,
        reason: ctx.isPhysicalHeavy ? "Reduces physical attack from enemy's heavy physical lineup" : "Provides physical defense against basic attackers" }) },
    { name: "Blade Armor", tags: ["physical_def", "anti_auto"],
      scoreFn: (ctx: any) => ({ score: ctx.hasAutoAttackers ? 90 : 40, reason: "Reflects damage and provides armor against auto-attack reliant enemies" }) },
    { name: "Athena's Shield", tags: ["magic_def", "anti_burst"],
      scoreFn: (ctx: any) => ({ score: ctx.isMagicHeavy ? 95 : ctx.hasBurst ? 75 : 40,
        reason: ctx.isMagicHeavy ? "Blocks massive magic damage from enemy's heavy magic lineup" : "Shields against burst magic damage" }) },
    { name: "Radiant Armor", tags: ["magic_def", "anti_sustain"],
      scoreFn: (ctx: any) => ({ score: ctx.isMagicHeavy && ctx.hasSustain ? 90 : ctx.isMagicHeavy ? 80 : 40, reason: "Reduces sustained magic damage over time" }) },
    { name: "Twilight Armor", tags: ["hp", "anti_burst", "anti_crit"],
      scoreFn: (ctx: any) => ({ score: ctx.hasBurst ? 85 : 50, reason: "Prevents one-shot burst combos from assassins" }) },
    { name: "Dominance Ice", tags: ["physical_def", "anti_heal", "anti_attack_speed"],
      scoreFn: (ctx: any) => ({ score: ctx.hasHealers || ctx.hasSustain ? 90 : ctx.hasAutoAttackers ? 75 : 45,
        reason: ctx.hasHealers ? "Reduces enemy healing and attack speed simultaneously" : "Slows down auto-attack enemies with attack speed reduction" }) },
    { name: "Necklace of Durance", tags: ["anti_heal"],
      scoreFn: (ctx: any) => ({ score: ctx.hasHealers || ctx.hasSustain ? 92 : 30, reason: "Critical anti-heal item against enemy sustain/heal composition" }) },
    { name: "Sea Halberd", tags: ["anti_heal", "physical"],
      scoreFn: (ctx: any) => ({ score: ctx.hasHealers || ctx.hasSustain ? 88 : 35, reason: "Anti-heal for physical damage dealers facing sustain enemies" }) },
    { name: "Cursed Helmet", tags: ["magic_def", "hp", "aoe_magic"],
      scoreFn: (ctx: any) => ({ score: ctx.isMagicHeavy ? 75 : 40, reason: "Deals AoE magic damage while providing magic defense" }) },
    { name: "Immortality", tags: ["survival", "anti_burst"],
      scoreFn: (ctx: any) => ({ score: ctx.hasBurst ? 80 : 45, reason: "Provides a second life against burst-heavy enemy comps" }) },
    { name: "Tough Boots", tags: ["magic_def", "cc_reduction"],
      scoreFn: (ctx: any) => ({ score: ctx.hasHighCC ? 85 : 50,
        reason: ctx.hasHighCC ? "Reduces CC duration against enemy's heavy CC lineup" : "Provides magic defense and CC reduction" }) },
    { name: "Warrior Boots", tags: ["physical_def"],
      scoreFn: (ctx: any) => ({ score: ctx.isPhysicalHeavy ? 75 : 40, reason: "Provides early physical defense against physical-heavy enemy" }) },
  ];

  const ctx = { isPhysicalHeavy, isMagicHeavy, hasHealers, hasHighCC, hasBurst, hasAutoAttackers, hasSustain };
  for (const item of ITEM_KNOWLEDGE_BASE) {
    const result = item.scoreFn(ctx);
    if (result.score > 0) recommendations.push({ itemId: 0, itemName: item.name, score: result.score, reason: result.reason, tags: item.tags });
  }
  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, 3);
}

function analyzeTeam(enemies: IHero[]) {
  const damageProfile = { physical: 0, magic: 0 };
  for (const e of enemies) {
    if (e.damageType === "physical") damageProfile.physical++;
    else if (e.damageType === "magic") damageProfile.magic++;
    else { damageProfile.physical += 0.5; damageProfile.magic += 0.5; }
  }
  const total = damageProfile.physical + damageProfile.magic;
  const teamDamageProfile = { physical: Math.round((damageProfile.physical / (total || 1)) * 100), magic: Math.round((damageProfile.magic / (total || 1)) * 100) };
  const hardCC = enemies.filter(e => e.crowdControl === "hard").length;
  const softCC = enemies.filter(e => e.crowdControl === "soft").length;
  let teamCCLevel = "low";
  if (hardCC >= 2) teamCCLevel = "high";
  else if (hardCC >= 1 || softCC >= 3) teamCCLevel = "medium";
  const earlyCount = enemies.filter(e => e.powerSpike === "early").length;
  const lateCount = enemies.filter(e => e.powerSpike === "late").length;
  let teamPowerSpike = "mid";
  if (earlyCount > lateCount && earlyCount >= 2) teamPowerSpike = "early";
  else if (lateCount > earlyCount && lateCount >= 2) teamPowerSpike = "late";
  const teamRoleComposition: Record<string, number> = {};
  for (const e of enemies) teamRoleComposition[e.role] = (teamRoleComposition[e.role] || 0) + 1;
  return { teamDamageProfile, teamCCLevel, teamPowerSpike, teamRoleComposition };
}

// ---------------------------------------------------------------------------
// Main Engine - works with any array of heroes (MongoDB or static data)
// ---------------------------------------------------------------------------

export async function analyzeEnemyTeam(enemyHeroNames: string[], allHeroes?: IHero[]): Promise<CounterResult> {
  // If no heroes provided, try to load from MongoDB (will fail gracefully if no connection)
  if (!allHeroes) {
    try {
      const { connectToDatabase } = await import("@/lib/db/mongodb");
      await connectToDatabase();
      const Hero = (await import("@/lib/models/Hero")).default;
      allHeroes = await Hero.find({}).lean<IHero[]>();
    } catch {
      // Fallback to static data if MongoDB is not available
      const heroesData = await import("@/data/heroes.json").then(m => m.default);
      allHeroes = heroesData as unknown as IHero[];
    }
  }

  if (!allHeroes || allHeroes.length === 0) {
    throw new Error("No hero data available. Please set up MongoDB or seed the database.");
  }

  const enemyHeroes: IHero[] = [];
  const unknownHeroes: string[] = [];

  for (const name of enemyHeroNames) {
    const found = allHeroes.find(h => h.name.toLowerCase() === name.toLowerCase());
    if (found) enemyHeroes.push(found);
    else unknownHeroes.push(name);
  }

  if (enemyHeroes.length === 0) {
    throw new Error(`No known heroes found in enemy team. Unknown: ${unknownHeroes.join(", ") || "none provided"}`);
  }

  const teamAnalysis = analyzeTeam(enemyHeroes);
  const counterScores: CounterScore[] = [];

  for (const hero of allHeroes) {
    if (enemyHeroes.some(e => e.heroId === hero.heroId || e.name === hero.name)) continue;

    const roleAdvantage = scoreRoleAdvantage(hero, enemyHeroes);
    const damageTypeEdge = scoreDamageTypeEdge(hero, enemyHeroes);
    const playStyleMatchup = scorePlayStyleMatchup(hero, enemyHeroes);
    const ccMobilityFactor = scoreCCMobilityFactor(hero, enemyHeroes);
    const rangeEngagement = scoreRangeEngagement(hero, enemyHeroes);
    const teamSynergy = scoreTeamSynergy(hero, enemyHeroes);

    const totalScore = 0.30 * roleAdvantage + 0.20 * damageTypeEdge + 0.15 * playStyleMatchup +
      0.15 * ccMobilityFactor + 0.10 * rangeEngagement + 0.10 * teamSynergy;

    const breakdown = { roleAdvantage, damageTypeEdge, playStyleMatchup, ccMobilityFactor, rangeEngagement, teamSynergy };
    const reasons = buildReasons(hero, enemyHeroes, breakdown);

    counterScores.push({
      heroId: hero.heroId, heroName: hero.name, role: hero.role,
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: Object.fromEntries(Object.entries(breakdown).map(([k, v]) => [k, Math.round(v * 100) / 100])) as any,
      reasons,
    });
  }

  counterScores.sort((a, b) => b.totalScore - a.totalScore);
  
  // Get top 3 overall counters
  const topCounters = counterScores.slice(0, 3);
  
  // Get same-role counters (2 from each role present in enemy team)
  const sameRoleCounters: CounterScore[] = [];
  const enemyRoles = Array.from(new Set(enemyHeroes.map(e => e.role)));
  
  for (const role of enemyRoles) {
    const roleCounters = counterScores
      .filter(c => c.role === role)
      .slice(0, 2); // Get top 2 from same role
    sameRoleCounters.push(...roleCounters);
  }
  
  // Sort same-role counters by score and limit to top picks
  sameRoleCounters.sort((a, b) => b.totalScore - a.totalScore);
  
  const itemRecommendations = scoreItems(enemyHeroes);

  return {
    enemyTeam: enemyHeroes.map(h => ({ heroId: h.heroId, name: h.name, role: h.role })),
    heroCounters: topCounters,
    sameRoleCounters: sameRoleCounters.slice(0, 5), // Return up to 5 same-role counters
    itemRecommendations,
    analysis: teamAnalysis,
  };
}
