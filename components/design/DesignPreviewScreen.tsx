"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { BellIcon } from "@phosphor-icons/react/dist/csr/Bell";
import { ChartBarIcon } from "@phosphor-icons/react/dist/csr/ChartBar";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { DotsThreeIcon } from "@phosphor-icons/react/dist/csr/DotsThree";
import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye";
import { EyeSlashIcon } from "@phosphor-icons/react/dist/csr/EyeSlash";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { FileIcon } from "@phosphor-icons/react/dist/csr/File";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { ImageIcon } from "@phosphor-icons/react/dist/csr/Image";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { PackageIcon } from "@phosphor-icons/react/dist/csr/Package";
import { PaperclipIcon } from "@phosphor-icons/react/dist/csr/Paperclip";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/csr/PaperPlaneTilt";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/csr/PencilSimple";
import { SealCheckIcon } from "@phosphor-icons/react/dist/csr/SealCheck";
import { ShoppingBagIcon } from "@phosphor-icons/react/dist/csr/ShoppingBag";
import { UserCircleIcon } from "@phosphor-icons/react/dist/csr/UserCircle";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import SiteHeader from "@/components/SiteHeader";
import PhotoPicker from "@/components/profile/PhotoPicker";
import { downloadCsv } from "@/lib/client/download-csv";
import { filterListings, filterThreads, type Listing } from "@/lib/design-preview/filters.mjs";
import { prepareAvatarFile } from "@/lib/profile/prepare-avatar";

type PreviewScreen = {
  id: string;
  label: string;
  group: string;
};

type Thread = {
  id: string;
  name: string;
  product: string;
  preview: string;
  time: string;
  initials: string;
  tone: string;
  order: string;
  price: string;
  status: string;
  messages: { from: "you" | "them"; text: string }[];
};

