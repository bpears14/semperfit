import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Bloodwork() {
  const [file, setFile] = useState(null);
  const [panelDate, setPanelDate] = useState("");
  const [labName, setLabName] = useState("");
  const [notes, setNotes] = useState("");

  async function uploadLab() {
    if (!file) {
      alert("Please select a lab report file.");
      return;
    }

    const filePath = `labs/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("bloodwork-reports")
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const { error: dbError } = await supabase
      .from("bloodwork_panels")
      .insert([
        {
          panel_date: panelDate || null,
          lab_name: labName || null,
          report_pdf: filePath,
          notes: notes || null
        }
      ]);

    if (dbError) {
      alert(dbError.message);
      return;
    }

    alert("Bloodwork uploaded successfully");
    setFile(null);
    setPanelDate("");
    setLabName("");
    setNotes("");
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Bloodwork Upload</h1>

      <div style={{ marginBottom: 10 }}>
        <input
          type="date"
          value={panelDate}
          onChange={(e) => setPanelDate(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Lab name"
          value={labName}
          onChange={(e) => setLabName(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>

      <button onClick={uploadLab}>Upload Lab Report</button>
    </div>
  );
}
