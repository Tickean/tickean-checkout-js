import type { CheckoutController, CheckoutState } from "@tickean/checkout-js";
import { applyAppearance, baseStyles, type Appearance } from "./appearance";
import {
  controllerAttr,
  emitTickeanEvent,
  formatMoney,
  getController,
} from "./context";
import { resolveLocale, t } from "./i18n";

type HostAttrs = {
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
};

const NativeHTMLElement =
  typeof HTMLElement !== "undefined"
    ? HTMLElement
    : (class {
        attachShadow() {
          return { innerHTML: "" } as unknown as ShadowRoot;
        }
      } as unknown as typeof HTMLElement);

export abstract class TickeanElementBase extends NativeHTMLElement {
  protected root: ShadowRoot;
  protected unsubscribe: (() => void) | null = null;
  protected state: CheckoutState | null = null;
  private lastPhase: string | null = null;
  private lastErrorCode: string | null = null;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["appearance", "locale", controllerAttr()];
  }

  connectedCallback() {
    this.applyTheme();
    this.bindController();
    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  attributeChangedCallback(_name?: string, _oldValue?: string | null, _newValue?: string | null) {
    this.applyTheme();
    this.bindController();
    this.render();
  }

  protected get elementLocale() {
    return resolveLocale(this.getAttribute("locale"));
  }

  protected get controller(): CheckoutController | null {
    return getController(this.getAttribute(controllerAttr()));
  }

  protected applyTheme() {
    applyAppearance(this, this.getAttribute("appearance") || undefined);
  }

  protected bindController() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    const controller = this.controller;
    if (!controller) return;

    const onChange = (snapshot: CheckoutState) => {
      this.state = snapshot;
      this.render();
      emitTickeanEvent(this, "change", { state: snapshot });
      if (snapshot.error && snapshot.error.code !== this.lastErrorCode) {
        this.lastErrorCode = snapshot.error.code;
        emitTickeanEvent(this, "error", { error: snapshot.error });
      }
      if (snapshot.phase === "completed" && this.lastPhase !== "completed") {
        emitTickeanEvent(this, "complete", { state: snapshot });
      }
      if (
        this.lastPhase === "initializing" &&
        snapshot.phase !== "initializing" &&
        !snapshot.loading
      ) {
        emitTickeanEvent(this, "ready", { state: snapshot });
      }
      this.lastPhase = snapshot.phase;
    };

    this.state = controller.getSnapshot();
    this.unsubscribe = controller.subscribe(onChange);
    void controller.ready.then(() => {
      const snap = controller.getSnapshot();
      onChange(snap);
    });
  }

  protected styles(): string {
    return baseStyles;
  }

  protected abstract renderBody(): string;

  protected render() {
    this.root.innerHTML = `<style>${this.styles()}</style>${this.renderBody()}`;
    this.afterRender();
  }

  protected afterRender() {
    /* override */
  }

  protected money(amount: number) {
    const currency =
      this.state?.event?.shows?.[0]?.showOptions?.[0]?.currency || "ARS";
    return formatMoney(amount, currency, this.elementLocale);
  }
}

export function readHostControllerId(host: HostAttrs) {
  return host.getAttribute(controllerAttr());
}

export { t, formatMoney };
