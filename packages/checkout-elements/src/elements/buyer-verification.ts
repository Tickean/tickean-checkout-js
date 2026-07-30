import { TickeanElementBase, t } from "../base";
import {
  PHONE_COUNTRIES,
  countryFromIso,
  countryFromLocale,
  detectCountryIso,
  nationalPlaceholder,
  toE164,
  type PhoneCountry,
} from "../phone-countries";

type BuyerStep = "phone" | "onboard" | "otp";

export class TickeanBuyerVerification extends TickeanElementBase {
  private country: PhoneCountry = countryFromLocale("es-AR");
  private national = "";
  private name = "";
  private email = "";
  private code = "";
  private geoResolved = false;
  private countryTouched = false;
  private step: BuyerStep = "phone";
  private knownBuyer: { name?: string; email?: string } | null = null;
  private busy: "lookup" | "send" | "verify" | null = null;
  private firstPaint = true;
  private formError = "";

  connectedCallback() {
    super.connectedCallback();
    void this.resolveGeoCountry();
  }

  private apiBaseUrl(): string {
    return (
      this.getAttribute("api-base-url") ||
      this.closest("tickean-checkout")?.getAttribute("api-base-url") ||
      "https://api.tickean.com"
    );
  }

  private async resolveGeoCountry() {
    if (this.geoResolved || this.countryTouched) return;
    this.country = countryFromLocale(this.elementLocale);
    const iso = await detectCountryIso(this.apiBaseUrl());
    if (!this.countryTouched && iso) {
      this.country = countryFromIso(iso);
      this.geoResolved = true;
      this.render();
    } else {
      this.geoResolved = true;
    }
  }

  private fullPhone() {
    return toE164(this.country.dial, this.national);
  }

