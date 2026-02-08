import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { semesters } from '../../services/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
    Plus,
    Pencil,
    Calendar,
    FolderOpen,
    AlertCircle,
    Eye,
    Power,
    Hash,
    BookOpen,
    CheckCircle,
    XCircle,
    Search,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';

const Semesters = () => {
    const queryClient = useQueryClient();
    const [showInactive, setShowInactive] = useState(false);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const limit = 10;

    // UI States
    const [editingItem, setEditingItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ semester_name: '', academic_year: '' });
    const [formError, setFormError] = useState('');

    // Status/Dialog States
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [statusItem, setStatusItem] = useState(null);

    // Detail View
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailItem, setDetailItem] = useState(null);

    // Fetch Semesters
    const { data: semestersData = { items: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['semesters', page, searchTerm],
        queryFn: async () => {
            const res = await semesters.getAll({
                skip: (page - 1) * limit,
                limit,
                search: searchTerm
            });
            return res.data;
        }
    });

    const semestersList = [...(semestersData.items || [])].sort((a, b) => a.semester_name - b.semester_name);
    const totalCount = semestersData.total || 0;

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: (newSemester) => semesters.create(newSemester),
        onSuccess: () => {
            queryClient.invalidateQueries(['semesters']);
            setIsModalOpen(false);
            resetForm();
        },
        onError: () => setFormError('Failed to create semester. It might already exist.')
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => semesters.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['semesters']);
            setIsModalOpen(false);
            resetForm();
        },
        onError: () => setFormError('Failed to update semester.')
    });

    // Toggle Status Mutation
    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }) => semesters.update(id, { is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries(['semesters']);
            setIsStatusOpen(false);
            setStatusItem(null);
            if (isDetailOpen) setIsDetailOpen(false);
        },
        onError: () => alert('Failed to update semester status')
    });

    const resetForm = () => {
        setEditingItem(null);
        setFormData({ semester_name: '', academic_year: '' });
        setFormError('');
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (item, e) => {
        e?.stopPropagation();
        setEditingItem(item);
        setFormData({ semester_name: item.semester_name.toString(), academic_year: item.academic_year });
        setFormError('');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        const payload = {
            semester_name: parseInt(formData.semester_name),
            academic_year: formData.academic_year
        };

        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleToggleActive = () => {
        if (!statusItem) return;
        toggleStatusMutation.mutate({
            id: statusItem.id,
            is_active: !statusItem.is_active
        });
    };

    const filteredData = semestersList.filter(item => {
        return showInactive ? !item.is_active : item.is_active;
    });

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Semesters"
                subtitle="Manage academic terms and curriculum cycles"
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
                            <span className={`text-sm font-bold transition-colors ${!showInactive ? 'text-emerald-600' : 'text-gray-400'}`}>Active</span>
                            <Switch checked={showInactive} onCheckedChange={setShowInactive} className="data-[state=checked]:bg-red-500" />
                            <span className={`text-sm font-bold transition-colors ${showInactive ? 'text-red-600' : 'text-gray-400'}`}>Inactive</span>
                        </div>
                        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] shadow-xl h-12 px-6 font-bold transition-all active:scale-95">
                            <Plus className="mr-2 h-5 w-5 stroke-[3px]" /> Add Semester
                        </Button>
                    </div>
                }
            />

            {/* Stats & Search Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-slate-500 transition-colors" />
                        </div>
                        <Input
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by academic year..."
                            className="pl-12 h-14 bg-white border-0 shadow-sm rounded-[1.5rem] text-base font-medium placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-orange-500/20 transition-all"
                        />
                    </div>
                </div>
                <Card className="lg:col-span-4 bg-white/50 backdrop-blur-sm border-0 shadow-sm rounded-[1.5rem] flex items-center px-6 py-2">
                    <div className="flex items-center gap-4 w-full">
                        <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <Hash className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Terms</p>
                            <p className="text-xl font-black text-gray-900">{semestersList.length}</p>
                        </div>
                        <div className="ml-auto flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-8 w-8 rounded-full border-2 border-white bg-orange-${i * 100 + 100} flex items-center justify-center text-[10px] font-bold text-slate-700`}>
                                    S{i}
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content Table */}
            <Card className="bg-white rounded-[2rem] border-0 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 border-0 hover:bg-gray-50/50">
                                <TableHead className="py-5 pl-8 font-bold text-gray-500 w-[20%] uppercase tracking-widest text-[11px]">Semester</TableHead>
                                <TableHead className="py-5 font-bold text-gray-500 uppercase tracking-widest text-[11px]">Academic Year</TableHead>
                                <TableHead className="py-5 font-bold text-gray-500 uppercase tracking-widest text-[11px] w-[15%]">Status</TableHead>
                                <TableHead className="py-5 pr-8 text-right font-bold text-gray-500 uppercase tracking-widest text-[11px] w-[15%]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative">
                                                <div className="h-12 w-12 border-4 border-orange-100 rounded-full"></div>
                                                <div className="absolute top-0 left-0 h-12 w-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                            <span className="text-gray-500 font-bold animate-pulse">Fetching semesters...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-80 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="relative">
                                                <div className="h-24 w-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center">
                                                    <FolderOpen className="h-10 w-10 text-gray-300" />
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-white border-4 border-gray-50 flex items-center justify-center shadow-sm">
                                                    <Search className="h-4 w-4 text-gray-400" />
                                                </div>
                                            </div>
                                            <div className="max-w-xs mx-auto">
                                                <p className="text-xl font-bold text-gray-800">No semesters found</p>
                                                <p className="text-gray-500 mt-2 font-medium">We couldn't find any semesters matching your current filters.</p>
                                            </div>
                                            {!showInactive && (
                                                <Button onClick={openCreateModal} variant="outline" className="rounded-2xl border-2 border-slate-500 text-slate-600 hover:bg-slate-50 font-bold h-11">
                                                    <Plus className="mr-2 h-4 w-4" /> Create First Semester
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="group hover:bg-slate-50/40 transition-all border-b border-gray-50/80 last:border-0 cursor-pointer"
                                        onClick={() => openDetailSheet(item)}
                                    >
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-sm">
                                                    {item.semester_name}
                                                </div>
                                                <span className="font-bold text-gray-900 group-hover:text-slate-600 transition-colors">Semester {item.semester_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-gray-400" />
                                                <span className="font-semibold text-gray-700">{item.academic_year}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.is_active ? (
                                                <Badge className="bg-emerald-50 text-emerald-600 border-0 hover:bg-emerald-100 rounded-xl px-4 py-1.5 font-bold text-[11px] shadow-sm">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                                                    ACTIVE
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-50 text-red-500 border-0 hover:bg-red-100 rounded-xl px-4 py-1.5 font-bold text-[11px] shadow-sm">
                                                    <XCircle className="h-3.5 w-3.5 mr-2" />
                                                    INACTIVE
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="pr-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-2xl text-gray-400 hover:text-slate-600 hover:bg-white shadow-none transition-all hover:shadow-lg hover:shadow-slate-500/10"
                                                    onClick={(e) => { e.stopPropagation(); openDetailSheet(item); }}
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-2xl text-gray-400 hover:text-slate-600 hover:bg-white shadow-none transition-all hover:shadow-lg hover:shadow-slate-500/10"
                                                    onClick={(e) => openEditModal(item, e)}
                                                >
                                                    <Pencil className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* Pagination Controls */}
                <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing {semestersList.length} of {totalCount} semesters
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="h-9 w-9 rounded-xl border-gray-200 hover:bg-white hover:text-orange-600 hover:border-orange-200 transition-all"
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
                            className="h-9 w-9 rounded-xl border-gray-200 hover:bg-white hover:text-orange-600 hover:border-orange-200 transition-all"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
                    <DialogHeader className="px-8 pt-8 pb-6 bg-gradient-to-r from-slate-500 to-slate-600 text-left">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-white">
                                    {editingItem ? 'Edit Semester' : 'Add Semester'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 font-medium">
                                    Configure academic term details below
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
                        {formError && (
                            <div className="flex items-center gap-3 bg-red-50 text-red-600 text-sm p-4 rounded-2xl border border-red-100 font-bold">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                {formError}
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label htmlFor="number" className="text-sm font-black text-gray-700 uppercase tracking-widest pl-1">Semester Number</Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Hash className="h-5 w-5 text-gray-400 group-focus-within:text-slate-500 transition-colors" />
                                </div>
                                <Input
                                    id="number"
                                    type="number"
                                    required
                                    min="1"
                                    max="8"
                                    value={formData.semester_name}
                                    onChange={(e) => setFormData({ ...formData, semester_name: e.target.value })}
                                    placeholder="e.g. 1"
                                    disabled={!!editingItem}
                                    className="pl-12 h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-mono font-bold"
                                />
                            </div>
                            <p className="text-[11px] text-gray-400 font-bold pl-1">ENTER A NUMBER BETWEEN 1 - 8</p>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="academicYear" className="text-sm font-black text-gray-700 uppercase tracking-widest pl-1">Academic Year</Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <BookOpen className="h-5 w-5 text-gray-400 group-focus-within:text-slate-500 transition-colors" />
                                </div>
                                <Input
                                    id="academicYear"
                                    required
                                    value={formData.academic_year}
                                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                                    placeholder="e.g. 2023-2024"
                                    className="pl-12 h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-6 gap-3 sm:gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-2xl border-0 bg-gray-100 text-gray-600 hover:bg-gray-200 h-14 px-8 font-bold transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="bg-slate-600 hover:bg-slate-700 text-white rounded-2xl h-14 px-8 font-bold shadow-xl shadow-slate-500/20 transition-all active:scale-95"
                            >
                                {(createMutation.isPending || updateMutation.isPending) ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    editingItem ? 'Update Changes' : 'Create Semester'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Detail Sheet */}
            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent className="sm:max-w-md p-0 border-0 overflow-hidden rounded-l-[3rem] shadow-2xl">
                    {detailItem && (
                        <div className="h-full flex flex-col bg-white">
                            <div className="bg-gradient-to-br from-slate-400 to-slate-600 p-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-20 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
                                <SheetHeader className="relative space-y-4">
                                    <div className="flex items-center gap-5">
                                        <div className="h-20 w-20 rounded-[2.5rem] bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-inner border border-white/30">
                                            <Calendar className="h-10 w-10 text-white" />
                                        </div>
                                        <div>
                                            <SheetTitle className="text-3xl font-black text-white leading-tight">
                                                Semester {detailItem.semester_name}
                                            </SheetTitle>
                                            <SheetDescription className="text-white/80 font-bold text-base mt-1 flex items-center gap-2">
                                                <div className={`h-2.5 w-2.5 rounded-full ${detailItem.is_active ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
                                                {detailItem.is_active ? 'Active Status' : 'Inactive Status'}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>
                            </div>

                            <div className="p-10 space-y-8 flex-1 overflow-y-auto">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-6 bg-gray-50 rounded-[2rem] border-2 border-transparent hover:border-orange-100 transition-all group">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-3xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Hash className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Semester ID</p>
                                                <p className="text-xl font-black text-gray-900 font-mono tracking-tighter">SEM-{detailItem.semester_name.toString().padStart(3, '0')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50 rounded-[2rem] border-2 border-transparent hover:border-blue-100 transition-all group">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <BookOpen className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Academic Year</p>
                                                <p className="text-xl font-black text-gray-900">{detailItem.academic_year}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50 rounded-[2rem] border-2 border-transparent hover:border-purple-100 transition-all group">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Calendar className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Created Date</p>
                                                <p className="text-xl font-black text-gray-900">
                                                    {new Date(detailItem.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 space-y-4">
                                    <Button
                                        variant="outline"
                                        className="w-full h-16 rounded-[1.5rem] border-2 border-gray-100 hover:border-slate-500 hover:text-slate-600 text-gray-600 font-black text-base transition-all flex items-center justify-between px-8"
                                        onClick={(e) => { setIsDetailOpen(false); openEditModal(detailItem, e); }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Pencil className="h-5 w-5" /> Edit Semester
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center">
                                            <Power className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </Button>

                                    {detailItem.is_active ? (
                                        <Button
                                            variant="outline"
                                            className="w-full h-16 rounded-[1.5rem] border-0 bg-red-50 hover:bg-red-100 text-red-600 font-black text-base transition-all flex items-center justify-between px-8"
                                            onClick={(e) => openStatusDialog(detailItem, e)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Power className="h-5 w-5" /> Deactivate
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                <AlertCircle className="h-4 w-4" />
                                            </div>
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full h-16 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-between px-8"
                                            onClick={(e) => openStatusDialog(detailItem, e)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Power className="h-5 w-5 stroke-[3px]" /> Reactive
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-white" />
                                            </div>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Status Dialog */}
            <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
                    <DialogHeader className={`px-8 pt-8 pb-6 ${statusItem?.is_active ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'}`}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Power className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-white">
                                    {statusItem?.is_active ? 'Deactivate' : 'Reactivate'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 font-bold">
                                    Confirm status change
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-8 py-8 space-y-6 text-center">
                        <div className="p-8 bg-gray-50 rounded-[2.5rem] border-2 border-gray-100 flex flex-col items-center gap-4">
                            <div className={`h-20 w-20 rounded-[2rem] ${statusItem?.is_active ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center transform -rotate-12`}>
                                <Calendar className="h-10 w-10" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-gray-900 leading-tight">Semester {statusItem?.semester_name}</p>
                                <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-xs">{statusItem?.academic_year}</p>
                            </div>
                        </div>

                        <p className="text-gray-600 font-medium leading-relaxed px-4">
                            {statusItem?.is_active
                                ? 'Deactivating this semester will hide it from active curriculum views. Are you absolutely certain?'
                                : 'Are you ready to restore this semester to active status?'}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setIsStatusOpen(false)}
                                className="flex-1 rounded-2xl border-0 bg-gray-100 text-gray-600 hover:bg-gray-200 h-14 font-black transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleToggleActive}
                                disabled={toggleStatusMutation.isPending}
                                className={`flex-1 rounded-2xl h-14 font-black transition-all shadow-xl active:scale-95 ${statusItem?.is_active
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                                    } text-white`}
                            >
                                {toggleStatusMutation.isPending ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    statusItem?.is_active ? 'Yes, Deactivate' : 'Yes, Reactivate'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Semesters;

