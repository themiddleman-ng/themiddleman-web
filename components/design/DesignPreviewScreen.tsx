"use client";

import Link from "next/link";
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";

type PreviewScreen = {
  id: string;
  label: string;
  group: string;
};

export const DESIGN_PREVIEW_SCREENS: PreviewScreen[] = [
  { id: "marketplace", label: "Marketplace", group: "Buyer" },
  { id: "orders", label: "Orders", group: "Buyer" },
  { id: "order-details", label: "Order details", group: "Buyer" },
  { id: "messages", label: "Messages", group: "Buyer" },
  { id: "profile", label: "Profile", group: "Account" },
  { id: "browse", label: "Browse categories", group: "Buyer" },
  { id: "product-detail", label: "Product page", group: "Products" },
  { id: "my-products", label: "My products", group: "Seller" },
  { id: "create-product", label: "Create a product", group: "Seller" },
  { id: "analytics", label: "Analytics", group: "Seller" },
  { id: "payments", label: "Payments", group: "Seller" },
  { id: "disputes", label: "Disputes", group: "Trust" },
  { id: "notifications", label: "Notifications", group: "Account" },
  { id: "settings", label: "Settings", group: "Account" },
  { id: "security", label: "Security", group: "Account" },
  { id: "admin", label: "Overview", group: "Admin" },
  { id: "admin-products", label: "Product review", group: "Admin" },
  { id: "admin-sellers", label: "Sellers", group: "Admin" },
  { id: "admin-delivery", label: "Delivery review", group: "Admin" },
  { id: "admin-escrow", label: "Trust & payouts", group: "Admin" },
  { id: "admin-communications", label: "Communications", group: "Admin" },
  { id: "admin-email", label: "Email previews", group: "Admin" },
];

const listings = [
  ["Invoice & Expense Tracker", "Ada Studio", "₦8,500", "development"],
  ["Business Landing Page Kit", "Tobi Builds", "₦25,000", "development"],
  ["Social Media Brand Pack", "Nneka Design", "₦12,000", "design"],
  ["Student Planner", "Ife Tools", "₦4,000", "writing"],
  ["Restaurant Menu Template", "Kemi Studio", "₦6,500", "design"],
  ["Storefront Starter Kit", "Dev Kole", "₦32,000", "development"],
];

const orders = [
  ["MM-1042", "Invoice & Expense Tracker", "Ada Studio", "₦8,500", "In progress", "15 Oct 2026"],
  ["MM-0987", "Business Landing Page Kit", "PixelForge", "₦12,000", "Delivered", "10 Oct 2026"],
  ["MM-0761", "Social Media Brand Pack", "Creative Hub", "₦6,500", "Completed", "03 Oct 2026"],
];

const queue = [
  ["Product", "Invoice & Expense Tracker", "#P10432", "2h 14m"],
  ["Seller", "Ada Studio application", "#S2781", "5h 36m"],
  ["Delivery review", "Business Landing Page Kit", "#D6623", "1d 4h"],
  ["Product", "Social Media Brand Pack", "#P10411", "1d 22h"],
];

function formatTitle(id: string) {
  return DESIGN_PREVIEW_SCREENS.find((screen) => screen.id === id)?.label ?? "Marketplace";
}

function Chip({ children, active = false, tone = "neutral" }: { children: React.ReactNode; active?: boolean; tone?: "neutral" | "orange" | "blue" | "green" }) {
  return <span className={`mm-demo-chip ${active ? "is-active" : ""} tone-${tone}`}>{children}</span>;
}

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return <div className="mm-demo-section-title"><h2>{title}</h2>{action && <button type="button">{action} <span aria-hidden="true">→</span></button>}</div>;
}