  protected renderBody(): string {
    const verified = this.state?.buyerVerified;
    const locale = this.elementLocale;
    const options = PHONE_COUNTRIES.map(
      (c) =>
        `<option value="${c.iso}" ${c.iso === this.country.iso ? "selected" : ""}>${c.flag} +${c.dial}</option>`,
    ).join("");

    if (verified) {
      return `
        <div class="wrap stack" part="buyer-verification">
          <div class="badge">✓ ${escapeHtml(t(locale, "verified"))}</div>
          <div class="muted">${escapeHtml(this.state?.buyer?.name || this.state?.buyer?.phone || this.fullPhone())}</div>
        </div>
      `;
    }

    const phoneBlock = `
      <label class="field">
        <span>${escapeHtml(t(locale, "phone"))}</span>
        <div class="phone-row">
          <div class="phone-country">
            <select id="country" aria-label="${escapeAttr(t(locale, "country"))}" ${this.step !== "phone" ? "disabled" : ""}>${options}</select>
          </div>
          <input id="phone" type="tel" inputmode="tel" autocomplete="tel-national"
            placeholder="${escapeAttr(nationalPlaceholder(this.country.iso))}"
            value="${escapeAttr(this.national)}" ${this.step !== "phone" ? "disabled" : ""} />
        </div>
      </label>`;

    const onboardBlock =
      this.step === "onboard"
        ? `
        <p class="muted" style="margin:0;font-size:0.8rem">${escapeHtml(t(locale, "onboardHint"))}</p>
        <label class="field">
          <span>${escapeHtml(t(locale, "name"))}</span>
          <input id="name" value="${escapeAttr(this.name)}" autocomplete="name" placeholder="${escapeAttr(t(locale, "namePlaceholder"))}" />
        </label>
        <label class="field">
          <span>${escapeHtml(t(locale, "email"))}</span>
          <input id="email" type="email" value="${escapeAttr(this.email)}" autocomplete="email" placeholder="name@email.com" />
        </label>`
        : "";

    const welcome =
      this.step === "otp" && this.knownBuyer?.name
        ? `<p class="muted" style="margin:0;font-size:0.8rem">${escapeHtml(t(locale, "welcomeBack").replace("{name}", this.knownBuyer.name))}</p>`
        : "";

    const primaryLabel =
      this.busy === "lookup" || this.busy === "send"
        ? t(locale, "sending")
        : this.step === "onboard"
          ? t(locale, "continueToOtp")
          : t(locale, "continueToOtp");

    return `
      <div class="wrap stack" part="buyer-verification" style="gap:10px">
        <p class="section-title">${escapeHtml(t(locale, "stepBuyer"))}</p>
        ${phoneBlock}
        ${onboardBlock}
        ${welcome}
        ${
          this.step === "phone" || this.step === "onboard"
            ? `<button type="button" id="continue" ${this.busy ? "disabled" : ""}>
                ${escapeHtml(primaryLabel)}
              </button>`
            : ""
        }
        ${
          this.step !== "phone"
            ? `<button type="button" class="ghost" id="change-phone">${escapeHtml(t(locale, "changePhone"))}</button>`
            : ""
        }
        ${this.formError ? `<div class="danger" role="alert">${escapeHtml(this.formError)}</div>` : ""}
        ${
          this.step === "otp"
            ? `<div class="sheet-backdrop" data-sheet>
                <div class="sheet" role="dialog" aria-modal="true" aria-label="${escapeAttr(t(locale, "otpTitle"))}">
                  <div class="row">
                    <h3>${escapeHtml(t(locale, "otpTitle"))}</h3>
                    <button type="button" class="ghost" data-close>${escapeHtml(t(locale, "close"))}</button>
                  </div>
                  <p class="muted" style="margin:0">${escapeHtml(t(locale, "otpHint"))}</p>
                  <p class="muted" style="margin:0;font-weight:600">${escapeHtml(this.fullPhone())}</p>
                  <div class="otp-digits" id="otp-boxes">
                    ${[0, 1, 2, 3, 4, 5]
                      .map(
                        (i) =>
                          `<input data-otp-i="${i}" inputmode="numeric" maxlength="1" autocomplete="${i === 0 ? "one-time-code" : "off"}" value="${escapeAttr(this.code[i] || "")}" />`,
                      )
                      .join("")}
                  </div>
                  <button type="button" id="verify" ${this.busy === "verify" ? "disabled" : ""}>
                    ${escapeHtml(this.busy === "verify" ? t(locale, "verifying") : t(locale, "verifyOtp"))}
                  </button>
                  <button type="button" class="secondary" id="resend" ${this.busy === "send" ? "disabled" : ""}>
                    ${escapeHtml(t(locale, "resendOtp"))}
                  </button>
                </div>
              </div>`
            : ""
        }
      </div>
    `;
  }

