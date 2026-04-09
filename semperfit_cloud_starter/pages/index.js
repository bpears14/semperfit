import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : "Account created. Check email if confirmation is required.");
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "Signed in.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (!session) {
    return (
      <main className="wrap">
        <div className="card">
          <h1>SemperFit</h1>
          <p>Cloud starter connected to Supabase.</p>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="row">
            <button onClick={signIn}>Sign In</button>
            <button onClick={signUp} className="secondary">Create Account</button>
          </div>
          {message ? <p className="muted">{message}</p> : null}
        </div>
      </main>
    );
  }

  return (
    <main className="wrap">
      <div className="card">
        <h1>SemperFit</h1>
        <p>You are signed in as {session.user.email}</p>
        <p>This starter is connected to your Supabase project. Next step is adding your tracking screens.</p>
        <button onClick={signOut}>Sign Out</button>
      </div>
    </main>
  );
}
