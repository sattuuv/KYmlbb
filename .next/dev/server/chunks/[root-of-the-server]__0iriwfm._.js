module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/engine/counterEngine.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * MLBB Counter Pro - Counter Logic Engine
 * -----------------------------------------
 * Implements the multi-dimensional scoring algorithm defined in DOCS/LOGIC.md.
 *
 * Works with both MongoDB (when available) and static JSON data.
 */ __turbopack_context__.s([
    "analyzeEnemyTeam",
    ()=>analyzeEnemyTeam
]);
// ---------------------------------------------------------------------------
// Role Counter Matrix
// ---------------------------------------------------------------------------
const ROLE_MATRIX = {
    Tank: {
        Tank: 0,
        Fighter: 0.5,
        Assassin: 1.0,
        Mage: 0,
        Marksman: 0.3,
        Support: 0.5
    },
    Fighter: {
        Tank: 0,
        Fighter: 0,
        Assassin: 1.0,
        Mage: 0.3,
        Marksman: 0.8,
        Support: 0.5
    },
    Assassin: {
        Tank: -0.5,
        Fighter: -0.3,
        Assassin: 0,
        Mage: 1.0,
        Marksman: 1.0,
        Support: 0.8
    },
    Mage: {
        Tank: 0.8,
        Fighter: 0.5,
        Assassin: -0.3,
        Mage: 0,
        Marksman: 0.5,
        Support: 0.5
    },
    Marksman: {
        Tank: 0.5,
        Fighter: 0,
        Assassin: -0.5,
        Mage: 0.3,
        Marksman: 0,
        Support: 0.3
    },
    Support: {
        Tank: 0,
        Fighter: 0.3,
        Assassin: 0.8,
        Mage: 0,
        Marksman: 0.5,
        Support: 0
    }
};
const DAMAGE_MATRIX = {
    physical: {
        physical: 0,
        magic: 0.4,
        mixed: 0.2
    },
    magic: {
        magic: 0,
        physical: 0.4,
        mixed: 0.2
    },
    mixed: {
        mixed: 0,
        physical: 0.2,
        magic: 0.2
    }
};
const PLAYSTYLE_MATRIX = {
    burst: {
        burst: 0,
        sustain: -0.3,
        poke: 0.5
    },
    sustain: {
        burst: 0.5,
        sustain: 0,
        poke: 0.3
    },
    poke: {
        burst: 0.3,
        sustain: 0,
        poke: 0
    }
};
const CC_MOBILITY_MATRIX = {
    none: {
        low: 0,
        medium: 0,
        high: 0
    },
    soft: {
        low: 0.2,
        medium: 0.3,
        high: 0.5
    },
    hard: {
        low: 0.3,
        medium: 0.5,
        high: 0.8
    }
};
const MOBILITY_MATRIX = {
    low: {
        low: 0,
        medium: -0.3,
        high: -0.5
    },
    medium: {
        low: 0.2,
        medium: 0,
        high: -0.3
    },
    high: {
        low: 0.5,
        medium: 0.3,
        high: 0
    }
};
const RANGE_MATRIX = {
    melee: {
        melee: 0,
        ranged: -0.3
    },
    ranged: {
        melee: 0.3,
        ranged: 0
    }
};
// ---------------------------------------------------------------------------
// Scoring Functions
// ---------------------------------------------------------------------------
function scoreRoleAdvantage(hero, enemies) {
    if (enemies.length === 0) return 0;
    let total = 0;
    for (const enemy of enemies)total += ROLE_MATRIX[hero.role]?.[enemy.role] ?? 0;
    return total / enemies.length;
}
function scoreDamageTypeEdge(hero, enemies) {
    if (enemies.length === 0) return 0;
    let total = 0;
    for (const enemy of enemies){
        const attackEdge = DAMAGE_MATRIX[hero.damageType]?.[enemy.damageType] ?? 0;
        const defenseEdge = -(DAMAGE_MATRIX[enemy.damageType]?.[hero.damageType] ?? 0);
        total += attackEdge + defenseEdge;
    }
    return total / enemies.length;
}
function scorePlayStyleMatchup(hero, enemies) {
    if (enemies.length === 0) return 0;
    let total = 0;
    for (const enemy of enemies)total += PLAYSTYLE_MATRIX[hero.playStyle]?.[enemy.playStyle] ?? 0;
    return total / enemies.length;
}
function scoreCCMobilityFactor(hero, enemies) {
    if (enemies.length === 0) return 0;
    let total = 0;
    for (const enemy of enemies){
        const ccScore = CC_MOBILITY_MATRIX[hero.crowdControl]?.[enemy.mobility] ?? 0;
        const mobScore = MOBILITY_MATRIX[hero.mobility]?.[enemy.mobility] ?? 0;
        total += ccScore + mobScore * 0.5;
    }
    return total / enemies.length;
}
function scoreRangeEngagement(hero, enemies) {
    if (enemies.length === 0) return 0;
    let total = 0;
    for (const enemy of enemies)total += RANGE_MATRIX[hero.range]?.[enemy.range] ?? 0;
    return total / enemies.length;
}
function scoreTeamSynergy(hero, enemies) {
    if (enemies.length === 0) return 0;
    let score = 0;
    const enemyRoles = enemies.map((e)=>e.role);
    const enemyDamageTypes = enemies.map((e)=>e.damageType);
    const hasTank = enemyRoles.includes("Tank");
    if (!hasTank && (hero.role === "Assassin" || hero.role === "Fighter")) score += 0.3;
    if (enemyDamageTypes.every((d)=>d === "physical") && hero.role === "Tank") score += 0.3;
    if (enemyDamageTypes.every((d)=>d === "magic") && hero.role === "Tank") score += 0.3;
    if (enemyRoles.includes("Marksman") && hero.role === "Assassin") score += 0.2;
    if (enemyRoles.includes("Assassin") && (hero.role === "Tank" || hero.role === "Support")) score += 0.2;
    return score;
}
function buildReasons(hero, enemies, breakdown) {
    const reasons = [];
    const b = breakdown;
    if (b.roleAdvantage > 0.2) reasons.push(`Role advantage vs ${enemies.map((e)=>`${e.name} (${e.role})`).join(", ")}`);
    if (b.damageTypeEdge > 0.1) reasons.push(`Damage type edge: ${hero.damageType} exploits enemy composition`);
    if (b.playStyleMatchup > 0.1) reasons.push(`${hero.playStyle} playstyle counters enemy's`);
    if (b.ccMobilityFactor > 0.15) {
        const hardCC = enemies.filter((e)=>hero.crowdControl === "hard" && e.mobility === "high");
        if (hardCC.length > 0) reasons.push(`Hard CC shuts down mobile threats like ${hardCC.map((e)=>e.name).join(", ")}`);
    }
    if (b.rangeEngagement > 0.1) {
        const outranged = enemies.filter((e)=>hero.range === "ranged" && e.range === "melee");
        if (outranged.length > 0) reasons.push(`Range advantage over ${outranged.map((e)=>e.name).join(", ")}`);
    }
    if (b.teamSynergy > 0.1) reasons.push(`Fills team gaps against enemy composition`);
    if (reasons.length === 0) reasons.push(`Balanced matchup across all attributes`);
    return reasons;
}
function scoreItems(enemies) {
    const recommendations = [];
    const enemyDamageTypes = enemies.map((e)=>e.damageType);
    const enemyRoles = enemies.map((e)=>e.role);
    const enemyPlayStyles = enemies.map((e)=>e.playStyle);
    const enemyTags = enemies.flatMap((e)=>e.tags);
    const isPhysicalHeavy = enemyDamageTypes.filter((d)=>d === "physical").length >= 3;
    const isMagicHeavy = enemyDamageTypes.filter((d)=>d === "magic").length >= 3;
    const hasHealers = enemyTags.includes("heal");
    const hasHighCC = enemies.filter((e)=>e.crowdControl === "hard").length >= 2;
    const hasBurst = enemyPlayStyles.filter((s)=>s === "burst").length >= 2;
    const hasAutoAttackers = enemyRoles.includes("Marksman") || enemyRoles.includes("Fighter");
    const hasSustain = enemyPlayStyles.filter((s)=>s === "sustain").length >= 2;
    const ITEM_KNOWLEDGE_BASE = [
        {
            name: "Antique Cuirass",
            tags: [
                "physical_def",
                "anti_burst"
            ],
            scoreFn: (ctx)=>({
                    score: ctx.isPhysicalHeavy ? 95 : ctx.hasAutoAttackers ? 75 : 50,
                    reason: ctx.isPhysicalHeavy ? "Reduces physical attack from enemy's heavy physical lineup" : "Provides physical defense against basic attackers"
                })
        },
        {
            name: "Blade Armor",
            tags: [
                "physical_def",
                "anti_auto"
            ],
            scoreFn: (ctx)=>({
                    score: ctx.hasAutoAttackers ? 90 : 40,
                    reason: "Reflects damage and provides armor against auto-attack reliant enemies"
                })
        },
        {
            name: "Athena's Shield",
            tags: [
                "magic_def",
                "anti_burst"
            ],
            scoreFn: (ctx)=>({
                    score: ctx.isMagicHeavy ? 95 : ctx.hasBurst ? 75 : 40,
                    reason: ctx.isMagicHeavy ? "Blocks massive magic damage from enemy's heavy magic lineup" : "Shields against burst magic damage"
                })
        },
        {
            name: "Radiant Armor",
            tags: [
                "magic_def",
                "anti_sustain"
            ],
            scoreFn: (ctx)=>({
                    score: ctx.isMagicHeavy && ctx.hasSustain ? 90 : ctx.isMagicHeavy ? 80 : 40,
                    reason: "Reduces sustained magic damage over time"
                })
        },
        {
            name: "Twilight Armor",
            tags: [
                "hp",
                "anti_burst",
                "anti_crit"
            ],
            scoreFn: (ctx)=>({
                    score: ctx.hasBurst ? 85 : 50,
                    reason: "Prevents one-shot burst combos from assassins"
                })
        },
        {
            name: "Dominance Ice",
            tags: [
                "physical_def",
                "anti_heal",
                "anti_attack_speed"
            ],
            scoreFn: (ctx)=>({
                    score: ctx.hasHealers || ctx.hasSustain ? 90 : ctx.hasAutoAttackers ? 75 : 45,
                    reason: ctx.hasHealers ? "Reduces enemy healing and attack speed simultaneously" : "Slows down auto-attack enemies with attack speed reduction"
                })
        },
        {
            name: "Necklace of Durance",
            tags: [
                "anti_heal"
            ],
            scoreFn: (ctx)=>({
                    score: ctx.hasHealers || ctx.hasSustain ? 92 : 30,
                    reason: "Critical anti-heal item against enemy sustain/heal composition"
                })
        },
        {
            name: "Sea Halberd",
            tags: [
                "anti_heal",
                "physical"
            ],
            scoreFn: (ctx)=>({
                    score: ctx.hasHealers || ctx.hasSustain ? 88 : 35,
                    reason: "Anti-heal for physical damage dealers facing sustain enemies"
                })
        },
        {
            name: "Cursed Helmet",
            tags: [
                "magic_def",
                "hp",
                "aoe_magic"
            ],
            scoreFn: (ctx)=>({
                    score: ctx.isMagicHeavy ? 75 : 40,
                    reason: "Deals AoE magic damage while providing magic defense"
                })
        },
        {
            name: "Immortality",
            tags: [
                "survival",
                "anti_burst"
            ],
            scoreFn: (ctx)=>({
                    score: ctx.hasBurst ? 80 : 45,
                    reason: "Provides a second life against burst-heavy enemy comps"
                })
        },
        {
            name: "Tough Boots",
            tags: [
                "magic_def",
                "cc_reduction"
            ],
            scoreFn: (ctx)=>({
                    score: ctx.hasHighCC ? 85 : 50,
                    reason: ctx.hasHighCC ? "Reduces CC duration against enemy's heavy CC lineup" : "Provides magic defense and CC reduction"
                })
        },
        {
            name: "Warrior Boots",
            tags: [
                "physical_def"
            ],
            scoreFn: (ctx)=>({
                    score: ctx.isPhysicalHeavy ? 75 : 40,
                    reason: "Provides early physical defense against physical-heavy enemy"
                })
        }
    ];
    const ctx = {
        isPhysicalHeavy,
        isMagicHeavy,
        hasHealers,
        hasHighCC,
        hasBurst,
        hasAutoAttackers,
        hasSustain
    };
    for (const item of ITEM_KNOWLEDGE_BASE){
        const result = item.scoreFn(ctx);
        if (result.score > 0) recommendations.push({
            itemId: 0,
            itemName: item.name,
            score: result.score,
            reason: result.reason,
            tags: item.tags
        });
    }
    recommendations.sort((a, b)=>b.score - a.score);
    return recommendations.slice(0, 3);
}
function analyzeTeam(enemies) {
    const damageProfile = {
        physical: 0,
        magic: 0
    };
    for (const e of enemies){
        if (e.damageType === "physical") damageProfile.physical++;
        else if (e.damageType === "magic") damageProfile.magic++;
        else {
            damageProfile.physical += 0.5;
            damageProfile.magic += 0.5;
        }
    }
    const total = damageProfile.physical + damageProfile.magic;
    const teamDamageProfile = {
        physical: Math.round(damageProfile.physical / (total || 1) * 100),
        magic: Math.round(damageProfile.magic / (total || 1) * 100)
    };
    const hardCC = enemies.filter((e)=>e.crowdControl === "hard").length;
    const softCC = enemies.filter((e)=>e.crowdControl === "soft").length;
    let teamCCLevel = "low";
    if (hardCC >= 2) teamCCLevel = "high";
    else if (hardCC >= 1 || softCC >= 3) teamCCLevel = "medium";
    const earlyCount = enemies.filter((e)=>e.powerSpike === "early").length;
    const lateCount = enemies.filter((e)=>e.powerSpike === "late").length;
    let teamPowerSpike = "mid";
    if (earlyCount > lateCount && earlyCount >= 2) teamPowerSpike = "early";
    else if (lateCount > earlyCount && lateCount >= 2) teamPowerSpike = "late";
    const teamRoleComposition = {};
    for (const e of enemies)teamRoleComposition[e.role] = (teamRoleComposition[e.role] || 0) + 1;
    return {
        teamDamageProfile,
        teamCCLevel,
        teamPowerSpike,
        teamRoleComposition
    };
}
async function analyzeEnemyTeam(enemyHeroNames, allHeroes) {
    // If no heroes provided, try to load from MongoDB (will fail gracefully if no connection)
    if (!allHeroes) {
        try {
            const { connectToDatabase } = await __turbopack_context__.A("[project]/src/lib/db/mongodb.ts [app-route] (ecmascript, async loader)");
            await connectToDatabase();
            const Hero = (await __turbopack_context__.A("[project]/src/lib/models/Hero.ts [app-route] (ecmascript, async loader)")).default;
            allHeroes = await Hero.find({}).lean();
        } catch  {
            // Fallback to static data if MongoDB is not available
            const heroesData = await __turbopack_context__.A("[project]/src/data/heroes.json.[json].cjs [app-route] (ecmascript, async loader)").then((m)=>m.default);
            allHeroes = heroesData;
        }
    }
    if (!allHeroes || allHeroes.length === 0) {
        throw new Error("No hero data available. Please set up MongoDB or seed the database.");
    }
    const enemyHeroes = [];
    const unknownHeroes = [];
    for (const name of enemyHeroNames){
        const found = allHeroes.find((h)=>h.name.toLowerCase() === name.toLowerCase());
        if (found) enemyHeroes.push(found);
        else unknownHeroes.push(name);
    }
    if (enemyHeroes.length === 0) {
        throw new Error(`No known heroes found in enemy team. Unknown: ${unknownHeroes.join(", ") || "none provided"}`);
    }
    const teamAnalysis = analyzeTeam(enemyHeroes);
    const counterScores = [];
    for (const hero of allHeroes){
        if (enemyHeroes.some((e)=>e.heroId === hero.heroId || e.name === hero.name)) continue;
        const roleAdvantage = scoreRoleAdvantage(hero, enemyHeroes);
        const damageTypeEdge = scoreDamageTypeEdge(hero, enemyHeroes);
        const playStyleMatchup = scorePlayStyleMatchup(hero, enemyHeroes);
        const ccMobilityFactor = scoreCCMobilityFactor(hero, enemyHeroes);
        const rangeEngagement = scoreRangeEngagement(hero, enemyHeroes);
        const teamSynergy = scoreTeamSynergy(hero, enemyHeroes);
        const totalScore = 0.30 * roleAdvantage + 0.20 * damageTypeEdge + 0.15 * playStyleMatchup + 0.15 * ccMobilityFactor + 0.10 * rangeEngagement + 0.10 * teamSynergy;
        const breakdown = {
            roleAdvantage,
            damageTypeEdge,
            playStyleMatchup,
            ccMobilityFactor,
            rangeEngagement,
            teamSynergy
        };
        const reasons = buildReasons(hero, enemyHeroes, breakdown);
        counterScores.push({
            heroId: hero.heroId,
            heroName: hero.name,
            role: hero.role,
            totalScore: Math.round(totalScore * 100) / 100,
            breakdown: Object.fromEntries(Object.entries(breakdown).map(([k, v])=>[
                    k,
                    Math.round(v * 100) / 100
                ])),
            reasons
        });
    }
    counterScores.sort((a, b)=>b.totalScore - a.totalScore);
    // Get top 3 overall counters
    const topCounters = counterScores.slice(0, 3);
    // Get same-role counters (2 from each role present in enemy team)
    const sameRoleCounters = [];
    const enemyRoles = Array.from(new Set(enemyHeroes.map((e)=>e.role)));
    for (const role of enemyRoles){
        const roleCounters = counterScores.filter((c)=>c.role === role).slice(0, 2); // Get top 2 from same role
        sameRoleCounters.push(...roleCounters);
    }
    // Sort same-role counters by score and limit to top picks
    sameRoleCounters.sort((a, b)=>b.totalScore - a.totalScore);
    const itemRecommendations = scoreItems(enemyHeroes);
    return {
        enemyTeam: enemyHeroes.map((h)=>({
                heroId: h.heroId,
                name: h.name,
                role: h.role
            })),
        heroCounters: topCounters,
        sameRoleCounters: sameRoleCounters.slice(0, 5),
        itemRecommendations,
        analysis: teamAnalysis
    };
}
}),
"[project]/src/lib/engine/aiEngine.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * MLBB Counter Pro - AI Engine (Gemini Integration)
 * ---------------------------------------------------
 * Integrates with Google's Gemini API for AI-powered counter recommendations
 * and build suggestions.
 */ __turbopack_context__.s([
    "analyzeWithGemini",
    ()=>analyzeWithGemini,
    "getDraftRecommendations",
    ()=>getDraftRecommendations,
    "getEnhancedCounterAnalysis",
    ()=>getEnhancedCounterAnalysis
]);
// ---------------------------------------------------------------------------
// Gemini API Configuration
// ---------------------------------------------------------------------------
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
function getGeminiApiKey() {
    return process.env.GEMINI_API_KEY;
}
// ---------------------------------------------------------------------------
// Prompt Engineering
// ---------------------------------------------------------------------------
function buildPrompt(request) {
    if (!request.enemyHeroes || !Array.isArray(request.enemyHeroes) || request.enemyHeroes.length === 0) {
        console.warn('No enemy heroes provided for AI analysis');
        return 'No enemy heroes provided.';
    }
    const enemyHeroesStr = request.enemyHeroes.map((h)=>`- ${h.name} (${h.role}): ${h.damageType} damage, ${h.playStyle} playstyle, ${h.mobility} mobility, ${h.crowdControl} CC, ${h.range} range${h.tags && h.tags.length > 0 ? ', tags: ' + h.tags.join(', ') : ''}`).join('\n');
    let prompt = `You are an expert MLBB (Mobile Legends: Bang Bang) analyst and coach. Analyze the following enemy team composition and provide detailed counter recommendations.

## Enemy Team Composition:
${enemyHeroesStr}

## Available Hero Pool:
Tanks: Tigreal, Minotaur, Franco, Grock, Khufra, Belerick, Akai
Fighters: Chou, Ruby
Assassins: Lancelot, Gusion, Helcurt, Natalia, Hayabusa, Fanny, Ling
Mages: Chang'e, Valentina, Eudora, Kagura, Lunox
Marksmen: Lesley, Miya, Claude, Karrie
Supports: Estes, Angela

## Analysis Required:

### 1. COUNTER HERO RECOMMENDATIONS
For each enemy hero, recommend the best counter picks focusing on:
- **Lane Matchups**: For each lane (Gold/Marksmen, EXP/Fighter, Mid/Mage, Jungle/Assassin, Roam/Tank/Support), recommend 2 heroes that counter the enemy in that lane
- **Overall Counters**: Recommend 3 best overall counter heroes based on team composition synergy

Consider these factors:
- Role advantages (Tank > Assassin > Mage > Fighter > Marksman)
- Damage type matchups (physical vs magic defense)
- Playstyle counters (burst vs sustain vs poke)
- CC and mobility interactions
- Range advantages
- Early/mid/late game power spikes

### 2. ITEM BUILD RECOMMENDATIONS
Recommend 6 items with:
- Priority (core/situational/luxury)
- Timing (early/mid/late game)
- Specific reasoning against which enemy heroes

### 3. TEAM STRATEGY
Provide strategy for:
- Early game (first 5 minutes)
- Mid game (5-10 minutes)  
- Late game (10+ minutes)
- Teamfight approach
- Objective control (turtles, lords)

Format your response as valid JSON matching this structure:
{
  "counterAnalysis": {
    "recommendedHeroes": [
      {"name": "HeroName", "role": "Role", "confidence": 0.9, "reasons": ["reason1", "reason2"], "matchupScore": 85}
    ],
    "laneMatchups": [
      {"lane": "gold", "recommendedHero": "HeroName", "reasoning": "why this hero", "advantage": 0.7}
    ]
  },
  "buildRecommendations": {
    "items": [
      {"name": "ItemName", "priority": "core", "timing": "early", "reasoning": "why", "against": ["Hero1"]}
    ]
  },
  "teamStrategy": {
    "earlyGame": "strategy description",
    "midGame": "strategy description",
    "lateGame": "strategy description",
    "teamfightApproach": "approach description",
    "objectiveControl": "control strategy"
  },
  "overallConfidence": 0.85
}

Provide your analysis now.`;
    return prompt;
}
async function analyzeWithGemini(request) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        console.warn('Gemini API key not configured. Falling back to standard analysis.');
        return null;
    }
    try {
        const prompt = buildPrompt(request);
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 4096
                }
            })
        });
        if (!response.ok) {
            console.error('Gemini API error:', response.status, response.statusText);
            return null;
        }
        const data = await response.json();
        // Extract the text response
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
            console.error('No text response from Gemini');
            return null;
        }
        // Parse JSON from response (handle markdown code blocks)
        let jsonStr = textResponse;
        if (jsonStr.includes('```json')) {
            jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
        } else if (jsonStr.includes('```')) {
            jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
        }
        const analysis = JSON.parse(jsonStr);
        return analysis;
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return null;
    }
}
async function getEnhancedCounterAnalysis(enemyHeroes, standardCounters, sameRoleCounters, itemRecommendations) {
    // Prepare request for AI analysis
    const aiRequest = {
        enemyHeroes: enemyHeroes.map((h)=>({
                name: h.name,
                role: h.role,
                damageType: h.damageType,
                playStyle: h.playStyle,
                mobility: h.mobility,
                crowdControl: h.crowdControl,
                range: h.range,
                tags: h.tags
            }))
    };
    // Get AI analysis
    const aiAnalysis = await analyzeWithGemini(aiRequest);
    // Combine standard and AI recommendations
    const combinedRecommendations = standardCounters.map((counter)=>{
        let aiBoost = 0;
        let isAiRecommended = false;
        let aiReasons;
        if (aiAnalysis) {
            // Check if AI recommended this hero
            const aiRecommended = aiAnalysis.counterAnalysis.recommendedHeroes.find((h)=>h.name.toLowerCase() === counter.heroName.toLowerCase());
            if (aiRecommended) {
                aiBoost = aiRecommended.matchupScore / 100; // Normalize to 0-1
                isAiRecommended = true;
                aiReasons = aiRecommended.reasons;
            }
        }
        return {
            hero: counter,
            aiBoost,
            finalScore: counter.totalScore + aiBoost * 0.2,
            isAiRecommended,
            aiReasons
        };
    });
    // Sort by final score
    combinedRecommendations.sort((a, b)=>b.finalScore - a.finalScore);
    return {
        standardAnalysis: {
            heroCounters: standardCounters,
            sameRoleCounters: sameRoleCounters,
            itemRecommendations: itemRecommendations
        },
        aiAnalysis,
        combinedRecommendations
    };
}
async function getDraftRecommendations(enemyPicks, teamPicks, bannedHeroes, availableHeroes, turn) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        return null;
    }
    const enemyStr = enemyPicks.map((h)=>`${h.name} (${h.role})`).join(', ') || 'None yet';
    const teamStr = teamPicks.map((h)=>`${h.name} (${h.role})`).join(', ') || 'None yet';
    const bannedStr = bannedHeroes.map((h)=>h.name).join(', ') || 'None yet';
    const prompt = `MLBB Draft Analysis - ${turn.toUpperCase()} Recommendation

Current Draft State:
- Enemy Team: ${enemyStr}
- My Team: ${teamStr}
- Banned Heroes: ${bannedStr}

Available Heroes Pool:
${availableHeroes.map((h)=>`- ${h.name} (${h.role}): ${h.damageType}, ${h.playStyle}`).join('\n')}

Task: ${turn === 'ban' ? 'Recommend 3 heroes to ban. Focus on heroes that would counter our current team composition or synergize well with the enemy team.' : 'Recommend 3 heroes to pick. Focus on heroes that counter the enemy composition and synergize with our team. Consider role balance.'}

Respond with JSON:
{
  "recommendations": [
    {"heroName": "Name", "priority": 1, "confidence": 0.9, "reasoning": "why", ${turn === 'pick' ? '"synergyWithTeam": ["hero1", "hero2"]' : ''}}
  ]
}`;
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.5,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048
                }
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) return null;
        let jsonStr = textResponse;
        if (jsonStr.includes('```json')) {
            jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
        } else if (jsonStr.includes('```')) {
            jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
        }
        const parsed = JSON.parse(jsonStr);
        if (turn === 'ban') {
            return {
                banRecommendations: parsed.recommendations.map((r)=>({
                        heroName: r.heroName,
                        priority: r.priority,
                        reasoning: r.reasoning
                    })),
                pickRecommendations: []
            };
        } else {
            return {
                banRecommendations: [],
                pickRecommendations: parsed.recommendations.map((r)=>({
                        heroName: r.heroName,
                        role: r.role || 'Unknown',
                        confidence: r.confidence,
                        reasoning: r.reasoning,
                        synergyWithTeam: r.synergyWithTeam || []
                    }))
            };
        }
    } catch (error) {
        console.error('Error getting draft recommendations:', error);
        return null;
    }
}
}),
"[project]/src/app/api/counter/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "OPTIONS",
    ()=>OPTIONS,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$counterEngine$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/engine/counterEngine.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$aiEngine$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/engine/aiEngine.ts [app-route] (ecmascript)");
