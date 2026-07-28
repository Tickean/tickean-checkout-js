import { TickeanElementBase, t } from "../base";

export class TickeanTicketSelector extends TickeanElementBase {
  protected renderBody(): string {
    const state = this.state;
    if (!state || state.loading) {
      return `<div class="wrap muted">${t(this.elementLocale, "loading")}</div>`;
    }
    const options = (state.event?.shows || []).flatMap((show) =>
      (show.showOptions || []).map((opt) => ({ ...opt, showTitle: show.title })),
    );

    return `
      <div class="wrap stack" part="ticket-selector">
        <strong>${t(this.elementLocale, "tickets")}</strong>
        ${options
          .map((opt) => {
            const qty =
              state.cart.find((c) => c.showOptionId === opt.id)?.amount || 0;
            return `
              <div class="ticket" data-option-id="${opt.id}">
                <div class="row">
                  <div>
                    <div><strong>${escapeHtml(opt.name || opt.id)}</strong></div>
                    <div class="muted">${escapeHtml(opt.showTitle || "")}</div>
                  </div>
                  <div>${this.money(Number(opt.price || 0))}</div>
                </div>
                <div class="row qty" style="margin-top:10px" role="group" aria-label="${t(this.elementLocale, "quantity")} ${escapeHtml(opt.name || "")}">
                  <button type="button" class="secondary" data-action="dec" aria-label="-">−</button>
                  <span aria-live="polite">${qty}</span>
                  <button type="button" class="secondary" data-action="inc" aria-label="+">+</button>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  protected afterRender() {
    this.root.querySelectorAll<HTMLElement>("[data-option-id]").forEach((el) => {
      const optionId = el.getAttribute("data-option-id")!;
      const qty =
        this.state?.cart.find((c) => c.showOptionId === optionId)?.amount || 0;
      el.querySelector('[data-action="dec"]')?.addEventListener("click", () => {
        this.controller?.setCartItem(optionId, Math.max(0, qty - 1));
      });
      el.querySelector('[data-action="inc"]')?.addEventListener("click", () => {
        this.controller?.setCartItem(optionId, qty + 1);
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

if (typeof customElements !== "undefined" && !customElements.get("tickean-ticket-selector")) {
  customElements.define("tickean-ticket-selector", TickeanTicketSelector);
}
