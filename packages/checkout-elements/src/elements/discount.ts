import type { PublicShowOption } from "@tickean/checkout-js";
import { TickeanElementBase, t } from "../base";
import { tFormat } from "../i18n";

type DiscountMode = "unlock" | "discount";

function countUnlockedOptions(state: {
  event?: { shows?: { showOptions?: PublicShowOption[] }[] } | null;
} | null): number {
  if (!state?.event?.shows) return 0;
  let n = 0;
  for (const show of state.event.shows) {
    for (const opt of show.showOptions || []) {
      if (opt.catalogVisibility === "PROMO_GATED") n += 1;
    }
  }
  return n;
}

/** Promo unlock for hidden lots (tickets step). */
export function shouldShowPromoCodeUnlock(params: {
  hasPromoGatedShowOptions?: boolean;
  unlockedCount?: number;
  discountCode?: string | null;
}): boolean {
  return (
    Boolean(params.hasPromoGatedShowOptions) ||
    (params.unlockedCount ?? 0) > 0 ||
    Boolean(params.discountCode)
  );
}

/** Price discount codes (buyer step) when integration allows discounts. */
export function shouldShowDiscountCode(params: {
  discountsEnabled?: boolean;
  discountCode?: string | null;
}): boolean {
  if (params.discountCode) return true;
  return params.discountsEnabled !== false;
}

export class TickeanDiscount extends TickeanElementBase {
  private lastSuccess: string | null = null;

  static get observedAttributes() {
    return [...TickeanElementBase.observedAttributes, "mode"];
  }

  private mode(): DiscountMode {
    return this.getAttribute("mode") === "unlock" ? "unlock" : "discount";
  }

  protected renderBody(): string {
    const state = this.state;
    if (!state) return "";

    const mode = this.mode();
    const unlockedCount = countUnlockedOptions(state);
    const discountsEnabled = state.session?.capabilities?.discounts;

    const visible =
      mode === "unlock"
        ? Boolean(state.event?.hasPromoGatedShowOptions) || unlockedCount > 0
        : shouldShowDiscountCode({
            discountsEnabled,
            discountCode: state.discountCode,
          });

    if (!visible) return "";

    const code = state.discountCode || "";
    const locale = this.elementLocale;
    const quoting = Boolean(state.isQuoting);
    const error =
      state.error?.code === "discount_invalid" ? state.error.message : null;
    const title = t(locale, "discountToggle");
    const hint =
      mode === "unlock"
        ? t(locale, "promoUnlockHint")
        : t(locale, "discountCodeHint");

    return `
      <div class="promo-unlock" part="discount" data-mode="${mode}">
        <div class="promo-unlock-copy">
          <p class="promo-unlock-title">${escapeHtml(title)}</p>
          <p class="promo-unlock-hint muted">${escapeHtml(hint)}</p>
        </div>
        <div class="promo-unlock-row">
          <input
            id="code"
            value="${escapeAttr(code)}"
            autocomplete="off"
            spellcheck="false"
            placeholder="${escapeAttr(t(locale, "promoUnlockPlaceholder"))}"
            aria-label="${escapeAttr(t(locale, "discount"))}"
            ${quoting ? "disabled" : ""}
          />
          <button type="button" class="secondary" id="apply" ${quoting ? "disabled" : ""}>
            ${quoting ? escapeHtml(t(locale, "verifying")) : escapeHtml(t(locale, "apply"))}
          </button>
        </div>
        ${
          error
            ? `<p class="promo-unlock-msg danger" role="alert">${escapeHtml(error)}</p>`
            : this.lastSuccess
              ? `<p class="promo-unlock-msg success" role="status">${escapeHtml(this.lastSuccess)}</p>`
              : ""
        }
      </div>
    `;
  }

  protected afterRender() {
    const input = this.root.querySelector<HTMLInputElement>("#code");
    input?.addEventListener("input", () => {
      if (input) input.value = input.value.toUpperCase();
    });
    input?.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        void this.applyCode();
      }
    });
    this.root.querySelector("#apply")?.addEventListener("click", () => {
      void this.applyCode();
    });
  }

  private async applyCode() {
    const input = this.root.querySelector<HTMLInputElement>("#code");
    const value = input?.value?.trim() || "";
    if (!value) return;
    this.lastSuccess = null;
    try {
      const quote = await this.controller?.applyDiscountCode(value);
      const unlocked = quote?.unlockedShowOptions || [];
      const names = unlocked
        .map((o) => o.name)
        .filter((n): n is string => Boolean(n));
      const locale = this.elementLocale;
      if (names.length > 0) {
        this.lastSuccess = tFormat(locale, "promoUnlockSuccessNamed", {
          names: names.join(", "),
        });
      } else if (
        (quote?.unlockedShowOptionIds || []).length > 0 ||
        unlocked.length > 0
      ) {
        this.lastSuccess = t(locale, "promoUnlockSuccess");
      } else {
        this.lastSuccess = t(locale, "promoUnlockApplied");
      }
      this.render();
    } catch {
      this.lastSuccess = null;
      /* surfaced via state.error */
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

if (typeof customElements !== "undefined" && !customElements.get("tickean-discount")) {
  customElements.define("tickean-discount", TickeanDiscount);
}
