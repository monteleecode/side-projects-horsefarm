export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px"
      }}
    >
      <section
        aria-labelledby="mvp-shell-title"
        style={{
          width: "min(920px, 100%)",
          display: "grid",
          gap: "24px"
        }}
      >
        <div>
          <p style={{ margin: "0 0 8px", color: "#5e6b5d", fontWeight: 700 }}>
            Staff workspace
          </p>
          <h1
            id="mvp-shell-title"
            style={{
              margin: 0,
              fontSize: "42px",
              lineHeight: 1.1,
              letterSpacing: 0
            }}
          >
            Horse Farm Management
          </h1>
        </div>
        <p style={{ margin: 0, maxWidth: "640px", fontSize: "18px", lineHeight: 1.6 }}>
          Internal scheduling, horse assignment, practice ride, and lesson credit tools for farm
          staff.
        </p>
      </section>
    </main>
  );
}
