import React, { useState, useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from './DentistDashboard.module.css';
import Sidebar from "../components/Sidebar";
import DashboardContent from "./DashboardContent";
import ConsultationsContent from "./ConsultationsContent";
import ProfileContent from "./ProfileContent";
import DentistCalendar from "./DentistCalendar";

const DentistDashboard = () => {
  const navigate = useNavigate();
  const [dentistId, setDentistId] = useState(null);
  const [email, setEmail] = useState('');
  const [dentistData, setDentistData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileWarning, setProfileWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session || !session.user) {
          console.error("Session error or no user:", sessionError);
          navigate("/");
          return;
        }

        const userEmail = session.user.email;
        setEmail(userEmail);
        console.log("User email:", userEmail);

        // Fetch user role from Users table
        const { data: userData, error: userError } = await supabase
          .from("Users")
          .select("role")
          .eq("email", userEmail)
          .single();

        if (userError || !userData) {
          console.error("Error fetching user role:", userError);
          setError("Unable to fetch user role.");
          navigate("/");
          return;
        }

        const role = userData.role ? userData.role.toLowerCase() : null;
        console.log("User role:", role);
        setUserRole(role);

        let fetchedDentistId;

        if (role === "dentist") {
          // Fetch dentist data
          const { data: dentist, error: dentistError } = await supabase
            .from("Dentist")
            .select("id, DentistName, ContactNo, Email, LicenseNo, Address, LicenseNoUrl")
            .eq("Email", userEmail)
            .single();

          if (dentistError || !dentist) {
            console.error("Error fetching dentist data:", dentistError);
            setError("Unable to fetch dentist data.");
            navigate("/");
            return;
          }

          setDentistData(dentist);
          fetchedDentistId = dentist.id;

          // Check if profile is incomplete
          setProfileWarning(
            !dentist.DentistName ||
            !dentist.ContactNo ||
            !dentist.LicenseNo ||
            !dentist.Address
          );
        } else if (role === "secretary") {
          // Fetch secretary's associated dentist_id
          const { data: secretaryData, error: secretaryError } = await supabase
            .from("secretary")
            .select("dentist_id")
            .eq("email", userEmail)
            .single();

          if (secretaryError || !secretaryData) {
            console.error("Error fetching secretary data:", secretaryError);
            setError("Unable to fetch secretary data.");
            navigate("/");
            return;
          }

          fetchedDentistId = secretaryData.dentist_id;
          console.log("Secretary's dentist_id:", fetchedDentistId);

          // Fetch dentist data for display (optional, if needed)
          const { data: dentist, error: dentistError } = await supabase
            .from("Dentist")
            .select("id, DentistName, ContactNo, Email, LicenseNo, Address, LicenseNoUrl")
            .eq("id", fetchedDentistId)
            .single();

          if (dentistError || !dentist) {
            console.error("Error fetching dentist data for secretary:", dentistError);
            setError("Unable to fetch associated dentist data.");
            navigate("/");
            return;
          }

          setDentistData(dentist);
        } else {
          console.error("Unauthorized role:", role);
          setError("Unauthorized role.");
          navigate("/");
          return;
        }

        setDentistId(fetchedDentistId);
      } catch (err) {
        console.error("Unexpected error in fetchUserData:", err);
        setError("An unexpected error occurred.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  if (loading) {
    return <div className={styles.loading}>Loading dentist data...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!dentistId) {
    return <div className={styles.error}>Dentist ID not found. Please try again later.</div>;
  }

  return (
    <div className={styles.container}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        toggleProfile={toggleProfile} 
      />
      <main className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        {profileWarning && !isProfileOpen && userRole === "dentist" && (
          <div className={styles.warning}>
            Please complete your profile by adding your name, contact number, license number, and address in the Profile section.
          </div>
        )}
        <Routes>
          <Route path="/" element={<DashboardContent dentistId={dentistId} />} />
          <Route path="/consultations" element={<ConsultationsContent dentistId={dentistId} />} />
          <Route 
            path="/profile" 
            element={
              userRole === "dentist" ? (
                <ProfileContent 
                  dentistId={dentistId} 
                  dentistData={dentistData} 
                  setDentistData={setDentistData} 
                  setProfileWarning={setProfileWarning} 
                />
              ) : (
                <div className={styles.error}>Access denied. Secretaries cannot edit dentist profiles.</div>
              )
            } 
          />
          <Route path="/calendar" element={<DentistCalendar dentistId={dentistId} />} />
        </Routes>
      </main>
    </div>
  );
};

export default DentistDashboard;