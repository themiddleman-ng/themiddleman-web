export function listingPrice(value) {
  const amount = Number(String(value ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

export function matchesPrice(amount, range) {
  switch (range) {
    case "Under ₦5,000":
    case "under5":
      return amount < 5000;
    case "₦5,000 – ₦10,000":
    case "5to10":
      return amount >= 5000 && amount <= 10000;
    case "₦10,000 – ₦25,000":
    case "10to25":
      return amount >= 10000 && amount <= 25000;
    case "Over ₦25,000":
    case "over25":
      return amount > 25000;
    default:
      return true;
  }
}

export function filterListings(listings, { query = "", category = "All products", price = "Any price", sort = "Newest" } = {}) {
  const needle = String(query).trim().toLowerCase();
  const filtered = listings.filter((item) => {
    const name = String(item[0]).toLowerCase();
    const seller = String(item[1]).toLowerCase();
    const itemCategory = String(item[3]).toLowerCase();
    const categoryOk = category === "All products" || category === "all" || itemCategory === String(category).toLowerCase();
    const queryOk = !needle || name.includes(needle) || seller.includes(needle);
    return categoryOk && queryOk && matchesPrice(listingPrice(item[2]), price);
  });
  if (sort === "Price: low to high" || sort === "low") {
    return [...filtered].sort((a, b) => listingPrice(a[2]) - listingPrice(b[2]));
  }
  if (sort === "Price: high to low" || sort === "high") {
    return [...filtered].sort((a, b) => listingPrice(b[2]) - listingPrice(a[2]));
  }
  return filtered;
}

export function filterThreads(threads, query = "") {
  const needle = String(query).trim().toLowerCase();
  if (!needle) return threads;
  return threads.filter((thread) =>
    [thread.name, thread.product, thread.preview].join(" ").toLowerCase().includes(needle),
  );
}
