/**
 * Usage Metrics Utility Functions
 * 
 * Helper functions for fetching and working with prompt usage metrics
 */

export interface UsageMetric {
  promptId: string;
  copiedCount: number;
  downloadCount: number;
  runCount: number;
  lastUsedAt: Date | null;
}

/**
 * Fetch usage metrics for a specific prompt
 * 
 * @param promptId - The ID of the prompt
 * @returns Usage metrics or null if not found
 */
export async function getPromptUsageMetrics(
  promptId: string
): Promise<UsageMetric | null> {
  try {
    const response = await fetch(`/api/prompts/${promptId}/usage`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return {
      ...data,
      lastUsedAt: data.lastUsedAt ? new Date(data.lastUsedAt) : null,
    };
  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    return null;
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
