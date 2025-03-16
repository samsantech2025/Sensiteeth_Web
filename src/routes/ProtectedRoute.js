import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ProtectedRoute = ({ children, role }) => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      setAuthenticated(true);

      const { data: profile, error } = await supabase
        .from("Users")
        .select("role")
        .eq("email", session.user.email)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
      } else {
        setUserRole(profile.role);
      }

      setLoading(false);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          setAuthenticated(false);
          setUserRole(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    // Redirect based on the expected role
    if (role === "patient") {
      return <Navigate to="/PatientLogin" />;
    } else if (role === "dentist") {
      return <Navigate to="/" />; // Assuming a DentistLogin exists; adjust as needed
    }
    return <Navigate to="/" />; // Fallback for unknown roles
  }

  if (userRole !== role) {
    // Redirect to home if role mismatch
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;