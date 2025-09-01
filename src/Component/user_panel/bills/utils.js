// Small helpers used across components

export const formatIN = (n) =>
    new Intl.NumberFormat("en-IN").format(Number(n || 0));
  
  export const getEffectivePrice = (product, customPrices) => {
    // Prefer local custom price if present, fallback to product.price
    const local = customPrices?.[product._id];
    const base = product?.price ?? 0;
    return Number(local ?? base);
  };
  
  export const calcTotals = (list, customPrices) => {
    const quantity = list.reduce((t, p) => t + Number(p.quantity || 0), 0);
    const amount = list.reduce(
      (t, p) => t + Number(p.quantity || 0) * getEffectivePrice(p, customPrices),
      0
    );
    return { quantity, amount };
  };
  