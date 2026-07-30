import { TickeanElementBase, t, tFormat } from "../base";

type PricingBreakdown = {
  subtotalBase?: number;
  promotionDiscountTotal?: number;
  codeDiscountTotal?: number;
  serviceCharge?: number;
  total?: number;
};

export class TickeanOrderSummary extends TickeanElementBase {
  private optionName(id: string): string {
    for (const show of this.state?.event?.shows || []) {
      for (const opt of show.showOptions || []) {
        if (opt.id === id) return opt.name || id;
      }
    }
    return id;
  }

  protected renderBody(): string {
    const total =
      Number(this.state?.quote?.totalPrice) ||
      Number(this.state?.purchase?.totalPrice) ||
      0;
    const items = this.state?.cart || [];
    const locale = this.elementLocale;
    const breakdown = (this.state?.quote?.pricingBreakdown || {}) as PricingBreakdown;
    const promo = Number(breakdown.promotionDiscountTotal || 0);
    const code = Number(breakdown.codeDiscountTotal || 0);
    const service = Number(breakdown.serviceCharge || 0);
    const subtotal =
      Number(breakdown.subtotalBase) ||
      Math.max(0, total - service + promo + code);

    return `
      <div class="wrap stack reveal reveal-2" part="order-summary">
        <p class="section-title">${t(locale, "orderSummary")}</p>
        <div class="summary-line">
          <span class="muted">${tFormat(locale, "itemsCount", { count: items.length })}</span>
          ${
            this.state?.isQuoting
              ? `<span class="muted">${t(locale, "loading")}</span>`
              : ""
          }
        </div>
        ${
          items.length === 0
            ? `<div class="muted">${t(locale, "emptyCart")}</div>`
            : items
                .map(
                  (item) =>
                    `<div class="summary-line"><span>${escapeHtml(this.optionName(item.showOptionId))}</span><span class="muted">×${item.amount}</span></div>`,
                )
                .join("")
        }
        ${
          items.length && subtotal > 0
            ? `<div class="summary-line"><span class="muted">${escapeHtml(t(locale, "subtotal"))}</span><span>${escapeHtml(this.money(subtotal))}</span></div>`
            : ""
        }
        ${
          promo > 0
            ? `<div class="summary-line"><span class="muted">${escapeHtml(t(locale, "promoDiscount"))}</span><span>−${escapeHtml(this.money(promo))}</span></div>`
            : ""
        }
        ${
          code > 0
            ? `<div class="summary-line"><span class="muted">${escapeHtml(t(locale, "discount"))}</span><span>−${escapeHtml(this.money(code))}</span></div>`
            : ""
        }
        ${
          service > 0
            ? `<div class="summary-line"><span class="muted">${escapeHtml(t(locale, "serviceCharge"))}</span><span>${escapeHtml(this.money(service))}</span></div>`
            : ""
        }
        <div class="row" style="margin-top:2px;padding-top:8px;border-top:1px solid var(--tickean-border)">
          <span style="font-weight:600">${t(locale, "total")}</span>
          <span class="total" aria-live="polite">${this.money(total)}</span>
        </div>
      </div>
    `;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

if (
  typeof customElements !== "undefined" &&
  !customElements.get("tickean-order-summary")
) {
  customElements.define("tickean-order-summary", TickeanOrderSummary);
}
