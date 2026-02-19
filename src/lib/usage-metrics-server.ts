/**
 * Server-side Usage Metrics Utility Functions
 * 
 * Helper functions for fetching usage metrics in server components and API routes
 */

import { db } from "@/lib/db";

export interface UsageMetric {
  promptId: string;
  copiedCount: number;
  downloadCount: number;
  runCount: number;
  lastUsedAt: Date | null;
}

/**
 * Fetch usage metrics for a single prompt
 * 
 * @param promptId - The ID of the prompt
 * @returns Usage metrics or default zeros if not found
 */
export async function getPromptUsageMetric(
  promptId: string
): Promise<UsageMetric> {
  try {
    const metrics = await db.$queryRawUnsafe<Array<{
      promptId: string;
      copiedCount: number;
      downloadCount: number;
      runCount: number;
      lastUsedAt: Date | null;
    }>>(
      `SELECT "promptId", "copiedCount", "downloadCount", "runCount", "lastUsedAt"
       FROM "prompt_usage_metrics"
       WHERE "promptId" = $1`,
      promptId
    );

    if (metrics.length === 0) {
      return {
        promptId,
        copiedCount: 0,
        downloadCount: 0,
        runCount: 0,
        lastUsedAt: null,
      };
    }

    return metrics[0];
  } catch (error) {
    console.error('Error fetching usage metric:', error);
    return {
      promptId,
      copiedCount: 0,
      downloadCount: 0,
      runCount: 0,
      lastUsedAt: null,
    };
  }
}

/**
 * Fetch usage metrics for multiple prompts in bulk
 * 
 * @param promptIds - Array of prompt IDs
 * @returns Map of promptId to usage metrics
 */
export async function getBulkPromptUsageMetrics(
  promptIds: string[]
): Promise<Map<string, UsageMetric>> {
  if (promptIds.length === 0) {
    return new Map();
  }

  try {
    const placeholders = promptIds.map((_, i) => `$${i + 1}`).join(', ');
    const metrics = await db.$queryRawUnsafe<Array<{
      promptId: string;
      copiedCount: number;
      downloadCount: number;
      runCount: number;
      lastUsedAt: Date | null;
    }>>(
      `SELECT "promptId", "copiedCount", "downloadCount", "runCount", "lastUsedAt"
       FROM "prompt_usage_metrics"
       WHERE "promptId" IN (${placeholders})`,
      ...promptIds
    );

    const metricsMap = new Map<string, UsageMetric>();
    
    // Add fetched metrics
    metrics.forEach(metric => {
      metricsMap.set(metric.promptId, metric);
    });

    // Add default zeros for prompts without metrics
    promptIds.forEach(id => {
      if (!metricsMap.has(id)) {
        metricsMap.set(id, {
          promptId: id,
          copiedCount: 0,
          downloadCount: 0,
          runCount: 0,
          lastUsedAt: null,
        });
      }
    });

    return metricsMap;
  } catch (error) {
    console.error('Error fetching bulk usage metrics:', error);
    // Return default zeros for all prompts
    const metricsMap = new Map<string, UsageMetric>();
    promptIds.forEach(id => {
      metricsMap.set(id, {
        promptId: id,
        copiedCount: 0,
        downloadCount: 0,
        runCount: 0,
        lastUsedAt: null,
      });
    });
    return metricsMap;
  }
}

/**
 * Calculate total usage count
 */
export function getTotalUsageCount(metric: UsageMetric): number {
  return metric.copiedCount + metric.downloadCount + metric.runCount;
}

/**
 * Get the most popular action type
 */
export function getMostPopularAction(metric: UsageMetric): 'copy' | 'download' | 'run' | null {
  const { copiedCount, downloadCount, runCount } = metric;
  const max = Math.max(copiedCount, downloadCount, runCount);
  
  if (max === 0) return null;
  if (copiedCount === max) return 'copy';
  if (downloadCount === max) return 'download';
  return 'run';
}
