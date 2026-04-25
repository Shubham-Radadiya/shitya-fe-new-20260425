/**
 * Silak monthly/yearly: category totals per row (same category names as API).
 */
export function silakCategoryTotalAmount(silak) {
  let murtiAmount = 0;
  let vaghaAmount = 0;
  let gharenaAmount = 0;
  let pujaAmount = 0;
  let pustakAmount = 0;
  let generalAmount = 0;
  const categories = Array.isArray(silak?.categories) ? silak.categories : [];
  categories.forEach((category) => {
    const v = Number(category?.totalBuyingAmountPerCategory);
    const amt = Number.isFinite(v) ? v : 0;
    switch (category?.categoryName) {
      case "મુર્તિ":
        murtiAmount = amt;
        break;
      case "વાઘા":
        vaghaAmount = amt;
        break;
      case "ઘરેણા":
        gharenaAmount = amt;
        break;
      case "પુજા":
        pujaAmount = amt;
        break;
      case "પુસ્તક":
        pustakAmount = amt;
        break;
      case "જનરલ":
        generalAmount = amt;
        break;
      default:
        break;
    }
  });
  const totalAmount =
    murtiAmount +
    vaghaAmount +
    gharenaAmount +
    pujaAmount +
    pustakAmount +
    generalAmount;
  return {
    murtiAmount,
    vaghaAmount,
    gharenaAmount,
    pujaAmount,
    pustakAmount,
    generalAmount,
    totalAmount,
  };
}

/** વધ/ઘટ = open + total sales − close − jama (matches existing table formula). */
export function silakVadGhatDelta(silak) {
  const { totalAmount } = silakCategoryTotalAmount(silak);
  return (
    (silak?.silkData?.openSilak ?? 0) +
    totalAmount -
    (silak?.silkData?.closeSilak ?? 0) -
    (silak?.silkData?.jamaRakam ?? 0)
  );
}

/** Text color for વધ/ઘટ: red negative, green positive, black zero. */
export function getSilakVadGhatColorStyle(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return { color: "#000000" };
  if (n < 0) return { color: "#b71c1c" };
  if (n > 0) return { color: "#1b5e20" };
  return { color: "#000000" };
}
