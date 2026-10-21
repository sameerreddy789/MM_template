import { useMemo, useState, type FormEvent } from "react";
import styles from "./RCheck.module.scss";

// Same-origin: in production this hits the Vercel serverless function at
// /api/rcheck/registrations; in dev it proxies to the local backend.
const apiBase = "";

interface Registration {
  name: string;
  email: string;
  phone?: string;
  college?: string;
  paymentStatus: string;
  ticketId?: string;
  createdAt?: string | null;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function RCheck() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function load(credId: string, credPassword: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/api/rcheck/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "omit",
        body: JSON.stringify({ id: credId, password: credPassword }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data || data.success !== true) {
        throw new Error(
          (data && typeof data.error === "string" && data.error) ||
          (response.status === 401 ? "Invalid ID or password." : "Could not load registrations."),
        );
      }
      setRegistrations(Array.isArray(data.registrations) ? data.registrations : []);
      setAuthed(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!id.trim() || !password) { setError("Enter both ID and password."); return; }
    void load(id.trim(), password);
  }

  function logout() {
    setAuthed(false); setRegistrations([]); setPassword("");
    setSearch(""); setStatusFilter("all"); setError("");
  }

  const statuses = useMemo(() => {
    const unique = new Set<string>();
    registrations.forEach((item) => unique.add(item.paymentStatus || "Unknown"));
    return ["all", ...[...unique].sort()];
  }, [registrations]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    registrations.forEach((item) => {
      const s = item.paymentStatus || "Unknown";
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [registrations]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return registrations.filter((item) => {
      const status = item.paymentStatus || "Unknown";
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesQuery =
        !query ||
        (item.name || "").toLowerCase().includes(query) ||
        (item.email || "").toLowerCase().includes(query) ||
        (item.phone || "").toLowerCase().includes(query) ||
        (item.college || "").toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [registrations, search, statusFilter]);

  if (!authed) {
    return (
      <div className={styles.wrapper}>
        <form className={styles.loginCard} onSubmit={onSubmit}>
          <h1>Registration Check</h1>
          <p className={styles.subtitle}>Authorized access only.</p>
          <label className={styles.field}>
            <span>ID</span>
            <input value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" autoFocus />
          </label>
          <label className={styles.field}>
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? "Checking…" : "Sign in"}</button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <div>
            <h1>Registrations</h1>
            <div className={styles.summary}>
              <span className={styles.total}>{registrations.length} total</span>
              {Object.entries(statusCounts).map(([status, count]) => (
                <span key={status} className={styles.badge} data-status={status}>{status}: {count}</span>
              ))}
            </div>
          </div>
          <div className={styles.actions}>
            <button onClick={() => void load(id.trim(), password)} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
            <button onClick={logout} className={styles.secondary}>Log out</button>
          </div>
        </header>

        <div className={styles.controls}>
          <input className={styles.search} placeholder="Search name, email, phone, college…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statuses.map((status) => (
              <option key={status} value={status}>{status === "all" ? "All statuses" : status}</option>
            ))}
          </select>
          <span className={styles.count}>Showing {filtered.length} of {registrations.length}</span>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.indexCol}>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>College</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr key={`${item.ticketId || item.email}-${index}`}>
                  <td className={styles.indexCol}>{index + 1}</td>
                  <td>{item.name || "—"}</td>
                  <td>{item.email || "—"}</td>
                  <td>{item.phone || "—"}</td>
                  <td>{item.college || "—"}</td>
                  <td><span className={styles.badge} data-status={item.paymentStatus || "Unknown"}>{item.paymentStatus || "Unknown"}</span></td>
                  <td className={styles.created}>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className={styles.empty}>No matching registrations.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