function MarketplacePreview() {
  const [category, setCategory] = useState("All products");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Newest");
  const filtered = listings.filter((item) => (category === "All products" || item[3] === category.toLowerCase()) && item[0].toLowerCase().includes(query.toLowerCase()));
  const sorted = sort === "Price: low to high" ? [...filtered].sort((a, b) => Number(a[2].replace(/\D/g, "")) - Number(b[2].replace(/\D/g, ""))) : filtered;
  return <>
    <div className="mm-demo-hero"><div><h1>Find your next useful starting point.</h1><p>Discover ready-made digital products. Make them yours with the creator.</p></div><Link className="mm-demo-outline" href="?screen=create-product">Sell a digital product</Link></div>
    <label className="mm-demo-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search digital products" aria-label="Search digital products" /><button type="button" onClick={() => setQuery(query.trim())}>Search</button></label>
    <div className="mm-demo-pills" aria-label="Product categories">{["All products", "development", "design", "marketing", "writing"].map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item === "development" ? "Web & Software" : item[0].toUpperCase() + item.slice(1)}</button>)}</div>
    <div className="mm-demo-market-grid"><aside className="mm-demo-panel mm-demo-filter"><strong>Category</strong>{["All products", "development", "design", "marketing", "writing"].map((item) => <label key={item}><input type="radio" name="preview-category" checked={category === item} onChange={() => setCategory(item)} />{item === "development" ? "Web & Software" : item[0].toUpperCase() + item.slice(1)}</label>)}<hr /><strong>Price range</strong>{["Any price", "Under ₦5,000", "₦5,000 – ₦10,000", "₦10,000 – ₦25,000", "Over ₦25,000"].map((item, index) => <label key={item}><input type="radio" name="preview-price" defaultChecked={index === 0} />{item}</label>)}</aside><section><div className="mm-demo-toolbar"><span>{sorted.length} products</span><label>Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option>Newest</option><option>Price: low to high</option></select></label></div><div className="mm-demo-product-grid">{sorted.map((item, index) => <Link href="?screen=product-detail" className="mm-demo-product" key={item[0]}><div className={`mm-demo-cover cover-${index % 4}`}><div className="mm-demo-cover-sheet"><span>{item[0]}</span><i /><i /><i /><b>{index % 2 === 0 ? "₦" : "↗"}</b></div></div><strong>{item[0]}</strong><span>{item[1]} <b className="mm-demo-verified">✓</b></span><strong className="mm-demo-price">{item[2]}</strong><small>⚙ Creator customization</small></Link>)}</div></section></div>
  </>;
}

