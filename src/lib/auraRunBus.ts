/**
 * Small in-process bus that lets any UI surface execute an Aura command on the
 * page-local InlineAuraBar instead of navigating away.
 *
 * - InlineAuraBar subscribes on mount, unsubscribes on unmount.
 * - Callers (e.g. "Run with Aura" workflow buttons, useAuraCommand.submitQuery)
 *   call `dispatchAuraRun(cmd)`. If at least one subscriber is mounted, it
 *   handles the command inline and the call returns true. Otherwise returns
 *   false so the caller can fall back to navigation.
 */

type AuraRunHandler = (command: string) => void | Promise<void>;

const handlers = new Set<AuraRunHandler>();

export function subscribeAuraRun(handler: AuraRunHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function hasAuraRunListener(): boolean {
  return handlers.size > 0;
}

export function dispatchAuraRun(command: string): boolean {
  const trimmed = command?.trim();
  if (!trimmed) return false;
  if (handlers.size === 0) return false;
  // Fire on every subscriber; in practice there's only one InlineAuraBar per page.
  for (const handler of handlers) {
    try {
      void handler(trimmed);
    } catch (err) {
      // Swallow — one bad handler must not block others.
      console.error('[auraRunBus] handler threw', err);
    }
  }
  return true;
}