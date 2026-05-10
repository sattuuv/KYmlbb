import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed/seedDatabase";

/**
 * POST /api/seed
 * Triggers database seeding with default hero and item data.
 * Protected by SEED_API_KEY environment variable.
 *
 * Headers:
 *   x-api-key: <SEED_API_KEY>
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.SEED_API_KEY;

  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: invalid API key" },
      { status: 401 }
    );
  }

  try {
    const result = await seedDatabase();
    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Seed API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to seed database",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seed
 * Returns the status of seeded data.
 */
export async function GET() {
  return NextResponse.json({
    message: "MLBB Counter Pro - Seed API",
    usage: {
      method: "POST",
      headers: { "x-api-key": "<SEED_API_KEY>" },
    },
  });
}