import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from './DentistDashboard.module.css';

const DentistConsultations = () => {
  const [appointments, setAppointments] = useState([]);
  const [dentistId, setDentistId] = useState(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [finalDiagnosisDesc, setFinalDiagnosisDesc] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Supabase base URL
  const SUPABASE_STORAGE_URL = 'https://snvrykahnydcsdvfwfbw.supabase.co/storage/v1/object/public/';

  useEffect(() => {
    const fetchDentistAndData = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("Error getting session:", sessionError);
        return;
      }

      const { data: dentistData, error: dentistError } = await supabase
        .from('Dentist')
        .select('id')
        .eq('Email', session.user.email)
        .single();

      if (dentistError) {
        console.error("Error fetching dentist data:", dentistError);
        if (dentistError.code === 'PGRST116') {
          console.log("No dentist record found for this email.");
        }
        return;
      }

      const currentDentistId = dentistData.id;
      setDentistId(currentDentistId);
      console.log('Fetched Dentist ID:', currentDentistId);

      const { data: consultationData, error: consultationError } = await supabase
        .from('Consultation')
        .select('*, Patient(FirstName, LastName), Diagnosis(*)')
        .eq('DentistId', currentDentistId);

      if (consultationError) {
        console.error("Error fetching consultations:", consultationError);
      } else {
        setAppointments(consultationData);
        console.log('Fetched Appointments with Diagnosis:', consultationData);
      }
    };

    fetchDentistAndData();
  }, []);

  const handleApprove = async (appointmentId) => {
    try {
      const { data, error } = await supabase
        .from('Consultation')
        .update({ Status: 'approved' })
        .eq('id', appointmentId)
        .select();

      if (error) throw new Error(`Error approving consultation: ${error.message}`);
      console.log("Consultation approved successfully:", data);
      await refreshAppointments();
    } catch (error) {
      console.error('Approve error:', error.message);
      alert(`An error occurred: ${error.message}`);
    }
  };

  const handleReject = async (appointmentId) => {
    try {
      const { data, error } = await supabase
        .from('Consultation')
        .update({ Status: 'rejected' })
        .eq('id', appointmentId)
        .select();

      if (error) throw new Error(`Error rejecting consultation: ${error.message}`);
      console.log("Consultation rejected successfully:", data);
      await refreshAppointments();
    } catch (error) {
      console.error('Reject error:', error.message);
      alert(`An error occurred: ${error.message}`);
    }
  };

  const refreshAppointments = async () => {
    const { data: updatedAppointments, error: refreshError } = await supabase
      .from('Consultation')
      .select('*, Patient(FirstName, LastName), Diagnosis(*)')
      .eq('DentistId', dentistId);
    if (refreshError) {
      console.error("Error refreshing appointments:", refreshError);
    } else {
      setAppointments(updatedAppointments);
    }
  };

  const handleViewDiagnosis = (diagnosis) => {
    if (diagnosis && diagnosis.length > 0) {
      setSelectedDiagnosis(diagnosis[0]);
      setFinalDiagnosis(diagnosis[0].FinalDiagnosis || '');
      setFinalDiagnosisDesc(diagnosis[0].FinalDiagnosisDesc || '');
      setImageError(false);
      console.log('Opening modal with Image URL:', diagnosis[0].ImageUrl);
      setIsModalOpen(true);
    } else {
      alert("No diagnosis record found for this consultation.");
    }
  };

  const handleUpdateDiagnosis = async () => {
    if (!selectedDiagnosis) return;

    try {
      // Update Diagnosis table
      const { data: diagnosisData, error: diagnosisError } = await supabase
        .from('Diagnosis')
        .update({
          FinalDiagnosis: finalDiagnosis,
          FinalDiagnosisDesc: finalDiagnosisDesc,
        })
        .eq('id', selectedDiagnosis.id)
        .select();

      if (diagnosisError) {
        console.error('Update diagnosis error:', diagnosisError);
        throw new Error(`Error updating diagnosis: ${diagnosisError.message}`);
      }
      console.log("Diagnosis updated successfully:", diagnosisData);

      // If FinalDiagnosis is provided, update Consultation status to "complete"
      if (finalDiagnosis && finalDiagnosis.trim() !== '') {
        const consultationId = selectedDiagnosis.ConsultationId;
        const { data: consultationData, error: consultationError } = await supabase
          .from('Consultation')
          .update({ Status: 'complete' })
          .eq('id', consultationId)
          .select();

        if (consultationError) {
          console.error('Update consultation status error:', consultationError);
          throw new Error(`Error updating consultation status: ${consultationError.message}`);
        }
        console.log("Consultation status updated to 'complete':", consultationData);
      }

      await refreshAppointments();
      setIsModalOpen(false);
      setSelectedDiagnosis(null);
      setFinalDiagnosis('');
      setFinalDiagnosisDesc('');
    } catch (error) {
      console.error('Update error:', error.message);
      alert(`An error occurred: ${error.message}`);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Image failed to load:', selectedDiagnosis?.ImageUrl);
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${SUPABASE_STORAGE_URL}${url}`;
  };

  if (!dentistId) {
    return <div>Loading dentist data...</div>;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.subtitle}>Consultations</h2>
      {appointments.length > 0 ? (
        <table className={styles.appointmentTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(appointment => (
              <tr key={appointment.id}>
                <td>{new Date(appointment.AppointmentDate).toLocaleDateString()}</td>
                <td>{`${appointment.Patient.FirstName} ${appointment.Patient.LastName}`}</td>
                <td>{appointment.Status}</td>
                <td>
                  {appointment.Status === 'pending' && (
                    <>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleApprove(appointment.id)}
                      >
                        Approve
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleReject(appointment.id)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    className={styles.actionButton}
                    onClick={() => handleViewDiagnosis(appointment.Diagnosis)}
                  >
                    View/Edit Diagnosis
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No consultations scheduled yet.</p>
      )}

      {/* Modal for Viewing/Editing Diagnosis */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Diagnosis Details</h3>
            {selectedDiagnosis && (
              <>
                <div className={styles.modalcont}>
                  <div className={styles.txtfieldcont}>
                    <p><strong>Initial Diagnosis:</strong> {selectedDiagnosis.InitialDiagnosis}</p>
                    <p><strong>Confidence:</strong> {(selectedDiagnosis.Confidence * 100).toFixed(2)}%</p>
                    <label>
                      Final Diagnosis:
                      <input
                        type="text"
                        value={finalDiagnosis}
                        onChange={(e) => setFinalDiagnosis(e.target.value)}
                        className={styles.inputField}
                      />
                    </label>
                    <label>
                      Final Diagnosis Description:
                      <textarea
                        value={finalDiagnosisDesc}
                        onChange={(e) => setFinalDiagnosisDesc(e.target.value)}
                        className={styles.textareaField}
                      />
                    </label>
                  </div>
                  <div className={styles.imgcont}>
                    {imageError ? (
                      <p style={{ color: 'red' }}>
                        Unable to load image. URL: {getFullImageUrl(selectedDiagnosis.ImageUrl)}
                      </p>
                    ) : (
                      <img
                        src={getFullImageUrl(selectedDiagnosis.ImageUrl)}
                        alt="Diagnosis"
                        style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
                        onError={handleImageError}
                        onLoad={() => console.log('Image loaded successfully')}
                      />
                    )}
                  </div>
                </div>
                <div className={styles.modalButtons}>
                  <button
                    className={styles.actionButton}
                    onClick={handleUpdateDiagnosis}
                  >
                    Save
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => setIsModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default DentistConsultations;