import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "workouts", label: "Workouts" },
  { id: "macros", label: "Macros" },
  { id: "weighins", label: "Weigh-Ins + Photos" },
  { id: "supplements", label: "Supplements" },
  { id: "inbody", label: "InBody" },
  { id: "bloodwork", label: "Bloodwork" },
  { id: "timeline", label: "Timeline" }
];

const MARKER_LIBRARY = [
  { label: "Apolipoprotein B (ApoB)", slug: "apolipoprotein_b", category: "lipids", unit: "mg/dL" },
  { label: "Apolipoprotein A1 (ApoA1)", slug: "apolipoprotein_a1", category: "lipids", unit: "mg/dL" },
  { label: "Lipoprotein(a) [Lp(a)]", slug: "lipoprotein_a", category: "lipids", unit: "nmol/L" },
  { label: "LDL Cholesterol", slug: "ldl_cholesterol", category: "lipids", unit: "mg/dL" },
  { label: "HDL Cholesterol", slug: "hdl_cholesterol", category: "lipids", unit: "mg/dL" },
  { label: "Triglycerides", slug: "triglycerides", category: "lipids", unit: "mg/dL" },
  { label: "Total Cholesterol", slug: "total_cholesterol", category: "lipids", unit: "mg/dL" },
  { label: "Non-HDL Cholesterol", slug: "non_hdl_cholesterol", category: "lipids", unit: "mg/dL" },
  { label: "LDL Particle Number (LDL-P)", slug: "ldl_particle_number", category: "lipids", unit: "nmol/L" },
  { label: "Small LDL-P", slug: "small_ldl_p", category: "lipids", unit: "nmol/L" },
  { label: "LDL Size", slug: "ldl_size", category: "lipids", unit: "nm" },
  { label: "HDL Large", slug: "hdl_large", category: "lipids", unit: "umol/L" },

  { label: "Glucose", slug: "glucose", category: "metabolic", unit: "mg/dL" },
  { label: "Hemoglobin A1C", slug: "hemoglobin_a1c", category: "metabolic", unit: "%" },
  { label: "Insulin", slug: "insulin", category: "metabolic", unit: "uIU/mL" },
  { label: "C-Peptide", slug: "c_peptide", category: "metabolic", unit: "ng/mL" },
  { label: "Uric Acid", slug: "uric_acid", category: "metabolic", unit: "mg/dL" },

  { label: "hs-CRP", slug: "hs_crp", category: "inflammation", unit: "mg/L" },
  { label: "Homocysteine", slug: "homocysteine", category: "inflammation", unit: "umol/L" },

  { label: "Ferritin", slug: "ferritin", category: "vitamins", unit: "ng/mL" },
  { label: "Iron", slug: "iron", category: "vitamins", unit: "mcg/dL" },
  { label: "TIBC", slug: "tibc", category: "vitamins", unit: "mcg/dL" },
  { label: "Iron Saturation", slug: "iron_saturation", category: "vitamins", unit: "%" },
  { label: "Vitamin D, 25-OH", slug: "vitamin_d_25_oh", category: "vitamins", unit: "ng/mL" },
  { label: "Vitamin B12", slug: "vitamin_b12", category: "vitamins", unit: "pg/mL" },
  { label: "Folate", slug: "folate", category: "vitamins", unit: "ng/mL" },

  { label: "Magnesium", slug: "magnesium", category: "electrolytes", unit: "mg/dL" },
  { label: "Calcium", slug: "calcium", category: "electrolytes", unit: "mg/dL" },
  { label: "Sodium", slug: "sodium", category: "electrolytes", unit: "mmol/L" },
  { label: "Potassium", slug: "potassium", category: "electrolytes", unit: "mmol/L" },
  { label: "Chloride", slug: "chloride", category: "electrolytes", unit: "mmol/L" },
  { label: "Carbon Dioxide", slug: "carbon_dioxide", category: "electrolytes", unit: "mmol/L" },

  { label: "Total Testosterone", slug: "total_testosterone", category: "hormones", unit: "ng/dL" },
  { label: "Free Testosterone", slug: "free_testosterone", category: "hormones", unit: "pg/mL" },
  { label: "Bioavailable Testosterone", slug: "bioavailable_testosterone", category: "hormones", unit: "ng/dL" },
  { label: "Sex Hormone Binding Globulin (SHBG)", slug: "shbg", category: "hormones", unit: "nmol/L" },
  { label: "Estradiol", slug: "estradiol", category: "hormones", unit: "pg/mL" },
  { label: "DHEA-S", slug: "dhea_s", category: "hormones", unit: "mcg/dL" },
  { label: "LH", slug: "lh", category: "hormones", unit: "mIU/mL" },
  { label: "FSH", slug: "fsh", category: "hormones", unit: "mIU/mL" },
  { label: "Prolactin", slug: "prolactin", category: "hormones", unit: "ng/mL" },
  { label: "PSA Total", slug: "psa_total", category: "hormones", unit: "ng/mL" },
  { label: "PSA Free", slug: "psa_free", category: "hormones", unit: "ng/mL" },
  { label: "Insulin-Like Growth Factor 1 (IGF-1)", slug: "igf_1", category: "hormones", unit: "ng/mL" },
  { label: "Cortisol", slug: "cortisol", category: "hormones", unit: "mcg/dL" },

  { label: "TSH", slug: "tsh", category: "thyroid", unit: "mIU/L" },
  { label: "Free T4", slug: "free_t4", category: "thyroid", unit: "ng/dL" },
  { label: "Free T3", slug: "free_t3", category: "thyroid", unit: "pg/mL" },
  { label: "Total T4", slug: "total_t4", category: "thyroid", unit: "mcg/dL" },
  { label: "Total T3", slug: "total_t3", category: "thyroid", unit: "ng/dL" },
  { label: "Thyroid Peroxidase Antibodies (TPO)", slug: "tpo_antibodies", category: "thyroid", unit: "IU/mL" },
  { label: "Thyroglobulin Antibodies", slug: "thyroglobulin_antibodies", category: "thyroid", unit: "IU/mL" },

  { label: "AST", slug: "ast", category: "liver", unit: "U/L" },
  { label: "ALT", slug: "alt", category: "liver", unit: "U/L" },
  { label: "Alkaline Phosphatase", slug: "alkaline_phosphatase", category: "liver", unit: "U/L" },
  { label: "Bilirubin Total", slug: "bilirubin_total", category: "liver", unit: "mg/dL" },
  { label: "Albumin", slug: "albumin", category: "liver", unit: "g/dL" },
  { label: "Globulin", slug: "globulin", category: "liver", unit: "g/dL" },
  { label: "Total Protein", slug: "total_protein", category: "liver", unit: "g/dL" },
  { label: "GGT", slug: "ggt", category: "liver", unit: "U/L" },

  { label: "Creatinine", slug: "creatinine", category: "kidney", unit: "mg/dL" },
  { label: "eGFR", slug: "egfr", category: "kidney", unit: "mL/min/1.73m2" },
  { label: "BUN", slug: "bun", category: "kidney", unit: "mg/dL" },
  { label: "BUN/Creatinine Ratio", slug: "bun_creatinine_ratio", category: "kidney", unit: "" },
  { label: "Cystatin C", slug: "cystatin_c", category: "kidney", unit: "mg/L" },
  { label: "Microalbumin/Creatinine Ratio", slug: "microalbumin_creatinine_ratio", category: "kidney", unit: "mcg/mg creat" },
  { label: "Microalbumin", slug: "microalbumin", category: "kidney", unit: "mg/dL" },
  { label: "Creatinine, Random Urine", slug: "creatinine_random_urine", category: "kidney", unit: "mg/dL" },

  { label: "White Blood Cell Count", slug: "white_blood_cell_count", category: "cbc", unit: "Thousand/uL" },
  { label: "Red Blood Cell Count", slug: "red_blood_cell_count", category: "cbc", unit: "Million/uL" },
  { label: "Hemoglobin", slug: "hemoglobin", category: "cbc", unit: "g/dL" },
  { label: "Hematocrit", slug: "hematocrit", category: "cbc", unit: "%" },
  { label: "MCV", slug: "mcv", category: "cbc", unit: "fL" },
  { label: "MCH", slug: "mch", category: "cbc", unit: "pg" },
  { label: "MCHC", slug: "mchc", category: "cbc", unit: "g/dL" },
  { label: "RDW", slug: "rdw", category: "cbc", unit: "%" },
  { label: "Platelet Count", slug: "platelet_count", category: "cbc", unit: "Thousand/uL" },
  { label: "MPV", slug: "mpv", category: "cbc", unit: "fL" },
  { label: "Neutrophils", slug: "neutrophils", category: "cbc", unit: "%" },
  { label: "Lymphocytes", slug: "lymphocytes", category: "cbc", unit: "%" },
  { label: "Monocytes", slug: "monocytes", category: "cbc", unit: "%" },
  { label: "Eosinophils", slug: "eosinophils", category: "cbc", unit: "%" },
  { label: "Basophils", slug: "basophils", category: "cbc", unit: "%" },
  { label: "Absolute Neutrophils", slug: "absolute_neutrophils", category: "cbc", unit: "cells/uL" },
  { label: "Absolute Lymphocytes", slug: "absolute_lymphocytes", category: "cbc", unit: "cells/uL" },
  { label: "Absolute Monocytes", slug: "absolute_monocytes", category: "cbc", unit: "cells/uL" },
  { label: "Absolute Eosinophils", slug: "absolute_eosinophils", category: "cbc", unit: "cells/uL" },
  { label: "Absolute Basophils", slug: "absolute_basophils", category: "cbc", unit: "cells/uL" },

  { label: "Urobilinogen", slug: "urobilinogen", category: "other", unit: "" }
];

