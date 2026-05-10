/**
 * MLBB Counter Pro - Draft Simulation Engine
 * --------------------------------------------
 * Implements the MLBB draft phase logic with bans and picks.
 * Supports different draft formats (Classic, Tournament, etc.)
 */

import { IHero } from "@/lib/models/Hero";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DraftPhase = 'ban' | 'pick' | 'complete';
export type DraftTurn = 'blue' | 'red';

export interface DraftConfig {
  blueBans: number;    // Number of bans for blue team
  redBans: number;     // Number of bans for red team
  blueFirstPick: boolean; // Whether blue team picks first
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
  blueBans: number[];     // Hero IDs banned by blue team
  redBans: number[];      // Hero IDs banned by red team
  bluePicks: number[];    // Hero IDs picked by blue team
  redPicks: number[];     // Hero IDs picked by red team
  actions: DraftAction[]; // History of all actions
  config: DraftConfig;
  isComplete: boolean;
}

// Draft formats
export const DRAFT_FORMATS: Record<string, DraftConfig> = {
  // Classic ranked draft (simplified)
  classic: {
    blueBans: 2,
    redBans: 2,
    blueFirstPick: true,
  },
  // Tournament style (more bans)
  tournament: {
    blueBans: 3,
    redBans: 3,
    blueFirstPick: true,
  },
  // Pro league style
  pro: {
    blueBans: 5,
    redBans: 5,
    blueFirstPick: true,
  },
  // Quick draft (fewer bans)
  quick: {
    blueBans: 1,
    redBans: 1,
    blueFirstPick: true,
  },
};

// ---------------------------------------------------------------------------
// Draft Sequence Generator
// ---------------------------------------------------------------------------

interface DraftStep {
  type: 'ban' | 'pick';
  team: DraftTurn;
  description: string;
}

/**
 * Generates the complete draft sequence based on config.
 * MLBB draft order: Bans first (alternating), then picks (alternating).
 */
export function generateDraftSequence(config: DraftConfig): DraftStep[] {
  const sequence: DraftStep[] = [];
  const totalBans = config.blueBans + config.redBans;
  const totalPicks = 10; // 5 per team

  // Ban phase - alternating, blue starts
  for (let i = 0; i < totalBans; i++) {
    const isBlueTurn = i % 2 === 0;
    const banNumber = isBlueTurn 
      ? Math.floor(i / 2) + 1 
      : Math.floor(i / 2) + 1;
    sequence.push({
      type: 'ban',
      team: isBlueTurn ? 'blue' : 'red',
      description: `${isBlueTurn ? 'Blue' : 'Red'} Team Ban #${banNumber}`,
    });
  }

  // Pick phase - alternating, blue starts (if blueFirstPick)
  const firstPicker = config.blueFirstPick ? 'blue' : 'red';
  for (let i = 0; i < totalPicks; i++) {
    const isBlueTurn = (i % 2 === 0) === config.blueFirstPick;
    const pickNumber = isBlueTurn 
      ? Math.floor(i / 2) + 1 
      : Math.floor(i / 2) + 1;
    sequence.push({
      type: 'pick',
      team: isBlueTurn ? 'blue' : 'red',
      description: `${isBlueTurn ? 'Blue' : 'Red'} Team Pick #${pickNumber}`,
    });
  }

  return sequence;
}

// ---------------------------------------------------------------------------
// Draft State Management
// ---------------------------------------------------------------------------

/**
 * Creates a new draft state with the given configuration.
 */
export function createDraftState(format: string = 'classic'): DraftState {
  const config = DRAFT_FORMATS[format] || DRAFT_FORMATS.classic;
  return {
    phase: 'ban',
    currentTurn: 'blue',
    turnNumber: 0,
    blueBans: [],
    redBans: [],
    bluePicks: [],
    redPicks: [],
    actions: [],
    config,
    isComplete: false,
  };
}

/**
 * Gets the available heroes for the current draft state.
 */
export function getAvailableHeroes(
  allHeroes: IHero[],
  state: DraftState
): IHero[] {
  const bannedIds = new Set(state.blueBans.concat(state.redBans));
  const pickedIds = new Set(state.bluePicks.concat(state.redPicks));
  const unavailableIds = new Set(Array.from(bannedIds).concat(Array.from(pickedIds)));

  return allHeroes.filter(h => !unavailableIds.has(h.heroId));
}

/**
 * Validates if an action is legal in the current draft state.
 */
export function validateAction(
  state: DraftState,
  heroId: number,
  allHeroes: IHero[]
): { valid: boolean; error?: string } {
  // Check if draft is complete
  if (state.isComplete) {
    return { valid: false, error: 'Draft is already complete' };
  }

  // Check if hero exists
  const hero = allHeroes.find(h => h.heroId === heroId);
  if (!hero) {
    return { valid: false, error: 'Hero not found' };
  }

  // Check if hero is already banned or picked
  const allUsedIds = [
    ...state.blueBans,
    ...state.redBans,
    ...state.bluePicks,
    ...state.redPicks,
  ];
  if (allUsedIds.includes(heroId)) {
    return { valid: false, error: 'Hero is already banned or picked' };
  }

  // Check if it's the correct team's turn
  const sequence = generateDraftSequence(state.config);
  if (state.turnNumber >= sequence.length) {
    return { valid: false, error: 'No more actions in draft sequence' };
  }

  const currentStep = sequence[state.turnNumber];
  if (currentStep.type !== state.phase) {
    return { valid: false, error: `Expected ${currentStep.type} phase` };
  }

  if (currentStep.team !== state.currentTurn) {
    return { valid: false, error: `It's ${currentStep.team} team's turn` };
  }

  return { valid: true };
}

