export type MercadoPagoTransferOs = "ios" | "android" | "unknown";

const MERCADO_PAGO_TRANSFER_SCHEME = "mercadopago://money-out/transfers/new";

export function detectOs(): MercadoPagoTransferOs {
  if (typeof window === "undefined") return "unknown";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "unknown";
}

function parseAmount(amount: string | number): number {
  const parsed =
    typeof amount === "number"
      ? amount
      : Number.parseFloat(String(amount).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMercadoPagoTransferAmount(
  amount: string | number,
  os: MercadoPagoTransferOs = "ios",
): string {
  const parsed = parseAmount(amount);
  if (os === "android") return String(Math.round(parsed));
  return parsed.toFixed(2);
}

export function formatMercadoPagoClipboardAmount(
  amount: string | number,
  os: MercadoPagoTransferOs = "unknown",
): string {
  return formatMercadoPagoTransferAmount(amount, os === "unknown" ? "ios" : os);
}

export function shouldShowMercadoPagoTransferCta(options: {
  os: MercadoPagoTransferOs;
  currency?: string | null;
}): boolean {
  if (options.os !== "ios" && options.os !== "android") return false;
  const currency = String(options.currency || "")
    .trim()
    .toUpperCase();
  if (currency === "USDT" || currency === "CLP" || currency === "MXN") {
    return false;
  }
  return !currency || currency === "ARS";
}

export function getMercadoPagoTransferDeepLink(params: {
  os: MercadoPagoTransferOs;
  cvu: string;
  amount: string | number;
}): string | null {
  const cvu = String(params.cvu || "").trim();
  if (!cvu) return null;
  if (params.os !== "ios" && params.os !== "android") return null;

  const payload = {
    from: "clipboard_money_out_mla",
    account: {
      alias: {
        id: cvu,
        type: "cvu",
      },
    },
    type: "cvu",
    amount:
      params.os === "android"
        ? Number(parseAmount(params.amount).toFixed(2))
        : formatMercadoPagoTransferAmount(params.amount, params.os),
  };

  return `${MERCADO_PAGO_TRANSFER_SCHEME}?data=${encodeURIComponent(
    JSON.stringify(payload),
  )}`;
}
