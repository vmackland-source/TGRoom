// pages/reservations.js
import { useMemo, useState } from "react";

const PRICE_PER_PERSON = 80;          // base price
const MEMBER_DISCOUNT_TOTAL = 10;     // $10 off the reservation total (if member)
const ALLOWED_DAYS = [5, 6];          // Fri=5, Sat=6

// --- Policy text (shown and sent in metadata) ---
const POLICY_TEXT =
  "Cancellation & Refund Policy: All reservation cancellations are eligible for a 50% refund if made at least 24 hours prior to the scheduled reservation time. No full refunds will be issued under any circumstances. Cancellations made less than 24 hours before the reservation will not be refunded.";

const DINING_NOTE =
  "Dinner window is 1.5–2 hours. Please arrive on time. Reservation times available Friday & Saturday, 5:00 PM–10:00 PM. Government-issued ID will be checked on arrival for all guests.";

// build 30-min slots from 5:00 PM to 10:00 PM inclusive
const TIME_SLOTS = (() => {
  const slots = [];
  const start = 17 * 60; // 17:00
  const end = 22 * 60;   // 22:00
  for (let m = start; m <= end; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const label = to12h(h, min);
    slots.push({ value: `${pad(h)}:${pad(min)}`, label });
  }
  return slots;
})();

