import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from './PatientDashboard.module.css';
import AppointmentModal from "./AppointmentModal";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [completedConsultations, setCompletedConsultations] = useState([]);
  const [patientHistory, setPatientHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [dentists, setDentists] = useState([]);
  const [dentistAvailability, setDentistAvailability] = useState([]); // New state
  const [patientId, setPatientId] = useState(null);
  const [email, setEmail] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [imageError, setImageError] = useState(false);

  const SUPABASE_STORAGE_URL = 'https://snvrykahnydcsdvfwfbw.supabase.co/storage/v1/object/public/';

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("Error getting session:", sessionError);
        navigate('/');
        return;
      }

      setEmail(session.user.email);

      const { data: patientData, error: patientError } = await supabase
        .from('Patient')
        .select('id, FirstName, MiddleName, LastName, Age, BirthDate, Email, Address, Gender, ContactNo')
        .eq('Email', session.user.email)
        .single();

      if (patientError) {
        console.error("Error fetching patient data:", patientError);
        if (patientError.code === 'PGRST116') {
          console.log("No patient record found for this email.");
        }
        return;
      }

      const currentPatientId = patientData.id;
      setPatientId(currentPatientId);
      setPatientData(patientData);
      console.log('Fetched Patient Data:', patientData);

      const { data: activeConsultationData, error: activeConsultationError } = await supabase
        .from('Consultation')
        .select('*, Dentist(DentistName)')
        .eq('PatientId', currentPatientId)
        .neq('Status', 'complete');

      if (activeConsultationError) {
        console.error("Error fetching active consultations:", activeConsultationError);
      } else {
        setAppointments(activeConsultationData);
        console.log('Fetched Active Appointments:', activeConsultationData);
      }

      const { data: completedConsultationData, error: completedConsultationError } = await supabase
        .from('Consultation')
        .select('*, Dentist(DentistName), Diagnosis(*)')
        .eq('PatientId', currentPatientId)
        .eq('Status', 'complete');

      if (completedConsultationError) {
        console.error("Error fetching completed consultations:", completedConsultationError);
      } else {
        setCompletedConsultations(completedConsultationData);
        console.log('Fetched Completed Consultations:', completedConsultationData);
      }

      const { data: historyData, error: historyError } = await supabase
        .from('patient_history')
        .select('*')
        .eq('patient_id', currentPatientId);
      if (historyError) {
        console.error("Error fetching patient history:", historyError);
      } else {
        setPatientHistory(historyData);
      }

      const { data: dentistsData, error: dentistsError } = await supabase
        .from('Dentist')
        .select('id, DentistName');
      if (dentistsError) {
        console.error("Error fetching dentists:", dentistsError);
      } else {
        setDentists(dentistsData);
        console.log('Fetched Dentists:', dentistsData);
      }

      // Fetch DentistAvailability for all dentists
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('DentistAvailability')
        .select('DentistId, Date, IsAvailable')
        .gte('Date', new Date().toISOString().split('T')[0]); // Future dates only

      if (availabilityError) {
        console.error("Error fetching dentist availability:", availabilityError);
      } else {
        setDentistAvailability(availabilityData || []);
        console.log('Fetched Dentist Availability:', availabilityData);
      }
    };

    fetchUserAndData();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    } else {
      console.log("Sign out successful, redirecting to /PatientLogin");
      navigate("/PatientLogin");
    }
  };

  const openModal = (appointment = null) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const openDiagnosisModal = (diagnosis) => {
    if (diagnosis && diagnosis.length > 0) {
      setSelectedDiagnosis(diagnosis[0]);
      setImageError(false);
      setIsDiagnosisModalOpen(true);
    } else {
      alert("No diagnosis record found for this consultation.");
    }
  };

  const closeDiagnosisModal = () => {
    setIsDiagnosisModalOpen(false);
    setSelectedDiagnosis(null);
  };

  const handleSubmit = async (formData) => {
    console.log('Received formData:', formData);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(formData.AppointmentDate);
    if (appointmentDate < currentDate) {
      alert("Appointment date cannot be earlier than today.");
      return;
    }

    try {
      const patientDataToSave = {
        FirstName: formData.FirstName,
        MiddleName: formData.MiddleName,
        LastName: formData.LastName,
        Age: formData.Age,
        BirthDate: formData.BirthDate,
        Email: formData.Email,
        Address: formData.Address,
        Gender: formData.Gender,
        ContactNo: formData.ContactNo,
      };

      console.log('Patient data to save:', patientDataToSave);

      const { data: existingPatient, error: fetchError } = await supabase
        .from('Patient')
        .select('id')
        .eq('Email', formData.Email)
        .single();

      let patientIdToUse;

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing patient:', fetchError);
        throw new Error(`Error checking patient: ${fetchError.message}`);
      }

      if (existingPatient) {
        const { data: updatedPatient, error: updateError } = await supabase
          .from('Patient')
          .update(patientDataToSave)
          .eq('id', existingPatient.id)
          .select();
        
        if (updateError) {
          console.error('Patient update error:', updateError);
          throw new Error(`Error updating patient: ${updateError.message}`);
        }
        console.log("Patient updated successfully:", updatedPatient);
        patientIdToUse = updatedPatient[0].id;
      } else {
        const { data: newPatient, error: insertError } = await supabase
          .from('Patient')
          .insert([patientDataToSave])
          .select();
        
        if (insertError) {
          console.error('Patient insert error:', insertError);
          throw new Error(`Error inserting patient: ${insertError.message}`);
        }
        console.log("Patient inserted successfully:", newPatient);
        patientIdToUse = newPatient[0].id;
      }

      console.log('Patient ID:', patientIdToUse);

      const consultationData = {
        PatientId: patientIdToUse,
        DentistId: formData.DentistId,
        Status: 'pending',
        AppointmentDate: formData.AppointmentDate,
      };

      console.log('Consultation data to be saved:', consultationData);

      if (selectedAppointment) {
        const { data: consultationResult, error: consultationError } = await supabase
          .from('Consultation')
          .update(consultationData)
          .eq('id', selectedAppointment.id)
          .select();

        if (consultationError) {
          console.error('Consultation update error:', consultationError);
          throw new Error(`Error updating consultation: ${consultationError.message}`);
        }
        console.log("Consultation updated successfully:", consultationResult);
      } else {
        const { data: consultationResult, error: consultationError } = await supabase
          .from('Consultation')
          .insert([consultationData])
          .select();

        if (consultationError) {
          console.error('Consultation insert error:', consultationError);
          throw new Error(`Error inserting consultation: ${consultationError.message}`);
        }
        console.log("Consultation data saved successfully:", consultationResult);
      }

      alert(selectedAppointment ? "Appointment rescheduled successfully!" : "Appointment scheduled successfully!");
      const { data: activeAppointments, error: activeRefreshError } = await supabase
        .from('Consultation')
        .select('*, Dentist(DentistName)')
        .eq('PatientId', patientIdToUse)
        .neq('Status', 'complete');
      if (activeRefreshError) {
        console.error("Error refreshing active appointments:", activeRefreshError);
      } else {
        setAppointments(activeAppointments);
      }

      const { data: completedAppointments, error: completedRefreshError } = await supabase
        .from('Consultation')
        .select('*, Dentist(DentistName), Diagnosis(*)')
        .eq('PatientId', patientIdToUse)
        .eq('Status', 'complete');
      if (completedRefreshError) {
        console.error("Error refreshing completed appointments:", completedRefreshError);
      } else {
        setCompletedConsultations(completedAppointments);
      }

    } catch (error) {
      console.error('Submission error:', error.message);
      alert(`An error occurred: ${error.message}`);
    } finally {
      closeModal();
    }
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        const { error } = await supabase
          .from('Consultation')
          .delete()
          .eq('id', appointmentId);

        if (error) {
          console.error('Cancel error:', error);
          throw new Error(`Error canceling appointment: ${error.message}`);
        }

        console.log("Appointment canceled successfully");
        const { data: activeAppointments, error: activeRefreshError } = await supabase
          .from('Consultation')
          .select('*, Dentist(DentistName)')
          .eq('PatientId', patientId)
          .neq('Status', 'complete');
        if (activeRefreshError) {
          console.error("Error refreshing active appointments:", activeRefreshError);
        } else {
          setAppointments(activeAppointments);
        }
      } catch (error) {
        console.error('Cancel error:', error.message);
        alert(`An error occurred: ${error.message}`);
      }
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

  if (!patientId) {
    return <div>Loading patient data...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Appointment Dashboard</h1>
        <button className={styles.logoutButton} onClick={handleSignOut}>Sign Out</button>
      </header>
      
      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.subtitle}>Upcoming Appointments</h2>
          {appointments.length > 0 ? (
            <div className={styles.cardContainer}>
              {appointments.map(appointment => (
                <div key={appointment.id} className={styles.card}>
                  <p><strong>Date:</strong> {new Date(appointment.AppointmentDate).toLocaleDateString()}</p>
                  <p><strong>Dentist:</strong> {appointment.Dentist.DentistName}</p>
                  <p><strong>Status:</strong> {appointment.Status}</p>
                  <div>
                    <button 
                      className={styles.actionButton} 
                      onClick={() => openModal(appointment)}
                    >
                      Reschedule
                    </button>
                    <button 
                      className={styles.actionButton} 
                      onClick={() => handleCancel(appointment.id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>No upcoming appointments scheduled yet.</p>
          )}
          <button className={styles.button} onClick={() => openModal()}>Schedule New Appointment</button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subtitle}>Dental History</h2>
          {(patientHistory.length > 0 || completedConsultations.length > 0) ? (
            <div className={styles.cardContainer}>
              {patientHistory.map(history => (
                <div key={history.id} className={styles.card}>
                  <p><strong>Date:</strong> {history.date}</p>
                  <p><strong>Note:</strong> {history.note}</p>
                </div>
              ))}
              {completedConsultations.map(consultation => (
                <div key={consultation.id} className={styles.card}>
                  <p><strong>Date:</strong> {new Date(consultation.AppointmentDate).toLocaleDateString()}</p>
                  <p><strong>Dentist:</strong> {consultation.Dentist.DentistName}</p>
                  <p><strong>Status:</strong> Completed</p>
                  <button
                    className={styles.actionButton}
                    onClick={() => openDiagnosisModal(consultation.Diagnosis)}
                  >
                    View Diagnosis
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>No dental history available yet.</p>
          )}
        </section>
      </div>

      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        dentists={dentists} 
        handleSubmit={handleSubmit}
        userEmail={email}
        patientData={patientData}
        appointment={selectedAppointment}
        styles={styles}
        dentistAvailability={dentistAvailability} // Pass availability to modal
      />

      {isDiagnosisModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Diagnosis Details</h3>
            {selectedDiagnosis && (
              <>
                <p><strong>Initial Diagnosis:</strong> {selectedDiagnosis.InitialDiagnosis}</p>
                <p><strong>Image:</strong></p>
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
                <p><strong>Confidence:</strong> {(selectedDiagnosis.Confidence * 100).toFixed(2)}%</p>
                <p><strong>Final Diagnosis:</strong> {selectedDiagnosis.FinalDiagnosis || 'Not provided'}</p>
                <p><strong>Final Diagnosis Description:</strong> {selectedDiagnosis.FinalDiagnosisDesc || 'Not provided'}</p>
                <div className={styles.modalButtons}>
                  <button
                    className={styles.actionButton}
                    onClick={closeDiagnosisModal}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;