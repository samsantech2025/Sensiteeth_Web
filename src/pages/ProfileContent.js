// src/pages/ProfileContent.js
import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import styles from './DentistDashboard.module.css';

const ProfileContent = ({ dentistId, dentistData, setDentistData, setProfileWarning }) => {
  const [profileForm, setProfileForm] = useState({
    DentistName: dentistData?.DentistName || '',
    ContactNo: dentistData?.ContactNo || ''
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.DentistName || !profileForm.ContactNo) {
      alert("Please fill in both Dentist Name and Contact Number.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('Dentist')
        .update({ DentistName: profileForm.DentistName, ContactNo: profileForm.ContactNo })
        .eq('id', dentistId)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        throw new Error(`Error updating profile: ${error.message}`);
      }

      setDentistData(data);
      setProfileWarning(false);
      console.log("Profile updated successfully:", data);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error('Profile update error:', error.message);
      alert(`An error occurred: ${error.message}`);
    }
  };

  return (
    <div className={styles.profileFormContainer}>
      <h2 className={styles.subtitle}>Complete Your Profile</h2>
      <form onSubmit={handleProfileSubmit} className={styles.profileForm}>
        <div className={styles.formGroup}>
          <label htmlFor="DentistName">Dentist Name:</label>
          <input
            type="text"
            name="DentistName"
            id="DentistName"
            value={profileForm.DentistName}
            onChange={handleProfileChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="ContactNo">Contact Number:</label>
          <input
            type="tel"
            name="ContactNo"
            id="ContactNo"
            value={profileForm.ContactNo}
            onChange={handleProfileChange}
            required
            className={styles.input}
          />
        </div>
        <button type="submit" className={styles.button}>Save Profile</button>
      </form>
    </div>
  );
};

export default ProfileContent;