import { useState } from "react";

const tabs=[
 {id:"dashboard",label:"Dashboard"},
 {id:"workouts",label:"Workouts"},
 {id:"macros",label:"Macros"},
 {id:"weighins",label:"Weigh‑Ins"},
 {id:"peptides",label:"Peptides"},
 {id:"inbody",label:"InBody"},
 {id:"bloodwork",label:"Bloodwork"},
 {id:"timeline",label:"Timeline"}
];

export default function Home(){
 const[tab,setTab]=useState("dashboard");

 return(
 <div className="app">
  <div className="sidebar">
   <h2>SemperFit</h2>
   {tabs.map(t=>(
    <div key={t.id}>
     <button onClick={()=>setTab(t.id)}>{t.label}</button>
    </div>
   ))}
  </div>

  <div className="main">

   {tab==="dashboard"&&(
    <div className="card">
     <h2>Dashboard</h2>
     <p>Your health tracking hub.</p>
    </div>
   )}

   {tab==="workouts"&&(
    <div className="card">
     <h2>Workout Log</h2>
     <input placeholder="Workout type"/>
     <input placeholder="Duration minutes"/>
     <textarea placeholder="Notes"/>
     <button>Save Workout</button>
    </div>
   )}

   {tab==="macros"&&(
    <div className="card">
     <h2>Macro Tracker</h2>
     <input placeholder="Calories"/>
     <input placeholder="Protein"/>
     <input placeholder="Carbs"/>
     <input placeholder="Fat"/>
     <button>Save Macros</button>
    </div>
   )}

   {tab==="weighins"&&(
    <div className="card">
     <h2>Weigh‑In</h2>
     <input placeholder="Weight"/>
     <textarea placeholder="Notes"/>
     <button>Save Weigh‑In</button>
    </div>
   )}

   {tab==="peptides"&&(
    <div className="card">
     <h2>Peptide Tracker</h2>
     <input placeholder="Compound"/>
     <input placeholder="Dose"/>
     <input placeholder="Injection site"/>
     <input placeholder="Frequency"/>
     <textarea placeholder="Notes"/>
     <button>Save Peptide</button>
    </div>
   )}

   {tab==="inbody"&&(
    <div className="card">
     <h2>InBody Scan</h2>
     <input placeholder="Weight"/>
     <input placeholder="Body Fat %"/>
     <input placeholder="Muscle Mass"/>
     <input placeholder="Visceral Fat"/>
     <input type="file"/>
     <button>Save Scan</button>
    </div>
   )}

   {tab==="bloodwork"&&(
    <div className="card">
     <h2>Bloodwork Upload</h2>
     <input placeholder="Lab name"/>
     <input type="date"/>
     <input type="file"/>
     <textarea placeholder="Notes"/>
     <button>Upload Lab</button>
    </div>
   )}

   {tab==="timeline"&&(
    <div className="card">
     <h2>Timeline</h2>
     <p>All activity will appear here.</p>
    </div>
   )}

  </div>
 </div>
 )
}
