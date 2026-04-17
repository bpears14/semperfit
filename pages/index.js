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
      "Your lab draft is ready for review. Confirm or edit any values that look off before saving."
    );
  }

  notes.push(
    "This coaching is educational and trend-focused, not a diagnosis. Use it to guide questions for your clinician."
  );

  return notes;
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [panelDate, setPanelDate] = useState(todayISO());
  const [labName, setLabName] = useState("");
  const [labFile, setLabFile] = useState(null);

  const [draftMarkers, setDraftMarkers] = useState([]);
  const [bloodworkPanels, setBloodworkPanels] = useState([]);
  const [bloodworkMarkers, setBloodworkMarkers] = useState([]);
  const [coaching, setCoaching] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
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

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });
  }

  function normalizeDraftMarkers(markers) {
    return markers.map((marker, index) => {
      const numeric =
        marker?.value_numeric !== null &&
        marker?.value_numeric !== undefined &&
        marker?.value_numeric !== ""
          ? Number(marker.value_numeric)
          : null;

      return {
        local_id: `${Date.now()}-${index}`,
        marker_name: marker.marker_name || "",
        marker_slug: makeSlug(marker.marker_name || marker.marker_slug || ""),
        value: numeric,
        value_numeric: numeric,
        value_text:
          marker.value_text ??
          (numeric !== null && !Number.isNaN(numeric) ? String(numeric) : ""),
        unit: marker.unit || "",
        reference_range: marker.reference_range || "",
        reference_range_low: null,
        reference_range_high: null,
        optimal_range: marker.optimal_range || "",
        flag: marker.flag || "unknown",
        category: marker.category || "other",
        notes: ""
      };
    });
  }

  async function extractLabDraft() {
    try {
      setMessage("");
      setDraftMarkers([]);
      setCoaching([]);

      if (!session?.user) {
        setMessage("You must be signed in.");
        return;
      }

      if (!labFile) {
        setMessage("Please choose a lab file first.");
        return;
      }

      setIsExtracting(true);
      setMessage(
        labFile.type === "application/pdf" ? "Uploading PDF..." : "Reading image..."
      );

      const fileDataUrl = await fileToDataUrl(labFile);

      setMessage("Extracting draft markers with AI...");

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
            fileDataUrl,
            fileName: labFile.name,
            mimeType: labFile.type,
            labName
          })
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setMessage(result?.error || "AI parser failed");
        return;
      }

      const parsedMarkers = Array.isArray(result?.markers) ? result.markers : [];
      const normalized = normalizeDraftMarkers(parsedMarkers);

      setDraftMarkers(normalized);

      if (normalized.length) {
        setCoaching(buildCoaching(normalized));
        setMessage(
          `Draft ready. Review ${normalized.length} extracted markers, fix anything wrong, then click Confirm + Save Results.`
        );
      } else {
        setMessage("No markers detected from that file.");
      }
    } catch (err) {
      setMessage(err.message || "Something went wrong.");
    } finally {
      setIsExtracting(false);
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
      current.filter((marker) => marker.local_id !== localId)
    );
  }

  function addBlankDraftMarker() {
    setDraftMarkers((current) => [
      ...current,
      {
        local_id: `${Date.now()}-new`,
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
      }
    ]);
  }

  async function confirmAndSaveResults() {
    try {
      setMessage("");

      if (!session?.user) {
        setMessage("You must be signed in.");
        return;
      }

      if (!draftMarkers.length) {
        setMessage("There is no draft to save.");
        return;
      }

      setIsSaving(true);
      setMessage("Saving confirmed results...");

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
        setMessage("Please keep at least one marker before saving.");
        return;
      }

      const summary = buildCoaching(cleanedRows);

      const { data: panelRow, error: panelError } = await supabase
        .from("bloodwork_panels")
        .insert({
          user_id: session.user.id,
          panel_date: panelDate,
          lab_name: labName || null,
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

      const { error: insertError } = await supabase
        .from("bloodwork_markers")
        .insert(rowsToInsert);

      if (insertError) {
        setMessage(insertError.message);
        return;
      }

      setCoaching(summary);
      setDraftMarkers([]);
      setLabFile(null);
      setMessage(`Saved ${rowsToInsert.length} confirmed markers successfully.`);
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

      <h2>Universal Lab Import</h2>

      <div style={{ display: "grid", gap: 12, maxWidth: 700 }}>
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

        <label>Lab File</label>
        <input
          type="file"
          accept="image/*,.pdf,application/pdf"
          onChange={(e) => setLabFile(e.target.files?.[0] || null)}
        />

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={extractLabDraft}
            disabled={isExtracting}
          >
            {isExtracting ? "Extracting Draft..." : "Upload + Extract Draft"}
          </button>

          <button
            type="button"
            onClick={confirmAndSaveResults}
            disabled={isSaving || !draftMarkers.length}
          >
            {isSaving ? "Saving..." : "Confirm + Save Results"}
          </button>

          <button type="button" onClick={addBlankDraftMarker}>
            Add Marker
          </button>
        </div>

        <p>{message}</p>
      </div>

      {draftMarkers.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3>Review Extracted Results Before Saving</h3>

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
                        updateDraftMarker(
                          marker.local_id,
                          "value",
                          e.target.value
                        )
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
                        updateDraftMarker(
                          marker.local_id,
                          "unit",
                          e.target.value
                        )
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
                        updateDraftMarker(
                          marker.local_id,
                          "flag",
                          e.target.value
                        )
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
        </div>
      )}

      {coaching.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3>AI Coaching Preview</h3>
          <ul>
            {coaching.map((item, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

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
