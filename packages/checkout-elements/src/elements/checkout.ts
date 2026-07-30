import {
  createCheckoutController,
  type CheckoutController,
  type CreateCheckoutControllerOptions,
  type PurchaseAttendee,
} from "@tickean/checkout-js";
import { TickeanElementBase, t } from "../base";
import { tFormat } from "../i18n";
import {
  controllerAttr,
  registerController,
  unregisterController,
} from "../context";
import {
  buildEventScheduleSummary,
  getEventFlyerUrl,
  resolveEventTimeZone,
} from "../event-meta";
import type { TickeanAttendees } from "./attendees";

import "./ticket-selector";
import "./discount";
import "./buyer-verification";
import "./attendees";
import "./payment";
import "./order-summary";

type CheckoutLayout = "steps" | "stacked";

const TICKEAN_HOME = "https://tickean.com";
const TICKEAN_TICKETS_URL = "https://mi.tickean.com/tickets";

type StepId =
  | "tickets"
  | "buyer"
  | "attendees"
  | "payment"
  | "transfer"
  | "done";

export class TickeanCheckout extends TickeanElementBase {
  private ownedControllerId: string | null = null;
  private ownedController: CheckoutController | null = null;
  private stepIndex = 0;
  private shellMounted = false;
  private shellLayout: CheckoutLayout | null = null;
  private attendees: PurchaseAttendee[] = [];
  private attendeesComplete = false;
  /** After "Cambiar método", stay on payment until they confirm again. */
  private suppressTransferAutoAdvance = false;

  static get observedAttributes() {
    return [
      ...TickeanElementBase.observedAttributes,
      "publishable-key",
      "event-slug",
      "api-base-url",
      "return-url",
      "demo",
      "payment-method",
      "currency",
      "layout",
    ];
  }

  /** Used by payment element / hosts. */
  getAttendees(): PurchaseAttendee[] {
    const el = this.root.querySelector("tickean-attendees") as TickeanAttendees | null;
    if (el?.getAttendees) return el.getAttendees();
    return this.attendees;
  }

