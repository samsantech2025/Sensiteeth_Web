import { supabase } from "../supabaseClient";

// Sign Up
export const signUp = async (email, password, role) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role }, // Store role (Dentist/Patient) in user metadata
    },
  });

  if (error) throw error;
  return data;
};

// Sign In
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

// Get Current Session
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session || null;
};

// Sign Out
export const signOut = async () => {
  await supabase.auth.signOut();
};
