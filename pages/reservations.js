// pages/reservations.js
import { useEffect, useMemo, useState } from "react";

/**
 * Cafe Reservations
 * - Open Friday & Saturday only
 * - Time slots: 5 PM through 10 PM
 * - 1.5–2 hours dining time
 * - $80 per person; Members get $10 off the total reservation
 * - Max 4 per party
 * - 21+ only; names & DOBs collected; IDs checked on arrival
 * - Cancellation & Refund Policy:
 *   50% refund if cancelled at least 24 hours before reservation time.
 *   No full refunds. No refund within 24 hours.
 */

const PRICE_PER_PERSON = 80;
const MEMBER_DISCOUNT = 10;
const MAX_PARTY = 4;

// Helpers
function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function normPhone(p) {
  const digits = (p || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+1${digits}`;
  return digits;
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
function isFriOrSat(yyyyMmDd) {
  if (!yyyyMmDd) return false;
  const d = new Date(yyyyMmDd + "T00:00:00");
  const day = d.getDay(); // 0=Sun ... 5=Fri, 6=Sat
  return day === 5 || day === 6;
}

export default function ReservationsPage() {
  // Contact + membership
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [isMember, setIsMember] = useState(false);

  // Reservation details
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);

  // Guests array (name + dob per attendee)
  const [guests, setGuests] = useState(
    Array.from({ length: MAX_PARTY }, () => ({ fullName: "", dob: "" }))
  );

  // Keep only needed guest slots (1..partySize)
  useEffect(() => {
    setGuests((prev) =>
      prev.map((g, i) => (i < partySize ? g : { fullName: "", dob: "" }))
    );
  }, [partySize]);

  // Pricing
  const subtotal = useMemo(() => partySize * PRICE_PER_PERSON, [partySize]);
  const discount = useMemo(() => (isMember ? MEMBER_DISCOUNT : 0), [isMember]);
  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  // Validation
  const allGuestsOk = useMemo(() => {
    for (let i = 0; i < partySize; i++) {
      const g = guests[i];
      if (!g?.fullName || !g?.dob) return false;
      if (calcAge(g.dob) < 21) return false;
    }
    return true;
  }, [guests, partySize]);

  const baseOk =
    contactName.trim().length > 0 &&
    validEmail(email) &&
    !!time &&
    !!date &&
    isFriOrSat(date) &&
    partySize >= 1 &&
    partySize <= MAX_PARTY;

  const canPay = baseOk && allGuestsOk;

  // Time slot options (5 PM -> 10 PM hourly)
  const TIME_SLOTS = ["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"];

  // Styled bits consistent with your theme
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
  const selectBase = { ...inputBase };
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

  // ---- UPDATED PAY: posts to /api/checkout with { type, amount, meta } ----
  async function pay() {
    if (!canPay) return;

    const meta = {
      type: "reservation",
      contactEmail: email,
      contactPhone: normPhone(phone),
      name: contactName,
      partySize: String(partySize),
      date,
      time,
      isMember: isMember ? "true" : "false",
      guests: JSON.stringify(
        guests.slice(0, partySize).map((g) => ({
          fullName: g.fullName,
          dob: g.dob,
          age: calcAge(g.dob),
        }))
      ),
      policy:
        "Cancellation & Refund Policy: 50% refund if cancelled at least 24 hours prior to the scheduled reservation time. No full refunds. No refund within 24 hours. Be on time; dining time is 1.5–2 hours.",
      notes:
        "Dining window: 1.5–2 hours. Friday & Saturday only. Max party size 4. All guests must be 21+ (IDs checked on arrival).",
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reservation", amount: total, meta }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url; // Stripe Checkout
      } else {
        alert("Could not start payment. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Payment error. Please try again.");
    }
  }

  // Top-left welcome
  const Welcome = (
    <div className="font-orange" style={{ color: "var(--gold)", fontSize: 14, marginBottom: 12 }}>
      WELCOME TO THE GREEN ROOM
    </div>
  );

  return (
    <section>
      {Welcome}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 20, height: 20, borderRadius: 999, background: "var(--gold)" }} />
        <h2 className="font-orange gold-emboss" style={{ fontSize: 32 }}>Cafe Reservations</h2>
      </div>

      {/* Overview + Policy */}
      <div style={sectionCard}>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
          Open <span className="gold-emboss">Friday & Saturday</span> with reservation time slots from
          {" "}<span className="gold-emboss">5 PM</span> through <span className="gold-emboss">10 PM</span>. Dining time is <span className="gold-emboss">1.5–2 hours</span>.
          <br /><br />
          Price: <span className="gold-emboss">$80 per person</span>. Members receive <span className="gold-emboss">$10 off</span> the reservation total.
          <br /><br />
          <strong>Cancellation & Refund Policy:</strong> 50% refund if cancelled at least 24 hours before your reservation.
          No full refunds. Cancellations made less than 24 hours prior will not be refunded. Please arrive on time.
          <br /><br />
          Max party size: 4. All guests must be 21+. IDs are checked on arrival.
          For private events, contact: <a href="mailto:DoItAllEnt610@gmail.com" style={{ color: "var(--gold)" }}>DoItAllEnt610@gmail.com</a>.
        </p>
      </div>

      {/* Contact + Member */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Your Info</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <Field label="Full name" value={contactName} onChange={setContactName} inputBase={inputBase} labelStyle={labelStyle} />
          <Field type="email" label="Email (for confirmation)" value={email} onChange={setEmail} inputBase={inputBase} labelStyle={labelStyle} />
          <Field label="Phone (for SMS)" value={phone} onChange={setPhone} placeholder="+1 555 555 5555" inputBase={inputBase} labelStyle={labelStyle} />
          <label style={{ ...labelStyle, display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={isMember} onChange={(e) => setIsMember(e.target.checked)} style={{ accentColor: "var(--gold)" }} />
            I am a member (applies $10 off the reservation total)
          </label>
        </div>
      </div>

      {/* Reservation details */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Reservation Details</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <div>
            <label style={labelStyle}>Date (Friday or Saturday only)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ ...inputBase, marginTop: 6 }}
            />
            {!date ? null : isFriOrSat(date) ? null : (
              <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 6 }}>
                Please choose a Friday or Saturday date.
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Time</label>
            <select value={time} onChange={(e) => setTime(e.target.value)} style={{ ...selectBase, marginTop: 6 }}>
              <option value="">Select a time</option>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Party Size (max 4)</label>
            <select
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value, 10))}
              style={{ ...selectBase, marginTop: 6 }}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Guests (all 21+) */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Guest Information (21+)</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {Array.from({ length: partySize }).map((_, i) => {
            const g = guests[i];
            const age = calcAge(g.dob);
            return (
              <div key={i} style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,.1)", paddingTop: i === 0 ? 0 : 12 }}>
                <Field label={`Guest ${i + 1} full name (as on ID)`} value={g.fullName} onChange={(v) => setGuests((prev) => prev.map((x, idx) => (idx === i ? { ...x, fullName: v } : x)))} inputBase={inputBase} labelStyle={labelStyle} />
                <Field type="date" label="Date of birth" value={g.dob} onChange={(v) => setGuests((prev) => prev.map((x, idx) => (idx === i ? { ...x, dob: v } : x)))} inputBase={inputBase} labelStyle={labelStyle} />
                <div style={{ fontSize: 11, color: age && age < 21 ? "#ff6b6b" : "var(--muted)" }}>
                  {age ? `Age: ${age}` : "Age: —"} {age && age < 21 ? "(must be 21+)" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary & Pay */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Summary</h3>
        <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
          <SummaryLine left={`$${PRICE_PER_PERSON} × ${partySize}`} right={`$${subtotal.toFixed(2)}`} />
          <SummaryLine left="Member discount" right={`-$${discount.toFixed(2)}`} />
          <SummaryLine
            left={<span style={{ color: "var(--muted)" }}>Total</span>}
            right={<span style={{ color: "var(--gold-soft)" }}>${total.toFixed(2)}</span>}
          />
        </div>
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
          You’ll receive an email (and SMS if provided) confirming your reservation details.
        </p>
        <button onClick={pay} disabled={!canPay} style={payBtn(canPay)}>
          Pay ${total.toFixed(2)} & Book
        </button>
      </div>
    </section>
  );
}

/* ---------- tiny helpers kept in this file ---------- */
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
function SummaryLine({ left, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}
