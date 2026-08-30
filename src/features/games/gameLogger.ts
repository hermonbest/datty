/**
 * Centralized Game Action & Latency Logger
 * Logs high-visibility, formatted logs with precise millisecond duration metrics.
 */

declare const __DEV__: boolean;
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export interface GameLogTimer {
  stop: (details?: Record<string, any>) => number;
}

export function gameLog(
  gameName: string,
  action: string,
  details?: Record<string, any>,
  durationMs?: number
): void {
  if (!isDev) return;

  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });

  const durationStr = durationMs !== undefined ? ` [⏱️ ${durationMs.toFixed(1)}ms]` : '';
  const detailsStr = details ? ` | ${JSON.stringify(details)}` : '';

  console.log(`🎮 [GAME][${gameName}][${action}] @ ${timestamp}${durationStr}${detailsStr}`);
}

export function startGameTimer(
  gameName: string,
  action: string,
  initialDetails?: Record<string, any>
): GameLogTimer {
  const startTime = Date.now();
  if (initialDetails) {
    gameLog(gameName, `${action} [START]`, initialDetails);
  }

  return {
    stop: (finalDetails?: Record<string, any>): number => {
      const durationMs = Date.now() - startTime;
      gameLog(gameName, `${action} [DONE]`, { ...initialDetails, ...finalDetails }, durationMs);
      return durationMs;
    },
  };
}

export async function measureGameAsync<T>(
  gameName: string,
  action: string,
  asyncFn: () => Promise<T>,
  details?: Record<string, any>
): Promise<T> {
  const timer = startGameTimer(gameName, action, details);
  try {
    const result = await asyncFn();
    timer.stop({ success: true });
    return result;
  } catch (err: any) {
    timer.stop({ success: false, error: err?.message || String(err) });
    throw err;
  }
}
