import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { dashboard, attendance } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Calendar, BookOpen, Search, Filter, ChevronLeft, ChevronRight, PieChart } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SectionHeader from '@/components/SectionHeader';
import StatCard from '@/components/StatCard';

const StudentAttendance = () => {
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const initialDate = searchParams.get('date') || '';

    const [loading, setLoading] = useState(true);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [stats, setStats] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Pagination state
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const pageSize = 15;

    useEffect(() => {
        fetchAttendanceData();
    }, [page, statusFilter]);

    const fetchAttendanceData = async () => {
        try {
            setLoading(true);
            const statsRes = await dashboard.getStudentStats();
            setStats(statsRes.data);

            const res = await attendance.getStudentAttendanceRecords({
                skip: page * pageSize,
                limit: pageSize,
                start_date: initialDate || undefined,
                end_date: initialDate || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined
            });

            setAttendanceRecords(Array.isArray(res.data.items) ? res.data.items : []);
            setTotal(res.data.total || 0);
        } catch (error) {
            console.error("Error fetching attendance:", error);
            toast({
                title: "Error",
                description: "Failed to load attendance records.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredRecords = (attendanceRecords || []).filter(record => {
        const subjectName = record.subject_name || '';
        const matchesSearch = subjectName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = !initialDate || record.date.startsWith(initialDate);
        return matchesSearch && matchesDate;
    });

    const getStatusBadge = (status) => {
        if (status === 'present') {
            return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Present</Badge>;
        }
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Absent</Badge>;
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading attendance details...</div>;
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Attendance Records"
                subtitle="Track your detailed academic attendance records"
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <StatCard
                    label="Overall Attendance"
                    value={`${stats?.attendance_overall || 0}%`}
                    icon={PieChart}
                    iconColor="mint"
                    trend="Average across all subjects"
                />
                {stats?.course_progress?.slice(0, 3).map((cp, i) => (
                    <StatCard
                        key={i}
                        label={cp.subject}
                        value={`${cp.attendance}%`}
                        icon={BookOpen}
                        iconColor={cp.attendance >= 75 ? 'mint' : 'amber'}
                        className="hidden md:block"
                    />
                ))}
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold text-slate-900">Attendance History</CardTitle>
                            <CardDescription>Detailed log of your class attendance</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search subject..."
                                    className="pl-9 w-full sm:w-[200px] bg-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[140px] bg-white">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <div className="relative w-full overflow-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-600">Subject</TableHead>
                                <TableHead className="font-semibold text-slate-600">Date</TableHead>
                                <TableHead className="font-semibold text-slate-600">Status</TableHead>
                                <TableHead className="font-semibold text-slate-600">Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                                        No attendance records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRecords.map((record) => (
                                    <TableRow key={record.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-medium text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-slate-400" />
                                                {record.subject_name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {new Date(record.date).toLocaleDateString(undefined, {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(record.status)}
                                        </TableCell>
                                        <TableCell className="text-slate-500 italic text-sm">
                                            {record.remarks || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="border-t border-slate-100 p-4 flex items-center justify-between bg-slate-50/50">
                    <div className="text-xs text-slate-500">
                        Showing <strong>{Math.min(total, page * pageSize + 1)}-{Math.min(total, (page + 1) * pageSize)}</strong> of <strong>{total}</strong>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="h-8 px-3"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={(page + 1) * pageSize >= total}
                            className="h-8 px-3"
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default StudentAttendance;
