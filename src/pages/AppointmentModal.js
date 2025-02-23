// src/components/AppointmentModal.js
import React, { useState, useEffect } from 'react';
import styles from './AppointmentModal.module.css';

const AppointmentModal = ({ isOpen, onClose, dentists, handleSubmit, userEmail, patientData, appointment }) => {
  const initialFormData = {
    FirstName: patientData?.FirstName || '',
    MiddleName: patientData?.MiddleName || '',
    LastName: patientData?.LastName || '',
    Age: patientData?.Age || '',
    BirthDate: patientData?.BirthDate || '',
    Email: userEmail || '',
    Address: patientData?.Address || '',
    Gender: patientData?.Gender || '',
    ContactNo: patientData?.ContactNo || '',
    DentistId: '',
    AppointmentDate: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  // Prefill form data when modal opens or appointment/patientData/userEmail changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        // Prefill with patient and appointment data for rescheduling
        setFormData({
          FirstName: patientData?.FirstName || '',
          MiddleName: patientData?.MiddleName || '',
          LastName: patientData?.LastName || '',
          Age: patientData?.Age || '',
          BirthDate: patientData?.BirthDate || '',
          Email: userEmail || '',
          Address: patientData?.Address || '',
          Gender: patientData?.Gender || '',
          ContactNo: patientData?.ContactNo || '',
          DentistId: appointment.DentistId || '',
          AppointmentDate: appointment.AppointmentDate || ''
        });
      } else {
        // New appointment with patient data prefilled
        setFormData({ ...initialFormData, Email: userEmail || '' });
      }
    }
  }, [isOpen, userEmail, patientData, appointment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name !== 'Email') {
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const clearForm = () => {
    setFormData({ ...initialFormData, Email: userEmail || '' });
  };

  const submitForm = async (e) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    await handleSubmit(formData);
    clearForm();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2>{appointment ? "Reschedule Appointment" : "Schedule Appointment"}</h2>
        <form onSubmit={submitForm}>
          <div className={styles.formGrid}>
            <div>
              <label htmlFor="FirstName">First Name:</label>
              <input 
                type="text" 
                name="FirstName" 
                id="FirstName" 
                value={formData.FirstName} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div>
              <label htmlFor="MiddleName">Middle Name:</label>
              <input 
                type="text" 
                name="MiddleName" 
                id="MiddleName" 
                value={formData.MiddleName} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label htmlFor="LastName">Last Name:</label>
              <input 
                type="text" 
                name="LastName" 
                id="LastName" 
                value={formData.LastName} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div>
              <label htmlFor="Age">Age:</label>
              <input 
                type="number" 
                name="Age" 
                id="Age" 
                value={formData.Age} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div>
              <label htmlFor="BirthDate">Birth Date:</label>
              <input 
                type="date" 
                name="BirthDate" 
                id="BirthDate" 
                value={formData.BirthDate} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div>
              <label htmlFor="Email">Email:</label>
              <input 
                type="email" 
                name="Email" 
                id="Email" 
                value={formData.Email} 
                onChange={handleChange} 
                disabled 
                required 
              />
            </div>
            <div className={styles.fullWidth}>
              <label htmlFor="Address">Address:</label>
              <input 
                type="text" 
                name="Address" 
                id="Address" 
                value={formData.Address} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div>
              <label htmlFor="Gender">Gender:</label>
              <select 
                name="Gender" 
                id="Gender" 
                value={formData.Gender} 
                onChange={handleChange} 
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="ContactNo">Contact No:</label>
              <input 
                type="tel" 
                name="ContactNo" 
                id="ContactNo" 
                value={formData.ContactNo} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div>
              <label htmlFor="dentist">Choose Dentist:</label>
              <select 
                name="DentistId" 
                id="dentist" 
                value={formData.DentistId} 
                onChange={handleChange} 
                required
              >
                <option value="">Select Dentist</option>
                {dentists.map(dentist => (
                  <option key={dentist.id} value={dentist.id}>{dentist.DentistName}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="AppointmentDate">Appointment Date:</label>
              <input 
                type="date" 
                name="AppointmentDate" 
                id="AppointmentDate" 
                value={formData.AppointmentDate} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          <div className={styles.buttonContainer}>
            <button onClick={onClose} className={styles.closeButton}>Close</button>
            <button type="submit" className={styles.submitButton}>Submit</button> 
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;