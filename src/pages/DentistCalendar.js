import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import { supabase } from "../supabaseClient";
import styles from './DentistDashboard.module.css';
import 'react-calendar/dist/Calendar.css';

const DentistCalendar = () => {
  const navigate = useNavigate();
  const [dentistId, setDentistId] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDentistAndAvailability = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("Error getting session:", sessionError);
        navigate("/");
        return;
      }

      const userEmail = session.user.email;
      console.log('Logged-in user email:', userEmail);

      const { data: dentistData, error: dentistError } = await supabase
        .from('Dentist')
        .select('id')
        .eq('Email', userEmail)
        .single();

      if (dentistError || !dentistData) {
        console.error("Error fetching dentist data:", dentistError?.message || "No data returned");
        if (dentistError?.code === 'PGRST116') {
          console.log(`No dentist record found for email: ${userEmail}`);
          alert("No dentist profile found for your account. Please contact support.");
        }
        navigate("/");
        return;
      }

      const currentDentistId = dentistData.id;
      setDentistId(currentDentistId);
      console.log('Fetched Dentist ID:', currentDentistId);

      const { data: availabilityData, error: availabilityError } = await supabase
        .from('DentistAvailability')
        .select('Date, IsAvailable')
        .eq('DentistId', currentDentistId);

      if (availabilityError) {
        console.error("Error fetching availability:", availabilityError);
      } else {
        setAvailability(availabilityData || []);
        console.log('Fetched Availability:', availabilityData);
      }

      setLoading(false);
    };

    fetchDentistAndAvailability();
  }, [navigate]);

  const handleDateClick = async (date) => {
    if (!dentistId) {
      alert("Dentist ID not set. Please try again or contact support.");
      return;
    }

    const formattedDate = date.toISOString().split('T')[0];
    const existingEntry = availability.find((entry) => entry.Date === formattedDate);

    try {
      if (existingEntry) {
        const newStatus = !existingEntry.IsAvailable;
        const { data, error } = await supabase
          .from('DentistAvailability')
          .update({ IsAvailable: newStatus })
          .eq('DentistId', dentistId)
          .eq('Date', formattedDate)
          .select();

        if (error) throw error;
        setAvailability((prev) =>
          prev.map((entry) =>
            entry.Date === formattedDate ? { ...entry, IsAvailable: newStatus } : entry
          )
        );
        console.log('Updated availability:', data);
      } else {
        const { data, error } = await supabase
          .from('DentistAvailability')
          .insert([{ DentistId: dentistId, Date: formattedDate, IsAvailable: true }])
          .select();

        if (error) throw error;
        setAvailability((prev) => [...prev, { Date: formattedDate, IsAvailable: true }]);
        console.log('Added new availability:', data);
      }
    } catch (error) {
      console.error('Error updating availability:', error.message);
      alert(`Error: ${error.message}`);
    }
  };

  const tileClassName = ({ date }) => {
    const formattedDate = date.toISOString().split('T')[0];
    const entry = availability.find((entry) => entry.Date === formattedDate);
    if (entry) {
      return entry.IsAvailable ? styles.available : styles.unavailable;
    }
    return null;
  };

  if (loading || !dentistId) {
    return <div>Loading calendar...</div>;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.subtitle}>My Availability Calendar</h2>
      <div className={styles.calendarContainer}>
        <Calendar
          onClickDay={handleDateClick}
          tileClassName={tileClassName}
          minDate={new Date()}
          className={styles.calendar}
        />
      </div>
      <div className={styles.legend}>
        <span className={styles.availableLegend}>Available</span>
        <span className={styles.unavailableLegend}>Unavailable</span>
      </div>
    </section>
  );
};

export default DentistCalendar;