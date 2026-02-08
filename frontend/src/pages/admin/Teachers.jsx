import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/components/ui/use-toast";
import { users } from '../../services/api';
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
import { Plus, Pencil, Users, UserPlus, AlertCircle, Eye, Power, CheckCircle, XCircle, Mail, Phone, Briefcase, Building, Search, ChevronLeft, ChevronRight, FileUp, Download, FileSpreadsheet } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import SectionHeader from '@/components/SectionHeader';

const initialFormData = {
    first_name: '', last_name: '', email: '', password: '',
    phone_number: '', gender: 'male', date_of_birth: '',
    designation: '', department: ''
};

const Teachers = () => {
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

    // Data Fetching
    const { data: teachersData = { items: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['teachers', page, searchTerm],
        queryFn: async () => {
            const res = await users.getAll({
                role: 'teacher',
                skip: (page - 1) * limit,
                limit,
                search: searchTerm
            });
            return res.data;
        }
    });

    const teachersList = teachersData?.items || [];
    const totalCount = teachersData?.total || 0;

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => users.createTeacher(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['teachers']);
            setIsModalOpen(false);
            setFormData(initialFormData);
            setEditingItem(null);
        },
        onError: (err) => setError(err.response?.data?.detail || 'Failed to create teacher.')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => users.update(id, data),
        onSuccess: (response) => {
            queryClient.invalidateQueries(['teachers']);
            setIsModalOpen(false);
            setFormData(initialFormData);
            setEditingItem(null);
            // Update detail view if open
            if (detailItem && detailItem.id === response.data.id) {
                setDetailItem(response.data);
            }
        },
        onError: (err) => setError(err.response?.data?.detail || 'Failed to update teacher.')
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }) => users.update(id, { is_active }),
        onSuccess: (response) => {
            queryClient.invalidateQueries(['teachers']);
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
            first_name: item.first_name, last_name: item.last_name, email: item.email, password: '',
            phone_number: item.phone_number || '', gender: item.gender || 'male', date_of_birth: item.date_of_birth || '',
            designation: item.designation || '', department: item.department || ''
        });
        setError('');
        setIsModalOpen(true);
    };

    const openDetailSheet = (item) => { setDetailItem(item); setIsDetailOpen(true); };
    const openDeactivateDialog = (item, e) => { e?.stopPropagation(); setDeactivateItem(item); setIsDeactivateOpen(true); };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // 1. Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        // 2. Phone Validation (Optional but must be digits if provided)
        if (formData.phone_number) {
            const phoneDigits = formData.phone_number.replace(/\D/g, '');
            if (phoneDigits.length < 10) {
                setError('Phone number must be at least 10 digits.');
                return;
            }
        }

        // 3. Date of Birth Validation (Cannot be in future)
        if (formData.date_of_birth) {
            const selectedDate = new Date(formData.date_of_birth);
            const today = new Date();
            if (selectedDate > today) {
                setError('Date of Birth cannot be in the future.');
                return;
            }
        }

        if (editingItem) {
            // UPDATE: Exclude password
            const updatePayload = { ...formData };
            delete updatePayload.password;
            if (updatePayload.designation === "") updatePayload.designation = null;
            if (updatePayload.department === "") updatePayload.department = null;

            updateMutation.mutate({ id: editingItem.id, data: updatePayload });
        } else {
            // CREATE: Include password
            const createPayload = { ...formData };

            // Validate password is provided for new teachers
            if (!createPayload.password || createPayload.password.trim() === '') {
                setError('Password is required for new teachers');
                return;
            }

            createMutation.mutate(createPayload);
        }
    };

    const handleToggleActive = () => {
        if (!deactivateItem) return;
        toggleStatusMutation.mutate({ id: deactivateItem.id, is_active: !deactivateItem.is_active });
    };

    const filteredData = teachersList.filter(item => {
        const matchesStatus = showInactive ? !item.is_active : item.is_active;
        return matchesStatus;
    });

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Teachers"
                subtitle="Manage faculty members, staff and departments"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${!showInactive ? 'text-indigo-600' : 'text-gray-400'}`}>Active</span>
                            <Switch checked={showInactive} onCheckedChange={setShowInactive} className="data-[state=checked]:bg-red-500" />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${showInactive ? 'text-red-500' : 'text-gray-400'}`}>Inactive</span>
                        </div>
                        <Button variant="outline" onClick={() => setIsImportOpen(true)} className="rounded-2xl border-gray-200 h-11 px-6 font-semibold hover:bg-gray-50 flex items-center gap-2">
                            <FileUp className="h-5 w-5 text-indigo-600" /> Bulk Import
                        </Button>
                        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg h-11 px-6 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Plus className="mr-2 h-5 w-5" /> Add Teacher
                        </Button>
                    </div>
                }
            />

            {/* Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                </div>
                <Input
                    placeholder="Search teachers by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                    }}
                    className="h-14 pl-12 rounded-[1.25rem] border-gray-200 bg-white shadow-sm focus:ring-teal-500 focus:border-teal-500 transition-all text-base placeholder:text-gray-400"
                />
            </div>

            {/* Table Card */}
            <Card className="bg-white rounded-[2.5rem] border-0 shadow-xl shadow-gray-100/50 overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black text-gray-900">{showInactive ? 'Inactive Staff' : 'Active Faculty'}</CardTitle>
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
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 pl-8 h-14">Faculty Member</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">Designation</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">Department</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14 w-32">Status</TableHead>
                                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-gray-400 pr-8 h-14 w-32">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i} className="border-b border-gray-50">
                                            <TableCell className="pl-8 py-4"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div></TableCell>
                                            <TableCell><Skeleton className="h-6 w-24 rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-32 rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20 rounded-lg" /></TableCell>
                                            <TableCell className="pr-8"><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-8 w-8 rounded-lg" /></div></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-24">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-8 rounded-[2.5rem] bg-gray-50 ring-1 ring-gray-100">
                                                    <Users className="h-12 w-12 text-gray-200" />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-black text-gray-900">No records found</p>
                                                    <p className="text-sm text-gray-500 font-medium mt-1">
                                                        {searchTerm ? 'No results for your search criteria' : (showInactive ? 'All current staff are active' : 'Start by adding your first faculty member')}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            className="group hover:bg-teal-50/40 transition-all border-b border-gray-50 last:border-0 cursor-pointer"
                                            onClick={() => openDetailSheet(item)}
                                        >
                                            <TableCell className="pl-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-11 w-11 border-2 border-white shadow-sm ring-4 ring-teal-50 group-hover:ring-teal-100 transition-all">
                                                        <AvatarFallback className="bg-gradient-to-br from-teal-400 to-teal-600 text-white text-sm font-black">
                                                            {item.first_name?.[0]}{item.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-black text-gray-900 group-hover:text-teal-600 transition-colors">
                                                            {item.first_name} {item.last_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 font-bold mt-0.5 flex items-center gap-1.5">
                                                            <Mail className="h-3 w-3 text-gray-400" /> {item.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm font-bold text-gray-600 italic">
                                                    {item.designation || 'Not specified'}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-teal-100 text-teal-700 bg-teal-50/50 rounded-xl px-3 py-1 font-bold text-[10px] uppercase tracking-widest shrink-0">
                                                    {item.department || 'General'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {item.is_active ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-red-400" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Inactive</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-teal-600 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-teal-100 transition-all" onClick={(e) => { e.stopPropagation(); openDetailSheet(item); }}>
                                                        <Eye className="h-4.5 w-4.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-teal-600 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-teal-100 transition-all" onClick={(e) => openEditModal(item, e)}>
                                                        <Pencil className="h-4.5 w-4.5" />
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
                <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Total {totalCount} Faculty Members Found
                    </p>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                setPage(p => Math.max(1, p - 1));
                                window.scrollTo(0, 0);
                            }}
                            disabled={page === 1}
                            className="h-10 w-10 rounded-2xl border-gray-200 hover:bg-white hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm disabled:opacity-50"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-10 px-4 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-xs font-black text-teal-600 shadow-sm">
                            {page} / {Math.ceil(totalCount / limit) || 1}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                setPage(p => p + 1);
                                window.scrollTo(0, 0);
                            }}
                            disabled={page * limit >= totalCount}
                            className="h-10 w-10 rounded-2xl border-gray-200 hover:bg-white hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm disabled:opacity-50"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden rounded-[3rem] border-0 shadow-2xl bg-white">
                    <DialogHeader className="px-10 pt-10 pb-8 bg-gradient-to-br from-teal-500 to-teal-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-10 -mb-10 blur-2xl" />

                        <div className="relative z-10 flex items-center gap-6">
                            <div className="p-4 bg-white/20 rounded-[2rem] backdrop-blur-xl shadow-inner border border-white/20">
                                <UserPlus className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-white text-3xl font-black tracking-tight leading-none">
                                    {editingItem ? 'Edit Profile' : 'New Faculty'}
                                </DialogTitle>
                                <DialogDescription className="text-teal-50 text-base font-bold mt-2 opacity-90 uppercase text-[10px] tracking-[0.2em]">
                                    {editingItem ? 'Update existing teacher credentials' : 'Register a new faculty member'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden custom-scrollbar px-10 py-10">
                        <form id="teacher-form" onSubmit={handleSubmit} className="space-y-8">
                            {error && (
                                <div className="flex items-center gap-4 bg-red-50 text-red-600 text-sm font-black p-5 rounded-[1.5rem] border-2 border-red-100/50 animate-in fade-in slide-in-from-top-4 uppercase tracking-wider">
                                    <div className="h-10 w-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                                        <AlertCircle className="h-6 w-6" />
                                    </div>
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">First Name</Label>
                                    <Input required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} placeholder="Enter first name" className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all font-bold" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</Label>
                                    <Input required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} placeholder="Enter last name" className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all font-bold" />
                                </div>

                                <div className="space-y-3 col-span-2">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="faculty@university.edu" className="h-14 pl-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all font-bold" />
                                    </div>
                                </div>

                                {!editingItem && (
                                    <div className="space-y-3 col-span-2">
                                        <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Account Password</Label>
                                        <Input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••••••" className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all font-bold" />
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <Input value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} placeholder="+1 (555) 000-0000" className="h-14 pl-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all font-bold" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Date of Birth</Label>
                                    <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all font-bold pr-4" />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Gender</Label>
                                    <Select value={formData.gender} onValueChange={(val) => setFormData({ ...formData, gender: val })}>
                                        <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold">
                                            <SelectValue placeholder="Select Gender" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-gray-100 shadow-xl p-2">
                                            <SelectItem value="male" className="rounded-xl font-bold py-3">Male Faculty</SelectItem>
                                            <SelectItem value="female" className="rounded-xl font-bold py-3">Female Faculty</SelectItem>
                                            <SelectItem value="other" className="rounded-xl font-bold py-3">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Designation</Label>
                                    <Input required value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="e.g. Senior Professor" className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold" />
                                </div>

                                <div className="space-y-3 col-span-2">
                                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Department / Faculty</Label>
                                    <div className="relative">
                                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <Input required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="e.g. School of Engineering" className="h-14 pl-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold" />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="px-10 py-8 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-4">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} className="rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-white transition-all">
                            Discard Changes
                        </Button>
                        <Button form="teacher-form" type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-teal-500 hover:bg-teal-600 text-white rounded-2xl h-14 px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
                            {createMutation.isPending || updateMutation.isPending ? 'Processing...' : (editingItem ? 'Save Changes' : 'Confirm Registration')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Detail View Sheet */}
            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent className="sm:max-w-[550px] p-0 border-0 overflow-hidden shadow-2xl bg-white rounded-l-[3rem]">
                    {detailItem && (
                        <div className="h-full flex flex-col">
                            <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-10 pb-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-10 -mb-10 blur-2xl" />

                                <SheetHeader className="relative z-10">
                                    <div className="flex flex-col items-center text-center gap-6">
                                        <Avatar className="h-32 w-32 border-4 border-white/20 shadow-2xl ring-4 ring-white/10">
                                            <AvatarFallback className="bg-white/10 text-white text-4xl font-black backdrop-blur-xl">
                                                {detailItem.first_name?.[0]}{detailItem.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-2">
                                            <SheetTitle className="text-white text-3xl font-black tracking-tight">
                                                {detailItem.first_name} {detailItem.last_name}
                                            </SheetTitle>
                                            <div className="flex flex-wrap justify-center gap-2 pt-2">
                                                <Badge className="bg-white/20 text-white hover:bg-white/25 border-0 rounded-xl px-4 py-1.5 backdrop-blur-md font-bold text-[10px] uppercase tracking-widest">
                                                    <Briefcase className="h-3.5 w-3.5 mr-2" /> {detailItem.designation || 'Staff'}
                                                </Badge>
                                                {detailItem.is_active ? (
                                                    <Badge className="bg-emerald-400/20 text-emerald-50 hover:bg-emerald-400/30 border-0 rounded-xl px-4 py-1.5 backdrop-blur-md font-bold text-[10px] uppercase tracking-widest">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-pulse" /> Active Faculty
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-400/20 text-red-50 hover:bg-red-400/30 border-0 rounded-xl px-4 py-1.5 backdrop-blur-md font-bold text-[10px] uppercase tracking-widest">
                                                        <div className="h-2 w-2 rounded-full bg-red-400 mr-2" /> Inactive
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </SheetHeader>
                            </div>

                            <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10 custom-scrollbar">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <div className="h-px flex-1 bg-gray-100" /> Professional Overview
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 rounded-[2rem] bg-gray-50/50 border border-gray-100/50 space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</p>
                                            <p className="font-bold text-gray-900">{detailItem.department || 'Not Assigned'}</p>
                                        </div>
                                        <div className="p-6 rounded-[2rem] bg-gray-50/50 border border-gray-100/50 space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Official Post</p>
                                            <p className="font-bold text-gray-900">{detailItem.designation || 'Faculty Member'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <div className="h-px flex-1 bg-gray-100" /> Contact Connectivity
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm group hover:border-teal-200 transition-colors">
                                            <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                                                <Mail className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Identity</p>
                                                <p className="font-bold text-gray-900">{detailItem.email}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm group hover:border-teal-200 transition-colors">
                                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                <Phone className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Personal Line</p>
                                                <p className="font-bold text-gray-900">{detailItem.phone_number || 'No contact provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pb-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <div className="h-px flex-1 bg-gray-100" /> Identity Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gender</p>
                                            <p className="font-bold text-gray-900 capitalize">{detailItem.gender || 'Not specified'}</p>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date of Birth</p>
                                            <p className="font-bold text-gray-900">{detailItem.date_of_birth ? new Date(detailItem.date_of_birth).toLocaleDateString() : 'Not recorded'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => handleEdit(detailItem)}
                                    className="rounded-2xl h-14 border-gray-200 bg-white font-black uppercase text-[10px] tracking-widest gap-3 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <Pencil className="h-4 w-4 text-teal-600" /> Edit Profile
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsDetailOpen(false)}
                                    className="rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-white transition-all"
                                >
                                    Close View
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Deactivation Dialog */}
            <Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
                <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
                    <DialogHeader className={`px-8 pt-8 pb-6 ${deactivateItem?.is_active ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-teal-500 to-teal-600'}`}>
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
                                <p className="text-sm text-gray-500 font-mono">{deactivateItem?.designation}</p>
                            </div>
                        </div>

                        <p className="text-gray-600 leading-relaxed">
                            {deactivateItem?.is_active
                                ? 'Are you sure you want to mark this teacher as inactive? They will no longer appear in active lists, but their data will be preserved.'
                                : 'Are you sure you want to reactivate this teacher? They will immediately regain access to the system.'}
                        </p>

                        <DialogFooter className="gap-3 pt-2">
                            <Button variant="outline" type="button" onClick={() => setIsDeactivateOpen(false)} className="rounded-xl border-gray-200 h-12 px-6 hover:bg-gray-50 font-semibold flex-1">Cancel</Button>
                            <Button
                                type="button"
                                onClick={handleToggleActive}
                                disabled={toggleStatusMutation.isPending}
                                className={`rounded-xl h-12 px-6 font-semibold flex-1 shadow-lg ${deactivateItem?.is_active
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                                    : 'bg-teal-500 hover:bg-teal-600 text-white shadow-indigo-500/20'
                                    }`}
                            >
                                {toggleStatusMutation.isPending ? 'Processing...' : (deactivateItem?.is_active ? 'Mark Inactive' : 'Reactivate')}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk Import Dialog */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
                    <DialogHeader className="px-8 pt-8 pb-6 bg-gradient-to-br from-teal-500 to-teal-600">
                        <DialogTitle className="flex items-center gap-4 text-white text-2xl font-bold">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner"><FileUp className="h-6 w-6 text-white" /></div>
                            Bulk Teacher Import
                        </DialogTitle>
                        <DialogDescription className="text-teal-50 text-base font-medium pl-[4.5rem]">
                            Upload a CSV file to add multiple teachers at once.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-8 py-8 space-y-6 bg-white">
                        <div
                            className="border-2 border-dashed border-gray-200 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 hover:border-teal-400 hover:bg-teal-50/30 transition-all cursor-pointer group"
                            onClick={() => document.getElementById('csv-upload-teachers').click()}
                        >
                            <div className="p-4 bg-teal-50 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                <FileSpreadsheet className="h-10 w-10 text-teal-600 group-hover:text-white" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-gray-800">Click to upload CSV</p>
                                <p className="text-sm text-gray-500 font-medium">or drag and drop file here</p>
                            </div>
                            <input
                                id="csv-upload-teachers"
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    try {
                                        const res = await users.importCSV('TEACHER', file);

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
                                                description: "All teachers added successfully",
                                                variant: "default",
                                                className: "bg-green-50 border-green-200 text-green-800",
                                            });
                                        }

                                        queryClient.invalidateQueries(['teachers']);
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
                                first_name, last_name, email, phone_number, designation, department
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
            </Dialog>
        </div>
    );
};

export default Teachers;