type ProductRow = {
  id: string;
  title: string;
  category: string;
  price: string;
  status: "Active" | "Pending review" | "Drafts";
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

const listings: Listing[] = [
  ["Invoice & Expense Tracker", "Ada Studio", "₦8,500", "development"],
  ["Business Landing Page Kit", "Tobi Builds", "₦25,000", "development"],
  ["Social Media Brand Pack", "Nneka Design", "₦12,000", "design"],
  ["Student Planner", "Ife Tools", "₦4,000", "writing"],
  ["Restaurant Menu Template", "Kemi Studio", "₦6,500", "design"],
  ["Storefront Starter Kit", "Dev Kole", "₦32,000", "development"],
];

const purchaseOrders = [
  ["MM-1042", "Invoice & Expense Tracker", "Ada Studio", "₦8,500", "In progress", "15 Oct 2026"],
  ["MM-0987", "Business Landing Page Kit", "PixelForge", "₦12,000", "Delivered", "10 Oct 2026"],
  ["MM-0761", "Social Media Brand Pack", "Creative Hub", "₦6,500", "Completed", "03 Oct 2026"],
];

const saleOrders = [
  ["MM-1108", "Student Planner", "A buyer", "₦4,000", "Awaiting payment", "16 Oct 2026"],
  ["MM-1044", "Restaurant Menu Template", "A buyer", "₦6,500", "In progress", "12 Oct 2026"],
];

const PRICE_RANGES = ["Any price", "Under ₦5,000", "₦5,000 – ₦10,000", "₦10,000 – ₦25,000", "Over ₦25,000"];
const CATEGORIES = ["All products", "development", "design", "marketing", "writing"];

const threadSeed: Thread[] = [
  {
    id: "ada",
    name: "Ada Studio",
    product: "Invoice & Expense Tracker",
    preview: "Thanks! I’ll send a preview…",
    time: "11:24 AM",
    initials: "A",
    tone: "orange",
    order: "MM-1042",
    price: "₦8,500",
    status: "In progress",
    messages: [
      { from: "you", text: "Hi Ada, can you add my business name to the invoice template?" },
      { from: "them", text: "Yes. Please send the name and your logo here." },
      { from: "you", text: "Buks Studio. I’ve attached the logo." },
      { from: "them", text: "Thanks! I’ll send a preview here for you to check." },
    ],
  },
  {
    id: "tobi",
    name: "Tobi Builds",
    product: "Business Landing Page Kit",
    preview: "Sounds good. I’ll make these…",
    time: "Yesterday",
    initials: "TB",
    tone: "navy",
    order: "MM-0987",
    price: "₦25,000",
    status: "Delivered",
    messages: [
      { from: "them", text: "The landing page kit is ready for a look." },
      { from: "you", text: "Sounds good. I’ll make these notes tonight." },
    ],
  },
  {
    id: "nneka",
    name: "Nneka Design",
    product: "Social Media Brand Pack",
    preview: "Perfect! Here is the final file…",
    time: "Mon",
    initials: "N",
    tone: "pink",
    order: "MM-0761",
    price: "₦12,000",
    status: "Completed",
    messages: [
      { from: "them", text: "Perfect! Here is the final file." },
      { from: "you", text: "Downloaded. Thank you." },
    ],
  },
];

function categoryLabel(item: string) {
  if (item === "development") return "Web & Software";
  if (item === "All products") return item;
  return item[0].toUpperCase() + item.slice(1);
}

function formatTitle(id: string) {
  return DESIGN_PREVIEW_SCREENS.find((screen) => screen.id === id)?.label ?? "Marketplace";
}

function Verified() {
  return <SealCheckIcon className="mm-demo-verified" size={14} weight="fill" aria-label="Verified" />;
}

function Chip({ children, active = false, tone = "neutral" }: { children: ReactNode; active?: boolean; tone?: "neutral" | "orange" | "blue" | "green" }) {
  return <span className={`mm-demo-chip ${active ? "is-active" : ""} tone-${tone}`}>{children}</span>;
}

function SectionTitle({ title, expanded, onToggle }: { title: string; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="mm-demo-section-title">
      <h2>{title}</h2>
      <button type="button" aria-expanded={expanded} onClick={onToggle}>
        {expanded ? "Show less" : "View all"} <ArrowRightIcon size={12} aria-hidden="true" />
      </button>
    </div>
  );
}

function MarketplacePreview() {
  const [category, setCategory] = useState("All products");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Newest");
  const [price, setPrice] = useState("Any price");
  const sorted = filterListings(listings, { query, category, price, sort });
  return (
    <>
      <div className="mm-demo-hero">
        <div>
          <h1>Find your next useful starting point.</h1>
          <p>Discover ready-made digital products. Make them yours with the creator.</p>
        </div>
        <Link className="mm-demo-outline" href="?screen=create-product">Sell a digital product</Link>
      </div>
      <label className="mm-demo-search">
        <span aria-hidden="true"><MagnifyingGlassIcon size={18} /></span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search digital products" aria-label="Search digital products" />
        <button type="button" onClick={() => setQuery(query.trim())}>Search</button>
      </label>
      <div className="mm-demo-pills" aria-label="Product categories">
        {CATEGORIES.map((item) => (
          <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{categoryLabel(item)}</button>
        ))}
      </div>
      <div className="mm-demo-market-grid">
        <aside className="mm-demo-panel mm-demo-filter">
          <strong>Category</strong>
          {CATEGORIES.map((item) => (
            <label key={item}>
              <input type="radio" name="preview-category" checked={category === item} onChange={() => setCategory(item)} />
              {categoryLabel(item)}
            </label>
          ))}
          <hr />
          <strong>Price range</strong>
          {PRICE_RANGES.map((item) => (
            <label key={item}>
              <input type="radio" name="preview-price" checked={price === item} onChange={() => setPrice(item)} />
              {item}
            </label>
          ))}
        </aside>
        <section>
          <div className="mm-demo-toolbar">
            <span>{sorted.length} products</span>
            <label>
              Sort by
              <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
                <option>Newest</option>
                <option>Price: low to high</option>
                <option>Price: high to low</option>
              </select>
            </label>
          </div>
          {sorted.length === 0 ? <p role="status">No sample products match those filters.</p> : (
            <div className="mm-demo-product-grid">
              {sorted.map((item, index) => (
                <Link href="?screen=product-detail" className="mm-demo-product" key={item[0]}>
                  <div className={`mm-demo-cover cover-${index % 4}`}>
                    <div className="mm-demo-cover-sheet"><span>{item[0]}</span><i /><i /><i /><FileIcon size={16} aria-hidden="true" /></div>
                  </div>
                  <strong>{item[0]}</strong>
                  <span>{item[1]} <Verified /></span>
                  <strong className="mm-demo-price">{item[2]}</strong>
                  <small><GearSixIcon size={12} aria-hidden="true" /> Creator customization</small>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function OrdersPreview({ detail = false }: { detail?: boolean }) {
  const [tab, setTab] = useState("Purchases");
  const [filter, setFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(purchaseOrders[0][0]);
  const source = tab === "Sales" ? saleOrders : purchaseOrders;
  const orders = source.filter((item) => filter === "All" || item[4] === filter);
  if (detail) {
    return (
      <>
        <Link href="?screen=orders" className="mm-demo-back">← Back to orders</Link>
        <div className="mm-demo-hero">
          <div>
            <h1>Order details</h1>
            <p>Keep the product, payment and delivery details together.</p>
          </div>
          <Chip tone="blue">In progress</Chip>
        </div>
        <div className="mm-demo-detail-grid">
          <section className="mm-demo-panel">
            <div className="mm-demo-product-heading"><div className="mm-demo-thumb"><FileIcon size={18} aria-hidden="true" /></div><div><h2>Invoice &amp; Expense Tracker</h2><p>Order #MM-1042 · Ada Studio</p></div></div>
            <ol className="mm-demo-steps"><li className="done">Payment confirmed <small>15 Oct 2026, 14:22</small></li><li className="current">In progress <small>Creator is preparing your files</small></li><li>Delivery</li><li>Completed</li></ol>
            <div className="mm-demo-update"><strong>Latest update</strong><p>Your order is in progress. The creator is working on your files.</p><Link href="?screen=messages">Message creator</Link></div>
          </section>
          <aside className="mm-demo-panel">
            <h2>Payment summary</h2>
            <p>Product <b>₦8,500</b></p>
            <p>Paid in Naira through Paystack</p>
            <hr />
            <Link className="mm-demo-primary" href="?screen=messages">Message creator</Link>
          </aside>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="mm-demo-hero"><div><h1>My orders</h1><p>Track and manage your purchases and sales of digital products.</p></div></div>
      <div className="mm-demo-tabs" role="tablist" aria-label="Order type">
        {["Purchases", "Sales"].map((item) => (
          <button type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => { setTab(item); setExpandedId((item === "Sales" ? saleOrders : purchaseOrders)[0][0]); }} key={item}>{item}</button>
        ))}
      </div>
      <div className="mm-demo-filter-pills">
        {["All", "Awaiting payment", "In progress", "Delivered", "Completed"].map((item) => (
          <button type="button" className={filter === item ? "active" : ""} key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>
        ))}
      </div>
      <div className="mm-demo-order-list">
        {orders.length === 0 ? <p role="status">No sample {tab.toLowerCase()} match that status.</p> : orders.map((item) => {
          const open = expandedId === item[0];
          return (
            <article className="mm-demo-panel mm-demo-order" key={item[0]}>
              <button className="mm-demo-order-toggle" type="button" aria-expanded={open} onClick={() => setExpandedId(open ? null : item[0])}>
                <div className="mm-demo-thumb"><FileIcon size={18} aria-hidden="true" /></div>
                <div className="mm-demo-order-name"><strong>{item[1]}</strong><span>by {item[2]} · #{item[0]} · {item[5]}</span></div>
                <b className="mm-demo-price">{item[3]}</b>
                <Chip tone={item[4] === "In progress" ? "blue" : item[4] === "Delivered" || item[4] === "Completed" ? "green" : "neutral"}>{item[4]}</Chip>
              </button>
              {open && (
                <div className="mm-demo-order-expanded">
                  <ol className="mm-demo-steps">
                    <li className="done">Payment confirmed <small>{item[5]}</small></li>
                    <li className={item[4] === "Awaiting payment" ? "current" : "done"}>{item[4]}</li>
                    <li className={item[4] === "Delivered" ? "current" : ""}>Delivery</li>
                    <li className={item[4] === "Completed" ? "current" : ""}>Completed</li>
                  </ol>
                  <div className="mm-demo-update">
                    <div><strong>Latest update</strong><p>{item[1]} is {item[4].toLowerCase()}.</p></div>
                    <Link href="?screen=messages">Message creator</Link>
                    <Link className="mm-demo-primary" href="?screen=order-details">View details</Link>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function MessagesPreview() {
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState(threadSeed);
  const [activeId, setActiveId] = useState(threadSeed[0].id);
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const visible = filterThreads(threads, query);
  const active = visible.find((thread) => thread.id === activeId) ?? visible[0] ?? threads.find((thread) => thread.id === activeId) ?? threads[0];

  useEffect(() => {
    if (!menuOpen) return;
    function close(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  function send(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text && !attachment) return;
    const body = attachment ? `${text}${text ? " · " : ""}${attachment.name}` : text;
    setThreads((items) => items.map((item) => item.id === active.id
      ? { ...item, preview: body, messages: [...item.messages, { from: "you" as const, text: body }] }
      : item));
    setDraft("");
    setAttachment(null);
    setNotice("");
  }

  async function copyOrder() {
    try {
      await navigator.clipboard.writeText(active.order);
      setNotice(`Copied ${active.order}`);
    } catch {
      setNotice(`Order number ${active.order}`);
    }
    setMenuOpen(false);
  }

  return (
    <div className="mm-demo-messages">
      <aside className="mm-demo-panel mm-demo-conversations">
        <h1>Messages</h1>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" aria-label="Search conversations" />
        {visible.length === 0 ? <p role="status">No conversations match that search.</p> : visible.map((thread) => (
          <button type="button" key={thread.id} className={thread.id === active.id ? "selected" : ""} aria-pressed={thread.id === active.id} onClick={() => { setActiveId(thread.id); setMenuOpen(false); setNotice(""); }}>
            <b className={`mm-demo-avatar ${thread.tone}`}>{thread.initials}</b>
            <span><strong>{thread.name}</strong><small>{thread.product}</small><small>{thread.preview}</small></span>
            <small>{thread.time}</small>
          </button>
        ))}
      </aside>
      <section className="mm-demo-panel mm-demo-thread">
        <div className="mm-demo-thread-header" ref={menuRef}>
          <b className={`mm-demo-avatar ${active.tone}`}>{active.initials}</b>
          <div><strong>{active.name}</strong><small>Order conversation</small></div>
          <label className="mm-demo-thread-switch">
            <select aria-label="Switch conversation" value={active.id} onChange={(event) => setActiveId(event.target.value)}>
              {threads.map((thread) => <option key={thread.id} value={thread.id}>{thread.name}</option>)}
            </select>
          </label>
          <button type="button" aria-label="Conversation options" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <DotsThreeIcon size={20} weight="bold" aria-hidden="true" />
          </button>
          {menuOpen && (
            <div className="mm-demo-menu" role="menu">
              <Link role="menuitem" href="?screen=order-details" onClick={() => setMenuOpen(false)}>View order</Link>
              <button type="button" role="menuitem" onClick={() => void copyOrder()}>Copy order number</button>
            </div>
          )}
        </div>
        <div className="mm-demo-order-link">
          <span className="mm-demo-thumb"><FileIcon size={16} aria-hidden="true" /></span>
          <span>{active.product} · Order #{active.order}</span>
          <Link href="?screen=order-details">View order</Link>
        </div>
        <div className="mm-demo-chat">
          {active.messages.map((message, index) => <p className={message.from === "you" ? "outgoing" : "incoming"} key={`${active.id}-${index}`}>{message.text}</p>)}
          {notice && <p role="status">{notice}</p>}
        </div>
        <form className="mm-demo-composer" onSubmit={send}>
          <label className="relative grid size-[38px] place-items-center overflow-hidden rounded-[6px] border border-[#dce2eb] text-[#253650]">
            <input ref={fileRef} type="file" className="absolute inset-0 cursor-pointer opacity-0" aria-label="Attach a file" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} />
            <PaperclipIcon size={16} aria-hidden="true" />
          </label>
          {attachment && <span className="mm-demo-file-chip">{attachment.name} <button type="button" aria-label="Remove attachment" onClick={() => setAttachment(null)}><XIcon size={12} /></button></span>}
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Message ${active.name}…`} aria-label={`Message about ${active.product}`} />
          <button className="send" type="submit" aria-label="Send message"><PaperPlaneTiltIcon size={16} weight="fill" aria-hidden="true" /></button>
        </form>
      </section>
      <aside className="mm-demo-panel mm-demo-order-info">
        <h2>Order details</h2>
        <div className="mm-demo-cover cover-0"><div className="mm-demo-cover-sheet"><span>{active.product}</span><i /><i /><i /></div></div>
        <strong>{active.product}</strong>
        <p>{active.name} <Verified /></p>
        <hr />
        <p>Order number <b>#{active.order}</b></p>
        <p>Total <b>{active.price}</b></p>
        <Chip tone="orange">{active.status}</Chip>
        <Link className="mm-demo-primary" href="?screen=order-details">View order</Link>
      </aside>
    </div>
  );
}

function ProfilePreview() {
  const savedSeed = { fullName: "Samuel Oguntona", displayName: "Buks Samuel", phone: "", bio: "Building useful digital tools and learning by doing." };
  const [saved, setSaved] = useState(savedSeed);
  const [form, setForm] = useState(savedSeed);
  const [status, setStatus] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoError, setPhotoError] = useState("");

  async function onPhoto(file: File) {
    const prepared = await prepareAvatarFile(file, 5 * 1024 * 1024);
    if (!prepared.ok) {
      setPhotoError(prepared.message || "Choose a JPG, PNG or a photo from your camera roll.");
      return;
    }
    setPhoto((current) => {
      if (current) URL.revokeObjectURL(current);
      return prepared.previewUrl;
    });
    setPhotoError("");
    setStatus("Photo updated in this preview. It is not saved to an account.");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.displayName.trim()) {
      setStatus("Add both your full name and display name.");
      return;
    }
    setSaved(form);
    setStatus("Saved in this preview. Nothing was written to an account.");
  }

  return (
    <div className="mm-demo-profile">
      <aside className="mm-demo-account-nav">
        <strong>Your account</strong>
        <Link href="?screen=profile" aria-current="page"><UserCircleIcon size={16} aria-hidden="true" /> Profile</Link>
        <Link href="?screen=orders"><ShoppingBagIcon size={16} aria-hidden="true" /> Purchases</Link>
        <Link href="?screen=my-products"><PackageIcon size={16} aria-hidden="true" /> Seller tools</Link>
        <Link href="?screen=settings"><GearSixIcon size={16} aria-hidden="true" /> Settings</Link>
      </aside>
      <section>
        <div className="mm-demo-hero"><div><h1>My profile</h1><p>Manage how you appear on The Middleman.</p></div></div>
        <div className="mm-demo-panel mm-demo-profile-head">
          <div className="mm-demo-profile-photo">{photo ? (
            // Blob URLs from this device cannot use next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" />
          ) : "BS"}</div>
          <div>
            <h2>{form.displayName || "Buks Samuel"}</h2>
            <p>@bukssamuel</p>
            <PhotoPicker id="preview-profile-photo" label="Change photo" onFile={(file) => { void onPhoto(file); }}>
              <span className="mm-demo-outline"><ImageIcon size={14} aria-hidden="true" /> Change photo</span>
            </PhotoPicker>
            <small>JPG, PNG, WebP, or a photo from your camera roll. Up to 5 MB.</small>
            {photoError && <small role="alert">{photoError}</small>}
          </div>
        </div>
        <form className="mm-demo-panel mm-demo-form" onSubmit={onSubmit}>
          <h2>Personal information</h2>
          <label>Full name<input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
          <label>Display name<input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></label>
          <label>Email address<input defaultValue="samuel@example.com" readOnly /><small><CheckCircleIcon size={12} aria-hidden="true" /> Verified</small></label>
          <label>WhatsApp number<input value={form.phone} placeholder="Add your WhatsApp number" onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          <label className="wide">Bio<textarea value={form.bio} maxLength={200} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
          <p className="mm-demo-privacy">Your email and phone number are private.</p>
          {status && <p className="mm-demo-preview-alert" role="status">{status}</p>}
          <button className="mm-demo-primary" type="submit">Save changes</button>
          <button type="button" className="mm-demo-text-button" onClick={() => { setForm(saved); setStatus(""); }}>Cancel</button>
        </form>
        <div className="mm-demo-panel mm-demo-row"><span><strong>Seller tools</strong><small>List a product and manage your creator profile.</small></span><Link href="?screen=my-products">Open seller tools <ArrowRightIcon size={12} aria-hidden="true" /></Link></div>
      </section>
    </div>
  );
}

function AdminPreview({ section }: { section: string }) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState("");
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const title = section === "admin" ? "Operations overview" : formatTitle(section);
  const baseRows = section === "admin-sellers"
    ? [["Ada Studio", "Seller application", "15 Oct 2026", "Review"], ["Tobi Builds", "Verified", "14 Oct 2026", "View"]]
    : section === "admin-escrow"
      ? [["MM-1042", "In escrow", "₦8,500", "View order"], ["MM-0987", "Delivered", "₦12,000", "View order"]]
      : section === "admin-communications" || section === "admin-email"
        ? [["Order update", "Email delivered", "Today, 14:22", "Preview"], ["Payment receipt", "Retry needed", "Today, 12:17", "Review"]]
        : [["Invoice & Expense Tracker", "New seller · #P10432", "2h 14m", "Review"], ["Ada Studio", "Seller application · #S2781", "5h 36m", "Review"], ["Business Landing Page Kit", "Delivery review · #D6623", "1d 4h", "Review"], ["Social Media Brand Pack", "Updated details · #P10411", "1d 22h", "Review"]];
  const extraRows = [["Storefront Starter Kit", "New seller · #P10490", "2d 1h", "Review"], ["Student Planner", "Updated price · #P10310", "3d 4h", "Review"]];
  const rows = queueOpen ? [...baseRows, ...extraRows] : baseRows;
  const visible = rows.filter((row) => row.join(" ").toLowerCase().includes(filter.toLowerCase()));
  const activity = ["Product submitted · Invoice & Expense Tracker", "Delivery review received · Business Landing Page Kit", "Seller application · Ada Studio", "Notification failed · Sample event"];
  const older = ["Payout recorded · MM-0761", "Email resent · Payment receipt", "Product approved · Restaurant Menu Template"];
  const selectedRow = rows.find((row) => row.join(":") === selected);

  return (
    <div className="mm-demo-admin">
      <aside className="mm-demo-admin-nav">
        <strong>ADMIN WORKSPACE</strong>
        {[["admin", "Overview"], ["admin-products", "Products"], ["admin-sellers", "Sellers"], ["admin-delivery", "Delivery reviews"], ["admin-escrow", "Trust & payouts"], ["admin-communications", "Communications"], ["admin-email", "Email previews"]].map(([id, label]) => (
          <Link key={id} className={id === section ? "active" : ""} href={`?screen=${id}`}>{label}</Link>
        ))}
      </aside>
      <section>
        <div className="mm-demo-hero"><div><h1>{title}</h1><p>15 October 2026 · Illustrative preview data</p></div></div>
        {section === "admin" && (
          <div className="mm-demo-metrics">
            {[["Products awaiting review", "8"], ["Seller applications", "3"], ["Delivery reviews", "4"], ["Notification failures", "2"]].map(([label, value]) => (
              <div className="mm-demo-panel" key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        )}
        <SectionTitle title={section === "admin" ? "Priority queue" : title} expanded={queueOpen} onToggle={() => setQueueOpen((open) => !open)} />
        <div className="mm-demo-panel mm-demo-table">
          <div className="mm-demo-table-head"><span>Type</span><span>Item</span><span>Waiting time</span><span>Action</span></div>
          {visible.length === 0 ? <p className="mm-demo-table-search" role="status">Nothing in this preview matches that filter.</p> : visible.map((row) => {
            const id = row.join(":");
            const done = reviewed.includes(id);
            return (
              <div className="mm-demo-table-row" key={id}>
                <span><Chip tone={row[0].includes("Seller") || row[0] === "Ada Studio" ? "blue" : "orange"}>{row[0]}</Chip></span>
                <strong>{row[1]}</strong>
                <span>{row[2]}</span>
                <button type="button" aria-pressed={selected === id} onClick={() => setSelected(selected === id ? "" : id)}>{done ? "Reviewed" : row[3]}</button>
              </div>
            );
          })}
          <label className="mm-demo-table-search">Filter this preview <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search review queue" /></label>
        </div>
        {selectedRow && (
          <div className="mm-demo-panel mm-demo-review">
            <h2>{selectedRow[1]}</h2>
            <p>Sample review for {selectedRow[0]}. Marking it reviewed only changes this preview.</p>
            <button type="button" className="mm-demo-primary" disabled={reviewed.includes(selected)} onClick={() => setReviewed((items) => items.includes(selected) ? items : [...items, selected])}>
              {reviewed.includes(selected) ? "Reviewed" : "Mark reviewed"}
            </button>
          </div>
        )}
        {section === "admin" && (
          <>
            <SectionTitle title="Recent activity" expanded={activityOpen} onToggle={() => setActivityOpen((open) => !open)} />
            <div className="mm-demo-panel mm-demo-activity">
              {(activityOpen ? [...activity, ...older] : activity).map((item) => <p key={item}>{item}<small>Today · sample data</small></p>)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

const productTabs = [
  { id: "overview", label: "Overview", body: "Keep track of income, expenses and outstanding invoices with this easy to use spreadsheet. Customize it with the creator to fit your workflow." },
  { id: "included", label: "What’s included", body: "Editable spreadsheet, a setup guide, and short instructions for income, expenses, and outstanding invoices." },
  { id: "requirements", label: "Requirements", body: "A spreadsheet app that opens .xlsx files. Custom names and a logo are sent to the creator after purchase, when checkout is live." },
  { id: "creator", label: "Creator", body: "Ada Studio builds digital templates and tools. Verified creators are marked on the listing." },
];

function ProductPreview() {
  const [tab, setTab] = useState(productTabs[0].id);
  const [step, setStep] = useState<"buy" | "review" | "done">("buy");
  const current = productTabs.find((item) => item.id === tab) ?? productTabs[0];
  return (
    <>
      <div className="mm-demo-breadcrumb">Marketplace / Web &amp; Software / Invoice &amp; Expense Tracker</div>
      <div className="mm-demo-detail-grid">
        <section>
          <div className="mm-demo-product-visual"><div className="mm-demo-cover-sheet"><span>Invoice &amp; Expense Tracker</span><i /><i /><i /><b>Income · Expenses · Overview</b></div></div>
          <div className="mm-demo-tabs" role="tablist">
            {productTabs.map((item) => (
              <button key={item.id} className={tab === item.id ? "active" : ""} type="button" role="tab" id={`product-tab-${item.id}`} aria-selected={tab === item.id} aria-controls={`product-panel-${item.id}`} onClick={() => setTab(item.id)}>{item.label}</button>
            ))}
          </div>
          <div className="mm-demo-panel" role="tabpanel" id={`product-panel-${current.id}`} aria-labelledby={`product-tab-${current.id}`}>
            <h2>{current.label}</h2>
            <p>{current.body}</p>
          </div>
        </section>
        <aside className="mm-demo-panel mm-demo-buy">
          <h1>Invoice &amp; Expense Tracker</h1>
          <strong className="mm-demo-big-price">₦8,500</strong>
          <p>A simple, editable spreadsheet to manage invoices, track expenses and see your business performance.</p>
          <hr />
          <h2>Ada Studio <Verified /></h2>
          <p>Digital templates &amp; tools</p>
          {step === "buy" && <button className="mm-demo-primary" type="button" onClick={() => setStep("review")}>Continue to checkout</button>}
          {step === "review" && (
            <div className="mm-demo-review">
              <p>Product <b>₦8,500</b></p>
              <p>Pay in Naira through Paystack once live checkout is on. This preview does not charge anyone.</p>
              <button className="mm-demo-primary" type="button" onClick={() => setStep("done")}>Confirm sample checkout</button>
              <button className="mm-demo-text-button" type="button" onClick={() => setStep("buy")}>Back</button>
            </div>
          )}
          {step === "done" && <p role="status" className="mm-demo-preview-alert">Sample checkout complete. No payment was sent and no order was created.</p>}
        </aside>
      </div>
    </>
  );
}

function SellerPreview({ create = false }: { create?: boolean }) {
  const [rows, setRows] = useState<ProductRow[]>([
    { id: "invoice", title: "Invoice Tracker", category: "Spreadsheets", price: "₦8,500", status: "Active" },
    { id: "landing", title: "Landing Page Kit", category: "Website templates", price: "₦25,000", status: "Pending review" },
    { id: "brand", title: "Social Brand Pack", category: "Design assets", price: "₦12,000", status: "Drafts" },
  ]);
  const [status, setStatus] = useState<ProductRow["status"]>("Active");
  const [editing, setEditing] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftPrice, setDraftPrice] = useState("");
  const [step, setStep] = useState(1);
  const [created, setCreated] = useState(false);

  if (create) {
    return (
      <>
        <div className="mm-demo-hero"><div><h1>Create a product</h1><p>Listings are reviewed before publication.</p></div></div>
        <div className="mm-demo-stepper">
          {["Details", "Pricing", "More", "Review"].map((label, index) => (
            <button className={step === index + 1 ? "active" : ""} type="button" aria-current={step === index + 1 ? "step" : undefined} onClick={() => setStep(index + 1)} key={label}><b>{index + 1}</b>{label}</button>
          ))}
        </div>
        <div className="mm-demo-detail-grid">
          <form className="mm-demo-panel mm-demo-form" onSubmit={(event) => { event.preventDefault(); if (step === 4) setCreated(true); else setStep(Math.min(4, step + 1)); }}>
            <h2>{["Product details", "Pricing & package", "Additional information", "Review listing"][step - 1]}</h2>
            <p>Tell buyers what your product is and what’s included.</p>
            {step === 1 ? (
              <>
                <label>Title<input defaultValue="Modern React Admin Dashboard Template" maxLength={100} /></label>
                <label>Category<select defaultValue="Development"><option>Development</option><option>Design</option><option>Marketing</option><option>Writing</option></select></label>
                <label className="wide">Description<textarea defaultValue="A clean and modern React admin dashboard template with reusable components, responsive design and easy customization." /></label>
              </>
            ) : (
              <>
                <label>{step === 2 ? "Price in Naira" : step === 3 ? "What buyers receive" : "Listing summary"}<input placeholder={step === 2 ? "₦15,000" : "Describe the package"} /></label>
                <label className="wide">Customization options<textarea placeholder="Explain what the creator can customize" /></label>
              </>
            )}
            {created && <p className="mm-demo-preview-alert" role="status">Preview draft saved on this page. It was not submitted for review.</p>}
            <button className="mm-demo-primary" type="submit">{step === 4 ? "Save preview draft" : "Continue"}</button>
          </form>
          <aside className="mm-demo-panel">
            <h2>Listing preview</h2>
            <div className="mm-demo-product-visual compact"><div className="mm-demo-cover-sheet"><span>Admin Dashboard</span><i /><i /><i /></div></div>
            <strong>Modern React Admin Dashboard Template</strong>
            <p className="mm-demo-price">₦15,000</p>
            <small>Sample preview · not submitted</small>
          </aside>
        </div>
      </>
    );
  }

  const visible = rows.filter((item) => item.status === status);
  return (
    <>
      <div className="mm-demo-hero">
        <div><h1>My products</h1><p>Create and manage your digital products. Keep your listings up to date to reach more buyers.</p></div>
        <Link className="mm-demo-primary" href="?screen=create-product">Add product</Link>
      </div>
      <div className="mm-demo-tabs" role="tablist">
        {(["Active", "Pending review", "Drafts"] as const).map((item) => (
          <button type="button" role="tab" aria-selected={status === item} className={status === item ? "active" : ""} onClick={() => { setStatus(item); setEditing(null); }} key={item}>{item}</button>
        ))}
      </div>
      <div className="mm-demo-panel mm-demo-table products">
        <div className="mm-demo-table-head"><span>Product</span><span>Category</span><span>Price</span><span>Status</span><span>Action</span></div>
        {visible.length === 0 ? <p className="mm-demo-table-search" role="status">No sample products in {status.toLowerCase()}.</p> : visible.map((item) => (
          <div className="mm-demo-table-row" key={item.id}>
            {editing === item.id ? (
              <>
                <input aria-label={`Title for ${item.title}`} value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} />
                <span>{item.category}</span>
                <input aria-label={`Price for ${item.title}`} value={draftPrice} onChange={(event) => setDraftPrice(event.target.value)} />
                <Chip tone={item.status === "Active" ? "green" : "orange"}>{item.status}</Chip>
                <button type="button" onClick={() => {
                  if (!draftTitle.trim() || !draftPrice.trim()) return;
                  setRows((current) => current.map((row) => row.id === item.id ? { ...row, title: draftTitle.trim(), price: draftPrice.trim() } : row));
                  setEditing(null);
                }}>Save</button>
              </>
            ) : (
              <>
                <strong>{item.title}</strong>
                <span>{item.category}</span>
                <b>{item.price}</b>
                <Chip tone={item.status === "Active" ? "green" : "orange"}>{item.status}</Chip>
                <button type="button" onClick={() => { setEditing(item.id); setDraftTitle(item.title); setDraftPrice(item.price); }}><PencilSimpleIcon size={12} aria-hidden="true" /> Edit</button>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function BrowsePreview() {
  const [category, setCategory] = useState("All products");
  const items = filterListings(listings, { category });
  return (
    <>
      <div className="mm-demo-hero"><div><h1>Browse categories</h1><p>Choose a category to narrow the sample catalogue.</p></div></div>
      <div className="mm-demo-pills" aria-label="Browse categories">
        {CATEGORIES.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{categoryLabel(item)}</button>)}
      </div>
      <div className="mm-demo-product-grid">
        {items.map((item) => <Link className="mm-demo-product" href="?screen=product-detail" key={item[0]}><strong>{item[0]}</strong><span>{item[1]}</span><strong className="mm-demo-price">{item[2]}</strong></Link>)}
      </div>
    </>
  );
}

function AnalyticsPreview() {
  const [days, setDays] = useState(30);
  const scale = days === 7 ? 0.3 : days === 90 ? 2.4 : 1;
  const rows = [
    ["Invoice Tracker", Math.round(420 * scale), Math.round(38 * scale)],
    ["Landing Page Kit", Math.round(260 * scale), Math.round(11 * scale)],
    ["Social Brand Pack", Math.round(180 * scale), Math.round(9 * scale)],
  ];
  return (
    <>
      <div className="mm-demo-hero"><div><h1>Analytics</h1><p>Sample figures for this preview. Changing the period recalculates them.</p></div></div>
      <div className="mm-demo-filter-pills" aria-label="Analytics period">
        {[7, 30, 90].map((period) => <button type="button" key={period} className={days === period ? "active" : ""} aria-pressed={days === period} onClick={() => setDays(period)}>Last {period} days</button>)}
      </div>
      <div className="mm-demo-panel mm-demo-table">
        <div className="mm-demo-table-head"><span>Product</span><span>Views</span><span>Sales</span><span></span></div>
        {rows.map((row) => <div className="mm-demo-table-row" key={String(row[0])}><strong>{row[0]}</strong><span>{row[1]} views</span><span>{row[2]} sales</span><ChartBarIcon size={16} aria-hidden="true" /></div>)}
      </div>
    </>
  );
}

function PaymentsPreview() {
  const rows = [["15 Oct 2026", "Invoice Tracker", "Sale", "8500"], ["10 Oct 2026", "Landing Page Kit", "Sale", "25000"]];
  return (
    <>
      <div className="mm-demo-hero">
        <div><h1>Payments</h1><p>Sample payment rows. Export downloads a CSV of this preview only.</p></div>
        <button type="button" className="mm-demo-primary" onClick={() => downloadCsv("middleman-preview-payments.csv", [["Date", "Product", "Role", "Amount (NGN)"], ...rows])}><DownloadSimpleIcon size={14} aria-hidden="true" /> Export CSV</button>
      </div>
      <div className="mm-demo-panel mm-demo-table">
        <div className="mm-demo-table-head"><span>Date</span><span>Product</span><span>Role</span><span>Amount</span></div>
        {rows.map((row) => <div className="mm-demo-table-row" key={row[0] + row[1]}><span>{row[0]}</span><strong>{row[1]}</strong><span>{row[2]}</span><b>₦{Number(row[3]).toLocaleString("en-NG")}</b></div>)}
      </div>
    </>
  );
}

function DisputesPreview() {
  const [items, setItems] = useState([{ id: "MM-1042", reason: "File would not open" }]);
  const [order, setOrder] = useState("MM-0987");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  return (
    <>
      <div className="mm-demo-hero"><div><h1>Disputes</h1><p>Submit a sample dispute. It stays on this page.</p></div></div>
      <form className="mm-demo-panel mm-demo-form" onSubmit={(event) => {
        event.preventDefault();
        if (reason.trim().length < 8) { setError("Describe the issue in at least a short sentence."); return; }
        setItems((current) => [{ id: order, reason: reason.trim() }, ...current]);
        setReason("");
        setError("");
      }}>
        <label>Order<select value={order} onChange={(event) => setOrder(event.target.value)}><option>MM-0987</option><option>MM-1042</option><option>MM-0761</option></select></label>
        <label className="wide">What happened<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="The delivered file does not match the listing." /></label>
        {error && <p className="mm-demo-preview-alert" role="alert">{error}</p>}
        <button className="mm-demo-primary" type="submit">Submit sample dispute</button>
      </form>
      <div className="mm-demo-panel mm-demo-activity">
        {items.map((item) => <p key={item.id + item.reason}><span>#{item.id} · {item.reason}</span><small>Sample</small></p>)}
      </div>
    </>
  );
}

function NotificationsPreview() {
  const [items, setItems] = useState([
    { id: "1", title: "Order in progress", body: "Ada Studio started Invoice & Expense Tracker.", read: false },
    { id: "2", title: "Delivery ready", body: "Business Landing Page Kit is ready to download.", read: false },
    { id: "3", title: "Account", body: "Your preview profile was saved on this device only.", read: true },
  ]);
  const unread = items.filter((item) => !item.read).length;
  return (
    <>
      <div className="mm-demo-hero">
        <div><h1>Notifications</h1><p>{unread === 0 ? "You’re caught up in this preview." : `${unread} unread sample notifications.`}</p></div>
        <button type="button" className="mm-demo-outline" disabled={unread === 0} onClick={() => setItems((current) => current.map((item) => ({ ...item, read: true })))}><BellIcon size={14} aria-hidden="true" /> Mark all read</button>
      </div>
      <div className="mm-demo-settings-list">
        {items.map((item) => (
          <button type="button" className="mm-demo-panel mm-demo-row" key={item.id} onClick={() => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry))} aria-pressed={item.read}>
            <span><strong>{item.title}</strong><small>{item.body}</small></span>
            <Chip tone={item.read ? "neutral" : "orange"}>{item.read ? "Read" : "Unread"}</Chip>
          </button>
        ))}
      </div>
    </>
  );
}

function SettingsPreview() {
  const options = [
    ["overview", "Account overview", "Your information and recent activity"],
    ["privacy", "Privacy and visibility", "Choose what appears on your profile"],
    ["email", "Email updates", "Order and account notifications"],
    ["security", "Security reminders", "Password and sign-in protection"],
  ] as const;
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ overview: true, privacy: false, email: true, security: true });
  return (
    <>
      <div className="mm-demo-hero"><div><h1>Settings</h1><p>Each switch is independent. They only change this preview.</p></div></div>
      <div className="mm-demo-settings-list">
        {options.map(([id, label, description]) => (
          <section className="mm-demo-panel mm-demo-row" key={id}>
            <div><strong>{label}</strong><small>{description}</small></div>
            <button type="button" className={enabled[id] ? "mm-demo-toggle on" : "mm-demo-toggle"} aria-pressed={enabled[id]} onClick={() => setEnabled((current) => ({ ...current, [id]: !current[id] }))}>{enabled[id] ? "On" : "Off"}</button>
          </section>
        ))}
      </div>
    </>
  );
}

function SecurityPreview() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [sessions, setSessions] = useState([{ id: "lagos", label: "Lagos · Chrome · This preview" }, { id: "abuja", label: "Abuja · Safari · Yesterday" }]);
  const fieldId = useId();
  return (
    <>
      <div className="mm-demo-hero"><div><h1>Security</h1><p>Sample password check and session list. Nothing is saved.</p></div></div>
      <form className="mm-demo-panel mm-demo-form" onSubmit={(event) => {
        event.preventDefault();
        if (password.length < 12) { setMessage("Use at least 12 characters."); return; }
        if (password !== confirm) { setMessage("Those passwords don’t match."); return; }
        setPassword("");
        setConfirm("");
        setMessage("Password check passed in this preview. It was not saved.");
      }}>
        <label className="wide" htmlFor={fieldId}>New password
          <span className="mm-demo-password">
            <input id={fieldId} type={show ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
            <button type="button" aria-pressed={show} aria-label={show ? "Hide password" : "Show password"} onMouseDown={(event) => event.preventDefault()} onClick={() => setShow((value) => !value)}>{show ? <EyeSlashIcon size={16} aria-hidden="true" /> : <EyeIcon size={16} aria-hidden="true" />}</button>
          </span>
        </label>
        <label className="wide">Confirm password<input type={show ? "text" : "password"} value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" /></label>
        {message && <p className="mm-demo-preview-alert" role="status">{message}</p>}
        <button className="mm-demo-primary" type="submit">Check password</button>
      </form>
      <div className="mm-demo-settings-list">
        {sessions.map((session) => (
          <section className="mm-demo-panel mm-demo-row" key={session.id}>
            <div><strong>{session.label}</strong></div>
            <button type="button" className="mm-demo-outline" onClick={() => setSessions((current) => current.filter((item) => item.id !== session.id))}>Revoke</button>
          </section>
        ))}
        {sessions.length === 0 && <p role="status">All sample sessions were revoked in this preview.</p>}
      </div>
    </>
  );
}

export default function DesignPreviewScreen({ initialScreen = "marketplace" }: { initialScreen?: string }) {
  const router = useRouter();
  const screen = DESIGN_PREVIEW_SCREENS.some((item) => item.id === initialScreen) ? initialScreen : "marketplace";
  const current = DESIGN_PREVIEW_SCREENS.find((item) => item.id === screen)!;
  const groups = Array.from(new Set(DESIGN_PREVIEW_SCREENS.map((item) => item.group)));
  return (
    <div className="mm-design mm-design-preview">
      <SiteHeader compact />
      <main className="mm-demo-main">
        <div className="mm-demo-heading">
          <div>
            <p>DESIGN PREVIEW · SAMPLE CONTENT</p>
            <h1>{current.label}</h1>
            <span>Controls on this page work with sample data only. Nothing is saved to an account.</span>
          </div>
          <Link href="/marketplace">Return to marketplace</Link>
        </div>
        <label className="mm-demo-screen-select">
          <span>Preview screen</span>
          <select aria-label="Preview screen" value={screen} onChange={(event) => router.push(`?screen=${event.target.value}`)}>
            {DESIGN_PREVIEW_SCREENS.map((item) => <option key={item.id} value={item.id}>{item.group} · {item.label}</option>)}
          </select>
        </label>
        <div className="mm-demo-layout">
          <nav className="mm-demo-screen-nav" aria-label="Choose a design preview">
            {groups.map((group) => (
              <div key={group}>
                <b>{group}</b>
                {DESIGN_PREVIEW_SCREENS.filter((item) => item.group === group).map((item) => (
                  <Link key={item.id} aria-current={item.id === screen ? "page" : undefined} href={`?screen=${item.id}`}>{item.label}</Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="mm-demo-screen">
            {screen === "marketplace" ? <MarketplacePreview />
              : screen === "orders" ? <OrdersPreview />
                : screen === "order-details" ? <OrdersPreview detail />
                  : screen === "messages" ? <MessagesPreview />
                    : screen === "profile" ? <ProfilePreview />
                      : screen === "browse" ? <BrowsePreview />
                        : screen === "product-detail" ? <ProductPreview />
                          : screen === "my-products" ? <SellerPreview />
                            : screen === "create-product" ? <SellerPreview create />
                              : screen === "analytics" ? <AnalyticsPreview />
                                : screen === "payments" ? <PaymentsPreview />
                                  : screen === "disputes" ? <DisputesPreview />
                                    : screen === "notifications" ? <NotificationsPreview />
                                      : screen === "settings" ? <SettingsPreview />
                                        : screen === "security" ? <SecurityPreview />
                                          : screen === "admin" || screen.startsWith("admin-") ? <AdminPreview section={screen} />
                                            : <SettingsPreview />}
          </div>
        </div>
      </main>
    </div>
  );
}
