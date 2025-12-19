import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute('/')({
    ssr: false,
   loader: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    // console.log(session?.user)
    if (session?.user) {
      throw redirect({
        to: "/pdf",
      });
    }
  },
  component: RouteComponent
})

function RouteComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Signup
  const handleSignup = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) return setError(error.message);

      navigate({ to: "/pdf" , replace: true });
  };

  // Login
  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);

      navigate({ to: "/pdf" , replace: true });
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="bg-white w-full max-w-sm p-8 rounded-2xl shadow-xl flex flex-col gap-6">

      <h2 className="text-2xl font-bold text-center">Login / Signup</h2>

      {/* Floating Label Email */}
      <div className="relative">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="peer w-full border border-gray-300 rounded-xl px-4 py-3 
                     focus:outline-none focus:border-indigo-500 transition"
        />
        <label className="absolute left-4 top-3 text-gray-500 px-1 
                          peer-focus:-top-2 peer-focus:bg-white 
                          peer-focus:text-indigo-600 peer-focus:text-sm
                          peer-valid:-top-2 peer-valid:bg-white
                          peer-valid:text-indigo-600 peer-valid:text-sm 
                          transition-all">
          Email
        </label>
      </div>

      {/* Floating Label Password */}
      <div className="relative">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="peer w-full border border-gray-300 rounded-xl px-4 py-3
                     focus:outline-none focus:border-indigo-500 transition"
        />
        <label className="absolute left-4 top-3 text-gray-500 px-1
                          peer-focus:-top-2 peer-focus:bg-white 
                          peer-focus:text-indigo-600 peer-focus:text-sm
                          peer-valid:-top-2 peer-valid:bg-white
                          peer-valid:text-indigo-600 peer-valid:text-sm
                          transition-all">
          Password
        </label>
      </div>

      {/* Animated Buttons */}
      <button
        onClick={handleSignup}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl 
                   hover:bg-indigo-700 active:scale-95 transition-all"
      >
        Sign Up
      </button>

      <button
        onClick={handleLogin}
        className="w-full py-3 bg-gray-800 text-white rounded-xl
                   hover:bg-black active:scale-95 transition-all"
      >
        Login
      </button>
      {error && (
        <p className="text-center text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  </div>
)
}


