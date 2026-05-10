/**
 * MLBB Counter Pro - AI Engine (Gemini Integration)
 * ---------------------------------------------------
 * Integrates with Google's Gemini API for AI-powered counter recommendations
 * and build suggestions.
 */

import { IHero } from "@/lib/models/Hero";
import { CounterScore, ItemRecommendation } from "./counterEngine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AIAnalysisRequest {
  enemyHeroes: Array<{
    name: string;
    role: string;
    damageType: string;
    playStyle: string;
    mobility: string;
    crowdControl: string;
    range: string;
    tags: string[];
  }>;
  userHero?: {
    name: string;
    role: string;
    damageType: string;
    playStyle: string;
    mobility: string;
    crowdControl: string;
    range: string;
    tags: string[];
  };
  context?: {
    gamePhase?: 'early' | 'mid' | 'late';
    teamComposition?: string;
    enemyComposition?: string;
  };
}

export interface AIAnalysisResponse {
  counterAnalysis: {
    recommendedHeroes: Array<{
      name: string;
      role: string;
      confidence: number;
      reasons: string[];
      matchupScore: number;
    }>;
    laneMatchups: Array<{
      lane: string;
      recommendedHero: string;
      reasoning: string;
      advantage: number;
    }>;
  };
  buildRecommendations: {
    items: Array<{
      name: string;
      priority: 'core' | 'situational' | 'luxury';
      timing: 'early' | 'mid' | 'late';
      reasoning: string;
      against: string[];
    }>;
    emblemRecommendation?: {
      primary: string;
      secondary: string;
      reasoning: string;
    };
    spellRecommendation?: {
      spell: string;
      reasoning: string;
    };
  };
  teamStrategy: {
    earlyGame: string;
    midGame: string;
    lateGame: string;
    teamfightApproach: string;
    objectiveControl: string;
  };
  overallConfidence: number;
  alternativeStrategies?: string[];
}

// ---------------------------------------------------------------------------
// Gemini API Configuration
// ---------------------------------------------------------------------------

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

// ---------------------------------------------------------------------------
// Prompt Engineering
// ---------------------------------------------------------------------------

function buildPrompt(request: AIAnalysisRequest): string {
  if (!request.enemyHeroes || !Array.isArray(request.enemyHeroes) || request.enemyHeroes.length === 0) {
    console.warn('No enemy heroes provided for AI analysis');
    return 'No enemy heroes provided.';
  }

  const enemyHeroesStr = request.enemyHeroes
    .map(h => `- ${h.name} (${h.role}): ${h.damageType} damage, ${h.playStyle} playstyle, ${h.mobility} mobility, ${h.crowdControl} CC, ${h.range} range${h.tags && h.tags.length > 0 ? ', tags: ' + h.tags.join(', ') : ''}`)
    .join('\n');

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

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function analyzeWithGemini(request: AIAnalysisRequest): Promise<AIAnalysisResponse | null> {
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      }),
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

    const analysis: AIAnalysisResponse = JSON.parse(jsonStr);
    return analysis;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Enhanced Counter Analysis with AI
// ---------------------------------------------------------------------------

export interface EnhancedCounterResult {
  standardAnalysis: {
    heroCounters: CounterScore[];
    sameRoleCounters: CounterScore[];
    itemRecommendations: ItemRecommendation[];
  };
  aiAnalysis: AIAnalysisResponse | null;
  combinedRecommendations: Array<{
    hero: CounterScore;
    aiBoost: number;
    finalScore: number;
    isAiRecommended: boolean;
    aiReasons?: string[];
  }>;
}

