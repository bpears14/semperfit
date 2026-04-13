import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function InBody() {

  const [weight,setWeight] = useState("");
  const [bodyfat,setBodyfat] = useState("");
  const [muscle,setMuscle] = useState("");
  const [visceral,setVisceral] = useState("");

  async function saveScan(){

    const { error } = await supabase.from("inbody_scans").insert([
      {
        weight,
        bodyfat,
        muscle,
        visceral
      }
    ])

    if(!error){
      alert("Scan saved")
    }
  }

  return(

    <div>
      <h1>InBody Scan</h1>

      <input placeholder="Weight" value={weight} onChange={e=>setWeight(e.target.value)} />
      <input placeholder="Body Fat %" value={bodyfat} onChange={e=>setBodyfat(e.target.value)} />
      <input placeholder="Muscle Mass" value={muscle} onChange={e=>setMuscle(e.target.value)} />
      <input placeholder="Visceral Fat" value={visceral} onChange={e=>setVisceral(e.target.value)} />

      <button onClick={saveScan}>Save Scan</button>

    </div>

  )

}
