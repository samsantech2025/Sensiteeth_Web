import React, { useState, useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from './DentistDashboard.module.css';
import Sidebar from "../components/Sidebar";
import DashboardContent from "./DashboardContent";
import ConsultationsContent from "./ConsultationsContent";
import ProfileContent from "./ProfileContent";

const DentistDashboard = () => {
  const navigate = useNavigate();
  const [dentistId, setDentistId] = useState(null);
  // eslint-disable-next-line
  const [email, setEmail] = useState('');
  const [dentistData, setDentistData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileWarning, setProfileWarning] = useState(false);

  useEffect(() => {
    const fetchDentistData = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("Error getting session:", sessionError);
        navigate('/');
        return;
      }

      setEmail(session.user.email);

      const { data: dentistData, error: dentistError } = await supabase
        .from('Dentist')
        .select('id, DentistName, ContactNo, Email, LicenseNo, Address, LicenseNoUrl') // Fetch all fields
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
      setDentistData(dentistData);
      // Update profile warning to check all required fields
      setProfileWarning(!dentistData.DentistName || !dentistData.ContactNo || !dentistData.LicenseNo || !dentistData.Address);
      console.log('Fetched Dentist Data:', dentistData);
    };

    fetchDentistData();
  }, [navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  if (!dentistId) {
    return <div>Loading dentist data...</div>;
  }

  return (
    <div className={styles.container}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        toggleProfile={toggleProfile} 
      />
      <div className={`${styles.mainContent} ${isSidebarOpen ? styles.contentWithSidebar : styles.contentFull}`}>
        {profileWarning && !isProfileOpen && (
          <div className={styles.warning}>
            Please complete your profile by adding your name, contact number, license number, and address in the Profile section.
          </div>
        )}
        <Routes>
          <Route 
            path="/" 
            element={<DashboardContent dentistId={dentistId} />}
          />
          <Route 
            path="/consultations" 
            element={<ConsultationsContent />}
          />
          <Route 
            path="/profile" 
            element={<ProfileContent dentistId={dentistId} dentistData={dentistData} setDentistData={setDentistData} setProfileWarning={setProfileWarning} />}
          />
        </Routes>
      </div>
    </div>
  );
};

export default DentistDashboard;