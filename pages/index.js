import { useEffect, useMemo, useState } from "react";
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

function safeNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function getMarkerValue(marker) {
  const direct = safeNumber(marker?.value_numeric);
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

  const apoB = findMarker(markers, ["apob", "apo b"]);
  const ldl = findMarker(markers, ["ldl"]);
  const hdl = findMarker(markers, ["hdl"]);
  const triglycerides = findMarker(markers, ["triglycerides", "trigs"]);
  const glucose = findMarker(markers, ["glucose"]);
  const a1c = findMarker(markers, ["a1c", "hemoglobin a1c"]);
  const insulin = findMarker(markers, ["insulin"]);
  const crp = findMarker(markers, ["hs-crp", "crp"]);
  const vitaminD = findMarker(markers, ["vitamin d"]);
  const testosterone = findMarker(markers, ["total testosterone"]);
  const tsh = findMarker(markers, ["tsh"]);

  const apoBVal = getMarkerValue(apoB);
  if (apoBVal !== null) {
    if (apoBVal >= 90) {
      notes.push(
        `ApoB is ${apoBVal}, which is above an ideal cardiovascular target for many people. This is worth reviewing with your clinician.`
      );
    } else {
      notes.push(
        `ApoB is ${apoBVal}, which is a strong cardiovascular marker to keep tracking over time.`
      );
    }
  }

  const ldlVal = getMarkerValue(ldl);
  if (ldlVal !== null) {
    if (ldlVal >= 100) {
      notes.push(
        `LDL is ${ldlVal}. If this stays elevated, it is worth pairing with ApoB, triglycerides, and family history when reviewing risk.`
      );
    } else {
      notes.push(`LDL is ${ldlVal}, which is a favorable result to maintain.`);
    }
  }

  const hdlVal = getMarkerValue(hdl);
  if (hdlVal !== null && hdlVal < 40) {
    notes.push(
      `HDL is ${hdlVal}, which may improve with consistent training, better sleep, and body composition improvements.`
    );
  }

  const trigVal = getMarkerValue(triglycerides);
  if (trigVal !== null) {
    if (trigVal >= 150) {
      notes.push(
        `Triglycerides are ${trigVal}. Reducing alcohol, tightening calorie balance, and improving insulin sensitivity can help.`
      );
    } else {
      notes.push(
        `Triglycerides are ${trigVal}, which is a positive metabolic sign.`
      );
    }
  }

  const glucoseVal = getMarkerValue(glucose);
  if (glucoseVal !== null && glucoseVal >= 100) {
    notes.push(
      `Glucose is ${glucoseVal}. That may point toward blood sugar control issues, especially when paired with insulin and A1C.`
    );
  }

  const a1cVal = getMarkerValue(a1c);
  if (a1cVal !== null) {
    if (a1cVal >= 5.7) {
      notes.push(
        `A1C is ${a1cVal}. This is worth paying attention to for blood sugar control and insulin resistance risk.`
      );
    } else {
      notes.push(
        `A1C is ${a1cVal}, which is a solid long-term blood sugar marker.`
      );
    }
  }

  const insulinVal = getMarkerValue(insulin);
  if (insulinVal !== null && insulinVal > 10) {
    notes.push(
      `Fasting insulin is ${insulinVal}. Even when glucose looks okay, higher insulin can suggest insulin resistance is developing.`
    );
  }

  const crpVal = getMarkerValue(crp);
  if (crpVal !== null) {
    if (crpVal > 1) {
      notes.push(
        `hs-CRP is ${crpVal}, suggesting inflammation is worth monitoring. Sleep, recovery, illness, and body-fat levels can affect this.`
      );
    } else {
      notes.push(
        `hs-CRP is ${crpVal}, which is encouraging from an inflammation standpoint.`
      );
    }
  }

  const vitaminDVal = getMarkerValue(vitaminD);
  if (vitaminDVal !== null) {
    if (vitaminDVal < 30) {
      notes.push(
        `Vitamin D is ${vitaminDVal}. That is commonly discussed for improvement with sunlight exposure or supplementation under clinician guidance.`
      );
    } else {
      notes.push(
        `Vitamin D is ${vitaminDVal}, which is a solid level to maintain.`
      );
    }
  }

  const testosteroneVal = getMarkerValue(testosterone);
  if (testosteroneVal !== null) {
    if (testosteroneVal < 500) {
      notes.push(
        `Total testosterone is ${testosteroneVal}. If symptoms exist, this is worth reviewing alongside free testosterone, SHBG, sleep, calories, and recovery.`
      );
    } else {
      notes.push(
        `Total testosterone is ${testosteroneVal}, which is a strong number to track over time.`
      );
    }
  }

  const tshVal = getMarkerValue(tsh);
  if (tshVal !== null && tshVal > 4) {
    notes.push(
      `TSH is ${tshVal}. That may be worth discussing with your clinician alongside free T4, free T3, symptoms, and thyroid antibodies.`
    );
  }

  if (!notes.length) {
    notes.push(
      "Your lab panel is saved. Add more markers over time so the coaching becomes more useful."
    );
  }

  notes.push(
    "This coaching is educational and trend-focused, not a diagnosis. Use it to guide questions for your clinician."
  );

  return notes;
}

