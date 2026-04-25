/**
 * Fixed category sequence for admin products (table, dropdowns, Excel export).
 */
export const ADMIN_PRODUCT_CATEGORY_ORDER = [
  "મુર્તિ",
  "વાઘા",
  "ઘરેણા",
  "પુજા",
  "પુસ્તક",
  "જનરલ",
];

/** Sort key: lower = earlier. Unknown categories sort after the list, then by Gujarati name. */
export function categoryOrderIndex(name) {
  const n = String(name ?? "").trim();
  const i = ADMIN_PRODUCT_CATEGORY_ORDER.indexOf(n);
  if (i !== -1) return i;
  return ADMIN_PRODUCT_CATEGORY_ORDER.length;
}

export function compareCategoryNames(a, b) {
  const ai = categoryOrderIndex(a);
  const bi = categoryOrderIndex(b);
  if (ai !== bi) return ai - bi;
  return String(a ?? "").localeCompare(String(b ?? ""), "gu");
}

/** Non-mutating sort of category documents by fixed order. */
export function sortCategoriesForAdminDisplay(categories) {
  if (!Array.isArray(categories)) return [];
  return [...categories].sort((x, y) => compareCategoryNames(x?.name, y?.name));
}

export function sortSubcategoriesForAdmin(subs) {
  return [...(subs || [])].sort((a, b) =>
    String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "gu", {
      numeric: true,
    })
  );
}

/** M-001, M-002, … natural order */
export function sortProductsByProductId(products) {
  return [...(products || [])].sort((a, b) =>
    String(a?.productId ?? "").localeCompare(String(b?.productId ?? ""), undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
}

/**
 * Full tree: categories → subcategories → products, all in admin display order.
 * Safe for Excel export (shallow copy per node).
 */
export function orderedCategoriesTreeForAdmin(categories) {
  const sortedCats = sortCategoriesForAdminDisplay(categories);
  return sortedCats.map((cat) => ({
    ...cat,
    subCategory: sortSubcategoriesForAdmin(cat.subCategory).map((sub) => ({
      ...sub,
      products: sortProductsByProductId(sub.products),
    })),
  }));
}
