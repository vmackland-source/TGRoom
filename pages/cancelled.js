export default function Cancelled() {
  return (
    <section style={{ padding: 24 }}>
      <div className="font-orange" style={{ color: "var(--gold)", fontSize: 14, marginBottom: 12 }}>
        WELCOME TO THE GREEN ROOM
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 20, height: 20, borderRadius: 999, background: "var(--gold)" }} />
        <h2 className="font-orange gold-emboss" style={{ fontSize: 28, margin: 0 }}>
          Payment Cancelled
        </h2>
      </div>

      <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
        No charges were made. You can safely close this page or go back and try again.
      </p>
    </section>
  );
}
