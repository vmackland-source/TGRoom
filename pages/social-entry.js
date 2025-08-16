// pages/social-entry.js
import { useMemo, useState } from "react";

/**
 * ENTRY RULES (summary)
 * - Non-member: $20, must be 21+, ID-matching info + mandatory photo.
 * - Member: $10, must be 21+. Members may bring ONE guest for $15.
 * - Guest: $15, must be 21+, ID-matching info + mandatory photo.
 * - Address + codeword are sent by email/SMS after successful payment.
 * - IDs checked on arrival. After Dark Social runs Friday & Saturday 11 PM – 3 AM. No outside food or drink.
 * - Zero tolerance: violence, assault, theft, property damage → immediate permanent ban.
 */

const PRICE_NON_MEMBER = 20;
const PRICE_MEMBER = 10;
const PRICE_GUEST = 15;

function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function normPhone(p) {
  const digits = p.replace(/[^\d+]/g, "");
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

export default function SocialEntryPage() {
  // Contact for sending address + codeword
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Member toggle (members may bring one guest)
  const [isMember, setIsMember] = useState(false);
  const [memberNumber, setMemberNumber] = useState("");

  // Non-member (self) info (required if not a member)
  const [nmName, setNmName] = useState("");
  const [nmDob, setNmDob] = useState("");
  const [nmAddress, setNmAddress] = useState("");
  const [nmPhoto, setNmPhoto] = useState(null);
  const [nmPreview, setNmPreview] = useState("");

  // Member self info (21+; address optional)
  const [mName, setMName] = useState("");
  const [mDob, setMDob] = useState("");
  const [mAddress, setMAddress] = useState("");

  // Guest (only for members)
  const [hasGuest, setHasGuest] = useState(false);
  const [gName, setGName] = useState("");
  const [gDob, setGDob] = useState("");
  const [gAddress, setGAddress] = useState("");
  const [gPhoto, setGPhoto] = useState(null);
  const [gPreview, setGPreview] = useState("");

  // Top-left welcome
  const Welcome = (
    <div className="font-orange" style={{ color: "var(--gold)", fontSize: 14, marginBottom: 12 }}>
      WELCOME TO THE GREEN ROOM
    </div>
  );

  // Pricing total
  const total = useMemo(() => {
    if (isMember) return PRICE_MEMBER + (hasGuest ? PRICE_GUEST : 0);
    return PRICE_NON_MEMBER;
  }, [isMember, hasGuest]);

  // Validation
  const nmAge = calcAge(nmDob);
  const mAge = calcAge(mDob);
  const gAge = calcAge(gDob);

  const baseOK = validEmail(email) && phone;

  const nonMemberOK =
    !isMember &&
    nmName &&
    nmDob &&
    nmAge >= 21 &&
    nmAddress &&
    !!nmPhoto;

  const memberOK =
    isMember &&
    mName &&
    mDob &&
    mAge >= 21; // ID checked on arrival

  const guestOK =
    !hasGuest ||
    (hasGuest && gName && gDob && gAge >= 21 && gAddress && !!gPhoto);

  const canPay = baseOK && (isMember ? memberOK && guestOK : nonMemberOK);

  // ---- UPDATED PAY: posts to /api/checkout with { type, amount, meta } ----
  async function pay() {
    if (!canPay) return;

    const meta = {
      type: "social-entry",
      contactEmail: email,
      contactPhone: normPhone(phone),
      isMember: String(isMember),
      memberNumber: memberNumber || "",
      primary: isMember
        ? { role: "member", fullName: mName, dob: mDob, address: mAddress || "" }
        : { role: "non-member", fullName: nmName, dob: nmDob, address: nmAddress },
      guest: hasGuest
        ? { role: "guest", fullName: gName, dob: gDob, address: gAddress }
        : null,
      // If you later upload photos to /api/upload, include the returned URLs here:
      primaryPhotoUrl: "", // e.g., non-member photo url or member photo url if required
      guestPhotoUrl: "",
      notes:
        "Have QR code ready. IDs checked on arrival. Hours: Fri & Sat 11 PM–3 AM. No outside food/drink. Zero tolerance policy.",
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "social-entry", amount: total, meta }),
      });
      const out = await res.json();
      if (out?.url) {
        window.location.href = out.url; // redirect to Stripe Checkout
      } else {
        alert("Could not start payment. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Payment error. Please try again.");
    }
  }

  // Shared styles
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
      {Welcome}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 20, height: 20, borderRadius: 999, background: "var(--gold)" }} />
        <h2 className="font-orange gold-emboss" style={{ fontSize: 32 }}>Social Entry</h2>
      </div>

      {/* Process & requirements */}
      <div style={sectionCard}>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
          Entry is <span className="gold-emboss">$20</span> for non-members and <span className="gold-emboss">$10</span> for members.
          Members may bring <span className="gold-emboss">one guest</span> for <span className="gold-emboss">$15</span>.
          Everyone must be <span className="gold-emboss">21+</span>. Names and birthdates must match a valid government-issued ID;
          all IDs are checked on arrival.
          <br /><br />
          After successful payment, you’ll receive the <span className="gold-emboss">address and codeword</span> by text and email.
          Members receive a <span className="gold-emboss">unique QR code</span> tied to their member profile (member number, status, and photo).
          Please save your QR code to your phone — we’ll scan it when you arrive.
        </p>
      </div>

      {/* Rules & Policies */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Rules & Policies</h3>
        <ul style={{ marginTop: 10, paddingLeft: 18, color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
          <li>
            <span style={{ color: "var(--gold-soft)", fontWeight: 600 }}>Zero Tolerance:</span> Any form of violence, assault, theft, damage to property, or other illegal activity will result in an immediate and permanent ban from membership and the premises.
          </li>
          <li>
            <span style={{ color: "var(--gold-soft)", fontWeight: 600 }}>Hours:</span> After Dark Social runs <strong>Friday & Saturday</strong> from <strong>11 PM</strong> to <strong>3 AM</strong>. Please arrive in time to check in and enjoy the full experience.
          </li>
          <li>
            <span style={{ color: "var(--gold-soft)", fontWeight: 600 }}>No Outside Food or Drink:</span> Outside beverages or food items are not permitted inside the premises.
          </li>
          <li>All guests must be 21+ and present a valid government-issued photo ID. Names and birthdates must match registration information.</li>
          <li>IDs are checked upon arrival. Refusal to present ID will result in denial of entry without refund.</li>
          <li>All weapons must remain in your vehicle. Security will be tight for everyone’s safety.</li>
        </ul>
      </div>

      {/* Contact for address + codeword */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Contact</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <Field type="email" label="Email (for address + codeword)" value={email} onChange={setEmail} inputBase={inputBase} labelStyle={labelStyle} />
          <Field label="Phone (for SMS)" value={phone} onChange={setPhone} placeholder="+1 555 555 5555" inputBase={inputBase} labelStyle={labelStyle} />
        </div>
      </div>

      {/* Member / Non-member flow */}
      <div style={sectionCard}>
        <label style={{ ...labelStyle, display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={isMember}
            onChange={(e) => {
              setIsMember(e.target.checked);
              if (e.target.checked) {
                // reset non-member fields
                setNmName(""); setNmDob(""); setNmAddress(""); setNmPhoto(null); setNmPreview("");
              } else {
                // reset member + guest fields
                setMName(""); setMDob(""); setMAddress("");
                setHasGuest(false); setGName(""); setGDob(""); setGAddress(""); setGPhoto(null); setGPreview("");
                setMemberNumber("");
              }
            }}
            style={{ accentColor: "var(--gold)" }}
          />
          I am a member
        </label>

        {isMember ? (
          <>
            {/* Member self info */}
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              <Field label="Member full name (as on ID)" value={mName} onChange={setMName} inputBase={inputBase} labelStyle={labelStyle} />
              <Field type="date" label="Date of birth" value={mDob} onChange={setMDob} inputBase={inputBase} labelStyle={labelStyle} />
              <Field label="Member #" value={memberNumber} onChange={setMemberNumber} inputBase={inputBase} labelStyle={labelStyle} placeholder="Optional but helpful" />
              <Field label="Home address (optional)" value={mAddress} onChange={setMAddress} inputBase={inputBase} labelStyle={labelStyle} placeholder="Street, City, State, ZIP" />
              <AgeInline age={mAge} />
            </div>

            {/* Optional guest */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", marginTop: 16, paddingTop: 12 }}>
              <label style={{ ...labelStyle, display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={hasGuest}
                  onChange={(e) => {
                    setHasGuest(e.target.checked);
                    if (!e.target.checked) { setGName(""); setGDob(""); setGAddress(""); setGPhoto(null); setGPreview(""); }
                  }}
                  style={{ accentColor: "var(--gold)" }}
                />
                I’m bringing a guest (+$15)
              </label>

              {hasGuest && (
                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                  <Field label="Guest full name (as on ID)" value={gName} onChange={setGName} inputBase={inputBase} labelStyle={labelStyle} />
                  <Field type="date" label="Guest date of birth" value={gDob} onChange={setGDob} inputBase={inputBase} labelStyle={labelStyle} />
                  <Field label="Guest home address (as on ID)" value={gAddress} onChange={setGAddress} inputBase={inputBase} labelStyle={labelStyle} />
                  <label style={labelStyle}>Guest photo (required)</label>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ ...inputBase, padding: "8px 12px" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setGPhoto(f);
                      setGPreview(f ? URL.createObjectURL(f) : "");
                    }}
                  />
                  {gPreview && (
                    <img
                      src={gPreview}
                      alt="Guest photo preview"
                      style={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,.1)",
                      }}
                    />
                  )}
                  <AgeInline age={gAge} />
                </div>
              )}
            </div>
          </>
        ) : (
          // Non-member flow
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <Field label="Full name (as on ID)" value={nmName} onChange={setNmName} inputBase={inputBase} labelStyle={labelStyle} />
            <Field type="date" label="Date of birth" value={nmDob} onChange={setNmDob} inputBase={inputBase} labelStyle={labelStyle} />
            <Field label="Home address (as on ID)" value={nmAddress} onChange={setNmAddress} inputBase={inputBase} labelStyle={labelStyle} />
            <label style={labelStyle}>Your photo (required)</label>
            <input
              type="file"
              accept="image/*"
              style={{ ...inputBase, padding: "8px 12px" }}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setNmPhoto(f);
                setNmPreview(f ? URL.createObjectURL(f) : "");
              }}
            />
            {nmPreview && (
              <img
                src={nmPreview}
                alt="Photo preview"
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,.1)",
                }}
              />
            )}
            <AgeInline age={nmAge} />
            <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
              Non-members cannot bring a guest on this page. Guests may accompany members only.
            </p>
          </div>
        )}
      </div>

      {/* Summary & Pay (ACTIVE) */}
      <div style={sectionCard}>
        <h3 className="font-orange gold-emboss" style={{ fontSize: 20, margin: 0 }}>Summary</h3>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <span style={{ color: "var(--muted)" }}>Total</span>
          <span style={{ color: "var(--gold-soft)" }}>${total.toFixed(2)}</span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
          After payment, we’ll text and email the address and codeword to the contact info above. Hours: Friday & Saturday, 11 PM – 3 AM.
        </p>
        <button onClick={pay} disabled={!canPay} style={payBtn(canPay)}>
          Pay ${total.toFixed(2)} & Get Codeword
        </button>
      </div>
    </section>
  );
}

/* ---------- tiny helpers in this file ---------- */
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
