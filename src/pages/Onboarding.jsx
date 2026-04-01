import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import Background from '../components/Background';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { X, AlertCircle } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const departments = [
    "Architecture",
    "Civil Engineering",
    "Computer Science & Systems Engineering",
    "Chemical Engineering",
    "Electrical Engineering",
    "Electronics & Communication Engineering",
    "Geo-Engineering",
    "Information Technology & Computer Applications",
    "Instrument Technology",
    "Marine Engineering",
    "Mechanical Engineering",
    "Metallurgical Engineering",
    "Engineering Chemistry",
    "Humanities & Basic Sciences",
    "GENERAL/PRINCIPAL OFFICE DEPARTMENT"
];

const Onboarding = () => {
    const { currentUser, userData, isOnboarded } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        rollNumber: '',
        degree: '',
        year: '',
        department: ''
    });
    const [error, setError] = useState('');

    // Pre-fill form if user is already onboarded (Edit Mode) or from current user
    useEffect(() => {
        if (userData || currentUser) {
            setFormData({
                name: userData?.name || currentUser?.displayName || '',
                rollNumber: userData?.rollNumber || '',
                degree: userData?.degree || '',
                year: userData?.year || '',
                department: userData?.department || ''
            });
        }
    }, [userData, currentUser]);

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');

        if (isOnboarded && formData.name.trim().length < 3) {
            setError("Name must be at least 3 characters.");
            return;
        }

        if (!/^\d{12}$/.test(formData.rollNumber)) {
            setError("Roll Number must contain exactly 12 digits.");
            return;
        }

        if (!formData.degree || !formData.year || !formData.department) {
            setError("Please fill in all the details.");
            return;
        }

        setLoading(true);
        try {
            await setDoc(doc(db, "users", currentUser.email), {
                name: formData.name || currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                rollNumber: formData.rollNumber,
                degree: formData.degree,
                year: formData.year,
                department: formData.department,
                role: 'student',
                updatedAt: new Date().toISOString()
            }, { merge: true });
            navigate('/profile'); // Changed to profile for better feedback after edit
        } catch (err) {
            console.error("Error saving profile:", err);
            setError("Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 relative overflow-hidden">
            <Background />

            <Card className="w-full max-w-xl border-none shadow-2xl bg-white relative z-10 rounded-3xl overflow-visible ring-1 ring-primary/5">
                {/* Close Button */}
                <Link
                    to="/"
                    className="absolute -top-3 -right-3 bg-white border border-border-custom p-2 rounded-full shadow-lg hover:bg-slate-50 transition-all text-body-text hover:text-red-500 z-20 group"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </Link>

                <CardHeader className="text-center pt-10 pb-2">
                    <div className="mx-auto w-12 h-1.5 bg-primary-gradient rounded-full mb-6" />
                    <CardTitle className="text-3xl font-bold text-heading">
                        {isOnboarded ? "Edit Your Profile" : "Complete Your Profile"}
                    </CardTitle>
                    <CardDescription className="text-body-text mt-2 px-6">
                        {isOnboarded
                            ? "Keep your information up to date for consistent reporting."
                            : `Welcome, ${currentUser?.displayName}! Just a few final details to set up your account.`
                        }
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-10 pb-12">
                    <form onSubmit={handleSave} className="space-y-6 mt-6">
                        {/* Name field: Editable during Onboarding, absolutely locked after */}
                        <div className="space-y-1.5 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label htmlFor="name" className="text-slate-700 font-semibold ml-1">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={isOnboarded}
                                className={`h-12 border-slate-200 rounded-lg text-lg font-medium ${isOnboarded ? 'bg-slate-50 text-slate-500 cursor-not-allowed opacity-100 shadow-inner' : 'focus:ring-primary focus:border-primary'}`}
                                placeholder="Enter your full real name"
                            />
                            {!isOnboarded ? (
                                <p className="text-[10.5px] font-bold text-amber-600 ml-1 mt-1 flex items-center gap-1">
                                    <AlertCircle size={10} /> This will be your permanent display name and cannot be changed.
                                </p>
                            ) : (
                                <p className="text-[10px] font-semibold text-slate-400 ml-1 mt-1 flex items-center gap-1">
                                    <AlertCircle size={10} /> Name is securely locked. Contact Admin to fix typos.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2 text-left">
                            <Label htmlFor="rollNumber" className="text-slate-700 font-semibold ml-1">Roll Number</Label>
                            <Input
                                id="rollNumber"
                                placeholder="e.g. 319123456789"
                                value={formData.rollNumber}
                                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                                className="h-12 border-slate-200 focus:ring-primary focus:border-primary rounded-lg text-lg"
                                maxLength={12}
                            />
                            <p className="text-[10px] text-slate-400 ml-1">Must be exactly 12 numerical digits</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 text-left">
                                <Label className="text-slate-700 font-semibold ml-1">Degree</Label>
                                <Select
                                    key={formData.degree}
                                    value={formData.degree}
                                    onValueChange={(val) => setFormData({ ...formData, degree: val })}
                                >
                                    <SelectTrigger className="h-12 border-slate-200 rounded-lg">
                                        <SelectValue placeholder="Select Degree" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" side="bottom">
                                        <SelectItem value="B.Tech">B.Tech</SelectItem>
                                        <SelectItem value="M.Tech">M.Tech</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 text-left">
                                <Label className="text-slate-700 font-semibold ml-1">Year of Study</Label>
                                <Select
                                    key={formData.year}
                                    value={formData.year}
                                    onValueChange={(val) => setFormData({ ...formData, year: val })}
                                >
                                    <SelectTrigger className="h-12 border-slate-200 rounded-lg">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" side="bottom">
                                        <SelectItem value="1st">1st Year</SelectItem>
                                        <SelectItem value="2nd">2nd Year</SelectItem>
                                        <SelectItem value="3rd">3rd Year</SelectItem>
                                        <SelectItem value="4th">4th Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5 text-left">
                            <Label className="text-slate-700 font-semibold ml-1">Branch / Department</Label>
                            <Select
                                key={formData.department}
                                value={formData.department}
                                onValueChange={(val) => setFormData({ ...formData, department: val })}
                                disabled={isOnboarded}
                            >
                                <SelectTrigger className={`h-12 border-slate-200 rounded-lg ${isOnboarded ? 'bg-slate-50 text-slate-500 opacity-100 cursor-not-allowed shadow-inner' : ''}`}>
                                    <SelectValue placeholder="Choose your department" />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" className="max-h-[60vh]">
                                    {departments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!isOnboarded ? (
                                <p className="text-[10.5px] font-bold text-amber-600 ml-1 mt-1 flex items-center gap-1">
                                    <AlertCircle size={10} /> Choose carefully! This cannot be changed in the future.
                                </p>
                            ) : (
                                <p className="text-[10px] font-semibold text-slate-400 ml-1 mt-1 flex items-center gap-1">
                                    <AlertCircle size={10} /> Department is locked securely to your account block scope.
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 mt-4 bg-primary-gradient text-white font-bold text-lg rounded-[6px] shadow-subtle hover:brightness-110 hover:shadow-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading ? "Saving Changes..." : "Save Profile"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Onboarding;