function pad(n) { return n.toString().padStart(2, "0"); }
function to12h(h24, m) {
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
function isAllowedDay(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  return ALLOWED_DAYS.includes(d.getDay());
}
function is24hOrMoreAway(dateStr, timeStr) {
  if (!dateStr || !timeStr) return false;
  const now = new Date();
  const dt = new Date(`${dateStr}T${timeStr}:00`);
  return dt.getTime() - now.getTime() >= 24 * 60 * 60 * 1000;
}
function normPhone(p) {
  const digits = p.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+1${digits}`;
  return digits;
}
function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function calcAge(dob) {
  if (!dob) return 0;
  const d = new Date(dob + "T00:00:00");
  const today = new Date();
  let a = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) a--;
  return a;
}

export default function ReservationsPage() {
  // Booker contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // booking
  const [partySize, setPartySize] = useState(2); // max 4
  const [date, setDate] = useState(""); // yyyy-mm-dd (Fri/Sat only)
  const [time, setTime] = useState(""); // "HH:MM"
  const [isMember, setIsMember] = useState(false);

  // guest details (each guest must be 21+)
  const [guests, setGuests] = useState([
    { fullName: "", dob: "" },
    { fullName: "", dob: "" },
    { fullName: "", dob: "" },
    { fullName: "", dob: "" },
  ]);

  // cancel form
  const [cancelCode, setCancelCode] = useState("");
  const [cancelEmail, setCancelEmail] = useState("");
  const [cancelMsg, setCancelMsg] = useState("");

  // clamp party size 1..4
  const actualParty = Math.min(Math.max(partySize, 1), 4);

  const subtotal = useMemo(() => actualParty * PRICE_PER_PERSON, [actualParty]);
  const discount = isMember ? MEMBER_DISCOUNT_TOTAL : 0;
  const total = Math.max(0, subtotal - discount);

  // Validate guest list (for the chosen party size)
  const guestsSlice = guests.slice(0, actualParty);
  const allGuestsValid = guestsSlice.every(g => g.fullName && g.dob && calcAge(g.dob) >= 21);

  const formOK =
    name &&
    validEmail(email) &&
    phone &&
    actualParty > 0 &&
    date &&
    time &&
    isAllowedDay(date) &&
    allGuestsValid;

  async function pay() {
    if (!formOK) return;

    const metadata = {
      type: "reservation",
      name,
      email,
      phone: normPhone(phone),
      partySize: String(actualParty),
      date,
      time,
      isMember: isMember ? "true" : "false",
      guests: JSON.stringify(guestsSlice.map(g => ({
        fullName: g.fullName,
        dob: g.dob,
        age: calcAge(g.dob)
      }))),
      lineItems: JSON.stringify([{ label: "Reservation", qty: actualParty, price: PRICE_PER_PERSON }]),
      discountApplied: isMember ? `$${MEMBER_DISCOUNT_TOTAL}` : "$0",
      policy: POLICY_TEXT,
      notes: DINING_NOTE,
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(total * 100),
          description: `Cafe Reservation (${actualParty} guests)`,
          successPath: "/reservations?status=paid",
          cancelPath: "/reservations",
          metadata,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Payment couldn't start. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Payment error. Please try again.");
    }
  }

  async function requestCancel() {
    if (!cancelCode || !validEmail(cancelEmail)) {
      setCancelMsg("Enter your booking code and a valid email.");
      return;
    }
    try {
      const res = await fetch("/api/reservations/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cancelCode, email: cancelEmail }),
      });
      if (res.ok) {
        const out = await res.json().catch(() => ({}));
        setCancelMsg(out?.message || "Cancellation request received. We’ll email you shortly.");
      } else {
        const t = await res.text();
        setCancelMsg(t || "Could not process cancellation. Try again or contact support.");
      }
    } catch (e) {
      console.error(e);
      setCancelMsg("Network error. Try again later.");
    }
  }

  // --- styles ---
  const sectionCard = {
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
    background: "linear-gradient(180deg, rgba(255,255,255,.02), transparent), var(--panel)",
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
  const slotBtn = (active) => ({
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(216,192,122,.25)",
    background: active ? "rgba(216,192,122,.18)" : "rgba(0,0,0,.2)",
    color: "var(--text)",
    cursor: "pointer",
    minWidth: 90,
    textAlign: "center",
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
        <h2 className="font-orange gold-emboss" style={{ fontSize: 32 }}>Cafe Reservations</h2>
      </div>

      {/* Policy & notes */}
      <div style={{ ...sectionCard }}>
        <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          <strong style={{ color: "var(--gold-soft)" }}>Cancellation & Refund Policy:</strong> {POLICY_TEXT}
          <br /><br />
          {DINING_NOTE}
          <br /><br />
          Private parties (more than 4 or special events), please contact us directly:{" "}
          <a href="mailto:DoItAllEnt610@gmail.com" style={{ color: "var(--gold-soft)" }}>DoItAllEnt610@gmail.com</a>
        </div>
      </div>

      <style>{`@media (min-width: 992px){ .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:18px; } }`}</style>
      <div className="grid-2">
        {/* Booking Card */}
        <div style={sectionCard}>
          <h3 className="font-orange gold-emboss" style={{ fontSize: 20 }}>Book your table</h3>

          {/* Contact */}
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <Field label="Full name (booker)" value={name} onChange={setName} inputBase={inputBase} labelStyle={labelStyle} />
            <Field type="email" label="Email (for confirmation)" value={email} onChange={setEmail} inputBase={inputBase} labelStyle={labelStyle} />
            <Field label="Phone (for SMS)" value={phone} onChange={setPhone} placeholder="+1 555 555 5555" inputBase={inputBase} labelStyle={labelStyle} />
          </div>

          {/* Party size (1–4) */}
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Party size (max 4)</label>
            <select
              value={partySize}
              onChange={(e) => setPartySize(Math.min(4, Math.max(1, parseInt(e.target.value || "1", 10))))}
              style={{ ...inputBase, marginTop: 6 }}
            >
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Date (Fri/Sat only) */}
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Date (Friday or Saturday)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ ...inputBase, marginTop: 6 }}
            />
            {!isAllowedDay(date) && date && (
              <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 6 }}>
                Reservations are available Friday & Saturday only.
              </div>
            )}
          </div>

          {/* Time slots (5:00 PM—10:00 PM) */}
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Time (5:00 PM – 10:00 PM)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {TIME_SLOTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setTime(s.value)}
                  style={slotBtn(time === s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Member discount */}
          <label style={{ ...labelStyle, display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <input type="checkbox" checked={isMember} onChange={(e) => setIsMember(e.target.checked)} style={{ accentColor: "var(--gold)" }} />
            I’m a member (−$10 off reservation total)
          </label>

          {/* Guest details (each must be 21+) */}
          <div style={{ marginTop: 16 }}>
            <h4 className="font-orange gold-emboss" style={{ fontSize: 18, margin: 0 }}>Guest details (21+)</h4>
            <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
              Each guest must provide full name and date of birth. IDs are checked on arrival.
            </p>
            <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
              {Array.from({ length: actualParty }).map((_, idx) => (
                <GuestRow
                  key={idx}
                  index={idx + 1}
                  data={guests[idx]}
                  onChange={(g) => {
                    setGuests(prev => {
                      const next = [...prev];
                      next[idx] = g;
                      return next;
                    });
                  }}
                  inputBase={inputBase}
                  labelStyle={labelStyle}
                />
              ))}
            </div>
            {!allGuestsValid && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 6 }}>Please complete guest details; all guests must be 21+.</div>}
          </div>

          {/* Summary & Pay */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", marginTop: 14, paddingTop: 12 }}>
            <Line left="Subtotal" right={`$${subtotal.toFixed(2)}`} />
            <Line left="Member discount" right={`-$${discount.toFixed(2)}`} />
            <Line left={<span style={{ color: "var(--muted)" }}>Total</span>} right={<span style={{ color: "var(--gold-soft)" }}>${total.toFixed(2)}</span>} />
            <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
              You’ll receive an email (and SMS if a phone is provided) with your reservation details.
            </p>
            <button onClick={pay} disabled={!formOK} style={payBtn(formOK)}>
              Pay ${total.toFixed(2)} & Book
            </button>
          </div>
        </div>

        {/* Cancellation Card */}
        <div style={sectionCard}>
          <h3 className="font-orange gold-emboss" style={{ fontSize: 20 }}>Cancel my reservation</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
            {POLICY_TEXT}
          </p>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <Field label="Booking code" value={cancelCode} onChange={setCancelCode} inputBase={inputBase} labelStyle={labelStyle} />
            <Field type="email" label="Email on reservation" value={cancelEmail} onChange={setCancelEmail} inputBase={inputBase} labelStyle={labelStyle} />
            <button type="button" onClick={requestCancel} style={payBtn(true)}>
              Request cancellation
            </button>
            {date && time && (
              <div style={{ fontSize: 12, color: is24hOrMoreAway(date, time) ? "var(--muted)" : "#ffb84d" }}>
                {is24hOrMoreAway(date, time)
                  ? "Your selected slot is ≥24h away (eligible for 50% refund if cancelled)."
                  : "Selected slot is <24h away; per policy, cancellations will not be refunded."}
              </div>
            )}
            {cancelMsg && (
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{cancelMsg}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- tiny helpers kept in this file ---- */
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

function Line({ left, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

function GuestRow({ index, data, onChange, inputBase, labelStyle }) {
  const age = calcAge(data?.dob || "");
  return (
    <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1.2fr .8fr" }}>
      <div>
        <label style={labelStyle}>Guest {index} — Full name</label>
        <input
          type="text"
          value={data?.fullName || ""}
          onChange={(e) => onChange({ ...data, fullName: e.target.value })}
          style={{ ...inputBase, marginTop: 6 }}
        />
      </div>
      <div>
        <label style={labelStyle}>Guest {index} — Date of birth</label>
        <input
          type="date"
          value={data?.dob || ""}
          onChange={(e) => onChange({ ...data, dob: e.target.value })}
          style={{ ...inputBase, marginTop: 6 }}
        />
        <div style={{ fontSize: 11, color: age && age < 21 ? "#ff6b6b" : "var(--muted)", marginTop: 4 }}>
          {age ? `Age: ${age}` : "Age: —"} {age && age < 21 ? "(must be 21+)" : ""}
        </div>
      </div>
    </div>
  );
}
