import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboard } from "../../services/api";
import StatCard from '@/components/StatCard';
import SectionHeader from '@/components/SectionHeader';
import {
    Users,
    BookOpen,
    Clock,
    Calendar,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    MoreHorizontal,
    TrendingUp,
    MapPin
} from "lucide-react";
import { useNavigate, Link } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TeacherDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await dashboard.getTeacherStats();
                setStats(response.data);
            } catch (err) {
                console.error("Failed to fetch teacher stats:", err);
                setError("Could not load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
                    <Skeleton className="h-96 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-red-50 rounded-xl border border-red-100">
                <div className="bg-red-100 p-4 rounded-full mb-4">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-red-900 mb-2">Something went wrong</h3>
                <p className="text-red-600 max-w-md">{error}</p>
                <Button variant="outline" className="mt-4 border-red-200 text-red-700 hover:bg-red-50" onClick={() => window.location.reload()}>
                    Try Again
                </Button>
            </div>
        );
    }

    const uniqueSections = new Set(stats?.assigned_courses?.map(c => c.section)).size;

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <SectionHeader
                title="Teacher Dashboard"
                subtitle={`Welcome back, ${user?.first_name}. Here's what's happening today.`}
                actions={
                    <Button onClick={() => navigate('/teacher/attendance')} className="bg-primary hover:bg-primary/90">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Attendance
                    </Button>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard
                    label="Total Students"
                    value={stats?.stats?.total_students || 0}
                    icon={Users}
                    iconColor="blue"
                    trend={`Across ${uniqueSections} ${uniqueSections === 1 ? 'section' : 'sections'}`}
                />
                <StatCard
                    label="Assigned Courses"
                    value={stats?.stats?.total_courses || 0}
                    icon={BookOpen}
                    iconColor="lavender"
                    trend="Active this semester"
                />
                <StatCard
                    label="Pending Leaves"
                    value={stats?.stats?.pending_leaves_count || 0}
                    icon={Clock}
                    iconColor="amber"
                    trend={stats?.stats?.pending_leaves_count > 0 ? 'Requires attention' : 'All caught up'}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Today's Schedule */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-900">Today's Schedule</CardTitle>
                            <CardDescription>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link to="/teacher/timetable">View Full Timetable</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {stats?.today_classes?.length > 0 ? (
                            <div className="space-y-4">
                                {stats.today_classes.map((cls, idx) => (
                                    <div key={idx} className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                        <div className="flex-shrink-0 w-16 text-center py-2 bg-white rounded-md border border-slate-200 shadow-sm">
                                            <span className="block text-sm font-bold text-indigo-600">{cls.time?.split(' ')[0]}</span>
                                            <span className="block text-xs text-slate-500 uppercase">{cls.time?.split(' ')[1]}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-semibold text-slate-900 truncate">{cls.subject}</h4>
                                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                                                    Period {cls.period}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5" />
                                                    <span>{cls.section}</span>
                                                </div>
                                                {cls.room && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        <span>{cls.room}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate('/teacher/attendance')}>
                                                    Mark Attendance
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigate('/teacher/performance')}>
                                                    View Performance
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                                    <Calendar className="h-6 w-6 text-slate-400" />
                                </div>
                                <h3 className="text-sm font-medium text-slate-900">No classes scheduled</h3>
                                <p className="text-xs text-slate-500 mt-1">Enjoy your free time!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pending Requests / Quick Actions Side Panel */}
                <div className="space-y-6">
                    {/* Pending Leaves Card */}
                    <Card className="shadow-sm border-slate-200 h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-900">Leave Requests</CardTitle>
                            <CardDescription>Pending approval from students</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            {stats?.pending_leaves?.length > 0 ? (
                                <div className="space-y-4">
                                    {stats.pending_leaves.slice(0, 3).map((leave, idx) => (
                                        <div key={idx} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium text-sm text-slate-900">{leave.student_name}</span>
                                                <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50 border-amber-200">
                                                    Pending
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 mb-2 italic">"{leave.reason}"</p>
                                            <div className="flex items-center justify-between text-xs text-slate-400">
                                                <span>{leave.start_date}</span>
                                                <ArrowRight className="h-3 w-3" />
                                                <span>{leave.end_date}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.pending_leaves.length > 3 && (
                                        <Button variant="link" className="w-full text-indigo-600 h-auto p-0 text-xs" onClick={() => navigate('/teacher/leaves')}>
                                            View {stats.pending_leaves.length - 3} more
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
                                    <CheckCircle2 className="h-10 w-10 text-slate-200 mb-3" />
                                    <p className="text-sm">No pending requests</p>
                                </div>
                            )}
                        </CardContent>
                        {stats?.pending_leaves?.length > 0 && (
                            <div className="p-4 pt-0 mt-auto">
                                <Button variant="outline" className="w-full" onClick={() => navigate('/teacher/leaves')}>
                                    Review All Requests
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
