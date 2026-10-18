// Single source of truth for offer facts used in copy, metadata and schema.
export const OFFER = {
  fromPriceUsd: 74,           // cheapest monthly plan (2 lessons a week)
  siblingDiscountPercent: 12, // matches the pricing calculator
  freeClasses: 2,
} as const;

export const TRIAL_LINE = `Try ${OFFER.freeClasses} free classes, no credit card needed.`;
