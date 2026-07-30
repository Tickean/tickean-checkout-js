export type AppearanceTheme = "default" | "flat" | "night" | "none";

export type Appearance = {
  theme?: AppearanceTheme;
  variables?: Record<string, string>;
};

const themeVars: Record<Exclude<AppearanceTheme, "none">, Record<string, string>> = {
  default: {
    "--tickean-font-family":
      '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    "--tickean-bg": "#ffffff",
    "--tickean-surface": "#f0fdf4",
    "--tickean-fg": "#052e16",
    "--tickean-muted": "#64748b",
    "--tickean-border": "#dcfce7",
    "--tickean-primary": "#16a34a",
    "--tickean-primary-hover": "#15803d",
    "--tickean-primary-fg": "#ffffff",
    "--tickean-danger": "#dc2626",
    "--tickean-success": "#10b981",
    "--tickean-pass": "#7c3aed",
    "--tickean-pass-bg": "#f5f3ff",
    "--tickean-pass-border": "#ddd6fe",
    "--tickean-radius": "10px",
    "--tickean-space": "8px",
    "--tickean-input-bg": "#ffffff",
    "--tickean-shadow": "0 1px 2px rgba(15, 23, 42, 0.05)",
    "--tickean-shadow-lg": "0 8px 20px rgba(15, 23, 42, 0.07)",
    "--tickean-focus": "rgba(22, 163, 74, 0.22)",
  },
  flat: {
    "--tickean-font-family":
      '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    "--tickean-bg": "#ffffff",
    "--tickean-surface": "#f8fafc",
    "--tickean-fg": "#0f172a",
    "--tickean-muted": "#64748b",
    "--tickean-border": "#e2e8f0",
    "--tickean-primary": "#0f172a",
    "--tickean-primary-hover": "#1e293b",
    "--tickean-primary-fg": "#ffffff",
    "--tickean-danger": "#dc2626",
    "--tickean-success": "#0f766e",
    "--tickean-radius": "10px",
    "--tickean-space": "14px",
    "--tickean-input-bg": "#ffffff",
    "--tickean-shadow": "0 1px 2px rgba(15, 23, 42, 0.06)",
    "--tickean-shadow-lg": "0 12px 28px rgba(15, 23, 42, 0.08)",
    "--tickean-focus": "rgba(15, 23, 42, 0.18)",
  },
  night: {
    "--tickean-font-family":
      '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    "--tickean-bg": "#0b1220",
    "--tickean-surface": "#111827",
    "--tickean-fg": "#e5e7eb",
    "--tickean-muted": "#9ca3af",
    "--tickean-border": "#1f2937",
    "--tickean-primary": "#818cf8",
    "--tickean-primary-hover": "#a5b4fc",
    "--tickean-primary-fg": "#0b1220",
    "--tickean-danger": "#f87171",
    "--tickean-success": "#2dd4bf",
    "--tickean-radius": "12px",
    "--tickean-space": "14px",
    "--tickean-input-bg": "#0f172a",
    "--tickean-shadow": "0 2px 8px rgba(0, 0, 0, 0.35)",
    "--tickean-shadow-lg": "0 18px 40px rgba(0, 0, 0, 0.45)",
    "--tickean-focus": "rgba(129, 140, 248, 0.35)",
  },
};

export const baseStyles = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

