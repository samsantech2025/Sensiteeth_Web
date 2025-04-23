import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from "./PatientLogin.module.css";
import "../styles/Global.css";
import logo from "../assets/header-logo.png";
import image1 from "../assets/carousel1.jpg";
import image2 from "../assets/carousel2.jpg";
import image3 from "../assets/carousel3.jpg";

const PatientLogin = () => {
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
      <div className={styles.logoContainer}>
        <img src={logo} alt="Logo" className={styles.logo} />
      </div>

      <div className={styles.leftColumn}>
        <div className={styles.card}>
          <p className={styles.preTitle}>Access Dental Care</p>
          <hr className={styles.divider} />
          <h2 className={styles.PatientLogintitle}>
            <span className={styles.wordPrimary}>Patient</span>{" "}
            <span className={styles.wordAccent}>Login</span>
          </h2>
          <form onSubmit={handleLogin} className={styles.form}>
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
            <button type="submit" className={styles.buttonFilledPrimary} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          <p className={styles.text}>
            Don’t have an account?{" "}
            <span onClick={() => navigate("/PatientSignUp")} className={styles.link}>
              Sign Up
            </span>
          </p>
        </div>
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.carousel}>
          <img src={image1} alt="Carousel 1" className={styles.carouselImage} />
          <img src={image2} alt="Carousel 2" className={styles.carouselImage} />
          <img src={image3} alt="Carousel 3" className={styles.carouselImage} />
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;