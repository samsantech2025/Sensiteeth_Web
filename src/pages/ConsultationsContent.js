import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from "./DentistDashboard.module.css";

const ConsultationsContent = ({ dentistId }) => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [finalDiagnosis, setFinalDiagnosis] = useState("");
  const [finalDiagnosisDesc, setFinalDiagnosisDesc] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [followUpDate, setFollowUpDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const SUPABASE_STORAGE_URL = "https://snvrykahnydcsdvfwfbw.supabase.co/storage/v1/object/public/";

  useEffect(() => {
    const fetchUserRoleAndConsultations = async () => {
      try {
        setLoading(true);
        setError(null);

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
        console.log("Fetched user role:", role);
        console.log("User email:", session.user.email);

        const { data: consultationData, error: consultationError } = await supabase
          .from("Consultation")
          .select("*, Patient(FirstName, LastName), Diagnosis(*)")
          .eq("DentistId", dentistId)
          .order("AppointmentDate", { ascending: true });

        if (consultationError) {
          console.error("Error fetching consultations:", consultationError);
          setError("Failed to load consultations.");
          setLoading(false);
          return;
        }

        setAppointments(consultationData);
        setFilteredAppointments(consultationData);
        console.log("Fetched Appointments:", consultationData);
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error in fetchUserRoleAndConsultations:", err);
        setError("An unexpected error occurred.");
        setLoading(false);
      }
    };

    if (dentistId) {
      fetchUserRoleAndConsultations();
    } else {
      setError("Dentist ID not provided.");
      setLoading(false);
    }
  }, [dentistId]);

  useEffect(() => {
    let filtered = appointments;

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (appointment) => appointment.Status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((appointment) => {
        const fullName = `${appointment.Patient.FirstName} ${appointment.Patient.LastName}`.toLowerCase();
        return fullName.includes(searchLower);
      });
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [statusFilter, searchTerm, appointments]);

  const handleApprove = async (appointmentId) => {
    try {
      const { data, error } = await supabase
        .from("Consultation")
        .update({ Status: "approved" })
        .eq("id", appointmentId)
        .select();

      if (error) throw new Error(`Error approving consultation: ${error.message}`);
      console.log("Consultation approved successfully:", data);
      await refreshAppointments();
    } catch (error) {
      console.error("Approve error:", error.message);
      setError(`An error occurred: ${error.message}`);
    }
  };

  const handleReject = async (appointmentId) => {
    try {
      const { data, error } = await supabase
        .from("Consultation")
        .update({ Status: "rejected" })
        .eq("id", appointmentId)
        .select();

      if (error) throw new Error(`Error rejecting consultation: ${error.message}`);
      console.log("Consultation rejected successfully:", data);
      await refreshAppointments();
    } catch (error) {
      console.error("Reject error:", error.message);
      setError(`An error occurred: ${error.message}`);
    }
  };

  const refreshAppointments = async () => {
    try {
      const { data: updatedAppointments, error: refreshError } = await supabase
        .from("Consultation")
        .select("*, Patient(FirstName, LastName), Diagnosis(*)")
        .eq("DentistId", dentistId)
        .order("AppointmentDate", { ascending: true });

      if (refreshError) {
        console.error("Error refreshing appointments:", refreshError);
        setError("Failed to refresh consultations.");
        return;
      }

      setAppointments(updatedAppointments);
    } catch (error) {
      console.error("Refresh error:", error.message);
      setError("Failed to refresh consultations.");
    }
  };

  const handleViewDiagnosis = (diagnosis) => {
    if (diagnosis && diagnosis.length > 0) {
      setSelectedDiagnosis(diagnosis[0]);
      setFinalDiagnosis(diagnosis[0].FinalDiagnosis || "");
      setFinalDiagnosisDesc(diagnosis[0].FinalDiagnosisDesc || "");
      setImageError(false);
      console.log("Opening modal with Image URL:", diagnosis[0].ImageUrl);
      setIsModalOpen(true);
    } else {
      console.log("No diagnosis available to view/edit.");
    }
  };

  const handleUpdateDiagnosis = async () => {
    if (!selectedDiagnosis) return;

    try {
      const { data: diagnosisData, error: diagnosisError } = await supabase
        .from("Diagnosis")
        .update({
          FinalDiagnosis: finalDiagnosis,
          FinalDiagnosisDesc: finalDiagnosisDesc,
        })
        .eq("id", selectedDiagnosis.id)
        .select();

      if (diagnosisError) {
        console.error("Update diagnosis error:", diagnosisError);
        throw new Error(`Error updating diagnosis: ${diagnosisError.message}`);
      }
      console.log("Diagnosis updated successfully:", diagnosisData);

      if (finalDiagnosis && finalDiagnosis.trim() !== "") {
        const consultationId = selectedDiagnosis.ConsultationId;
        const { data: consultationData, error: consultationError } = await supabase
          .from("Consultation")
          .update({ Status: "complete" })
          .eq("id", consultationId)
          .select();

        if (consultationError) {
          console.error("Update consultation status error:", consultationError);
          throw new Error(`Error updating consultation status: ${consultationError.message}`);
        }
        console.log("Consultation status updated to 'complete':", consultationData);
      }

      await refreshAppointments();
      setIsModalOpen(false);
      setSelectedDiagnosis(null);
      setFinalDiagnosis("");
      setFinalDiagnosisDesc("");
    } catch (error) {
      console.error("Update error:", error.message);
      setError(`An error occurred: ${error.message}`);
    }
  };

  const handleSetFollowUp = (appointment) => {
    setSelectedConsultation(appointment);
    setFollowUpDate(appointment.followupdate ? new Date(appointment.followupdate).toISOString().slice(0, 16) : "");
    setFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = async () => {
    if (!selectedConsultation) return;

    try {
      const { data, error } = await supabase
        .from("Consultation")
        .update({ followupdate: followUpDate ? new Date(followUpDate).toISOString() : null })
        .eq("id", selectedConsultation.id)
        .select();

      if (error) throw new Error(`Error setting follow-up date: ${error.message}`);
      console.log("Follow-up date updated successfully:", data);
      await refreshAppointments();
      setFollowUpModalOpen(false);
      setSelectedConsultation(null);
      setFollowUpDate("");
    } catch (error) {
      console.error("Follow-up error:", error.message);
      setError(`An error occurred: ${error.message}`);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    console.error("Image failed to load:", selectedDiagnosis?.ImageUrl);
  };

  const getFullImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${SUPABASE_STORAGE_URL}${url}`;
  };

  const totalRecords = filteredAppointments.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredAppointments.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return <div>Loading consultations...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.subtitle}>Consultations</h2>
      <div className={styles.filterContainer}>
        <div className={styles.filterGroup}>
          <label htmlFor="statusFilter">Filter by Status: </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="partially complete">Partially Complete</option>
            <option value="complete">Complete</option>
          </select>
        </div>
        <div className={styles.searchGroup}>
          <label htmlFor="patientSearch">Search by Patient Name: </label>
          <input
            id="patientSearch"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter patient name..."
            className={styles.searchInput}
          />
        </div>
      </div>
      {filteredAppointments.length > 0 ? (
        <>
          <table className={styles.appointmentTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Status</th>
                <th>Follow-Up Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{new Date(appointment.AppointmentDate).toLocaleDateString()}</td>
                  <td>{`${appointment.Patient.FirstName} ${appointment.Patient.LastName}`}</td>
                  <td>{appointment.Status}</td>
                  <td>
                    {appointment.followupdate
                      ? new Date(appointment.followupdate).toLocaleDateString()
                      : "Not set"}
                  </td>
                  <td>
                    {(userRole === "dentist" || userRole === "secretary") &&
                      appointment.Status === "pending" && (
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
                    {userRole === "dentist" && appointment.Diagnosis && appointment.Diagnosis.length > 0 && (
                      <button
                        className={styles.actionButton}
                        onClick={() => handleViewDiagnosis(appointment.Diagnosis)}
                      >
                        View/Edit Diagnosis
                      </button>
                    )}
                    {(userRole === "dentist" || userRole === "secretary") &&
                      appointment.Status === "complete" && (
                        <button
                          className={styles.actionButton}
                          onClick={() => handleSetFollowUp(appointment)}
                        >
                          Set Follow-Up
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.paginationContainer}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`${styles.paginationButton} ${
                  currentPage === page ? styles.paginationButtonActive : ""
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={styles.paginationButton}
            >
              Next
            </button>
          </div>
          <div className={styles.paginationInfo}>
            Showing {startIndex + 1} to {Math.min(endIndex, totalRecords)} of {totalRecords} records
          </div>
        </>
      ) : (
        <p>No consultations match your criteria.</p>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Diagnosis Details</h3>
            {selectedDiagnosis && (
              <>
                <div className={styles.modalcont}>
                  <div className={styles.txtfieldcont}>
                    <p>
                      <strong>Initial Diagnosis:</strong> {selectedDiagnosis.InitialDiagnosis}
                    </p>
                    <p>
                      <strong>Confidence:</strong>{" "}
                      {(selectedDiagnosis.Confidence * 100).toFixed(2)}%
                    </p>
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
                      <p style={{ color: "red" }}>
                        Unable to load image. URL: {getFullImageUrl(selectedDiagnosis.ImageUrl)}
                      </p>
                    ) : (
                      <img
                        src={getFullImageUrl(selectedDiagnosis.ImageUrl)}
                        alt="Diagnosis"
                        style={{ maxWidth: "100%", height: "auto", borderRadius: "8px" }}
                        onError={handleImageError}
                        onLoad={() => console.log("Image loaded successfully")}
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

      {followUpModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Set Follow-Up Date</h3>
            <div className={styles.modalcont}>
              <label>
                Follow-Up Date:
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className={styles.inputField}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </label>
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.actionButton}
                onClick={handleSaveFollowUp}
              >
                Save
              </button>
              <button
                className={styles.actionButton}
                onClick={() => setFollowUpModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ConsultationsContent;