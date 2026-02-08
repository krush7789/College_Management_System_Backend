import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sections, branches, semesters } from '../../services/api';
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
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
    Plus,
    Pencil,
    Layers,
    FolderOpen,
    AlertCircle,
    Eye,
    Power,
    Calendar,
    Building2,
    CheckCircle,
    XCircle,
    Hash,
    Search,
    Users,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';

const Sections = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const limit = 10;

    // Filter State
    const [showInactive, setShowInactive] = useState(false);

    // UI States
    const [editingItem, setEditingItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ section_name: '', branch_id: '', semester_id: '', max_students: 60 });
    const [formError, setFormError] = useState('');

    // Status/Dialog States
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [statusItem, setStatusItem] = useState(null);

    // Detail View
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailItem, setDetailItem] = useState(null);

    // Fetch Section Stats
    const { data: sectionStats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['section-stats', detailItem?.id],
        queryFn: async () => {
            if (!detailItem?.id) return null;
            const res = await sections.getStats(detailItem.id);
            return res.data;
        },
        enabled: !!detailItem?.id && isDetailOpen
    });

    // Fetch Sections
    const { data: sectionsData = { items: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['sections', page, searchTerm],
        queryFn: async () => {
            const res = await sections.getAll({
                skip: (page - 1) * limit,
                limit,
                search: searchTerm
            });
            return res.data;
        }
    });
    const sectionsList = sectionsData.items || [];
    const totalCount = sectionsData.total || 0;

    // Fetch Branches (for dropdown)
    const { data: branchesData = { items: [], total: 0 } } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await branches.getAll();
            return res.data;
        }
    });
    const branchesList = branchesData.items || [];

    // Fetch Semesters (for dropdown)
    const { data: semestersData = { items: [], total: 0 } } = useQuery({
        queryKey: ['semesters'],
        queryFn: async () => {
            const res = await semesters.getAll();
            return res.data;
        }
    });
    const semestersList = [...(semestersData.items || [])].sort((a, b) => a.semester_name - b.semester_name);

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: (newSection) => sections.create(newSection),
        onSuccess: () => {
            queryClient.invalidateQueries(['sections']);
            setIsModalOpen(false);
            resetForm();
        },
        onError: () => setFormError('Failed to create section. It might already exist.')
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => sections.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['sections']);
            setIsModalOpen(false);
            resetForm();
        },
        onError: () => setFormError('Failed to update section.')
    });

    // Toggle Status Mutation
    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }) => sections.update(id, { is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries(['sections']);
            setIsStatusOpen(false);
            setStatusItem(null);
            if (isDetailOpen) setIsDetailOpen(false);
        },
        onError: () => alert('Failed to update section status')
    });

    const resetForm = () => {
        setEditingItem(null);
        setFormData({ section_name: '', branch_id: '', semester_id: '', max_students: 60 });
        setFormError('');
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (item, e) => {
        e?.stopPropagation();
        setEditingItem(item);
        setFormData({
            section_name: item.section_name,
            branch_id: item.branch_id,
            semester_id: item.semester_id,
            max_students: item.max_students || 60
        });
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
            ...formData,
            section_name: formData.section_name.toUpperCase()
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

    const getBranchCode = (id) => branchesList.find(b => b.id === id)?.branch_code || '---';
    const getBranchName = (id) => branchesList.find(b => b.id === id)?.branch_name || 'Unknown Branch';
    const getSemesterNum = (id) => semestersList.find(s => s.id === id)?.semester_name || '---';

    const filteredData = sectionsList.filter(item => {
        return showInactive ? !item.is_active : item.is_active;
    });

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Sections"
                subtitle="Manage class divisions and learning groups"
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
                            <span className={`text-sm font-bold transition-colors ${!showInactive ? 'text-emerald-600' : 'text-gray-400'}`}>Active</span>
                            <Switch checked={showInactive} onCheckedChange={setShowInactive} className="data-[state=checked]:bg-red-500" />
                            <span className={`text-sm font-bold transition-colors ${showInactive ? 'text-red-600' : 'text-gray-400'}`}>Inactive</span>
                        </div>
                        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] shadow-xl h-12 px-6 font-bold transition-all active:scale-95">
                            <Plus className="mr-2 h-5 w-5 stroke-[3px]" /> Add Section
                        </Button>
                    </div>
                }
            />

            {/* Search Bar */}
            <div className="grid grid-cols-1 gap-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <Input
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search by section name, branch, or semester..."
                        className="pl-12 h-14 bg-white border-0 shadow-sm rounded-[1.5rem] text-base font-medium placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-purple-500/20 transition-all"
                    />
                </div>
            </div>

            {/* Main Content Table */}
            <Card className="bg-white rounded-[2rem] border-0 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 border-0 hover:bg-gray-50/50">
                                <TableHead className="py-5 pl-8 font-bold text-gray-500 w-[15%] uppercase tracking-widest text-[11px]">Section</TableHead>
                                <TableHead className="py-5 font-bold text-gray-500 uppercase tracking-widest text-[11px]">Branch / Department</TableHead>
                                <TableHead className="py-5 font-bold text-gray-500 uppercase tracking-widest text-[11px]">Semester</TableHead>
                                <TableHead className="py-5 font-bold text-gray-500 uppercase tracking-widest text-[11px] w-[15%]">Status</TableHead>
                                <TableHead className="py-5 pr-8 text-right font-bold text-gray-500 uppercase tracking-widest text-[11px] w-[15%]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative">
                                                <div className="h-12 w-12 border-4 border-purple-100 rounded-full"></div>
                                                <div className="absolute top-0 left-0 h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                            <span className="text-gray-500 font-bold animate-pulse">Loading sections...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-80 text-center">
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
                                                <p className="text-xl font-bold text-gray-800">No sections found</p>
                                                <p className="text-gray-500 mt-2 font-medium">Try adjusting your search or filters to find what you're looking for.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="group hover:bg-indigo-50/40 transition-all border-b border-gray-50/80 last:border-0 cursor-pointer"
                                        onClick={() => openDetailSheet(item)}
                                    >
                                        <TableCell className="pl-8 py-5">
                                            <Badge className="font-mono text-sm px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-2xl border-0 shadow-sm">
                                                {item.section_name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 leading-tight tracking-tight group-hover:text-indigo-700 transition-colors">
                                                    {getBranchName(item.branch_id)}
                                                </span>
                                                <span className="text-[11px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Building2 className="h-3 w-3" />
                                                    {getBranchCode(item.branch_id)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-orange-50 text-orange-600 border-0 hover:bg-orange-100 rounded-xl px-3 py-1.5 font-bold text-xs">
                                                <Calendar className="h-3.5 w-3.5 mr-2" />
                                                SEM {getSemesterNum(item.semester_id)}
                                            </Badge>
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
                                                    className="h-10 w-10 rounded-2xl text-gray-400 hover:text-indigo-600 hover:bg-white shadow-none transition-all hover:shadow-lg hover:shadow-purple-500/10"
                                                    onClick={(e) => { e.stopPropagation(); openDetailSheet(item); }}
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-2xl text-gray-400 hover:text-indigo-600 hover:bg-white shadow-none transition-all hover:shadow-lg hover:shadow-purple-500/10"
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
                        Showing {sectionsList.length} of {totalCount} sections
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="h-9 w-9 rounded-xl border-gray-200 hover:bg-white hover:text-emerald-600 hover:border-emerald-200 transition-all"
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
                            className="h-9 w-9 rounded-xl border-gray-200 hover:bg-white hover:text-emerald-600 hover:border-emerald-200 transition-all"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl scale-in-center">
                    <DialogHeader className="px-8 pt-8 pb-6 bg-gradient-to-r from-purple-600 to-purple-800 text-left">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Layers className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-white">
                                    {editingItem ? 'Edit Section' : 'Add Section'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 font-medium">
                                    Define the learning group parameters below
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
                            <Label htmlFor="name" className="text-sm font-black text-gray-700 uppercase tracking-widest pl-1">Section Identifier</Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Hash className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <Input
                                    id="name"
                                    required
                                    value={formData.section_name}
                                    onChange={(e) => setFormData({ ...formData, section_name: e.target.value.toUpperCase() })}
                                    placeholder="e.g. A, B or SEC-1"
                                    className="pl-12 h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-mono font-bold uppercase"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-sm font-black text-gray-700 uppercase tracking-widest pl-1">Branch</Label>
                                <Select
                                    value={formData.branch_id}
                                    onValueChange={(val) => setFormData({ ...formData, branch_id: val })}
                                    disabled={!!editingItem}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-purple-500 font-bold">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                        {branchesList.filter(b => b.is_active || b.id === formData.branch_id).map(b => (
                                            <SelectItem key={b.id} value={b.id} className="rounded-xl font-bold p-3">
                                                {b.branch_name} ({b.branch_code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-black text-gray-700 uppercase tracking-widest pl-1">Semester</Label>
                                <Select
                                    value={formData.semester_id}
                                    onValueChange={(val) => setFormData({ ...formData, semester_id: val })}
                                    disabled={!!editingItem}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-purple-500 font-bold">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                        {semestersList.filter(s => s.is_active || s.id === formData.semester_id).map(s => (
                                            <SelectItem key={s.id} value={s.id} className="rounded-xl font-bold p-3">
                                                Sem {s.semester_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="max_students" className="text-sm font-black text-gray-700 uppercase tracking-widest pl-1">Max Students</Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Plus className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <Input
                                    id="max_students"
                                    type="number"
                                    required
                                    value={formData.max_students}
                                    onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                                    placeholder="60"
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
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-8 font-bold shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                            >
                                {(createMutation.isPending || updateMutation.isPending) ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    editingItem ? 'Save Changes' : 'Create Section'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Detail Sheet */}
            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent className="sm:max-w-md p-0 border-0 overflow-hidden rounded-l-[3.5rem] shadow-2xl">
                    {detailItem && (
                        <div className="h-full flex flex-col bg-white">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-800 p-12 relative overflow-hidden">
                                <div className="absolute top-0 left-0 p-32 bg-white/10 rounded-full -ml-40 -mt-40 blur-3xl opacity-50" />
                                <SheetHeader className="relative space-y-6">
                                    <div className="flex flex-col items-start gap-5">
                                        <div className="h-24 w-24 rounded-[2.5rem] bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-inner border border-white/30 transform -rotate-6">
                                            <Layers className="h-12 w-12 text-white" />
                                        </div>
                                        <div>
                                            <SheetTitle className="text-4xl font-black text-white leading-tight tracking-tighter">
                                                Section {detailItem.section_name}
                                            </SheetTitle>
                                            <SheetDescription className="text-white/80 font-bold text-lg mt-1 flex items-center gap-2">
                                                <div className={`h-3 w-3 rounded-full ${detailItem.is_active ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
                                                {detailItem.is_active ? 'Active Section' : 'Inactive Section'}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>
                            </div>

                            <div className="p-10 space-y-6 flex-1 overflow-y-auto">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 bg-gray-50 rounded-[2.5rem] border-2 border-transparent hover:border-purple-100 transition-all">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Students</p>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <p className="text-2xl font-black text-gray-900">{sectionStats?.student_count || 0}</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-gray-50 rounded-[2.5rem] border-2 border-transparent hover:border-orange-100 transition-all">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Performance</p>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                                    <CheckCircle className="h-5 w-5" />
                                                </div>
                                                <p className="text-2xl font-black text-gray-900">{sectionStats?.overall_performance || 0}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-red-50/50 rounded-[2.5rem] border-2 border-transparent hover:border-red-100 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center">
                                                <AlertCircle className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Attendance Defaulters</p>
                                                <p className="text-xl font-black text-red-600">{sectionStats?.defaulters_count || 0} Students below 75%</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50 rounded-[2.5rem] border-2 border-transparent hover:border-indigo-100 transition-all">
                                        <div className="flex items-center gap-5 mb-4">
                                            <div className="h-14 w-14 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <Users className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Assigned Teachers</p>
                                                <p className="text-xl font-black text-gray-900">{sectionStats?.teachers?.length || 0} Faculty Members</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {sectionStats?.teachers?.map((t, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                                    <span className="font-bold text-gray-800">{t.name}</span>
                                                    <Badge className="bg-indigo-50 text-indigo-600 border-0 text-[10px] font-black uppercase tracking-widest">
                                                        {t.subject}
                                                    </Badge>
                                                </div>
                                            ))}
                                            {(!sectionStats?.teachers || sectionStats.teachers.length === 0) && (
                                                <p className="text-gray-400 text-sm font-medium text-center py-4 italic">No teachers assigned yet</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50 rounded-[2.5rem] border-2 border-transparent hover:border-purple-100 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <Hash className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Section Name</p>
                                                <p className="text-xl font-black text-gray-900 font-mono italic">{detailItem.section_name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50 rounded-[2.5rem] border-2 border-transparent hover:border-blue-100 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <Building2 className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Department / Branch</p>
                                                <p className="text-xl font-black text-gray-900 leading-tight">{getBranchName(detailItem.branch_id)}</p>
                                                <p className="text-sm font-bold text-blue-500 mt-1">{getBranchCode(detailItem.branch_id)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50 rounded-[2.5rem] border-2 border-transparent hover:border-orange-100 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                                <Calendar className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Academic Term</p>
                                                <p className="text-xl font-black text-gray-900">Semester {getSemesterNum(detailItem.semester_id)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50 rounded-[2.5rem] border-2 border-transparent hover:border-emerald-100 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                <Users className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Capacity</p>
                                                <p className="text-xl font-black text-gray-900">{detailItem.max_students} Students</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 space-y-4">
                                    <Button
                                        variant="outline"
                                        className="w-full h-18 rounded-[2rem] border-2 border-gray-100 hover:border-indigo-500 hover:text-indigo-600 text-gray-600 font-black text-lg transition-all flex items-center justify-between px-10 group"
                                        onClick={(e) => { setIsDetailOpen(false); openEditModal(detailItem, e); }}
                                    >
                                        <span className="flex items-center gap-4">
                                            <Pencil className="h-6 w-6" /> Edit Details
                                        </span>
                                        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                            <Layers className="h-4 w-4" />
                                        </div>
                                    </Button>

                                    {detailItem.is_active ? (
                                        <Button
                                            variant="outline"
                                            className="w-full h-18 rounded-[2rem] border-0 bg-red-50 hover:bg-red-100 text-red-600 font-black text-lg transition-all flex items-center justify-between px-10 group"
                                            onClick={(e) => openStatusDialog(detailItem, e)}
                                        >
                                            <span className="flex items-center gap-4">
                                                <Power className="h-6 w-6" /> Deactivate
                                            </span>
                                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                <AlertCircle className="h-5 w-5" />
                                            </div>
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full h-18 rounded-[2rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-between px-10 group"
                                            onClick={(e) => openStatusDialog(detailItem, e)}
                                        >
                                            <span className="flex items-center gap-4">
                                                <Power className="h-6 w-6 stroke-[3px]" /> Reactivate
                                            </span>
                                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                                                <CheckCircle className="h-5 w-5" />
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
                <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-[3rem] border-0 shadow-2xl">
                    <DialogHeader className={`px-10 pt-10 pb-8 ${statusItem?.is_active ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md transform rotate-12">
                                <Power className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-white">
                                    {statusItem?.is_active ? 'Confirm Deactivation' : 'Confirm Reactivation'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 font-bold text-base">
                                    Updating section status
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-10 py-10 space-y-8 text-center">
                        <div className="p-10 bg-gray-50 rounded-[3rem] border-4 border-white shadow-inner flex flex-col items-center gap-4">
                            <div className={`h-24 w-24 rounded-[2.5rem] ${statusItem?.is_active ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center transform transition-transform hover:scale-110`}>
                                <Layers className="h-12 w-12" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-gray-900 tracking-tighter">SECTION {statusItem?.section_name}</p>
                                <p className="text-gray-500 font-black mt-1 uppercase tracking-widest text-[11px] px-4 py-1.5 bg-white rounded-full shadow-sm">{getBranchName(statusItem?.branch_id)}</p>
                            </div>
                        </div>

                        <p className="text-gray-600 font-bold leading-relaxed px-4 text-lg">
                            {statusItem?.is_active
                                ? 'Warning: This section will be hidden from all active enrollment and scheduling views.'
                                : 'This section will be restored and made available for enrollment and teacher assignments.'}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setIsStatusOpen(false)}
                                className="flex-1 rounded-[1.5rem] border-0 bg-gray-100 text-gray-600 hover:bg-gray-200 h-16 font-black text-lg transition-all"
                            >
                                Not Now
                            </Button>
                            <Button
                                type="button"
                                onClick={handleToggleActive}
                                disabled={toggleStatusMutation.isPending}
                                className={`flex-1 rounded-[1.5rem] h-16 font-black text-lg transition-all shadow-xl active:scale-95 ${statusItem?.is_active
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                                    } text-white`}
                            >
                                {toggleStatusMutation.isPending ? (
                                    <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Confirm'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Sections;

