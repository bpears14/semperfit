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
    body_fat: "",
    muscle_mass: "",
    visceral_fat: "",
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
        .limit(25),

      supabase
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", userId)
        .order("log_date", { ascending: false })
        .limit(25),

      supabase
        .from("weigh_ins")
        .select("*")
        .eq("user_id", userId)
        .order("weigh_in_date", { ascending: false })
        .limit(25),

      supabase
        .from("progress_photos")
        .select("*")
        .eq("user_id", userId)
        .order("photo_date", { ascending: false })
        .limit(25),

      supabase
        .from("timeline_events")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(50),

      supabase
        .from("peptide_logs")
        .select("*")
        .eq("user_id", userId)
        .order("log_date", { ascending: false })
        .limit(25),

      supabase
        .from("inbody_scans")
        .select("*")
        .eq("user_id", userId)
        .order("scan_date", { ascending: false })
        .limit(25),

      supabase
        .from("bloodwork_panels")
        .select("*")
        .eq("user_id", userId)
        .order("panel_date", { ascending: false })
        .limit(25)
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
      duration_minutes: workout.duration_minutes
        ? Number(workout.duration_minutes)
        : null,
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
      calories: macro.calories ? Number(macro.calories) : null,
      protein: macro.protein ? Number(macro.protein) : null,
      carbs: macro.carbs ? Number(macro.carbs) : null,
      fat: macro.fat ? Number(macro.fat) : null
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
      weight_lb: checkin.weight_lb ? Number(checkin.weight_lb) : null,
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
      const pdfPath = await uploadToBucket(
        "inbody-reports",
        inbodyFile,
        "reports"
      );

      const { error } = await supabase.from("inbody_scans").insert({
        user_id: session.user.id,
        scan_date: inbody.scan_date,
        weight: inbody.weight ? Number(inbody.weight) : null,
        body_fat: inbody.body_fat ? Number(inbody.body_fat) : null,
        muscle_mass: inbody.muscle_mass ? Number(inbody.muscle_mass) : null,
        visceral_fat: inbody.visceral_fat ? Number(inbody.visceral_fat) : null,
        inbody_pdf: pdfPath,
        notes: inbody.notes || null
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setInbody({
        scan_date: todayISO(),
        weight: "",
        body_fat: "",
        muscle_mass: "",
        visceral_fat: "",
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

            <div className="card">
              <div className="kicker">History</div>
              <h2>Recent workouts</h2>

              {!workouts.length ? (
                <div className="empty">No workouts yet.</div>
              ) : (
                <div className="stack">
                  {workouts.map((item) => (
                    <div className="listRow" key={item.id}>
                      <strong>{item.workout_type}</strong>
                      <span>
                        {item.notes || "No notes"}
                        {item.duration_minutes
                          ? ` · ${item.duration_minutes} min`
                          : ""}
                      </span>
                      <small>{item.workout_date}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

            <div className="card">
              <div className="kicker">History</div>
              <h2>Recent macro logs</h2>

              {!macros.length ? (
                <div className="empty">No macro logs yet.</div>
              ) : (
                <div className="stack">
                  {macros.map((item) => (
                    <div className="listRow" key={item.id}>
                      <strong>{item.calories || 0} cal</strong>
                      <span>
                        P {item.protein || 0} · C {item.carbs || 0} · F{" "}
                        {item.fat || 0}
                      </span>
                      <small>{item.log_date}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

            <div className="card">
              <div className="kicker">History</div>
              <h2>Recent weigh-ins</h2>

              {!weights.length ? (
                <div className="empty">No weigh-ins yet.</div>
              ) : (
                <div className="stack">
                  {weights.map((item) => (
                    <div className="listRow" key={item.id}>
                      <strong>{item.weight_lb ? `${item.weight_lb} lb` : "—"}</strong>
                      <span>{item.notes || "No notes"}</span>
                      <small>{item.weigh_in_date}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

            <div className="card">
              <div className="kicker">History</div>
              <h2>Recent peptide logs</h2>

              {!peptides.length ? (
                <div className="empty">No peptide logs yet.</div>
              ) : (
                <div className="stack">
                  {peptides.map((item) => (
                    <div className="listRow" key={item.id}>
                      <strong>{item.peptide_name || "Peptide"}</strong>
                      <span>
                        {item.dose || "No dose"}
                        {item.notes ? ` · ${item.notes}` : ""}
                      </span>
                      <small>{item.log_date}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                onChange={(e) => setInbody({ ...inbody, weight: e.target.value })}
              />

              <label>Body fat %</label>
              <input
                type="number"
                step="0.1"
                value={inbody.body_fat}
                onChange={(e) =>
                  setInbody({ ...inbody, body_fat: e.target.value })
                }
              />

              <label>Muscle mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.muscle_mass}
                onChange={(e) =>
                  setInbody({ ...inbody, muscle_mass: e.target.value })
                }
              />

              <label>Visceral fat</label>
              <input
                type="number"
                step="0.1"
                value={inbody.visceral_fat}
                onChange={(e) =>
                  setInbody({ ...inbody, visceral_fat: e.target.value })
                }
              />

              <label>Notes</label>
              <textarea
                value={inbody.notes}
                onChange={(e) => setInbody({ ...inbody, notes: e.target.value })}
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

            <div className="card">
              <div className="kicker">History</div>
              <h2>Recent InBody scans</h2>

              {!inbodyRows.length ? (
                <div className="empty">No InBody scans yet.</div>
              ) : (
                <div className="stack">
                  {inbodyRows.map((item) => (
                    <div className="listRow" key={item.id}>
                      <strong>
                        {item.weight ? `${item.weight} lb` : "No weight"}
                      </strong>
                      <span>
                        BF {item.body_fat ?? "—"} · Muscle {item.muscle_mass ?? "—"} ·
                        Visceral {item.visceral_fat ?? "—"}
                      </span>
                      <small>{item.scan_date}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "bloodwork" && (
          <div className="grid grid2">
            <form className="card" onSubmit={saveBloodwork}>
              <div className="kicker">Lab upload</div>
              <h2>Upload bloodwork</h2>

              <label>Panel date</label>
              <input
                type="date"
                value={bloodwork.panel_date}
                onChange={(e) =>
                  setBloodwork({ ...bloodwork, panel_date: e.target.value })
                }
                required
              />

              <label>Lab name</label>
              <input
                placeholder="Function Health, Quest, Labcorp"
                value={bloodwork.lab_name}
                onChange={(e) =>
                  setBloodwork({ ...bloodwork, lab_name: e.target.value })
                }
              />

              <label>Notes</label>
              <textarea
                value={bloodwork.notes}
                onChange={(e) =>
                  setBloodwork({ ...bloodwork, notes: e.target.value })
                }
              />

              <label>Upload report image / PDF</label>
              <input
                type="file"
                onChange={(e) => setBloodworkFile(e.target.files[0])}
              />

              <button className="btn" type="submit">
                Upload Bloodwork
              </button>
            </form>

            <div className="card">
              <div className="kicker">History</div>
              <h2>Recent bloodwork uploads</h2>

              {!bloodworkRows.length ? (
                <div className="empty">No bloodwork uploads yet.</div>
              ) : (
                <div className="stack">
                  {bloodworkRows.map((item) => (
                    <div className="listRow" key={item.id}>
                      <strong>{item.lab_name || "Bloodwork panel"}</strong>
                      <span>{item.notes || "No notes"}</span>
                      <small>{item.panel_date}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "timeline" && (
          <div className="card">
            <div className="kicker">All events</div>
            <h2>Timeline</h2>

            {!timeline.length ? (
              <div className="empty">No timeline entries yet.</div>
            ) : (
              <div className="stack">
                {timeline.map((item, idx) => (
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
        )}
      </section>
    </main>
  );
}
