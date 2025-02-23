// src/pages/Signup.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from "./Signup.module.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    const { email, password, confirmPassword, role } = formData;

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Sign up with Supabase auth
      const { data: { user }, error: signUpError } = await supabase.auth.signUp(
        { email, password },
        { data: { role } }
      );

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!user) {
        throw new Error("Signup failed: No user returned.");
      }

      console.log("Auth signup successful:", user);

      // Step 2: Insert into Users table
      const { error: userInsertError } = await supabase
        .from("Users")
        .insert([{ email, role }]);

      if (userInsertError) {
        throw new Error(`Users table insert failed: ${userInsertError.message}`);
      }

      console.log("Users table insert successful");

      // Step 3: Insert into appropriate table based on role
      if (role === "patient") {
        const { error: patientInsertError } = await supabase
          .from("Patient")
          .insert([{ Email: email }]);

        if (patientInsertError) {
          throw new Error(`Patient table insert failed: ${patientInsertError.message}`);
        }
        console.log("Patient email inserted successfully");
      } else if (role === "dentist") {
        const { error: dentistInsertError } = await supabase
          .from("Dentist")
          .insert([{ Email: email }]);

        if (dentistInsertError) {
          throw new Error(`Dentist table insert failed: ${dentistInsertError.message}`);
        }
        console.log("Dentist email inserted successfully");
      }

      setLoading(false);
      alert("Signup successful! Please check your email to verify your account, then sign in.");
      navigate("/"); // Redirect to login page

    } catch (error) {
      console.error("Signup error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Sign Up</h2>
        <form onSubmit={handleSignup}>
          {error && <p className={styles.error}>{error}</p>}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={styles.select}
            required
          >
            <option value="patient">Patient</option>
            <option value="dentist">Dentist</option>
          </select>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <p className={styles.text}>
          Already have an account?{" "}
          <span onClick={() => navigate("/")} className={styles.link}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;