"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";

type SessionUser = {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "instructor";
};

type MeResponse = {
  user: SessionUser;
};

export default function HomePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [emergencyUsername, setEmergencyUsername] = useState("farmadmin");
  const [emergencyPassword, setEmergencyPassword] = useState("farmadmin");

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const payload = (await response.json()) as MeResponse;
        if (!cancelled) {
          setUser(payload.user);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  function signInWithGoogle() {
    window.location.assign("/api/auth/google/start");
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    setMessage("Signed out.");
  }

  async function emergencyLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/auth/emergency", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: emergencyUsername,
        password: emergencyPassword
      })
    });

    if (!response.ok) {
      setMessage("Emergency login failed.");
      return;
    }

    const payload = (await response.json()) as MeResponse;
    setUser(payload.user);
    setMessage("Emergency login successful.");
  }

  return (
    <main style={pageStyle}>
      <section aria-labelledby="mvp-shell-title" style={shellStyle}>
        <div style={heroStyle}>
          <div style={eyebrowStyle}>Staff workspace</div>
          <h1 id="mvp-shell-title" style={titleStyle}>
            Horse Farm Management
          </h1>
          <p style={ledeStyle}>
            Internal scheduling, horse assignment, practice ride, and lesson credit tools for farm
            staff.
          </p>
        </div>

        {!user ? (
          <div style={signinCardStyle}>
            <div style={signinCopyStyle}>
              <div style={smallLabelStyle}>Authentication</div>
              <h2 style={cardTitleStyle}>Sign in with Google</h2>
              <p style={cardTextStyle}>
                Use the farm&apos;s Google OAuth flow to access the staff shell.
              </p>
            </div>

            <button type="button" onClick={signInWithGoogle} style={googleButtonStyle}>
              <GoogleMark />
              <span>Sign in with Google</span>
            </button>

            <p style={footnoteStyle}>
              Emergency access is available through the backend with the temporary
              `farmadmin` account.
            </p>

            <details style={emergencyDisclosureStyle}>
              <summary style={emergencySummaryStyle}>Emergency login</summary>
              <form onSubmit={emergencyLogin} style={emergencyFormStyle}>
                <label style={fieldLabelStyle}>
                  Username
                  <input
                    value={emergencyUsername}
                    onChange={(event) => setEmergencyUsername(event.target.value)}
                    style={fieldInputStyle}
                    autoComplete="username"
                  />
                </label>
                <label style={fieldLabelStyle}>
                  Password
                  <input
                    value={emergencyPassword}
                    onChange={(event) => setEmergencyPassword(event.target.value)}
                    style={fieldInputStyle}
                    type="password"
                    autoComplete="current-password"
                  />
                </label>
                <button type="submit" style={emergencyButtonStyle}>
                  Sign in as emergency admin
                </button>
              </form>
            </details>
          </div>
        ) : (
          <div style={dashboardStyle}>
            <article style={statusCardStyle}>
              <div style={smallLabelStyle}>Session</div>
              <h2 style={cardTitleStyle}>{loading ? "Loading..." : "Signed in"}</h2>
              <p style={cardTextStyle}>
                {user.display_name} | {user.email} | {user.role}
              </p>
              <button type="button" onClick={logout} style={logoutButtonStyle}>
                Sign out
              </button>
            </article>

            <article style={panelCardStyle}>
              <div style={smallLabelStyle}>Today</div>
              <h3 style={panelTitleStyle}>Operations Snapshot</h3>
              <ul style={listStyle}>
                <li>Lessons, horses, and practice rides will appear here next.</li>
                <li>Session state is now backend-owned and cookie-based.</li>
                <li>Google sign-in routes through the OAuth callback flow.</li>
              </ul>
            </article>

            <article style={panelCardStyle}>
              <div style={smallLabelStyle}>Access</div>
              <h3 style={panelTitleStyle}>Role-aware shell</h3>
              <ul style={listStyle}>
                <li>Backend APIs enforce access control.</li>
                <li>UI route guards can be layered on top of `/api/me`.</li>
                <li>Only pre-created staff emails are accepted.</li>
              </ul>
            </article>
          </div>
        )}

        {message ? <p style={messageStyle}>{message}</p> : null}
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.652 32.657 29.2 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.038l5.657-5.657C34.041 6.053 29.28 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.038l5.657-5.657C34.041 6.053 29.28 4 24 4c-7.682 0-14.349 4.342-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.157 0 9.874-1.977 13.446-5.196l-6.206-5.238C29.285 35.091 26.781 36 24 36c-5.177 0-9.618-3.317-11.296-7.946l-6.52 5.018C9.497 39.556 16.227 44 24 44z"
      />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.036 12.036 0 0 1-4.063 5.566l.003-.003 6.206 5.238C36.99 40.055 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "32px",
  background:
    "radial-gradient(circle at top, rgba(108, 136, 106, 0.18), transparent 42%), linear-gradient(180deg, #f3f5ef 0%, #ece8db 100%)"
};

