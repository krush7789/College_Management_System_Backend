import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branches } from '@/services/api';
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
import { Plus, Pencil, Building2, FolderOpen, AlertCircle, Eye, Power, Calendar, Hash, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';

const Branches = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const limit = 10;

    // UI States
    const [editingItem, setEditingItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ branch_name: '', branch_code: '' });
    const [formError, setFormError] = useState('');

    // Deactivation/Archive States
    const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
    const [deactivateItem, setDeactivateItem] = useState(null);
    const [showInactive, setShowInactive] = useState(false);

    // Detail View
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailItem, setDetailItem] = useState(null);

    // React Query - Fetching
    const { data: branchesData = { items: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['branches', page, searchTerm],
        queryFn: async () => {
            const res = await branches.getAll({
                skip: (page - 1) * limit,
                limit,
                search: searchTerm
            });
            return res.data;
        }
    });

    const branchesList = branchesData.items || [];
    const totalCount = branchesData.total || 0;

    // Mutations
    const createMutation = useMutation({
        mutationFn: (newBranch) => branches.create(newBranch),
        onSuccess: () => {
            queryClient.invalidateQueries(['branches']);
            setIsModalOpen(false);
            setFormData({ branch_name: '', branch_code: '' });
        },
        onError: () => setFormError('Failed to create branch. Code might be duplicate.')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => branches.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['branches']);
            setIsModalOpen(false);
            setEditingItem(null);
        },
        onError: () => setFormError('Failed to update branch.')
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }) => branches.update(id, { is_active: !is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries(['branches']);
            setIsDeactivateOpen(false);
            setDeactivateItem(null);
            if (isDetailOpen) setIsDetailOpen(false);
        }
    });

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({ branch_name: '', branch_code: '' });
        setFormError('');
        setIsModalOpen(true);
    };

    const openEditModal = (item, e) => {
        e?.stopPropagation();
        setEditingItem(item);
        // Map Backend response (alias=name) to Form state (branch_name)
        // Wait, Backend response `BranchResponse` defines aliases.
        // `name` (backend) -> `id: UUID`, `name: str` (Wait, alias="name"). 
        // My schema Step 724: `branch_name: str = Field(alias="name")`.
        // So Pydantic OUTPUTS "name": "..." in JSON.
        // So `item` has `name` and `code`.
        // BUT `formData` needs `branch_name`.
        setFormData({ branch_name: item.branch_name, branch_code: item.branch_code });
        setFormError('');
        setIsModalOpen(true);
    };

    const openDetailSheet = (item) => {
        setDetailItem(item);
        setIsDetailOpen(true);
    };

    const openDeactivateDialog = (item, e) => {
        e?.stopPropagation();
        setDeactivateItem(item);
        setIsDeactivateOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError('');
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    // Filter
    const filteredData = (branchesList || []).filter(item => showInactive ? !item.is_active : item.is_active);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <SectionHeader
                title="Branches"
                subtitle="Manage academic departments and programs"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-white/70 backdrop-blur-md rounded-[1.25rem] border border-white shadow-sm">
                            <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${!showInactive ? 'text-emerald-600' : 'text-gray-400'}`}>Active</span>
                            <Switch
                                checked={showInactive}
                                onCheckedChange={setShowInactive}
                                className="data-[state=checked]:bg-red-500"
                            />
                            <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${showInactive ? 'text-red-600' : 'text-gray-400'}`}>Inactive</span>
                        </div>
                        <Button
                            onClick={openCreateModal}
                            className="bg-primary hover:bg-primary/90 text-white rounded-[1.25rem] h-12 px-6 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus className="mr-2 h-5 w-5" /> Add New
                        </Button>
                    </div>
                }
            />

            {/* Content Card */}
            <Card className="bg-white/50 backdrop-blur-sm rounded-[2rem] border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100/50 px-8 py-6">
                    <div className="flex items-center justify-between font-medium">
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">
                                {showInactive ? 'Inactive Branches' : 'Active Branches'}
                            </CardTitle>
                            <CardDescription className="text-gray-500">
                                Showing {filteredData.length} records
                            </CardDescription>
                        </div>
                        <div className="flex items-center px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm w-64">
                            <Search className="h-4 w-4 text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Quick search..."
                                className="bg-transparent border-none text-sm outline-none w-full"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/30 border-b border-gray-100/50 hover:bg-transparent">
                                <TableHead className="font-bold text-gray-700 h-14 pl-8">Code</TableHead>
                                <TableHead className="font-bold text-gray-700 h-14">Branch Name</TableHead>
                                <TableHead className="font-bold text-gray-700 h-14 w-32 text-center">Status</TableHead>
                                <TableHead className="font-bold text-gray-700 h-14 pr-8 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-24">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative">
                                                <div className="h-14 w-14 border-4 border-blue-100 rounded-full"></div>
                                                <div className="absolute top-0 h-14 w-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                            <p className="text-gray-500 font-medium animate-pulse">Gathering information...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-24">
                                        <div className="flex flex-col items-center gap-5">
                                            <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center shadow-inner">
                                                <FolderOpen className="h-10 w-10 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-gray-800 text-lg">No Records Found</p>
                                                <p className="text-gray-500 max-w-xs mx-auto text-sm italic">
                                                    {showInactive
                                                        ? "Your archive is currently empty. All departments are active."
                                                        : "Start building your academy by adding the first academic branch."}
                                                </p>
                                            </div>
                                            {!showInactive && (
                                                <Button onClick={openCreateModal} variant="outline" className="rounded-2xl h-11 border-blue-100 text-blue-600 hover:bg-blue-50">
                                                    Create Now
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="group hover:bg-blue-50/40 transition-all border-b border-gray-50 last:border-0 cursor-pointer"
                                        onClick={() => openDetailSheet(item)}
                                    >
                                        <TableCell className="pl-8 py-5">
                                            <Badge className="font-mono text-sm px-4 py-1.5 bg-blue-50 text-blue-600 border-blue-100 rounded-xl shadow-sm hover:bg-blue-100 transition-colors">
                                                {item.branch_code}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold text-gray-800 text-base">{item.branch_name}</TableCell>
                                        <TableCell className="text-center">
                                            {item.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-emerald-100">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-red-100">
                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                                    Inactive
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100">
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="h-10 w-10 text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-2xl"
                                                    onClick={(e) => { e.stopPropagation(); openDetailSheet(item); }}
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="h-10 w-10 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-md rounded-2xl"
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
                </CardContent>
                {/* Pagination Controls */}
                <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing {branchesList.length} of {totalCount} branches
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
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
                            onClick={() => setPage(p => p + 1)}
                            disabled={page * limit >= totalCount}
                            className="h-9 w-9 rounded-xl border-gray-200 hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Create/Edit Dialog - Ultra Curvy */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-[2rem] border-0 shadow-2xl">
                    <DialogHeader className="px-8 pt-8 pb-6 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Building2 size={120} className="text-white rotate-12" />
                        </div>
                        <DialogTitle className="flex items-center gap-3 text-white text-xl font-bold relative z-10">
                            <div className="p-2.5 bg-white/20 rounded-[1rem] backdrop-blur-sm shadow-inner">
                                {editingItem ? <Pencil className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                            </div>
                            {editingItem ? 'Update Department' : 'New Academic Branch'}
                        </DialogTitle>
                        <DialogDescription className="text-white/70 text-sm mt-1 relative z-10">
                            Fill in the details to {editingItem ? 'modify an existing' : 'register a new'} academic unit.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
                        {formError && (
                            <div className="flex items-center gap-3 bg-red-50 text-red-600 text-sm p-4 rounded-2xl border border-red-100 animate-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                {formError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Branch Code</Label>
                            <Input
                                required
                                value={formData.branch_code}
                                onChange={(e) => setFormData({ ...formData, branch_code: e.target.value.toUpperCase() })}
                                placeholder="E.G. MECH"
                                disabled={!!editingItem}
                                className="font-mono uppercase h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all px-4 text-lg font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Full Designation</Label>
                            <Input
                                required
                                value={formData.branch_name}
                                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                placeholder="Mechanical Engineering"
                                className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all px-4 text-gray-800"
                            />
                        </div>

                        <DialogFooter className="pt-4 flex !justify-between gap-4">
                            <Button
                                variant="ghost" type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-2xl h-14 flex-1 font-semibold text-gray-500 hover:bg-gray-100"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 flex-[2] font-semibold shadow-lg shadow-blue-500/30"
                            >
                                {createMutation.isPending || updateMutation.isPending ? 'Processing...' : (editingItem ? 'Save Changes' : 'Confirm & Create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Detail Sheet - Enhanced */}
            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent className="sm:max-w-[500px] p-0 border-0 bg-slate-50/50 backdrop-blur-xl">
                    {detailItem && (
                        <div className="flex flex-col h-full">
                            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 pb-12 relative overflow-hidden">
                                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                                <div className="absolute top-4 left-4 h-24 w-24 bg-blue-400/20 rounded-full blur-2xl"></div>
                                <SheetHeader className="relative z-10">
                                    <div className="p-4 bg-white/10 rounded-[2rem] backdrop-blur-md w-fit shadow-xl border border-white/10 mb-6">
                                        <Building2 size={40} className="text-white" />
                                    </div>
                                    <SheetTitle className="text-white text-3xl font-black tracking-tighter leading-none mb-2">
                                        {detailItem.branch_name}
                                    </SheetTitle>
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-white/20 text-white border-0 font-mono text-base px-4 py-1 rounded-xl">
                                            {detailItem.branch_code}
                                        </Badge>
                                        {detailItem.is_active ? (
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-400 text-emerald-900 px-3 py-1 rounded-full shadow-lg shadow-emerald-500/40">Active</span>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-red-400 text-red-900 px-3 py-1 rounded-full shadow-lg shadow-red-500/40">Inactive</span>
                                        )}
                                    </div>
                                </SheetHeader>
                            </div>

                            <div className="flex-1 -mt-8 bg-white rounded-t-[3rem] p-8 pb-10 space-y-8 shadow-2xl overflow-y-auto">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex items-center gap-5 group transition-all hover:bg-blue-50 hover:scale-[1.02]">
                                        <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10 text-blue-600 transition-transform group-hover:rotate-6">
                                            <Hash size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Identification</p>
                                            <p className="text-xl font-black text-blue-900 font-mono">{detailItem.branch_code}</p>
                                        </div>
                                    </div>
                                    ...
                                    <div className="p-6 bg-purple-50/50 rounded-[2rem] border border-purple-100 flex items-center gap-5 group transition-all hover:bg-purple-50 hover:scale-[1.02]">
                                        <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/10 text-purple-600 transition-transform group-hover:rotate-6">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Academic Unit</p>
                                            <p className="text-xl font-black text-purple-900">{detailItem.branch_name}</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-orange-50/50 rounded-[2rem] border border-orange-100 flex items-center gap-5 group transition-all hover:bg-orange-50 hover:scale-[1.02]">
                                        <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/10 text-orange-600 transition-transform group-hover:rotate-6">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Registration Date</p>
                                            <p className="text-xl font-black text-orange-900">
                                                {new Date(detailItem.created_at).toLocaleDateString('en-US', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <Button
                                        className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all"
                                        onClick={(e) => { setIsDetailOpen(false); openEditModal(detailItem, e); }}
                                    >
                                        <Pencil className="mr-3 h-5 w-5" /> Modify Preferences
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className={`w-full h-16 rounded-2xl border-2 font-bold text-lg active:scale-[0.98] transition-all ${detailItem.is_active
                                            ? 'border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200'
                                            : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                                            }`}
                                        onClick={(e) => { setIsDetailOpen(false); openDeactivateDialog(detailItem, e); }}
                                    >
                                        <Power className="mr-3 h-5 w-5" />
                                        {detailItem.is_active ? 'Suspend Operations' : 'Restore Operations'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Deactivation Dialog - Softer Curves */}
            <Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
                    <div className={`p-8 text-center ${deactivateItem?.is_active ? 'bg-red-50' : 'bg-emerald-50'}`}>
                        <div className={`mx-auto h-20 w-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-lg ${deactivateItem?.is_active ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'
                            }`}>
                            <Power size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 font-mono">
                            {deactivateItem?.is_active ? 'SUSPEND UNIT?' : 'RESTORE UNIT?'}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed px-4">
                            You are about to transition <span className="font-bold text-gray-800">{deactivateItem?.name}</span> to
                            {deactivateItem?.is_active ? ' inactive archive.' : ' active management.'}
                        </p>
                    </div>

                    <div className="p-8 space-y-4 bg-white">
                        <Button
                            className={`w-full h-14 rounded-2xl font-bold text-lg shadow-lg ${deactivateItem?.is_active ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                                }`}
                            onClick={() => toggleStatusMutation.mutate(deactivateItem)}
                            disabled={toggleStatusMutation.isPending}
                        >
                            {toggleStatusMutation.isPending ? 'Processing...' : 'Confirm Action'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeactivateOpen(false)}
                            className="w-full h-14 rounded-2xl font-bold text-gray-400 hover:bg-gray-50"
                        >
                            Nevermind
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Branches;

