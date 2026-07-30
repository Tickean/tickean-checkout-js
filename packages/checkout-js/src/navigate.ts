/**
 * Navigate the top-level browsing context (breaks out of iframes).
 * Used for Mercado Pago hosted checkout so payment is not trapped in embeds.
 */
export function navigateTopLevel(url: string): void {
  if (typeof window === "undefined" || !url) return;

  try {
    const topWin = window.top;
    if (topWin && topWin !== window) {
      topWin.location.assign(url);
      return;
    }
  } catch {
    // Cross-origin access to window.top can throw; fall through.
  }

  window.location.assign(url);
}

export function resolveRedirectUrl(params: {
  nextAction?: { type: string; url?: string } | null;
  redirectUrl?: string | null;
  initPoint?: string | null;
}): string | null {
  if (params.nextAction?.type === "redirect" && params.nextAction.url) {
    return params.nextAction.url;
  }
  return params.redirectUrl || params.initPoint || null;
}
