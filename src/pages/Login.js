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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from("Users")
      .select("role")
      .eq("email", email)
      .single();

    if (userError) {
      setError(userError.message);
      return;
    }

    const role = userData.role;

    if (role === "patient") {
      navigate("/patient-dashboard");
    } else if (role === "dentist") {
      navigate("/dentist-dashboard");
    } else {
      setError("User role not recognized.");
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