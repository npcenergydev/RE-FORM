// Illustrative placeholder values. Replace with a published source such as DEFRA conversion factors before presenting.
// Values represent estimated kg CO2e avoided per 1 kg of material diverted from landfill or incineration.

export const IMPACT_FACTORS = {
  fabric: 8,
  wood: 0.5,
  paper: 1,
  plastic: 3,
  metal: 4,
  glass: 1,
  buttons_trims: 3,
  other: 2
};

/**
 * Calculates estimated CO2e avoided (in kg) based on material type and weight.
 * @param {string} materialType 
 * @param {number} weightKg 
 * @returns {number}
 */
export function calculateCO2e(materialType, weightKg) {
  const factor = IMPACT_FACTORS[materialType] ?? IMPACT_FACTORS.other;
  const weight = Number(weightKg) || 0;
  return Number((factor * weight).toFixed(2));
}

/**
 * Calculate total estimated CO2e avoided from an array of materials with weight and type.
 * @param {Array<{type: string, estimated_weight_kg?: number, weight_kg?: number}>} materials 
 * @returns {number}
 */
export function calculateTotalImpact(materials = []) {
  const totalKg = materials.reduce((sum, item) => {
    return sum + (Number(item.estimated_weight_kg || item.weight_kg) || 0);
  }, 0);

  const totalCO2e = materials.reduce((sum, item) => {
    const w = Number(item.estimated_weight_kg || item.weight_kg) || 0;
    const factor = IMPACT_FACTORS[item.type] ?? IMPACT_FACTORS.other;
    return sum + (w * factor);
  }, 0);

  return {
    wasteDivertedKg: Number(totalKg.toFixed(2)),
    co2eAvoidedKg: Number(totalCO2e.toFixed(2))
  };
}
