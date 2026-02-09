import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherAssignments, users, sections, subjects, branches, semesters } from '../../services/api';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Plus, Trash2, Search, Users, AlertCircle, BookOpen, Layers,
    GraduationCap, Building, Calendar, User, Briefcase, Power,
    CheckCircle, XCircle, ChevronLeft, ChevronRight, FileUp, FileSpreadsheet, Download
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SectionSelect } from '@/components/SectionSelect';

const initialFormData = {
    teacher_id: '',
    section_id: '',
    subject_id: ''
};

const TeacherAssignments = () => {
    const queryClient = useQueryClient();
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [selectedSemester, setSelectedSemester] = useState('all');
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const limit = 10;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [error, setError] = useState('');

    // Data Fetching
    const { data: assignmentsData = { items: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['teacher-assignments', page, searchTerm, selectedBranch, selectedSemester],
        queryFn: async () => {
            const params = {
                skip: (page - 1) * limit,
                limit,
                search: searchTerm
            };
            if (selectedBranch && selectedBranch !== 'all') params.branch_id = selectedBranch;
            if (selectedSemester && selectedSemester !== 'all') params.semester_id = selectedSemester;

            const res = await teacherAssignments.getAll(params);
            return res.data;
        }
    });

    const assignmentsList = assignmentsData.items || [];
    const totalCount = assignmentsData.total || 0;

    const { data: teachersData = { items: [], total: 0 } } = useQuery({
        queryKey: ['teachers'],
        queryFn: async () => {
            const res = await users.getAll({ role: 'teacher' });
            return res.data;
        }
    });
    const teachersList = teachersData.items || [];

    const { data: sectionsData = { items: [], total: 0 } } = useQuery({
        queryKey: ['sections'],
        queryFn: async () => {
            const res = await sections.getAll();
            return res.data;
        }
    });
    const sectionsList = sectionsData.items || [];

    const { data: subjectsData = { items: [], total: 0 } } = useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            const res = await subjects.getAll();
            return res.data;
        }
    });
    const subjectsList = subjectsData.items || [];

    const { data: branchesData = { items: [], total: 0 } } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await branches.getAll({ limit: 100 });
            return res.data;
        }
    });
    const branchesList = branchesData.items || (Array.isArray(branchesData) ? branchesData : []);

    const { data: semestersData = { items: [], total: 0 } } = useQuery({
        queryKey: ['semesters'],
        queryFn: async () => {
            const res = await semesters.getAll({ limit: 100 });
            return res.data;
        }
    });
    const semestersList = semestersData.items || (Array.isArray(semestersData) ? semestersData : []);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => teacherAssignments.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['teacher-assignments']);
            setIsModalOpen(false);
            setFormData(initialFormData);
            setError('');
        },
        onError: (err) => setError(err.response?.data?.detail || 'Failed to create assignment.')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => teacherAssignments.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['teacher-assignments']),
        onError: () => alert('Failed to delete assignment')
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }) => teacherAssignments.update(id, { is_active }),
        onSuccess: () => queryClient.invalidateQueries(['teacher-assignments']),
        onError: () => alert('Failed to update status')
    });

    // Handlers
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.teacher_id || !formData.section_id || !formData.subject_id) {
            setError('Please select all required fields (Teacher, Subject, and Section).');
            return;
        }

        createMutation.mutate(formData);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to remove this academic assignment?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleStatus = (id, currentStatus) => {
        toggleStatusMutation.mutate({ id, is_active: !currentStatus });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <Layers className="h-8 w-8 text-white relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Academic Allocations</h1>
                        <p className="text-sm text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Manage faculty assignments and workloads</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="w-[160px] h-12 rounded-2xl border-gray-200 font-semibold bg-white shadow-sm">
                            <SelectValue placeholder="All Branches" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-xl border-gray-100">
                            <SelectItem value="all" className="rounded-xl font-bold">All Branches</SelectItem>
                            {branchesList?.map(b => (
                                <SelectItem key={b.id} value={String(b.id)} className="rounded-xl">{b.branch_name} ({b.branch_code})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                        <SelectTrigger className="w-[160px] h-12 rounded-2xl border-gray-200 font-semibold bg-white shadow-sm">
                            <SelectValue placeholder="All Semesters" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-xl border-gray-100">
                            <SelectItem value="all" className="rounded-xl font-bold">All Semesters</SelectItem>
                            {semestersList?.map(s => (
                                <SelectItem key={s.id} value={String(s.id)} className="rounded-xl">Sem {s.semester_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/20 h-12 px-6 font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95">
                        <Plus className="mr-2 h-5 w-5" /> New Allocation
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <Input
                    placeholder="Search by teacher name, subject code, or section..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                    }}
                    className="h-14 pl-12 rounded-[1.25rem] border-gray-200 bg-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all text-base placeholder:text-gray-400 font-medium"
                />
            </div>

            {/* Table Card */}
            <Card className="bg-white rounded-[2.5rem] border-0 shadow-xl shadow-gray-100/50 overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Active Allocations</CardTitle>
                            <CardDescription className="text-gray-500 font-bold mt-1 uppercase text-[10px] tracking-widest">
                                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalCount)} of {totalCount} Records
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 pl-8 h-14">Faculty & Role</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">Academic Subject</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">Section Group</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14 w-32">Status</TableHead>
                                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-gray-400 pr-8 h-14 w-32">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i} className="border-b border-gray-50">
                                            <TableCell className="pl-8 py-6"><Skeleton className="h-12 w-48 rounded-2xl" /></TableCell>
                                            <TableCell><Skeleton className="h-10 w-40 rounded-xl" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-24 rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-24 rounded-full" /></TableCell>
                                            <TableCell className="pr-8"><div className="flex justify-end"><Skeleton className="h-10 w-10 rounded-xl" /></div></TableCell>
                                        </TableRow>
                                    ))
                                ) : assignmentsList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="p-8 rounded-[2.5rem] bg-gray-50 ring-1 ring-gray-100 shadow-inner">
                                                    <Layers className="h-12 w-12 text-gray-300" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black text-gray-900 tracking-tight">No allocations identified</p>
                                                    <p className="text-sm text-gray-500 font-bold max-w-[280px] mx-auto leading-relaxed uppercase tracking-widest text-[10px]">
                                                        {searchTerm ? 'Adjust your search parameters to find matching records' : 'Initialize faculty workloads by creating a new allocation'}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    assignmentsList.map((item) => (
                                        <TableRow key={item.id} className="group hover:bg-gray-50/50 transition-all border-b border-gray-50 last:border-0 cursor-default h-20">
                                            <TableCell className="pl-8">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-12 w-12 border-2 border-white shadow-md ring-1 ring-gray-100">
                                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-black text-xs">
                                                            {item.teacher?.first_name[0]}{item.teacher?.last_name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <p className="font-black text-gray-900 tracking-tight leading-none mb-1">
                                                            {item.teacher?.first_name} {item.teacher?.last_name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">
                                                            {item.teacher?.designation || 'Faculty'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p className="font-black text-gray-900 tracking-tight">{item.subject?.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0 rounded-md font-black text-[9px] px-1.5 h-4 uppercase tracking-tighter">
                                                            {item.subject?.code}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
                                                        <Building className="h-4 w-4 text-blue-500" />
                                                    </div>
                                                    <Badge variant="outline" className="border-blue-100 text-blue-700 bg-white rounded-lg font-black text-[10px] px-2.5 py-0.5 shadow-sm flex items-center gap-1.5">
                                                        <span>Section {item.section?.section_name}</span>
                                                        {(item.section?.branch_code || item.section?.semester_name) && (
                                                            <span className="text-[9px] bg-blue-50 px-1 rounded-sm text-blue-400 font-black flex items-center gap-1">
                                                                {item.section.branch_code && <span>{item.section.branch_code}</span>}
                                                                {item.section.branch_code && item.section.semester_name && <span className="w-[2px] h-[2px] rounded-full bg-blue-300" />}
                                                                {item.section.semester_name && <span>Sem {item.section.semester_name}</span>}
                                                            </span>
                                                        )}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() => handleToggleStatus(item.id, item.is_active)}
                                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all shadow-sm flex items-center gap-2 ${item.is_active
                                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200/50'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 ring-1 ring-gray-200'
                                                        }`}
                                                >
                                                    <div className={`h-1.5 w-1.5 rounded-full ${item.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-90"
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {/* Pagination Controls */}
                <CardFooter className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                        Page {page} of {Math.ceil(totalCount / limit) || 1} • {totalCount} Allocations
                    </p>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="h-10 w-10 rounded-xl hover:bg-white hover:text-indigo-600 border border-transparent hover:border-gray-200 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: Math.ceil(totalCount / limit) || 1 }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === Math.ceil(totalCount / limit) || (p >= page - 1 && p <= page + 1))
                                .map((p, i, arr) => (
                                    <div key={p} className="flex items-center gap-1.5">
                                        {i > 0 && arr[i - 1] !== p - 1 && <span className="text-[10px] font-black tracking-widest opacity-30 px-1">•••</span>}
                                        <button
                                            onClick={() => setPage(p)}
                                            className={`h-10 w-10 rounded-xl font-black text-xs transition-all border ${page === p
                                                ? 'bg-white border-gray-200 text-indigo-600 shadow-sm'
                                                : 'text-gray-400 hover:bg-white hover:border-gray-100 hover:text-gray-600'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    </div>
                                ))}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page * limit >= totalCount}
                            className="h-10 w-10 rounded-xl hover:bg-white hover:text-indigo-600 border border-transparent hover:border-gray-200 disabled:opacity-30 transition-all"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden rounded-[3rem] border-0 shadow-2xl bg-white">
                    <DialogHeader className="px-10 pt-10 pb-8 bg-gradient-to-br from-indigo-500 to-indigo-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-10 -mb-10 blur-2xl" />

                        <div className="relative z-10 flex items-center gap-6">
                            <div className="p-4 bg-white/20 rounded-[2rem] backdrop-blur-xl shadow-inner border border-white/20">
                                <Layers className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-white text-3xl font-black tracking-tight leading-none">
                                    New Allocation
                                </DialogTitle>
                                <DialogDescription className="text-indigo-50 text-base font-bold mt-2 opacity-90 uppercase text-[10px] tracking-[0.2em]">
                                    Establish a new academic faculty assignment
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form id="assignment-form" onSubmit={handleSubmit} className="px-10 py-10 space-y-8">
                        {error && (
                            <div className="flex items-center gap-3 bg-red-50 text-red-600 text-sm font-medium p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="grid gap-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Faculty Member</Label>
                                <Select value={formData.teacher_id} onValueChange={(val) => setFormData({ ...formData, teacher_id: val })}>
                                    <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold group">
                                        <div className="flex items-center gap-3">
                                            <User className="h-4 w-4 text-gray-400 group-focus:text-indigo-500" />
                                            <SelectValue placeholder="Identify Teacher" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100 shadow-xl p-2 max-h-[300px]">
                                        {teachersList.length > 0 ? (
                                            teachersList.map(t => (
                                                <SelectItem key={t.id} value={t.id} className="rounded-xl font-bold py-3">
                                                    <div className="flex flex-col">
                                                        <span>{t.first_name} {t.last_name}</span>
                                                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{t.designation || 'Staff'} • {t.department}</span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-gray-500 font-bold">No active faculty records</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Academic Subject</Label>
                                    <Select value={formData.subject_id} onValueChange={(val) => setFormData({ ...formData, subject_id: val })}>
                                        <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold group">
                                            <div className="flex items-center gap-3">
                                                <BookOpen className="h-4 w-4 text-gray-400 group-focus:text-indigo-500" />
                                                <SelectValue placeholder="Select Subject" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-gray-100 shadow-xl p-2">
                                            {subjectsList.map(s => (
                                                <SelectItem key={s.id} value={s.id} className="rounded-xl font-bold py-3">
                                                    <div className="flex flex-col">
                                                        <span>{s.name}</span>
                                                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{s.code} • {s.credits} Credits</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Class Section</Label>
                                    <SectionSelect
                                        value={formData.section_id}
                                        onChange={(val) => setFormData({ ...formData, section_id: val })}
                                        placeholder="Assign Section"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>

                    <div className="px-10 py-8 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-4">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} className="rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-white transition-all">
                            Discard
                        </Button>
                        <Button form="assignment-form" type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95">
                            {createMutation.isPending ? 'Processing...' : 'Confirm Allocation'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TeacherAssignments;
