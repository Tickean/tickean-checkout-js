export type AppearanceTheme = "default" | "flat" | "night" | "none";

export type Appearance = {
  theme?: AppearanceTheme;
  variables?: Record<string, string>;
};

const themeVars: Record<Exclude<AppearanceTheme, "none">, Record<string, string>> = {
  default: {
    "--tickean-font-family":
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    "--tickean-bg": "#ffffff",
    "--tickean-fg": "#111827",
    "--tickean-muted": "#6b7280",
    "--tickean-border": "#e5e7eb",
    "--tickean-primary": "#111827",
    "--tickean-primary-fg": "#ffffff",
    "--tickean-danger": "#b91c1c",
    "--tickean-radius": "10px",
    "--tickean-space": "12px",
    "--tickean-input-bg": "#ffffff",
  },
  flat: {
    "--tickean-font-family":
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    "--tickean-bg": "#f8fafc",
    "--tickean-fg": "#0f172a",
    "--tickean-muted": "#64748b",
    "--tickean-border": "#cbd5e1",
    "--tickean-primary": "#0f172a",
    "--tickean-primary-fg": "#ffffff",
    "--tickean-danger": "#dc2626",
    "--tickean-radius": "0px",
    "--tickean-space": "12px",
    "--tickean-input-bg": "#ffffff",
  },
  night: {
    "--tickean-font-family":
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    "--tickean-bg": "#0b1220",
    "--tickean-fg": "#e5e7eb",
    "--tickean-muted": "#9ca3af",
    "--tickean-border": "#1f2937",
    "--tickean-primary": "#e5e7eb",
    "--tickean-primary-fg": "#0b1220",
    "--tickean-danger": "#f87171",
    "--tickean-radius": "10px",
    "--tickean-space": "12px",
    "--tickean-input-bg": "#111827",
  },
};

export const baseStyles = `
:host {
  display: block;
  color: var(--tickean-fg, #111827);
  font-family: var(--tickean-font-family, ui-sans-serif, system-ui, sans-serif);
  box-sizing: border-box;
}
*, *::before, *::after { box-sizing: border-box; }
.wrap {
  background: var(--tickean-bg, #fff);
  border: 1px solid var(--tickean-border, #e5e7eb);
  border-radius: var(--tickean-radius, 10px);
  padding: calc(var(--tickean-space, 12px) * 1.25);
}
.muted { color: var(--tickean-muted, #6b7280); font-size: 0.9rem; }
.danger { color: var(--tickean-danger, #b91c1c); }
.row { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.stack { display: grid; gap: var(--tickean-space, 12px); }
.ticket {
  border: 1px solid var(--tickean-border, #e5e7eb);
  border-radius: var(--tickean-radius, 10px);
  padding: var(--tickean-space, 12px);
}
button, input {
  font: inherit;
}
button {
  border: 1px solid var(--tickean-border, #e5e7eb);
  background: var(--tickean-primary, #111827);
  color: var(--tickean-primary-fg, #fff);
  border-radius: calc(var(--tickean-radius, 10px) * 0.7);
  padding: 8px 12px;
  cursor: pointer;
}
button.secondary {
  background: transparent;
  color: var(--tickean-fg, #111827);
}
button:disabled { opacity: 0.55; cursor: not-allowed; }
input {
  width: 100%;
  border: 1px solid var(--tickean-border, #e5e7eb);
  background: var(--tickean-input-bg, #fff);
  color: var(--tickean-fg, #111827);
  border-radius: calc(var(--tickean-radius, 10px) * 0.7);
  padding: 8px 10px;
}
label { display: grid; gap: 4px; font-size: 0.85rem; }
.qty button { min-width: 36px; }
.total[aria-live] { font-weight: 700; font-size: 1.1rem; }
.provider-slot {
  min-height: 48px;
  border: 1px dashed var(--tickean-border, #e5e7eb);
  border-radius: var(--tickean-radius, 10px);
  padding: var(--tickean-space, 12px);
  color: var(--tickean-muted, #6b7280);
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
