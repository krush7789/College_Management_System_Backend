import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { dashboard, exams as examsApi, attendance as attendanceApi } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import {
    Save,
    ChevronLeft,
    RefreshCw,
    Activity,
    Award
} from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';

const ExamMarksEntry = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [assignments, setAssignments] = useState([]);
    const [exams, setExams] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [selectedExam, setSelectedExam] = useState(null);
    const [students, setStudents] = useState([]);

    // Formik handling the marks state
    const formik = useFormik({
        initialValues: {
            marks: {} // { studentId: { marks_obtained, is_absent, status } }
        },
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (!selectedExam) return;
            setLoading(true);
            try {
                const marksToSubmit = Object.entries(values.marks)
                    .filter(([_, data]) => data.status !== 'approved')
                    .map(([studentId, data]) => ({
                        student_id: studentId,
                        marks_obtained: data.is_absent ? null : parseInt(data.marks_obtained) || 0,
                        is_absent: data.is_absent
                    }));

                if (marksToSubmit.length === 0) {
                    toast({
                        title: "Info",
                        description: "No new or pending marks to submit. Approved marks are locked.",
                    });
                    return;
                }

                await examsApi.submitMarks(selectedExam.id, { marks: marksToSubmit });
                toast({
                    title: "Success",
                    description: "Marks submitted for review.",
                });
                fetchExistingMarks(); // Refresh data to get updated statuses
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to submit marks.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        }
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedAssignment) {
            fetchExamsForAssignment();
            fetchStudents();
        }
    }, [selectedAssignment]);

    useEffect(() => {
        if (selectedExam) {
            fetchExistingMarks();
        }
    }, [selectedExam]);

    const fetchInitialData = async () => {
        try {
            const res = await dashboard.getTeacherStats();
            if (res.data.assigned_courses) {
                setAssignments(res.data.assigned_courses);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const fetchExamsForAssignment = async () => {
        if (!selectedAssignment) return;
        try {
            const res = await examsApi.getAll({
                subject_id: selectedAssignment.subject_id,
                section_id: selectedAssignment.section_id
            });
            setExams(res.data.items || []);
            setSelectedExam(null);
        } catch (error) {
            console.error("Error fetching exams:", error);
        }
    };

    const fetchStudents = async () => {
        if (!selectedAssignment) return;
        try {
            const res = await attendanceApi.getSectionStudents(selectedAssignment.section_id);
            setStudents(res.data);

            // Initialize basic structure for new students
            const initialMarks = formik.values.marks || {};
            res.data.forEach(s => {
                if (!initialMarks[s.id]) {
                    initialMarks[s.id] = { marks_obtained: "", is_absent: false, status: null };
                }
            });
            formik.setFieldValue('marks', initialMarks);

        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const fetchExistingMarks = async () => {
        if (!selectedExam) return;
        setLoading(true);
        try {
            const res = await examsApi.getMarks(selectedExam.id);

            // Merge existing marks with student list structure
            const currentMarks = { ...formik.values.marks };

            // Ensure all students have an entry (even if just fetched above, re-ensure)
            students.forEach(s => {
                if (!currentMarks[s.id]) {
                    currentMarks[s.id] = { marks_obtained: "", is_absent: false, status: null };
                }
            });

            res.data.forEach(m => {
                currentMarks[m.student_id] = {
                    marks_obtained: m.marks_obtained !== null ? m.marks_obtained.toString() : "",
                    is_absent: m.is_absent,
                    status: m.status
                };
            });

            formik.setFieldValue('marks', currentMarks);
        } catch (error) {
            console.error("Error fetching marks:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Marks Entry"
                subtitle="Record and submit student assessment scores"
                actions={
                    <div className="flex gap-2">
                        {selectedExam && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={fetchExistingMarks}
                                    disabled={loading}
                                    className="gap-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    Sync
                                </Button>
                                <Button
                                    onClick={formik.handleSubmit}
                                    disabled={loading || formik.isSubmitting}
                                    className="bg-primary hover:bg-primary/90 gap-2"
                                >
                                    {loading ? <Activity className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Commit Entries
                                </Button>
                            </>
                        )}
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Step 1: Select Class</CardTitle>
                        <CardDescription>Choose the section and subject.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selectedAssignment ? JSON.stringify(selectedAssignment) : ""}
                            onValueChange={(val) => setSelectedAssignment(JSON.parse(val))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a section..." />
                            </SelectTrigger>
                            <SelectContent>
                                {assignments.map((a, i) => (
                                    <SelectItem key={i} value={JSON.stringify(a)}>
                                        {a.section} — {a.subject}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Step 2: Select Exam</CardTitle>
                        <CardDescription>Choose the assessment to grade.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select
                            disabled={!selectedAssignment}
                            value={selectedExam ? JSON.stringify(selectedExam) : ""}
                            onValueChange={(val) => setSelectedExam(JSON.parse(val))}
                        >
                            <SelectTrigger className={!selectedAssignment ? 'opacity-50' : ''}>
                                <SelectValue placeholder={selectedAssignment ? "Choose an exam..." : "Select class first"} />
                            </SelectTrigger>
                            <SelectContent>
                                {exams.map((e, i) => (
                                    <SelectItem key={i} value={JSON.stringify(e)}>
                                        {e.exam_name} — {e.total_marks} Marks
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            </div>

            {selectedExam && (
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100/50 rounded-lg text-indigo-600">
                                    <Award className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-semibold">{selectedExam.exam_name}</CardTitle>
                                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                                        Max Marks: <span className="font-medium text-slate-900">{selectedExam.total_marks}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-xs uppercase font-medium">{selectedAssignment.section} - {selectedAssignment.subject}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <form onSubmit={formik.handleSubmit}>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50 text-xs uppercase tracking-wider">
                                        <TableHead className="w-[100px] pl-6">Roll No</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead className="text-center w-[150px]">Status</TableHead>
                                        <TableHead className="text-center w-[100px]">Absent</TableHead>
                                        <TableHead className="text-right pr-6 w-[180px]">Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => {
                                        // Access via formik values
                                        const markData = formik.values.marks[student.id];
                                        // If data hasn't initialized yet, fallback to safe defaults or wait
                                        if (!markData) return null;

                                        const status = markData.status;

                                        return (
                                            <TableRow key={student.id} className="hover:bg-slate-50/50">
                                                <TableCell className="pl-6 font-medium text-slate-600">
                                                    {student.roll_number}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-slate-900">
                                                        {student.first_name} {student.last_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {status ? (
                                                        <Badge variant="outline" className={`
                                                            ${status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                    'bg-amber-50 text-amber-700 border-amber-200'}
                                                        `}>
                                                            {status}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Pending</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center">
                                                        <Checkbox
                                                            checked={markData.is_absent}
                                                            disabled={status === 'approved'}
                                                            onCheckedChange={(val) => formik.setFieldValue(`marks.${student.id}.is_absent`, val)}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="pr-6 text-right">
                                                    <Input
                                                        type="number"
                                                        disabled={markData.is_absent || status === 'approved'}
                                                        value={markData.marks_obtained}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            // Basic validation to cap at max marks
                                                            if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= selectedExam.total_marks)) {
                                                                formik.setFieldValue(`marks.${student.id}.marks_obtained`, val);
                                                            }
                                                        }}
                                                        className={`w-24 ml-auto text-right ${markData.is_absent ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                                                        placeholder="0"
                                                        min="0"
                                                        max={selectedExam.total_marks}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ExamMarksEntry;
