import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Peptides() {
  const [compound, setCompound] = useState("");
  const [dose, setDose] = useState("");
  const [site, setSite] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");

  async function savePeptide() {
    const { error } = await supabase.from("peptide_logs").insert([
      {
        compound,
        dose,
        injection_site: site,
        frequency,
        notes
      }
    ]);

    if (!error) {
      alert("Peptide logged");
      setCompound("");
      setDose("");
      setSite("");
      setFrequency("");
      setNotes("");
    }
  }

  return (
    <div>
      <h1>Peptides</h1>

      <input placeholder="Compound" value={compound} onChange={e => setCompound(e.target.value)} />
      <input placeholder="Dose" value={dose} onChange={e => setDose(e.target.value)} />
      <input placeholder="Injection Site" value={site} onChange={e => setSite(e.target.value)} />
      <input placeholder="Frequency" value={frequency} onChange={e => setFrequency(e.target.value)} />
      <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />

      <button onClick={savePeptide}>Save</button>
    </div>
  );
}