  protected afterRender() {
    if (this.firstPaint) {
      this.firstPaint = false;
      this.setAttribute("data-animated", "");
    }

    const country = this.root.querySelector<HTMLSelectElement>("#country");
    const phone = this.root.querySelector<HTMLInputElement>("#phone");
    const name = this.root.querySelector<HTMLInputElement>("#name");
    const email = this.root.querySelector<HTMLInputElement>("#email");

    const syncProfile = () => {
      this.national = phone?.value || this.national;
      this.name = name?.value ?? this.name;
      this.email = email?.value ?? this.email;
    };

    country?.addEventListener("change", () => {
      this.countryTouched = true;
      this.country = countryFromIso(country.value);
      syncProfile();
      this.render();
    });
    phone?.addEventListener("input", syncProfile);
    name?.addEventListener("input", syncProfile);
    email?.addEventListener("input", syncProfile);

    const sendOtp = async () => {
      this.busy = "send";
      this.formError = "";
      this.render();
      try {
        await this.controller?.sendOtp(this.fullPhone());
        this.step = "otp";
        this.code = "";
      } catch (err) {
        this.formError =
          (err as { message?: string })?.message || t(this.elementLocale, "error");
      } finally {
        this.busy = null;
        this.render();
      }
    };

    const continueFlow = async () => {
      syncProfile();
      this.formError = "";
      if (!this.national.replace(/\D/g, "")) {
        this.formError = t(this.elementLocale, "phone");
        this.render();
        return;
      }

      if (this.step === "onboard") {
        if (!this.name.trim() || !this.email.trim()) {
          this.formError = t(this.elementLocale, "onboardRequired");
          this.render();
          return;
        }
        if (!/^\S+@\S+\.\S+$/.test(this.email.trim())) {
          this.formError = t(this.elementLocale, "emailInvalid");
          this.render();
          return;
        }
        await sendOtp();
        return;
      }

      // Phone step: lookup first (ecommerce parity).
      this.busy = "lookup";
      this.render();
      try {
        const result = await this.controller?.lookupBuyer(this.fullPhone());
        if (result?.exists) {
          this.knownBuyer = {
            name: result.buyer?.name,
            email: result.buyer?.email,
          };
          this.name = result.buyer?.name || "";
          this.email = result.buyer?.email || "";
          await sendOtp();
        } else {
          this.knownBuyer = null;
          this.step = "onboard";
          this.busy = null;
          this.render();
        }
      } catch (err) {
        const status = (err as { status?: number })?.status;
        const message = String((err as { message?: string })?.message || "");
        // API deploy lag: endpoint missing → send OTP; onboard only if verify says new buyer.
        if (status === 404 || /Cannot POST .*buyer\/lookup/i.test(message)) {
          this.knownBuyer = { name: undefined };
          await sendOtp();
          return;
        }
        this.formError = message || t(this.elementLocale, "error");
        this.busy = null;
        this.render();
      }
    };

    this.root.querySelector("#continue")?.addEventListener("click", () => {
      void continueFlow();
    });
    this.root.querySelector("#change-phone")?.addEventListener("click", () => {
      this.step = "phone";
      this.knownBuyer = null;
      this.code = "";
      this.formError = "";
      this.render();
    });
    this.root.querySelector("#resend")?.addEventListener("click", () => {
      void sendOtp();
    });
    this.root.querySelector("[data-close]")?.addEventListener("click", () => {
      this.step = this.knownBuyer ? "phone" : "onboard";
      this.render();
    });
    this.root.querySelector("[data-sheet]")?.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).hasAttribute("data-sheet")) {
        this.step = this.knownBuyer ? "phone" : "onboard";
        this.render();
      }
    });

    const boxes = [
      ...this.root.querySelectorAll<HTMLInputElement>("[data-otp-i]"),
    ];
    const readCode = () => boxes.map((b) => b.value.replace(/\D/g, "")).join("");

    const verify = async () => {
      this.code = readCode();
      if (this.code.length < 4) return;
      this.busy = "verify";
      this.formError = "";
      this.render();
      try {
        await this.controller?.verifyOtp({
          phone: this.fullPhone(),
          code: this.code,
          name: this.knownBuyer?.name ? undefined : this.name || undefined,
          email: this.knownBuyer?.email ? undefined : this.email || undefined,
        });
      } catch (err) {
        const message = String((err as { message?: string })?.message || "");
        if (/name and email are required/i.test(message)) {
          this.knownBuyer = null;
          this.step = "onboard";
          this.formError = t(this.elementLocale, "onboardRequired");
        } else {
          this.formError = message || t(this.elementLocale, "error");
        }
      } finally {
        this.busy = null;
        this.render();
      }
    };

    boxes.forEach((box, i) => {
      box.addEventListener("input", () => {
        const v = box.value.replace(/\D/g, "").slice(-1);
        box.value = v;
        if (v && boxes[i + 1]) boxes[i + 1].focus();
        this.code = readCode();
        if (this.code.length === 6) void verify();
      });
      box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !box.value && boxes[i - 1]) {
          boxes[i - 1].focus();
        }
      });
      box.addEventListener("paste", (e) => {
        const text = e.clipboardData?.getData("text") || "";
        const digits = text.replace(/\D/g, "").slice(0, 6);
        if (!digits) return;
        e.preventDefault();
        digits.split("").forEach((d, idx) => {
          if (boxes[idx]) boxes[idx].value = d;
        });
        this.code = readCode();
        if (this.code.length === 6) void verify();
      });
    });

    this.root.querySelector("#verify")?.addEventListener("click", () => {
      void verify();
    });

    if (this.step === "otp" && boxes[0]) {
      boxes[0].focus();
    }
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
  customElements.define("tickean-buyer-verification", TickeanBuyerVerification);
}
