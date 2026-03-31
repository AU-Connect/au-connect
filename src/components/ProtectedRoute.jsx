import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { currentUser, userData, loading, isOnboarded } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-app-bg">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // Redirect admins away from student pages (except for the profile page)
    if (userData?.role === 'admin' && location.pathname !== '/profile') {
        return <Navigate to="/admin" />;
    }

    // Force onboarding only for the report page
    if (location.pathname === '/report' && !isOnboarded) {
        return <Navigate to="/onboarding" />;
    }

    return children;
};

export default ProtectedRoute;
