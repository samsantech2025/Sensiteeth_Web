import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from "./PatientSignUp.module.css";
import icon from "../assets/icon.png";

const PatientSignUp = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    age: "",
    birthDate: "",
    email: "",
    address: "",
    gender: "",
    contactNo: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.email.includes("@")) {
      return "Please enter a valid email address.";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long.";
    }
    const birthDate = new Date(formData.birthDate);
    if (birthDate >= new Date()) {
      return "Birth date must be in the past.";
    }
    return null;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Insert into Users using email (omit id for auto-increment)
    const { error: userError } = await supabase
      .from("Users")
      .insert([{ email: formData.email, role: "patient" }]);

    if (userError) {
      setError(userError.message);
      setLoading(false);
      return;
    }

    const patientData = {
      FirstName: formData.firstName,
      MiddleName: formData.middleName || null,
      LastName: formData.lastName,
      Age: parseInt(formData.age, 10),
      BirthDate: formData.birthDate,
      Email: formData.email, // Use Email with capital 'E' to match schema
      Address: formData.address,
      Gender: formData.gender,
      ContactNo: formData.contactNo,
    };

    const { error: patientError } = await supabase
      .from("Patient")
      .insert([patientData]);

    if (patientError) {
      setError(patientError.message);
      setLoading(false);
      return;
    }

    setSuccess("Sign-up successful! Redirecting to login...");
    setLoading(false);
    setTimeout(() => navigate("/PatientLogin"), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
      <div className={styles.logoContainer}>
        <img src={icon} alt="icon" className={styles.icon} />
      </div>
          <hr className={styles.divider} />
          <h2 className={styles.title}>
            <span className={styles.wordPrimary}>Patient</span>{" "}
            <span className={styles.wordAccent}>Sign-Up</span>
          </h2>
        <form onSubmit={handleSignUp}>
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="middleName">Middle Name (optional)</label>
              <input
                type="text"
                name="middleName"
                id="middleName"
                placeholder="Enter middle name"
                value={formData.middleName}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="age">Age</label>
              <input
                type="number"
                name="age"
                id="age"
                placeholder="Enter age"
                value={formData.age}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="birthDate">Birth Date</label>
              <input
                type="date"
                name="birthDate"
                id="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroupFull}>
              <label htmlFor="address">Address</label>
              <input
                type="text"
                name="address"
                id="address"
                placeholder="Enter address"
                value={formData.address}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="gender">Gender</label>
              <select
                name="gender"
                id="gender"
                value={formData.gender}
                onChange={handleChange}
                className={styles.input}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="contactNo">Contact Number</label>
              <input
                type="tel"
                name="contactNo"
                id="contactNo"
                placeholder="Enter contact number"
                value={formData.contactNo}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
          </div>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <p className={styles.text}>
          Already have an account?{" "}
          <span onClick={() => navigate("/PatientLogin")} className={styles.link}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default PatientSignUp;