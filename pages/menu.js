// pages/menu.js
import { useMemo, useState } from "react";

/**
 * After Dark Menu
 * - Items: Chicken Wings, Mozzarella Sticks, Truffle Fries, Pretzel Bites, Dessert of the Day ($10)
 * - Botanical enhancement (+$5) optional on the first four items (not on Dessert)
 * - Collect name + email (phone optional) for receipts
 * - Active Pay button → /api/checkout with { type: "after-dark-order", amount, meta }
 * - *menu subject to change
 */

const PRICE_WINGS = 14;
const PRICE_MOZZ = 11;
const PRICE_TRUFFLE = 12;
const PRICE_PRETZEL = 9;
const PRICE_DESSERT = 10;
const PRICE_ENHANCEMENT = 5;

const INITIAL_ITEMS = [
  { key: "wings",   label: "Chicken Wings",       price: PRICE_WINGS,   qty: 0, enhance: false, canEnhance: true },
  { key: "mozz",    label: "Mozzarella Sticks",   price: PRICE_MOZZ,    qty: 0, enhance: false, canEnhance: true },
  { key: "truffle", label: "Truffle Fries",       price: PRICE_TRUFFLE, qty: 0, enhance: false, canEnhance: true },
  { key: "pretzel", label: "Pretzel Bites",       price: PRICE_PRETZEL, qty: 0, enhance: false, canEnhance: true },
  { key: "dessert", label: "Dessert of the Day",  price: PRICE_DESSERT, qty: 0, enhance: false, canEnhance: false },
];

