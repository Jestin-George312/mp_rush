import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
// import StudentDashboard from './student/Dashboard';

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Role-based redirects disabled for development/exploration
    // if (user.role === 'guide') {
    //     return <Navigate to="/guide/dashboard" replace />;
    // }

    // if (user.role === 'coordinator') {
    //     return <Navigate to="/coordinator/manage" replace />;
    // }

    return <Navigate to="/student/dashboard" replace />;
};

export default Dashboard;
