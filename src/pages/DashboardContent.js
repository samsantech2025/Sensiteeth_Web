import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from './DentistDashboard.module.css';

const DashboardContent = ({ dentistId }) => {
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalConsultations, setTotalConsultations] = useState(0);
  const [newPatients, setNewPatients] = useState(0);
  const [completedConsultations, setCompletedConsultations] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const [statData, setStatData] = useState([]); // Array of { label, value }

  useEffect(() => {
    const fetchConsultations = async () => {
      // Fetch all consultations for the dentist
      const { data: consultationData, error: consultationError } = await supabase
        .from('Consultation')
        .select('PatientId, AppointmentDate, Status')
        .eq('DentistId', dentistId)
        .order('AppointmentDate', { ascending: true });

      if (consultationError) {
        console.error("Error fetching consultations:", consultationError);
        return;
      }

      // Total Consultations
      const totalConsultationsCount = consultationData.length;
      setTotalConsultations(totalConsultationsCount);

      // Total Patients (unique PatientIds)
      const uniquePatients = new Set(consultationData.map(a => a.PatientId));
      const totalPatientsCount = uniquePatients.size;
      setTotalPatients(totalPatientsCount);

      // New Patients: Patients whose first consultation with this dentist is within the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const patientFirstConsultations = {};
      consultationData.forEach(consultation => {
        const patientId = consultation.PatientId;
        if (!patientFirstConsultations[patientId]) {
          patientFirstConsultations[patientId] = consultation;
        }
      });
      const newPatientsCount = Object.values(patientFirstConsultations).filter(
        consultation => new Date(consultation.AppointmentDate) >= thirtyDaysAgo
      ).length;
      setNewPatients(newPatientsCount);

      // Completed Consultations
      const completedConsultationsCount = consultationData.filter(c => c.Status === 'complete').length;
      setCompletedConsultations(completedConsultationsCount);

      // Upcoming Appointments: Future dates with status not 'complete'
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcomingAppointmentsCount = consultationData.filter(c => {
        const appointmentDate = new Date(c.AppointmentDate);
        return appointmentDate >= today && c.Status !== 'complete';
      }).length;
      setUpcomingAppointments(upcomingAppointmentsCount);

      // Prepare data for the chart using stat card values
      const statDataArray = [
        { label: 'Total Patients', value: totalPatientsCount },
        { label: 'New Patients', value: newPatientsCount },
        { label: 'Total Consultations', value: totalConsultationsCount },
        { label: 'Completed Consultations', value: completedConsultationsCount },
        { label: 'Upcoming Appointments', value: upcomingAppointmentsCount },
      ];
      setStatData(statDataArray);
    };

    fetchConsultations();
  }, [dentistId]);

  // Calculate the maximum value for scaling the bar heights
  const maxValue = Math.max(...statData.map(data => data.value), 1); // Avoid division by 0
  const maxHeight = 200; // Maximum height of bars in pixels
  const minBarHeight = 5; // Minimum height for visibility even if value is 0

  return (
    <>
      <h1 className={styles.title}>Dentist Dashboard</h1>
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h3>Total Patients</h3>
          <p>{totalPatients}</p>
        </div>
        <div className={styles.statCard}>
          <h3>New Patients (Last 30 Days)</h3>
          <p>{newPatients}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Consultations</h3>
          <p>{totalConsultations}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Completed Consultations</h3>
          <p>{completedConsultations}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Upcoming Appointments</h3>
          <p>{upcomingAppointments}</p>
        </div>
      </div>
      <div className={styles.chartContainer}>
        <h3>Dashboard Statistics</h3>
        {statData.length > 0 ? (
          <div className={styles.barChart}>
            <div className={styles.yAxis}>
              <div className={styles.yAxisLabels}>
                {[...Array(5)].map((_, index) => {
                  const value = Math.round((maxValue * (4 - index)) / 4);
                  return (
                    <span key={index} className={styles.yAxisLabel}>
                      {value}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className={styles.barsContainer}>
              {statData.map((data, index) => {
                const height = data.value === 0
                  ? minBarHeight
                  : (data.value / maxValue) * maxHeight;
                return (
                  <div key={index} className={styles.barWrapper}>
                    <div
                      className={styles.bar}
                      style={{ height: `${height}px` }}
                      title={`${data.value} ${data.label}`}
                    >
                      <span className={styles.barLabel}>{data.value}</span>
                    </div>
                    <span className={styles.xAxisLabel}>{data.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p>No data available to display.</p>
        )}
      </div>
    </>
  );
};

export default DashboardContent;