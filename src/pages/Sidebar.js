// src/components/Sidebar.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from '../pages/DentistDashboard.module.css'; // Adjust path if needed

const Sidebar = ({ isOpen, toggleSidebar, toggleProfile }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    } else {
      navigate("/");
    }
  };

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
      <div className={styles.sidebarHeader}>
        <button className={styles.toggleButton} onClick={toggleSidebar}>
          {isOpen ? '☰' : '➤'}
        </button>
        {isOpen && <h2 className={styles.sidebarTitle}>Dentist Portal</h2>}
      </div>
      {isOpen && (
        <ul className={styles.sidebarMenu}>
          <li className={styles.sidebarItem}>
            <Link to="/dentist-dashboard" className={styles.sidebarLink}>Dashboard</Link>
          </li>
          <li className={styles.sidebarItem}>
            <Link to="/dentist-consultations" className={styles.sidebarLink}>Consultations</Link>
          </li>
          <li className={styles.sidebarItem} onClick={toggleProfile}>Profile</li>
          <li className={styles.sidebarItem} onClick={handleSignOut}>Sign Out</li>
        </ul>
      )}
    </div>
  );
};

export default Sidebar;