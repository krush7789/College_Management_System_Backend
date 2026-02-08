import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { dashboard } from "../../services/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, BookOpen, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from 'recharts';
import SectionHeader from '@/components/SectionHeader';
import StatCard from '@/components/StatCard';

const StudentResults = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSemester, setSelectedSemester] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await dashboard.getStudentStats();
                setStats(res.data);
                if (res.data.performance_history) {
                    const sems = Object.keys(res.data.performance_history);
                    if (sems.length > 0) setSelectedSemester(sems[sems.length - 1]);
                }
            } catch (err) {
                console.error("Failed to fetch results:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    const currentSemData = selectedSemester ? stats?.performance_history?.[selectedSemester] : null;
    const examsList = currentSemData ? Object.entries(currentSemData.exams) : [];

    // Transform data for chart: Subject-wise performance average across exams
    // This is complex because exams structure is { "Mid Term": { subjects: [...] } }
    // We want to show performance per subject.
    const subjectPerformance = {};
    examsList.forEach(([examName, examData]) => {
        examData.subjects.forEach(sub => {
            if (!subjectPerformance[sub.name]) {
                subjectPerformance[sub.name] = { total: 0, count: 0, max: 100 };
            }
            // Normalize to percentage if total is not 100
            const pct = (sub.marks / sub.total) * 100;
            subjectPerformance[sub.name].total += pct;
            subjectPerformance[sub.name].count += 1;
        });
    });

    const chartData = Object.keys(subjectPerformance).map(sub => ({
        subject: sub,
        score: Math.round(subjectPerformance[sub].total / subjectPerformance[sub].count)
    }));

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Academic Results"
                subtitle="View your grades and performance analytics"
                actions={
                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                        <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue placeholder="Select Semester" />
                        </SelectTrigger>
                        <SelectContent>
                            {stats?.performance_history && Object.keys(stats.performance_history).map(sem => (
                                <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                }
            />

            {currentSemData ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <StatCard
                            label="Semester Average"
                            value={`${currentSemData.total_pct}%`}
                            icon={TrendingUp}
                            iconColor="mint"
                            trend="Aggregate score"
                        />
                        <StatCard
                            label="Exams Taken"
                            value={examsList.length}
                            icon={BookOpen}
                            iconColor="purple"
                            trend="Assessments completed"
                        />
                        <StatCard
                            label="Performance Status"
                            value={
                                currentSemData.total_pct >= 90 ? "Outstanding" :
                                    currentSemData.total_pct >= 75 ? "Good" :
                                        currentSemData.total_pct >= 60 ? "Average" : "Needs Improvement"
                            }
                            icon={Award}
                            iconColor="amber"
                            trend="Based on aggregate"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart Section */}
                        <Card className="lg:col-span-1 shadow-sm border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-slate-900">Subject Overview</CardTitle>
                                <CardDescription>Average performance across subjects</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" domain={[0, 100]} hide />
                                            <YAxis dataKey="subject" type="category" hide width={10} />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-white p-2 border border-slate-200 shadow-sm rounded-lg text-xs">
                                                                <p className="font-bold text-slate-900">{payload[0].payload.subject}</p>
                                                                <p className="text-indigo-600">{payload[0].value}% Average</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="score" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} background={{ fill: '#f1f5f9' }} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-3 mt-4">
                                    {chartData.map((d, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600 truncate max-w-[180px]" title={d.subject}>{d.subject}</span>
                                            <span className="font-bold text-slate-900">{d.score}%</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detailed Grades */}
                        <div className="lg:col-span-2 space-y-6">
                            {examsList.map(([examName, examData], idx) => (
                                <Card key={idx} className="shadow-sm border-slate-200">
                                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-base font-semibold text-slate-900">{examName}</CardTitle>
                                                <CardDescription>
                                                    Conducted on {new Date(examData.date).toLocaleDateString()}
                                                </CardDescription>
                                            </div>
                                            <Badge variant="outline" className="bg-white text-indigo-600 border-indigo-100">
                                                Avg: {examData.avg}%
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50%]">Subject</TableHead>
                                                    <TableHead className="text-right">Marks Obtained</TableHead>
                                                    <TableHead className="text-right">Total Marks</TableHead>
                                                    <TableHead className="text-right">Percentage</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {examData.subjects.map((sub, sIdx) => {
                                                    const pct = Math.round((sub.marks / sub.total) * 100);
                                                    return (
                                                        <TableRow key={sIdx} className="hover:bg-slate-50/50">
                                                            <TableCell className="font-medium text-slate-700">{sub.name}</TableCell>
                                                            <TableCell className="text-right text-slate-900">{sub.marks}</TableCell>
                                                            <TableCell className="text-right text-slate-500">{sub.total}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Badge className={`${pct >= 75 ? 'bg-emerald-100 text-emerald-700' : pct >= 40 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'} border-0 hover:bg-opacity-80`}>
                                                                    {pct}%
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                        <BookOpen className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No results found</h3>
                    <p className="text-slate-500 max-w-sm text-center mt-1">
                        There are no published results for the selected semester.
                    </p>
                </div>
            )}
        </div>
    );
};

export default StudentResults;
