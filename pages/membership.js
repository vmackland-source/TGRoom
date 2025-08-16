// pages/membership.js
import { useMemo, useState } from "react";

/**
 * Membership
 * - $60/year
 * - Must be 21+
 * - Info must match government ID (full name, DOB, home address)
 * - Fields: full name, DOB, address, why join, favorite strain, how heard, mandatory photo
 * - Perks: $10 entry to Social After Dark, $10 off Cafe Reservations
 * - After payment: you (and customer) get confirmation; you'll later issue a unique QR code (save to phone)
 */

const MEMBERSHIP_PRICE = 60;

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

export default function MembershipPage() {
  // Contact (for confirmations)
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Required member info
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");

  // Additional prompts
  const [whyJoin, setWhyJoin] = useState("");
  const [favoriteStrain, setFavoriteStrain] = useState("");
  const [howHeard, setHowHeard] = useState("");

  // Photo (mandatory)
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  // Computed
  const age = useMemo(() => calcAge(dob), [dob]);

  // Validation
  const canPay =
    validEmail(email) &&
    phone &&
    fullName.trim().length > 0 &&
    dob &&
    age >= 21 &&
    address.trim().length > 0 &&
    whyJoin.trim().length > 0 &&
    favoriteStrain.trim().length > 0 &&
    howHeard.trim().length > 0 &&
    !!photoFile;

  // THEME styles (match your app)
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
  const textareaBase = { ...inputBase, minHeight: 90, resize: "vertical" };
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

  // ---- PAY: posts to /api/checkout with { type, amount, meta } ----
  async function pay() {
    if (!canPay) return;

    // If you later implement /api/upload, first upload photo and set photoUrl.
    const photoUrl = ""; // placeholder (set to Cloudinary URL if you wire /api/upload)

    const meta = {
      type: "membership",
      contactEmail: email,
      contactPhone: normPhone(phone),
      fullName,
      dob,
      address,
      whyJoin,
      favoriteStrain,
      howHeard,
      over21: age >= 21 ? "true" : "false",
      photoUrl, // Leave blank unless you upload; still useful for your webhook
      perks:
        "$10 entry to Social After Dark; $10 off Cafe Reservations. One-year membership.",
      qrNote:
        "A unique QR code will be issued after review; save it to your phone. IDs checked on arrival.",
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "membership", amount: MEMBERSHIP_PRICE, meta }),
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
        <h2 className="font-orange gold-emboss" style={{ fontSize: 32 }}>Membership</h2>
      </div>

      {/* Overview */}
      <div style={sectionCard}>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
          Annual membership is <span className="gold-emboss">$60</span>. Members enjoy{" "}
          <span className="gold-emboss">$10 entry</span> into the Social After Dark and{" "}
          <span className="gold-emboss">$10 off</span> Cafe Reservations. You must be{" "}
          <span className="gold-emboss">21+</span>, and your information must match your
          government-issued ID. After payment and review, you’ll receive a{" "}
          <span className="gold-emboss">unique QR code</span> to save on your phone; we scan it on arrival.
        </p>
      </div>

      {/* Contact */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Your Contact</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <Field type="email" label="Email (for confirmation & QR)" value={email} onChange={setEmail} inputBase={inputBase} labelStyle={labelStyle} />
          <Field label="Phone (for SMS)" value={phone} onChange={setPhone} placeholder="+1 555 555 5555" inputBase={inputBase} labelStyle={labelStyle} />
        </div>
      </div>

      {/* Required ID-matching info */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Your Details (must match ID)</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <Field label="Full name (as on ID)" value={fullName} onChange={setFullName} inputBase={inputBase} labelStyle={labelStyle} />
          <Field type="date" label="Date of birth" value={dob} onChange={setDob} inputBase={inputBase} labelStyle={labelStyle} />
          <AgeInline age={age} />
          <Field label="Home address (as on ID)" value={address} onChange={setAddress} inputBase={inputBase} labelStyle={labelStyle} />
        </div>
      </div>

      {/* Additional prompts */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>A few questions</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <div>
            <label style={labelStyle}>Why do you want to join?</label>
            <textarea style={{ ...textareaBase, marginTop: 6 }} value={whyJoin} onChange={(e) => setWhyJoin(e.target.value)} />
          </div>
          <Field label="Favorite strain" value={favoriteStrain} onChange={setFavoriteStrain} inputBase={inputBase} labelStyle={labelStyle} />
          <Field label="How did you hear about us?" value={howHeard} onChange={setHowHeard} inputBase={inputBase} labelStyle={labelStyle} />
        </div>
      </div>

      {/* Photo (mandatory) */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Photo (required)</h3>
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
          Upload a clear photo for your membership record.
        </p>
        <input
          type="file"
          accept="image/*"
          style={{ ...inputBase, padding: "8px 12px", marginTop: 8 }}
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setPhotoFile(f);
            setPhotoPreview(f ? URL.createObjectURL(f) : "");
          }}
        />
        {photoPreview && (
          <img
            src={photoPreview}
            alt="Photo preview"
            style={{
              width: "100%",
              height: 220,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.1)",
              marginTop: 10,
            }}
          />
        )}
      </div>

      {/* Summary & Pay */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Summary</h3>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <span style={{ color: "var(--muted)" }}>Membership (1 year)</span>
          <span style={{ color: "var(--gold-soft)" }}>${MEMBERSHIP_PRICE.toFixed(2)}</span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
          After payment, you’ll receive a confirmation by email/SMS. We’ll review your details and send your unique QR code (save it to your phone). IDs are checked on arrival.
        </p>
        <button onClick={pay} disabled={!canPay} style={payBtn(canPay)}>
          Pay ${MEMBERSHIP_PRICE.toFixed(2)} & Join
        </button>
      </div>
    </section>
  );
}

/* ---------- tiny helpers (kept in this file) ---------- */
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

function AgeInline({ age }) {
  return (
    <div style={{ fontSize: 11, color: age && age < 21 ? "#ff6b6b" : "var(--muted)", marginTop: 4 }}>
      {age ? `Age: ${age}` : "Age: —"} {age && age < 21 ? "(must be 21+)" : ""}
    </div>
  );
}
