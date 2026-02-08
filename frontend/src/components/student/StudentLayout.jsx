import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Calendar,
    FileText,
    Sparkles,
    Megaphone,
    LogOut,
    User,
    GraduationCap,
    Clock,
    Award
} from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
    { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/student/attendance', label: 'My Attendance', icon: Calendar },
    { path: '/student/timetable', label: 'Class Timetable', icon: Clock },
    { path: '/student/results', label: 'Academic Results', icon: Award },
    { path: '/student/leaves', label: 'Leave Application', icon: FileText },
    { path: '/student/electives', label: 'Electives', icon: Sparkles },
    { path: '/student/announcements', label: 'Announcements', icon: Megaphone },
];

// ... (imports remain same, adding Notification imports and hooks)
import React, { useState, useEffect } from "react";
import { notifications } from "@/services/api";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

const StudentLayout = () => {
    const { user, logout, isAuthorized } = useAuth();
    const navigate = useNavigate();
    const [notifs, setNotifs] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const res = await notifications.getAll({ limit: 10, skip: 0 });
            // Backend returns list of notifications
            const data = Array.isArray(res.data) ? res.data : [];
            setNotifs(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
            if (error.response) {
                console.error("Notification Error Data:", error.response.data);
                console.error("Notification Error Status:", error.response.status);
            }
        }
    };

    useEffect(() => {
        if (isAuthorized('student')) {
            fetchNotifications();
            // Poll for notifications every minute
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [isAuthorized]);

    const handleMarkRead = async (id) => {
        try {
            await notifications.markRead([id]);
            setNotifs(notifs.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notifications.markAllRead();
            setNotifs(notifs.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all read", error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // ... (Unauthorized check remains same)

    if (!isAuthorized('student')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-50">
                <div className="text-center bg-white/80 backdrop-blur-xl p-12 rounded-[2rem] shadow-xl border border-white/50">
                    <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-2xl">🚫</span>
                    </div>
                    <p className="text-red-600 font-semibold text-lg">Unauthorized Access</p>
                    <p className="text-gray-500 text-sm mt-2">You don't have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar - Fixed & Full Height */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-50">
                {/* Logo */}
                <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-100">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-xl text-slate-800 tracking-tight">EduManage</span>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                    <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Student Portal</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`
                            }
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                                <Bell className="h-4 w-4 text-slate-600" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <Button variant="ghost" className="h-auto p-0 text-xs text-indigo-600" onClick={handleMarkAllRead}>
                                        Mark all read
                                    </Button>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ScrollArea className="h-[300px]">
                                {notifs.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-slate-500">
                                        No notifications
                                    </div>
                                ) : (
                                    notifs.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-indigo-50/50' : ''}`}
                                            onClick={() => !notification.is_read && handleMarkRead(notification.id)}
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1 space-y-1">
                                                    <p className={`text-sm ${!notification.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {notification.created_at ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : 'Just now'}
                                                    </p>
                                                </div>
                                                {!notification.is_read && (
                                                    <span className="h-2 w-2 bg-indigo-600 rounded-full mt-1.5 shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left flex-1 ml-2">
                                <Avatar className="h-8 w-8 border border-slate-200">
                                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs font-bold">
                                        {user?.first_name?.[0] || 'S'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 hidden md:block">
                                    <p className="text-sm font-medium text-slate-700 truncate">{user?.first_name} {user?.last_name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.enrollment_no || user?.email}</p>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mb-2">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate('/student/profile')}>
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>
// ... (rest remains same)

            {/* Main Content Wrapper */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {/* Content Area */}
                <main className="flex-1 p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;
