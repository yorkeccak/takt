"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);
  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1120",
          color: "#e2e8f0",
          fontFamily: "Inter, system-ui, sans-serif",
        }}>
          <div style={{ textAlign: "center", maxWidth: "400px", padding: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "20px" }}>
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#3b82f6",
                color: "#ffffff",
                border: "none",
                padding: "10px 24px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
