// pages/_app.js
import "../styles/globals.css";
import Link from "next/link";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/membership", label: "Membership" },
  { href: "/reservations", label: "Cafe Reservations" },
  { href: "/social-entry", label: "Social Entry" },
  { href: "/menu", label: "After Dark Menu" },
];

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Header: tabs centered; left/right spacers keep true center */}
      <header className="site-header">
        <div className="spacer" />
        <nav className="tabs">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className="tab">
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="spacer" />
      </header>

      {/* Page content (your pages stay exactly as you made them) */}
      <main className="wrap">
        <Component {...pageProps} />
      </main>

      <style jsx global>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 50;
          display: grid;
          grid-template-columns: 1fr auto 1fr; /* spacer | tabs | spacer */
          align-items: center;
          padding: 10px 16px;
          background: linear-gradient(
              180deg,
              rgba(2, 26, 20, 0.95),
              rgba(2, 26, 20, 0.85)
            ),
            var(--panel);
          border-bottom: 1px solid rgba(216, 192, 122, 0.15);
          backdrop-filter: blur(6px);
        }

        .tabs {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center; /* hard center */
        }

        .tab {
          padding: 8px 10px;
          border-radius: 10px;
          color: var(--gold);
          text-decoration: none;
          font-family: var(--font-orange, inherit);
          font-size: 14px;
          border: 1px solid transparent;
        }

        .tab:hover {
          border-color: rgba(216, 192, 122, 0.3);
          background: rgba(216, 192, 122, 0.08);
        }

        .wrap {
          padding: 20px;
        }
      `}</style>
    </>
  );
}
