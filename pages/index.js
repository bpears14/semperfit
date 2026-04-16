import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function makeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getMarkerValue(marker) {
  if (marker?.value_numeric !== null && marker?.value_numeric !== undefined && marker?.value_numeric !== "") {
    const num = Number(marker.value_numeric);
    if (!Number.isNaN(num)) return num;
  }

  if (marker?.value_text) {
    const match = String(marker.value_text).match(/-?\d+(\.\d+)?/);
    if (match) {
      const num = Number(match[0]);
      if (!Number.isNaN(num)) return num;
    }
  }

  return null;
}

function findMarker(markers, names) {
  const lowered = names.map((n) => n.toLowerCase());
  return markers.find((m) => {
    const markerName = String(m.marker_name || "").toLowerCase();
    const markerSlug = String(m.marker_slug || "").toLowerCase();
    return lowered.some((name) => markerName.includes(name) || markerSlug.includes(name));
  });
}

function buildCoaching(markers) {
  const notes = [];

  const apoB = findMarker(markers, ["apob", "apo b"]);
  const ldl = findMarker(markers, ["ldl"]);
  const hdl = findMarker(markers, ["hdl"]);
  const triglycerides = findMarker(markers, ["triglycerides", "trigs"]);
  const glucose = findMarker(markers, ["glucose"]);
  const a1c = findMarker(markers, ["a1c", "hemoglobin a1c"]);
  const insulin = findMarker(markers, ["insulin"]);
  const crp = findMarker(markers, ["hs-crp", "crp"]);
  const vitaminD = findMarker(markers, ["vitamin d"]);
  const testosterone = findMarker(markers, ["testosterone"]);
  const tsh = findMarker(markers, ["tsh"]);

  const apoBVal = getMarkerValue(apoB);
  if (apoBVal !== null) {
    if (apoBVal >= 90) {
      notes.push(`ApoB is ${apoBVal}, which is above an ideal cardiovascular target for many people. This is worth discussing with your clinician.`);
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
    notes.push("Your bloodwork was parsed, but there were not enough recognized markers for a strong coaching summary yet.");
  }

  notes.push("This coaching is educational and trend-focused, not a diagnosis. Use it to guide questions for your clinician.");

  return notes;
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [bloodworkFile, setBloodworkFile] = useState(null);
  const [bloodMarkers, setBloodMarkers] = useState([]);
  const [bloodworkPanels, setBloodworkPanels] = useState([]);
  const [coaching, setCoaching] = useState([]);
  const [panelDate, setPanelDate] = useState(todayISO());
  const [labName, setLabName] = useState("Function Health");

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
      loadBloodworkHistory();
    }
  }, [session]);

  async function loadBloodworkHistory() {
    const userId = session.user.id;

    const [markersRes, panelsRes] = await Promise.all([
      supabase
        .from("bloodwork_markers")
        .select("*")
        .eq("user_id", userId)
        .order("panel_date", { ascending: false })
        .limit(200),
      supabase
        .from("bloodwork_panels")
        .select("*")
        .eq("user_id", userId)
        .order("panel_date", { ascending: false })
        .limit(50)
    ]);

    setBloodMarkers(markersRes.data || []);
    setBloodworkPanels(panelsRes.data || []);
  }

  async function signIn() {
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setMessage(error ? error.message : "Signed in");
  }

  async function signUp() {
    setMessage("");
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    setMessage(error ? error.message : "Account created");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });
  }

  async function parseAndSaveBloodwork() {
    try {
      setMessage("");
      setCoaching([]);

      if (!session?.user) {
        setMessage("You must be signed in.");
        return;
      }

      if (!bloodworkFile) {
        setMessage("Please choose a bloodwork image first.");
        return;
      }

      setMessage("Reading image...");
      const imageDataUrl = await fileToDataUrl(bloodworkFile);

      setMessage("Sending image to AI parser...");
      const res = await fetch(
        "https://kljdmgemuebziqdawmsh.supabase.co/functions/v1/parse-bloodwork",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            imageDataUrl
          })
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setMessage(result?.error || "AI parser failed");
        return;
      }

      const parsedMarkers = Array.isArray(result?.markers) ? result.markers : [];

      setMessage("Saving bloodwork panel...");

      const { data: panelRow, error: panelError } = await supabase
        .from("bloodwork_panels")
        .insert({
          user_id: session.user.id,
          panel_date: panelDate,
          lab_name: labName || null,
          notes: null
        })
        .select()
        .single();

      if (panelError) {
        setMessage(panelError.message);
        return;
      }

      if (!parsedMarkers.length) {
        setMessage("No markers detected from that image.");
        await loadBloodworkHistory();
        return;
      }

      const rows = parsedMarkers.map((marker) => {
        const valueNumeric =
          marker.value_numeric !== null &&
          marker.value_numeric !== undefined &&
          marker.value_numeric !== ""
            ? Number(marker.value_numeric)
            : null;

        return {
          user_id: session.user.id,
          panel_id: panelRow.id,
          panel_date: panelDate,
          lab_name: labName || null,
          marker_name: marker.marker_name || "Unknown marker",
          marker_slug: makeSlug(marker.marker_name || marker.marker_slug || "unknown_marker"),
          value: valueNumeric,
          value_numeric: valueNumeric,
          value_text:
            marker.value_text ??
            (valueNumeric !== null && !Number.isNaN(valueNumeric) ? String(valueNumeric) : ""),
          unit: marker.unit || "",
          reference_range_low: null,
          reference_range_high: null,
          reference_range: marker.reference_range || "",
          optimal_range: marker.optimal_range || "",
          flag: marker.flag || "unknown",
          category: marker.category || null,
          notes: null
        };
      });

      setMessage("Saving extracted markers...");
      const { error: insertError } = await supabase
        .from("bloodwork_markers")
        .insert(rows);

      if (insertError) {
        setMessage(insertError.message);
        return;
      }

      const summary = buildCoaching(rows);
      setCoaching(summary);

      await supabase
        .from("bloodwork_panels")
        .update({
          notes: summary.join("\n")
        })
        .eq("id", panelRow.id);

      setMessage(`Saved ${rows.length} markers successfully.`);
      setBloodworkFile(null);
      await loadBloodworkHistory();
    } catch (err) {
      setMessage(err.message || "Something went wrong.");
    }
  }

  const groupedByPanel = bloodworkPanels.map((panel) => {
    const markers = bloodMarkers.filter((m) => m.panel_id === panel.id);
    return { panel, markers };
  });

  if (loading) {
    return <div style={{ padding: 40 }}>Loading SemperFit...</div>;
  }

  if (!session) {
    return (
      <div style={{ padding: 40, maxWidth: 500 }}>
        <h1>SemperFit</h1>

        <div style={{ display: "grid", gap: 12 }}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 10 }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: 10 }}
          />

          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={signIn}>
              Sign In
            </button>
            <button type="button" onClick={signUp}>
              Create Account
            </button>
          </div>

          <p>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 1000 }}>
      <h1>SemperFit</h1>

      <div style={{ marginBottom: 20 }}>
        <button type="button" onClick={signOut}>
          Sign Out
        </button>
      </div>

      <h2>Bloodwork AI Parser</h2>

      <div style={{ display: "grid", gap: 12, maxWidth: 600 }}>
        <label>Panel Date</label>
        <input
          type="date"
          value={panelDate}
          onChange={(e) => setPanelDate(e.target.value)}
        />

        <label>Lab Name</label>
        <input
          type="text"
          value={labName}
          onChange={(e) => setLabName(e.target.value)}
          placeholder="Function Health"
        />

        <label>Bloodwork Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBloodworkFile(e.target.files?.[0] || null)}
        />

        <button type="button" onClick={parseAndSaveBloodwork}>
          Upload + Extract + Save
        </button>

        <p>{message}</p>
      </div>

      {coaching.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3>AI Coaching Summary</h3>
          <ul>
            {coaching.map((item, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <hr style={{ margin: "30px 0" }} />

      <h3>Bloodwork History</h3>

      {!groupedByPanel.length ? (
        <p>No bloodwork panels saved yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {groupedByPanel.map(({ panel, markers }) => (
            <div
              key={panel.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: 10,
                padding: 16
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <strong>{panel.lab_name || "Bloodwork Panel"}</strong>
                <div>{panel.panel_date}</div>
              </div>

              {!markers.length ? (
                <p>No markers saved for this panel.</p>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {markers.map((marker) => (
                    <div
                      key={marker.id}
                      style={{
                        border: "1px solid #e5e5e5",
                        borderRadius: 8,
                        padding: 10
                      }}
                    >
                      <strong>{marker.marker_name}</strong>
                      <div>
                        {marker.value_numeric ?? marker.value_text ?? "—"} {marker.unit || ""}
                      </div>
                      <div>{marker.reference_range || ""}</div>
                      <div>{marker.flag || ""}</div>
                    </div>
                  ))}
                </div>
              )}

              {panel.notes ? (
                <div style={{ marginTop: 16 }}>
                  <strong>Coaching</strong>
                  <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                    {panel.notes}
                  </pre>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
