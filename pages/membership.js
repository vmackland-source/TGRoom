// pages/membership.js
import { useMemo, useState } from "react";

export default function MembershipPage() {
  // Form fields (must match state ID/Driver’s License)
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState(""); // yyyy-mm-dd
  const [address, setAddress] = useState("");

  // Additional info
  const [howHeard, setHowHeard] = useState("");
  const [strain, setStrain] = useState("");
  const [whyJoin, setWhyJoin] = useState("");

  // Contact (for confirmations)
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // optional but helpful for SMS

  // Required photo
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  // Acknowledgements
  const [is21, setIs21] = useState(false);
  const [agreePolicy, setAgreePolicy] = useState(false);

  // Price
  const PRICE = 60;

  // --- helpers ---
  const age = useMemo(() => {
    if (!dob) return 0;
    const d = new Date(dob + "T00:00:00");
    const today = new Date();
    let a = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) a--;
    return a;
  }, [dob]);

  function normPhone(p) {
    const digits = p.replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) return digits;
    if (digits.length === 10) return `+1${digits}`;
    return digits;
  }
  function validEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  // Validation (photo required, 21+, fields filled)
  const canPay = useMemo(() => {
    const baseFilled =
      fullName &&
      dob &&
      address &&
      howHeard &&
      strain &&
      whyJoin &&
      email &&
      validEmail(email) &&
      photo;
    const adult = age >= 21 && is21;
    return baseFilled && adult && agreePolicy;
  }, [fullName, dob, address, howHeard, strain, whyJoin, email, photo, age, is21, agreePolicy]);

  // --- payment ---
  async function pay() {
    if (!canPay) return;

    // Prepare metadata for your webhook to email you + the member and issue a QR code.
    const meta = {
      type: "membership",
      fullName,
      dob,
      address,
      howHeard,
      strain,
      whyJoin,
      email,
      phone: phone ? normPhone(phone) : "",
      attestation_21: is21 ? "true" : "false",
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: PRICE * 100,
          description: "Annual Membership (1 year)",
          successPath: "/membership?status=paid",
          cancelPath: "/membership",
          metadata: meta,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Payment initialization failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Payment error. Please try again.");
    }
  }

  // --- styles (keep consistent with your deep green + gold theme) ---
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

  return (
    <section>
      {/* Top-left welcome text per your spec */}
      <div className="font-orange" style={{ color: "var(--gold)", fontSize: 14, marginBottom: 12 }}>
        WELCOME TO THE GREEN ROOM
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 20, height: 20, borderRadius: 999, background: "var(--gold)" }} />
        <h2 className="font-orange gold-emboss" style={{ fontSize: 32 }}>Membership</h2>
      </div>

      {/* Info & perks */}
      <div style={sectionCard}>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <div style={{ fontSize: 14, color: "var(--muted)" }}>
              Annual membership: <span className="gold-emboss" style={{ fontWeight: 700 }}>${PRICE}</span>
            </div>
            <ul style={{ marginTop: 8, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
              <li>• Must be <span className="gold-emboss">21+</span> to join (information must match your state ID/Driver’s License).</li>
              <li>• Member perks: <span className="gold-emboss">$10 off Social After Dark entry</span> and <span className="gold-emboss">$10 off Café reservations</span>.</li>
            </ul>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            After successful payment, we’ll notify you and create your <span className="gold-emboss">unique membership card with QR code</span> linked to your info & photo.
            You’ll receive confirmation by email (and SMS if a phone is provided).
          </div>
        </div>
      </div>

      {/* Form */}
      <style>{`@media (min-width: 992px){ .grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:18px; } }`}</style>
      <div className="grid-3">
        {/* Left column */}
        <div style={sectionCard}>
          <h3 className="font-orange gold-emboss" style={{ fontSize: 20 }}>Your Information</h3>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <Field label="Full name (as on ID)" value={fullName} onChange={setFullName} inputBase={inputBase} labelStyle={labelStyle} />
            <Field type="date" label="Date of birth" value={dob} onChange={setDob} inputBase={inputBase} labelStyle={labelStyle} />
            <label style={labelStyle}>Home address (as on ID)</label>
            <textarea rows={3} style={{ ...inputBase, marginTop: 6 }} placeholder="Street, City, State, ZIP" value={address} onChange={(e)=>setAddress(e.target.value)} />
            <Field type="email" label="Email" value={email} onChange={setEmail} inputBase={inputBase} labelStyle={labelStyle} />
            <Field label="Phone (optional)" value={phone} onChange={setPhone} placeholder="+1 555 555 5555" inputBase={inputBase} labelStyle={labelStyle} />
          </div>

          {/* Age & policy */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: age>0 && age<21 ? "#ff6b6b" : "var(--muted)" }}>
              Age detected: {age ? `${age}` : "—"} {age>0 && age<21 ? "(must be 21+)" : ""}
            </div>
            <label style={{ ...labelStyle, display: "flex", gap: 8, marginTop: 8 }}>
              <input type="checkbox" checked={is21} onChange={(e)=>setIs21(e.target.checked)} style={{ accentColor: "var(--gold)" }} />
              I confirm I am 21+.
            </label>
            <label style={{ ...labelStyle, display: "flex", gap: 8, marginTop: 8 }}>
              <input type="checkbox" checked={agreePolicy} onChange={(e)=>setAgreePolicy(e.target.checked)} style={{ accentColor: "var(--gold)" }} />
              I agree to the house rules and privacy policy.
            </label>
          </div>
        </div>

        {/* Middle column */}
        <div style={sectionCard}>
          <h3 className="font-orange gold-emboss" style={{ fontSize: 20 }}>About You</h3>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <Field label="How did you hear about us?" value={howHeard} onChange={setHowHeard} placeholder="Friend, social, flyer…" inputBase={inputBase} labelStyle={labelStyle} />
            <Field label="Strain of choice" value={strain} onChange={setStrain} placeholder="Your preference" inputBase={inputBase} labelStyle={labelStyle} />
            <label style={labelStyle}>Why do you want to join?</label>
            <textarea rows={4} style={{ ...inputBase, marginTop: 6 }} placeholder="Tell us briefly" value={whyJoin} onChange={(e)=>setWhyJoin(e.target.value)} />
          </div>
        </div>

        {/* Right column */}
        <div style={sectionCard}>
          <h3 className="font-orange gold-emboss" style={{ fontSize: 20 }}>Required Photo</h3>
          <p style={{ ...labelStyle, marginTop: 4 }}>Upload a clear photo for your membership record (required).</p>
          <input
            type="file"
            accept="image/*"
            style={{ ...inputBase, marginTop: 10, padding: "8px 12px" }}
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setPhoto(f);
              setPhotoPreview(f ? URL.createObjectURL(f) : "");
            }}
          />
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Membership photo preview"
              style={{
                width: "100%",
                height: 180,
                objectFit: "cover",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.1)",
                marginTop: 10,
              }}
            />
          )}

          <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", marginTop: 14, paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "var(--muted)" }}>Total</span>
              <span style={{ color: "var(--gold-soft)" }}>${PRICE.toFixed(2)}</span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
              After payment, you’ll receive a confirmation. We’ll review your info and send your unique membership QR code.
            </p>
            <button onClick={pay} disabled={!canPay} style={payBtn(canPay)}>
              Pay ${PRICE.toFixed(2)} & Join
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----- tiny helper component (kept inside this single file) ----- */
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
