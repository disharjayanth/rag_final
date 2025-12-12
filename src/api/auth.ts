import { supabase } from '@/lib/supabase';

export async function signUpUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Signup error:", error);
    throw error;
  }

  return data;
}