/**
 * Executes a draft action and returns the new state.
 */
export function executeDraftAction(
  state: DraftState,
  heroId: number,
  allHeroes: IHero[]
): { state: DraftState; error?: string } {
  // Validate the action
  const validation = validateAction(state, heroId, allHeroes);
  if (!validation.valid) {
    return { state, error: validation.error };
  }

  const hero = allHeroes.find(h => h.heroId === heroId)!;
  const sequence = generateDraftSequence(state.config);
  const currentStep = sequence[state.turnNumber];

  // Create new state
  const newState: DraftState = {
    ...state,
    turnNumber: state.turnNumber + 1,
    actions: [
      ...state.actions,
      {
        type: currentStep.type,
        team: currentStep.team,
        heroId,
        heroName: hero.name,
        turnNumber: state.turnNumber,
      },
    ],
  };

  // Apply the action
  if (currentStep.type === 'ban') {
    if (currentStep.team === 'blue') {
      newState.blueBans = [...state.blueBans, heroId];
    } else {
      newState.redBans = [...state.redBans, heroId];
    }
  } else {
    if (currentStep.team === 'blue') {
      newState.bluePicks = [...state.bluePicks, heroId];
    } else {
      newState.redPicks = [...state.redPicks, heroId];
    }
  }

  // Determine next phase and turn
  if (newState.turnNumber >= sequence.length) {
    newState.phase = 'complete';
    newState.isComplete = true;
    newState.currentTurn = state.currentTurn;
  } else {
    const nextStep = sequence[newState.turnNumber];
    newState.phase = nextStep.type;
    newState.currentTurn = nextStep.team;
  }

  return { state: newState };
}

/**
 * Gets the current step description for UI display.
 */
export function getCurrentStepDescription(state: DraftState): string {
  if (state.isComplete) {
    return 'Draft Complete';
  }

  const sequence = generateDraftSequence(state.config);
  if (state.turnNumber >= sequence.length) {
    return 'Draft Complete';
  }

  const currentStep = sequence[state.turnNumber];
  const actionText = currentStep.type === 'ban' ? 'Ban' : 'Pick';
  const teamText = currentStep.team === 'blue' ? 'Blue' : 'Red';
  return `${teamText} Team - ${actionText}`;
}

/**
 * Gets remaining bans/picks for each team.
 */
export function getRemainingActions(state: DraftState): {
  blueBansRemaining: number;
  redBansRemaining: number;
  bluePicksRemaining: number;
  redPicksRemaining: number;
} {
  return {
    blueBansRemaining: state.config.blueBans - state.blueBans.length,
    redBansRemaining: state.config.redBans - state.redBans.length,
    bluePicksRemaining: 5 - state.bluePicks.length,
    redPicksRemaining: 5 - state.redPicks.length,
  };
}

/**
 * Simulates a complete draft with AI/random picks.
 * Returns the final state.
 */
export async function simulateDraft(
  allHeroes: IHero[],
  format: string = 'classic',
  blueTeamHeroes?: string[], // Pre-selected heroes for blue team
  redTeamHeroes?: string[]   // Pre-selected heroes for red team
): Promise<DraftState> {
  let state = createDraftState(format);
  const sequence = generateDraftSequence(state.config);

  for (let i = 0; i < sequence.length; i++) {
    const available = getAvailableHeroes(allHeroes, state);
    if (available.length === 0) break;

    // For picks, use pre-selected heroes if provided
    if (sequence[i].type === 'pick') {
      const isBlue = sequence[i].team === 'blue';
      const preSelected = isBlue ? blueTeamHeroes : redTeamHeroes;
      const teamPicks = isBlue ? state.bluePicks : state.redPicks;
      const pickIndex = teamPicks.length;

      if (preSelected && pickIndex < preSelected.length) {
        const heroName = preSelected[pickIndex];
        const hero = available.find(h => h.name.toLowerCase() === heroName.toLowerCase());
        if (hero) {
          const result = executeDraftAction(state, hero.heroId, allHeroes);
          if (result.error) {
            console.error('Draft simulation error:', result.error);
            continue;
          }
          state = result.state;
          continue;
        }
      }
    }

    // Random selection for bans or when no pre-selection
    const randomIndex = Math.floor(Math.random() * available.length);
    const selectedHero = available[randomIndex];
    const result = executeDraftAction(state, selectedHero.heroId, allHeroes);
    if (result.error) {
      console.error('Draft simulation error:', result.error);
      continue;
    }
    state = result.state;
  }

  return state;
}