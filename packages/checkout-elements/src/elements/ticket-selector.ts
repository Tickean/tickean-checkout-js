import type {
  PromotionNxM,
  PublicShowOption,
  QuantityDiscount,
} from "@tickean/checkout-js";
import { TickeanElementBase, t, tFormat } from "../base";
import {
  formatShowDayScheduleLabel,
  formatShowTimeRange,
  resolveEventTimeZone,
} from "../event-meta";

type CatalogOption = PublicShowOption & {
  showId: string;
  showTitle?: string;
  showDate?: string;
  showEndDate?: string;
};

function isAbono(opt: CatalogOption) {
  return Boolean(opt.accessScope && opt.accessScope !== "SINGLE_SHOW");
}

function availableStock(opt: CatalogOption): number {
  if (typeof opt.availableStock === "number") return Math.max(0, opt.availableStock);
  const stock = Number(opt.stock ?? 0);
  const sold = Number(opt.sold ?? 0);
  const reserved = Number(opt.reserved ?? 0);
  return Math.max(0, stock - sold - reserved);
}

function isSoldOut(opt: CatalogOption): boolean {
  if (opt.status === "SOLD_OUT" || opt.status === "INACTIVE") return true;
  return availableStock(opt) <= 0;
}

function isComingSoon(opt: CatalogOption): boolean {
  return opt.status === "COMING_SOON";
}

function activePromotion(
  opt: CatalogOption,
):
  | { kind: "nxm"; data: PromotionNxM }
  | { kind: "qty"; data: QuantityDiscount }
  | null {
  const nxm = opt.promotionNxM;
  if (nxm?.enabled && nxm.buyQty && nxm.payQty) {
    return { kind: "nxm", data: nxm };
  }
  const qty = opt.quantityDiscount;
  if (qty?.enabled && typeof qty.percentOff === "number") {
    return { kind: "qty", data: qty };
  }
  return null;
}

function promoLegend(
  opt: CatalogOption,
  locale: string,
): string | null {
  const promo = activePromotion(opt);
  if (!promo) return null;
  if (promo.kind === "nxm") {
    const label = promo.data.label || "Promo";
    return tFormat(locale, "promoNxM", {
      label,
      buy: promo.data.buyQty || 0,
      pay: promo.data.payQty || 0,
    });
  }
  const label = promo.data.label || "Promo";
  const unit =
    typeof promo.data.targetUnit === "number" && promo.data.targetUnit >= 2
      ? promo.data.targetUnit
      : 2;
  return tFormat(locale, "promoNth", {
    label,
    unit,
    percent: promo.data.percentOff || 0,
  });
}

function promoBadge(opt: CatalogOption): string | null {
  const promo = activePromotion(opt);
  if (!promo) return null;
  if (promo.kind === "nxm") {
    return promo.data.label || `${promo.data.buyQty}x${promo.data.payQty}`;
  }
  return promo.data.label || `-${promo.data.percentOff}%`;
}

function passSubtitle(opt: CatalogOption, showCount: number, locale: string) {
  if (!isAbono(opt)) return "";
  const covered =
    opt.accessScope === "ALL_EVENT_SHOWS"
      ? showCount
      : opt.coveredShowIds?.length || showCount;
  const coverage =
    covered <= 1 ? "1 día" : locale.startsWith("en") ? `${covered} days` : `${covered} días`;
  const issuance =
    opt.passIssuanceMode === "SINGLE_PASS"
      ? locale.startsWith("en")
        ? "1 QR for all days"
        : "1 QR para todos los días"
      : locale.startsWith("en")
        ? "1 ticket per day"
        : "1 entrada por día";
  return `${locale.startsWith("en") ? "Pass" : "Pase"} · ${coverage} · ${issuance}`;
}

function maxQty(opt: CatalogOption): number {
  const stock = availableStock(opt);
  const cap = opt.maxPerPurchase && opt.maxPerPurchase > 0 ? opt.maxPerPurchase : stock;
  return Math.max(0, Math.min(stock, cap || stock));
}

export class TickeanTicketSelector extends TickeanElementBase {
  private firstPaint = true;

