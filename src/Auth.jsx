import React, { useState } from "react";
import { supabase } from "./lib/supabaseClient";

const wrap = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#F6F6F9",
  fontFamily: "'Inter', system-ui, sans-serif",
  padding: 20,
};
const card = {
  width: "100%",
  maxWidth: 380,
  background: "#FFFFFF",
  border: "1px solid #E7E7EF",
  borderRadius: 16,
  padding: "32px 28px",
  boxShadow: "0 12px 32px rgba(20,21,30,0.08)",
};
const logoRow = { display: "flex", alignItems: "center", gap: 10, marginBottom: 22 };
const logoMark = {
  width: 32, height: 32, borderRadius: 9,
  background: "linear-gradient(135deg, #5B5FEF, #9C6BFF)",
  flexShrink: 0,
};
const label = { display: "block", fontSize: 12.5, fontWeight: 600, color: "#6C6E7D", marginBottom: 6 };
const input = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E7E7EF",
  fontSize: 14, marginBottom: 14, outline: "none", boxSizing: "border-box",
};
const button = {
  width: "100%", padding: "11px 14px", borderRadius: 9, border: "none",
  background: "#5B5FEF", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
};
const toggle = { textAlign: "center", marginTop: 16, fontSize: 13, color: "#6C6E7D" };
const toggleLink = { color: "#5B5FEF", fontWeight: 600, cursor: "pointer", background: "none", border: "none", fontSize: 13, padding: 0 };

export default function Auth() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const missingConfig = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setNotice(""); setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error, data } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.session) {
          setNotice("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={logoRow}>
          <div style={logoMark} />
          <div style={{ fontWeight: 700, fontSize: 17 }}>Pathway</div>
        </div>

        {missingConfig && (
          <div style={{ background: "#FBEAE8", color: "#E15A52", fontSize: 12.5, padding: "10px 12px", borderRadius: 8, marginBottom: 16 }}>
            Supabase isn't configured yet. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment (see the README) before signing in.
          </div>
        )}

        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </div>
        <div style={{ fontSize: 12.5, color: "#6C6E7D", marginBottom: 20 }}>
          {mode === "signin" ? "Sign in to pick up your job search where you left off." : "Your data syncs across every device you sign in on."}
        </div>

        <form onSubmit={submit}>
          <label style={label}>Email</label>
          <input style={input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <label style={label}>Password</label>
          <input style={input} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          {error && <div style={{ color: "#E15A52", fontSize: 12.5, marginBottom: 14 }}>{error}</div>}
          {notice && <div style={{ color: "#1FA971", fontSize: 12.5, marginBottom: 14 }}>{notice}</div>}
          <button style={{ ...button, opacity: loading ? 0.7 : 1 }} disabled={loading} type="submit">
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <div style={toggle}>
          {mode === "signin" ? (
            <>New here? <button style={toggleLink} onClick={() => { setMode("signup"); setError(""); setNotice(""); }}>Create an account</button></>
          ) : (
            <>Already have an account? <button style={toggleLink} onClick={() => { setMode("signin"); setError(""); setNotice(""); }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
