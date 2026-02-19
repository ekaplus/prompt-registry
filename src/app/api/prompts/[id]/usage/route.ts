import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type UsageType = 'COPY' | 'DOWNLOAD' | 'RUN';

interface TrackUsageBody {
  usageType: UsageType;
  platform?: string;
}

/**
 * POST /api/prompts/[id]/usage
 * Track a usage event for a prompt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promptId } = await params;
    const session = await auth();
    const userId = session?.user?.id || null;

    // Parse request body
    const body = await request.json() as TrackUsageBody;
    const { usageType, platform } = body;

    // Validate usageType
    if (!usageType || !['COPY', 'DOWNLOAD', 'RUN'].includes(usageType)) {
      return NextResponse.json(
        { error: 'Invalid usageType. Must be COPY, DOWNLOAD, or RUN' },
        { status: 400 }
      );
    }

    // Verify prompt exists
    const prompt = await db.prompt.findUnique({
      where: { id: promptId },
      select: { id: true },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Generate CUID for the log entry
    const logId = generateCuid();

    // Create usage log entry using raw SQL (since model not in Prisma schema)
    await db.$executeRawUnsafe(
      `INSERT INTO "prompt_usage_logs" ("id", "promptId", "usageType", "usedBy", "platform", "usedAt")
       VALUES ($1, $2, $3::"UsageType", $4, $5, NOW())`,
      logId,
      promptId,
      usageType,
      userId,
      platform
    );

    // Update or create aggregated metrics using raw SQL
    if (usageType === 'COPY') {
      await db.$executeRawUnsafe(
        `INSERT INTO "prompt_usage_metrics" ("promptId", "copiedCount", "downloadCount", "runCount", "lastUsedAt")
         VALUES ($1, 1, 0, 0, NOW())
         ON CONFLICT ("promptId")
         DO UPDATE SET 
           "copiedCount" = "prompt_usage_metrics"."copiedCount" + 1,
           "lastUsedAt" = NOW()`,
        promptId
      );
    } else if (usageType === 'DOWNLOAD') {
      await db.$executeRawUnsafe(
        `INSERT INTO "prompt_usage_metrics" ("promptId", "copiedCount", "downloadCount", "runCount", "lastUsedAt")
         VALUES ($1, 0, 1, 0, NOW())
         ON CONFLICT ("promptId")
         DO UPDATE SET 
           "downloadCount" = "prompt_usage_metrics"."downloadCount" + 1,
           "lastUsedAt" = NOW()`,
        promptId
      );
    } else {
      await db.$executeRawUnsafe(
        `INSERT INTO "prompt_usage_metrics" ("promptId", "copiedCount", "downloadCount", "runCount", "lastUsedAt")
         VALUES ($1, 0, 0, 1, NOW())
         ON CONFLICT ("promptId")
         DO UPDATE SET 
           "runCount" = "prompt_usage_metrics"."runCount" + 1,
           "lastUsedAt" = NOW()`,
        promptId
      );
    }

    return NextResponse.json(
      { success: true, message: 'Usage tracked successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/prompts/[id]/usage
 * Get usage metrics for a specific prompt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promptId } = await params;

    // Fetch metrics using raw SQL
    const metrics = await db.$queryRawUnsafe<Array<{
      promptId: string;
      copiedCount: number;
      downloadCount: number;
      runCount: number;
      lastUsedAt: Date;
    }>>(
      `SELECT "promptId", "copiedCount", "downloadCount", "runCount", "lastUsedAt"
       FROM "prompt_usage_metrics"
       WHERE "promptId" = $1`,
      promptId
    );

    if (metrics.length === 0) {
      return NextResponse.json({
        promptId,
        copiedCount: 0,
        downloadCount: 0,
        runCount: 0,
        lastUsedAt: null,
      });
    }

    return NextResponse.json(metrics[0]);
  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate a CUID (Collision-resistant Unique Identifier)
 * Simple implementation for log IDs
 */
function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomStr}`;
}
