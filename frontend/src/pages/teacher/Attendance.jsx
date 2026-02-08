import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Users, CheckCircle, XCircle, Save, History, Search, Fingerprint, CalendarDays, Activity, Filter } from 'lucide-react';
import { attendance, dashboard } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import SectionHeader from '@/components/SectionHeader';

const Attendance = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Selection State
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Data State
    const [students, setStudents] = useState([]);
    const [existingRecord, setExistingRecord] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const formik = useFormik({
        initialValues: {
            attendanceMap: {} // { studentId: { status, remarks } }
        },
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (!selectedAssignment) return;

            try {
                setSaving(true);
                const entries = Object.entries(values.attendanceMap)
                    .filter(([studentId, data]) => students.some(s => s.id === studentId)) // Ensure valid student
                    .map(([studentId, data]) => ({
                        student_id: studentId,
                        status: data.status,
                        remarks: data.remarks
                    }));

                const payload = {
                    section_id: selectedAssignment.section_id,
                    subject_id: selectedAssignment.subject_id,
                    attendance_date: selectedDate,
                    entries: entries
                };

                await attendance.markBulkAttendance(payload);

                toast({
                    title: "Success",
                    description: existingRecord
                        ? "Attendance updated successfully."
                        : "Attendance marked successfully.",
                });
                setExistingRecord(true);
            } catch (error) {
                console.error("Error saving attendance:", error);
                toast({
                    title: "Error",
                    description: "Failed to save attendance.",
                    variant: "destructive",
                });
            } finally {
                setSaving(false);
            }
        }
    });

    useEffect(() => {
        fetchAssignments();
    }, []);

    useEffect(() => {
        if (selectedAssignment) {
            fetchStudentsAndAttendance();
        }
    }, [selectedAssignment, selectedDate]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const res = await dashboard.getTeacherStats();
            if (res.data && res.data.assigned_courses) {
                setAssignments(res.data.assigned_courses);
                if (res.data.assigned_courses.length > 0) {
                    setSelectedAssignment(res.data.assigned_courses[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching assignments:", error);
            toast({
                title: "Error",
                description: "Failed to load your assigned classes.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentsAndAttendance = async () => {
        if (!selectedAssignment) return;

        try {
            setLoading(true);
            const sectionId = selectedAssignment.section_id;
            const subjectId = selectedAssignment.subject_id;

            const [studentsRes, attendanceRes] = await Promise.all([
                attendance.getSectionStudents(sectionId),
                attendance.getAttendanceForDate(sectionId, subjectId, selectedDate)
            ]);

            const studentList = studentsRes.data;
            setStudents(studentList);

            const initialMap = {};
            const existingRecords = attendanceRes.data;

            if (existingRecords && existingRecords.length > 0) {
                setExistingRecord(true);
                existingRecords.forEach(record => {
                    initialMap[record.student_id] = {
                        status: record.status,
                        remarks: record.remarks || ''
                    };
                });
            } else {
                setExistingRecord(false);
                studentList.forEach(student => {
                    initialMap[student.id] = {
                        status: 'present',
                        remarks: ''
                    };
                });
            }

            formik.setFieldValue('attendanceMap', initialMap);

        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to load students or attendance data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const markAll = (status) => {
        const newMap = { ...formik.values.attendanceMap };
        students.forEach(student => {
            if (newMap[student.id]) {
                newMap[student.id].status = status;
            }
        });
        formik.setFieldValue('attendanceMap', newMap);
    };

    const filteredStudents = students.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const total = students.length;
    // Calculate stats from formik state
    const presentCount = Object.values(formik.values.attendanceMap || {}).filter(v => v?.status === 'present').length;
    const absentCount = Object.values(formik.values.attendanceMap || {}).filter(v => v?.status === 'absent').length;

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Attendance Management"
                subtitle="Mark daily attendance and view records"
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="gap-2">
                            <History className="h-4 w-4" />
                            View Logs
                        </Button>
                        <Button
                            onClick={formik.handleSubmit}
                            disabled={saving || !selectedAssignment || formik.isSubmitting}
                            className="gap-2 bg-primary hover:bg-primary/90"
                        >
                            {saving ? <Activity className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Records
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - Controls & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Session Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-500 uppercase">Class & Subject</Label>
                                <Select
                                    value={selectedAssignment ? JSON.stringify(selectedAssignment) : ""}
                                    onValueChange={(val) => setSelectedAssignment(JSON.parse(val))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select class..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assignments.map((assignment, idx) => (
                                            <SelectItem key={idx} value={JSON.stringify(assignment)}>
                                                {assignment.section_name} - {assignment.subject_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-500 uppercase">Date</Label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-xs text-slate-500 font-medium uppercase">Total</p>
                                    <p className="text-2xl font-bold text-slate-900">{total}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <p className="text-xs text-emerald-600 font-medium uppercase">Present</p>
                                    <p className="text-2xl font-bold text-emerald-700">{presentCount}</p>
                                </div>
                                <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 col-span-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-rose-600 font-medium uppercase">Absent</p>
                                            <p className="text-2xl font-bold text-rose-700">{absentCount}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => markAll('present')}
                                    className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 data-[state=on]:bg-emerald-100"
                                >
                                    All Present
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => markAll('absent')}
                                    className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                                >
                                    All Absent
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content - Student List */}
                <div className="lg:col-span-3">
                    <Card className="shadow-sm border-slate-200 h-full flex flex-col">
                        <CardHeader className="border-b border-slate-100 py-4 px-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        Student List
                                        {existingRecord && (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] uppercase font-bold tracking-wider">
                                                Editing Record
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search student..."
                                        className="pl-9 h-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden min-h-[500px]">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px]">
                                    <Activity className="h-8 w-8 animate-spin text-indigo-500" />
                                    <p className="text-sm font-medium">Loading roster...</p>
                                </div>
                            ) : students.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px]">
                                    <Users className="h-10 w-10 text-slate-300" />
                                    <p className="text-sm font-medium">No students found in this section.</p>
                                </div>
                            ) : (
                                <div className="h-full overflow-auto">
                                    <form onSubmit={formik.handleSubmit}>
                                        <Table>
                                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                                <TableRow>
                                                    <TableHead className="w-[80px]">Roll No</TableHead>
                                                    <TableHead>Student Name</TableHead>
                                                    <TableHead className="text-center w-[200px]">Status</TableHead>
                                                    <TableHead className="w-[300px]">Remarks</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredStudents.map((student) => {
                                                    const data = formik.values.attendanceMap?.[student.id];
                                                    const status = data?.status;

                                                    return (
                                                        <TableRow key={student.id} className={status === 'absent' ? 'bg-rose-50/30' : ''}>
                                                            <TableCell className="font-medium text-slate-700">
                                                                {student.roll_number}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-slate-900">{student.first_name} {student.last_name}</span>
                                                                    <span className="text-xs text-slate-400">{student.email}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant={status === 'present' ? "default" : "ghost"}
                                                                        onClick={() => formik.setFieldValue(`attendanceMap.${student.id}.status`, 'present')}
                                                                        className={`h-8 px-3 ${status === 'present'
                                                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                                                            : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                                                                            }`}
                                                                    >
                                                                        P
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant={status === 'absent' ? "default" : "ghost"}
                                                                        onClick={() => formik.setFieldValue(`attendanceMap.${student.id}.status`, 'absent')}
                                                                        className={`h-8 px-3 ${status === 'absent'
                                                                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                                                                            : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                                                                            }`}
                                                                    >
                                                                        A
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    placeholder="Add remark..."
                                                                    value={data?.remarks || ''}
                                                                    onChange={(e) => formik.setFieldValue(`attendanceMap.${student.id}.remarks`, e.target.value)}
                                                                    className="h-8 text-xs bg-white"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </form>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
