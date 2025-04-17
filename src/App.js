import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PatientDashboard from "./pages/PatientDashboard";
import DentistDashboard from "./pages/DentistDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import PatientLogin from "./pages/PatientLogin";
import PatientSignUp from "./pages/PatientSignUp";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/PatientLogin" element={<PatientLogin />} />
        <Route path="/PatientSignUp" element={<PatientSignUp />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/patient-dashboard"
          element={
            <ProtectedRoute role="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dentist-dashboard/*" // Wildcard for nested routes
          element={
            <ProtectedRoute role="dentist">
              <DentistDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;