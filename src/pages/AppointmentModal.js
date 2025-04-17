import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styles from './PatientDashboard.module.css';

const AppointmentModal = ({ 
  isOpen, 
  onClose, 
  dentists, 
  handleSubmit, 
  userEmail, 
  patientData, 
  appointment, 
  dentistAvailability 
}) => {
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
  const [dateError, setDateError] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (appointment) {
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
        setFormData({ ...initialFormData, Email: userEmail || '' });
      }
      console.log('Dentist Availability Data:', dentistAvailability);
    }
  }, [isOpen, userEmail, patientData, appointment, dentistAvailability]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name !== 'Email') {
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
      console.log('Form Data Updated:', { ...formData, [name]: value });
    }
  };

  const handleDateInputClick = () => {
    setShowCalendar(true);
  };

  const formatDateToPhilippines = (date) => {
    // Create a new Date object adjusted to Philippine timezone (UTC+08:00)
    const philippineDate = new Date(date);
    const year = philippineDate.getFullYear();
    const month = String(philippineDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(philippineDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date) => {
    const formattedDate = formatDateToPhilippines(date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (date < currentDate) {
      setDateError("Appointment date cannot be earlier than today.");
      setShowCalendar(false);
      return;
    }

    const dentistId = parseInt(formData.DentistId);
    const entry = dentistAvailability.find(
      entry => entry.DentistId === dentistId && entry.Date === formattedDate
    );

    if (!entry || !entry.IsAvailable) {
      setDateError("This date is not available for the selected dentist.");
      setShowCalendar(false);
      return;
    }

    setDateError(null);
    setFormData(prevState => ({
      ...prevState,
      AppointmentDate: formattedDate
    }));
    setShowCalendar(false);
    console.log('Selected Date:', formattedDate);
  };

  const clearForm = () => {
    setFormData({ ...initialFormData, Email: userEmail || '' });
    setDateError(null);
    setShowCalendar(false);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (dateError || !formData.DentistId || !formData.AppointmentDate) {
      alert(dateError || "Please select a dentist and a valid appointment date.");
      return;
    }

    const formattedDate = formData.AppointmentDate;
    const dentistId = parseInt(formData.DentistId);
    const entry = dentistAvailability.find(
      entry => entry.DentistId === dentistId && entry.Date === formattedDate
    );

    if (!entry || !entry.IsAvailable) {
      alert("The selected date is not available for this dentist.");
      return;
    }

    console.log('Submitting Form Data:', formData);
    await handleSubmit(formData);
    clearForm();
  };

  const tileClassName = ({ date }) => {
    const formattedDate = formatDateToPhilippines(date);
    const dentistId = parseInt(formData.DentistId);
    if (!dentistId) return null;

    const entry = dentistAvailability.find(
      entry => entry.DentistId === dentistId && entry.Date === formattedDate
    );
    const className = entry && entry.IsAvailable ? styles.available : (entry ? styles.unavailable : null);
    console.log(`Tile ${formattedDate}:`, { dentistId, entry, className });
    return className;
  };

  const tileDisabled = ({ date }) => {
    const formattedDate = formatDateToPhilippines(date);
    const dentistId = parseInt(formData.DentistId);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (!dentistId || date < currentDate) {
      console.log(`Tile ${formattedDate} disabled: No DentistId or past date`);
      return true;
    }

    const entry = dentistAvailability.find(
      entry => entry.DentistId === dentistId && entry.Date === formattedDate
    );
    const disabled = !entry || !entry.IsAvailable;
    console.log(`Tile ${formattedDate} disabled:`, { dentistId, entry, disabled });
    return disabled;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
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
                className={styles.inputField}
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
                className={styles.inputField}
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
                className={styles.inputField}
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
                className={styles.inputField}
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
                className={styles.inputField}
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
                className={styles.inputField}
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
                className={styles.inputField}
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
                className={styles.inputField}
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
                className={styles.inputField}
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
                className={styles.inputField}
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
                type="text"
                name="AppointmentDate"
                id="AppointmentDate"
                value={formData.AppointmentDate}
                onClick={handleDateInputClick}
                onChange={() => {}} // Prevent manual typing
                className={styles.inputField}
                placeholder="Click to select a date"
                readOnly
                required
              />
              {showCalendar && (
                <div ref={calendarRef} className={styles.calendarContainer}>
                  <Calendar
                    onChange={handleDateSelect}
                    value={formData.AppointmentDate ? new Date(formData.AppointmentDate) : null}
                    tileClassName={tileClassName}
                    tileDisabled={tileDisabled}
                    minDate={new Date()}
                    className={styles.calendar}
                  />
                </div>
              )}
              {dateError && <p className={styles.error}>{dateError}</p>}
            </div>
          </div>
          <div className={styles.buttonContainer}>
            <button type="button" onClick={onClose} className={styles.actionButton}>Close</button>
            <button type="submit" className={styles.actionButton} disabled={!!dateError}>Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;