const MARKER_OPTIONS = MARKER_LIBRARY.map((m) => m.label);

function safeNumberLocal(value) {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function getMarkerValue(marker) {
  const direct = safeNumberLocal(marker?.value_numeric);
  if (direct !== null) return direct;

  if (marker?.value_text) {
    const match = String(marker.value_text).match(/-?\d+(\.\d+)?/);
    if (match) {
      const parsed = Number(match[0]);
      return Number.isNaN(parsed) ? null : parsed;
    }
  }

  return null;
}

function findMarker(markers, names) {
  const lowered = names.map((n) => n.toLowerCase());
  return markers.find((m) => {
    const markerName = String(m.marker_name || "").toLowerCase();
    const markerSlug = String(m.marker_slug || "").toLowerCase();
    return lowered.some(
      (name) => markerName.includes(name) || markerSlug.includes(name)
    );
  });
}

function buildCoaching(markers) {
  const notes = [];

  const apoB = findMarker(markers, ["apob", "apolipoprotein b"]);
  const ldl = findMarker(markers, ["ldl cholesterol", "ldl"]);
  const hdl = findMarker(markers, ["hdl cholesterol", "hdl"]);
  const triglycerides = findMarker(markers, ["triglycerides"]);
  const glucose = findMarker(markers, ["glucose"]);
  const a1c = findMarker(markers, ["hemoglobin a1c", "a1c"]);
  const insulin = findMarker(markers, ["insulin"]);
  const crp = findMarker(markers, ["hs-crp", "crp"]);
  const vitaminD = findMarker(markers, ["vitamin d"]);
  const testosterone = findMarker(markers, ["total testosterone"]);
  const tsh = findMarker(markers, ["tsh"]);

  const apoBVal = getMarkerValue(apoB);
  if (apoBVal !== null) {
    if (apoBVal >= 90) {
      notes.push(`ApoB is ${apoBVal}, which is above an ideal cardiovascular target for many people. This is worth reviewing with your clinician.`);
    } else {
      notes.push(`ApoB is ${apoBVal}, which is a strong cardiovascular marker to keep tracking over time.`);
    }
  }

  const ldlVal = getMarkerValue(ldl);
  if (ldlVal !== null) {
    if (ldlVal >= 100) {
      notes.push(`LDL is ${ldlVal}. If this stays elevated, it is worth pairing with ApoB, triglycerides, and family history when reviewing risk.`);
    } else {
      notes.push(`LDL is ${ldlVal}, which is a favorable result to maintain.`);
    }
  }

  const hdlVal = getMarkerValue(hdl);
  if (hdlVal !== null && hdlVal < 40) {
    notes.push(`HDL is ${hdlVal}, which may improve with consistent training, better sleep, and body composition improvements.`);
  }

  const trigVal = getMarkerValue(triglycerides);
  if (trigVal !== null) {
    if (trigVal >= 150) {
      notes.push(`Triglycerides are ${trigVal}. Reducing alcohol, tightening calorie balance, and improving insulin sensitivity can help.`);
    } else {
      notes.push(`Triglycerides are ${trigVal}, which is a positive metabolic sign.`);
    }
  }

  const glucoseVal = getMarkerValue(glucose);
  if (glucoseVal !== null && glucoseVal >= 100) {
    notes.push(`Glucose is ${glucoseVal}. That may point toward blood sugar control issues, especially when paired with insulin and A1C.`);
  }

  const a1cVal = getMarkerValue(a1c);
  if (a1cVal !== null) {
    if (a1cVal >= 5.7) {
      notes.push(`A1C is ${a1cVal}. This is worth paying attention to for blood sugar control and insulin resistance risk.`);
    } else {
      notes.push(`A1C is ${a1cVal}, which is a solid long-term blood sugar marker.`);
    }
  }

  const insulinVal = getMarkerValue(insulin);
  if (insulinVal !== null && insulinVal > 10) {
    notes.push(`Fasting insulin is ${insulinVal}. Even when glucose looks okay, higher insulin can suggest insulin resistance is developing.`);
  }

  const crpVal = getMarkerValue(crp);
  if (crpVal !== null) {
    if (crpVal > 1) {
      notes.push(`hs-CRP is ${crpVal}, suggesting inflammation is worth monitoring. Sleep, recovery, illness, and body-fat levels can affect this.`);
    } else {
      notes.push(`hs-CRP is ${crpVal}, which is encouraging from an inflammation standpoint.`);
    }
  }

  const vitaminDVal = getMarkerValue(vitaminD);
  if (vitaminDVal !== null) {
    if (vitaminDVal < 30) {
      notes.push(`Vitamin D is ${vitaminDVal}. That is commonly discussed for improvement with sunlight exposure or supplementation under clinician guidance.`);
    } else {
      notes.push(`Vitamin D is ${vitaminDVal}, which is a solid level to maintain.`);
    }
  }

  const testosteroneVal = getMarkerValue(testosterone);
  if (testosteroneVal !== null) {
    if (testosteroneVal < 500) {
      notes.push(`Total testosterone is ${testosteroneVal}. If symptoms exist, this is worth reviewing alongside free testosterone, SHBG, sleep, calories, and recovery.`);
    } else {
      notes.push(`Total testosterone is ${testosteroneVal}, which is a strong number to track over time.`);
    }
  }

  const tshVal = getMarkerValue(tsh);
  if (tshVal !== null && tshVal > 4) {
    notes.push(`TSH is ${tshVal}. That may be worth discussing with your clinician alongside free T4, free T3, symptoms, and thyroid antibodies.`);
  }

  if (!notes.length) {
    notes.push("Your lab panel is saved. Add more markers over time so the coaching becomes more useful.");
  }

  notes.push("This coaching is educational and trend-focused, not a diagnosis. Use it to guide questions for your clinician.");

  return notes;
}

function getLibraryMarkerByLabel(label) {
  return MARKER_LIBRARY.find((m) => m.label === label) || null;
}

function blankBloodworkMarker() {
  return {
    local_id: `${Date.now()}-${Math.random()}`,
    marker_name: "",
    marker_slug: "",
    value: null,
    value_numeric: null,
    value_text: "",
    unit: "",
    reference_range: "",
    reference_range_low: null,
    reference_range_high: null,
    optimal_range: "",
    flag: "unknown",
    category: "other",
    notes: ""
  };
}

function StatCard({ title, value }) {
  return (
    <div className="statCard">
      <div className="statLabel">{title}</div>
      <div className="statValue">{value}</div>
    </div>
  );
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

  const [supplement, setSupplement] = useState({
    log_date: todayISO(),
    supplement_name: "",
    dose: "",
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
    lab_name: ""
  });

  const [bloodworkMarkersDraft, setBloodworkMarkersDraft] = useState([
    blankBloodworkMarker(),
    blankBloodworkMarker(),
    blankBloodworkMarker()
  ]);

  const [inbodyFile, setInbodyFile] = useState(null);
  const [bloodworkFile, setBloodworkFile] = useState(null);

  const [workouts, setWorkouts] = useState([]);
  const [macros, setMacros] = useState([]);
  const [weights, setWeights] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [inbodyRows, setInbodyRows] = useState([]);
  const [bloodworkRows, setBloodworkRows] = useState([]);
  const [bloodworkMarkers, setBloodworkMarkers] = useState([]);

  const [expandedWorkoutId, setExpandedWorkoutId] = useState(null);
  const [expandedMacroId, setExpandedMacroId] = useState(null);
  const [expandedWeighInId, setExpandedWeighInId] = useState(null);
  const [expandedSupplementId, setExpandedSupplementId] = useState(null);
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
      supplementsRes,
      inbodyRes,
      bloodworkRes,
      bloodworkMarkersRes
    ] = await Promise.all([
      supabase.from("workouts").select("*").eq("user_id", userId).order("workout_date", { ascending: false }).limit(50),
      supabase.from("nutrition_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false }).limit(50),
      supabase.from("weigh_ins").select("*").eq("user_id", userId).order("weigh_in_date", { ascending: false }).limit(50),
      supabase.from("progress_photos").select("*").eq("user_id", userId).order("photo_date", { ascending: false }).limit(50),
      supabase.from("timeline_events").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(100),
      supabase.from("peptide_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false }).limit(50),
      supabase.from("inbody_scans").select("*").eq("user_id", userId).order("scan_date", { ascending: false }).limit(50),
      supabase.from("bloodwork_panels").select("*").eq("user_id", userId).order("panel_date", { ascending: false }).limit(50),
      supabase.from("bloodwork_markers").select("*").eq("user_id", userId).order("panel_date", { ascending: false }).limit(500)
    ]);

    setWorkouts(workoutsRes.data || []);
    setMacros(macrosRes.data || []);
    setWeights(weightsRes.data || []);
    setPhotos(photosRes.data || []);
    setTimeline(timelineRes.data || []);
    setSupplements(supplementsRes.data || []);
    setInbodyRows(inbodyRes.data || []);
    setBloodworkRows(bloodworkRes.data || []);
    setBloodworkMarkers(bloodworkMarkersRes.data || []);
  }

  async function uploadToBucket(bucket, file, folder = "") {
    if (!file || !session?.user?.id) return null;

    const safeName = file.name.replace(/\s+/g, "-");
    const filePath = `${session.user.id}/${folder ? `${folder}/` : ""}${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
    if (error) throw error;
    return filePath;
  }

  async function openPrivateFile(bucket, path) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    }
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
      const frontPath = await uploadToBucket("progress-photos", photoFiles.front, "front");
      const sidePath = await uploadToBucket("progress-photos", photoFiles.side, "side");
      const backPath = await uploadToBucket("progress-photos", photoFiles.back, "back");

      if (frontPath || sidePath || backPath) {
        const { error: photoError } = await supabase.from("progress_photos").insert({
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

  async function saveSupplement(e) {
    e.preventDefault();
    setMessage("");

    const notesText = `Frequency: ${supplement.frequency || ""} | Notes: ${supplement.notes || ""}`;

    const { error } = await supabase.from("peptide_logs").insert({
      user_id: session.user.id,
      log_date: supplement.log_date,
      peptide_name: supplement.supplement_name,
      dose: supplement.dose || null,
      notes: notesText
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setSupplement({
      log_date: todayISO(),
      supplement_name: "",
      dose: "",
      frequency: "",
      notes: ""
    });

    setMessage("Supplement saved.");
    loadAll();
  }

  async function saveInbody(e) {
    e.preventDefault();
    setMessage("");

    try {
      const imagePath = await uploadToBucket("inbody-reports", inbodyFile, "reports");

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

  function updateBloodworkDraftMarker(localId, field, value) {
    setBloodworkMarkersDraft((current) =>
      current.map((marker) => {
        if (marker.local_id !== localId) return marker;

        const updated = { ...marker, [field]: value };

        if (field === "marker_name") {
          const libraryMarker = getLibraryMarkerByLabel(value);
          if (libraryMarker) {
            updated.marker_name = libraryMarker.label;
            updated.marker_slug = libraryMarker.slug;
            updated.category = libraryMarker.category;
            if (!updated.unit) {
              updated.unit = libraryMarker.unit || "";
            }
          } else {
            updated.marker_slug = makeSlug(value);
          }
        }

        if (field === "value" || field === "value_numeric") {
          const numeric = safeNumber(value);
          updated.value = numeric;
          updated.value_numeric = numeric;
          updated.value_text =
            value === "" || value === null || value === undefined ? "" : String(value);
        }

        return updated;
      })
    );
  }

  function removeBloodworkDraftMarker(localId) {
    setBloodworkMarkersDraft((current) =>
      current.length <= 1
        ? [blankBloodworkMarker()]
        : current.filter((marker) => marker.local_id !== localId)
    );
  }

  function addBlankBloodworkDraftMarker() {
    setBloodworkMarkersDraft((current) => [...current, blankBloodworkMarker()]);
  }

  async function saveBloodwork(e) {
    e.preventDefault();
    setMessage("");

    try {
      const cleanedRows = bloodworkMarkersDraft
        .map((marker) => ({
          user_id: session.user.id,
          panel_id: null,
          panel_date: bloodwork.panel_date,
          lab_name: bloodwork.lab_name || null,
          marker_name: String(marker.marker_name || "").trim(),
          marker_slug: marker.marker_slug || makeSlug(marker.marker_name || ""),
          value: safeNumber(marker.value),
          value_numeric: safeNumber(marker.value_numeric ?? marker.value),
          value_text:
            marker.value_text ??
            (safeNumber(marker.value_numeric ?? marker.value) !== null
              ? String(safeNumber(marker.value_numeric ?? marker.value))
              : ""),
          unit: marker.unit || "",
          reference_range: marker.reference_range || "",
          reference_range_low: safeNumber(marker.reference_range_low),
          reference_range_high: safeNumber(marker.reference_range_high),
          optimal_range: marker.optimal_range || "",
          flag: marker.flag || "unknown",
          category: marker.category || "other",
          notes: marker.notes || ""
        }))
        .filter((marker) => marker.marker_name);

      if (!cleanedRows.length) {
        setMessage("Enter at least one bloodwork marker before saving.");
        return;
      }

      let reportPath = null;
      if (bloodworkFile) {
        reportPath = await uploadToBucket("lab-reports", bloodworkFile, "reports");
      }

      const summary = buildCoaching(cleanedRows);

      const { data: panelRow, error: panelError } = await supabase
        .from("bloodwork_panels")
        .insert({
          user_id: session.user.id,
          panel_date: bloodwork.panel_date,
          lab_name: bloodwork.lab_name || null,
          report_file: reportPath,
          notes: summary.join("\n")
        })
        .select()
        .single();

      if (panelError) {
        setMessage(panelError.message);
        return;
      }

      const rowsToInsert = cleanedRows.map((marker) => ({
        ...marker,
        panel_id: panelRow.id
      }));

      const { error: insertError } = await supabase.from("bloodwork_markers").insert(rowsToInsert);

      if (insertError) {
        setMessage(insertError.message);
        return;
      }

      setBloodwork({
        panel_date: todayISO(),
        lab_name: ""
      });
      setBloodworkMarkersDraft([
        blankBloodworkMarker(),
        blankBloodworkMarker(),
        blankBloodworkMarker()
      ]);
      setBloodworkFile(null);
      setMessage(`Bloodwork panel saved with ${rowsToInsert.length} markers.`);
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

  const photosByDate = useMemo(() => {
    const map = {};
    for (const photo of photos) {
      if (photo?.photo_date && !map[photo.photo_date]) {
        map[photo.photo_date] = photo;
      }
    }
    return map;
  }, [photos]);

  const bloodworkMarkersByPanelId = useMemo(() => {
    const map = {};
    for (const marker of bloodworkMarkers) {
      if (!map[marker.panel_id]) map[marker.panel_id] = [];
      map[marker.panel_id].push(marker);
    }
    return map;
  }, [bloodworkMarkers]);

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
                      <div className="listRow" key={`${item.type}-${item.date}-${idx}`}>
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
                  <li>Supplements save to Supabase</li>
                  <li>InBody saves to Supabase</li>
                  <li>Bloodwork panels + markers save to Supabase</li>
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
                onChange={(e) => setWorkout({ ...workout, workout_date: e.target.value })}
                required
              />

              <label>Workout type</label>
              <input
                placeholder="Upper Body, Lower Body, Cardio"
                value={workout.workout_type}
                onChange={(e) => setWorkout({ ...workout, workout_type: e.target.value })}
                required
              />

              <label>Duration (minutes)</label>
              <input
                type="number"
                value={workout.duration_minutes}
                onChange={(e) => setWorkout({ ...workout, duration_minutes: e.target.value })}
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
                  <DetailRow label="Duration" value={item.duration_minutes ? `${item.duration_minutes} min` : null} />
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
                  <span>P {item.protein || 0} · C {item.carbs || 0} · F {item.fat || 0}</span>
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
                onChange={(e) => setCheckin({ ...checkin, weigh_in_date: e.target.value })}
                required
              />

              <label>Weight (lb)</label>
              <input
                type="number"
                step="0.1"
                value={checkin.weight_lb}
                onChange={(e) => setCheckin({ ...checkin, weight_lb: e.target.value })}
              />

              <label>Notes</label>
              <textarea
                value={checkin.notes}
                onChange={(e) => setCheckin({ ...checkin, notes: e.target.value })}
              />

              <label>Front photo</label>
              <input
                type="file"
                onChange={(e) => setPhotoFiles({ ...photoFiles, front: e.target.files[0] })}
              />

              <label>Side photo</label>
              <input
                type="file"
                onChange={(e) => setPhotoFiles({ ...photoFiles, side: e.target.files[0] })}
              />

              <label>Back photo</label>
              <input
                type="file"
                onChange={(e) => setPhotoFiles({ ...photoFiles, back: e.target.files[0] })}
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
                const frontUrl = photoSet?.front_photo ? getStorageUrl("progress-photos", photoSet.front_photo) : null;
                const sideUrl = photoSet?.side_photo ? getStorageUrl("progress-photos", photoSet.side_photo) : null;
                const backUrl = photoSet?.back_photo ? getStorageUrl("progress-photos", photoSet.back_photo) : null;

                return (
                  <>
                    <DetailRow label="Date" value={item.weigh_in_date} />
                    <DetailRow label="Weight" value={item.weight_lb ? `${item.weight_lb} lb` : null} />
                    <DetailRow label="Notes" value={item.notes} />

                    <div style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                      <div className="muted" style={{ marginBottom: 8 }}>Front photo</div>
                      {frontUrl ? (
                        <a href={frontUrl} target="_blank" rel="noreferrer">
                          <img src={frontUrl} alt="Front progress" style={{ width: 180, borderRadius: 12, display: "block" }} />
                        </a>
                      ) : (
                        <div>No file</div>
                      )}
                    </div>

                    <div style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                      <div className="muted" style={{ marginBottom: 8 }}>Side photo</div>
                      {sideUrl ? (
                        <a href={sideUrl} target="_blank" rel="noreferrer">
                          <img src={sideUrl} alt="Side progress" style={{ width: 180, borderRadius: 12, display: "block" }} />
                        </a>
                      ) : (
                        <div>No file</div>
                      )}
                    </div>

                    <div style={{ padding: "8px 0" }}>
                      <div className="muted" style={{ marginBottom: 8 }}>Back photo</div>
                      {backUrl ? (
                        <a href={backUrl} target="_blank" rel="noreferrer">
                          <img src={backUrl} alt="Back progress" style={{ width: 180, borderRadius: 12, display: "block" }} />
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

        {tab === "supplements" && (
          <div className="grid grid2">
            <form className="card" onSubmit={saveSupplement}>
              <div className="kicker">Supplement tracker</div>
              <h2>Log supplement</h2>

              <label>Date</label>
              <input
                type="date"
                value={supplement.log_date}
                onChange={(e) => setSupplement({ ...supplement, log_date: e.target.value })}
                required
              />

              <label>Supplement</label>
              <input
                placeholder="Creatine, Fish Oil, Vitamin D, Magnesium"
                value={supplement.supplement_name}
                onChange={(e) => setSupplement({ ...supplement, supplement_name: e.target.value })}
                required
              />

              <label>Dose</label>
              <input
                placeholder="e.g. 5g, 2000 IU, 400mg"
                value={supplement.dose}
                onChange={(e) => setSupplement({ ...supplement, dose: e.target.value })}
              />

              <label>Frequency</label>
              <input
                placeholder="Daily, weekly, twice daily"
                value={supplement.frequency}
                onChange={(e) => setSupplement({ ...supplement, frequency: e.target.value })}
              />

              <label>Notes</label>
              <textarea
                value={supplement.notes}
                onChange={(e) => setSupplement({ ...supplement, notes: e.target.value })}
              />

              <button className="btn" type="submit">
                Save Supplement
              </button>
            </form>

            <ExpandableHistoryCard
              title="Recent supplement logs"
              kicker="History"
              items={supplements}
              expandedId={expandedSupplementId}
              setExpandedId={setExpandedSupplementId}
              renderSummary={(item, isOpen) => (
                <div className="listRow" style={{ borderBottom: "none", padding: 0 }}>
                  <strong>{item.peptide_name || "Supplement"}</strong>
                  <span>{item.dose || "No dose"}</span>
                  <small>{isOpen ? "Hide" : item.log_date}</small>
                </div>
              )}
              renderExpanded={(item) => (
                <>
                  <DetailRow label="Date" value={item.log_date} />
                  <DetailRow label="Supplement" value={item.peptide_name} />
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
                onChange={(e) => setInbody({ ...inbody, scan_date: e.target.value })}
                required
              />

              <label>Weight</label>
              <input
                type="number"
                step="0.1"
                value={inbody.weight}
                onChange={(e) => setInbody({ ...inbody, weight: e.target.value })}
              />

              <label>Skeletal Muscle Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.skeletal_muscle_mass || ""}
                onChange={(e) => setInbody({ ...inbody, skeletal_muscle_mass: e.target.value })}
              />

              <label>Body Fat Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.body_fat_mass || ""}
                onChange={(e) => setInbody({ ...inbody, body_fat_mass: e.target.value })}
              />

              <label>Percent Body Fat</label>
              <input
                type="number"
                step="0.1"
                value={inbody.percent_body_fat || ""}
                onChange={(e) => setInbody({ ...inbody, percent_body_fat: e.target.value })}
              />

              <label>Lean Body Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.lean_body_mass || ""}
                onChange={(e) => setInbody({ ...inbody, lean_body_mass: e.target.value })}
              />

              <label>BMI</label>
              <input
                type="number"
                step="0.1"
                value={inbody.bmi || ""}
                onChange={(e) => setInbody({ ...inbody, bmi: e.target.value })}
              />

              <label>BMR</label>
              <input
                type="number"
                step="1"
                value={inbody.bmr || ""}
                onChange={(e) => setInbody({ ...inbody, bmr: e.target.value })}
              />

              <label>ECW/TBW</label>
              <input
                type="number"
                step="0.001"
                value={inbody.ecw_tbw || ""}
                onChange={(e) => setInbody({ ...inbody, ecw_tbw: e.target.value })}
              />

              <label>Visceral Fat Level</label>
              <input
                type="number"
                step="1"
                value={inbody.visceral_fat || ""}
                onChange={(e) => setInbody({ ...inbody, visceral_fat: e.target.value })}
              />

              <label>Right Arm Lean Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.right_arm_lean || ""}
                onChange={(e) => setInbody({ ...inbody, right_arm_lean: e.target.value })}
              />

              <label>Left Arm Lean Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.left_arm_lean || ""}
                onChange={(e) => setInbody({ ...inbody, left_arm_lean: e.target.value })}
              />

              <label>Trunk Lean Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.trunk_lean || ""}
                onChange={(e) => setInbody({ ...inbody, trunk_lean: e.target.value })}
              />

              <label>Right Leg Lean Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.right_leg_lean || ""}
                onChange={(e) => setInbody({ ...inbody, right_leg_lean: e.target.value })}
              />

              <label>Left Leg Lean Mass</label>
              <input
                type="number"
                step="0.1"
                value={inbody.left_leg_lean || ""}
                onChange={(e) => setInbody({ ...inbody, left_leg_lean: e.target.value })}
              />

              <label>Notes</label>
              <textarea
                value={inbody.notes || ""}
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
                  <DetailRow label="Weight" value={item.weight ? `${item.weight} lb` : null} />
                  <DetailRow label="Skeletal Muscle Mass" value={item.skeletal_muscle_mass ?? item.muscle_mass} />
                  <DetailRow label="Body Fat Mass" value={item.body_fat_mass} />
                  <DetailRow label="Percent Body Fat" value={item.percent_body_fat ?? item.body_fat} />
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
                  <DetailRow label="Scan file" value={item.scan_image_url || item.inbody_pdf || "No file"} />
                </>
              )}
            />
          </div>
        )}

        {tab === "bloodwork" && (
          <div className="grid grid2">
            <form className="card" onSubmit={saveBloodwork}>
              <div className="kicker">Manual entry</div>
              <h2>Save bloodwork panel</h2>

              <label>Panel date</label>
              <input
                type="date"
                value={bloodwork.panel_date}
                onChange={(e) => setBloodwork({ ...bloodwork, panel_date: e.target.value })}
                required
              />

              <label>Lab name</label>
              <input
                placeholder="Function Health, Quest, Labcorp"
                value={bloodwork.lab_name}
                onChange={(e) => setBloodwork({ ...bloodwork, lab_name: e.target.value })}
              />

              <label>Attach PDF for record keeping (optional)</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setBloodworkFile(e.target.files[0])}
              />

              <div style={{ marginTop: 16, marginBottom: 8 }}>
                <div className="kicker">Markers</div>
                <h2 style={{ marginTop: 4 }}>Enter markers manually</h2>
                <p className="muted">
                  Use the searchable dropdown for standardized names. You can also type a custom marker.
                </p>
              </div>

              <datalist id="marker-options">
                {MARKER_OPTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>

              <div className="stack">
                {bloodworkMarkersDraft.map((marker) => (
                  <div
                    key={marker.local_id}
                    style={{
                      border: "1px solid rgba(255,255,255,.08)",
                      borderRadius: 14,
                      padding: 14,
                      background: "rgba(255,255,255,.02)"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 12
                      }}
                    >
                      <strong>{marker.marker_name || "New marker"}</strong>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => removeBloodworkDraftMarker(marker.local_id)}
                      >
                        Remove
                      </button>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 12
                      }}
                    >
                      <div>
                        <label>Marker Name</label>
                        <input
                          type="text"
                          list="marker-options"
                          value={marker.marker_name}
                          onChange={(e) =>
                            updateBloodworkDraftMarker(
                              marker.local_id,
                              "marker_name",
                              e.target.value
                            )
                          }
                          placeholder="Start typing a marker..."
                        />
                      </div>

                      <div>
                        <label>Value</label>
                        <input
                          type="text"
                          value={marker.value_text}
                          onChange={(e) =>
                            updateBloodworkDraftMarker(
                              marker.local_id,
                              "value",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label>Unit</label>
                        <input
                          type="text"
                          value={marker.unit}
                          onChange={(e) =>
                            updateBloodworkDraftMarker(
                              marker.local_id,
                              "unit",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label>Reference Range</label>
                        <input
                          type="text"
                          value={marker.reference_range}
                          onChange={(e) =>
                            updateBloodworkDraftMarker(
                              marker.local_id,
                              "reference_range",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label>Flag</label>
                        <select
                          value={marker.flag}
                          onChange={(e) =>
                            updateBloodworkDraftMarker(
                              marker.local_id,
                              "flag",
                              e.target.value
                            )
                          }
                        >
                          <option value="unknown">unknown</option>
                          <option value="normal">normal</option>
                          <option value="high">high</option>
                          <option value="low">low</option>
                          <option value="borderline">borderline</option>
                        </select>
                      </div>

                      <div>
                        <label>Category</label>
                        <input
                          type="text"
                          value={marker.category}
                          onChange={(e) =>
                            updateBloodworkDraftMarker(
                              marker.local_id,
                              "category",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="muted" style={{ marginTop: 10 }}>
                      slug: {marker.marker_slug || makeSlug(marker.marker_name || "")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="buttonRow" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={addBlankBloodworkDraftMarker}
                >
                  Add Marker
                </button>

                <button className="btn" type="submit">
                  Save Bloodwork Panel
                </button>
              </div>
            </form>

            <ExpandableHistoryCard
              title="Recent bloodwork panels"
              kicker="History"
              items={bloodworkRows}
              expandedId={expandedBloodworkId}
              setExpandedId={setExpandedBloodworkId}
              renderSummary={(item, isOpen) => {
                const panelMarkers = bloodworkMarkersByPanelId[item.id] || [];
                return (
                  <div className="listRow" style={{ borderBottom: "none", padding: 0 }}>
                    <strong>{item.lab_name || "Bloodwork panel"}</strong>
                    <span>
                      {panelMarkers.length} markers
                      {item.notes ? " · Coaching saved" : ""}
                    </span>
                    <small>{isOpen ? "Hide" : item.panel_date}</small>
                  </div>
                );
              }}
              renderExpanded={(item) => {
                const panelMarkers = bloodworkMarkersByPanelId[item.id] || [];

                return (
                  <>
                    <DetailRow label="Panel date" value={item.panel_date} />
                    <DetailRow label="Lab name" value={item.lab_name} />
                    <div style={{ padding: "8px 0" }}>
                      <div className="muted" style={{ marginBottom: 8 }}>
                        Attached report
                      </div>
                      {item.report_file ? (
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => openPrivateFile("lab-reports", item.report_file)}
                        >
                          Open Attached PDF
                        </button>
                      ) : (
                        <div>No file</div>
                      )}
                    </div>

                    <div style={{ paddingTop: 8 }}>
                      <div className="muted" style={{ marginBottom: 8 }}>
                        Markers
                      </div>
                      {!panelMarkers.length ? (
                        <div>No markers</div>
                      ) : (
                        <div className="stack">
                          {panelMarkers.map((marker) => (
                            <div
                              key={marker.id}
                              style={{
                                border: "1px solid rgba(255,255,255,.08)",
                                borderRadius: 12,
                                padding: 12,
                                background: "rgba(255,255,255,.02)"
                              }}
                            >
                              <div className="listRow" style={{ borderBottom: "none", padding: 0 }}>
                                <strong>{marker.marker_name}</strong>
                                <span>
                                  {marker.value_numeric ?? marker.value_text ?? marker.value ?? "—"}{" "}
                                  {marker.unit || ""}
                                </span>
                                <small>{marker.flag || "unknown"}</small>
                              </div>
                              {marker.reference_range ? (
                                <div className="muted" style={{ marginTop: 6 }}>
                                  Range: {marker.reference_range}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <DetailRow label="Coaching" value={item.notes} />
                  </>
                );
              }}
            />
          </div>
        )}

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
