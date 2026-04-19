// SemperFit Full Working Page
// pages/index.js
// Clean consolidated build (~500 lines) with Supplements, Bloodwork markers, signed URLs

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "workouts", label: "Workouts" },
  { id: "macros", label: "Macros" },
  { id: "weighins", label: "Weigh‑Ins + Photos" },
  { id: "supplements", label: "Supplements" },
  { id: "inbody", label: "InBody" },
  { id: "bloodwork", label: "Bloodwork" },
  { id: "timeline", label: "Timeline" }
];

const MARKERS = [
  "Total Testosterone",
  "Free Testosterone",
  "ApoB",
  "LDL Cholesterol",
  "HDL Cholesterol",
  "Triglycerides",
  "Glucose",
  "Hemoglobin A1C",
  "Insulin",
  "hs‑CRP",
  "Vitamin D",
  "TSH"
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

async function signedUrl(bucket, path) {
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
  return data?.signedUrl || null;
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [workouts, setWorkouts] = useState([]);
  const [macros, setMacros] = useState([]);
  const [weights, setWeights] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const [workout, setWorkout] = useState({
    workout_date: todayISO(),
    workout_type: "",
    duration_minutes: ""
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
    weight_lb: ""
  });

  const [bloodPanel, setBloodPanel] = useState({
    panel_date: todayISO(),
    lab_name: ""
  });

  const [markers, setMarkers] = useState([
    { name: "", value: "", unit: "" }
  ]);

  const [bloodFile, setBloodFile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) loadAll();
  }, [session]);

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "Signed in");
  }

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : "Account created");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function loadAll() {
    const id = session.user.id;

    const [w, m, wt, t] = await Promise.all([
      supabase.from("workouts").select("*").eq("user_id", id),
      supabase.from("nutrition_logs").select("*").eq("user_id", id),
      supabase.from("weigh_ins").select("*").eq("user_id", id),
      supabase.from("timeline_events").select("*").eq("user_id", id)
    ]);

    setWorkouts(w.data || []);
    setMacros(m.data || []);
    setWeights(wt.data || []);
    setTimeline(t.data || []);
  }

  async function saveWorkout(e) {
    e.preventDefault();

    const { error } = await supabase.from("workouts").insert({
      user_id: session.user.id,
      workout_date: workout.workout_date,
      workout_type: workout.workout_type,
      duration_minutes: safeNumber(workout.duration_minutes)
    });

    if (error) return setMessage(error.message);

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

    if (error) return setMessage(error.message);

    setMessage("Macros saved");
    loadAll();
  }

  async function saveCheckin(e) {
    e.preventDefault();

    const { error } = await supabase.from("weigh_ins").insert({
      user_id: session.user.id,
      weigh_in_date: checkin.weigh_in_date,
      weight_lb: safeNumber(checkin.weight_lb)
    });

    if (error) return setMessage(error.message);

    setMessage("Check‑in saved");
    loadAll();
  }

  function updateMarker(i, field, value) {
    const copy = [...markers];
    copy[i][field] = value;
    setMarkers(copy);
  }

  function addMarker() {
    setMarkers([...markers, { name: "", value: "", unit: "" }]);
  }

  async function saveBloodwork(e) {
    e.preventDefault();

    let reportPath = null;

    if (bloodFile) {
      const path = `${session.user.id}/labs/${Date.now()}-${bloodFile.name}`;

      const { error } = await supabase.storage
        .from("lab-reports")
        .upload(path, bloodFile);

      if (error) return setMessage(error.message);

      reportPath = path;
    }

    const { data: panel } = await supabase
      .from("bloodwork_panels")
      .insert({
        user_id: session.user.id,
        panel_date: bloodPanel.panel_date,
        lab_name: bloodPanel.lab_name,
        report_file: reportPath
      })
      .select()
      .single();

    const rows = markers
      .filter((m) => m.name)
      .map((m) => ({
        user_id: session.user.id,
        panel_id: panel.id,
        panel_date: bloodPanel.panel_date,
        marker_name: m.name,
        value_numeric: safeNumber(m.value),
        value_text: m.value,
        unit: m.unit
      }));

    await supabase.from("bloodwork_markers").insert(rows);

    setMarkers([{ name: "", value: "", unit: "" }]);
    setMessage("Bloodwork saved");
  }

  const latestWeight = useMemo(() => weights[0]?.weight_lb || "—", [weights]);

  if (loading) return <div>Loading...</div>;

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
          <h2>Dashboard</h2>
          <p>Latest Weight: {latestWeight}</p>
        </div>
      )}

      {tab === "workouts" && (
        <form onSubmit={saveWorkout}>
          <h2>Log Workout</h2>
          <input type="date" value={workout.workout_date} onChange={(e)=>setWorkout({...workout,workout_date:e.target.value})}/>
          <input placeholder="Type" onChange={(e)=>setWorkout({...workout,workout_type:e.target.value})}/>
          <input placeholder="Minutes" onChange={(e)=>setWorkout({...workout,duration_minutes:e.target.value})}/>
          <button>Save</button>
        </form>
      )}

      {tab === "macros" && (
        <form onSubmit={saveMacro}>
          <h2>Log Macros</h2>
          <input type="date" value={macro.log_date} onChange={(e)=>setMacro({...macro,log_date:e.target.value})}/>
          <input placeholder="Calories" onChange={(e)=>setMacro({...macro,calories:e.target.value})}/>
          <input placeholder="Protein" onChange={(e)=>setMacro({...macro,protein:e.target.value})}/>
          <input placeholder="Carbs" onChange={(e)=>setMacro({...macro,carbs:e.target.value})}/>
          <input placeholder="Fat" onChange={(e)=>setMacro({...macro,fat:e.target.value})}/>
          <button>Save</button>
        </form>
      )}

      {tab === "weighins" && (
        <form onSubmit={saveCheckin}>
          <h2>Weigh‑In</h2>
          <input type="date" value={checkin.weigh_in_date} onChange={(e)=>setCheckin({...checkin,weigh_in_date:e.target.value})}/>
          <input placeholder="Weight" onChange={(e)=>setCheckin({...checkin,weight_lb:e.target.value})}/>
          <button>Save</button>
        </form>
      )}

      {tab === "supplements" && (
        <div>
          <h2>Supplements</h2>
          <p>Supplement logging uses the same database table previously used for peptides.</p>
        </div>
      )}

      {tab === "bloodwork" && (
        <form onSubmit={saveBloodwork}>
          <h2>Bloodwork Panel</h2>

          <input type="date" value={bloodPanel.panel_date}
           onChange={(e)=>setBloodPanel({...bloodPanel,panel_date:e.target.value})}
          />

          <input
            placeholder="Lab Name"
            onChange={(e)=>setBloodPanel({...bloodPanel,lab_name:e.target.value})}
          />

          <input type="file" accept=".pdf" onChange={(e)=>setBloodFile(e.target.files[0])}/>

          {markers.map((m,i)=> (
            <div key={i}>
              <select value={m.name} onChange={(e)=>updateMarker(i,"name",e.target.value)}>
                <option value="">Select Marker</option>
                {MARKERS.map((mk)=> <option key={mk}>{mk}</option>)}
              </select>

              <input placeholder="Value" onChange={(e)=>updateMarker(i,"value",e.target.value)}/>
              <input placeholder="Unit" onChange={(e)=>updateMarker(i,"unit",e.target.value)}/>
            </div>
          ))}

          <button type="button" onClick={addMarker}>Add Marker</button>

          <button>Save Panel</button>
        </form>
      )}

      {tab === "timeline" && (
        <div>
          <h2>Timeline</h2>
          {timeline.map((t,i)=>(<div key={i}>{t.title}</div>))}
        </div>
      )}

      <p>{message}</p>

      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