function blankMarker() {
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

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [panelDate, setPanelDate] = useState(todayISO());
  const [labName, setLabName] = useState("");
  const [reportFile, setReportFile] = useState(null);

  const [draftMarkers, setDraftMarkers] = useState([
    blankMarker(),
    blankMarker(),
    blankMarker()
  ]);

  const [bloodworkPanels, setBloodworkPanels] = useState([]);
  const [bloodworkMarkers, setBloodworkMarkers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

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
      loadLabHistory();
    }
  }, [session]);

  async function loadLabHistory() {
    const userId = session.user.id;

    const [markersRes, panelsRes] = await Promise.all([
      supabase
        .from("bloodwork_markers")
        .select("*")
        .eq("user_id", userId)
        .order("panel_date", { ascending: false })
        .limit(500),
      supabase
        .from("bloodwork_panels")
        .select("*")
        .eq("user_id", userId)
        .order("panel_date", { ascending: false })
        .limit(50)
    ]);

    setBloodworkMarkers(markersRes.data || []);
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

  async function uploadReportFile(file) {
    if (!file || !session?.user) return null;

    const safeName = file.name.replace(/\s+/g, "-");
    const path = `${session.user.id}/lab-reports/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("lab-reports")
      .upload(path, file, { upsert: true });

    if (error) {
      throw error;
    }

    return path;
  }

  async function openReport(path) {
    const { data, error } = await supabase.storage
      .from("lab-reports")
      .createSignedUrl(path, 60);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  function updateDraftMarker(localId, field, value) {
    setDraftMarkers((current) =>
      current.map((marker) => {
        if (marker.local_id !== localId) return marker;

        const updated = { ...marker, [field]: value };

        if (field === "marker_name") {
          updated.marker_slug = makeSlug(value);
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

  function removeDraftMarker(localId) {
    setDraftMarkers((current) =>
      current.length <= 1
        ? [blankMarker()]
        : current.filter((marker) => marker.local_id !== localId)
    );
  }

  function addBlankDraftMarker() {
    setDraftMarkers((current) => [...current, blankMarker()]);
  }

  async function saveManualPanel() {
    try {
      setMessage("");

      if (!session?.user) {
        setMessage("You must be signed in.");
        return;
      }

      const cleanedRows = draftMarkers
        .map((marker) => ({
          user_id: session.user.id,
          panel_id: null,
          panel_date: panelDate,
          lab_name: labName || null,
          marker_name: String(marker.marker_name || "").trim(),
          marker_slug: makeSlug(marker.marker_name || marker.marker_slug || ""),
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
        setMessage("Enter at least one marker before saving.");
        return;
      }

      setIsSaving(true);

      let reportPath = null;
      if (reportFile) {
        reportPath = await uploadReportFile(reportFile);
      }

      const summary = buildCoaching(cleanedRows);

      const { data: panelRow, error: panelError } = await supabase
        .from("bloodwork_panels")
        .insert({
          user_id: session.user.id,
          panel_date: panelDate,
          lab_name: labName || null,
          notes: summary.join("\n"),
          report_file: reportPath
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

      const { error: insertError } = await supabase
        .from("bloodwork_markers")
        .insert(rowsToInsert);

      if (insertError) {
        setMessage(insertError.message);
        return;
      }

      setDraftMarkers([blankMarker(), blankMarker(), blankMarker()]);
      setReportFile(null);
      setLabName("");
      setPanelDate(todayISO());
      setMessage(`Saved panel with ${rowsToInsert.length} markers.`);
      await loadLabHistory();
    } catch (err) {
      setMessage(err.message || "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  const groupedByPanel = useMemo(() => {
    return bloodworkPanels.map((panel) => {
      const markers = bloodworkMarkers.filter((m) => m.panel_id === panel.id);
      return { panel, markers };
    });
  }, [bloodworkPanels, bloodworkMarkers]);

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
    <div style={{ padding: 40, maxWidth: 1200 }}>
      <h1>SemperFit</h1>

      <div style={{ marginBottom: 20 }}>
        <button type="button" onClick={signOut}>
          Sign Out
        </button>
      </div>

      <h2>Manual Bloodwork Entry</h2>

      <div style={{ display: "grid", gap: 12, maxWidth: 800 }}>
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
          placeholder="Quest, Labcorp, Function Health, etc."
        />

        <label>Attach PDF for record keeping (optional)</label>
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => setReportFile(e.target.files?.[0] || null)}
        />

        <div style={{ marginTop: 12 }}>
          <h3>Enter Markers</h3>
          <p style={{ opacity: 0.8 }}>
            Add the markers you care about. You can always add more later.
          </p>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {draftMarkers.map((marker) => (
            <div
              key={marker.local_id}
              style={{
                border: "1px solid #ccc",
                borderRadius: 10,
                padding: 16,
                display: "grid",
                gap: 10
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12
                }}
              >
                <strong>{marker.marker_name || "New Marker"}</strong>
                <button
                  type="button"
                  onClick={() => removeDraftMarker(marker.local_id)}
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
                  <div>Marker Name</div>
                  <input
                    type="text"
                    value={marker.marker_name}
                    onChange={(e) =>
                      updateDraftMarker(
                        marker.local_id,
                        "marker_name",
                        e.target.value
                      )
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <div>Value</div>
                  <input
                    type="text"
                    value={marker.value_text}
                    onChange={(e) =>
                      updateDraftMarker(marker.local_id, "value", e.target.value)
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <div>Unit</div>
                  <input
                    type="text"
                    value={marker.unit}
                    onChange={(e) =>
                      updateDraftMarker(marker.local_id, "unit", e.target.value)
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <div>Reference Range</div>
                  <input
                    type="text"
                    value={marker.reference_range}
                    onChange={(e) =>
                      updateDraftMarker(
                        marker.local_id,
                        "reference_range",
                        e.target.value
                      )
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <div>Flag</div>
                  <input
                    type="text"
                    value={marker.flag}
                    onChange={(e) =>
                      updateDraftMarker(marker.local_id, "flag", e.target.value)
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <div>Category</div>
                  <input
                    type="text"
                    value={marker.category}
                    onChange={(e) =>
                      updateDraftMarker(
                        marker.local_id,
                        "category",
                        e.target.value
                      )
                    }
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" onClick={addBlankDraftMarker}>
            Add Marker
          </button>

          <button type="button" onClick={saveManualPanel} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Panel"}
          </button>
        </div>

        <p>{message}</p>
      </div>

      <hr style={{ margin: "32px 0" }} />

      <h3>Lab History</h3>

      {!groupedByPanel.length ? (
        <p>No lab panels saved yet.</p>
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
                <strong>{panel.lab_name || "Lab Panel"}</strong>
                <div>{panel.panel_date}</div>

                {panel.report_file ? (
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => openReport(panel.report_file)}
                    >
                      Open Attached PDF
                    </button>
                  </div>
                ) : null}
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
                        {marker.value_numeric ??
                          marker.value_text ??
                          marker.value ??
                          "—"}{" "}
                        {marker.unit || ""}
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
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      fontFamily: "inherit"
                    }}
                  >
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