;
;
;
async function POST(request) {
    const startTime = Date.now();
    try {
        const body = await request.json();
        const { enemyHeroes } = body;
        if (!enemyHeroes || !Array.isArray(enemyHeroes)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Invalid request: 'enemyHeroes' must be an array of hero names"
            }, {
                status: 400
            });
        }
        if (enemyHeroes.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Invalid request: 'enemyHeroes' must contain at least 1 hero"
            }, {
                status: 400
            });
        }
        if (enemyHeroes.length > 5) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Invalid request: 'enemyHeroes' can have at most 5 heroes"
            }, {
                status: 400
            });
        }
        const sanitizedHeroes = enemyHeroes.map((name)=>String(name).trim()).filter((name)=>name.length > 0);
        if (sanitizedHeroes.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Invalid request: all hero names are empty after sanitization"
            }, {
                status: 400
            });
        }
        const uniqueNames = new Set(sanitizedHeroes.map((n)=>n.toLowerCase()));
        if (uniqueNames.size !== sanitizedHeroes.length) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Invalid request: duplicate heroes detected in enemy team"
            }, {
                status: 400
            });
        }
        // Run the counter engine - it handles MongoDB fallback internally
        const standardResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$counterEngine$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["analyzeEnemyTeam"])(sanitizedHeroes);
        // Try to enhance with AI analysis if Gemini API key is configured
        let enhancedResult = standardResult;
        let aiAnalysis = null;
        let isAiEnhanced = false;
        try {
            const enhanced = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$aiEngine$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEnhancedCounterAnalysis"])(standardResult.enemyTeam, standardResult.heroCounters, standardResult.sameRoleCounters, standardResult.itemRecommendations);
            if (enhanced.aiAnalysis) {
                aiAnalysis = enhanced.aiAnalysis;
                isAiEnhanced = true;
                // Use AI-enhanced combined recommendations
                enhancedResult = {
                    ...standardResult,
                    heroCounters: enhanced.combinedRecommendations.slice(0, 3).map((cr)=>({
                            ...cr.hero,
                            totalScore: cr.finalScore,
                            aiBoost: cr.aiBoost,
                            isAiRecommended: cr.isAiRecommended,
                            aiReasons: cr.aiReasons
                        }))
                };
            }
        } catch (aiError) {
            // AI analysis failed, fall back to standard algorithm
            console.warn('AI analysis failed, using standard algorithm:', aiError);
        }
        const computationTime = Date.now() - startTime;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: enhancedResult,
            meta: {
                computedAt: new Date().toISOString(),
                computationTimeMs: computationTime,
                heroCount: sanitizedHeroes.length,
                isAiEnhanced,
                analysisType: isAiEnhanced ? 'AI + Algorithm' : 'Algorithm Only'
            },
            aiAnalysis
        }, {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
            }
        });
    } catch (error) {
        const computationTime = Date.now() - startTime;
        if (error.message && error.message.includes("No known heroes found")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: error.message,
                meta: {
                    computedAt: new Date().toISOString(),
                    computationTimeMs: computationTime
                }
            }, {
                status: 404
            });
        }
        console.error("Counter API error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error.message || "An unexpected error occurred while computing counter recommendations",
            meta: {
                computedAt: new Date().toISOString(),
                computationTimeMs: computationTime
            }
        }, {
            status: 500
        });
    }
}
async function GET() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        success: true,
        message: "MLBB Counter Pro API - /api/counter endpoint",
        version: "2.0.0",
        usage: {
            method: "POST",
            body: {
                enemyHeroes: [
                    "HeroName1",
                    "HeroName2"
                ]
            }
        }
    });
}
async function OPTIONS() {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0iriwfm._.js.map