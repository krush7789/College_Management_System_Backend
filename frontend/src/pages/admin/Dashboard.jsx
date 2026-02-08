import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboard } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    GraduationCap, Users, Building2,
    ClipboardList, Clock, BookOpen
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AnnouncementWidget from '@/components/AnnouncementWidget';
import DefaultersWidget from '@/components/dashboard/DefaultersWidget';
import StatCard from '@/components/StatCard';
import SectionHeader from '@/components/SectionHeader';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        students: 0,
        teachers: 0,
        branches: 0,
        sections: 0,
        semesters: 0,
        pending_leaves: 0,
        active_exams: 0
    });
    const [performanceData, setPerformanceData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [examPerformance, setExamPerformance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetch: Stats (Counts + Activity) AND Branch Performance
                const [statsRes, perfRes] = await Promise.all([
                    dashboard.getStats(),
                    dashboard.getPerformance()
                ]);

                console.log('Admin Dashboard - Stats Response:', statsRes.data);
                console.log('Admin Dashboard - Performance Response:', perfRes.data);

                // Assuming backend returns structure: { counts: {...}, recent_activity: [...], exam_performance: [...] }
                const { counts, recent_activity, exam_performance } = statsRes.data;

                setStats(counts || {
                    students: 0,
                    teachers: 0,
                    branches: 0,
                    sections: 0,
                    semesters: 0,
                    pending_leaves: 0,
                    active_exams: 0
                });
                setRecentActivity(recent_activity || []);
                setExamPerformance(exam_performance || []);
                setPerformanceData(perfRes.data || []);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                console.error('Error details:', err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const overviewCards = [
        {
            label: 'Total Students',
            value: stats.students,
            icon: GraduationCap,
            iconColor: 'blue'
        },
        {
            label: 'Faculty Members',
            value: stats.teachers,
            icon: Users,
            iconColor: 'lavender'
        },
        {
            label: 'Departments',
            value: stats.branches,
            icon: Building2,
            iconColor: 'purple'
        },
        {
            label: 'Active Exams',
            value: stats.active_exams,
            icon: BookOpen,
            iconColor: 'mint'
        },
        {
            label: 'Pending Leaves',
            value: stats.pending_leaves,
            icon: Clock,
            iconColor: 'amber'
        },
    ];

    const quickActions = [
        { label: 'Add Student', path: '/admin/students', icon: GraduationCap },
        { label: 'Add Teacher', path: '/admin/teachers', icon: Users },
        { label: 'Departments', path: '/admin/branches', icon: Building2 },
        { label: 'Assign Faculty', path: '/admin/assignments', icon: ClipboardList },
    ];

    const CHART_COLORS = ['#A5B4FC', '#93C5FD', '#C4B5FD', '#D8B4FE', '#F9A8D4', '#FCD34D'];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-slate-500 font-medium text-sm">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <SectionHeader
                title="Analytics"
                subtitle={`Hey, ${user?.first_name}. Welcome back!`}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                {overviewCards.map((card, idx) => (
                    <StatCard
                        key={idx}
                        label={card.label}
                        value={card.value}
                        icon={card.icon}
                        iconColor={card.iconColor}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Chart */}
                <Card className="lg:col-span-2 border border-[var(--card-border)] shadow-[var(--shadow-sm)] rounded-xl">
                    <CardHeader className="px-6 py-5 border-b border-[var(--border)]">
                        <div>
                            <CardTitle className="text-sm font-semibold text-[var(--foreground)]">Lead Insight</CardTitle>
                            <CardDescription className="text-xs text-[var(--muted-foreground)] mt-1">Average exam scores across departments</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="code"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 11 }}
                                        dy={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8FAFC' }}
                                        contentStyle={{
                                            backgroundColor: '#FFFFFF',
                                            borderRadius: '10px',
                                            border: '1px solid #E2E8F0',
                                            boxShadow: 'var(--shadow-md)',
                                            color: '#1E293B',
                                            fontSize: '12px',
                                            padding: '8px 12px'
                                        }}
                                    />
                                    <Bar dataKey="average" radius={[6, 6, 0, 0]} maxBarSize={32}>
                                        {performanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Widgets */}
                <div className="space-y-6">
                    <AnnouncementWidget limit={2} />

                    <div className="h-[400px]">
                        <DefaultersWidget />
                    </div>

                    <Card className="border border-[var(--card-border)] shadow-[var(--shadow-sm)] rounded-xl overflow-hidden">
                        <CardHeader className="px-6 py-5 border-b border-[var(--border)]">
                            <CardTitle className="text-sm font-semibold text-[var(--foreground)]">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-2 gap-3">
                            {quickActions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(action.path)}
                                    className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--muted)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-all duration-200 border border-transparent hover:border-[var(--border)]"
                                >
                                    <action.icon className="h-5 w-5 mb-2" />
                                    <span className="text-xs font-medium">{action.label}</span>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Exam Performance Section */}
            <Card className="border border-[var(--card-border)] shadow-[var(--shadow-sm)] rounded-xl">
                <CardHeader className="px-6 py-5 border-b border-[var(--border)]">
                    <CardTitle className="text-sm font-semibold text-[var(--foreground)]">Recent Exams Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {examPerformance.length > 0 ? examPerformance.map((exam, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-[var(--muted)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-[var(--shadow-sm)] transition-all">
                                <span className="text-sm font-medium text-[var(--foreground)]">{exam.name}</span>
                                <span className="px-3 py-1 bg-white text-[var(--muted-foreground)] text-xs font-bold rounded-md shadow-sm border border-[var(--border)]">{exam.average}% Avg</span>
                            </div>
                        )) : (
                            <div className="col-span-3 text-center text-[var(--muted-foreground)] py-8">No exam data available</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
