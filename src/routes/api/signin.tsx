import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute('/api/signin')({
  component: RouteComponent,
})

function RouteComponent() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch current session on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        fetchProfile(data.user.id);
      }
    };
    fetchUser();

    // Listen for auth changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

//   useEffect(() => {
//   if (!user) return;
//   console.log("USER UPDATED:", user);
// }, [user]);

// useEffect(() => {
//   if (!profile) return;
//   console.log("PROFILE UPDATED:", profile);
// }, [profile]);

  // Fetch user profile from profiles table
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
    }
  };

  // Signup
  const handleSignup = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) return alert(error.message);

    alert("Signup successful! Check email for confirmation if enabled.");
  };

  // Login
  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return alert(error.message);

    alert("Login successful!");
  };

  // Logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return alert(error.message);
    setUser(null);
    setProfile(null);
  };

  return (
    <div style={{ padding: 20 }}>
      {!user ? (
        <>
          <h2>Signup / Login</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginRight: 10, padding: 5 }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginRight: 10, padding: 5 }}
          />
          <button onClick={handleSignup} disabled={loading} style={{ marginRight: 10 }}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>
          <button onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </>
      ) : (
        <>
          <h2>Welcome, {user.email}</h2>
          {profile && <p>Profile created at: {new Date(profile.created_at).toLocaleString()}</p>}
          <button onClick={handleLogout}>Logout</button>
        </>
      )}
    </div>
  );
}
