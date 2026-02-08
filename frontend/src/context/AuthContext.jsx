
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('access_token') || null);
    const [loading, setLoading] = useState(true);

    // Initialize session
    useEffect(() => {
        const initSession = async () => {
            // Check localStorage first (Persistent), then sessionStorage (Session-only)
            const storedToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

            if (storedToken) {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                    setToken(storedToken);
                } catch (error) {
                    console.error("Failed to restore session", error);
                    logout();
                }
            }
            setLoading(false);
        };

        initSession();
    }, []);

    const login = async (email, password, rememberMe = false) => {
        setLoading(true);
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            console.log("Attempting login via API for:", email);
            const response = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            console.log("API Response received:", response.status, response.data);

            const { access_token, refresh_token, user: userData } = response.data;

            // Store tokens based on rememberMe preference
            if (rememberMe) {
                localStorage.setItem('access_token', access_token);
                // Clear session storage just in case
                sessionStorage.removeItem('access_token');
            } else {
                sessionStorage.setItem('access_token', access_token);
                // Clear local storage just in case
                localStorage.removeItem('access_token');
            }

            Cookies.set('refresh_token', refresh_token, { expires: 7 });

            // Set state
            setToken(access_token);
            setUser(userData);

            return { success: true, user: userData };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Login failed'
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
        Cookies.remove('refresh_token');
    };

    const isAuthorized = (role) => {
        return user?.role === role;
    };

    const value = useMemo(() => ({
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAuthorized,
        login,
        logout
    }), [user, token, loading]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400 animate-pulse">Loading Application...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
