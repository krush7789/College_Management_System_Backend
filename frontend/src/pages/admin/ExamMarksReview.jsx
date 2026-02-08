import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { crud, exams as examsApi } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle, AlertCircle, XCircle, Eye, Search, Filter, RefreshCw, ChevronLeft, Users } from 'lucide-react';
import { Input } from "@/components/ui/input";

const ExamMarksReview = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [marks, setMarks] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await examsApi.getAll();
            setExams(res.data.items || []);
        } catch (error) {
            console.error("Error fetching exams:", error);
        }
    };

    const fetchMarks = async (exam) => {
        setLoading(true);
        setSelectedExam(exam);
        try {
            const res = await examsApi.getMarks(exam.id);
            setMarks(res.data);
        } catch (error) {
            console.error("Error fetching marks:", error);
            toast({
                title: "Error",
                description: "Failed to load marks for this exam.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (markIds, status) => {
        if (!selectedExam) return;
        setLoading(true);
        try {
            await examsApi.reviewMarks(selectedExam.id, markIds, status);
            toast({
                title: "Success",
                description: `Successfully ${status} ${markIds.length} marks.`,
            });
            fetchMarks(selectedExam);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update marks status.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const pendingCount = marks.filter(m => m.status === 'pending').length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/admin/dashboard')}
                        className="rounded-xl hover:bg-slate-100 h-12 w-12"
                    >
                        <ChevronLeft className="h-6 w-6 text-slate-400" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <ShieldCheck className="h-8 w-8 text-indigo-600" />
                            Marks Review & Approval
                        </h1>
                        <p className="text-slate-500 font-medium">Review and validate marks submitted by teachers.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Exam List Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="border-0 shadow-sm rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                All Exams
                                <Filter className="h-4 w-4 text-slate-300" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50">
                                {exams.length === 0 ? (
                                    <div className="p-10 text-center space-y-3">
                                        <AlertCircle className="h-10 w-10 text-slate-200 mx-auto" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Exams Found</p>
                                    </div>
                                ) : exams.map((exam) => (
                                    <button
                                        key={exam.id}
                                        onClick={() => fetchMarks(exam)}
                                        className={`w-full text-left p-6 transition-all hover:bg-indigo-50/50 ${selectedExam?.id === exam.id ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-200' : ''}`}
                                    >
                                        <h4 className="font-black text-slate-900 text-sm uppercase">{exam.exam_name}</h4>
                                        <div className="flex items-center gap-3 mt-2">
                                            <Badge variant="outline" className="text-[9px] font-bold border-slate-200 text-slate-400 rounded-md uppercase">
                                                {exam.total_marks} Marks
                                            </Badge>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">IDC: {exam.id.slice(0, 8)}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Marks Detail Area */}
                <div className="lg:col-span-2">
                    {selectedExam ? (
                        <Card className="border-0 shadow-xl rounded-[2.5rem] overflow-hidden">
                            <div className="bg-slate-900 p-8 text-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Badge className="bg-indigo-500 text-white border-0 rounded-lg mb-4 text-[10px] uppercase font-black">
                                            Review Mode
                                        </Badge>
                                        <h3 className="text-3xl font-black">{selectedExam.exam_name}</h3>
                                        <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mt-2">
                                            {marks.length} Total Records • {pendingCount} Pending Review
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => fetchMarks(selectedExam)}
                                            disabled={loading}
                                            className="h-10 w-10 text-white hover:bg-white/10 rounded-xl"
                                        >
                                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            disabled={pendingCount === 0 || loading}
                                            onClick={() => handleReview(marks.filter(m => m.status === 'pending').map(m => m.id), 'approved')}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl px-6"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve All Pending
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by student name..."
                                        className="pl-12 h-12 bg-white border-slate-200 rounded-xl"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <CardContent className="p-0">
                                <div className="max-h-[600px] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                                            <TableRow>
                                                <TableHead className="pl-8">Student</TableHead>
                                                <TableHead className="text-center">Marks</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead className="pr-8 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {marks.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-64 text-center">
                                                        <div className="flex flex-col items-center gap-4 text-slate-300">
                                                            <Users className="h-12 w-12" />
                                                            <div>
                                                                <p className="text-lg font-black text-slate-900">No marks found</p>
                                                                <p className="text-xs font-bold uppercase tracking-widest mt-1">Teacher may not have submitted marks yet</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : marks
                                                .filter(m => m.student_name.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map((mark) => (
                                                    <TableRow key={mark.id} className="hover:bg-slate-50/30 transition-colors">
                                                        <TableCell className="pl-8">
                                                            <p className="font-black text-slate-900">{mark.student_name}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">IDC: {mark.student_id.slice(0, 8)}</p>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {mark.is_absent ? (
                                                                <Badge className="bg-slate-100 text-slate-500 border-slate-200 font-bold text-[10px]">ABSENT</Badge>
                                                            ) : (
                                                                <span className="text-lg font-black text-slate-700">
                                                                    {mark.marks_obtained} <span className="text-slate-300 text-sm">/ {selectedExam.total_marks}</span>
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge className={`
                                                            rounded-md px-2 py-0.5 text-[10px] font-black uppercase
                                                            ${mark.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                    mark.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                        'bg-amber-50 text-amber-600 border-amber-100'}
                                                        `}>
                                                                {mark.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="pr-8 text-right">
                                                            {mark.status === 'pending' && (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-9 w-9 p-0 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                                        onClick={() => handleReview([mark.id], 'approved')}
                                                                    >
                                                                        <CheckCircle className="h-5 w-5" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-9 w-9 p-0 text-rose-600 hover:bg-rose-50 rounded-lg"
                                                                        onClick={() => handleReview([mark.id], 'rejected')}
                                                                    >
                                                                        <XCircle className="h-5 w-5" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                            {mark.status !== 'pending' && (
                                                                <span className="text-[9px] font-black text-slate-300 uppercase italic">Review Fixed</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
                            <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-200">
                                <Eye className="h-10 w-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Select an exam to review</h3>
                            <p className="text-slate-400 font-medium mt-2 max-w-sm">
                                Use the sidebar to browse through exams and validate the marks submitted by teachers.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamMarksReview;
