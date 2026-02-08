import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjects, branches, semesters } from '../../services/api';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Search, BookOpen, AlertCircle, Layers, Calendar, Eye, Pencil, Power, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import SectionHeader from '@/components/SectionHeader';

const initialFormData = {
    name: '',
    code: '',
    subject_type: 'CORE',
    branch_id: '',
    semester_id: ''
};

const Subjects = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const limit = 10;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [error, setError] = useState('');

    // UI States
    const [editingItem, setEditingItem] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailItem, setDetailItem] = useState(null);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [statusItem, setStatusItem] = useState(null);

    // Data Fetching
    const { data: subjectsData = { items: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['subjects', page, searchTerm, showInactive],
        queryFn: async () => {
            const res = await subjects.getAll({
                skip: (page - 1) * limit,
                limit,
                search: searchTerm,
                is_active: !showInactive // Assuming backend supports this filter
            });
            return res.data;
        }
    });
    const subjectsList = subjectsData.items || [];
    const totalCount = subjectsData.total || 0;

    const { data: branchesList = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await branches.getAll({ limit: 100 });
            // Handle both structure types (paginated or flat list)
            return Array.isArray(res.data) ? res.data : (res.data?.items || []);
        }
    });

    const { data: semestersList = [] } = useQuery({
        queryKey: ['semesters'],
        queryFn: async () => {
            const res = await semesters.getAll();
            return (res.data.items || []).sort((a, b) => a.semester_name - b.semester_name);
        }
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => subjects.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['subjects']);
            setIsModalOpen(false);
            setFormData(initialFormData);
            setError('');
        },
        onError: (err) => setError(err.response?.data?.detail || 'Failed to create subject.')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => subjects.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['subjects']);
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData(initialFormData);
            setError('');
        },
        onError: (err) => setError(err.response?.data?.detail || 'Failed to update subject.')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => subjects.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['subjects']),
        onError: () => alert('Failed to delete subject')
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }) => subjects.update(id, { is_active: !is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries(['subjects']);
            setIsStatusOpen(false);
            setStatusItem(null);
            if (isDetailOpen) setIsDetailOpen(false);
        }
    });

    // Handlers
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const openEditModal = (item, e) => {
        e?.stopPropagation();
        setEditingItem(item);
        setFormData({
            name: item.name,
            code: item.code,
            subject_type: item.subject_type,
            branch_id: item.branch_id,
            semester_id: item.semester_id
        });
        setError('');
        setIsModalOpen(true);
    };

    const openDetailSheet = (item) => {
        setDetailItem(item);
        setIsDetailOpen(true);
    };

    const openStatusDialog = (item, e) => {
        e?.stopPropagation();
        setStatusItem(item);
        setIsStatusOpen(true);
    };
    // Derived Data
    const getBranchName = (id) => branchesList.find(b => b.id === id)?.name || '-';
    const getBranchCode = (id) => branchesList.find(b => b.id === id)?.code || '-';
    const getSemesterName = (id) => {
        const sem = semestersList.find(s => s.id === id);
        return sem ? `Sem ${sem.semester_name}` : '-';
    };

    // Filter subjects based on showInactive toggle
    const filteredData = subjectsList.filter(item => showInactive ? !item.is_active : item.is_active);

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Subjects"
                subtitle="Manage course curriculum"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md rounded-2xl border border-white shadow-sm">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${!showInactive ? 'text-emerald-600' : 'text-gray-400'}`}>Active</span>
                            <Switch
                                checked={showInactive}
                                onCheckedChange={setShowInactive}
                                className="data-[state=checked]:bg-red-500 scale-75"
                            />
                            <span className={`text-[10px] font-black uppercase tracking-wider ${showInactive ? 'text-red-600' : 'text-gray-400'}`}>Archive</span>
                        </div>
                        <Button
                            onClick={() => { setEditingItem(null); setFormData(initialFormData); setIsModalOpen(true); }}
                            className="bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg h-11 px-6 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus className="mr-2 h-5 w-5" /> Add Subject
                        </Button>
                    </div>
                }
            />

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Search subjects by code, name, or branch..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                    }}
                    className="h-12 pl-12 rounded-2xl border-gray-200 bg-white/50 focus:bg-white transition-all text-base"
                />
            </div>

            {/* Table Card */}
            <Card className="bg-white/80 backdrop-blur-xl rounded-[2rem] border-0 shadow-xl shadow-gray-100/50 overflow-hidden">
                <CardHeader className="bg-white/50 border-b border-gray-100 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">
                                {showInactive ? 'Archived Subjects' : 'Active Curriculum'}
                            </CardTitle>
                            <CardDescription className="text-gray-500 font-medium mt-1">
                                {totalCount} subjects found
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                                <TableHead className="font-semibold text-gray-600 pl-8 h-12">Subject Code</TableHead>
                                <TableHead className="font-semibold text-gray-600 h-12">Name</TableHead>
                                <TableHead className="font-semibold text-gray-600 h-12">Department</TableHead>
                                <TableHead className="font-semibold text-gray-600 h-12 text-center">Status</TableHead>
                                <TableHead className="text-right font-semibold text-gray-600 pr-8 h-12">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i} className="border-b border-gray-50">
                                        <TableCell className="pl-8 py-4"><Skeleton className="h-6 w-20 rounded-lg" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-32 rounded-lg" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-28 rounded-lg" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16 mx-auto rounded-lg" /></TableCell>
                                        <TableCell className="pr-8"><div className="flex justify-end"><Skeleton className="h-8 w-8 rounded-lg" /></div></TableCell>
                                    </TableRow>
                                ))
                            ) : subjectsList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-24">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-6 rounded-3xl bg-gray-50 ring-1 ring-gray-100">
                                                <BookOpen className="h-10 w-10 text-gray-300" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-gray-800">No subjects found</p>
                                                <p className="text-sm text-gray-500 font-medium mt-1">
                                                    {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding a new subject'}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item) => (
                                    <TableRow key={item.id} className="group hover:bg-violet-50/30 transition-all border-b border-gray-50 last:border-0 cursor-pointer" onClick={() => openDetailSheet(item)}>
                                        <TableCell className="pl-8 py-4">
                                            <Badge variant="outline" className="border-violet-200 text-violet-700 bg-violet-50/50 rounded-lg font-mono font-bold">
                                                {item.code}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <p className="font-bold text-gray-800">{item.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className={`${item.subject_type === 'CORE' ? 'bg-violet-100 text-violet-700' : 'bg-pink-100 text-pink-700'} border-0 hover:bg-opacity-80 rounded-md text-[9px] font-bold px-1.5 py-0 shadow-sm`}>
                                                        {item.subject_type}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Layers className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="text-sm font-semibold text-gray-700">{getBranchCode(item.branch_id)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="text-xs font-medium text-gray-500">{getSemesterName(item.semester_id)}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={`rounded-lg border-0 font-bold text-[10px] ${item.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100">
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-violet-600 rounded-lg"
                                                    onClick={(e) => { e.stopPropagation(); openDetailSheet(item); }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-blue-600 rounded-lg"
                                                    onClick={(e) => openEditModal(item, e)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                {/* Pagination Controls */}
                <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing {subjectsList.length} of {totalCount} subjects
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="h-9 w-9 rounded-xl border-gray-200 hover:bg-white hover:text-violet-600 hover:border-violet-200 transition-all"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-[2.25rem] h-9 px-2 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-sm font-bold text-gray-700 shadow-sm">
                            {page}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page * limit >= totalCount}
                            className="h-9 w-9 rounded-xl border-gray-200 hover:bg-white hover:text-violet-600 hover:border-violet-200 transition-all"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
                    <DialogHeader className="px-8 pt-8 pb-6 bg-gradient-to-br from-violet-500 to-purple-600">
                        <DialogTitle className="flex items-center gap-4 text-white text-2xl font-bold">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner"><BookOpen className="h-6 w-6 text-white" /></div>
                            Add New Subject
                        </DialogTitle>
                        <DialogDescription className="text-violet-50 text-base font-medium pl-[4.5rem]">
                            Define a new subject for the curriculum.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6 bg-white">
                        {error && (
                            <div className="flex items-center gap-3 bg-red-50 text-red-600 text-sm font-medium p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2.5">
                                <Label className="text-sm font-semibold text-gray-700 ml-1">Subject Code</Label>
                                <Input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="CS101" className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all font-mono uppercase" />
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-sm font-semibold text-gray-700 ml-1">Subject Name</Label>
                                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Introduction to CS" className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all" />
                            </div>

                            <div className="space-y-2.5">
                                <Label className="text-sm font-semibold text-gray-700 ml-1">Type</Label>
                                <Select value={formData.subject_type} onValueChange={(val) => setFormData({ ...formData, subject_type: val })}>
                                    <SelectTrigger className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="CORE" className="rounded-lg">CORE</SelectItem>
                                        <SelectItem value="ELECTIVE" className="rounded-lg">ELECTIVE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2.5">
                                <Label className="text-sm font-semibold text-gray-700 ml-1">Branch</Label>
                                <Select value={formData.branch_id} onValueChange={(val) => setFormData({ ...formData, branch_id: val })}>
                                    <SelectTrigger className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {Array.isArray(branchesList) && branchesList.filter(b => b.is_active).map(b => (
                                            <SelectItem key={b.id} value={b.id} className="rounded-lg">{b.name} ({b.code})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2.5">
                                <Label className="text-sm font-semibold text-gray-700 ml-1">Semester</Label>
                                <Select value={formData.semester_id} onValueChange={(val) => setFormData({ ...formData, semester_id: val })}>
                                    <SelectTrigger className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all"><SelectValue placeholder="Select Semester" /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {semestersList.map(s => (
                                            <SelectItem key={s.id} value={s.id} className="rounded-lg">Semester {s.number}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 gap-3">
                            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border-gray-200 h-12 px-6 hover:bg-gray-50">Cancel</Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-12 px-8 font-semibold shadow-lg shadow-violet-500/20">
                                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingItem ? 'Update Subject' : 'Add Subject')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Detail Sheet */}
            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent className="sm:max-w-md p-0 border-0 overflow-hidden rounded-l-[2rem] shadow-2xl">
                    {detailItem && (
                        <div className="h-full flex flex-col bg-white">
                            <div className="bg-gradient-to-br from-violet-500 to-purple-700 p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-16 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                                <SheetHeader className="relative z-10 space-y-4">
                                    <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                        <BookOpen className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <SheetTitle className="text-2xl font-bold text-white tracking-tight leading-tight">
                                            {detailItem.name}
                                        </SheetTitle>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge className="bg-white/20 text-white border-0 font-mono">{detailItem.code}</Badge>
                                            <Badge className={`${detailItem.is_active ? 'bg-emerald-400 text-emerald-900' : 'bg-red-400 text-red-900'} border-0 uppercase text-[10px] font-black tracking-wider`}>
                                                {detailItem.is_active ? 'Active' : 'Archived'}
                                            </Badge>
                                        </div>
                                    </div>
                                </SheetHeader>
                            </div>

                            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                                        <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-violet-600"><Layers className="h-6 w-6" /></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Academic Unit</p>
                                            <p className="font-bold text-gray-900">{getBranchName(detailItem.branch_id)}</p>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                                        <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-orange-600"><Calendar className="h-6 w-6" /></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Scheduling</p>
                                            <p className="font-bold text-gray-900">{getSemesterName(detailItem.semester_id)}</p>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                                        <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-pink-600"><Plus className="h-6 w-6" /></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Classification</p>
                                            <p className="font-bold text-gray-900">{detailItem.subject_type}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 space-y-3">
                                    <Button
                                        className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all"
                                        onClick={(e) => { setIsDetailOpen(false); openEditModal(detailItem, e); }}
                                    >
                                        <Pencil className="mr-2 h-4 w-4" /> Edit Subject Details
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className={`w-full h-12 rounded-xl border-2 font-bold transition-all ${detailItem.is_active ? 'border-red-100 text-red-500 hover:bg-red-50' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}
                                        onClick={(e) => openStatusDialog(detailItem, e)}
                                    >
                                        <Power className="mr-2 h-4 w-4" />
                                        {detailItem.is_active ? 'Deactivate Subject' : 'Reactivate Subject'}
                                    </Button>

                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Status Dialog */}
            <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-[2rem] border-0 shadow-2xl">
                    <div className={`p-8 text-center ${statusItem?.is_active ? 'bg-red-50' : 'bg-emerald-50'}`}>
                        <div className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-4 ${statusItem?.is_active ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                            <Power className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {statusItem?.is_active ? 'Deactivate Subject?' : 'Reactivate Subject?'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2 px-4">
                            You are about to transition <span className="font-bold text-gray-800">{statusItem?.name}</span> to {statusItem?.is_active ? 'inactive status.' : 'active status.'}
                        </p>
                    </div>
                    <div className="p-6 bg-white flex flex-col gap-3">
                        <Button
                            className={`w-full h-12 rounded-xl font-bold ${statusItem?.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white shadow-lg`}
                            onClick={() => toggleStatusMutation.mutate(statusItem)}
                            disabled={toggleStatusMutation.isPending}
                        >
                            {toggleStatusMutation.isPending ? 'Processing...' : 'Confirm Action'}
                        </Button>
                        <Button variant="ghost" onClick={() => setIsStatusOpen(false)} className="w-full h-12 rounded-xl text-gray-400 font-bold">Cancel</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Subjects;
