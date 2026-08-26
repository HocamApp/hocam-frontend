import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* DESIGN.md brand tokens. Raw hex behind the variable, so no hsl()
           wrapper here — mixing the two forms is the usual way this file
           starts producing `background-color: hsl(#fbf6f6)`. */
        pink: {
          DEFAULT: "var(--pink)",
          deep: "var(--pink-deep)",
          pale: "var(--pink-pale)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          ink: "var(--gold-ink)",
        },
        paper: "var(--paper)",
        ink: {
          DEFAULT: "var(--ink)",
          mid: "var(--ink-mid)",
        },
        line: "var(--line)",
        success: "var(--success)",
        "success-soft": "var(--success-soft)",
        error: "var(--error)",

        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        brand: {
          50: "hsl(var(--brand-50))",
          100: "hsl(var(--brand-100))",
          200: "hsl(var(--brand-200))",
          300: "hsl(var(--brand-300))",
          400: "hsl(var(--brand-400))",
          500: "hsl(var(--brand-500))",
          600: "hsl(var(--brand-600))",
          700: "hsl(var(--brand-700))",
          800: "hsl(var(--brand-800))",
          900: "hsl(var(--brand-900))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        /* shadcn's lg/md/sm stay: 170 files outside this rebrand still use
           them. The named steps below are the DESIGN.md scale, and the
           primitives are pointed at those individually — overriding the
           single --radius would give every component the same corner, which
           is the uniformity the scale exists to break. */
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        input: "var(--radius-input)",
        card: "var(--radius-card)",
        modal: "var(--radius-modal)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        float: "var(--shadow-float)",
      },
      /* Poppins ships loose, so every step above 24px carries negative
         tracking. Untouched Poppins at display size is one of the clearest
         "nobody adjusted this" signals available; the tightening is what
         makes it read as art-directed rather than merely installed.

         Body, Small and Label do not change between breakpoints. Body never
         drops below 16px either — iOS zooms the viewport on any input under
         that, and the zoom alone makes a site feel broken. */
      fontSize: {
        display: ["4rem", { lineHeight: "0.95", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-m": ["2.5rem", { lineHeight: "0.95", letterSpacing: "-0.03em", fontWeight: "700" }],
        h1: ["2.75rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h1-m": ["1.875rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "700" }],
        h2: ["2rem", { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "700" }],
        "h2-m": ["1.5rem", { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "700" }],
        h3: ["1.375rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "500" }],
        "h3-m": ["1.1875rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "500" }],
        "hero-sub": ["1.625rem", { lineHeight: "1.35", letterSpacing: "-0.01em" }],
        "hero-sub-m": ["1.25rem", { lineHeight: "1.35", letterSpacing: "-0.01em" }],
        "body-l": ["1.125rem", { lineHeight: "1.6" }],
        body: ["1rem", { lineHeight: "1.6" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        label: ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "500" }],
      },
      keyframes: {
        /* Skeleton pulse. Opacity only, so it composites on the GPU and
           never reflows the (often long) lists these sit in. 1.4s: under ~1s
           reads as anxious, over ~2s as stalled. */
        "skeleton-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        /* Marquee: one copy of the row slides exactly its own width plus a
           gap, so the next identical copy lands where it started and the loop
           is seamless. `transform` only — this runs forever, so it must never
           touch layout. */
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "typing-dot": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-3px)", opacity: "1" },
        },
        "message-pop": {
          "0%": { transform: "translateY(6px) scale(0.97)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "skeleton-pulse": "skeleton-pulse 1.4s ease-in-out infinite",
        marquee: "marquee var(--duration) linear infinite",
        "typing-dot": "typing-dot 1.2s ease-in-out infinite",
        "message-pop": "message-pop 0.22s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
