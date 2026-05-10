import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed/seedDatabase";

/**
 * GET /api/cron/scrape
 * Triggered by Vercel Cron Job (daily at 6:00 AM UTC).
 * Updates the database with fresh hero/item data.
 * Protected by CRON_SECRET environment variable.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    console.log("🔄 Cron job: Seeding database...");
    const startTime = Date.now();

    const result = await seedDatabase();

    const computationTime = Date.now() - startTime;
    console.log(`✅ Cron job completed in ${computationTime}ms`);

    return NextResponse.json({
      success: true,
      message: "Database updated successfully",
      data: result,
      meta: {
        executedAt: new Date().toISOString(),
        computationTimeMs: computationTime,
      },
    });
  } catch (error: any) {
    console.error("❌ Cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Cron job failed",
      },
      { status: 500 }
    );
  }
}