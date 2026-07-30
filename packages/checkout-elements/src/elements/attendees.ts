import type { PurchaseAttendee } from "@tickean/checkout-js";
import { TickeanElementBase, t, tFormat } from "../base";

type Slot = {
  key: string;
  showOptionId: string;
  label: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

/**
 * Collects per-ticket attendee names when the event requires it.
 * Emits `attendees-change` with `{ attendees: PurchaseAttendee[] }`.
 */
export class TickeanAttendees extends TickeanElementBase {
  private slots: Slot[] = [];
  private hydrated = false;
  private termsAccepted = false;

  private optionName(id: string) {
    for (const show of this.state?.event?.shows || []) {
      for (const opt of show.showOptions || []) {
        if (opt.id === id) return opt.name || id;
      }
    }
    return id;
  }

  private rebuildSlots() {
    const cart = this.state?.cart || [];
    const prev = new Map(this.slots.map((s) => [s.key, s]));
    const next: Slot[] = [];
    for (const item of cart) {
      for (let i = 0; i < item.amount; i++) {
        const key = `${item.showOptionId}:${i}`;
        const existing = prev.get(key);
        next.push({
          key,
          showOptionId: item.showOptionId,
          label: this.optionName(item.showOptionId),
          firstName: existing?.firstName || "",
          lastName: existing?.lastName || "",
          email: existing?.email || "",
          phone: existing?.phone || "",
        });
      }
    }
    this.slots = next;
    this.emitAttendees();
  }

  private emitAttendees() {
    const settings = this.state?.event?.registrationSettings;
    const attendees: PurchaseAttendee[] = this.slots.map((s) => ({
      showOptionId: s.showOptionId,
      firstName: s.firstName || undefined,
      lastName: s.lastName || undefined,
      email: settings?.requireAttendeeEmail ? s.email || undefined : undefined,
      phone: settings?.requireAttendeePhone ? s.phone || undefined : undefined,
    }));
    this.dispatchEvent(
      new CustomEvent("attendees-change", {
        detail: { attendees, complete: this.isComplete() },
        bubbles: true,
        composed: true,
      }),
    );
  }

  isComplete(): boolean {
    const settings = this.state?.event?.registrationSettings;
    if (!this.slots.length) return false;
    if (settings?.terms?.required && !this.termsAccepted) return false;
    return this.slots.every((s) => {
      if (!s.firstName.trim() || !s.lastName.trim()) return false;
      if (settings?.requireAttendeeEmail && !s.email.trim()) return false;
      if (settings?.requireAttendeePhone && !s.phone.trim()) return false;
      return true;
    });
  }

  getAttendees(): PurchaseAttendee[] {
    const termsRequired = Boolean(
      this.state?.event?.registrationSettings?.terms?.required,
    );
    return this.slots.map((s) => ({
      showOptionId: s.showOptionId,
      firstName: s.firstName || undefined,
      lastName: s.lastName || undefined,
      email: s.email || undefined,
      phone: s.phone || undefined,
      termsAccepted: termsRequired ? this.termsAccepted : undefined,
    }));
  }

  protected renderBody(): string {
    if (!this.hydrated || this.slots.length === 0) {
      this.rebuildSlots();
      this.hydrated = true;
    } else {
      // Keep slots in sync with cart size without wiping typed names.
      const expected = (this.state?.cart || []).reduce((n, i) => n + i.amount, 0);
      if (expected !== this.slots.length) this.rebuildSlots();
    }

    const locale = this.elementLocale;
    const settings = this.state?.event?.registrationSettings;
    if (!this.state?.event?.collectAttendeeData) {
      return `<div class="muted">${escapeHtml(t(locale, "attendees"))}</div>`;
    }

    return `
      <div class="stack" part="attendees" style="gap:10px">
        <p class="section-title">${escapeHtml(t(locale, "attendees"))}</p>
        ${this.slots
          .map(
            (slot, index) => `
          <div class="wrap stack" style="gap:8px;padding:10px 12px" data-slot="${escapeAttr(slot.key)}">
            <div class="row">
              <strong style="font-size:0.9rem">${escapeHtml(tFormat(locale, "attendeeN", { n: index + 1 }))}</strong>
              <span class="muted" style="font-size:0.78rem">${escapeHtml(slot.label)}</span>
            </div>
            <div class="phone-row">
              <label class="field">
                <span>${escapeHtml(t(locale, "firstName"))}</span>
                <input data-f="firstName" value="${escapeAttr(slot.firstName)}" autocomplete="given-name" />
              </label>
              <label class="field">
                <span>${escapeHtml(t(locale, "lastName"))}</span>
                <input data-f="lastName" value="${escapeAttr(slot.lastName)}" autocomplete="family-name" />
              </label>
            </div>
            ${
              settings?.requireAttendeeEmail
                ? `<label class="field"><span>${escapeHtml(t(locale, "email"))}</span>
                    <input data-f="email" type="email" value="${escapeAttr(slot.email)}" autocomplete="email" /></label>`
                : ""
            }
            ${
              settings?.requireAttendeePhone
                ? `<label class="field"><span>${escapeHtml(t(locale, "phone"))}</span>
                    <input data-f="phone" type="tel" value="${escapeAttr(slot.phone)}" autocomplete="tel" /></label>`
                : ""
            }
          </div>
        `,
          )
          .join("")}
        ${
          settings?.terms?.required
            ? `<label class="terms-row">
                <input type="checkbox" id="terms" ${this.termsAccepted ? "checked" : ""} />
                <span>
                  ${escapeHtml(settings.terms.label || t(locale, "acceptTerms"))}
                  ${
                    settings.terms.pdfUrl
                      ? ` <a href="${escapeAttr(settings.terms.pdfUrl)}" target="_blank" rel="noopener noreferrer">PDF</a>`
                      : ""
                  }
                </span>
              </label>`
            : ""
        }
      </div>
    `;
  }

  protected afterRender() {
    this.root.querySelectorAll<HTMLElement>("[data-slot]").forEach((el) => {
      const key = el.getAttribute("data-slot")!;
      const slot = this.slots.find((s) => s.key === key);
      if (!slot) return;
      el.querySelectorAll<HTMLInputElement>("[data-f]").forEach((input) => {
        input.addEventListener("input", () => {
          const field = input.getAttribute("data-f") as keyof Slot;
          if (field === "firstName" || field === "lastName" || field === "email" || field === "phone") {
            slot[field] = input.value;
            this.emitAttendees();
          }
        });
      });
    });
    this.root.querySelector<HTMLInputElement>("#terms")?.addEventListener("change", (e) => {
      this.termsAccepted = Boolean((e.target as HTMLInputElement).checked);
      this.emitAttendees();
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

if (typeof customElements !== "undefined" && !customElements.get("tickean-attendees")) {
  customElements.define("tickean-attendees", TickeanAttendees);
}