function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function normPhone(p) {
  if (!p) return "";
  const digits = p.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+1${digits}`;
  return digits;
}

export default function AfterDarkMenuPage() {
  // Contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Menu state
  const [items, setItems] = useState(INITIAL_ITEMS);

  // Totals
  const { lineItems, subtotal, enhancementTotal, total } = useMemo(() => {
    const li = [];
    let sub = 0;
    let enh = 0;
    for (const it of items) {
      if (it.qty > 0) {
        li.push({
          label: it.label,
          qty: it.qty,
          unitPrice: it.price,
          enhancement: it.canEnhance ? (it.enhance ? "Yes" : "No") : "N/A",
        });
        sub += it.qty * it.price;
        if (it.canEnhance && it.enhance) enh += it.qty * PRICE_ENHANCEMENT;
      }
    }
    return { lineItems: li, subtotal: sub, enhancementTotal: enh, total: sub + enh };
  }, [items]);

  const canSubmit = name.trim() && validEmail(email) && total > 0;

  function updateQty(key, qty) {
    setItems(prev => prev.map(it => it.key === key ? { ...it, qty } : it));
  }
  function toggleEnhance(key, checked) {
    setItems(prev => prev.map(it => it.key === key ? { ...it, enhance: checked } : it));
  }

  // ---- PAY: posts to /api/checkout with { type, amount, meta } ----
  async function pay() {
    if (!canSubmit) return;

    const meta = {
      type: "after-dark-order",
      customer: { name, email, phone: normPhone(phone) },
      items: JSON.stringify(lineItems),
      pricing: {
        subtotal,
        enhancementPerItem: PRICE_ENHANCEMENT,
        enhancementTotal,
        total,
      },
      policy: "Menu subject to change.",
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "after-dark-order", amount: total, meta }),
      });
      const out = await res.json();
      if (out?.url) window.location.href = out.url;
      else alert("Could not start payment. Please try again.");
    } catch (e) {
      console.error(e);
      alert("Payment error. Please try again.");
    }
  }

  // Theme-aligned styles
  const sectionCard = {
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
    background:
      "linear-gradient(180deg, rgba(255,255,255,.02), transparent), var(--panel)",
    border: "1px solid rgba(216,192,122,.15)",
    boxShadow: "0 8px 30px rgba(0,0,0,.35)",
  };
  const labelStyle = { fontSize: 12, color: "var(--muted)" };
  const inputBase = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.1)",
    backgroundColor: "rgba(0,0,0,.2)",
    color: "var(--text)",
    outline: "none",
  };
  const qtySelectStyle = { ...inputBase, width: "100%" };
  const payBtn = (ok) => ({
    marginTop: 14,
    width: "100%",
    padding: "12px 16px",
    borderRadius: 14,
    border: "none",
    fontWeight: 600,
    background: ok ? "var(--gold)" : "rgba(0,0,0,.3)",
    color: ok ? "#000" : "var(--muted)",
    cursor: ok ? "pointer" : "not-allowed",
  });

  return (
    <section>
      {/* Top-left welcome text */}
      <div className="font-orange" style={{ color: "var(--gold)", fontSize: 14, marginBottom: 12 }}>
        WELCOME TO THE GREEN ROOM
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 20, height: 20, borderRadius: 999, background: "var(--gold)" }} />
        <h2 className="font-orange gold-emboss" style={{ fontSize: 32 }}>After Dark Menu</h2>
      </div>

      {/* Contact */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Your Info</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <Field label="Full name" value={name} onChange={setName} inputBase={inputBase} labelStyle={labelStyle} />
          <Field type="email" label="Email (for receipt)" value={email} onChange={setEmail} inputBase={inputBase} labelStyle={labelStyle} />
          <Field label="Phone (for SMS receipt)" value={phone} onChange={setPhone} placeholder="+1 555 555 5555" inputBase={inputBase} labelStyle={labelStyle} />
        </div>
      </div>

      {/* Menu grid */}
      <style>{`@media (min-width: 992px){ .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:18px; } }`}</style>
      <div className="grid-2">
        {/* Savory */}
        <div style={sectionCard}>
          <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Savory</h3>
          <ItemRow item={items[0]} onQty={(q)=>updateQty("wings", q)}   onEnhance={(c)=>toggleEnhance("wings", c)}   qtySelectStyle={qtySelectStyle} labelStyle={labelStyle} />
          <ItemRow item={items[1]} onQty={(q)=>updateQty("mozz", q)}    onEnhance={(c)=>toggleEnhance("mozz", c)}    qtySelectStyle={qtySelectStyle} labelStyle={labelStyle} />
          <ItemRow item={items[2]} onQty={(q)=>updateQty("truffle", q)} onEnhance={(c)=>toggleEnhance("truffle", c)} qtySelectStyle={qtySelectStyle} labelStyle={labelStyle} />
          <ItemRow item={items[3]} onQty={(q)=>updateQty("pretzel", q)} onEnhance={(c)=>toggleEnhance("pretzel", c)} qtySelectStyle={qtySelectStyle} labelStyle={labelStyle} />
        </div>

        {/* Sweet */}
        <div style={sectionCard}>
          <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Sweet</h3>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="font-orange" style={{ fontSize: 18 }}>{INITIAL_ITEMS[4].label}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>No enhancement available</div>
                </div>
                <div style={{ color: "var(--gold-soft)" }}>${PRICE_DESSERT.toFixed(2)}</div>
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={labelStyle}>Quantity</label>
                <select
                  value={items[4].qty}
                  onChange={(e)=>updateQty("dessert", parseInt(e.target.value || "0", 10))}
                  style={qtySelectStyle}
                >
                  {Array.from({ length: 11 }).map((_, i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Note */}
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 16 }}>
            *menu subject to change
          </p>
        </div>
      </div>

      {/* Summary & Pay */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Summary</h3>
        <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
          <SummaryLine left="Subtotal" right={`$${subtotal.toFixed(2)}`} />
          <SummaryLine left="Botanical enhancement" right={`$${enhancementTotal.toFixed(2)}`} />
          <SummaryLine
            left={<span style={{ color: "var(--muted)" }}>Total</span>}
            right={<span style={{ color: "var(--gold-soft)" }}>${total.toFixed(2)}</span>}
          />
        </div>
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
          You’ll receive an email (and SMS if provided) confirming your order details.
        </p>
        <button onClick={pay} disabled={!canSubmit} style={payBtn(!!canSubmit)}>
          Pay ${total.toFixed(2)} & Place Order
        </button>
      </div>
    </section>
  );
}

/* --------- tiny helpers in this file --------- */
function Field({ label, value, onChange, type = "text", placeholder, inputBase, labelStyle }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputBase, marginTop: 6 }}
      />
    </div>
  );
}

function ItemRow({ item, onQty, onEnhance, qtySelectStyle, labelStyle }) {
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 12, marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="font-orange" style={{ fontSize: 18 }}>{item.label}</div>
          {item.canEnhance ? (
            <label style={{ ...labelStyle, display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <input
                type="checkbox"
                checked={!!item.enhance}
                onChange={(e)=>onEnhance(e.target.checked)}
                style={{ accentColor: "var(--gold)" }}
              />
              Botanical enhancement (+${PRICE_ENHANCEMENT})
            </label>
          ) : (
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>No enhancement available</div>
          )}
        </div>
        <div style={{ color: "var(--gold-soft)" }}>${item.price.toFixed(2)}</div>
      </div>
      <div style={{ marginTop: 8 }}>
        <label style={labelStyle}>Quantity</label>
        <select
          value={item.qty}
          onChange={(e)=>onQty(parseInt(e.target.value || "0", 10))}
          style={qtySelectStyle}
        >
          {Array.from({ length: 11 }).map((_, i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function SummaryLine({ left, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}
