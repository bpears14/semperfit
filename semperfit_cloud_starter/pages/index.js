import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "workouts", label: "Workouts" },
  { id: "macros", label: "Macros" },
  { id: "weighins", label: "Weigh-Ins" },
  { id: "timeline", label: "Timeline" }
];

function StatCard({ title, value }) {
  return (
    <div className="statCard">
      <div className="statLabel">{title}</div>
      <div className="statValue">{value}</div>
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [weight, setWeight] = useState("");
  const [weightNote, setWeightNote] = useState("");
  const [weights, setWeights] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) loadWeights();
  }, [session]);

  async function signIn() {
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "Signed in.");
  }

  async function signUp() {
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : "Account created.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function loadWeights() {
    const { data, error } = await supabase
      .from("weigh_ins")
      .select("*")
      .eq("user_id", session.user.id)
      .order("weigh_in_date", { ascending: false })
      .limit(20);

    if (error) {
      setMessage(error.message);
      return;
    }
    setWeights(data || []);
  }

  async function saveWeight(e) {
    e.preventDefault();
    setMessage("");
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("weigh_ins").insert({
      user_id: session.user.id,
      weigh_in_date: today,
      weight_lb: Number(weight),
      notes: weightNote || null
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setWeight("");
    setWeightNote("");
    setMessage("Weigh-in saved.");
    loadWeights();
  }

  const latestWeight = useMemo(() => weights[0]?.weight_lb || "—", [weights]);
  const avgWeight = useMemo(() => {
    if (!weights.length) return "—";
    const vals = weights.slice(0, 7).map((w) => Number(w.weight_lb)).filter(Boolean);
    if (!vals.length) return "—";
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }, [weights]);

  if (loading) {
    return <main className="authWrap"><div className="authCard">Loading SemperFit…</div></main>;
  }

  if (!session) {
    return (
      <main className="authWrap">
        <div className="authCard">
          <h1>SemperFit</h1>
          <p className="muted">Dashboard V2 connected to Supabase.</p>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="buttonRow">
            <button className="btn" onClick={signIn}>Sign In</button>
            <button className="btn secondary" onClick={signUp}>Create Account</button>
          </div>
          {message ? <p className="muted">{message}</p> : null}
        </div>
      </main>
    );
  }

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brand">SemperFit</div>
        <div className="subtle">{session.user.email}</div>
        <div className="nav">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "navBtn active" : "navBtn"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button className="btn secondary full" onClick={signOut}>Sign Out</button>
      </aside>

      <section className="main">
        <div className="topbar">
          <div>
            <h1>{tabs.find((t) => t.id === tab)?.label}</h1>
            <p className="muted">SemperFit Dashboard V2</p>
          </div>
          {message ? <div className="message">{message}</div> : null}
        </div>

        {tab === "dashboard" && (
          <>
            <div className="grid grid4">
              <StatCard title="Latest Weight" value={latestWeight === "—" ? "—" : `${latestWeight} lb`} />
              <StatCard title="7-Day Avg" value={avgWeight === "—" ? "—" : `${avgWeight} lb`} />
              <StatCard title="Weigh-Ins Logged" value={String(weights.length)} />
              <StatCard title="Status" value="Live" />
            </div>
            <div className="grid grid2" style={{ marginTop: 16 }}>
              <div className="card">
                <h2>Recent Weigh-Ins</h2>
                {!weights.length ? (
                  <div className="empty">No weigh-ins yet.</div>
                ) : (
                  <div className="stack">
                    {weights.slice(0, 8).map((item) => (
                      <div className="listRow" key={item.id}>
                        <strong>{item.weight_lb} lb</strong>
                        <span>{item.notes || "No notes"}</span>
                        <small>{item.weigh_in_date}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card">
                <h2>What this version includes</h2>
                <ul className="summaryList">
                  <li>Live dashboard</li>
                  <li>Weigh-in logging connected to Supabase</li>
                  <li>Workout tab placeholder</li>
                  <li>Macros tab placeholder</li>
                  <li>Timeline tab placeholder</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {tab === "weighins" && (
          <div className="grid grid2">
            <form className="card" onSubmit={saveWeight}>
              <h2>Log Weigh-In</h2>
              <label>Weight (lb)</label>
              <input
                placeholder="193.0"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
              <label>Notes</label>
              <textarea
                placeholder="Morning fasted weight"
                value={weightNote}
                onChange={(e) => setWeightNote(e.target.value)}
              />
              <button className="btn" type="submit">Save Weigh-In</button>
            </form>

            <div className="card">
              <h2>History</h2>
              {!weights.length ? (
                <div className="empty">No weigh-ins yet.</div>
              ) : (
                <div className="stack">
                  {weights.map((item) => (
                    <div className="listRow" key={item.id}>
                      <strong>{item.weight_lb} lb</strong>
                      <span>{item.notes || "No notes"}</span>
                      <small>{item.weigh_in_date}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "workouts" && (
          <div className="card">
            <h2>Workout Logging</h2>
            <p className="muted">This tab is ready for the next upgrade. I left it in place so we can add your workout form next without changing the layout.</p>
          </div>
        )}

        {tab === "macros" && (
          <div className="card">
            <h2>Macro Tracker</h2>
            <p className="muted">This tab is ready for calories, protein, carbs, and fat logging in the next upgrade.</p>
          </div>
        )}

        {tab === "timeline" && (
          <div className="card">
            <h2>Timeline</h2>
            <p className="muted">This tab is ready for the full SemperFit timeline view once workouts, scans, bloodwork, and uploads are added.</p>
          </div>
        )}
      </section>
    </main>
  );
}
