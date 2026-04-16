import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "workouts", label: "Workouts" },
  { id: "macros", label: "Macros" },
  { id: "weighins", label: "Weigh-Ins + Photos" },
  { id: "bloodwork", label: "Bloodwork" },
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function safeNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [workout, setWorkout] = useState({
    workout_date: todayISO(),
    workout_type: "",
    duration_minutes: "",
    notes: ""
  });

  const [macro, setMacro] = useState({
    log_date: todayISO(),
    calories: "",
    protein: "",
    carbs: "",
    fat: ""
  });

  const [checkin, setCheckin] = useState({
    weigh_in_date: todayISO(),
    weight_lb: "",
    notes: ""
  });

  const [bloodworkFile, setBloodworkFile] = useState(null);
  const [bloodMarkers, setBloodMarkers] = useState([]);

  const [workouts, setWorkouts] = useState([]);
  const [macros, setMacros] = useState([]);
  const [weights, setWeights] = useState([]);
  const [timeline, setTimeline] = useState([]);

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
    if (session?.user) {
      loadAll();
    }
  }, [session]);

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setMessage(error ? error.message : "Signed in");
  }

  async function signUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    setMessage(error ? error.message : "Account created");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function loadAll() {
    const userId = session.user.id;

    const [workoutsRes, macrosRes, weightsRes, timelineRes] = await Promise.all([
      supabase.from("workouts").select("*").eq("user_id", userId),
      supabase.from("nutrition_logs").select("*").eq("user_id", userId),
      supabase.from("weigh_ins").select("*").eq("user_id", userId),
      supabase.from("timeline_events").select("*").eq("user_id", userId)
    ]);

    setWorkouts(workoutsRes.data || []);
    setMacros(macrosRes.data || []);
    setWeights(weightsRes.data || []);
    setTimeline(timelineRes.data || []);
  }

  async function saveWorkout(e) {
    e.preventDefault();

    const { error } = await supabase.from("workouts").insert({
      user_id: session.user.id,
      workout_date: workout.workout_date,
      workout_type: workout.workout_type,
      duration_minutes: safeNumber(workout.duration_minutes),
      notes: workout.notes
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Workout saved");
    loadAll();
  }

  async function saveMacro(e) {
    e.preventDefault();

    const { error } = await supabase.from("nutrition_logs").insert({
      user_id: session.user.id,
      log_date: macro.log_date,
      calories: safeNumber(macro.calories),
      protein: safeNumber(macro.protein),
      carbs: safeNumber(macro.carbs),
      fat: safeNumber(macro.fat)
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Macros saved");
    loadAll();
  }

  async function saveCheckin(e) {
    e.preventDefault();

    const { error } = await supabase.from("weigh_ins").insert({
      user_id: session.user.id,
      weigh_in_date: checkin.weigh_in_date,
      weight_lb: safeNumber(checkin.weight_lb),
      notes: checkin.notes
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Check-in saved");
    loadAll();
  }

  async function parseBloodwork() {
    if (!bloodworkFile) {
      setMessage("Upload bloodwork first");
      return;
    }

    const path = `${session.user.id}/bloodwork/${Date.now()}-${bloodworkFile.name}`;

    const { error } = await supabase.storage
      .from("bloodwork-reports")
      .upload(path, bloodworkFile);

    if (error) {
      setMessage(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("bloodwork-reports")
      .getPublicUrl(path);

    const res = await fetch(
      "https://kljdmgemuebziqdawmsh.supabase.co/functions/v1/parse-bloodwork",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imageUrl: data.publicUrl
        })
      }
    );

    const result = await res.json();

    setBloodMarkers(result.markers || []);
    setMessage("Bloodwork parsed");
  }

  const latestWeight = useMemo(() => {
    return weights[0]?.weight_lb || "—";
  }, [weights]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <div>
        <h1>SemperFit</h1>
        <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />
        <button onClick={signIn}>Sign In</button>
        <button onClick={signUp}>Create Account</button>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>SemperFit</h1>

      {tabs.map((t) => (
        <button key={t.id} onClick={() => setTab(t.id)}>
          {t.label}
        </button>
      ))}

      {tab === "dashboard" && (
        <div>
          <StatCard title="Latest Weight" value={latestWeight} />
        </div>
      )}

      {tab === "workouts" && (
        <form onSubmit={saveWorkout}>
          <input
            type="date"
            onChange={(e) => setWorkout({ ...workout, workout_date: e.target.value })}
          />
          <input
            placeholder="Type"
            onChange={(e) => setWorkout({ ...workout, workout_type: e.target.value })}
          />
          <button>Save</button>
        </form>
      )}

      {tab === "macros" && (
        <form onSubmit={saveMacro}>
          <input
            type="date"
            onChange={(e) => setMacro({ ...macro, log_date: e.target.value })}
          />
          <input
            placeholder="Calories"
            onChange={(e) => setMacro({ ...macro, calories: e.target.value })}
          />
          <button>Save</button>
        </form>
      )}

      {tab === "weighins" && (
        <form onSubmit={saveCheckin}>
          <input
            type="date"
            onChange={(e) => setCheckin({ ...checkin, weigh_in_date: e.target.value })}
          />
          <input
            placeholder="Weight"
            onChange={(e) => setCheckin({ ...checkin, weight_lb: e.target.value })}
          />
          <button>Save</button>
        </form>
      )}

      {tab === "bloodwork" && (
        <div>
          <h2>Upload Bloodwork</h2>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBloodworkFile(e.target.files[0])}
          />

          <button onClick={parseBloodwork}>Upload + Extract with AI</button>

          {bloodMarkers.length > 0 && (
            <div>
              <h3>Detected Markers</h3>

              {bloodMarkers.map((m, i) => (
                <div key={i}>
                  {m.marker_name} : {m.value_numeric || m.value_text} {m.unit}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "timeline" && (
        <div>
          {timeline.map((t, i) => (
            <div key={i}>{t.title}</div>
          ))}
        </div>
      )}

      <p>{message}</p>

      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
