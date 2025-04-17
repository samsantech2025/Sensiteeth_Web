import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { supabase } from "../supabaseClient";
import styles from "./DentistDashboard.module.css";
import "react-calendar/dist/Calendar.css";

const DentistCalendar = ({ dentistId }) => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUserRoleAndAvailability = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user role to determine permissions
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("No user session found.");
          setLoading(false);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("Users")
          .select("role")
          .eq("email", session.user.email)
          .single();

        if (userError || !userData) {
          console.error("Error fetching user role:", userError);
          setError("Unable to fetch user role.");
          setLoading(false);
          return;
        }

        const role = userData.role.toLowerCase();
        setUserRole(role);
        console.log("User role in DentistCalendar:", role);

        // Fetch availability using the passed dentistId
        const { data: availabilityData, error: availabilityError } = await supabase
          .from("DentistAvailability")
          .select("Date, IsAvailable")
          .eq("DentistId", dentistId);

        if (availabilityError) {
          console.error("Error fetching availability:", availabilityError);
          setError("Failed to load availability.");
          setLoading(false);
          return;
        }

        setAvailability(availabilityData || []);
        console.log("Fetched Availability:", availabilityData);
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error in fetchUserRoleAndAvailability:", err);
        setError("An unexpected error occurred.");
        setLoading(false);
      }
    };

    if (dentistId) {
      fetchUserRoleAndAvailability();
    } else {
      setError("Dentist ID not provided.");
      setLoading(false);
    }
  }, [dentistId]);

  const formatDateToPhilippines = (date) => {
    const philippineDate = new Date(date);
    const year = philippineDate.getFullYear();
    const month = String(philippineDate.getMonth() + 1).padStart(2, "0");
    const day = String(philippineDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = async (date) => {
    if (!dentistId) {
      alert("Dentist ID not set. Please try again or contact support.");
      return;
    }

    const formattedDate = formatDateToPhilippines(date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (date < currentDate) {
      alert("Cannot set availability for past dates.");
      return;
    }

    const existingEntry = availability.find((entry) => entry.Date === formattedDate);

    try {
      if (existingEntry) {
        const newStatus = !existingEntry.IsAvailable;
        const { data, error } = await supabase
          .from("DentistAvailability")
          .update({ IsAvailable: newStatus })
          .eq("DentistId", dentistId)
          .eq("Date", formattedDate)
          .select();

        if (error) throw error;
        setAvailability((prev) =>
          prev.map((entry) =>
            entry.Date === formattedDate ? { ...entry, IsAvailable: newStatus } : entry
          )
        );
        console.log("Updated availability:", data);
      } else {
        const { data, error } = await supabase
          .from("DentistAvailability")
          .insert([{ DentistId: dentistId, Date: formattedDate, IsAvailable: true }])
          .select();

        if (error) throw error;
        setAvailability((prev) => [...prev, { Date: formattedDate, IsAvailable: true }]);
        console.log("Added new availability:", data);
      }
    } catch (error) {
      console.error("Error updating availability:", error.message);
      setError(`Error: ${error.message}`);
    }
  };

  const tileClassName = ({ date }) => {
    const formattedDate = formatDateToPhilippines(date);
    const entry = availability.find((entry) => entry.Date === formattedDate);
    if (entry) {
      return entry.IsAvailable ? styles.available : styles.unavailable;
    }
    return null;
  };

  const tileDisabled = ({ date }) => {
    const formattedDate = formatDateToPhilippines(date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    return date < currentDate; // Disable past dates
  };

  if (loading) {
    return <div>Loading calendar...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.subtitle}>My Availability Calendar</h2>
      <div className={styles.calendarContainer}>
        <Calendar
          onClickDay={handleDateClick}
          tileClassName={tileClassName}
          tileDisabled={tileDisabled}
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