const shellStyle: CSSProperties = {
  width: "min(1040px, 100%)",
  margin: "0 auto",
  display: "grid",
  gap: "28px"
};

const heroStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
  maxWidth: "820px"
};

const eyebrowStyle: CSSProperties = {
  color: "#5e6b5d",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontSize: "13px"
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(44px, 7vw, 74px)",
  lineHeight: 0.92,
  letterSpacing: "-0.05em"
};

const ledeStyle: CSSProperties = {
  margin: 0,
  maxWidth: "760px",
  fontSize: "18px",
  lineHeight: 1.6
};

const signinCardStyle: CSSProperties = {
  display: "grid",
  gap: "20px",
  padding: "28px",
  borderRadius: "28px",
  background: "rgba(255, 255, 255, 0.8)",
  border: "1px solid rgba(72, 84, 70, 0.12)",
  boxShadow: "0 24px 80px rgba(55, 64, 50, 0.12)",
  maxWidth: "560px"
};

const signinCopyStyle: CSSProperties = {
  display: "grid",
  gap: "10px"
};

const smallLabelStyle: CSSProperties = {
  margin: 0,
  color: "#5e6b5d",
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase"
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "28px",
  lineHeight: 1.05
};

const cardTextStyle: CSSProperties = {
  margin: 0,
  lineHeight: 1.6,
  color: "#394539"
};

const googleButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  width: "fit-content",
  padding: "14px 20px",
  borderRadius: "999px",
  border: "1px solid rgba(60, 64, 67, 0.16)",
  background: "#fff",
  color: "#1f1f1f",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 700,
  boxShadow: "0 10px 30px rgba(31, 45, 31, 0.12)"
};

const footnoteStyle: CSSProperties = {
  margin: 0,
  color: "#5e6b5d",
  fontSize: "14px",
  lineHeight: 1.5
};

const dashboardStyle: CSSProperties = {
  display: "grid",
  gap: "20px",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))"
};

const statusCardStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "24px",
  background: "rgba(255, 255, 255, 0.78)",
  border: "1px solid rgba(72, 84, 70, 0.12)",
  boxShadow: "0 24px 80px rgba(55, 64, 50, 0.12)",
  display: "grid",
  gap: "14px"
};

const panelCardStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "24px",
  background: "rgba(255, 255, 255, 0.7)",
  border: "1px solid rgba(72, 84, 70, 0.12)",
  boxShadow: "0 24px 80px rgba(55, 64, 50, 0.12)",
  display: "grid",
  gap: "12px"
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px"
};

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: "18px",
  display: "grid",
  gap: "8px",
  lineHeight: 1.5
};

const logoutButtonStyle: CSSProperties = {
  width: "fit-content",
  padding: "11px 16px",
  borderRadius: "999px",
  border: "none",
  background: "#1f2d1f",
  color: "#fff",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 700
};

const messageStyle: CSSProperties = {
  margin: 0,
  color: "#3f523d",
  fontWeight: 600
};

const emergencyDisclosureStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  paddingTop: "4px"
};

const emergencySummaryStyle: CSSProperties = {
  cursor: "pointer",
  color: "#4d5b4a",
  fontWeight: 700,
  listStyle: "none"
};

const emergencyFormStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  maxWidth: "360px"
};

const fieldLabelStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  color: "#364136",
  fontWeight: 600,
  fontSize: "14px"
};

const fieldInputStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(72, 84, 70, 0.18)",
  font: "inherit",
  background: "#fff"
};

const emergencyButtonStyle: CSSProperties = {
  width: "fit-content",
  padding: "11px 16px",
  borderRadius: "999px",
  border: "1px solid rgba(72, 84, 70, 0.18)",
  background: "#edf2eb",
  color: "#213021",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 700
};
