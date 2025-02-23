// src/pages/DashboardContent.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from './DentistDashboard.module.css';

const DashboardContent = ({ dentistId }) => {
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalConsultations, setTotalConsultations] = useState(0);

  useEffect(() => {
    const fetchConsultations = async () => {
      const { data: consultationData, error: consultationError } = await supabase
        .from('Consultation')
        .select('PatientId')
        .eq('DentistId', dentistId);

      if (consultationError) {
        console.error("Error fetching consultations:", consultationError);
      } else {
        setTotalConsultations(consultationData.length);
        const uniquePatients = new Set(consultationData.map(a => a.PatientId));
        setTotalPatients(uniquePatients.size);
      }
    };

    fetchConsultations();
  }, [dentistId]);

  return (
    <>
      <h1 className={styles.title}>Dentist Dashboard</h1>
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h3>Total Patients</h3>
          <p>{totalPatients}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Consultations</h3>
          <p>{totalConsultations}</p>
        </div>
      </div>
    </>
  );
};

export default DashboardContent;