  connectedCallback() {
    this.ensureController();
    super.connectedCallback();
    this.addEventListener("attendees-change", ((e: CustomEvent) => {
      this.attendees = e.detail?.attendees || [];
      this.attendeesComplete = Boolean(e.detail?.complete);
      this.syncStepsChrome();
    }) as EventListener);
    this.addEventListener("tickean-change-payment-method", (() => {
      this.suppressTransferAutoAdvance = true;
      this.controller?.changePaymentMethod?.();
      const paymentIdx = this.stepIds().indexOf("payment");
      if (paymentIdx >= 0) {
        this.stepIndex = paymentIdx;
        this.syncStepsChrome();
      }
    }) as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.teardownOwnedController();
    this.shellMounted = false;
    this.shellLayout = null;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (
      ["publishable-key", "event-slug", "api-base-url", "return-url", "demo"].includes(
        name,
      ) &&
      oldValue !== newValue
    ) {
      if (this.isConnected) {
        this.teardownOwnedController();
        this.ensureController();
      }
    }
    if (name === "layout" && oldValue !== newValue) {
      this.shellMounted = false;
      this.shellLayout = null;
      this.stepIndex = 0;
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private get layout(): CheckoutLayout {
    const raw = (this.getAttribute("layout") || "steps").toLowerCase();
    return raw === "stacked" ? "stacked" : "steps";
  }

  private needsAttendees(): boolean {
    return Boolean(this.state?.event?.collectAttendeeData);
  }

  private needsTransferStep(): boolean {
    return this.state?.nextAction?.type === "display_instructions";
  }

  private stepIds(): StepId[] {
    const ids: StepId[] = ["tickets", "buyer"];
    if (this.needsAttendees()) ids.push("attendees");
    ids.push("payment");
    if (this.needsTransferStep()) ids.push("transfer");
    ids.push("done");
    return ids;
  }

  private currentStep(): StepId {
    return this.stepIds()[this.stepIndex] || "tickets";
  }

  private teardownOwnedController() {
    this.ownedController?.dispose();
    if (this.ownedControllerId) unregisterController(this.ownedControllerId);
    this.ownedControllerId = null;
    this.ownedController = null;
    if (this.hasAttribute(controllerAttr())) this.removeAttribute(controllerAttr());
  }

  private ensureController() {
    if (this.ownedController) return;
    const eventSlug = this.getAttribute("event-slug");
    const publishableKey = this.getAttribute("publishable-key") || "";
    if (!eventSlug) return;
    if (this.getAttribute(controllerAttr())) this.removeAttribute(controllerAttr());

    const resumeCode =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("resume") || undefined
        : undefined;

    const options: CreateCheckoutControllerOptions = {
      publishableKey,
      eventSlug,
      apiBaseUrl: this.getAttribute("api-base-url") || undefined,
      returnUrl: this.getAttribute("return-url") || undefined,
      resumeCode: resumeCode || undefined,
      demo: this.hasAttribute("demo"),
      persistence: false,
    };
    this.ownedController = createCheckoutController(options);
    this.ownedControllerId = registerController(this.ownedController);
    this.setAttribute(controllerAttr(), this.ownedControllerId);

    if (resumeCode && typeof window !== "undefined") {
      void this.ownedController.ready.then(() => {
        const snap = this.ownedController?.getSnapshot();
        if (!snap || snap.error) return;
        try {
          const url = new URL(window.location.href);
          if (url.searchParams.has("resume")) {
            url.searchParams.delete("resume");
            window.history.replaceState(
              {},
              "",
              `${url.pathname}${url.search}${url.hash}`,
            );
          }
        } catch {
          /* ignore */
        }
        const steps = this.stepIds();
        let target: StepId = "tickets";
        if (snap.phase === "completed") target = "done";
        else if (
          snap.nextAction?.type === "display_instructions" ||
          snap.phase === "processing"
        ) {
          target = this.needsTransferStep() ? "transfer" : "payment";
        } else if (snap.purchase) target = "payment";
        else if (snap.buyerVerified) {
          target = this.needsAttendees() ? "attendees" : "payment";
        } else if ((snap.cart?.length || 0) > 0) target = "buyer";
        const idx = steps.indexOf(target);
        if (idx >= 0) {
          this.stepIndex = idx;
          this.syncStepsChrome();
        }
      });
    }
  }

  private restartCheckout() {
    this.teardownOwnedController();
    this.stepIndex = 0;
    this.shellMounted = false;
    this.shellLayout = null;
    this.suppressTransferAutoAdvance = false;
    this.attendees = [];
    this.attendeesComplete = false;
    this.ensureController();
    this.bindController();
    this.render();
  }

  private poweredByHtml(locale: string) {
    return `
      <a class="powered" href="${TICKEAN_HOME}" target="_blank" rel="noopener noreferrer">
        <span class="powered-mark" aria-hidden="true"></span>
        <span>${escapeHtml(t(locale, "poweredBy"))} <strong>Tickean</strong></span>
      </a>
    `;
  }

  private eventHeaderHtml() {
    const event = this.state?.event;
    if (!event) return "";
    const locale = this.elementLocale;
    const location = (event.location || {}) as {
      timeZone?: string | null;
      country?: string | null;
      venueName?: string | null;
      city?: string | null;
    };
    const timeZone = resolveEventTimeZone(location);
    const flyer = getEventFlyerUrl(event.images as unknown[]);
    const { dateLabel, showLines } = buildEventScheduleSummary(
      event.shows || [],
      timeZone,
      locale,
    );
    const place = [location.venueName, location.city].filter(Boolean).join(" · ");

    return `
      <div class="checkout-header">
        <div class="event-hero">
          ${
            flyer
              ? `<img class="event-flyer" src="${escapeAttr(flyer)}" alt="${escapeAttr(event.title || "")}" loading="lazy" />`
              : `<div class="event-flyer event-flyer-fallback" aria-hidden="true">✦</div>`
          }
          <div class="event-hero-copy">
            <h2>${escapeHtml(event.title || "")}</h2>
            ${dateLabel ? `<p class="event-dates">${escapeHtml(dateLabel)}</p>` : ""}
            ${place ? `<p class="muted event-place">${escapeHtml(place)}</p>` : ""}
            ${
              showLines.length
                ? `<details class="event-schedule">
                    <summary>${escapeHtml(t(locale, "showTimes"))}</summary>
                    <ul class="event-show-times">${showLines
                      .map((line) => `<li>${escapeHtml(line)}</li>`)
                      .join("")}</ul>
                  </details>`
                : ""
            }
          </div>
        </div>
      </div>
    `;
  }

  private loadingShell(locale: string) {
    return `
      <div class="loading-shell" part="checkout-loading">
        <div class="loading-label">✦ ${escapeHtml(t(locale, "loading"))}</div>
        <div class="skeleton lg"></div>
        <div class="skeleton md"></div>
        <div class="skeleton" style="width:42%"></div>
        ${this.poweredByHtml(locale)}
      </div>
    `;
  }

  protected render() {
    const state = this.state;
    const layout = this.layout;
    const locale = this.elementLocale;

    if (!state || state.loading) {
      this.shellMounted = false;
      this.shellLayout = null;
      this.root.innerHTML = `<style>${this.styles()}</style>${this.loadingShell(locale)}`;
      return;
    }

    if (state.phase === "purchasing") {
      this.suppressTransferAutoAdvance = false;
    }

    if (layout === "steps" && state.phase === "completed") {
      const doneIndex = this.stepIds().indexOf("done");
      if (doneIndex >= 0) this.stepIndex = doneIndex;
    } else if (
      layout === "steps" &&
      this.needsTransferStep() &&
      state.phase !== "completed" &&
      !this.suppressTransferAutoAdvance
    ) {
      const transferIndex = this.stepIds().indexOf("transfer");
      if (transferIndex >= 0) this.stepIndex = transferIndex;
    }

    const hasTransferPanel = Boolean(
      this.root.querySelector('[data-panel="transfer"]'),
    );
    if (
      layout === "steps" &&
      this.shellMounted &&
      this.needsTransferStep() !== hasTransferPanel
    ) {
      this.shellMounted = false;
    }

    if (
      layout === "steps" &&
      this.shellMounted &&
      this.shellLayout === "steps" &&
      this.root.querySelector("[data-tickean-shell='steps']")
    ) {
      this.syncStepsChrome();
      return;
    }

    this.root.innerHTML = `<style>${this.styles()}</style>${this.renderBody()}`;
    this.shellMounted = true;
    this.shellLayout = layout;
    this.setAttribute("data-animated", "");
    this.afterRender();
  }

  protected renderBody(): string {
    return this.layout === "stacked" ? this.renderStacked() : this.renderSteps();
  }

  private sharedChildAttrs(id: string, locale: string, appearance: string) {
    const apiBase = this.getAttribute("api-base-url") || "https://api.tickean.com";
    return `controller-id="${escapeAttr(id)}" locale="${escapeAttr(locale)}" appearance="${escapeAttr(appearance)}" api-base-url="${escapeAttr(apiBase)}"`;
  }

  private renderStacked(): string {
    const id = this.getAttribute(controllerAttr()) || "";
    const locale = this.getAttribute("locale") || "es-AR";
    const appearance = this.getAttribute("appearance") || "default";
    const paymentMethod = this.getAttribute("payment-method") || "TRANSFER";
    const currency = this.getAttribute("currency") || "ARS";
    const state = this.state!;
    const attrs = this.sharedChildAttrs(id, locale, appearance);

    return `
      <div class="stack checkout-steps" part="checkout" data-tickean-shell="stacked">
        ${this.eventHeaderHtml()}
        <tickean-discount ${attrs} mode="unlock"></tickean-discount>
        <tickean-ticket-selector ${attrs}></tickean-ticket-selector>
        <tickean-discount ${attrs} mode="discount"></tickean-discount>
        <tickean-buyer-verification ${attrs}></tickean-buyer-verification>
        ${this.needsAttendees() ? `<tickean-attendees ${attrs}></tickean-attendees>` : ""}
        <details class="summary-drawer">
          <summary class="summary-drawer-toggle">
            <span>${escapeHtml(t(this.elementLocale, "viewSummary"))}</span>
            <strong>${escapeHtml(this.money(Number(state.quote?.totalPrice || 0)))}</strong>
          </summary>
          <div class="summary-drawer-body">
            <tickean-order-summary ${attrs}></tickean-order-summary>
          </div>
        </details>
        <tickean-payment ${attrs} view="method" payment-method="${escapeAttr(paymentMethod)}" currency="${escapeAttr(currency)}"></tickean-payment>
        ${
          this.needsTransferStep()
            ? `<tickean-payment ${attrs} view="transfer" payment-method="${escapeAttr(paymentMethod)}" currency="${escapeAttr(currency)}"></tickean-payment>`
            : ""
        }
        ${this.poweredByHtml(this.elementLocale)}
      </div>
    `;
  }

  private stepLabel(id: StepId, locale: string) {
    switch (id) {
      case "tickets":
        return t(locale, "stepTickets");
      case "buyer":
        return t(locale, "stepBuyer");
      case "attendees":
        return t(locale, "attendees");
      case "payment":
        return t(locale, "stepPayment");
      case "transfer":
        return t(locale, "stepTransfer");
      case "done":
        return t(locale, "stepDone");
    }
  }

  private renderSteps(): string {
    const id = this.getAttribute(controllerAttr()) || "";
    const locale = this.elementLocale;
    const appearance = this.getAttribute("appearance") || "default";
    const paymentMethod = this.getAttribute("payment-method") || "TRANSFER";
    const currency = this.getAttribute("currency") || "ARS";
    const state = this.state!;
    const attrs = this.sharedChildAttrs(id, locale, appearance);
    const steps = this.stepIds();
    const step = this.currentStep();
    const progress = Math.round(((this.stepIndex + 1) / steps.length) * 100);

    const stepper = steps
      .map((sid, index) => {
        const active = sid === step;
        const done = index < this.stepIndex;
        return `
          <li class="stepper-item" data-step-id="${sid}" data-active="${active}" data-done="${done}">
            <span class="stepper-dot" aria-hidden="true">${done ? "✓" : index + 1}</span>
            <span class="stepper-label">${escapeHtml(this.stepLabel(sid, locale))}</span>
          </li>`;
      })
      .join("");

    const dockTotal = this.money(Number(state.quote?.totalPrice || 0));

    return `
      <div class="checkout-steps compact" part="checkout" data-tickean-shell="steps" style="--tickean-progress:${progress}%">
        ${this.eventHeaderHtml()}
        <div class="progress" aria-hidden="true"><span data-progress></span></div>
        <ol class="stepper" aria-label="Checkout" style="grid-template-columns:repeat(${steps.length},minmax(0,1fr))">${stepper}</ol>
        <p class="step-caption muted" data-step-caption>
          ${escapeHtml(tFormat(locale, "stepOf", { current: this.stepIndex + 1, total: steps.length }))}
        </p>
        <div class="checkout-layout">
          <aside class="checkout-aside compact-aside" ${step === "done" ? "hidden" : ""} data-aside>
            <details class="summary-drawer">
              <summary class="summary-drawer-toggle">
                <span>${escapeHtml(t(locale, "viewSummary"))}</span>
                <strong data-dock-total>${escapeHtml(dockTotal)}</strong>
              </summary>
              <div class="summary-drawer-body">
                <tickean-order-summary ${attrs}></tickean-order-summary>
              </div>
            </details>
          </aside>
          <div class="step-panels">
            <section class="step-panel stack" data-panel="tickets" ${step === "tickets" ? "" : "hidden"}>
              <tickean-discount ${attrs} mode="unlock"></tickean-discount>
              <tickean-ticket-selector ${attrs}></tickean-ticket-selector>
            </section>
            <section class="step-panel stack" data-panel="buyer" ${step === "buyer" ? "" : "hidden"}>
              <tickean-discount ${attrs} mode="discount"></tickean-discount>
              <tickean-buyer-verification ${attrs}></tickean-buyer-verification>
            </section>
            <section class="step-panel stack" data-panel="attendees" ${step === "attendees" ? "" : "hidden"}>
              <tickean-attendees ${attrs}></tickean-attendees>
            </section>
            <section class="step-panel stack" data-panel="payment" ${step === "payment" ? "" : "hidden"}>
              <tickean-payment ${attrs} view="method" payment-method="${escapeAttr(paymentMethod)}" currency="${escapeAttr(currency)}"></tickean-payment>
            </section>
            ${
              this.needsTransferStep()
                ? `<section class="step-panel stack" data-panel="transfer" ${step === "transfer" ? "" : "hidden"}>
                    <tickean-payment ${attrs} view="transfer" payment-method="${escapeAttr(paymentMethod)}" currency="${escapeAttr(currency)}"></tickean-payment>
                  </section>`
                : ""
            }
            <section class="step-panel" data-panel="done" ${step === "done" ? "" : "hidden"}>
              <div class="done-card">
                <div class="done-icon" aria-hidden="true">✓</div>
                <h3>${escapeHtml(t(locale, "completed"))}</h3>
                <p class="muted">${escapeHtml(t(locale, "doneSubtitle"))}</p>
                <div data-done-summary class="muted"></div>
                <div class="done-actions">
                  <a class="done-primary" href="${TICKEAN_TICKETS_URL}" target="_blank" rel="noopener noreferrer">
                    ${escapeHtml(t(locale, "viewTickets"))}
                  </a>
                  <button type="button" class="secondary" data-action="buy-again">
                    ${escapeHtml(t(locale, "buyAgain"))}
                  </button>
                </div>
              </div>
            </section>
            <div class="danger" role="alert" data-error ${state.error ? "" : "hidden"}>
              ${state.error ? escapeHtml(state.error.message) : ""}
            </div>
          </div>
        </div>
        <div class="checkout-sticky" data-sticky ${step === "done" ? "hidden" : ""}>
          <div class="checkout-dock" data-step-nav ${step === "transfer" ? "hidden" : ""}>
            <div class="dock-side dock-side-start">
              <button type="button" class="secondary dock-back" data-action="back" ${this.stepIndex <= 0 ? "hidden" : ""}>
                ${escapeHtml(t(locale, "back"))}
              </button>
            </div>
            <div class="dock-total">
              <span class="muted">${escapeHtml(t(locale, "total"))}</span>
              <strong data-dock-total>${escapeHtml(dockTotal)}</strong>
            </div>
            <div class="dock-side dock-side-end">
              <button type="button" class="dock-next" data-action="next" ${step === "payment" || step === "transfer" || step === "done" ? "hidden" : ""} ${this.canGoNext() ? "" : "disabled"}>
                ${escapeHtml(t(locale, "next"))}
              </button>
            </div>
          </div>
          ${this.poweredByHtml(locale)}
        </div>
      </div>
    `;
  }

  private canGoNext(): boolean {
    const state = this.state;
    if (!state) return false;
    const step = this.currentStep();
    if (step === "tickets") return (state.cart?.length || 0) > 0;
    if (step === "buyer") return Boolean(state.buyerVerified);
    if (step === "attendees") return this.attendeesComplete || this.getAttendeesCompleteFromDom();
    return false;
  }

  private getAttendeesCompleteFromDom(): boolean {
    const el = this.root.querySelector("tickean-attendees") as TickeanAttendees | null;
    return Boolean(el?.isComplete?.());
  }

  private syncStepsChrome() {
    const locale = this.elementLocale;
    const steps = this.stepIds();
    if (this.stepIndex >= steps.length) this.stepIndex = steps.length - 1;
    const step = this.currentStep();
    const state = this.state;
    const progress = Math.round(((this.stepIndex + 1) / steps.length) * 100);

    const shell = this.root.querySelector<HTMLElement>("[data-tickean-shell='steps']");
    if (shell) shell.style.setProperty("--tickean-progress", `${progress}%`);

    this.root.querySelectorAll<HTMLElement>(".stepper-item").forEach((item) => {
      const sid = item.getAttribute("data-step-id") as StepId;
      const index = steps.indexOf(sid);
      item.dataset.active = String(sid === step);
      item.dataset.done = String(index < this.stepIndex);
      const dot = item.querySelector(".stepper-dot");
      if (dot) dot.textContent = index < this.stepIndex ? "✓" : String(index + 1);
    });

    const caption = this.root.querySelector("[data-step-caption]");
    if (caption) {
      caption.textContent = tFormat(locale, "stepOf", {
        current: this.stepIndex + 1,
        total: steps.length,
      });
    }

    this.root.querySelectorAll<HTMLElement>(".step-panel").forEach((panel) => {
      const id = panel.getAttribute("data-panel");
      panel.hidden = id !== step;
    });

    const sticky = this.root.querySelector<HTMLElement>("[data-sticky]");
    if (sticky) sticky.hidden = step === "done";

    const nav = this.root.querySelector<HTMLElement>("[data-step-nav]");
    if (nav) nav.hidden = step === "transfer";

    const aside = this.root.querySelector<HTMLElement>("[data-aside]");
    if (aside) aside.hidden = step === "done";

    const back = this.root.querySelector<HTMLButtonElement>('[data-action="back"]');
    if (back) {
      back.hidden = this.stepIndex <= 0 || step === "done" || step === "transfer";
      back.disabled = state?.phase === "purchasing";
    }

    const next = this.root.querySelector<HTMLButtonElement>('[data-action="next"]');
    if (next) {
      next.hidden = step === "payment" || step === "transfer" || step === "done";
      next.disabled = !this.canGoNext();
    }

    // Keep summary accordion closed by default; don't force-open on remount.
    const drawer = this.root.querySelector<HTMLDetailsElement>("details.summary-drawer");
    if (drawer && !drawer.dataset.userToggled) {
      drawer.open = false;
    }

    const dockTotal = this.money(Number(state?.quote?.totalPrice || 0));
    this.root.querySelectorAll("[data-dock-total]").forEach((el) => {
      el.textContent = dockTotal;
    });

    const errorEl = this.root.querySelector<HTMLElement>("[data-error]");
    if (errorEl) {
      if (state?.error) {
        errorEl.hidden = false;
        errorEl.textContent = state.error.message;
      } else {
        errorEl.hidden = true;
        errorEl.textContent = "";
      }
    }

    const doneSummary = this.root.querySelector("[data-done-summary]");
    if (doneSummary && step === "done") {
      const purchaseId = state?.purchase?.id;
      doneSummary.textContent = purchaseId ? `#${purchaseId}` : "";
    }
  }

  protected afterRender() {
    this.root.querySelector('[data-action="buy-again"]')?.addEventListener("click", () => {
      this.restartCheckout();
    });

    if (this.layout !== "steps") return;

    this.root.querySelector("details.summary-drawer")?.addEventListener("toggle", (ev) => {
      const details = ev.currentTarget as HTMLDetailsElement;
      details.dataset.userToggled = "1";
    });

    this.root.querySelector('[data-action="back"]')?.addEventListener("click", () => {
      if (this.state?.phase === "purchasing") return;
      if (this.stepIndex > 0) {
        this.stepIndex -= 1;
        this.syncStepsChrome();
      }
    });

    this.root.querySelector('[data-action="next"]')?.addEventListener("click", () => {
      if (!this.canGoNext()) return;
      const steps = this.stepIds();
      if (this.stepIndex < steps.length - 1) {
        this.stepIndex += 1;
        // skip done until purchase completes
        if (this.currentStep() === "done") this.stepIndex -= 1;
        this.syncStepsChrome();
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

if (typeof customElements !== "undefined" && !customElements.get("tickean-checkout")) {
  customElements.define("tickean-checkout", TickeanCheckout);
}
