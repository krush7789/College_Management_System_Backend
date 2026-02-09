import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/components/ui/use-toast';
import {
    User, Mail, Phone, Calendar, MapPin, Briefcase, Lock, Eye, EyeOff,
    Edit3, Save, X, Building, GraduationCap, Hash, Shield, Camera, Loader2
} from 'lucide-react';
import { common } from '@/services/api';

const Profile = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [editData, setEditData] = useState({});
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPassword, setShowPassword] = useState({
        old: false,
        new: false,
        confirm: false
    });
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef(null);

    // Fetch current user data
    const { data: userData, isLoading } = useQuery({
        queryKey: ['user-profile'],
        queryFn: async () => {
            const response = await api.get('/auth/me');
            return response.data;
        }
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (data) => {
            return await api.put(`/users/${userData.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['user-profile']);
            setIsEditing(false);
            toast({
                title: "Profile Updated",
                description: "Your profile has been updated successfully.",
            });
        },
        onError: (err) => {
            toast({
                title: "Error",
                description: err.response?.data?.detail || 'Failed to update profile',
                variant: "destructive"
            });
        }
    });

    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: async (data) => {
            return await api.post('/auth/change-password', data);
        },
        onSuccess: () => {
            setIsChangePasswordOpen(false);
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
            setError('');
            toast({
                title: "Password Changed",
                description: "Your password has been changed successfully.",
            });
        },
        onError: (err) => {
            setError(err.response?.data?.detail || 'Failed to change password');
        }
    });

    const startEditing = () => {
        setEditData({
            first_name: userData?.first_name || '',
            last_name: userData?.last_name || '',
            phone_number: userData?.phone_number || '',
            date_of_birth: userData?.date_of_birth || '',
            gender: userData?.gender || '',
            // Address fields
            street: userData?.address?.street || '',
            city: userData?.address?.city || '',
            state: userData?.address?.state || '',
            zip_code: userData?.address?.zip_code || '',
            country: userData?.address?.country || '',
            // Teacher-specific
            designation: userData?.designation || '',
            department: userData?.department || '',
        });
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditData({});
    };

    const handleSaveProfile = () => {
        const updateData = {};

        // Common editable fields for all roles
        if (editData.first_name && editData.first_name !== userData?.first_name) {
            updateData.first_name = editData.first_name;
        }
        if (editData.last_name && editData.last_name !== userData?.last_name) {
            updateData.last_name = editData.last_name;
        }
        if (editData.phone_number !== (userData?.phone_number || '')) {
            updateData.phone_number = editData.phone_number || null;
        }
        if (editData.date_of_birth !== (userData?.date_of_birth || '')) {
            updateData.date_of_birth = editData.date_of_birth || null;
        }
        if (editData.gender !== (userData?.gender || '')) {
            updateData.gender = editData.gender || null;
        }

        // Address - build object if any field changed
        const currentAddress = userData?.address || {};
        const newAddress = {
            street: editData.street || null,
            city: editData.city || null,
            state: editData.state || null,
            zip_code: editData.zip_code || null,
            country: editData.country || null,
        };

        const addressChanged =
            editData.street !== (currentAddress.street || '') ||
            editData.city !== (currentAddress.city || '') ||
            editData.state !== (currentAddress.state || '') ||
            editData.zip_code !== (currentAddress.zip_code || '') ||
            editData.country !== (currentAddress.country || '');

        if (addressChanged) {
            updateData.address = newAddress;
        }

        // Teacher-specific fields
        if (userData?.role === 'teacher') {
            if (editData.designation !== (userData?.designation || '')) {
                updateData.designation = editData.designation || null;
            }
            if (editData.department !== (userData?.department || '')) {
                updateData.department = editData.department || null;
            }
        }

        if (Object.keys(updateData).length === 0) {
            toast({
                title: "No Changes",
                description: "No changes were made to save.",
            });
            setIsEditing(false);
            return;
        }

        updateProfileMutation.mutate(updateData);
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        setError('');

        if (passwordData.new_password !== passwordData.confirm_password) {
            setError('New passwords do not match');
            return;
        }

        if (passwordData.new_password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        changePasswordMutation.mutate({
            old_password: passwordData.old_password,
            new_password: passwordData.new_password,
            confirm_password: passwordData.confirm_password
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid file",
                description: "Please upload an image file.",
                variant: "destructive"
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
                title: "File too large",
                description: "Image size should be less than 5MB.",
                variant: "destructive"
            });
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await common.uploadImage(file);
            const imageUrl = response.data.url;

            // Update user profile in DB
            await updateProfileMutation.mutateAsync({ profile_picture_url: imageUrl });

            toast({
                title: "Success",
                description: "Profile picture updated successfully.",
            });
        } catch (error) {
            console.error("Upload error:", error);
            toast({
                title: "Upload Failed",
                description: error.response?.data?.detail || "Failed to upload image. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-500';
            case 'teacher': return 'bg-emerald-500';
            case 'student': return 'bg-blue-500';
            default: return 'bg-slate-500';
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <Shield className="h-5 w-5" />;
            case 'teacher': return <Briefcase className="h-5 w-5" />;
            case 'student': return <GraduationCap className="h-5 w-5" />;
            default: return <User className="h-5 w-5" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const InfoCard = ({ icon: Icon, label, value, iconBg = "bg-blue-100", iconColor = "text-blue-600" }) => (
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
            <div className={`h-12 w-12 ${iconBg} rounded-xl flex items-center justify-center`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="font-semibold text-slate-800">{value || '—'}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 md:p-8 shadow-xl">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="relative group">
                                <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/40 overflow-hidden">
                                    {userData?.profile_picture_url ? (
                                        <img
                                            src={userData.profile_picture_url}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-10 w-10 md:h-12 md:w-12 text-white" />
                                    )}

                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="absolute bottom-0 right-0 h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                                    title="Change Profile Picture"
                                >
                                    <Camera className="h-4 w-4 text-slate-600" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                    {userData?.first_name} {userData?.last_name}
                                </h1>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getRoleBadgeColor(userData?.role)} text-white text-sm font-medium`}>
                                    {getRoleIcon(userData?.role)}
                                    <span className="capitalize">{userData?.role}</span>
                                </div>
                            </div>
                        </div>
                        {!isEditing && (
                            <Button
                                onClick={startEditing}
                                className="bg-white/20 hover:bg-white/30 text-white rounded-xl h-12 px-6 font-semibold backdrop-blur-sm border border-white/30"
                            >
                                <Edit3 className="h-5 w-5 mr-2" />
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    /* ===================== EDIT MODE ===================== */
                    <Card className="rounded-3xl shadow-lg border-0">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-slate-800">Edit Profile</CardTitle>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={cancelEditing}
                                        variant="outline"
                                        className="rounded-xl"
                                        disabled={updateProfileMutation.isPending}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveProfile}
                                        className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                                        disabled={updateProfileMutation.isPending}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-600">First Name *</Label>
                                        <Input
                                            value={editData.first_name}
                                            onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                                            className="h-12 rounded-xl"
                                            placeholder="Enter first name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-600">Last Name *</Label>
                                        <Input
                                            value={editData.last_name}
                                            onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                                            className="h-12 rounded-xl"
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-600">Phone Number</Label>
                                        <Input
                                            value={editData.phone_number}
                                            onChange={(e) => {
                                                // Only allow numbers and + symbol
                                                const value = e.target.value.replace(/[^0-9+\s-]/g, '');
                                                setEditData({ ...editData, phone_number: value });
                                            }}
                                            placeholder="+91 XXXXX XXXXX"
                                            className="h-12 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-600">Date of Birth</Label>
                                        <Input
                                            type="date"
                                            value={editData.date_of_birth}
                                            onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                                            className="h-12 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-600">Gender</Label>
                                        <Select
                                            value={editData.gender}
                                            onValueChange={(value) => setEditData({ ...editData, gender: value })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Read-only Email */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-400">Email (cannot be changed)</Label>
                                        <Input
                                            value={userData?.email || ''}
                                            disabled
                                            className="h-12 rounded-xl bg-slate-100 text-slate-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address Section */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-sm font-medium text-slate-600">Street Address</Label>
                                        <Input
                                            value={editData.street}
                                            onChange={(e) => setEditData({ ...editData, street: e.target.value })}
                                            className="h-12 rounded-xl"
                                            placeholder="123 Main Street"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-600">City</Label>
                                        <Input
                                            value={editData.city}
                                            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                                            className="h-12 rounded-xl"
                                            placeholder="Hyderabad"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-600">State</Label>
                                        <Input
                                            value={editData.state}
                                            onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                                            className="h-12 rounded-xl"
                                            placeholder="Telangana"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-600">ZIP Code</Label>
                                        <Input
                                            value={editData.zip_code}
                                            onChange={(e) => setEditData({ ...editData, zip_code: e.target.value })}
                                            className="h-12 rounded-xl"
                                            placeholder="500081"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-600">Country</Label>
                                        <Input
                                            value={editData.country}
                                            onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                                            className="h-12 rounded-xl"
                                            placeholder="India"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Teacher-specific fields */}
                            {userData?.role === 'teacher' && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Professional Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-slate-600">Designation</Label>
                                            <Input
                                                value={editData.designation}
                                                onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
                                                placeholder="e.g., Assistant Professor"
                                                className="h-12 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-slate-600">Department</Label>
                                            <Input
                                                value={editData.department}
                                                onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                                                placeholder="e.g., Computer Science"
                                                className="h-12 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Student read-only section */}
                            {userData?.role === 'student' && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Academic Information (Read Only)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-slate-400">Roll Number</Label>
                                            <Input value={userData.roll_no || ''} disabled className="h-12 rounded-xl bg-slate-100 text-slate-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-slate-400">Branch</Label>
                                            <Input value={userData.branch?.name || ''} disabled className="h-12 rounded-xl bg-slate-100 text-slate-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-slate-400">Section</Label>
                                            <Input value={userData.section?.name || ''} disabled className="h-12 rounded-xl bg-slate-100 text-slate-500" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    /* ===================== VIEW MODE ===================== */
                    <>
                        {/* Contact Information */}
                        <Card className="rounded-3xl shadow-lg border-0">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-800">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoCard icon={Mail} label="Email" value={userData?.email} />
                                    <InfoCard icon={Phone} label="Phone" value={userData?.phone_number} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Personal Information */}
                        <Card className="rounded-3xl shadow-lg border-0">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-800">Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoCard
                                        icon={Calendar}
                                        label="Date of Birth"
                                        value={userData?.date_of_birth ? new Date(userData.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null}
                                    />
                                    <InfoCard
                                        icon={User}
                                        label="Gender"
                                        value={userData?.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : null}
                                    />
                                    {userData?.address && (userData?.address?.city || userData?.address?.state) && (
                                        <div className="md:col-span-2">
                                            <InfoCard
                                                icon={MapPin}
                                                label="Address"
                                                value={[
                                                    userData?.address?.street,
                                                    userData?.address?.city,
                                                    userData?.address?.state,
                                                    userData?.address?.zip_code,
                                                    userData?.address?.country
                                                ].filter(Boolean).join(', ')}
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Role-specific Information */}
                        {userData?.role === 'student' && (
                            <Card className="rounded-3xl shadow-lg border-0">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold text-slate-800">Academic Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <InfoCard icon={Hash} label="Roll Number" value={userData?.roll_no} iconBg="bg-indigo-100" iconColor="text-indigo-600" />
                                        <InfoCard icon={Building} label="Branch" value={userData?.branch?.name} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
                                        <InfoCard icon={GraduationCap} label="Section" value={userData?.section?.name} iconBg="bg-purple-100" iconColor="text-purple-600" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {userData?.role === 'teacher' && (userData?.designation || userData?.department) && (
                            <Card className="rounded-3xl shadow-lg border-0">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold text-slate-800">Professional Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InfoCard icon={Briefcase} label="Designation" value={userData?.designation} iconBg="bg-amber-100" iconColor="text-amber-600" />
                                        <InfoCard icon={Building} label="Department" value={userData?.department} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {/* Security Section */}
                <Card className="rounded-3xl shadow-lg border-0">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-800">Security</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => setIsChangePasswordOpen(true)}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-6 font-semibold shadow-lg shadow-slate-900/20"
                        >
                            <Lock className="h-5 w-5 mr-2" />
                            Change Password
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Change Password Dialog */}
            <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader className="pb-4">
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <Lock className="h-6 w-6 text-blue-600" />
                            Change Password
                        </DialogTitle>
                        <DialogDescription>
                            Enter your current password and choose a new one (min 8 characters).
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="old_password">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="old_password"
                                    type={showPassword.old ? "text" : "password"}
                                    value={passwordData.old_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                    required
                                    className="pr-10 h-12 rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new_password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new_password"
                                    type={showPassword.new ? "text" : "password"}
                                    value={passwordData.new_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                    required
                                    minLength={8}
                                    className="pr-10 h-12 rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirm_password"
                                    type={showPassword.confirm ? "text" : "password"}
                                    value={passwordData.confirm_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                    required
                                    minLength={8}
                                    className="pr-10 h-12 rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsChangePasswordOpen(false)}
                                className="flex-1 h-12 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={changePasswordMutation.isPending}
                                className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700"
                            >
                                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Profile;
