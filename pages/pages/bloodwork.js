import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Bloodwork(){

  const [file,setFile] = useState(null)

  async function uploadLab(){

    const { data,error } = await supabase.storage
      .from("bloodwork")
      .upload(`labs/${Date.now()}.jpg`, file)

    if(!error){
      alert("Lab uploaded")
    }

  }

  return(

    <div>

      <h1>Bloodwork</h1>

      <input type="file" onChange={e=>setFile(e.target.files[0])}/>

      <button onClick={uploadLab}>Upload Lab</button>

    </div>

  )

}
