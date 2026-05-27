/** Platform service fee: 20% of delivery subtotal (price × weight). */
export const PLATFORM_SERVICE_FEE_RATE = 0.2;

export const SERVICE_FEE_TOOLTIP = "Service fee is 20% of total price.";

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
  const serviceFee = deliveryTotal * PLATFORM_SERVICE_FEE_RATE;
  return {
    deliveryTotal,
    serviceFee,
    totalWithFee: deliveryTotal + serviceFee,
  };
}
