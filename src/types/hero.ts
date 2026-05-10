// Brain-compatible hero type for the frontend
export interface Hero {
  heroId: number;
  name: string;
  title: string;
  role: HeroRole;
  damageType: "physical" | "magic" | "mixed";
  playStyle: "burst" | "sustain" | "poke";
  mobility: "low" | "medium" | "high";
  crowdControl: "none" | "soft" | "hard";
  range: "melee" | "ranged";
  survivability: "low" | "medium" | "high";
  powerSpike: "early" | "mid" | "late";
  tags: string[];
  imageUrl: string;
  stats: {
    hp: number;
    physicalAttack: number;
    magicPower: number;
    physicalDef: number;
    magicDef: number;
  };
  skills: Array<{
    name: string;
    description: string;
    type: string;
  }>;
  // Computed for UI
  difficulty: "Easy" | "Medium" | "Hard";
  avatar: string;
  description: string;
}

export type HeroRole =
  | "Tank"
  | "Fighter"
  | "Assassin"
  | "Mage"
  | "Marksman"
  | "Support";

// Duplicated from counterEngine to avoid circular imports
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
// Draft Types
// ---------------------------------------------------------------------------

export type DraftPhase = 'ban' | 'pick' | 'complete';
export type DraftTurn = 'blue' | 'red';

export interface DraftConfig {
  blueBans: number;
  redBans: number;
  blueFirstPick: boolean;
}

export interface DraftAction {
  type: 'ban' | 'pick';
  team: DraftTurn;
  heroId: number;
  heroName: string;
  turnNumber: number;
}

export interface DraftState {
  phase: DraftPhase;
  currentTurn: DraftTurn;
  turnNumber: number;
  blueBans: number[];
  redBans: number[];
  bluePicks: number[];
  redPicks: number[];
  actions: DraftAction[];
  config: DraftConfig;
  isComplete: boolean;
}

export interface DraftStep {
  type: 'ban' | 'pick';
  team: DraftTurn;
  description: string;
}

export interface DraftResponse {
  state: DraftState;
  sequence: DraftStep[];
  availableHeroes?: Array<{ id: number; name: string; role: string }>;
  blueTeam?: Array<{ id: number; name: string; role: string }>;
  redTeam?: Array<{ id: number; name: string; role: string }>;
  bannedHeroes?: Array<{ id: number; name: string }>;
  currentStep: string;
  remaining: {
    blueBansRemaining: number;
    redBansRemaining: number;
    bluePicksRemaining: number;
    redPicksRemaining: number;
  };
  lastAction?: DraftAction;
}

export interface DraftRecommendation {
  heroName: string;
  priority?: number;
  role?: string;
  confidence?: number;
  reasoning: string;
  synergyWithTeam?: string[];
}

export interface DraftRecommendationResponse {
  aiRecommendations?: {
    banRecommendations: DraftRecommendation[];
    pickRecommendations: DraftRecommendation[];
  } | null;
  basicRecommendations: {
    banRecommendations: DraftRecommendation[];
    pickRecommendations: DraftRecommendation[];
  };
  currentTurn: DraftTurn;
  phase: DraftPhase;
}

export interface FrontendCounterResult {
  success: boolean;
  data: CounterResult;
  meta: {
    computedAt: string;
    computationTimeMs: number;
    heroCount: number;
    isAiEnhanced?: boolean;
    analysisType?: string;
  };
  aiAnalysis?: any;
}

export interface FrontendHeroesResult {
  data: Hero[];
  lastUpdated: string;
  version: string;
}