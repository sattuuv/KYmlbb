import { NextRequest, NextResponse } from "next/server";
import { analyzeEnemyTeam } from "@/lib/engine/counterEngine";
import { getEnhancedCounterAnalysis } from "@/lib/engine/aiEngine";

/**
 * POST /api/counter
 *
 * Takes an array of enemy hero names and returns counter recommendations.
 * Works with or without MongoDB (falls back to static JSON data).
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { enemyHeroes } = body as { enemyHeroes: string[] };

    if (!enemyHeroes || !Array.isArray(enemyHeroes)) {
      return NextResponse.json(
        { success: false, error: "Invalid request: 'enemyHeroes' must be an array of hero names" },
        { status: 400 }
      );
    }

    if (enemyHeroes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid request: 'enemyHeroes' must contain at least 1 hero" },
        { status: 400 }
      );
    }

    if (enemyHeroes.length > 5) {
      return NextResponse.json(
        { success: false, error: "Invalid request: 'enemyHeroes' can have at most 5 heroes" },
        { status: 400 }
      );
    }

    const sanitizedHeroes = enemyHeroes
      .map((name) => String(name).trim())
      .filter((name) => name.length > 0);

    if (sanitizedHeroes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid request: all hero names are empty after sanitization" },
        { status: 400 }
      );
    }

    const uniqueNames = new Set(sanitizedHeroes.map((n) => n.toLowerCase()));
    if (uniqueNames.size !== sanitizedHeroes.length) {
      return NextResponse.json(
        { success: false, error: "Invalid request: duplicate heroes detected in enemy team" },
        { status: 400 }
      );
    }

    // Run the counter engine - it handles MongoDB fallback internally
    const standardResult = await analyzeEnemyTeam(sanitizedHeroes);
    
    // Try to enhance with AI analysis if Gemini API key is configured
    let enhancedResult = standardResult;
    let aiAnalysis = null;
    let isAiEnhanced = false;
    
    try {
      const enhanced = await getEnhancedCounterAnalysis(
        standardResult.enemyTeam as any[],
        standardResult.heroCounters,
        standardResult.sameRoleCounters,
        standardResult.itemRecommendations
      );
      
      if (enhanced.aiAnalysis) {
        aiAnalysis = enhanced.aiAnalysis;
        isAiEnhanced = true;
        // Use AI-enhanced combined recommendations
        enhancedResult = {
          ...standardResult,
          heroCounters: enhanced.combinedRecommendations
            .slice(0, 3)
            .map(cr => ({
              ...cr.hero,
              totalScore: cr.finalScore,
              aiBoost: cr.aiBoost,
              isAiRecommended: cr.isAiRecommended,
              aiReasons: cr.aiReasons,
            })),
        };
      }
    } catch (aiError) {
      // AI analysis failed, fall back to standard algorithm
      console.warn('AI analysis failed, using standard algorithm:', aiError);
    }

    const computationTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: enhancedResult,
        meta: {
          computedAt: new Date().toISOString(),
          computationTimeMs: computationTime,
          heroCount: sanitizedHeroes.length,
          isAiEnhanced,
          analysisType: isAiEnhanced ? 'AI + Algorithm' : 'Algorithm Only',
        },
        aiAnalysis,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    const computationTime = Date.now() - startTime;

    if (error.message && error.message.includes("No known heroes found")) {
      return NextResponse.json(
        { success: false, error: error.message, meta: { computedAt: new Date().toISOString(), computationTimeMs: computationTime } },
        { status: 404 }
      );
    }

    console.error("Counter API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred while computing counter recommendations",
        meta: { computedAt: new Date().toISOString(), computationTimeMs: computationTime },
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "MLBB Counter Pro API - /api/counter endpoint",
    version: "2.0.0",
    usage: { method: "POST", body: { enemyHeroes: ["HeroName1", "HeroName2"] } },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
  });
}