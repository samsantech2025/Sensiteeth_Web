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
  const [secretaryForm, setSecretaryForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [secretaryError, setSecretaryError] = useState(null);
  const [secretaryLoading, setSecretaryLoading] = useState(false);

  useEffect(() => {
    console.log('dentistData received:', dentistData);
    if (dentistData) {
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

  const handleSecretaryChange = (e) => {
    const { name, value } = e.target;
    setSecretaryForm(prev => ({ ...prev, [name]: value }));
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

  const handleSecretarySubmit = async (e) => {
    e.preventDefault();
    setSecretaryError(null);
    setSecretaryLoading(true);

    const { email, password, confirmPassword, name } = secretaryForm;

    if (!email || !password || !confirmPassword || !name) {
      setSecretaryError("Please fill in all required fields: Name, Email, Password, and Confirm Password.");
      setSecretaryLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setSecretaryError("Passwords do not match!");
      setSecretaryLoading(false);
      return;
    }

    if (password.length < 6) {
      setSecretaryError("Password must be at least 6 characters.");
      setSecretaryLoading(false);
      return;
    }

    try {
      // Sign up the secretary with Supabase Auth
      const { data: { user }, error: signUpError } = await supabase.auth.signUp(
        { email, password },
        {
          data: { role: 'secretary' },
          emailRedirectTo: window.location.origin
        }
      );

      if (signUpError) {
        console.error('Auth signup error:', signUpError);
        throw new Error(signUpError.message);
      }

      if (!user) {
        throw new Error("Signup failed: No user returned.");
      }

      console.log("Auth signup successful:", user);

      // Insert into Users table (matching Signup.js, no user_id)
      const { error: userInsertError } = await supabase
        .from('Users')
        .insert([{ email, role: 'secretary' }]);

      if (userInsertError) {
        console.error('Users table insert error:', userInsertError);
        throw new Error(`Users table insert failed: ${userInsertError.message}`);
      }

      console.log("Users table insert successful");

      // Insert into secretary table
      const { error: secretaryInsertError } = await supabase
        .from('secretary')
        .insert([{ user_id: user.id, dentist_id: dentistId, name, email, role: 'secretary' }]);

      if (secretaryInsertError) {
        console.error('Secretary table insert error:', secretaryInsertError);
        throw new Error(`Secretary table insert failed: ${secretaryInsertError.message}`);
      }

      console.log("Secretary table insert successful");

      setSecretaryLoading(false);
      alert("Secretary account created successfully! They must confirm their email to log in.");
      setSecretaryForm({ email: '', password: '', confirmPassword: '', name: '' });
    } catch (error) {
      console.error('Secretary creation error:', error.message);
      setSecretaryError(error.message);
      setSecretaryLoading(false);
    }
  };

  const handleViewLicense = () => {
    if (profileForm.LicenseNoUrl) {
      window.open(profileForm.LicenseNoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={styles.profileSection}>
      <div className={styles.dentistSectionCont1}>
        <h2 className={styles.subtitle}>Dentist Profile</h2>
        <div className={styles.profileFormContainer}>
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
      </div>

      <div className={styles.dentistSectionCont2}>
        <h2 className={styles.subtitle}>Create Secretary Account</h2>
        {secretaryError && <p className={styles.error}>{secretaryError}</p>}
        <div className={styles.profileFormContainer}>
          <form onSubmit={handleSecretarySubmit} className={styles.profileForm}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Secretary Name:</label>
              <input
                type="text"
                name="name"
                id="name"
                value={secretaryForm.name}
                onChange={handleSecretaryChange}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                name="email"
                id="email"
                value={secretaryForm.email}
                onChange={handleSecretaryChange}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                name="password"
                id="password"
                value={secretaryForm.password}
                onChange={handleSecretaryChange}
                required
                className={styles.input}
                minLength="6"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={secretaryForm.confirmPassword}
                onChange={handleSecretaryChange}
                required
                className={styles.input}
                minLength="6"
              />
            </div>
            <button 
              type="submit" 
              className={styles.button} 
              disabled={secretaryLoading}
            >
              {secretaryLoading ? "Creating..." : "Create Secretary"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileContent;