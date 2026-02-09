import { useAuth } from "../../context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatCard from '@/components/StatCard';
import SectionHeader from '@/components/SectionHeader';
import {
    BookOpen,
    Clock,
    CheckCircle2,
    MapPin,
    AlertCircle,
    Megaphone,
    Calendar as CalendarIcon
} from "lucide-react";
import { useNavigate, Link } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";

const StudentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Using Custom Hook
    const { stats, loading, error } = useStudentDashboard();

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

    // Calculate generic stats
    const totalCourses = stats?.course_progress?.length || 0;
    const overallAttendance = stats?.attendance_overall || 0;
    const activeLeaves = stats?.active_leaves_count || 0;

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <SectionHeader
                title="Student Dashboard"
                subtitle={`Welcome back, ${user?.first_name}. Here's your academic overview.`}
                actions={
                    <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium">
                        {stats?.semester || 'N/A'}
                    </Badge>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard
                    label="Overall Attendance"
                    value={`${overallAttendance}%`}
                    icon={CheckCircle2}
                    iconColor="mint"
                    trend={overallAttendance >= 75 ? 'Good standing' : 'Low attendance'}
                />
                <StatCard
                    label="Enrolled Courses"
                    value={totalCourses}
                    icon={BookOpen}
                    iconColor="purple"
                    trend="Current semester subjects"
                />
                <StatCard
                    label="Leaves With Status Pending"
                    value={activeLeaves}
                    icon={Clock}
                    iconColor="amber"
                    trend={activeLeaves > 0 ? 'Pending approval' : 'No active requests'}
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
                            <Link to="/student/timetable">Full Timetable</Link>
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
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>{cls.time}</span>
                                                </div>
                                                {cls.room && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        <span>Room {cls.room}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                                    <CalendarIcon className="h-6 w-6 text-slate-400" />
                                </div>
                                <h3 className="text-sm font-medium text-slate-900">No classes scheduled</h3>
                                <p className="text-xs text-slate-500 mt-1">Enjoy your free time!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions / Notifications */}
                <div className="space-y-6">
                    {/* Restored Calendar Component */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-900">Calendar</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={new Date()}
                                onSelect={(date) => {
                                    if (date) {
                                        const formattedDate = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
                                        navigate(`/student/attendance?date=${formattedDate}`);
                                    }
                                }}
                                className="rounded-md border"
                            />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-900">Academic Progress</CardTitle>
                            <CardDescription>Recent performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {stats?.course_progress?.map((course, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-slate-700">{course.subject}</span>
                                            <span className={`font-bold ${course.attendance >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {course.attendance}%
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${course.attendance >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                style={{ width: `${course.attendance}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" className="w-full mt-2" size="sm" asChild>
                                    <Link to="/student/results">View Results</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-indigo-600 text-white shadow-lg shadow-indigo-200 border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5" />
                                Announcements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-indigo-100 text-sm mb-4">Stay updated with the latest news and notices from your faculty.</p>
                            <Button variant="secondary" className="w-full bg-white text-indigo-600 hover:bg-indigo-50" asChild>
                                <Link to="/student/announcements">View All</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
