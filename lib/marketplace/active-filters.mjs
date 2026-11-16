export function countActiveMarketplaceFilters({
  category = "all",
  query = "",
  priceRange = "all",
  sort = "newest",
} = {}) {
  let count = 0;
  if (category !== "all") count += 1;
  if (String(query).trim() !== "") count += 1;
  if (priceRange !== "all") count += 1;
  if (sort !== "newest") count += 1;
  return count;
}

export function clearedMarketplaceFilters() {
  return {
    category: "all",
    query: "",
    priceRange: "all",
    sort: "newest",
  };
}
