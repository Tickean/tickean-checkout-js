import { describe, expect, it } from "vitest";
import { shouldShowPromoCodeUnlock } from "./elements/discount";
import { resolveDiscountedUnitPrice } from "./elements/ticket-selector";

describe("shouldShowPromoCodeUnlock", () => {
  it("shows when discounts are enabled even without gated options", () => {
    expect(
      shouldShowPromoCodeUnlock({
        hasPromoGatedShowOptions: false,
        discountsEnabled: true,
      }),
    ).toBe(true);
  });

  it("hides for public-only events without discounts capability", () => {
    expect(
      shouldShowPromoCodeUnlock({
        hasPromoGatedShowOptions: false,
        discountsEnabled: false,
      }),
    ).toBe(false);
  });
});

describe("resolveDiscountedUnitPrice", () => {
  const optionA = "opt_day1";
  const optionB = "opt_day2";

  it("previews fixed off from code metadata when cart qty is 0", () => {
    expect(
      resolveDiscountedUnitPrice({
        optionId: optionA,
        basePrice: 50000,
        quantity: 0,
        discountCode: {
          discountType: "FIXED",
          value: 40000,
          allowedShowOptionIds: [optionA, optionB],
          applicationMode: "ONE_UNIT_PER_ELIGIBLE_TYPE",
        },
      }),
    ).toBe(10000);
  });

  it("uses line allocation when the option is in the quote", () => {
    expect(
      resolveDiscountedUnitPrice({
        optionId: optionA,
        basePrice: 50000,
        quantity: 2,
        discountCode: {
          discountType: "FIXED",
          value: 40000,
          allowedShowOptionIds: [optionA, optionB],
        },
        pricingBreakdown: {
          lines: [
            {
              showOptionId: optionA,
              quantity: 2,
              codeDiscountAmount: 40000,
              codeDiscountedUnits: 1,
            },
          ],
        },
      }),
    ).toBe(10000);
  });

  it("does not preview discount for types without an allocation once quoted", () => {
    expect(
      resolveDiscountedUnitPrice({
        optionId: optionB,
        basePrice: 50000,
        quantity: 1,
        discountCode: {
          discountType: "FIXED",
          value: 40000,
          allowedShowOptionIds: [optionA, optionB],
        },
        pricingBreakdown: {
          lines: [
            {
              showOptionId: optionA,
              quantity: 1,
              codeDiscountAmount: 40000,
              codeDiscountedUnits: 1,
            },
            {
              showOptionId: optionB,
              quantity: 1,
              codeDiscountAmount: 0,
              codeDiscountedUnits: 0,
            },
          ],
        },
      }),
    ).toBeNull();
  });
});
