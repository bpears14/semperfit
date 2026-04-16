import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bloodworkFile, setBloodworkFile] = useState(null);
  const [bloodMarkers, setBloodMarkers] = useState([]);

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

  async function parseBloodwork() {
    try {
      setMessage("");
      setBloodMarkers([]);

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

      setMessage("Extracting markers with AI...");

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

      const markers = Array.isArray(result?.markers) ? result.markers : [];
      setBloodMarkers(markers);

      if (markers.length) {
        setMessage(`Parsed ${markers.length} markers.`);
      } else {
        setMessage("No markers detected from that image.");
      }
    } catch (err) {
      setMessage(err.message || "Something went wrong.");
    }
  }

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
    <div style={{ padding: 40, maxWidth: 800 }}>
      <h1>SemperFit</h1>

      <div style={{ marginBottom: 20 }}>
        <button type="button" onClick={signOut}>
          Sign Out
        </button>
      </div>

      <h2>Bloodwork AI Parser Test</h2>

      <div style={{ display: "grid", gap: 12 }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBloodworkFile(e.target.files?.[0] || null)}
        />

        <button type="button" onClick={parseBloodwork}>
          Upload + Extract with AI
        </button>

        <p>{message}</p>
      </div>

      <hr style={{ margin: "24px 0" }} />

      <h3>Extracted Markers</h3>

      {!bloodMarkers.length ? (
        <p>No markers yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {bloodMarkers.map((marker, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #ccc",
                padding: 10,
                borderRadius: 8
              }}
            >
              <strong>{marker.marker_name || "Unknown marker"}</strong>
              <div>
                {marker.value_numeric ?? marker.value_text ?? "—"} {marker.unit || ""}
              </div>
              <div>{marker.reference_range || ""}</div>
              <div>{marker.flag || ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
