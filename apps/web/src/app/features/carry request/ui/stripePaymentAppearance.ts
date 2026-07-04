import type { Appearance } from "@stripe/stripe-js";

const COLORED_CARD_TAB_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24" role="img" aria-label="Card"><rect width="22" height="14" x="0" y="5" rx="2.5" fill="#1A1F71"/><text x="11" y="14.5" fill="#fff" font-size="6" font-weight="700" font-style="italic" text-anchor="middle" font-family="Arial,sans-serif">VISA</text><circle cx="34" cy="12" r="7" fill="#EB001B"/><circle cx="41" cy="12" r="7" fill="#F79E1B"/></svg>`;

function coloredCardTabIconBackground(): string {
  return `url("data:image/svg+xml,${encodeURIComponent(COLORED_CARD_TAB_ICON)}")`;
}

const coloredCardTabIconRules: Appearance["rules"] = {
  ".TabIcon--card": {
    backgroundImage: coloredCardTabIconBackground(),
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    width: "48px",
    height: "24px",
  },
  ".TabIcon--card > *": {
    opacity: "0",
  },
  ".Tab:nth-child(2) .TabIcon": {
    backgroundImage: coloredCardTabIconBackground(),
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    width: "48px",
    height: "24px",
  },
  ".Tab:nth-child(2) .TabIcon > *": {
    opacity: "0",
  },
  ".Tab:only-child .TabIcon": {
    backgroundImage: coloredCardTabIconBackground(),
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    width: "48px",
    height: "24px",
  },
  ".Tab:only-child .TabIcon > *": {
    opacity: "0",
  },
  ".AccordionItemIcon--card": {
    backgroundImage: coloredCardTabIconBackground(),
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    width: "48px",
    height: "24px",
  },
  ".AccordionItemIcon--card > *": {
    opacity: "0",
  },
  ".AccordionItem:only-child .AccordionItemIcon": {
    backgroundImage: coloredCardTabIconBackground(),
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    width: "48px",
    height: "24px",
  },
  ".AccordionItem:only-child .AccordionItemIcon > *": {
    opacity: "0",
  },
};

export function buildStripePaymentAppearance(): Appearance {
  return {
    theme: "stripe",
    variables: {
      spacingUnit: "5px",
      fontSizeBase: "16px",
      borderRadius: "12px",
    },
    rules: {
      ".Tab": {
        padding: "14px 16px",
        fontSize: "15px",
      },
      ".Tab--selected": {
        backgroundColor: "#eff6ff",
        borderColor: "#93c5fd",
      },
      ".TabIcon": {
        width: "28px",
        height: "24px",
      },
      ".AccordionItem": {
        padding: "14px 16px",
      },
      ".AccordionItem--selected": {
        backgroundColor: "#eff6ff",
        borderColor: "#93c5fd",
      },
      ...coloredCardTabIconRules,
    },
  };
}
