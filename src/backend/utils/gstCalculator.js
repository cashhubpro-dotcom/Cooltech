// utils/gstCalculator.js

/**
 * Computes the GST breakdown for a given base amount.
 * Kept as a pure function so both the /calculate endpoint and the
 * invoice-generation module can import and reuse it without duplicating logic.
 *
 * @param {number} baseAmount - taxable value before GST
 * @param {number} rate - GST rate in percent, e.g. 18
 * @param {'intra'|'inter'} supplyType
 * @returns {{ baseAmount:number, cgst:number, sgst:number, igst:number, totalTax:number, total:number }}
 */
export function calculateGst(baseAmount, rate, supplyType) {
  const amt = Number(baseAmount) || 0;
  const r = Number(rate) || 0;

  if (supplyType === 'inter') {
    const igst = round2((amt * r) / 100);
    return {
      baseAmount: round2(amt),
      cgst: 0,
      sgst: 0,
      igst,
      totalTax: igst,
      total: round2(amt + igst),
    };
  }

  const half = round2((amt * (r / 2)) / 100);
  return {
    baseAmount: round2(amt),
    cgst: half,
    sgst: half,
    igst: 0,
    totalTax: round2(half * 2),
    total: round2(amt + half * 2),
  };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}