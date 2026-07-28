import { TickeanElementBase, t } from "../base";

export class TickeanDiscount extends TickeanElementBase {
  protected renderBody(): string {
    const code = this.state?.discountCode || "";
    return `
      <div class="wrap stack" part="discount">
        <label>
          ${t(this.elementLocale, "discount")}
          <input id="code" value="${escapeAttr(code)}" autocomplete="off" />
        </label>
        <button type="button" id="apply">${t(this.elementLocale, "apply")}</button>
        ${
          this.state?.error
            ? `<div class="danger" role="alert">${escapeHtml(this.state.error.message)}</div>`
            : ""
        }
      </div>
    `;
  }

  protected afterRender() {
    const input = this.root.querySelector<HTMLInputElement>("#code");
    this.root.querySelector("#apply")?.addEventListener("click", async () => {
      const value = input?.value?.trim() || "";
      try {
        await this.controller?.applyDiscountCode(value);
      } catch {
        /* surfaced via state.error */
      }
    });
  }
}

function escapeAttr(value: string) {
  return value.replace(/"/g, "&quot;");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

if (typeof customElements !== "undefined" && !customElements.get("tickean-discount")) {
  customElements.define("tickean-discount", TickeanDiscount);
}
