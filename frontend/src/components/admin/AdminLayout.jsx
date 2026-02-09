import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Building2,
    Calendar,
    Users,
    GraduationCap,
    BookOpen,
    ClipboardList,
    LogOut,
    Search,
    Bell,
    Layers,
    ShieldCheck,
    Lock,
    Megaphone,
    User,
    Info
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/branches', label: 'Branches', icon: Building2 },
    { path: '/admin/semesters', label: 'Semesters', icon: Calendar },
    { path: '/admin/sections', label: 'Sections', icon: Layers },
    { path: '/admin/students', label: 'Students', icon: GraduationCap },
    { path: '/admin/teachers', label: 'Teachers', icon: Users },
    { path: '/admin/subjects', label: 'Subjects', icon: BookOpen },
    { path: '/admin/exams', label: 'Exams', icon: ClipboardList },
    { path: '/admin/assignments', label: 'Teacher Assignments', icon: ClipboardList },
    { path: '/admin/marks-review', label: 'Marks Review', icon: ShieldCheck },
    { path: '/admin/announcements', label: 'Announcements', icon: Megaphone },
];

const AdminLayout = () => {
    const { user, logout, isAuthorized } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!isAuthorized('admin')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50">
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
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-xl text-slate-800 tracking-tight">Academy</span>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                    <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-blue-50 text-blue-700'
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
                <div className="p-4 border-t border-slate-200">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                <Avatar className="h-8 w-8 border border-slate-200">
                                    <AvatarImage src={user?.profile_picture_url} alt={`${user?.first_name} ${user?.last_name}`} />
                                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-bold">
                                        {user.first_name[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-700 truncate">{user.first_name} {user.last_name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                </div>
                                <LogOut className="h-4 w-4 text-slate-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mb-2">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
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

            {/* Main Content Wrapper */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

                {/* Content Area */}
                <main className="flex-1 p-8">
                    {/* Security Banner */}
                    {user.is_first_login && (
                        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <Info className="h-5 w-5 text-amber-600" />
                                <div>
                                    <h4 className="text-sm font-semibold text-amber-800">Security Recommendation</h4>
                                    <p className="text-sm text-amber-700">Please change your temporary password.</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => navigate('/admin/profile')}
                                variant="outline"
                                size="sm"
                                className="border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                            >
                                Change Password
                            </Button>
                        </div>
                    )}

                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
