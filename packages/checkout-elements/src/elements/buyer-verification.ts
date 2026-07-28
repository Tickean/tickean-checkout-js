import { TickeanElementBase, t } from "../base";

export class TickeanBuyerVerification extends TickeanElementBase {
  private phone = "+5491112345678";
  private name = "";
  private email = "";
  private code = "";

  protected renderBody(): string {
    const verified = this.state?.buyerVerified;
    return `
      <div class="wrap stack" part="buyer-verification">
        <label>
          ${t(this.elementLocale, "phone")}
          <input id="phone" type="tel" value="${escapeAttr(this.phone)}" autocomplete="tel" />
        </label>
        <label>
          ${t(this.elementLocale, "name")}
          <input id="name" value="${escapeAttr(this.name)}" autocomplete="name" />
        </label>
        <label>
          ${t(this.elementLocale, "email")}
          <input id="email" type="email" value="${escapeAttr(this.email)}" autocomplete="email" />
        </label>
        <button type="button" class="secondary" id="send">${t(this.elementLocale, "sendOtp")}</button>
        <label>
          ${t(this.elementLocale, "otpCode")}
          <input id="otp" inputmode="numeric" value="${escapeAttr(this.code)}" autocomplete="one-time-code" />
        </label>
        <button type="button" id="verify">${t(this.elementLocale, "verifyOtp")}</button>
        ${
          verified
            ? `<div class="muted" role="status">${escapeHtml(this.state?.buyer?.name || this.state?.buyer?.phone || "OK")}</div>`
            : ""
        }
      </div>
    `;
  }

  protected afterRender() {
    const phone = this.root.querySelector<HTMLInputElement>("#phone");
    const name = this.root.querySelector<HTMLInputElement>("#name");
    const email = this.root.querySelector<HTMLInputElement>("#email");
    const otp = this.root.querySelector<HTMLInputElement>("#otp");

    const sync = () => {
      this.phone = phone?.value || "";
      this.name = name?.value || "";
      this.email = email?.value || "";
      this.code = otp?.value || "";
    };

    this.root.querySelector("#send")?.addEventListener("click", async () => {
      sync();
      await this.controller?.sendOtp(this.phone);
    });
    this.root.querySelector("#verify")?.addEventListener("click", async () => {
      sync();
      await this.controller?.verifyOtp({
        phone: this.phone,
        code: this.code,
        name: this.name || undefined,
        email: this.email || undefined,
      });
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

if (
  typeof customElements !== "undefined" &&
  !customElements.get("tickean-buyer-verification")
) {
  if (typeof customElements !== "undefined") customElements.define("tickean-buyer-verification", TickeanBuyerVerification);
}
