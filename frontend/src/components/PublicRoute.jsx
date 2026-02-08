import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const PublicRoute = () => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400 animate-pulse">Loading Application...</div>;
    }

    if (isAuthenticated) {
        // Redirect to their respective dashboard
        const role = user?.role?.toLowerCase();
        if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
        if (role === 'student') return <Navigate to="/student/dashboard" replace />;

        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
