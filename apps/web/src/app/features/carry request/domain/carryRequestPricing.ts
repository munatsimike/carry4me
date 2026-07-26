/** Platform service fee: 20% of delivery subtotal (price × weight) plus a flat 3. */
export const PLATFORM_SERVICE_FEE_RATE = 0.2;
export const PLATFORM_SERVICE_FEE_FLAT = 3;

export type CarryRequestPricing = {
  deliveryTotal: number;
  serviceFee: number;
  totalWithFee: number;
};

export function calculateCarryRequestPricing(
  pricePerKg: number,
  weightKg: number,
): CarryRequestPricing {
  const deliveryTotal = pricePerKg * weightKg;
  const serviceFee =
    deliveryTotal > 0
      ? deliveryTotal * PLATFORM_SERVICE_FEE_RATE + PLATFORM_SERVICE_FEE_FLAT
      : 0;
  return {
    deliveryTotal,
    serviceFee,
    totalWithFee: deliveryTotal + serviceFee,
  };
}
