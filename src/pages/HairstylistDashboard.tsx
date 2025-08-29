import React from 'react';
import { Navigate } from 'react-router-dom';

const HairstylistDashboard = () => {
  // Redirect to the default sub-route for hairstylist dashboard
  return <Navigate to="/hairstylist/dashboard/my-members" replace />;
};

export default HairstylistDashboard;