export async function getEnhancedCounterAnalysis(
  enemyHeroes: IHero[],
  standardCounters: CounterScore[],
  sameRoleCounters: CounterScore[],
  itemRecommendations: ItemRecommendation[]
): Promise<EnhancedCounterResult> {
  // Prepare request for AI analysis
  const aiRequest: AIAnalysisRequest = {
    enemyHeroes: enemyHeroes.map(h => ({
      name: h.name,
      role: h.role,
      damageType: h.damageType,
      playStyle: h.playStyle,
      mobility: h.mobility,
      crowdControl: h.crowdControl,
      range: h.range,
      tags: h.tags,
    })),
  };

  // Get AI analysis
  const aiAnalysis = await analyzeWithGemini(aiRequest);

  // Combine standard and AI recommendations
  const combinedRecommendations = standardCounters.map(counter => {
    let aiBoost = 0;
    let isAiRecommended = false;
    let aiReasons: string[] | undefined;

    if (aiAnalysis) {
      // Check if AI recommended this hero
      const aiRecommended = aiAnalysis.counterAnalysis.recommendedHeroes.find(
        h => h.name.toLowerCase() === counter.heroName.toLowerCase()
      );
      
      if (aiRecommended) {
        aiBoost = aiRecommended.matchupScore / 100; // Normalize to 0-1
        isAiRecommended = true;
        aiReasons = aiRecommended.reasons;
      }
    }

    return {
      hero: counter,
      aiBoost,
      finalScore: counter.totalScore + (aiBoost * 0.2), // AI can boost score by up to 0.2
      isAiRecommended,
      aiReasons,
    };
  });

  // Sort by final score
  combinedRecommendations.sort((a, b) => b.finalScore - a.finalScore);

  return {
    standardAnalysis: {
      heroCounters: standardCounters,
      sameRoleCounters: sameRoleCounters,
      itemRecommendations: itemRecommendations,
    },
    aiAnalysis,
    combinedRecommendations,
  };
}

// ---------------------------------------------------------------------------
// AI-Powered Draft Recommendations
// ---------------------------------------------------------------------------

export interface DraftAIRecommendation {
  banRecommendations: Array<{
    heroName: string;
    priority: number;
    reasoning: string;
  }>;
  pickRecommendations: Array<{
    heroName: string;
    role: string;
    confidence: number;
    reasoning: string;
    synergyWithTeam: string[];
  }>;
}

export async function getDraftRecommendations(
  enemyPicks: IHero[],
  teamPicks: IHero[],
  bannedHeroes: IHero[],
  availableHeroes: IHero[],
  turn: 'ban' | 'pick'
): Promise<DraftAIRecommendation | null> {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    return null;
  }

  const enemyStr = enemyPicks.map(h => `${h.name} (${h.role})`).join(', ') || 'None yet';
  const teamStr = teamPicks.map(h => `${h.name} (${h.role})`).join(', ') || 'None yet';
  const bannedStr = bannedHeroes.map(h => h.name).join(', ') || 'None yet';

  const prompt = `MLBB Draft Analysis - ${turn.toUpperCase()} Recommendation

Current Draft State:
- Enemy Team: ${enemyStr}
- My Team: ${teamStr}
- Banned Heroes: ${bannedStr}

Available Heroes Pool:
${availableHeroes.map(h => `- ${h.name} (${h.role}): ${h.damageType}, ${h.playStyle}`).join('\n')}

Task: ${turn === 'ban' 
  ? 'Recommend 3 heroes to ban. Focus on heroes that would counter our current team composition or synergize well with the enemy team.'
  : 'Recommend 3 heroes to pick. Focus on heroes that counter the enemy composition and synergize with our team. Consider role balance.'
}

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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.5,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
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
        banRecommendations: parsed.recommendations.map((r: any) => ({
          heroName: r.heroName,
          priority: r.priority,
          reasoning: r.reasoning,
        })),
        pickRecommendations: [],
      };
    } else {
      return {
        banRecommendations: [],
        pickRecommendations: parsed.recommendations.map((r: any) => ({
          heroName: r.heroName,
          role: r.role || 'Unknown',
          confidence: r.confidence,
          reasoning: r.reasoning,
          synergyWithTeam: r.synergyWithTeam || [],
        })),
      };
    }
  } catch (error) {
    console.error('Error getting draft recommendations:', error);
    return null;
  }
}