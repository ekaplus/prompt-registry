import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type MetricType = 'copy' | 'download' | 'run';
type TimePeriod = 'all' | 'month' | 'week';

/**
 * GET /api/prompts/metrics
 * Get top prompts by usage metrics
 * 
 * Query params:
 * - type: copy | download | run (default: copy)
 * - period: all | month | week (default: all)
 * - limit: number (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get('type') || 'copy') as MetricType;
    const period = (searchParams.get('period') || 'all') as TimePeriod;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Validate type
    if (!['copy', 'download', 'run'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be copy, download, or run' },
        { status: 400 }
      );
    }

    // Validate period
    if (!['all', 'month', 'week'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be all, month, or week' },
        { status: 400 }
      );
    }

    // Determine the sort field based on type
    const sortField = type === 'copy' 
      ? 'copiedCount' 
      : type === 'download' 
      ? 'downloadCount' 
      : 'runCount';

    // Build time filter for logs if period is not 'all'
    let timeFilter = '';
    if (period === 'week') {
      timeFilter = `AND l."usedAt" >= NOW() - INTERVAL '7 days'`;
    } else if (period === 'month') {
      timeFilter = `AND l."usedAt" >= NOW() - INTERVAL '30 days'`;
    }

    // For 'all' period, use the metrics table directly
    // For time-based periods, aggregate from logs table
    let results;

    if (period === 'all') {
      // Use pre-aggregated metrics table for better performance
      if (type === 'copy') {
        results = await db.$queryRaw`
          SELECT 
            p.id as "promptId",
            p.title,
            p.slug,
            p.description,
            p.type,
            p."authorId",
            u.username as "authorUsername",
            u.name as "authorName",
            u.avatar as "authorAvatar",
            p."categoryId",
            c.name as "categoryName",
            c.slug as "categorySlug",
            m."copiedCount",
            m."downloadCount",
            m."runCount",
            COUNT(v."userId")::int as "voteCount",
            p."isPrivate",
            p."isUnlisted"
          FROM "prompt_usage_metrics" m
          INNER JOIN "prompts" p ON p.id = m."promptId"
          INNER JOIN "users" u ON u.id = p."authorId"
          LEFT JOIN "categories" c ON c.id = p."categoryId"
          LEFT JOIN "prompt_votes" v ON v."promptId" = p.id
          WHERE p."deletedAt" IS NULL
            AND p."isPrivate" = false
            AND p."isUnlisted" = false
          GROUP BY p.id, u.id, c.id, m."promptId", m."copiedCount", m."downloadCount", m."runCount"
          ORDER BY m."copiedCount" DESC
          LIMIT ${limit}
        `;
      } else if (type === 'download') {
        results = await db.$queryRaw`
          SELECT 
            p.id as "promptId",
            p.title,
            p.slug,
            p.description,
            p.type,
            p."authorId",
            u.username as "authorUsername",
            u.name as "authorName",
            u.avatar as "authorAvatar",
            p."categoryId",
            c.name as "categoryName",
            c.slug as "categorySlug",
            m."copiedCount",
            m."downloadCount",
            m."runCount",
            COUNT(v."userId")::int as "voteCount",
            p."isPrivate",
            p."isUnlisted"
          FROM "prompt_usage_metrics" m
          INNER JOIN "prompts" p ON p.id = m."promptId"
          INNER JOIN "users" u ON u.id = p."authorId"
          LEFT JOIN "categories" c ON c.id = p."categoryId"
          LEFT JOIN "prompt_votes" v ON v."promptId" = p.id
          WHERE p."deletedAt" IS NULL
            AND p."isPrivate" = false
            AND p."isUnlisted" = false
          GROUP BY p.id, u.id, c.id, m."promptId", m."copiedCount", m."downloadCount", m."runCount"
          ORDER BY m."downloadCount" DESC
          LIMIT ${limit}
        `;
      } else {
        results = await db.$queryRaw`
          SELECT 
            p.id as "promptId",
            p.title,
            p.slug,
            p.description,
            p.type,
            p."authorId",
            u.username as "authorUsername",
            u.name as "authorName",
            u.avatar as "authorAvatar",
            p."categoryId",
            c.name as "categoryName",
            c.slug as "categorySlug",
            m."copiedCount",
            m."downloadCount",
            m."runCount",
            COUNT(v."userId")::int as "voteCount",
            p."isPrivate",
            p."isUnlisted"
          FROM "prompt_usage_metrics" m
          INNER JOIN "prompts" p ON p.id = m."promptId"
          INNER JOIN "users" u ON u.id = p."authorId"
          LEFT JOIN "categories" c ON c.id = p."categoryId"
          LEFT JOIN "prompt_votes" v ON v."promptId" = p.id
          WHERE p."deletedAt" IS NULL
            AND p."isPrivate" = false
            AND p."isUnlisted" = false
          GROUP BY p.id, u.id, c.id, m."promptId", m."copiedCount", m."downloadCount", m."runCount"
          ORDER BY m."runCount" DESC
          LIMIT ${limit}
        `;
      }
    } else {
      // Aggregate from logs for time-based queries
      const usageTypeFilter = type === 'copy' 
        ? 'COPY' 
        : type === 'download' 
        ? 'DOWNLOAD' 
        : 'RUN';

      if (period === 'week') {
        results = await db.$queryRaw`
          SELECT 
            p.id as "promptId",
            p.title,
            p.slug,
            p.description,
            p.type,
            p."authorId",
            u.username as "authorUsername",
            u.name as "authorName",
            u.avatar as "authorAvatar",
            p."categoryId",
            c.name as "categoryName",
            c.slug as "categorySlug",
            COUNT(l.id)::int as "usageCount",
            (SELECT COUNT(*)::int FROM "prompt_votes" WHERE "promptId" = p.id) as "voteCount",
            p."isPrivate",
            p."isUnlisted"
          FROM "prompt_usage_logs" l
          INNER JOIN "prompts" p ON p.id = l."promptId"
          INNER JOIN "users" u ON u.id = p."authorId"
          LEFT JOIN "categories" c ON c.id = p."categoryId"
          WHERE p."deletedAt" IS NULL
            AND p."isPrivate" = false
            AND p."isUnlisted" = false
            AND l."usageType" = ${usageTypeFilter}::"UsageType"
            AND l."usedAt" >= NOW() - INTERVAL '7 days'
          GROUP BY p.id, u.id, c.id
          ORDER BY "usageCount" DESC
          LIMIT ${limit}
        `;
      } else {
        results = await db.$queryRaw`
          SELECT 
            p.id as "promptId",
            p.title,
            p.slug,
            p.description,
            p.type,
            p."authorId",
            u.username as "authorUsername",
            u.name as "authorName",
            u.avatar as "authorAvatar",
            p."categoryId",
            c.name as "categoryName",
            c.slug as "categorySlug",
            COUNT(l.id)::int as "usageCount",
            (SELECT COUNT(*)::int FROM "prompt_votes" WHERE "promptId" = p.id) as "voteCount",
            p."isPrivate",
            p."isUnlisted"
          FROM "prompt_usage_logs" l
          INNER JOIN "prompts" p ON p.id = l."promptId"
          INNER JOIN "users" u ON u.id = p."authorId"
          LEFT JOIN "categories" c ON c.id = p."categoryId"
          WHERE p."deletedAt" IS NULL
            AND p."isPrivate" = false
            AND p."isUnlisted" = false
            AND l."usageType" = ${usageTypeFilter}::"UsageType"
            AND l."usedAt" >= NOW() - INTERVAL '30 days'
          GROUP BY p.id, u.id, c.id
          ORDER BY "usageCount" DESC
          LIMIT ${limit}
        `;
      }
    }

    return NextResponse.json({
      type,
      period,
      prompts: results,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
