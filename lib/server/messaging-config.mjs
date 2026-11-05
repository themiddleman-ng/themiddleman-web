/** When true, buyers may open a product conversation before a paid order (browse-only enquiry). Defaults to off. */
export function prePurchaseEnquiryEnabled(env = process.env) {
  return env.MARKETPLACE_PRE_PURCHASE_ENQUIRY_ENABLED === "true";
}