:host {
  display: block;
  width: 100%;
  max-width: none;
  margin: 0;
  color: var(--tickean-fg, #052e16);
  font-family: var(--tickean-font-family, Inter, ui-sans-serif, system-ui, sans-serif);
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  font-size: 15px;
}
/* Only the top-level shell caps width; nested elements fill the wizard. */
:host(tickean-checkout) {
  max-width: min(100%, 560px);
  margin: 0 auto;
}
*, *::before, *::after { box-sizing: border-box; }

@keyframes tickean-fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes tickean-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
@keyframes tickean-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

.reveal {
  animation: tickean-fade-up 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
.reveal-1 { animation-delay: 30ms; }
.reveal-2 { animation-delay: 70ms; }
.reveal-3 { animation-delay: 110ms; }
.reveal-4 { animation-delay: 150ms; }
.reveal-5 { animation-delay: 190ms; }
.reveal-6 { animation-delay: 230ms; }
/* After first paint, hosts can set data-animated to avoid re-animating on cart updates */
:host([data-animated]) .reveal {
  animation: none !important;
}

.wrap {
  background: var(--tickean-bg, #fff);
  border: 1px solid var(--tickean-border, #e3e8ee);
  border-radius: var(--tickean-radius, 10px);
  padding: 10px;
  box-shadow: var(--tickean-shadow);
}
.card {
  background: var(--tickean-bg, #fff);
  border: 1px solid var(--tickean-border, #e3e8ee);
  border-radius: calc(var(--tickean-radius, 10px) - 2px);
  padding: var(--tickean-space, 8px);
  box-shadow: var(--tickean-shadow);
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}
.card:hover {
  border-color: color-mix(in srgb, var(--tickean-primary, #635bff) 35%, var(--tickean-border, #e3e8ee));
  box-shadow: var(--tickean-shadow-lg);
}
.muted { color: var(--tickean-muted, #697386); font-size: 0.82rem; line-height: 1.35; }
.danger { color: var(--tickean-danger, #df1b41); font-size: 0.82rem; }
.success { color: var(--tickean-success, #0d9488); font-size: 0.82rem; }
.row { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.stack { display: grid; gap: 8px; }

.section-title {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tickean-muted, #697386);
}

.ticket {
  border: 1px solid var(--tickean-border, #dcfce7);
  border-radius: calc(var(--tickean-radius, 10px) - 2px);
  padding: 8px 10px;
  background: var(--tickean-bg, #fff);
  box-shadow: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}
.ticket[data-selected="true"] {
  border-color: var(--tickean-primary, #16a34a);
  box-shadow: 0 0 0 3px var(--tickean-focus);
}
.ticket.pass {
  border-color: var(--tickean-pass-border, #ddd6fe);
  background: var(--tickean-pass-bg, #f5f3ff);
}
.ticket.pass[data-selected="true"] {
  border-color: var(--tickean-pass, #7c3aed);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.18);
}
.pass-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tickean-pass, #7c3aed) 14%, transparent);
  color: var(--tickean-pass, #7c3aed);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.promo-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tickean-primary, #16a34a) 14%, transparent);
  color: var(--tickean-primary, #16a34a);
  font-size: 0.68rem;
  font-weight: 700;
}
.promo-legend {
  margin-top: 3px;
  font-size: 0.72rem;
  color: var(--tickean-primary, #16a34a);
  font-weight: 550;
}
.stock-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
}
.stock-badge.low-stock {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}
.stock-badge.sold-out {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}
.stock-badge.coming-soon {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}
.ticket.sold-out,
.ticket.coming-soon {
  opacity: 0.72;
  background: var(--tickean-surface, #f8fafc);
}
.pay-methods {
  display: grid;
  gap: 8px;
}
.pay-method {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1.5px solid var(--tickean-border, #dcfce7);
  background: var(--tickean-bg, #fff);
  color: inherit;
  box-shadow: none;
  font-weight: 500;
}
.pay-method:hover:not(:disabled) {
  transform: none;
  background: var(--tickean-surface, #f0fdf4);
}
.pay-method:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}
.pay-methods[data-locked="true"] {
  pointer-events: none;
  opacity: 0.85;
}
.pay-method[data-selected="true"] {
  border-color: var(--tickean-primary, #16a34a);
  box-shadow: 0 0 0 1px var(--tickean-primary, #16a34a);
}
.pay-method-radio {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  border-radius: 999px;
  border: 2px solid var(--tickean-border, #cbd5e1);
  flex-shrink: 0;
}
.pay-method[data-selected="true"] .pay-method-radio {
  border-color: var(--tickean-primary, #16a34a);
  box-shadow: inset 0 0 0 3px var(--tickean-primary, #16a34a);
}
.pay-method-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.pay-method-copy strong {
  font-size: 0.88rem;
}
.pay-method-copy .muted {
  font-size: 0.72rem;
  line-height: 1.3;
}
.transfer-box {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--tickean-border, #dcfce7);
  background: var(--tickean-surface, #f0fdf4);
}
.transfer-box code {
  font-size: 0.9rem;
  font-weight: 700;
  word-break: break-all;
  color: var(--tickean-fg);
}
.transfer-amount {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 12px 10px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--tickean-brand, #16a34a) 10%, #fff);
  border: 1px solid color-mix(in srgb, var(--tickean-brand, #16a34a) 28%, transparent);
  text-align: center;
}
.transfer-amount-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--tickean-muted);
}
.transfer-amount-value {
  font-size: 1.7rem;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--tickean-brand, #16a34a);
}
.transfer-waiting {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--tickean-fg);
}
.transfer-waiting-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--tickean-brand, #16a34a);
  animation: tickean-pulse 1.2s ease-in-out infinite;
}
.copy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  border-top: 1px solid color-mix(in srgb, var(--tickean-border) 80%, transparent);
}
.copy-row:first-of-type {
  border-top: none;
  padding-top: 0;
}
.copy-row-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.copy-row-text .muted {
  font-size: 0.72rem;
}
.copy-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: auto;
  min-height: 34px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--tickean-border);
  background: #fff;
  color: var(--tickean-fg);
  font-size: 0.75rem;
  font-weight: 650;
  cursor: pointer;
}
.copy-btn:hover {
  border-color: color-mix(in srgb, var(--tickean-brand, #16a34a) 45%, var(--tickean-border));
}
.pay-breakdown {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--tickean-border);
  background: var(--tickean-bg, #fff);
}
.pay-breakdown-title {
  font-size: 0.82rem;
}
.pay-breakdown-total {
  margin-top: 2px;
  padding-top: 8px;
  border-top: 1px solid var(--tickean-border);
  font-size: 0.92rem;
}
.pay-method-locked {
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.ghost-btn {
  width: auto;
  min-height: 34px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--tickean-border);
  background: transparent;
  color: var(--tickean-fg);
  font-size: 0.78rem;
  font-weight: 650;
  cursor: pointer;
}
.ghost-btn:hover {
  background: color-mix(in srgb, var(--tickean-brand, #16a34a) 8%, transparent);
}
.terms-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.8rem;
  line-height: 1.35;
}
.terms-row input {
  width: auto;
  margin-top: 2px;
}
.group-title {
  margin: 4px 0 0;
  font-size: 0.8rem;
  font-weight: 650;
  color: var(--tickean-fg);
}
.discount-inline {
  margin-top: 2px;
  width: 100%;
}
.discount-inline details {
  width: 100%;
  border: 1px solid var(--tickean-border);
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--tickean-bg);
}
.discount-inline summary {
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--tickean-muted);
  list-style: none;
}
.discount-inline summary::-webkit-details-marker { display: none; }
.promo-unlock {
  width: 100%;
  border: 1px solid var(--tickean-border);
  border-radius: 12px;
  padding: 12px;
  background: color-mix(in srgb, var(--tickean-muted, #697386) 6%, var(--tickean-bg, #fff));
  display: grid;
  gap: 10px;
}
.promo-unlock-copy { display: grid; gap: 2px; }
.promo-unlock-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 650;
  color: var(--tickean-fg);
}
.promo-unlock-hint {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.35;
}
.promo-unlock-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.promo-unlock-row input {
  flex: 1;
  min-width: 0;
  text-transform: uppercase;
}
.promo-unlock-row button {
  flex-shrink: 0;
}
.promo-unlock-msg {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.35;
}
.promo-unlock-msg.success {
  color: var(--tickean-success, #0d9488);
}
.promo-unlock-msg.danger {
  color: var(--tickean-danger, #df1b41);
}
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: end center;
  z-index: 40;
  padding: 0;
  animation: tickean-fade-up 180ms ease both;
}
.sheet {
  width: min(100%, 420px);
  background: var(--tickean-bg, #fff);
  border-radius: 14px 14px 0 0;
  padding: 14px 14px calc(14px + env(safe-area-inset-bottom, 0px));
  box-shadow: var(--tickean-shadow-lg);
  display: grid;
  gap: 10px;
  animation: tickean-fade-up 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
.sheet h3 {
  margin: 0;
  font-size: 1rem;
  letter-spacing: -0.02em;
}
.otp-digits {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
}
.otp-digits input {
  text-align: center;
  font-weight: 700;
  padding: 10px 0;
  font-size: 16px;
}
.compact-aside .wrap {
  padding: 8px 10px;
  box-shadow: none;
}

button, input, select {
  font: inherit;
}
button {
  border: 1px solid transparent;
  background: var(--tickean-primary, #635bff);
  color: var(--tickean-primary-fg, #fff);
  border-radius: 999px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.01em;
  font-size: 0.92rem;
  transition: background 150ms ease, transform 120ms ease, box-shadow 150ms ease, opacity 150ms ease;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--tickean-primary, #635bff) 22%, transparent);
}
button:hover:not(:disabled) {
  background: var(--tickean-primary-hover, #5851ea);
  transform: translateY(-1px);
}
button:active:not(:disabled) { transform: translateY(0); }
button.secondary {
  background: transparent;
  color: var(--tickean-fg, #0a2540);
  border-color: var(--tickean-border, #e3e8ee);
  box-shadow: none;
}
button.secondary:hover:not(:disabled) {
  background: var(--tickean-surface, #f6f9fc);
  border-color: color-mix(in srgb, var(--tickean-fg, #0a2540) 18%, var(--tickean-border, #e3e8ee));
}
button:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; transform: none; }
button.ghost {
  background: transparent;
  color: var(--tickean-muted, #697386);
  border: none;
  box-shadow: none;
  padding: 8px 10px;
}

.field {
  display: grid;
  gap: 4px;
}
.field > span {
  font-size: 0.76rem;
  font-weight: 500;
  color: var(--tickean-fg, #0a2540);
}
.field-hint {
  font-size: 0.72rem;
  color: var(--tickean-muted, #697386);
}
input, select {
  width: 100%;
  border: 1px solid var(--tickean-border, #e3e8ee);
  background: var(--tickean-input-bg, #fff);
  color: var(--tickean-fg, #0a2540);
  border-radius: 8px;
  padding: 9px 10px;
  transition: border-color 140ms ease, box-shadow 140ms ease;
  outline: none;
  font-size: 16px; /* prevent iOS zoom */
}
input:focus, select:focus {
  border-color: var(--tickean-primary, #635bff);
  box-shadow: 0 0 0 3px var(--tickean-focus);
}
.phone-row {
  display: grid;
  grid-template-columns: minmax(118px, 38%) 1fr;
  gap: 8px;
}
.phone-country {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--tickean-border, #e3e8ee);
  border-radius: 10px;
  background: var(--tickean-input-bg, #fff);
  padding: 0 8px 0 10px;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}
.phone-country:focus-within {
  border-color: var(--tickean-primary, #635bff);
  box-shadow: 0 0 0 3px var(--tickean-focus);
}
.phone-country select {
  border: none;
  box-shadow: none;
  padding: 10px 0;
  background: transparent;
  min-width: 0;
}
.phone-country select:focus { box-shadow: none; }
.qty {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: var(--tickean-surface, #f6f9fc);
  border-radius: 999px;
  padding: 2px;
  border: 1px solid var(--tickean-border, #e3e8ee);
}
.qty button {
  min-width: 32px;
  height: 32px;
  min-height: 32px;
  padding: 0;
  border-radius: 999px;
  box-shadow: none;
  background: var(--tickean-bg, #fff);
  color: var(--tickean-fg, #0a2540);
  border: 1px solid var(--tickean-border, #e3e8ee);
}
.qty button:hover:not(:disabled) {
  background: var(--tickean-surface, #f6f9fc);
  transform: none;
}
.qty span {
  min-width: 28px;
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.total[aria-live] {
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}
.provider-slot {
  min-height: 56px;
  border: 1px dashed var(--tickean-border, #e3e8ee);
  border-radius: var(--tickean-radius, 12px);
  padding: var(--tickean-space, 14px);
  color: var(--tickean-muted, #697386);
  background: var(--tickean-surface, #f6f9fc);
}

/* Stepped checkout shell */
.checkout-steps {
  display: grid;
  gap: 8px;
  padding: 10px;
  background:
    radial-gradient(700px 220px at 8% -20%, color-mix(in srgb, var(--tickean-primary, #16a34a) 10%, transparent), transparent 55%),
    var(--tickean-bg, #fff);
  border: 1px solid var(--tickean-border, #dcfce7);
  border-radius: calc(var(--tickean-radius, 10px) + 2px);
  box-shadow: var(--tickean-shadow);
}
.checkout-steps.compact {
  padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
}
.checkout-header h2 {
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: 700;
}
.checkout-header p {
  margin: 2px 0 0;
}
.event-hero {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}
.event-flyer {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--tickean-border, #dcfce7);
  background: var(--tickean-surface, #f0fdf4);
}
.event-flyer-fallback {
  display: grid;
  place-items: center;
  color: var(--tickean-primary, #16a34a);
  font-size: 1rem;
}
.event-hero-copy {
  min-width: 0;
  display: grid;
  gap: 2px;
}
.event-dates {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 650;
  color: var(--tickean-fg, #052e16);
  letter-spacing: -0.01em;
}
.event-schedule {
  margin: 2px 0 0;
}
.event-schedule summary {
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--tickean-muted, #64748b);
  list-style: none;
}
.event-schedule summary::-webkit-details-marker { display: none; }
.event-show-times {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: grid;
  gap: 1px;
}
.event-show-times li {
  font-size: 0.72rem;
  color: var(--tickean-muted, #64748b);
  line-height: 1.3;
}
.event-place {
  margin: 0;
  font-size: 0.72rem;
}
.progress {
  height: 3px;
  border-radius: 999px;
  background: var(--tickean-surface, #f6f9fc);
  overflow: hidden;
  border: none;
}
.progress > span {
  display: block;
  height: 100%;
  width: var(--tickean-progress, 25%);
  background: linear-gradient(90deg, var(--tickean-primary, #635bff), color-mix(in srgb, var(--tickean-primary, #635bff) 65%, #fff));
  border-radius: inherit;
  transition: width 380ms cubic-bezier(0.22, 1, 0.36, 1);
}
.stepper {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.stepper-item {
  display: grid;
  gap: 3px;
  justify-items: center;
  font-size: 0.65rem;
  color: var(--tickean-muted, #697386);
  font-weight: 500;
  text-align: center;
}
.stepper-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.stepper-dot {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 1px solid var(--tickean-border, #e3e8ee);
  background: var(--tickean-input-bg, #fff);
  font-weight: 650;
  font-size: 0.68rem;
  color: var(--tickean-muted, #697386);
  transition: all 200ms ease;
}
.stepper-item[data-active="true"] {
  color: var(--tickean-fg, #0a2540);
  font-weight: 650;
}
.stepper-item[data-active="true"] .stepper-dot,
.stepper-item[data-done="true"] .stepper-dot {
  background: var(--tickean-primary, #635bff);
  border-color: var(--tickean-primary, #635bff);
  color: var(--tickean-primary-fg, #fff);
}
.step-caption {
  margin: 0;
  font-size: 0.72rem;
}
.checkout-layout {
  display: grid;
  gap: 8px;
}
.summary-drawer {
  border: 1px solid var(--tickean-border, #dcfce7);
  border-radius: 10px;
  background: var(--tickean-bg, #fff);
  overflow: hidden;
}
.summary-drawer-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  list-style: none;
  font-size: 0.8rem;
  font-weight: 600;
}
.summary-drawer-toggle::-webkit-details-marker { display: none; }
.summary-drawer-toggle::after {
  content: "";
  width: 0.45em;
  height: 0.45em;
  border-right: 1.5px solid var(--tickean-muted);
  border-bottom: 1.5px solid var(--tickean-muted);
  transform: rotate(45deg);
  transition: transform 0.15s ease;
  margin-left: 4px;
  flex: 0 0 auto;
}
.summary-drawer[open] .summary-drawer-toggle::after {
  transform: rotate(225deg);
  margin-top: 4px;
}
.summary-drawer-toggle strong {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  margin-left: auto;
}
.summary-drawer-body {
  display: grid;
  gap: 6px;
  padding: 0 8px 8px;
  border-top: 1px solid var(--tickean-border, #e3e8ee);
  width: 100%;
}
.summary-drawer-body > * {
  display: block;
  width: 100%;
  min-width: 0;
}
.summary-drawer:not([open]) .summary-drawer-body { display: none; }
.checkout-sticky {
  display: grid;
  gap: 0;
  background: color-mix(in srgb, var(--tickean-bg, #fff) 92%, transparent);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--tickean-border, #dcfce7);
  box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.06);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.checkout-sticky[hidden] { display: none !important; }
.checkout-dock {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 8px 12px 4px;
}
.checkout-dock[hidden] { display: none !important; }
.checkout-sticky .powered {
  width: 100%;
  margin: 0;
  padding: 2px 10px 8px;
}
.dock-side {
  display: flex;
  align-items: center;
  min-width: 0;
}
.dock-side-start { justify-content: flex-start; }
.dock-side-end { justify-content: flex-end; }
.dock-total {
  display: grid;
  gap: 0;
  min-width: 0;
  line-height: 1.15;
  text-align: center;
  justify-items: center;
}
.dock-total .muted { font-size: 0.68rem; }
.dock-total strong {
  font-size: 0.98rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.dock-back {
  padding: 9px 12px;
  min-height: 40px;
  flex-shrink: 0;
}
.dock-next {
  padding: 9px 16px;
  min-height: 40px;
  min-width: 112px;
}
.step-panels { display: grid; gap: 8px; width: 100%; }
.step-panel[hidden] { display: none !important; }
.step-panel {
  width: 100%;
  animation: tickean-fade-up 280ms cubic-bezier(0.22, 1, 0.36, 1);
}
.step-panel > * {
  display: block;
  width: 100%;
  min-width: 0;
}
.checkout-aside,
.checkout-layout {
  width: 100%;
}
.step-nav {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 2px;
}
.step-nav .spacer { flex: 1; }
.done-card {
  text-align: center;
  padding: 16px 12px;
  background: var(--tickean-surface, #f6f9fc);
  border-radius: var(--tickean-radius, 10px);
  border: 1px solid var(--tickean-border, #e3e8ee);
}
.done-card h3 {
  margin: 0 0 6px;
  font-size: 1.15rem;
  letter-spacing: -0.03em;
}
.done-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto 10px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--tickean-success, #0d9488) 16%, transparent);
  color: var(--tickean-success, #0d9488);
  font-size: 1.15rem;
  font-weight: 700;
}
.done-actions {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}
.done-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 10px 14px;
  border-radius: 999px;
  background: var(--tickean-primary, #16a34a);
  color: var(--tickean-primary-fg, #fff);
  text-decoration: none;
  font-weight: 650;
  font-size: 0.92rem;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--tickean-primary, #16a34a) 22%, transparent);
}
.done-primary:hover {
  background: var(--tickean-primary-hover, #15803d);
}
.done-actions .secondary {
  width: 100%;
}
.powered {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin: 0 auto;
  padding: 4px 8px;
  color: var(--tickean-muted, #697386);
  text-decoration: none;
  font-size: 0.7rem;
  font-weight: 500;
  transition: color 140ms ease;
}
.powered:hover { color: var(--tickean-fg, #0a2540); }
.powered strong {
  color: inherit;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.powered-mark {
  width: 16px;
  height: 16px;
  border-radius: 5px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 2px 6px rgba(22, 163, 74, 0.35);
}
.loading-shell {
  padding: calc(var(--tickean-space, 14px) * 1.5);
  border-radius: calc(var(--tickean-radius, 12px) + 4px);
  border: 1px solid var(--tickean-border, #e3e8ee);
  background: var(--tickean-bg, #fff);
  box-shadow: var(--tickean-shadow-lg);
  display: grid;
  gap: 14px;
}
.skeleton {
  height: 14px;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    var(--tickean-surface, #f6f9fc) 0%,
    color-mix(in srgb, var(--tickean-surface, #f6f9fc) 40%, #fff) 50%,
    var(--tickean-surface, #f6f9fc) 100%
  );
  background-size: 200% 100%;
  animation: tickean-shimmer 1.2s ease-in-out infinite;
}
.skeleton.lg { height: 22px; width: 55%; }
.skeleton.md { height: 44px; }
.skeleton.sm { width: 35%; }
.loading-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--tickean-muted, #697386);
  font-size: 0.9rem;
  animation: tickean-pulse 1.4s ease-in-out infinite;
}
.summary-line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.82rem;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tickean-success, #0d9488) 14%, transparent);
  color: var(--tickean-success, #0d9488);
  font-size: 0.7rem;
  font-weight: 600;
}

/* Mobile-first dock + density */
@media (max-width: 640px) {
  :host {
    max-width: 100%;
    font-size: 14.5px;
  }
  .checkout-steps {
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-shadow: none;
    padding: 8px 10px;
  }
  .checkout-steps.compact {
    padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
  }
  .step-caption,
  .stepper-label {
    display: none;
  }
  .stepper-item {
    justify-items: center;
  }
  .checkout-sticky {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 35;
  }
  .phone-row {
    grid-template-columns: minmax(104px, 34%) 1fr;
    gap: 6px;
  }
}

@media (min-width: 641px) {
  .checkout-steps.compact {
    padding-bottom: 10px;
  }
  .checkout-sticky {
    position: sticky;
    bottom: 0;
    border: 1px solid var(--tickean-border, #dcfce7);
    border-radius: 10px;
    margin-top: 2px;
    border-top: none;
  }
  .summary-drawer {
    border: 1px solid var(--tickean-border, #dcfce7);
    background: var(--tickean-bg, #fff);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal, .step-panel, .skeleton, .loading-label, .ticket, button {
    animation: none !important;
    transition: none !important;
  }
}
`;

export function applyAppearance(host: HTMLElement, appearance?: Appearance | string) {
  let parsed: Appearance = {};
  if (typeof appearance === "string") {
    try {
      parsed = JSON.parse(appearance) as Appearance;
    } catch {
      parsed = { theme: appearance as AppearanceTheme };
    }
  } else if (appearance) {
    parsed = appearance;
  }

  const theme = parsed.theme || "default";
  if (theme !== "none") {
    const vars = themeVars[theme] || themeVars.default;
    for (const [key, value] of Object.entries(vars)) {
      host.style.setProperty(key, value);
    }
  }
  if (parsed.variables) {
    for (const [key, value] of Object.entries(parsed.variables)) {
      const prop = key.startsWith("--") ? key : `--tickean-${key}`;
      host.style.setProperty(prop, value);
    }
  }
}
