// pages/index.js
export default function Home() {
  return (
    <section
      className="smoke"
      style={{
        position: "relative",
        borderRadius: 12,
        padding: "56px 20px",
        minHeight: 360,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
      }}
    >
      {/* Top-left welcome text (page-specific, as requested) */}
      <div
        className="font-orange"
        style={{
          position: "absolute",
          left: 16,
          top: 12,
          color: "var(--gold)",
          fontSize: 16, // readable, not huge
          letterSpacing: 0.5,
          textShadow: "0 1px 0 #7d6a2f, 0 3px 10px rgba(0,0,0,.35)",
        }}
      >
        WELCOME TO THE GREEN ROOM
      </div>

      {/* Centered logo (bumped up size) */}
      <img
        src="/logo.png" // make sure /public/logo.png exists (lowercase)
        alt="The Green Room logo"
        style={{
          width: "100%",
          maxWidth: 440, // bigger logo (two notches up)
          height: "auto",
          objectFit: "contain",
          display: "block",
          filter: "drop-shadow(0 8px 30px rgba(0,0,0,.35))",
        }}
      />

      {/* Bigger clickable Instagram handle */}
      <p className="font-orange" style={{ marginTop: 20 }}>
        <a
          href="https://instagram.com/greenroomafterdark"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 22, // bigger handle (two notches up)
            fontWeight: 600,
            color: "var(--neon-red)",
            textDecoration: "none",
            textShadow: "0 0 10px var(--neon-red), 0 0 20px var(--neon-red)",
          }}
        >
          @greenroomafterdark
        </a>
      </p>
    </section>
  );
}
