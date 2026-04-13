function isValidPincode(value) {
  return /^\d{6}$/.test(String(value).trim());
}

function resolveZone(pickupPincode, deliveryPincode) {
  const pickup = String(pickupPincode);
  const delivery = String(deliveryPincode);

  if (pickup.slice(0, 3) === delivery.slice(0, 3)) {
    return { label: "Local", surcharge: 18, eta: "1-2 days" };
  }

  if (pickup.slice(0, 1) === delivery.slice(0, 1)) {
    return { label: "Regional", surcharge: 34, eta: "2-4 days" };
  }

  return { label: "National", surcharge: 56, eta: "4-6 days" };
}

export function calculateShippingEstimate({ packageWeight, pickupPincode, deliveryPincode }) {
  const weight = Number(packageWeight) || 0;

  if (weight <= 0 || !isValidPincode(pickupPincode) || !isValidPincode(deliveryPincode)) {
    return {
      estimatedCost: 0,
      zoneLabel: "--",
      eta: "--",
    };
  }

  const zone = resolveZone(pickupPincode, deliveryPincode);
  const baseCharge = 42;
  const weightCharge = weight <= 0.5 ? 0 : Math.ceil((weight - 0.5) * 2) * 12;

  return {
    estimatedCost: Number((baseCharge + zone.surcharge + weightCharge).toFixed(2)),
    zoneLabel: zone.label,
    eta: zone.eta,
  };
}
