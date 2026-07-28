import { TickeanElementBase, t } from "../base";

export class TickeanOrderSummary extends TickeanElementBase {
  protected renderBody(): string {
    const total = this.state?.quote?.totalPrice || 0;
    const items = this.state?.cart || [];
    return `
      <div class="wrap stack" part="order-summary">
        <div class="row">
          <span>${t(this.elementLocale, "total")}</span>
          <span class="total" aria-live="polite">${this.money(total)}</span>
        </div>
        ${
          items.length === 0
            ? `<div class="muted">${t(this.elementLocale, "emptyCart")}</div>`
            : `<div class="muted">${items.length} item(s)</div>`
        }
        ${
          this.state?.isQuoting
            ? `<div class="muted">${t(this.elementLocale, "loading")}</div>`
            : ""
        }
      </div>
    `;
  }
}

if (
  typeof customElements !== "undefined" &&
  !customElements.get("tickean-order-summary")
) {
  if (typeof customElements !== "undefined") customElements.define("tickean-order-summary", TickeanOrderSummary);
}
