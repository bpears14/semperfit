import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [bloodworkFile, setBloodworkFile] = useState(null);
  const [bloodMarkers, setBloodMarkers] = useState([]);

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  useEffect(() => {

    supabase.auth.getSession().then(({ data })=>{
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event,session)=>{
      setSession(session);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();

  },[]);

  async function signIn(){

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if(error){
      setMessage(error.message);
    }

  }

  async function signUp(){

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if(error){
      setMessage(error.message);
    }

  }

  async function signOut(){
    await supabase.auth.signOut();
  }

  async function parseBloodwork(){

    if(!bloodworkFile){
      setMessage("Upload bloodwork first");
      return;
    }

    setMessage("Uploading bloodwork...");

    const path = `${session.user.id}/bloodwork/${Date.now()}-${bloodworkFile.name}`;

    const { error:uploadError } = await supabase.storage
      .from("bloodwork-reports")
      .upload(path,bloodworkFile,{ upsert:true });

    if(uploadError){
      setMessage(uploadError.message);
      return;
    }

    const { data:signedData,error:signedError } = await supabase.storage
      .from("bloodwork-reports")
      .createSignedUrl(path,600);

    if(signedError){
      setMessage(signedError.message);
      return;
    }

    setMessage("Extracting markers with AI...");

    const res = await fetch(
      "https://kljdmgemuebziqdawmsh.supabase.co/functions/v1/parse-bloodwork",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "apikey":process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          "Authorization":`Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body:JSON.stringify({
          imageUrl:signedData.signedUrl
        })
      }
    );

    const result = await res.json();

    if(!res.ok){
      setMessage(result.error || "AI parser failed");
      return;
    }

    setBloodMarkers(result.markers || []);

    if(result.markers?.length){
      setMessage(`Parsed ${result.markers.length} markers`);
    }else{
      setMessage("No markers detected");
    }

  }

  if(loading){
    return <div style={{padding:40}}>Loading SemperFit...</div>;
  }

  if(!session){

    return(
      <div style={{padding:40}}>

        <h1>SemperFit</h1>

        <input
          placeholder="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <br/><br/>

        <button onClick={signIn}>Sign In</button>
        <button onClick={signUp}>Create Account</button>

        <p>{message}</p>

      </div>
    );

  }

  return(

    <div style={{padding:40}}>

      <h1>SemperFit</h1>

      <button onClick={signOut}>Sign Out</button>

      <hr/>

      <h2>Bloodwork AI Parser</h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e)=>setBloodworkFile(e.target.files[0])}
      />

      <br/><br/>

      <button onClick={parseBloodwork}>
        Upload + Extract with AI
      </button>

      <p>{message}</p>

      <hr/>

      <h3>Extracted Markers</h3>

      {bloodMarkers.map((m,i)=>(
        <div key={i}>
          {m.marker} : {m.value} {m.unit}
        </div>
      ))}

    </div>

  );

}
