import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/components/ui/use-toast";
import { users, branches, sections, common, semesters } from '../../services/api';
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Pencil, GraduationCap, UserPlus, AlertCircle, Eye, Power, CheckCircle, XCircle, Mail, Phone, Building2, Layers, Search, ChevronLeft, ChevronRight, FileUp, Download, FileSpreadsheet } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import SectionHeader from '@/components/SectionHeader';

const initialFormData = {
    first_name: '', last_name: '', email: '',
    phone_number: '', gender: 'male', date_of_birth: '',
    roll_no: '', branch_id: '', section_id: '',
    profile_picture_url: ''
};

const Students = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [showInactive, setShowInactive] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 10;
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [error, setError] = useState('');

    const [detailItem, setDetailItem] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const [deactivateItem, setDeactivateItem] = useState(null);
    const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

    // Data Fetching with React Query
    const { data: studentsData = { items: [], total: 0 }, isLoading: isLoadingStudents } = useQuery({
        queryKey: ['students', page, searchTerm],
        queryFn: async () => {
            const res = await users.getAll({
                role: 'student',
                skip: (page - 1) * limit,
                limit,
                search: searchTerm
            });
            return res.data;
        }
    });

    const studentsList = studentsData?.items || [];
    const totalCount = studentsData?.total || 0;

    const { data: branchesList = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await branches.getAll({ limit: 100 });
            return Array.isArray(res.data) ? res.data : (res.data?.items || []);
        }
    });

    // Fetch Semesters to identify "1st Semester"
    const { data: semestersList = [] } = useQuery({
        queryKey: ['semesters'],
        queryFn: async () => {
            const res = await semesters.getAll({ limit: 100 });
            return res.data.items || []; // Backend returns paginated response
        }
    });

    // Identify Semester 1 robustly (backend uses int 1 for number)
    const sem1 = semestersList.find(s => Number(s.semester_name) === 1);

    if (isModalOpen && !sem1 && semestersList.length > 0) {
        console.warn("WARN: Semester 1 not found in semestersList", semestersList);
    }

    // Main Sections list for Table (fetch all to ensure IDs resolve)
    const { data: sectionsList = [] } = useQuery({
        queryKey: ['sections'],
        queryFn: async () => {
            const res = await sections.getAll({ limit: 1000 });
            return res.data.items || [];
        }
    });


    // Dedicated query for the form dropdown (Filtered by Branch + Sem 1)
    const { data: availableSections = [] } = useQuery({
        queryKey: ['available-sections', formData.branch_id, sem1?.id],
        queryFn: async () => {
            if (!formData.branch_id || !sem1?.id) return [];

            const res = await sections.getAll({
                branch_id: formData.branch_id,
                semester_id: sem1.id
            });

            // section.getAll returns PaginatedResponse, so .items is needed
            const items = res.data.items || [];

            // Double-check filtering on frontend as a safety measure
            return items.filter(s => s.semester_id === sem1.id && s.branch_id === formData.branch_id);
        },
        enabled: !!formData.branch_id && !!sem1?.id && isModalOpen
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => users.createStudent(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['students']);
            setIsModalOpen(false);
            setFormData(initialFormData);
            setEditingItem(null);
        },
        onError: (err) => setError(err.response?.data?.detail || 'Failed to create student.')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => users.update(id, data),
        onSuccess: (response) => {
            queryClient.invalidateQueries(['students']);
            setIsModalOpen(false);
            setFormData(initialFormData);
            setEditingItem(null);

            // Update detail view if open
            if (detailItem && detailItem.id === response.data.id) {
                setDetailItem(response.data);
            }
        },
        onError: (err) => setError(err.response?.data?.detail || 'Failed to update student.')
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }) => users.update(id, { is_active }),
        onSuccess: (response) => {
            queryClient.invalidateQueries(['students']);
            setIsDeactivateOpen(false);
            setDeactivateItem(null);
            // Update detail view if open
            if (detailItem && detailItem.id === response.data.id) {
                setDetailItem(response.data);
            }
        },
        onError: () => alert('Failed to update status')
    });

    // Handlers
    const openCreateModal = () => {
        setEditingItem(null);
        setFormData(initialFormData);
        setError('');
        setIsModalOpen(true);
    };

    const openEditModal = (item, e) => {
        e?.stopPropagation();
        setEditingItem(item);
        setFormData({
            first_name: item.first_name, last_name: item.last_name, email: item.email,
            phone_number: item.phone_number || '', gender: item.gender || 'male', date_of_birth: item.date_of_birth || '',
            roll_no: item.roll_no || '',
            branch_id: item.branch_id ? String(item.branch_id) : '',
            section_id: item.section_id ? String(item.section_id) : '',
            profile_picture_url: item.profile_picture_url || ''
        });
        setError('');
        setIsModalOpen(true);
    };

    const openDetailSheet = (item) => { setDetailItem(item); setIsDetailOpen(true); };
    const openDeactivateDialog = (item, e) => { e?.stopPropagation(); setDeactivateItem(item); setIsDeactivateOpen(true); };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (editingItem) {
            const updatePayload = { ...formData };
            if (updatePayload.branch_id === "") updatePayload.branch_id = null;
            if (updatePayload.section_id === "") updatePayload.section_id = null;
            delete updatePayload.roll_no;

            updateMutation.mutate({ id: editingItem.id, data: updatePayload });
        } else {
            // CREATE: Password is auto-generated by backend
            const createPayload = { ...formData };
            createMutation.mutate(createPayload);
        }
    };

    const handleToggleActive = () => {
        if (!deactivateItem) return;
        toggleStatusMutation.mutate({ id: deactivateItem.id, is_active: !deactivateItem.is_active });
    };

    // Derived Data
    const getBranchCode = (id) => branchesList.find(b => b.id === id)?.branch_code || '';
    const getBranchName = (id) => branchesList.find(b => b.id === id)?.branch_name || '';
    const getSectionName = (id) => sectionsList.find(s => s.id === id)?.section_name || '';

    const filteredData = studentsList.filter(item => {
        const matchesStatus = showInactive ? !item.is_active : item.is_active;
        // Search is now done on server, but we still apply status filter here if needed (actually it might be better to do status on server too)
        return matchesStatus;
    });

    const isLoading = isLoadingStudents;

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Students"
                subtitle="Manage student enrollments & profiles"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <span className={`text-xs font-semibold uppercase tracking-wider ${!showInactive ? 'text-blue-600' : 'text-gray-400'}`}>Active</span>
                            <Switch checked={showInactive} onCheckedChange={setShowInactive} className="data-[state=checked]:bg-red-500" />
                            <span className={`text-xs font-semibold uppercase tracking-wider ${showInactive ? 'text-red-500' : 'text-gray-400'}`}>Inactive</span>
                        </div>
                        <Button variant="outline" onClick={() => setIsImportOpen(true)} className="rounded-2xl border-gray-200 h-11 px-6 font-semibold hover:bg-gray-50 flex items-center gap-2">
                            <FileUp className="h-5 w-5 text-blue-600" /> Bulk Import
                        </Button>
                        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg h-11 px-6 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Plus className="mr-2 h-5 w-5" /> Add Student
                        </Button>
                    </div>
                }
            />

            {/* Search Bar */}
            < div className="flex gap-4" >
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search students by name, roll number, or email..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1); // Reset to page 1 on search
                        }}
                        className="h-12 pl-12 rounded-2xl border-gray-200 bg-white/50 focus:bg-white transition-all text-base"
                    />
                </div>
            </div >

            {/* Table Card */}
            < Card className="bg-white/80 backdrop-blur-xl rounded-[2rem] border-0 shadow-xl shadow-gray-100/50 overflow-hidden" >
                <CardHeader className="bg-white/50 border-b border-gray-100 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">{showInactive ? 'Inactive Students' : 'Active Students'}</CardTitle>
                            <CardDescription className="text-gray-500 font-medium mt-1">
                                Showing students {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                                <TableHead className="font-semibold text-gray-600 pl-8 h-12">Student</TableHead>
                                <TableHead className="font-semibold text-gray-600 h-12">Roll Number</TableHead>
                                <TableHead className="font-semibold text-gray-600 h-12">Branch</TableHead>
                                <TableHead className="font-semibold text-gray-600 h-12 w-32">Status</TableHead>
                                <TableHead className="text-right font-semibold text-gray-600 pr-8 h-12 w-32">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i} className="border-b border-gray-50">
                                        <TableCell className="pl-8 py-4"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24 rounded-lg" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16 rounded-lg" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-lg" /></TableCell>
                                        <TableCell className="pr-8"><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-8 w-8 rounded-lg" /></div></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-24">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-6 rounded-3xl bg-gray-50 ring-1 ring-gray-100">
                                                <UserPlus className="h-10 w-10 text-gray-300" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-gray-800">No students found</p>
                                                <p className="text-sm text-gray-500 font-medium mt-1">
                                                    {searchTerm ? 'Try adjusting your search terms' : (showInactive ? 'No inactive students' : 'Get started by enrolling a new student')}
                                                </p>
                                            </div>
                                            {!showInactive && !searchTerm && (
                                                <Button onClick={openCreateModal} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">
                                                    <Plus className="mr-2 h-4 w-4" /> Add Student
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="group hover:bg-blue-50/30 transition-all border-b border-gray-50 last:border-0 cursor-pointer"
                                        onClick={() => openDetailSheet(item)}
                                    >
                                        <TableCell className="pl-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-2 ring-gray-50">
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-bold">
                                                        {item.first_name?.[0]}{item.last_name?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                                                        {item.first_name} {item.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                                        <Mail className="h-3 w-3" /> {item.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 font-mono font-medium rounded-lg">
                                                {item.roll_no}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-blue-100 rounded-lg font-medium">
                                                {getBranchCode(item.branch_id) || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {item.is_active ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-blue-200 border-0 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm">
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" onClick={(e) => { e.stopPropagation(); openDetailSheet(item); }}>
                                                    <Eye className="h-4.5 w-4.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" onClick={(e) => openEditModal(item, e)}>
                                                    <Pencil className="h-4.5 w-4.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing {filteredData.length} of {totalCount} students
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                setPage(p => Math.max(1, p - 1));
                                window.scrollTo(0, 0);
                            }}
                            disabled={page === 1}
                            className="h-9 w-9 rounded-xl border-gray-200 hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-[2.25rem] h-9 px-2 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-sm font-bold text-gray-700 shadow-sm">
                            {page}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                setPage(p => p + 1);
                                window.scrollTo(0, 0);
                            }}
                            disabled={page * limit >= totalCount}
                            className="h-9 w-9 rounded-xl border-gray-200 hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

            </Card >

            {/* Create/Edit Dialog */}
            < Dialog open={isModalOpen} onOpenChange={setIsModalOpen} >
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
                    <DialogHeader className="px-8 pt-8 pb-6 bg-gradient-to-br from-blue-500 to-blue-600 shrink-0">
                        <DialogTitle className="flex items-center gap-4 text-white text-2xl font-bold">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner"><UserPlus className="h-6 w-6 text-white" /></div>
                            {editingItem ? 'Edit Student Profile' : 'Enroll New Student'}
                        </DialogTitle>
                        <DialogDescription className="text-blue-50 text-base font-medium pl-[4.5rem]">
                            {editingItem ? 'Update the student\'s information below.' : 'Add a new student to the university database.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6 bg-white">
                            {error && (
                                <div className="flex items-center gap-3 bg-red-50 text-red-600 text-sm font-medium p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-gray-700 ml-1">First Name</Label>
                                    <Input required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} placeholder="John" className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-gray-700 ml-1">Last Name</Label>
                                    <Input required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} placeholder="Doe" className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all" />
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-gray-700 ml-1">Email Address</Label>
                                    <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@university.edu" className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all" />
                                </div>

                                <div className="space-y-2.5 col-span-2">
                                    <Label className="text-sm font-semibold text-gray-700 ml-1">Profile Picture</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center relative group">
                                            {formData.profile_picture_url ? (
                                                <img src={formData.profile_picture_url} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                <UserPlus className="h-6 w-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        try {
                                                            const res = await common.uploadImage(file);
                                                            setFormData({ ...formData, profile_picture_url: res.data.url });
                                                        } catch (err) {
                                                            console.error(err);
                                                            setError('Failed to upload image');
                                                        }
                                                    }
                                                }}
                                                className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all pt-2.5"
                                            />
                                            <p className="text-xs text-gray-400 mt-1 ml-1">Upload JPEG/PNG (Max 5MB)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-gray-700 ml-1">Roll Number</Label>
                                    <Input required value={formData.roll_no} onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })} disabled={!!editingItem} placeholder="e.g. CS2023001" className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all font-mono uppercase" />
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-gray-700 ml-1">Phone Number</Label>
                                    <Input value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} placeholder="+91 98765 43210" className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all" />
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-gray-700 ml-1">Date of Birth</Label>
                                    <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all" />
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-gray-700 ml-1">Gender</Label>
                                    <Select value={formData.gender} onValueChange={(val) => setFormData({ ...formData, gender: val })}>
                                        <SelectTrigger className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                                        <SelectContent className="rounded-xl"><SelectItem value="male" className="rounded-lg">Male</SelectItem><SelectItem value="female" className="rounded-lg">Female</SelectItem><SelectItem value="other" className="rounded-lg">Other</SelectItem></SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-gray-700 ml-1">Branch</Label>
                                    <Select value={formData.branch_id} onValueChange={(val) => setFormData({ ...formData, branch_id: val, section_id: '' })}>
                                        <SelectTrigger className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                                        <SelectContent className="rounded-xl">{branchesList.filter(b => b.is_active).map(b => <SelectItem key={b.id} value={String(b.id)} className="rounded-lg">{b.branch_name} ({b.branch_code})</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-gray-700 ml-1">Section</Label>
                                    <Select value={formData.section_id} onValueChange={(val) => setFormData({ ...formData, section_id: val })} disabled={!formData.branch_id}>
                                        <SelectTrigger className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all"><SelectValue placeholder="Select Section" /></SelectTrigger>
                                        <SelectContent className="rounded-xl">{availableSections.map(s => <SelectItem key={s.id} value={String(s.id)} className="rounded-lg">Section {s.section_name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter className="pt-4 gap-3">
                                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border-gray-200 h-12 px-6 hover:bg-gray-50">Cancel</Button>
                                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-8 font-semibold shadow-lg shadow-blue-500/20">
                                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingItem ? 'Update Student' : 'Create Student')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Detail Sheet */}
            < Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen} >
                <SheetContent className="sm:max-w-[500px] p-0 border-0 overflow-hidden shadow-2xl">
                    {detailItem && (
                        <>
                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-8 pb-10">
                                <SheetHeader>
                                    <div className="flex items-center gap-6">
                                        <Avatar className="h-24 w-24 border-4 border-white/20 shadow-xl ring-1 ring-white/10">
                                            <AvatarFallback className="bg-white/10 text-white text-3xl font-bold backdrop-blur-md">
                                                {detailItem.first_name?.[0]}{detailItem.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <SheetTitle className="text-white text-2xl font-bold tracking-tight">
                                                {detailItem.first_name} {detailItem.last_name}
                                            </SheetTitle>
                                            <SheetDescription className="text-blue-50 text-base font-medium flex items-center gap-2">
                                                <GraduationCap className="h-4 w-4" /> {detailItem.roll_no}
                                            </SheetDescription>
                                            <div className="pt-2">
                                                {detailItem.is_active ?
                                                    (<Badge className="bg-white/20 text-white hover:bg-white/25 border-0 rounded-lg px-3 py-1 backdrop-blur-sm"><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Active</Badge>) :
                                                    (<Badge className="bg-red-500/20 text-white hover:bg-red-500/30 border-0 rounded-lg px-3 py-1 backdrop-blur-sm"><XCircle className="h-3.5 w-3.5 mr-1.5" />Inactive</Badge>)
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </SheetHeader>
                            </div>

                            <div className="p-8 -mt-6 bg-white rounded-t-[2.5rem] relative z-10 space-y-8 h-full overflow-y-auto">
                                <div className="space-y-5">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Academic Details</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
                                            <p className="text-xs text-gray-500 font-semibold uppercase">Branch</p>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-blue-500" />
                                                <p className="font-bold text-gray-800">{getBranchName(detailItem.branch_id)}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
                                            <p className="text-xs text-gray-500 font-semibold uppercase">Section</p>
                                            <div className="flex items-center gap-2">
                                                <Layers className="h-4 w-4 text-blue-500" />
                                                <p className="font-bold text-gray-800">Section {getSectionName(detailItem.section_id)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="p-3 bg-white rounded-xl shadow-sm"><Mail className="h-5 w-5 text-gray-500" /></div>
                                        <div><p className="text-xs text-gray-500 font-semibold uppercase">Email Address</p><p className="text-base font-bold text-gray-800">{detailItem.email}</p></div>
                                    </div>

                                    {detailItem.phone_number && (
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="p-3 bg-white rounded-xl shadow-sm"><Phone className="h-5 w-5 text-gray-500" /></div>
                                            <div><p className="text-xs text-gray-500 font-semibold uppercase">Phone Number</p><p className="text-base font-bold text-gray-800">{detailItem.phone_number}</p></div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <Button variant="outline" className="w-full h-14 rounded-2xl border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm" onClick={(e) => { setIsDetailOpen(false); openEditModal(detailItem, e); }}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit Student Profile
                                    </Button>

                                    {detailItem.is_active ? (
                                        <Button variant="outline" className="w-full h-14 rounded-2xl border-red-100 text-red-600 hover:bg-red-50 font-semibold shadow-sm hover:border-red-200" onClick={(e) => { setIsDetailOpen(false); openDeactivateDialog(detailItem, e); }}>
                                            <Power className="h-4 w-4 mr-2" />
                                            Mark as Inactive
                                        </Button>
                                    ) : (
                                        <Button className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/20" onClick={(e) => { setIsDetailOpen(false); openDeactivateDialog(detailItem, e); }}>
                                            <Power className="h-4 w-4 mr-2" />
                                            Reactivate Student
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet >

            {/* Deactivation Dialog */}
            < Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen} >
                <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
                    <DialogHeader className={`px-8 pt-8 pb-6 ${deactivateItem?.is_active ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                        <div className="flex items-center gap-4 text-white">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                {deactivateItem?.is_active ? <AlertCircle className="h-6 w-6" /> : <Power className="h-6 w-6" />}
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">
                                    {deactivateItem?.is_active ? 'Mark Inactive' : 'Reactivate'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 font-medium">
                                    Confirm status change
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-8 py-8 bg-white space-y-6">
                        <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 border border-gray-100">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-gray-200 text-gray-500 font-bold">
                                    {deactivateItem?.first_name?.[0]}{deactivateItem?.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-gray-800 text-lg">{deactivateItem?.first_name} {deactivateItem?.last_name}</p>
                                <p className="text-sm text-gray-500 font-mono">{deactivateItem?.roll_no}</p>
                            </div>
                        </div>

                        <p className="text-gray-600 leading-relaxed">
                            {deactivateItem?.is_active
                                ? 'Are you sure you want to mark this student as inactive? They will no longer appear in active student lists, but their data will be preserved.'
                                : 'Are you sure you want to reactivate this student? They will immediately regain access to the system.'}
                        </p>

                        <DialogFooter className="gap-3 pt-2">
                            <Button variant="outline" type="button" onClick={() => setIsDeactivateOpen(false)} className="rounded-xl border-gray-200 h-12 px-6 hover:bg-gray-50 font-semibold flex-1">Cancel</Button>
                            <Button
                                type="button"
                                onClick={handleToggleActive}
                                disabled={toggleStatusMutation.isPending}
                                className={`rounded-xl h-12 px-6 font-semibold flex-1 shadow-lg ${deactivateItem?.is_active
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                    }`}
                            >
                                {toggleStatusMutation.isPending ? 'Processing...' : (deactivateItem?.is_active ? 'Mark Inactive' : 'Reactivate')}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Bulk Import Dialog */}
            < Dialog open={isImportOpen} onOpenChange={setIsImportOpen} >
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
                    <DialogHeader className="px-8 pt-8 pb-6 bg-gradient-to-br from-indigo-500 to-indigo-600">
                        <DialogTitle className="flex items-center gap-4 text-white text-2xl font-bold">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner"><FileUp className="h-6 w-6 text-white" /></div>
                            Bulk student Import
                        </DialogTitle>
                        <DialogDescription className="text-indigo-50 text-base font-medium pl-[4.5rem]">
                            Upload a CSV file to enroll multiple students at once.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-8 py-8 space-y-6 bg-white">
                        <div
                            className="border-2 border-dashed border-gray-200 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                            onClick={() => document.getElementById('csv-upload').click()}
                        >
                            <div className="p-4 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <FileSpreadsheet className="h-10 w-10 text-indigo-600 group-hover:text-white" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-gray-800">Click to upload CSV</p>
                                <p className="text-sm text-gray-500 font-medium">or drag and drop file here</p>
                            </div>
                            <input
                                id="csv-upload"
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    try {
                                        const res = await users.importCSV('STUDENT', file);

                                        if (res.data.error_count > 0) {
                                            toast({
                                                title: "Import Completed with Issues",
                                                description: `Success: ${res.data.success_count} imported. Failed: ${res.data.error_count}. Check console for details.`,
                                                variant: "destructive",
                                            });
                                            console.error('Import Errors:', res.data.errors);
                                        } else {
                                            toast({
                                                title: "Success",
                                                description: "All students added successfully",
                                                variant: "default",
                                                className: "bg-green-50 border-green-200 text-green-800", // Custom styling for success if needed, or just default
                                            });
                                        }

                                        queryClient.invalidateQueries(['students']);
                                        setIsImportOpen(false);
                                    } catch (err) {
                                        toast({
                                            title: "Import Failed",
                                            description: err.response?.data?.detail || 'Failed to import CSV',
                                            variant: "destructive",
                                        });
                                    }
                                }}
                            />
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Expected CSV Headers</h4>
                            <code className="text-[11px] font-mono text-slate-600 break-all bg-white p-3 rounded-xl block border border-slate-100">
                                first_name, last_name, email, roll_no, phone_number, branch_code, section_name
                            </code>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button variant="outline" className="h-12 rounded-xl border-gray-200 font-semibold gap-2">
                                <Download className="h-4 w-4" /> Download Example Template
                            </Button>
                            <Button variant="ghost" onClick={() => setIsImportOpen(false)} className="h-12 rounded-xl text-gray-500 font-semibold">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >
        </div >
    );
};

export default Students;
