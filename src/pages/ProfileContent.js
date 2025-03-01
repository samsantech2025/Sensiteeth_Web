import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from './DentistDashboard.module.css';

const ProfileContent = ({ dentistId, dentistData, setDentistData, setProfileWarning }) => {
  const [profileForm, setProfileForm] = useState({
    DentistName: '',
    ContactNo: '',
    LicenseNo: '',
    Address: '',
    LicenseNoUrl: ''
  });
  const [licenseFile, setLicenseFile] = useState(null);

  useEffect(() => {
    console.log('dentistData received:', dentistData); // Debug log
    if (dentistData) {
      // Handle potential column name variations
      setProfileForm({
        DentistName: dentistData.DentistName || '',
        ContactNo: dentistData.ContactNo || '',
        LicenseNo: dentistData.LicenseNo || dentistData.license_no || '',
        Address: dentistData.Address || dentistData.address || '',
        LicenseNoUrl: dentistData.LicenseNoUrl || dentistData.license_no_url || ''
      });
    }
  }, [dentistData]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLicenseFile(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.DentistName || !profileForm.ContactNo || !profileForm.LicenseNo || !profileForm.Address) {
      alert("Please fill in all required fields: Dentist Name, Contact Number, License Number, and Address.");
      return;
    }

    try {
      let licenseUrl = profileForm.LicenseNoUrl;

      if (licenseFile) {
        const fileExt = licenseFile.name.split('.').pop();
        const fileName = `${dentistId}-${Date.now()}.${fileExt}`;
        const filePath = `DentistLicenseNoFiles/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('SensiteethBucket')
          .upload(filePath, licenseFile);

        if (uploadError) {
          throw new Error(`Error uploading license: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('SensiteethBucket')
          .getPublicUrl(filePath);

        licenseUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('Dentist')
        .update({ 
          DentistName: profileForm.DentistName, 
          ContactNo: profileForm.ContactNo,
          LicenseNo: profileForm.LicenseNo,
          Address: profileForm.Address,
          LicenseNoUrl: licenseUrl
        })
        .eq('id', dentistId)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        throw new Error(`Error updating profile: ${error.message}`);
      }

      setDentistData(data);
      setProfileWarning(false);
      console.log("Profile updated successfully:", data);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error('Profile update error:', error.message);
      alert(`An error occurred: ${error.message}`);
    }
  };

  const handleViewLicense = () => {
    if (profileForm.LicenseNoUrl) {
      window.open(profileForm.LicenseNoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={styles.profileFormContainer}>
      <h2 className={styles.subtitle}>Complete Your Profile</h2>
      <form onSubmit={handleProfileSubmit} className={styles.profileForm}>
        <div className={styles.formGroup}>
          <label htmlFor="DentistName">Dentist Name:</label>
          <input
            type="text"
            name="DentistName"
            id="DentistName"
            value={profileForm.DentistName}
            onChange={handleProfileChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="ContactNo">Contact Number:</label>
          <input
            type="tel"
            name="ContactNo"
            id="ContactNo"
            value={profileForm.ContactNo}
            onChange={handleProfileChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="LicenseNo">License Number:</label>
          <input
            type="text"
            name="LicenseNo"
            id="LicenseNo"
            value={profileForm.LicenseNo}
            onChange={handleProfileChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="Address">Address:</label>
          <textarea
            name="Address"
            id="Address"
            value={profileForm.Address}
            onChange={handleProfileChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="LicenseFile">Dentist License Picture:</label>
          <input
            type="file"
            name="LicenseFile"
            id="LicenseFile"
            onChange={handleFileChange}
            accept="image/*"
            className={styles.input}
          />
          {profileForm.LicenseNoUrl && (
            <div className={styles.licensePreview}>
              <p>Current License Uploaded</p>
              <button 
                type="button" 
                onClick={handleViewLicense}
                className={`${styles.button} ${styles.viewButton}`}
              >
                View License
              </button>
            </div>
          )}
        </div>
        <button type="submit" className={styles.button}>Save Profile</button>
      </form>
    </div>
  );
};

export default ProfileContent;