function OrdersPreview({ detail = false }: { detail?: boolean }) {
  const [tab, setTab] = useState("Purchases");
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState("All");
  if (detail) return <>
    <Link href="?screen=orders" className="mm-demo-back">← Back to orders</Link><div className="mm-demo-hero"><div><h1>Order details</h1><p>Keep the product, payment and delivery details together.</p></div><Chip tone="blue">In progress</Chip></div>
    <div className="mm-demo-detail-grid"><section className="mm-demo-panel"><div className="mm-demo-product-heading"><div className="mm-demo-thumb">X</div><div><h2>Invoice &amp; Expense Tracker</h2><p>Order #MM-1042 · Ada Studio</p></div></div><ol className="mm-demo-steps"><li className="done">Payment confirmed <small>15 Oct 2026, 14:22</small></li><li className="current">In progress <small>Creator is preparing your files</small></li><li>Delivery</li><li>Completed</li></ol><div className="mm-demo-update"><strong>Latest update</strong><p>Your order is in progress. The creator is working on your files.</p><Link href="?screen=messages">Message creator</Link></div></section><aside className="mm-demo-panel"><h2>Payment summary</h2><p>Product <b>₦8,500</b></p><p>Paid securely through Paystack</p><hr /><Link className="mm-demo-primary" href="?screen=messages">Message creator</Link></aside></div>
  </>;
  return <>
    <div className="mm-demo-hero"><div><h1>My orders</h1><p>Track and manage your purchases and sales of digital products.</p></div></div>
    <div className="mm-demo-tabs">{["Purchases", "Sales"].map((item) => <button type="button" className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</div>
    <div className="mm-demo-filter-pills">{["All", "Awaiting payment", "In progress", "Delivered", "Completed"].map((item) => <button type="button" className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <div className="mm-demo-order-list">{orders.filter((item) => filter === "All" || item[4] === filter).map((item, index) => <article className="mm-demo-panel mm-demo-order" key={item[0]}><button className="mm-demo-order-toggle" type="button" aria-expanded={index === 0 ? expanded : false} onClick={() => setExpanded(!expanded)}><div className="mm-demo-thumb">{index === 0 ? "X" : "▧"}</div><div className="mm-demo-order-name"><strong>{item[1]}</strong><span>by {item[2]} · #{item[0]} · {item[5]}</span></div><b className="mm-demo-price">{item[3]}</b><Chip tone={index === 0 ? "blue" : index === 1 ? "green" : "neutral"}>{item[4]}</Chip><span aria-hidden="true">⌄</span></button>{index === 0 && expanded && <div className="mm-demo-order-expanded"><ol className="mm-demo-steps"><li className="done">Payment confirmed <small>15 Oct 2026, 14:22</small></li><li className="current">In progress <small>15 Oct 2026, 16:10</small></li><li>Delivery</li><li>Completed</li></ol><div className="mm-demo-update"><div><strong>Latest update</strong><p>Your order is in progress. The creator is working on your files.</p></div><Link href="?screen=messages">Message creator</Link><Link className="mm-demo-primary" href="?screen=order-details">View details</Link></div></div>}</article>)}</div>
  </>;
}

function MessagesPreview() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  function send(event: React.FormEvent) { event.preventDefault(); if (message.trim()) { setSent((items) => [...items, message.trim()]); setMessage(""); } }
  return <div className="mm-demo-messages"><aside className="mm-demo-panel mm-demo-conversations"><h1>Messages</h1><input placeholder="Search conversations" aria-label="Search conversations" /><button type="button" className="selected"><b className="mm-demo-avatar orange">A</b><span><strong>Ada Studio</strong><small>Invoice &amp; Expense Tracker</small><small>Thanks! I’ll send a preview…</small></span><small>11:24 AM</small></button><button type="button"><b className="mm-demo-avatar navy">TB</b><span><strong>Tobi Builds</strong><small>Business Landing Page Kit</small><small>Sounds good. I’ll make these…</small></span></button><button type="button"><b className="mm-demo-avatar pink">N</b><span><strong>Nneka Design</strong><small>Social Media Brand Pack</small><small>Perfect! Here is the final file…</small></span></button></aside><section className="mm-demo-panel mm-demo-thread"><div className="mm-demo-thread-header"><b className="mm-demo-avatar orange">A</b><div><strong>Ada Studio</strong><small>Order conversation</small></div><button type="button" aria-label="Conversation options">•••</button></div><div className="mm-demo-order-link"><span className="mm-demo-thumb">X</span><span>Invoice &amp; Expense Tracker · Order #MM-1042</span><Link href="?screen=order-details">View order</Link></div><div className="mm-demo-chat"><time>11:15 AM</time><p className="outgoing">Hi Ada, can you add my business name to the invoice template?</p><time>11:17 AM</time><p className="incoming">Yes. Please send the name and your logo here.</p><p className="outgoing">Buks Studio. I’ve attached the logo.</p><div className="mm-demo-file">▧ &nbsp; buks-studio-logo.png <small>245 KB · PNG</small></div><p className="incoming">Thanks! I’ll send a preview here for you to check.</p>{sent.map((item, index) => <p className="outgoing" key={index}>{item}</p>)}</div><form className="mm-demo-composer" onSubmit={send}><button type="button" aria-label="Attach a file">＋</button><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message about this order…" aria-label="Message about this order" /><button className="send" type="submit" aria-label="Send message">➤</button></form></section><aside className="mm-demo-panel mm-demo-order-info"><h2>Order details</h2><div className="mm-demo-cover cover-0"><div className="mm-demo-cover-sheet"><span>Invoice &amp; Expense Tracker</span><i /><i /><i /></div></div><strong>Invoice &amp; Expense Tracker</strong><p>Ada Studio ✓</p><hr /><p>Order number <b>#MM-1042</b></p><p>Total <b>₦8,500</b></p><Chip tone="orange">In progress</Chip><Link className="mm-demo-primary" href="?screen=order-details">View order</Link></aside></div>;
}

function ProfilePreview() {
  const [saved, setSaved] = useState(false);
  return <div className="mm-demo-profile"><aside className="mm-demo-account-nav"><strong>Your account</strong><span className="active">◉ &nbsp; Profile</span><span>▣ &nbsp; Purchases</span><span>▤ &nbsp; Seller tools</span><span>⚙ &nbsp; Settings</span></aside><section><div className="mm-demo-hero"><div><h1>My profile</h1><p>Manage how you appear on The Middleman.</p></div></div><div className="mm-demo-panel mm-demo-profile-head"><div className="mm-demo-profile-photo">BS</div><div><h2>Buks Samuel</h2><p>@bukssamuel</p><button type="button" className="mm-demo-outline">Change photo</button><small>JPG or PNG. Up to 5 MB.</small></div></div><form className="mm-demo-panel mm-demo-form" onSubmit={(event) => { event.preventDefault(); setSaved(true); }}><h2>Personal information</h2><label>Full name<input defaultValue="Samuel Oguntona" /></label><label>Display name<input defaultValue="Buks Samuel" /></label><label>Email address<input defaultValue="samuel@example.com" readOnly /><small>✓ Verified</small></label><label>WhatsApp number<input placeholder="Add your WhatsApp number" /></label><label className="wide">Bio<textarea defaultValue="Building useful digital tools and learning by doing." maxLength={200} /></label><p className="mm-demo-privacy">🔒 Your email and phone number are private.</p><button className="mm-demo-primary" type="submit">{saved ? "Changes saved in this preview" : "Save changes"}</button><button type="button" className="mm-demo-text-button" onClick={() => setSaved(false)}>Cancel</button></form><div className="mm-demo-panel mm-demo-row"><span><strong>Seller tools</strong><small>List a product and manage your creator profile.</small></span><Link href="?screen=my-products">Open seller tools →</Link></div></section></div>;
}

function AdminPreview({ section }: { section: string }) {
  const [filter, setFilter] = useState("");
  const title = section === "admin" ? "Operations overview" : formatTitle(section);
  const rows = section === "admin-sellers" ? [["Ada Studio", "Seller application", "15 Oct 2026", "Review"], ["Tobi Builds", "Verified", "14 Oct 2026", "View"]]
    : section === "admin-escrow" ? [["MM-1042", "In escrow", "₦8,500", "View order"], ["MM-0987", "Delivered", "₦12,000", "View order"]]
      : section === "admin-communications" || section === "admin-email" ? [["Order update", "Email delivered", "Today, 14:22", "Preview"], ["Payment receipt", "Retry needed", "Today, 12:17", "Review"]]
        : [["Invoice & Expense Tracker", "New seller · #P10432", "2h 14m", "Review"], ["Ada Studio", "Seller application · #S2781", "5h 36m", "Review"], ["Business Landing Page Kit", "Delivery review · #D6623", "1d 4h", "Review"], ["Social Media Brand Pack", "Updated details · #P10411", "1d 22h", "Review"]];
  return <div className="mm-demo-admin"><aside className="mm-demo-admin-nav"><strong>ADMIN WORKSPACE</strong>{[["admin", "Overview"], ["admin-products", "Products"], ["admin-sellers", "Sellers"], ["admin-delivery", "Delivery reviews"], ["admin-escrow", "Trust & payouts"], ["admin-communications", "Communications"], ["admin-email", "Email previews"]].map(([id, label]) => <Link key={id} className={id === section ? "active" : ""} href={`?screen=${id}`}>{label}</Link>)}</aside><section><div className="mm-demo-hero"><div><h1>{title}</h1><p>15 October 2026 · Illustrative preview data</p></div></div>{section === "admin" && <div className="mm-demo-metrics">{[["Products awaiting review", "8"], ["Seller applications", "3"], ["Delivery reviews", "4"], ["Notification failures", "2"]].map(([label, value]) => <div className="mm-demo-panel" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}<SectionTitle title={section === "admin" ? "Priority queue" : title} action="View all"/><div className="mm-demo-panel mm-demo-table"><div className="mm-demo-table-head"><span>Type</span><span>Item</span><span>Waiting time</span><span>Action</span></div>{rows.filter((row) => row.join(" ").toLowerCase().includes(filter.toLowerCase())).map((row) => <div className="mm-demo-table-row" key={row.join(":")}><span><Chip tone={row[0] === "Seller" ? "blue" : "orange"}>{row[0]}</Chip></span><strong>{row[1]}</strong><span>{row[2]}</span><button type="button" onClick={() => setFilter(row[1].split(" ")[0])}>{row[3]}</button></div>)}<label className="mm-demo-table-search">Filter this preview <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search review queue" /></label></div>{section === "admin" && <><SectionTitle title="Recent activity" action="View all"/><div className="mm-demo-panel mm-demo-activity">{["Product submitted · Invoice & Expense Tracker", "Delivery review received · Business Landing Page Kit", "Seller application · Ada Studio", "Notification failed · Sample event"].map((item) => <p key={item}>{item}<small>Today · sample data</small></p>)}</div></>}</section></div>;
}

function ProductPreview() {
  const [message, setMessage] = useState("");
  return <><div className="mm-demo-breadcrumb">Marketplace / Web &amp; Software / Invoice &amp; Expense Tracker</div><div className="mm-demo-detail-grid"><section><div className="mm-demo-product-visual"><div className="mm-demo-cover-sheet"><span>Invoice &amp; Expense Tracker</span><i /><i /><i /><b>Income · Expenses · Overview</b></div></div><div className="mm-demo-tabs"><button className="active" type="button">Overview</button><button type="button">What’s included</button><button type="button">Requirements</button><button type="button">Creator</button></div><div className="mm-demo-panel"><h2>Overview</h2><p>Keep track of income, expenses and outstanding invoices with this easy to use spreadsheet. Customize it with the creator to fit your workflow.</p><h3>What’s included</h3><p>Editable spreadsheet · Setup guide · Simple instructions</p></div></section><aside className="mm-demo-panel mm-demo-buy"><h1>Invoice &amp; Expense Tracker</h1><strong className="mm-demo-big-price">₦8,500</strong><p>A simple, editable spreadsheet to manage invoices, track expenses and see your business performance.</p><hr /><h2>Ada Studio <b className="mm-demo-verified">✓</b></h2><p>Digital templates &amp; tools</p><button className="mm-demo-primary" type="button" onClick={() => setMessage("Preview only · no purchase was placed.")}>Continue to checkout</button>{message && <p role="status" className="mm-demo-preview-alert">{message}</p>}<small>🔒 Pay in Naira. Your order is protected.</small></aside></div></>;
}

function SellerPreview({ create = false }: { create?: boolean }) {
  const [status, setStatus] = useState("Active");
  const [step, setStep] = useState(1);
  if (create) return <><div className="mm-demo-hero"><div><h1>Create a product</h1><p>Listings are reviewed before publication.</p></div></div><div className="mm-demo-stepper">{["Details", "Pricing", "More", "Review"].map((label, index) => <button className={step === index + 1 ? "active" : ""} type="button" onClick={() => setStep(index + 1)} key={label}><b>{index + 1}</b>{label}</button>)}</div><div className="mm-demo-detail-grid"><form className="mm-demo-panel mm-demo-form" onSubmit={(event) => { event.preventDefault(); setStep(Math.min(4, step + 1)); }}><h2>{["Product details", "Pricing & package", "Additional information", "Review listing"][step - 1]}</h2><p>Tell buyers what your product is and what’s included.</p>{step === 1 ? <><label>Title<input defaultValue="Modern React Admin Dashboard Template" maxLength={100} /></label><label>Category<select defaultValue="Development"><option>Development</option><option>Design</option><option>Marketing</option><option>Writing</option><option>AI-assisted</option></select></label><label>Description<textarea defaultValue="A clean and modern React admin dashboard template with reusable components, responsive design and easy customization." /></label><label>Preview image<input type="file" accept="image/png,image/jpeg" /></label></> : <><label>{step === 2 ? "Price in Naira" : step === 3 ? "What buyers receive" : "Listing summary"}<input placeholder={step === 2 ? "₦15,000" : "Describe the package"} /></label><label>Customization options<textarea placeholder="Explain what the creator can customize" /></label></>}<button className="mm-demo-primary" type="submit">{step === 4 ? "Save preview draft" : "Continue"}</button></form><aside className="mm-demo-panel"><h2>Listing preview</h2><div className="mm-demo-product-visual compact"><div className="mm-demo-cover-sheet"><span>Admin Dashboard</span><i /><i /><i /></div></div><strong>Modern React Admin Dashboard Template</strong><p className="mm-demo-price">₦15,000</p><small>Sample preview · not submitted</small></aside></div></>;
  return <><div className="mm-demo-hero"><div><h1>My products</h1><p>Create and manage your digital products. Keep your listings up to date to reach more buyers.</p></div><Link className="mm-demo-primary" href="?screen=create-product">＋ Add product</Link></div><div className="mm-demo-tabs">{["Active", "Pending review", "Drafts"].map((item) => <button type="button" className={status === item ? "active" : ""} onClick={() => setStatus(item)} key={item}>{item}</button>)}</div><div className="mm-demo-panel mm-demo-table"><div className="mm-demo-table-head"><span>Product</span><span>Category</span><span>Price</span><span>Status</span><span>Action</span></div>{[["Invoice Tracker", "Spreadsheets", "₦8,500", "Active"], ["Landing Page Kit", "Website templates", "₦25,000", "Pending review"], ["Social Brand Pack", "Design assets", "₦12,000", "Draft"]].filter((item) => item[3] === status).map((item) => <div className="mm-demo-table-row" key={item[0]}><strong>{item[0]}</strong><span>{item[1]}</span><b>{item[2]}</b><Chip tone={status === "Active" ? "green" : "orange"}>{item[3]}</Chip><button type="button" onClick={() => setStatus(item[3] === "Active" ? "Drafts" : item[3])}>Edit</button></div>)}</div></>;
}

function GenericPreview({ screen }: { screen: string }) {
  const [enabled, setEnabled] = useState(true);
  const title = formatTitle(screen);
  return <><div className="mm-demo-hero"><div><h1>{title}</h1><p>Manage your Middleman account with clear, simple controls.</p></div></div><div className="mm-demo-settings-list">{[["Account overview", "Your information and recent activity"], ["Privacy and visibility", "Choose what appears on your profile"], ["Email updates", "Order and account notifications"], ["Security", "Password, sessions and sign-in protection"]].map(([label, description]) => <section className="mm-demo-panel mm-demo-row" key={label}><div><strong>{label}</strong><small>{description}</small></div><button type="button" className={enabled ? "mm-demo-toggle on" : "mm-demo-toggle"} aria-pressed={enabled} onClick={() => setEnabled(!enabled)}>{enabled ? "On" : "Off"}</button></section>)}</div></>;
}

export default function DesignPreviewScreen({ initialScreen = "marketplace" }: { initialScreen?: string }) {
  const screen = DESIGN_PREVIEW_SCREENS.some((item) => item.id === initialScreen) ? initialScreen : "marketplace";
  const current = DESIGN_PREVIEW_SCREENS.find((item) => item.id === screen)!;
  const groups = Array.from(new Set(DESIGN_PREVIEW_SCREENS.map((item) => item.group)));
  return <div className="mm-design mm-design-preview">
    <SiteHeader compact />
    <main className="mm-demo-main">
      <div className="mm-demo-heading"><div><p>DESIGN PREVIEW · SAMPLE CONTENT</p><h1>{current.label}</h1><span>Read-only examples for layout review. No real account data or backend actions.</span></div><Link href="/marketplace">Return to marketplace</Link></div>
      <div className="mm-demo-layout"><nav className="mm-demo-screen-nav" aria-label="Choose a design preview">{groups.map((group) => <div key={group}><b>{group}</b>{DESIGN_PREVIEW_SCREENS.filter((item) => item.group === group).map((item) => <Link key={item.id} aria-current={item.id === screen ? "page" : undefined} href={`?screen=${item.id}`}>{item.label}</Link>)}</div>)}</nav>
      <div className="mm-demo-screen">
        {screen === "marketplace" ? <MarketplacePreview />
          : screen === "orders" ? <OrdersPreview />
            : screen === "order-details" ? <OrdersPreview detail />
              : screen === "messages" ? <MessagesPreview />
                : screen === "profile" ? <ProfilePreview />
                  : screen === "admin" || screen.startsWith("admin-") ? <AdminPreview section={screen} />
                    : screen === "product-detail" ? <ProductPreview />
                      : screen === "my-products" ? <SellerPreview />
                        : screen === "create-product" ? <SellerPreview create />
                          : <GenericPreview screen={screen} />}
      </div></div>
    </main>
  </div>;
}