  protected renderBody(): string {
    const state = this.state;
    if (!state || state.loading) {
      return `<div class="wrap muted">${t(this.elementLocale, "loading")}</div>`;
    }

    const shows = state.event?.shows || [];
    const showCount = shows.length;
    const locale = this.elementLocale;
    const timeZone = resolveEventTimeZone(
      (state.event?.location || {}) as {
        timeZone?: string | null;
        country?: string | null;
      },
    );
    const allOptions: CatalogOption[] = shows.flatMap((show) =>
      (show.showOptions || []).map((opt) => ({
        ...opt,
        showId: show.id,
        showTitle: show.title,
        showDate: show.date,
        showEndDate: show.endDate,
      })),
    );

    // PROMO_GATED options only appear after unlock merge into the session event.
    const abonoMap = new Map<string, CatalogOption>();
    for (const opt of allOptions) {
      if (isAbono(opt) && !abonoMap.has(opt.id)) abonoMap.set(opt.id, opt);
    }
    const abonos = [...abonoMap.values()];
    const dayOptions = allOptions.filter((opt) => !isAbono(opt));

    const days = new Map<string, CatalogOption[]>();
    for (const opt of dayOptions) {
      const key = opt.showId;
      if (!days.has(key)) days.set(key, []);
      days.get(key)!.push(opt);
    }

    const renderOption = (opt: CatalogOption, pass = false) => {
      const qty =
        state.cart.find((c) => c.showOptionId === opt.id)?.amount || 0;
      const soldOut = isSoldOut(opt);
      const comingSoon = isComingSoon(opt);
      const remaining = availableStock(opt);
      const lowStock = !soldOut && !comingSoon && remaining > 0 && remaining <= 10;
      const max = maxQty(opt);
      const subtitle = pass
        ? passSubtitle(opt, showCount, locale)
        : formatShowTimeRange(
            { date: opt.showDate, endDate: opt.showEndDate },
            timeZone,
            locale,
          ) ||
          opt.showTitle ||
          "";
      const legend = promoLegend(opt, locale);
      const badge = promoBadge(opt);
      const gated = opt.catalogVisibility === "PROMO_GATED";

      let stockBadge = "";
      if (soldOut) {
        stockBadge = `<span class="stock-badge sold-out">${escapeHtml(t(locale, "soldOut"))}</span>`;
      } else if (comingSoon) {
        stockBadge = `<span class="stock-badge coming-soon">${escapeHtml(t(locale, "comingSoon"))}</span>`;
      } else if (lowStock) {
        stockBadge =
          remaining === 1
            ? `<span class="stock-badge low-stock">${escapeHtml(t(locale, "lastTicket"))}</span>`
            : `<span class="stock-badge low-stock">${escapeHtml(tFormat(locale, "lastTickets", { count: remaining }))}</span>`;
      }

      return `
        <div class="ticket ${pass ? "pass" : ""} ${soldOut ? "sold-out" : ""} ${comingSoon ? "coming-soon" : ""}"
             data-option-id="${opt.id}" data-selected="${qty > 0}" data-sold-out="${soldOut}" data-max="${max}">
          <div class="row">
            <div style="min-width:0">
              <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                <strong>${escapeHtml(opt.name || opt.id)}</strong>
                ${pass ? `<span class="pass-badge">${locale.startsWith("en") ? "Pass" : "Pase"}</span>` : ""}
                ${gated ? `<span class="pass-badge" style="color:var(--tickean-primary);background:color-mix(in srgb,var(--tickean-primary) 12%,transparent)">${escapeHtml(t(locale, "unlocked"))}</span>` : ""}
                ${badge ? `<span class="promo-badge">${escapeHtml(badge)}</span>` : ""}
                ${stockBadge}
              </div>
              <div class="muted" style="font-size:0.78rem;margin-top:2px">${escapeHtml(subtitle || "")}</div>
              ${legend ? `<div class="promo-legend">${escapeHtml(legend)}</div>` : ""}
            </div>
            <div style="font-weight:650;font-variant-numeric:tabular-nums;white-space:nowrap">${this.money(Number(opt.price || 0))}</div>
          </div>
          <div class="row" style="margin-top:8px">
            <span class="muted" style="font-size:0.78rem">${soldOut ? escapeHtml(t(locale, "soldOut")) : t(locale, "quantity")}</span>
            ${
              soldOut || comingSoon
                ? `<span class="muted" style="font-size:0.78rem">—</span>`
                : `<div class="qty" role="group" aria-label="${t(locale, "quantity")} ${escapeHtml(opt.name || "")}">
                    <button type="button" class="secondary" data-action="dec" aria-label="-" ${qty <= 0 ? "disabled" : ""}>−</button>
                    <span data-qty aria-live="polite">${qty}</span>
                    <button type="button" class="secondary" data-action="inc" aria-label="+" ${qty >= max ? "disabled" : ""}>+</button>
                  </div>`
            }
          </div>
        </div>
      `;
    };

    const dayBlocks = [...days.entries()]
      .map(([showId, opts]) => {
        const show = shows.find((s) => s.id === showId);
        const schedule = show
          ? formatShowDayScheduleLabel(
              {
                date: show.date,
                endDate: show.endDate,
                title: show.title,
              },
              timeZone,
              locale,
              { includeTitle: Boolean(show.title) },
            )
          : "";
        const label = schedule || show?.title || t(locale, "tickets");
        return `
          <div class="stack" style="gap:8px">
            <p class="group-title">${escapeHtml(label)}</p>
            ${opts.map((o) => renderOption(o, false)).join("")}
          </div>
        `;
      })
      .join("");

    return `
      <div class="stack" part="ticket-selector" style="gap:8px">
        <p class="section-title">${t(locale, "tickets")}</p>
        ${
          abonos.length
            ? `<div class="stack" style="gap:8px">
                <p class="group-title" style="color:var(--tickean-pass)">${escapeHtml(t(locale, "passes"))}</p>
                ${abonos.map((o) => renderOption(o, true)).join("")}
              </div>`
            : ""
        }
        ${
          days.size > 1
            ? dayBlocks
            : dayOptions.map((o) => renderOption(o, false)).join("")
        }
      </div>
    `;
  }

  protected afterRender() {
    if (this.firstPaint) {
      this.firstPaint = false;
      this.setAttribute("data-animated", "");
    }

    this.root.querySelectorAll<HTMLElement>("[data-option-id]").forEach((el) => {
      if (el.dataset.soldOut === "true") return;
      const optionId = el.getAttribute("data-option-id")!;
      const max = Number(el.dataset.max || 99);
      const qty =
        this.state?.cart.find((c) => c.showOptionId === optionId)?.amount || 0;
      el.querySelector('[data-action="dec"]')?.addEventListener("click", () => {
        this.controller?.setCartItem(optionId, Math.max(0, qty - 1));
      });
      el.querySelector('[data-action="inc"]')?.addEventListener("click", () => {
        this.controller?.setCartItem(optionId, Math.min(max, qty + 1));
      });
    });
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

if (
  typeof customElements !== "undefined" &&
  !customElements.get("tickean-ticket-selector")
) {
  customElements.define("tickean-ticket-selector", TickeanTicketSelector);
}
