import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const ProtectedRoutes = ({ allowedRoles }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400 animate-pulse">Loading Application...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has required role
    if (allowedRoles && !allowedRoles.includes(user?.role?.toLowerCase())) {
        // Redirect to their respective home if they try to access something they shouldn't
        if (user?.role?.toLowerCase() === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user?.role?.toLowerCase() === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
        if (user?.role?.toLowerCase() === 'student') return <Navigate to="/student/dashboard" replace />;

        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoutes;