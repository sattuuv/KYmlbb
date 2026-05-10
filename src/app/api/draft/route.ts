import { NextRequest, NextResponse } from "next/server";
import {
  createDraftState,
  executeDraftAction,
  getAvailableHeroes,
  getCurrentStepDescription,
  getRemainingActions,
  generateDraftSequence,
  simulateDraft,
  DRAFT_FORMATS,
  DraftState,
} from "@/lib/engine/draftEngine";
import { getDraftRecommendations } from "@/lib/engine/aiEngine";

/**
 * POST /api/draft
 * 
 * Manages draft state and actions.
 * Body:
 * - action: 'create' | 'pick' | 'ban' | 'simulate' | 'recommend'
 * - format: draft format name (classic, tournament, pro, quick)
 * - heroId: hero ID for pick/ban actions
 * - blueTeamHeroes: array of hero names for blue team (for simulation)
 * - redTeamHeroes: array of hero names for red team (for simulation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, format = 'classic', heroId, blueTeamHeroes, redTeamHeroes, state: incomingState } = body;

    // Load heroes data
    let allHeroes;
    try {
      const { connectToDatabase } = await import("@/lib/db/mongodb");
      await connectToDatabase();
      const Hero = (await import("@/lib/models/Hero")).default;
      allHeroes = await Hero.find({}).lean();
    } catch {
      const heroesData = await import("@/data/heroes.json").then(m => m.default);
      allHeroes = heroesData as unknown as any[];
    }

    if (!allHeroes || allHeroes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No hero data available" },
        { status: 500 }
      );
    }

    switch (action) {
      case 'create': {
        const state = createDraftState(format);
        const sequence = generateDraftSequence(state.config);
        const availableHeroes = getAvailableHeroes(allHeroes, state);
        
        return NextResponse.json({
          success: true,
          data: {
            state,
            sequence,
            availableHeroes: availableHeroes.map(h => ({ id: h.heroId, name: h.name, role: h.role })),
            currentStep: getCurrentStepDescription(state),
            remaining: getRemainingActions(state),
          },
        });
      }

      case 'pick':
      case 'ban': {
        if (!incomingState) {
          return NextResponse.json(
            { success: false, error: "Draft state required for pick/ban action" },
            { status: 400 }
          );
        }

        if (!heroId) {
          return NextResponse.json(
            { success: false, error: "Hero ID required for pick/ban action" },
            { status: 400 }
          );
        }

        const result = executeDraftAction(incomingState, heroId, allHeroes);
        
        if (result.error) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          );
        }

        const newState = result.state;
        const sequence = generateDraftSequence(newState.config);
        const availableHeroes = getAvailableHeroes(allHeroes, newState);

        return NextResponse.json({
          success: true,
          data: {
            state: newState,
            sequence,
            availableHeroes: availableHeroes.map(h => ({ id: h.heroId, name: h.name, role: h.role })),
            currentStep: getCurrentStepDescription(newState),
            remaining: getRemainingActions(newState),
            lastAction: newState.actions[newState.actions.length - 1],
          },
        });
      }

      case 'simulate': {
        const state = await simulateDraft(allHeroes, format, blueTeamHeroes, redTeamHeroes);
        const sequence = generateDraftSequence(state.config);

        // Get hero details for the draft
        const blueTeam = allHeroes.filter(h => state.bluePicks.includes(h.heroId));
        const redTeam = allHeroes.filter(h => state.redPicks.includes(h.heroId));
        const bannedHeroes = allHeroes.filter(h => 
          state.blueBans.includes(h.heroId) || state.redBans.includes(h.heroId)
        );

        return NextResponse.json({
          success: true,
          data: {
            state,
            sequence,
            blueTeam: blueTeam.map(h => ({ id: h.heroId, name: h.name, role: h.role })),
            redTeam: redTeam.map(h => ({ id: h.heroId, name: h.name, role: h.role })),
            bannedHeroes: bannedHeroes.map(h => ({ id: h.heroId, name: h.name })),
            currentStep: getCurrentStepDescription(state),
            remaining: getRemainingActions(state),
          },
        });
      }

      case 'recommend': {
        if (!incomingState) {
          return NextResponse.json(
            { success: false, error: "Draft state required for recommendations" },
            { status: 400 }
          );
        }

        const enemyPicks = allHeroes.filter(h => incomingState.redPicks.includes(h.heroId));
        const teamPicks = allHeroes.filter(h => incomingState.bluePicks.includes(h.heroId));
        const bannedHeroesList = allHeroes.filter(h => 
          incomingState.blueBans.includes(h.heroId) || incomingState.redBans.includes(h.heroId)
        );
        const availableHeroesList = getAvailableHeroes(allHeroes, incomingState);

        const turn = incomingState.phase === 'ban' ? 'ban' : 'pick';
        
        // Get AI recommendations (if API key is configured)
        const recommendations = await getDraftRecommendations(
          enemyPicks,
          teamPicks,
          bannedHeroesList,
          availableHeroesList,
          turn
        );

        // Always provide basic recommendations based on counter logic
        const basicRecommendations = getBasicDraftRecommendations(
          enemyPicks,
          teamPicks,
          availableHeroesList,
          turn
        );

        return NextResponse.json({
          success: true,
          data: {
            aiRecommendations: recommendations,
            basicRecommendations,
            currentTurn: incomingState.currentTurn,
            phase: incomingState.phase,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Draft API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * Basic draft recommendations without AI
 */
function getBasicDraftRecommendations(
  enemyPicks: any[],
  teamPicks: any[],
  availableHeroes: any[],
  turn: 'ban' | 'pick'
) {
  const enemyRoles = enemyPicks.map(h => h.role);
  const teamRoles = teamPicks.map(h => h.role);

  if (turn === 'ban') {
    // Ban heroes that counter our team composition
    const highPriorityBans = availableHeroes
      .filter(h => {
        // Ban assassins if we have squishy heroes
        if (h.role === 'Assassin' && teamRoles.includes('Marksman')) return true;
        // Ban heroes with high CC if we have low mobility heroes
        if (h.crowdControl === 'hard' && h.mobility === 'high') return true;
        // Ban healers if enemy has sustain
        if (h.tags?.includes('heal')) return true;
        return false;
      })
      .slice(0, 3)
      .map(h => ({
        heroName: h.name,
        priority: 1,
        reasoning: `Strong against team composition`,
      }));

    return { banRecommendations: highPriorityBans, pickRecommendations: [] };
  } else {
    // Pick heroes that fill role gaps and counter enemy
    const neededRoles = ['Tank', 'Support', 'Mage', 'Marksman', 'Assassin'].filter(
      role => !teamRoles.includes(role)
    );

    const pickRecommendations = availableHeroes
      .filter(h => neededRoles.includes(h.role))
      .slice(0, 3)
      .map(h => ({
        heroName: h.name,
        role: h.role,
        confidence: 0.8,
        reasoning: `Fills ${h.role} role gap`,
        synergyWithTeam: teamPicks.map(p => p.name),
      }));

    return { banRecommendations: [], pickRecommendations };
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "MLBB Draft API",
    version: "1.0.0",
    formats: Object.keys(DRAFT_FORMATS),
    usage: {
      create: { action: 'create', format: 'classic' },
      pick: { action: 'pick', state: '...', heroId: 1 },
      ban: { action: 'ban', state: '...', heroId: 1 },
      simulate: { action: 'simulate', format: 'classic' },
      recommend: { action: 'recommend', state: '...' },
    },
  });
}