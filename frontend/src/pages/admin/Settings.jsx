import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Settings,
    Bell,
    Lock,
    Globe,
    Palette,
    Mail,
    Save,
    Shield,
    AlertTriangle
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useState } from 'react';
import { settings } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";

const AdminSettings = () => {
    const [maintenanceOpen, setMaintenanceOpen] = useState(false);
    const [maintenanceData, setMaintenanceData] = useState({ message: '', start_time: '', end_time: '' });
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSendAlert = async () => {
        setIsLoading(true);
        try {
            await settings.sendMaintenanceAlert(maintenanceData);
            toast({ title: "Alert Sent", description: "Maintenance notification sent to all users." });
            setMaintenanceOpen(false);
            setMaintenanceData({ message: '', start_time: '', end_time: '' });
        } catch (error) {
            toast({ title: "Failed", description: "Could not send alert.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
                <p className="text-slate-500 mt-2 font-medium">Manage platform preferences and system configurations.</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[500px] bg-white p-1 rounded-2xl border border-slate-200">
                    <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 font-bold">General</TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-xl data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 font-bold">Notifications</TabsTrigger>
                    <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 font-bold">Security</TabsTrigger>
                    <TabsTrigger value="appearance" className="rounded-xl data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 font-bold">Appearance</TabsTrigger>
                </TabsList>

                <div className="mt-8 space-y-6">
                    {/* General Settings */}
                    <TabsContent value="general" className="space-y-6">
                        <Card className="border-0 shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
                            <CardHeader className="p-8 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 rounded-2xl">
                                        <Globe className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-900">Platform Details</CardTitle>
                                        <CardDescription className="font-medium text-slate-400">Basic information about the academy instance</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Academy Name</Label>
                                        <Input defaultValue="Future Academy" className="h-12 rounded-xl border-slate-200 font-medium" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Support Email</Label>
                                        <Input defaultValue="support@academy.edu" className="h-12 rounded-xl border-slate-200 font-medium" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Contact Phone</Label>
                                        <Input defaultValue="+1 (555) 000-0000" className="h-12 rounded-xl border-slate-200 font-medium" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Website URL</Label>
                                        <Input defaultValue="https://academy.edu" className="h-12 rounded-xl border-slate-200 font-medium" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Settings */}
                    <TabsContent value="notifications" className="space-y-6">
                        <Card className="border-0 shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
                            <CardHeader className="p-8 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-50 rounded-2xl">
                                        <Bell className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-900">Email Notifications</CardTitle>
                                        <CardDescription className="font-medium text-slate-400">Control when emails are sent to users</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-4">
                                    {/* Dummy Notification Switches for now */}
                                    {[
                                        { title: "New Student Registration", desc: "Notify admins when a new student registers" },
                                        { title: "Exam Schedule Changes", desc: "Notify students/teachers of schedule updates" },
                                        { title: "Report Card Published", desc: "Notify students when results are live" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                                            <div>
                                                <p className="font-bold text-slate-700">{item.title}</p>
                                                <p className="text-xs font-medium text-slate-400">{item.desc}</p>
                                            </div>
                                            <Switch defaultChecked={true} />
                                        </div>
                                    ))}

                                    {/* Maintenance Alert - Functional */}
                                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                                        <div>
                                            <p className="font-bold text-red-900">System Maintenance Alert</p>
                                            <p className="text-xs font-medium text-red-600">Broadcast maintenance notification to all users</p>
                                        </div>
                                        <Button
                                            onClick={() => setMaintenanceOpen(true)}
                                            variant="destructive"
                                            className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 shadow-sm"
                                        >
                                            Send Alert
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Settings */}
                    <TabsContent value="security" className="space-y-6">
                        <Card className="border-0 shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
                            <CardHeader className="p-8 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-50 rounded-2xl">
                                        <Shield className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-900">Security Policies</CardTitle>
                                        <CardDescription className="font-medium text-slate-400">Manage access and authentication rules</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid gap-6">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                        <div>
                                            <p className="font-bold text-slate-700">Two-Factor Authentication (2FA)</p>
                                            <p className="text-xs font-medium text-slate-400">Enforce 2FA for all admin accounts</p>
                                        </div>
                                        <Switch />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Session Timeout (Minutes)</Label>
                                        <Input defaultValue="30" type="number" className="h-12 rounded-xl border-slate-200 font-medium max-w-[200px]" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Minimum Password Length</Label>
                                        <Input defaultValue="8" type="number" className="h-12 rounded-xl border-slate-200 font-medium max-w-[200px]" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Appearance Settings */}
                    <TabsContent value="appearance" className="space-y-6">
                        <Card className="border-0 shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
                            <CardHeader className="p-8 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-50 rounded-2xl">
                                        <Palette className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-900">Theme & UI</CardTitle>
                                        <CardDescription className="font-medium text-slate-400">Customize the portal interface</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    {['Light', 'Dark', 'System'].map((theme) => (
                                        <button key={theme} className={`h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-bold transition-all ${theme === 'Light' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-100 hover:border-slate-300 text-slate-500'}`}>
                                            <div className={`w-8 h-8 rounded-full ${theme === 'Light' ? 'bg-white shadow-sm' : 'bg-slate-200'}`}></div>
                                            {theme}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div>
                                        <p className="font-bold text-slate-700">Reduced Motion</p>
                                        <p className="text-xs font-medium text-slate-400">Minimize animations for accessibility</p>
                                    </div>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" className="h-12 px-8 rounded-xl font-bold text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700">Cancel</Button>
                <Button className="h-12 px-8 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                </Button>
            </div>
            {/* Maintenance Alert Dialog */}
            <Dialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Send Maintenance Alert
                        </DialogTitle>
                        <DialogDescription>
                            This will send an email to ALL users. Use with caution.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Maintenance Message</Label>
                            <Input
                                placeholder="Service will be down for upgrades..."
                                value={maintenanceData.message}
                                onChange={(e) => setMaintenanceData({ ...maintenanceData, message: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={maintenanceData.start_time}
                                    onChange={(e) => setMaintenanceData({ ...maintenanceData, start_time: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={maintenanceData.end_time}
                                    onChange={(e) => setMaintenanceData({ ...maintenanceData, end_time: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMaintenanceOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleSendAlert}
                            disabled={isLoading || !maintenanceData.message}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isLoading ? "Sending..." : "Broadcast Alert"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminSettings;
