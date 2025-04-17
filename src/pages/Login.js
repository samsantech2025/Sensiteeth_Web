import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from "./Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Attempt authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      console.error("Authentication error:", authError.message);
      return;
    }

    // Check email confirmation
    if (!authData.user.confirmed_at) {
      setLoading(false);
      setError("Please confirm your email before logging in.");
      console.error("User email not confirmed:", email);
      return;
    }

    // Query Users table for role
    const { data: userData, error: userError } = await supabase
      .from("Users")
      .select("role")
      .eq("email", email)
      .single();

    setLoading(false);

    if (userError || !userData) {
      setError("User role not found. Please contact support.");
      console.error("Users table error:", userError?.message, "Email:", email);
      return;
    }

    const role = userData.role ? userData.role.trim().toLowerCase() : null;
    console.log("User role fetched:", role);

    // Debug navigation
    if (role === "patient") {
      console.log("Navigating to /patient-dashboard");
      navigate("/patient-dashboard");
    } else if (role === "dentist") {
      console.log("Navigating to /dentist-dashboard");
      navigate("/dentist-dashboard");
    } else if (role === "secretary") {
      console.log("Navigating to /dentist-dashboard for secretary");
      navigate("/dentist-dashboard");
    } else {
      setError("User role not recognized.");
      console.error("Unrecognized role:", role);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Welcome Back</h2>
        <p className={styles.subtitle}>Sign in to your dental account</p>
        <form onSubmit={handleLogin}>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className={styles.text}>
          Don’t have an account?{" "}
          <span onClick={() => navigate("/signup")} className={styles.link}>
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;