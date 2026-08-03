import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button, Field, inputCls } from "../components/ui";

export default function Login() {
  const { login, isAuthenticated, booting } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!booting && isAuthenticated) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-card shadow-card p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded bg-primary text-white flex items-center justify-center font-display font-bold text-sm">
            EC
          </div>
          <div>
            <div className="font-display font-semibold text-ink">Electronics Cart</div>
            <div className="text-[11px] text-muted font-mono tracking-wide">ADMIN CONSOLE</div>
          </div>
        </div>

        <h1 className="font-display text-2xl font-semibold text-ink mb-1">Sign in</h1>
        <p className="text-sm text-muted mb-6">Use your staff credentials to manage the store.</p>

        <form onSubmit={onSubmit} className="space-y-1">
          <Field label="Email">
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          {error && <p className="text-sm text-danger mb-3">{error}</p>}
          <Button type="submit" variant="primary" className="w-full justify-center mt-2" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
