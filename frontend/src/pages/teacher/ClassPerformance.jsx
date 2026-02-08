import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { dashboard } from '@/services/api';
import { TrendingUp, Users, AlertTriangle, BookOpen, GraduationCap, Award, BarChart3, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ClassPerformance = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [trendsLoading, setTrendsLoading] = useState(false);
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [students, setStudents] = useState([]);
    const [trends, setTrends] = useState([]);

    useEffect(() => {
        fetchAssignments();
    }, []);

    useEffect(() => {
        if (selectedAssignment) {
            fetchPerformanceData();
            fetchTrends();
        }
    }, [selectedAssignment]);

    const fetchAssignments = async () => {
        try {
            const res = await dashboard.getTeacherStats();
            if (res.data.assigned_courses && res.data.assigned_courses.length > 0) {
                setAssignments(res.data.assigned_courses);
            }
        } catch (error) {
            console.error("Error fetching assignments:", error);
            toast({
                title: "Error",
                description: "Failed to load your classes.",
                variant: "destructive",
            });
        }
    };

    const fetchPerformanceData = async () => {
        if (!selectedAssignment) return;
        setLoading(true);
        try {
            const res = await dashboard.getClassPerformance({
                section_id: selectedAssignment.section_id,
                subject_id: selectedAssignment.subject_id
            });
            setStudents(res.data);
        } catch (error) {
            console.error("Error fetching performance:", error);
            toast({
                title: "Error",
                description: "Failed to load class performance.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchTrends = async () => {
        if (!selectedAssignment) return;
        setTrendsLoading(true);
        try {
            const res = await dashboard.getExamPerformanceTrends({
                section_id: selectedAssignment.section_id,
                subject_id: selectedAssignment.subject_id
            });
            setTrends(res.data);
        } catch (error) {
            console.error("Error fetching trends:", error);
        } finally {
            setTrendsLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (status.includes("Critical") || status.includes("Low")) return "bg-red-50 text-red-700 border-red-200";
        if (status.includes("At Risk") || status.includes("Average")) return "bg-amber-50 text-amber-700 border-amber-200";
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    };

    // Analytics Calculations
    const classAvg = students.length > 0
        ? (students.reduce((acc, s) => acc + (s.exam_avg || 0), 0) / students.filter(s => s.exam_avg !== null).length).toFixed(1)
        : 0;

    const failingCount = students.filter(s => s.exam_avg !== null && s.exam_avg < 40).length;
    const topPerformers = students.filter(s => s.exam_avg >= 80).length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Class Performance</h1>
                    <p className="text-sm text-slate-500">Analyze student performance and trends.</p>
                </div>
                <div className="w-full md:w-64">
                    <Select
                        value={selectedAssignment ? JSON.stringify(selectedAssignment) : ""}
                        onValueChange={(val) => setSelectedAssignment(JSON.parse(val))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Class & Subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {assignments.map((assignment, idx) => (
                                <SelectItem key={idx} value={JSON.stringify(assignment)}>
                                    {assignment.section} - {assignment.subject}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {!selectedAssignment ? (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 text-slate-400">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No Class Selected</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm">Please select a class from the dropdown above to view performance metrics and insights.</p>
                </div>
            ) : (
                <>
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Class Average</CardTitle>
                                <TrendingUp className="h-4 w-4 text-indigo-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900">{classAvg}%</div>
                                <p className="text-xs text-slate-500 mt-1">Overall performance</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Top Performers</CardTitle>
                                <Award className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900">{topPerformers}</div>
                                <p className="text-xs text-slate-500 mt-1">Students above 80%</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Needs Attention</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-rose-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900">{failingCount}</div>
                                <p className="text-xs text-slate-500 mt-1">Students below 40%</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Total Students</CardTitle>
                                <Users className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900">{students.length}</div>
                                <p className="text-xs text-slate-500 mt-1">Enrolled in section</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Performance Trend Chart */}
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-slate-500" />
                                    Performance Trends
                                </CardTitle>
                                <CardDescription>Class average progression over time</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4">
                                {trendsLoading ? (
                                    <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">Loading trends...</div>
                                ) : trends.length === 0 ? (
                                    <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 text-sm">
                                        <p>No examination data available yet.</p>
                                    </div>
                                ) : (
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={trends}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis
                                                    dataKey="exam_name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                                    domain={[0, 100]}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '8px',
                                                        border: '1px solid #e2e8f0',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="average"
                                                    stroke="#4f46e5"
                                                    strokeWidth={2}
                                                    dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Student Performance Table */}
                        <Card className="shadow-sm border-slate-200 flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-slate-500" />
                                    Student Report
                                </CardTitle>
                                <CardDescription>Detailed list with risk assessment</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-auto min-h-[300px] max-h-[400px]">
                                <Table>
                                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="w-[80px]">Roll No</TableHead>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead className="text-center">Average</TableHead>
                                            <TableHead className="text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map((student) => {
                                            const isFailing = student.exam_avg !== null && student.exam_avg < 40;
                                            return (
                                                <TableRow key={student.id} className="hover:bg-slate-50">
                                                    <TableCell className="font-medium text-slate-700">
                                                        {student.roll_no}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`font-medium ${isFailing ? 'text-rose-600' : 'text-slate-900'}`}>{student.name}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {student.exam_avg !== null ? (
                                                            <span className={`font-bold ${isFailing ? 'text-rose-600' : 'text-slate-700'}`}>
                                                                {student.exam_avg}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs italic">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="outline" className={`${getStatusColor(student.status)}`}>
                                                            {student.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

export default ClassPerformance;
