import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "workouts", label: "Workouts" },
  { id: "macros", label: "Macros" },
  { id: "weighins", label: "Weigh-Ins + Photos" },
  { id: "peptides", label: "Peptides" },
  { id: "inbody", label: "InBody" },
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

function getStorageUrl(bucket, path) {
  if (!path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}

function DetailRow({ label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,.06)"
      }}
    >
      <div className="muted">{label}</div>
      <div>{value || "—"}</div>
    </div>
  );
}

function ExpandableHistoryCard({
  title,
  kicker,
  items,
  expandedId,
  setExpandedId,
  renderSummary,
  renderExpanded,
  getKey
}) {
  return (
    <div className="card">
      <div className="kicker">{kicker}</div>
      <h2>{title}</h2>

      {!items.length ? (
        <div className="empty">No entries yet.</div>
      ) : (
        <div className="stack">
          {items.map((item, index) => {
            const key = getKey ? getKey(item, index) : item.id || index;
            const isOpen = expandedId === key;

            return (
              <div
                key={key}
                style={{
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 14,
                  padding: 14,
                  background: "rgba(255,255,255,.02)"
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : key)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    padding: 0,
                    textAlign: "left",
                    cursor: "pointer"
                  }}
                >
                  {renderSummary(item, isOpen)}
                </button>

                {isOpen ? (
                  <div style={{ marginTop: 12 }}>{renderExpanded(item)}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
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

  const [photoFiles, setPhotoFiles] = useState({
    front: null,
    side: null,
    back: null
  });

  const [peptide, setPeptide] = useState({
    log_date: todayISO(),
    peptide_name: "",
    dose: "",
    injection_site: "",
    frequency: "",
    notes: ""
  });

  const [inbody, setInbody] = useState({
    scan_date: todayISO(),
    weight: "",
    skeletal_muscle_mass: "",
    body_fat_mass: "",
    percent_body_fat: "",
    lean_body_mass: "",
    bmi: "",
    bmr: "",
    ecw_tbw: "",
    visceral_fat: "",
    right_arm_lean: "",
    left_arm_lean: "",
    trunk_lean: "",
    right_leg_lean: "",
    left_leg_lean: "",
    notes: ""
  });

  const [bloodwork, setBloodwork] = useState({
    panel_date: todayISO(),
    lab_name: "",
    notes: ""
  });

  const [inbodyFile, setInbodyFile] = useState(null);
  const [bloodworkFile, setBloodworkFile] = useState(null);

  const [workouts, setWorkouts] = useState([]);
  const [macros, setMacros] = useState([]);
  const [weights, setWeights] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [peptides, setPeptides] = useState([]);
  const [inbodyRows, setInbodyRows] = useState([]);
  const [bloodworkRows, setBloodworkRows] = useState([]);

  const [expandedWorkoutId, setExpandedWorkoutId] = useState(null);
  const [expandedMacroId, setExpandedMacroId] = useState(null);
  const [expandedWeighInId, setExpandedWeighInId] = useState(null);
  const [expandedPeptideId, setExpandedPeptideId] = useState(null);
  const [expandedInbodyId, setExpandedInbodyId] = useState(null);
  const [expandedBloodworkId, setExpandedBloodworkId] = useState(null);
  const [expandedTimelineId, setExpandedTimelineId] = useState(null);

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
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setMessage(error ? error.message : "Signed in.");
  }

  async function signUp() {
    setMessage("");
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    setMessage(error ? error.message : "Account created.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function loadAll() {
    const userId = session.user.id;

    const [
      workoutsRes,
      macrosRes,
      weightsRes,
      photosRes,
      timelineRes,
      peptidesRes,
      inbodyRes,
      bloodworkRes
    ] = await Promise.all([
      supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userId)
        .order("workout_date", { ascending: false })
        .limit(50),

      supabase
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", userId)
        .order("log_date", { ascending: false })
        .limit(50),

      supabase
        .from("weigh_ins")
        .select("*")
        .eq("user_id", userId)
        .order("weigh_in_date", { ascending: false })
        .limit(50),

      supabase
        .from("progress_photos")
        .select("*")
        .eq("user_id", userId)
        .order("photo_date", { ascending: false })
        .limit(50),

      supabase
        .from("timeline_events")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(100),

      supabase
        .from("peptide_logs")
        .select("*")
        .eq("user_id", userId)
        .order("log_date", { ascending: false })
        .limit(50),

      supabase
        .from("inbody_scans")
        .select("*")
        .eq("user_id", userId)
        .order("scan_date", { ascending: false })
        .limit(50),

      supabase
        .from("bloodwork_panels")
        .select("*")
        .eq("user_id", userId)
        .order("panel_date", { ascending: false })
        .limit(50)
    ]);

    setWorkouts(workoutsRes.data || []);
    setMacros(macrosRes.data || []);
    setWeights(weightsRes.data || []);
    setPhotos(photosRes.data || []);
    setTimeline(timelineRes.data || []);
    setPeptides(peptidesRes.data || []);
    setInbodyRows(inbodyRes.data || []);
    setBloodworkRows(bloodworkRes.data || []);
  }

  async function uploadToBucket(bucket, file, folder = "") {
    if (!file || !session?.user?.id) return null;

    const safeName = file.name.replace(/\s+/g, "-");
    const filePath = `${session.user.id}/${folder ? `${folder}/` : ""}${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    return filePath;
  }

  async function saveWorkout(e) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.from("workouts").insert({
      user_id: session.user.id,
      workout_date: workout.workout_date,
      workout_type: workout.workout_type,
      duration_minutes: safeNumber(workout.duration_minutes),
      notes: workout.notes || null
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setWorkout({
      workout_date: todayISO(),
      workout_type: "",
      duration_minutes: "",
      notes: ""
    });

    setMessage("Workout saved.");
    loadAll();
  }

  async function saveMacro(e) {
    e.preventDefault();
    setMessage("");

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

    setMacro({
      log_date: todayISO(),
      calories: "",
      protein: "",
      carbs: "",
      fat: ""
    });

    setMessage("Macros saved.");
    loadAll();
  }

  async function saveCheckin(e) {
    e.preventDefault();
    setMessage("");

    const { error: weightError } = await supabase.from("weigh_ins").insert({
      user_id: session.user.id,
      weigh_in_date: checkin.weigh_in_date,
      weight_lb: safeNumber(checkin.weight_lb),
      notes: checkin.notes || null
    });

    if (weightError) {
      setMessage(weightError.message);
      return;
    }

    try {
      const frontPath = await uploadToBucket(
        "progress-photos",
        photoFiles.front,
        "front"
      );
      const sidePath = await uploadToBucket(
        "progress-photos",
        photoFiles.side,
        "side"
      );
      const backPath = await uploadToBucket(
        "progress-photos",
        photoFiles.back,
        "back"
      );

      if (frontPath || sidePath || backPath) {
        const { error: photoError } = await supabase
          .from("progress_photos")
          .insert({
            user_id: session.user.id,
            photo_date: checkin.weigh_in_date,
            front_photo: frontPath,
            side_photo: sidePath,
            back_photo: backPath
          });

        if (photoError) {
          setMessage(photoError.message);
          return;
        }
      }

      setCheckin({
        weigh_in_date: todayISO(),
        weight_lb: "",
        notes: ""
      });

      setPhotoFiles({
        front: null,
        side: null,
        back: null
      });

      setMessage("Check-in saved.");
      loadAll();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function savePeptide(e) {
    e.preventDefault();
    setMessage("");

    const notesText = `Injection Site: ${peptide.injection_site || ""} | Frequency: ${peptide.frequency || ""} | Notes: ${peptide.notes || ""}`;

    const { error } = await supabase.from("peptide_logs").insert({
      user_id: session.user.id,
      log_date: peptide.log_date,
      peptide_name: peptide.peptide_name,
      dose: peptide.dose || null,
      notes: notesText
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPeptide({
      log_date: todayISO(),
      peptide_name: "",
      dose: "",
      injection_site: "",
      frequency: "",
      notes: ""
    });

    setMessage("Peptide saved.");
    loadAll();
  }

  async function saveInbody(e) {
    e.preventDefault();
    setMessage("");

    try {
      const imagePath = await uploadToBucket(
        "inbody-reports",
        inbodyFile,
        "reports"
      );

      const { error } = await supabase.from("inbody_scans").insert({
        user_id: session.user.id,
        scan_date: inbody.scan_date,
        weight: safeNumber(inbody.weight),
        skeletal_muscle_mass: safeNumber(inbody.skeletal_muscle_mass),
        body_fat_mass: safeNumber(inbody.body_fat_mass),
        percent_body_fat: safeNumber(inbody.percent_body_fat),
        lean_body_mass: safeNumber(inbody.lean_body_mass),
        bmi: safeNumber(inbody.bmi),
        bmr: safeNumber(inbody.bmr),
        ecw_tbw: safeNumber(inbody.ecw_tbw),
        visceral_fat: safeNumber(inbody.visceral_fat),
        right_arm_lean: safeNumber(inbody.right_arm_lean),
        left_arm_lean: safeNumber(inbody.left_arm_lean),
        trunk_lean: safeNumber(inbody.trunk_lean),
        right_leg_lean: safeNumber(inbody.right_leg_lean),
        left_leg_lean: safeNumber(inbody.left_leg_lean),
        scan_image_url: imagePath,
        inbody_pdf: imagePath,
        notes: inbody.notes || null
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setInbody({
        scan_date: todayISO(),
        weight: "",
        skeletal_muscle_mass: "",
        body_fat_mass: "",
        percent_body_fat: "",
        lean_body_mass: "",
        bmi: "",
        bmr: "",
        ecw_tbw: "",
        visceral_fat: "",
        right_arm_lean: "",
        left_arm_lean: "",
        trunk_lean: "",
        right_leg_lean: "",
        left_leg_lean: "",
        notes: ""
      });

      setInbodyFile(null);
      setMessage("InBody scan saved.");
      loadAll();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function saveBloodwork(e) {
    e.preventDefault();
    setMessage("");

    try {
      const reportPath = await uploadToBucket(
        "bloodwork-reports",
        bloodworkFile,
        "reports"
      );

      const { error } = await supabase.from("bloodwork_panels").insert({
        user_id: session.user.id,
        panel_date: bloodwork.panel_date,
        lab_name: bloodwork.lab_name || null,
        report_pdf: reportPath,
        notes: bloodwork.notes || null
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setBloodwork({
        panel_date: todayISO(),
        lab_name: "",
        notes: ""
      });

      setBloodworkFile(null);
      setMessage("Bloodwork uploaded.");
      loadAll();
    } catch (err) {
      setMessage(err.message);
    }
  }

  const latestWeight = useMemo(
    () => (weights[0]?.weight_lb ? `${weights[0].weight_lb} lb` : "—"),
    [weights]
  );

  const avgWeight = useMemo(() => {
    if (!weights.length) return "—";
    const vals = weights
      .slice(0, 7)
      .map((w) => Number(w.weight_lb))
      .filter((v) => !Number.isNaN(v));
    if (!vals.length) return "—";
    return `${(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)} lb`;
  }, [weights]);

  const workoutCount7 = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return workouts.filter((w) => {
      if (!w.workout_date) return false;
      return new Date(w.workout_date) >= sevenDaysAgo;
    }).length;
  }, [workouts]);

  const avgCalories7 = useMemo(() => {
    if (!macros.length) return "—";
    const vals = macros
      .slice(0, 7)
      .map((m) => Number(m.calories || 0))
      .filter((v) => !Number.isNaN(v));
    if (!vals.length) return "—";
    return `${Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)}`;
  }, [macros]);

  if (loading) {
    return (
      <main className="authWrap">
        <div className="authCard">Loading SemperFit…</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="authWrap">
        <div className="authCard">
          <h1>SemperFit</h1>
          <p className="muted">Cloud tracker connected to Supabase.</p>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="buttonRow">
            <button className="btn" onClick={signIn}>
              Sign In
            </button>
            <button className="btn secondary" onClick={signUp}>
              Create Account
            </button>
          </div>

          {message ? <p className="muted">{message}</p> : null}
        </div>
      </main>
    );
  }

  const photosByDate = {};
  for (const photo of photos) {
    if (photo?.photo_date && !photosByDate[photo.photo_date]) {
      photosByDate[photo.photo_date] = photo;
    }
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

        <button className="btn secondary full" onClick={signOut}>
          Sign Out
        </button>
      </aside>

      <section className="main">
        <div className="topbar">
          <div>
            <h1>{tabs.find((t) => t.id === tab)?.label}</h1>
            <p className="muted">SemperFit V3 Full Tracker</p>
          </div>
          {message ? <div className="message">{message}</div> : null}
        </div>

        {tab === "dashboard" && (
          <>
            <div className="grid grid4">
              <StatCard title="Latest Weight" value={latestWeight} />
              <StatCard title="7-Day Avg Weight" value={avgWeight} />
              <StatCard title="Workouts (7 days)" value={String(workoutCount7)} />
              <StatCard title="Avg Calories (7 logs)" value={avgCalories7} />
            </div>

            <div className="grid grid2" style={{ marginTop: 16 }}>
              <div className="card">
                <div className="kicker">Recent timeline</div>
                <h2>Latest activity</h2>

                {!timeline.length ? (
                  <div className="empty">No timeline entries yet.</div>
                ) : (
                  <div className="stack">
                    {timeline.slice(0, 8).map((item, idx) => (
                      <div
                        className="listRow"
                        key={`${item.type}-${item.date}-${idx}`}
                      >
                        <strong>{item.type}</strong>
                        <span>{item.title}</span>
                        <small>{item.date}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="kicker">Progress summary</div>
                <h2>What is working now</h2>
                <ul className="summaryList">
                  <li>Workout logging saves to Supabase</li>
                  <li>Macros save to Supabase</li>
                  <li>Weigh-ins save to Supabase</li>
                  <li>Front / side / back photos upload to storage</li>
                  <li>Peptides save to Supabase</li>
                  <li>InBody saves to Supabase</li>
                  <li>Bloodwork uploads save to Supabase</li>
                  <li>Timeline reads from your database view</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {tab === "workouts" && (
          <div className="grid grid2">
            <form className="card" onSubmit={saveWorkout}>
              <div className="kicker">Log training</div>
              <h2>Add workout</h2>

              <label>Date</label>
              <input
                type="date"
                value={workout.workout_date}
                onChange={(e) =>
                  setWorkout({ ...workout, workout_date: e.target.value })
                }
                required
              />

              <label>Workout type</label>
              <input
                placeholder="Upper Body, Lower Body, Cardio"
                value={workout.workout_type}
                onChange={(e) =>
                  setWorkout({ ...workout, workout_type: e.target.value })
                }
                required
              />

              <label>Duration (minutes)</label>
              <input
                type="number"
                value={workout.duration_minutes}
                onChange={(e) =>
                  setWorkout({
                    ...workout,
                    duration_minutes: e.target.value
                  })
                }
              />

              <label>Notes</label>
              <textarea
                value={workout.notes}
                onChange={(e) => setWorkout({ ...workout, notes: e.target.value })}
              />

              <button className="btn" type="submit">
                Save Workout
              </button>
            </form>

            <ExpandableHistoryCard
              title="Recent workouts"
              kicker="History"
              items={workouts}
              expandedId={expandedWorkoutId}
              setExpandedId={setExpandedWorkoutId}
              renderSummary={(item, isOpen) => (
                <div className="listRow" style={{ borderBottom: "none", padding: 0 }}>
                  <strong>{item.workout_type || "Workout"}</strong>
                  <span>
                    {item.duration_minutes ? `${item.duration_minutes} min` : "No duration"}
                    {item.notes ? ` · ${item.notes.slice(0, 40)}` : ""}
                  </span>
                  <small>{isOpen ? "Hide" : item.workout_date}</small>
                </div>
              )}
              renderExpanded={(item) => (
                <>
                  <DetailRow label="Date" value={item.workout_date} />
                  <DetailRow label="Workout type" value={item.workout_type} />
                  <DetailRow
                    label="Duration"
                    value={item.duration_minutes ? `${item.duration_minutes} min` : null}
                  />
                  <DetailRow label="Notes" value={item.notes} />
                </>
              )}
            />
          </div>
        )}

        {tab === "macros" && (
          <div className="grid grid2">
            <form className="card" onSubmit={saveMacro}>
              <div className="kicker">Log nutrition</div>
              <h2>Add macro entry</h2>

              <label>Date</label>
              <input
                type="date"
                value={macro.log_date}
                onChange={(e) => setMacro({ ...macro, log_date: e.target.value })}
                required
              />

              <label>Calories</label>
              <input
                type="number"
                value={macro.calories}
                onChange={(e) => setMacro({ ...macro, calories: e.target.value })}
              />

              <label>Protein</label>
              <input
                type="number"
                value={macro.protein}
                onChange={(e) => setMacro({ ...macro, protein: e.target.value })}
              />

              <label>Carbs</label>
              <input
                type="number"
                value={macro.carbs}
                onChange={(e) => setMacro({ ...macro, carbs: e.target.value })}
              />

              <label>Fat</label>
              <input
                type="number"
                value={macro.fat}
                onChange={(e) => setMacro({ ...macro, fat: e.target.value })}
              />

              <button className="btn" type="submit">
                Save Macros
              </button>
            </form>

            <ExpandableHistoryCard
              title="Recent macro logs"
              kicker="History"
              items={macros}
              expandedId={expandedMacroId}
              setExpandedId={setExpandedMacroId}
              renderSummary={(item, isOpen) => (
                <div className="listRow" style={{ borderBottom: "none", padding: 0 }}>
                  <strong>{item.calories || 0} cal</strong>
                  <span>
                    P {item.protein || 0} · C {item.carbs || 0} · F {item.fat || 0}
                  </span>
                  <small>{isOpen ? "Hide" : item.log_date}</small>
                </div>
              )}
              renderExpanded={(item) => (
                <>
                  <DetailRow label="Date" value={item.log_date} />
                  <DetailRow label="Calories" value={item.calories} />
                  <DetailRow label="Protein" value={item.protein} />
                  <DetailRow label="Carbs" value={item.carbs} />
                  <DetailRow label="Fat" value={item.fat} />
                </>
              )}
            />
          </div>
        )}

        {tab === "weighins" && (
          <div className="grid grid2">
            <form className="card" onSubmit={saveCheckin}>
              <div className="kicker">Check-in</div>
              <h2>Weigh-In + Photos</h2>

              <label>Date</label>
              <input
                type="date"
                value={checkin.weigh_in_date}
                onChange={(e) =>
                  setCheckin({ ...checkin, weigh_in_date: e.target.value })
                }
                required
              />

              <label>Weight (lb)</label>
              <input
                type="number"
                step="0.1"
                value={checkin.weight_lb}
                onChange={(e) =>
                  setCheckin({ ...checkin, weight_lb: e.target.value })
                }
              />

              <label>Notes</label>
              <textarea
                value={checkin.notes}
                onChange={(e) => setCheckin({ ...checkin, notes: e.target.value })}
              />

              <label>Front photo</label>
              <input
                type="file"
                onChange={(e) =>
                  setPhotoFiles({ ...photoFiles, front: e.target.files[0] })
                }
              />

              <label>Side photo</label>
              <input
                type="file"
                onChange={(e) =>
                  setPhotoFiles({ ...photoFiles, side: e.target.files[0] })
                }
              />

              <label>Back photo</label>
              <input
                type="file"
                onChange={(e) =>
                  setPhotoFiles({ ...photoFiles, back: e.target.files[0] })
                }
              />

              <button className="btn" type="submit">
                Save Check-In
              </button>
            </form>

            <ExpandableHistoryCard
              title="Recent weigh-ins"
              kicker="History"
              items={weights}
              expandedId={expandedWeighInId}
              setExpandedId={setExpandedWeighInId}
              renderSummary={(item, isOpen) => (
                <div className="listRow" style={{ borderBottom: "none", padding: 0 }}>
                  <strong>{item.weight_lb ? `${item.weight_lb} lb` : "—"}</strong>
                  <span>{item.notes || "No notes"}</span>
                  <small>{isOpen ? "Hide" : item.weigh_in_date}</small>
                </div>
              )}
              renderExpanded={(item) => {
                const photoSet = photosByDate[item.weigh_in_date] || null;
                const frontUrl = photoSet?.front_photo
                  ? getStorageUrl("progress-photos", photoSet.front_photo)
                  : null;
                const sideUrl = photoSet?.side_photo
                  ? getStorageUrl("progress-photos", photoSet.side_photo)
                  : null;
                const backUrl = photoSet?.back_photo
                  ? getStorageUrl("progress-photos", photoSet.back_photo)
                  : null;

                return (
                  <>
                    <DetailRow label="Date" value={item.weigh_in_date} />
                    <DetailRow
                      label="Weight"
                      value={item.weight_lb ? `${item.weight_lb} lb` : null}
                    />
                    <DetailRow label="Notes" value={item.notes} />

                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(255,255,255,.06)"
                      }}
                    >
                      <div className="muted" style={{ marginBottom: 8 }}>
                        Front photo
                      </div>
                      {frontUrl ? (
                        <a href={frontUrl} target="_blank" rel="noreferrer">
                          <img
                            src={frontUrl}
                            alt="Front progress"
                            style={{ width: 180, borderRadius: 12, display: "block" }}
                          />
                        </a>
                      ) : (
                        <div>No file</div>
                      )}
                    </div>

                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(255,255,255,.06)"
                      }}
                    >
                      <div className="muted" style={{ marginBottom: 8 }}>
                        Side photo
                      </div>
                      {sideUrl ? (
                        <a href={sideUrl} target="_blank" rel="noreferrer">
                          <img
                            src={sideUrl}
                            alt="Side progress"
                            style={{ width: 180, borderRadius: 12, display: "block" }}
                          />
                        </a>
                      ) : (
                        <div>No file</div>
                      )}
                    </div>

                    <div style={{ padding: "8px 0" }}>
                      <div className="muted" style={{ marginBottom: 8 }}>
                        Back photo
                      </div>
                      {backUrl ? (
                        <a href={backUrl} target="_blank" rel="noreferrer">
                          <img
                            src={backUrl}
                            alt="Back progress"
                            style={{ width: 180, borderRadius: 12, display: "block" }}
                          />
                        </a>
                      ) : (
                        <div>No file</div>
                      )}
                    </div>
                  </>
                );
              }}
            />
          </div>
        )}

        {tab === "peptides" && (
          <div className="grid grid2">
            <form className="card" onSubmit={savePeptide}>
              <div className="kicker">Protocol tracker</div>
              <h2>Log peptide</h2>

              <label>Date</label>
              <input
                type="date"
                value={peptide.log_date}
                onChange={(e) =>
                  setPeptide({ ...peptide, log_date: e.target.value })
                }
                required
              />

              <label>Compound</label>
              <input
                placeholder="BPC-157, TB-500, Retatrutide"
                value={peptide.peptide_name}
                onChange={(e) =>
                  setPeptide({ ...peptide, peptide_name: e.target.value })
                }
                required
              />

              <label>Dose</label>
              <input
                placeholder="e.g. 250mcg or 1.5mg"
                value={peptide.dose}
                onChange={(e) => setPeptide({ ...peptide, dose: e.target.value })}
              />

              <label>Injection site</label>
              <input
                placeholder="Abdomen, shoulder, thigh"
                value={peptide.injection_site}
                onChange={(e) =>
                  setPeptide({ ...peptide, injection_site: e.target.value })
                }
              />

              <label>Frequency</label>
              <input
                placeholder="Daily, weekly, twice weekly"
                value={peptide.frequency}
                onChange={(e) =>
                  setPeptide({ ...peptide, frequency: e.target.value })
                }
              />

              <label>Notes</label>
              <textarea
                value={peptide.notes}
                onChange={(e) => setPeptide({ ...peptide, notes: e.target.value })}
              />

              <button className="btn" type="submit">
                Save Peptide
              </button>
            </form>

            <ExpandableHistoryCard
              title="Recent peptide logs"
              kicker="History"
              items={peptides}
              expandedId={expandedPeptideId}
              setExpandedId={setExpandedPeptideId}
              renderSummary={(item, isOpen) => (
                <div className="listRow" style={{ borderBottom: "none", padding: 0 }}>
                  <strong>{item.peptide_name || "Peptide"}</strong>
                  <span>{item.dose || "No dose"}</span>
                  <small>{isOpen ? "Hide" : item.log_date}</small>
                </div>
              )}
              renderExpanded={(item) => (
                <>
                  <DetailRow label="Date" value={item.log_date} />
                  <DetailRow label="Compound" value={item.peptide_name} />
                  <DetailRow label="Dose" value={item.dose} />
                  <DetailRow label="Full notes" value={item.notes} />
                </>
              )}
            />
          </div>
        )}

        {tab === "inbody" && (
          <div className="grid grid2">
            <form className="card" onSubmit={saveInbody}>
              <div className="kicker">Body composition</div>
              <h2>Add InBody scan</h2>

              <label>Scan date</label>
              <input
                type="date"
                value={inbody.scan_date}
                onChange={(e) =>
                  setInbody({ ...inbody, scan_date: e.target.value })
                }
                required
              />

              <label>Weight</label>
              <input
                type="number"
                step="0.1"
                value={inbody.weight}
                onChange={(e) =>
                  setInbody({ ...inbody, weight: e.target.value })
                }
              />

              <label>Skeletal Muscle Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.skeletal_muscle_mass || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, skeletal_muscle_mass: e.target.value })
                }
              />

              <label>Body Fat Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.body_fat_mass || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, body_fat_mass: e.target.value })
                }
              />

              <label>Percent Body Fat</label>
              <input
                type="number"
                step="0.1"
                value={inbody.percent_body_fat || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, percent_body_fat: e.target.value })
                }
              />

              <label>Lean Body Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.lean_body_mass || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, lean_body_mass: e.target.value })
                }
              />

              <label>BMI</label>
              <input
                type="number"
                step="0.1"
                value={inbody.bmi || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, bmi: e.target.value })
                }
              />

              <label>BMR</label>
              <input
                type="number"
                step="1"
                value={inbody.bmr || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, bmr: e.target.value })
                }
              />

              <label>ECW/TBW</label>
              <input
                type="number"
                step="0.001"
                value={inbody.ecw_tbw || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, ecw_tbw: e.target.value })
                }
              />

              <label>Visceral Fat Level</label>
              <input
                type="number"
                step="1"
                value={inbody.visceral_fat || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, visceral_fat: e.target.value })
                }
              />

              <label>Right Arm Lean Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.right_arm_lean || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, right_arm_lean: e.target.value })
                }
              />

              <label>Left Arm Lean Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.left_arm_lean || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, left_arm_lean: e.target.value })
                }
              />

              <label>Trunk Lean Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.trunk_lean || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, trunk_lean: e.target.value })
                }
              />

              <label>Right Leg Lean Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.right_leg_lean || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, right_leg_lean: e.target.value })
                }
              />

              <label>Left Leg Lean Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.left_leg_lean || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, left_leg_lean: e.target.value })
                }
              />

              <label>Notes</label>
              <textarea
                value={inbody.notes || ""}
                onChange={(e) =>
                  setInbody({ ...inbody, notes: e.target.value })
                }
              />

              <label>Upload scan image / PDF</label>
              <input
                type="file"
                onChange={(e) => setInbodyFile(e.target.files[0])}
              />

              <button className="btn" type="submit">
                Save InBody Scan
              </button>
            </form>

            <ExpandableHistoryCard
              title="Recent InBody scans"
              kicker="History"
              items={inbodyRows}
              expandedId={expandedInbodyId}
              setExpandedId={setExpandedInbodyId}
              renderSummary={(item, isOpen) => (
                <div className="listRow" style={{ borderBottom: "none", padding: 0 }}>
                  <strong>{item.weight ? `${item.weight} lb` : "No weight"}</strong>
                  <span>
                    SMM {item.skeletal_muscle_mass ?? item.muscle_mass ?? "—"} ·
                    PBF {item.percent_body_fat ?? item.body_fat ?? "—"} ·
                    BFM {item.body_fat_mass ?? "—"} ·
                    Visceral {item.visceral_fat ?? "—"}
                  </span>
                  <small>{isOpen ? "Hide" : item.scan_date}</small>
                </div>
              )}
              renderExpanded={(item) => (
                <>
                  <DetailRow label="Scan date" value={item.scan_date} />
                  <DetailRow
                    label="Weight"
                    value={item.weight ? `${item.weight} lb` : null}
                  />
                  <DetailRow
                    label="Skeletal Muscle Mass"
                    value={item.skeletal_muscle_mass ?? item.muscle_mass}
                  />
                  <DetailRow label="Body Fat Mass" value={item.body_fat_mass} />
                  <DetailRow
                    label="Percent Body Fat"
                    value={item.percent_body_fat ?? item.body_fat}
                  />
                  <DetailRow label="Lean Body Mass" value={item.lean_body_mass} />
                  <DetailRow label="BMI" value={item.bmi} />
                  <DetailRow label="BMR" value={item.bmr} />
                  <DetailRow label="ECW/TBW" value={item.ecw_tbw} />
                  <DetailRow label="Visceral Fat Level" value={item.visceral_fat} />
                  <DetailRow label="Right Arm Lean" value={item.right_arm_lean} />
                  <DetailRow label="Left Arm Lean" value={item.left_arm_lean} />
                  <DetailRow label="Trunk Lean" value={item.trunk_lean} />
                  <DetailRow label="Right Leg Lean" value={item.right_leg_lean} />
                  <DetailRow label="Left Leg Lean" value={item.left_leg_lean} />
                  <DetailRow label="Notes" value={item.notes} />
                  <DetailRow
                    label="Scan file"
                    value={item.scan_image_url || item.inbody_pdf || "No file"}
                  />
                </>
              )}
            />
          </div>
        )}

        {// SemperFit Full Working Page
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
  "Apolipoprotein B (ApoB)",
  "Apolipoprotein A1 (ApoA1)",
  "Lipoprotein(a)",
  "LDL Cholesterol",
  "HDL Cholesterol",
  "Triglycerides",
  "Total Cholesterol",
  "Non-HDL Cholesterol",
  "Glucose",
  "Hemoglobin A1C",
  "Insulin",
  "C-Peptide",
  "Uric Acid",
  "hs-CRP",
  "Homocysteine",
  "Ferritin",
  "Iron",
  "TIBC",
  "Iron Saturation",
  "Vitamin D",
  "Vitamin B12",
  "Folate",
  "Magnesium",
  "Calcium",
  "Sodium",
  "Potassium",
  "Chloride",
  "Carbon Dioxide",
  "Total Testosterone",
  "Free Testosterone",
  "Bioavailable Testosterone",
  "SHBG",
  "Estradiol",
  "DHEA-S",
  "LH",
  "FSH",
  "Prolactin",
  "PSA Total",
  "PSA Free",
  "TSH",
  "Free T4",
  "Free T3",
  "AST",
  "ALT",
  "Alkaline Phosphatase",
  "Bilirubin Total",
  "Albumin",
  "Globulin",
  "Total Protein",
  "GGT",
  "Creatinine",
  "eGFR",
  "BUN",
  "Cystatin C",
  "White Blood Cell Count",
  "Red Blood Cell Count",
  "Hemoglobin",
  "Hematocrit",
  "Platelet Count"
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

          <div style={{marginBottom:20}}>
            <label>Panel Date</label>
            <input
              type="date"
              value={bloodPanel.panel_date}
              onChange={(e)=>setBloodPanel({...bloodPanel,panel_date:e.target.value})}
            />
          </div>

          <div style={{marginBottom:20}}>
            <label>Lab Name</label>
            <input
              placeholder="Quest, Labcorp, Function Health, etc"
              value={bloodPanel.lab_name}
              onChange={(e)=>setBloodPanel({...bloodPanel,lab_name:e.target.value})}
            />
          </div>

          <div style={{marginBottom:20}}>
            <label>Attach PDF (optional)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e)=>setBloodFile(e.target.files[0])}
            />
          </div>

          <h3>Markers</h3>

          {markers.map((m,i)=> (
            <div
              key={i}
              style={{
                border:"1px solid #ddd",
                padding:10,
                marginBottom:10,
                borderRadius:8
              }}
            >

              <div>
                <label>Marker</label>
                <select
                  value={m.name}
                  onChange={(e)=>updateMarker(i,"name",e.target.value)}
                >
                  <option value="">Select Marker</option>
                  {MARKERS.map((mk)=> (
                    <option key={mk} value={mk}>{mk}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Value</label>
                <input
                  placeholder="Value"
                  value={m.value}
                  onChange={(e)=>updateMarker(i,"value",e.target.value)}
                />
              </div>

              <div>
                <label>Unit</label>
                <input
                  placeholder="mg/dL, ng/mL, etc"
                  value={m.unit}
                  onChange={(e)=>updateMarker(i,"unit",e.target.value)}
                />
              </div>

            </div>
          ))}

          <button type="button" onClick={addMarker}>
            Add Marker
          </button>

          <div style={{marginTop:20}}>
            <button type="submit">Save Bloodwork Panel</button>
          </div>

        </form>
      )}
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


        {tab === "timeline" && (
          <ExpandableHistoryCard
            title="Timeline"
            kicker="All events"
            items={timeline}
            expandedId={expandedTimelineId}
            setExpandedId={setExpandedTimelineId}
            renderSummary={(item, isOpen) => (
              <div className="listRow" style={{ borderBottom: "none", padding: 0 }}>
                <strong>{item.type}</strong>
                <span>{item.title}</span>
                <small>{isOpen ? "Hide" : item.date}</small>
              </div>
            )}
            renderExpanded={(item) => (
              <>
                <DetailRow label="Date" value={item.date} />
                <DetailRow label="Type" value={item.type} />
                <DetailRow label="Title" value={item.title} />
                <DetailRow label="Description" value={item.description} />
              </>
            )}
          />
        )}
      </section>
    </main>
  );
}
