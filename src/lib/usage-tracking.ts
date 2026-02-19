/**
 * Prompt Usage Tracking Utility
 * 
 * Client-side utility for tracking prompt usage events (copy, download, run).
 * Sends tracking data to the backend API for storage and aggregation.
 * 
 * Features:
 * - Silent failure (doesn't disrupt user experience)
 * - Automatic user detection from session
 * - Platform tracking for RUN events
 */

export type UsageType = 'COPY' | 'DOWNLOAD' | 'RUN';

interface TrackUsageOptions {
  promptId: string;
  usageType: UsageType;
  platform?: string;
}

/**
 * Track a prompt usage event
 * 
 * @param promptId - The ID of the prompt being used
 * @param usageType - Type of usage: COPY, DOWNLOAD, or RUN
 * @param platform - Optional platform name for RUN events (e.g., "ChatGPT", "Claude")
 * 
 * @example
 * ```typescript
 * // Track copy action
 * await trackPromptUsage('prompt-id', 'COPY');
 * 
 * // Track run action with platform
 * await trackPromptUsage('prompt-id', 'RUN', 'ChatGPT');
 * 
 * // Track download action
 * await trackPromptUsage('prompt-id', 'DOWNLOAD');
 * ```
 */
export async function trackPromptUsage(
  promptId: string,
  usageType: UsageType,
  platform?: string
): Promise<void> {
  // Don't track if promptId is missing
  if (!promptId) {
    return;
  }

  try {
    const response = await fetch(`/api/prompts/${promptId}/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usageType,
        platform,
      }),
    });

    // Log error but don't throw - silent failure
    if (!response.ok) {
      console.error(`Failed to track usage: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    // Silent fail - don't disrupt user experience
    console.error('Error tracking prompt usage:', error);
  }
}

/**
 * Batch track multiple usage events
 * Useful for tracking multiple actions at once
 * 
 * @param events - Array of usage events to track
 */
export async function trackPromptUsageBatch(
  events: TrackUsageOptions[]
): Promise<void> {
  // Filter out events without promptId
  const validEvents = events.filter(e => e.promptId);
  
  if (validEvents.length === 0) {
    return;
  }

  // Track each event in parallel
  await Promise.allSettled(
    validEvents.map(event =>
      trackPromptUsage(event.promptId, event.usageType, event.platform)
    )
  );
}
