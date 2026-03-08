import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Background from '../components/Background';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertCircle, MapPin, Info } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AUCE_COORDS = [17.7285, 83.3150]; // AUCE, Visakhapatnam
const campusBounds = [[17.720, 83.315], [17.740, 83.335]];

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

const ReportIssue = () => {
    const { userData } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        department: '',
        manualLocation: '',
        category: ''
    });
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [mapError, setMapError] = useState(false);
    const [error, setError] = useState("");

    const isGeneralOffice = formData.department === "GENERAL/PRINCIPAL OFFICE DEPARTMENT";

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        setMapError(false);

        // Required fields check: Title, Dept, Description, Manual Location
        if (!formData.title.trim() || !formData.department || !formData.description.trim() || !formData.manualLocation.trim()) {
            setError("All fields (Title, Dept, Description, Specific Area) are mandatory. Please fill in all the details.");
            return;
        }

        // Length checks for Title and Specific Area
        if (formData.title.trim().length < 3) {
            setError("Issue Title must be at least 3 characters long.");
            return;
        }

        if (formData.manualLocation.trim().length < 3) {
            setError("Specific Area must be at least 3 characters long.");
            return;
        }

        // Word count check for description
        const wordCount = formData.description.trim().split(/\s+/).filter(word => word.length > 0).length;
        if (wordCount < 5) {
            setError("Description must contain at least five words. Please provide more detail for our team.");
            return;
        }

        // Map location check specifically for General/Principal Office
        if (isGeneralOffice && !selectedLocation) {
            setMapError(true);
            setError("For General/Principal Office issues, selecting a location on the map is compulsory.");
            const mapSection = document.getElementById('map-section');
            mapSection?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        console.log("Form validated and ready for submission:", {
            ...formData,
            location: selectedLocation
        });

        // Final submission logic will go here
        alert("Success! Form state is valid for Week 2.");
    };

    const isAllowedDept = (dept) => {
        return dept === userData?.department || dept === "GENERAL/PRINCIPAL OFFICE DEPARTMENT";
    };

    const sortedDepartments = [
        ...departments.filter(d => isAllowedDept(d)),
        ...departments.filter(d => !isAllowedDept(d))
    ];

    // Map Event Listener Component
    function LocationMarker() {
        useMapEvents({
            click(e) {
                setSelectedLocation(e.latlng);
                setMapError(false);
            },
        });

        return selectedLocation === null ? null : (
            <Marker position={selectedLocation} />
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-app-bg">
            <Background />

            <Card className="w-full max-w-4xl min-h-[80vh] border-none shadow-2xl bg-white/95 backdrop-blur-sm relative z-10 rounded-[2.5rem] flex flex-col my-8">
                <CardHeader className="pt-12 pb-6 px-8 md:px-12">
                    <div className="w-16 h-1.5 bg-primary-gradient rounded-full mb-8" />
                    <CardTitle className="text-3xl font-bold text-[#1E293B] tracking-tight">
                        Report a Campus Issue
                    </CardTitle>
                    <CardDescription className="text-base text-slate-500 mt-3 max-w-2xl">
                        Help us make our campus better. Share the details of the issue you've encountered.
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow px-8 md:px-12 pb-12">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Title and Department */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label htmlFor="title" className="text-lg font-semibold text-slate-700 ml-1">
                                    Issue Title
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Water leakage in C-Block"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="h-12 text-base border-slate-200 focus:ring-primary rounded-xl px-5 bg-slate-50/50 shadow-sm placeholder:text-slate-400/60"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="department" className="text-lg font-semibold text-slate-700 ml-1">
                                    Department
                                </Label>
                                <Select
                                    value={formData.department}
                                    onValueChange={(val) => setFormData({ ...formData, department: val })}
                                >
                                    <SelectTrigger className="h-12 text-sm border-slate-200 rounded-xl px-5 bg-slate-50/50 shadow-sm">
                                        <SelectValue placeholder="Choose Department" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" side="bottom" className="max-h-[300px] rounded-xl shadow-2xl border-slate-100">
                                        {sortedDepartments.map((dept) => {
                                            const allowed = isAllowedDept(dept);
                                            return (
                                                <SelectItem
                                                    key={dept}
                                                    value={dept}
                                                    disabled={!allowed}
                                                    className={`py-3 px-4 ${!allowed ? "opacity-40" : "cursor-pointer hover:bg-slate-50 font-medium"}`}
                                                >
                                                    <div className="flex justify-between w-full items-center">
                                                        <span>{dept}</span>
                                                        {!allowed && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">Restricted</span>}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-primary font-medium ml-1 flex items-center gap-1.5 opacity-80">
                                    <AlertCircle size={12} />
                                    You can only report to your own department or the General Office.
                                </p>
                            </div>
                        </div>

                        {/* Map Section */}
                        <div id="map-section" className="space-y-4 pt-2">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div className="space-y-1">
                                    <Label className="text-lg font-semibold text-slate-700 ml-1 flex items-center gap-2">
                                        <MapPin className="text-primary" size={20} />
                                        Pinpoint Location
                                    </Label>
                                    <p className="text-sm text-slate-500 ml-1">Click on the AUCE map to mark the exact spot.</p>
                                </div>
                                {isGeneralOffice && (
                                    <div className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${selectedLocation ? "bg-green-50 border-green-200 text-green-600" : "bg-primary/5 border-primary/10 text-primary animate-pulse"}`}>
                                        {selectedLocation ? "✓ Location Pinned" : "⚠ Map Selection Required"}
                                    </div>
                                )}
                            </div>

                            <div className={`relative h-[300px] w-full rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-inner ${mapError ? "border-red-400 ring-4 ring-red-50" : "border-slate-100 group-hover:border-primary/20"}`}>
                                <MapContainer
                                    center={AUCE_COORDS}
                                    zoom={16}
                                    minZoom={15}
                                    maxBounds={campusBounds}
                                    maxBoundsViscosity={1.0}
                                    scrollWheelZoom={true}
                                    style={{ height: '100%', width: '100%', zIndex: 1 }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <LocationMarker />
                                </MapContainer>

                                {!selectedLocation && (
                                    <div className="absolute inset-0 pointer-events-none z-[400] flex items-center justify-center">
                                        <div className="bg-white/95 px-6 py-3 rounded-full shadow-2xl border border-white/50 animate-bounce flex items-center gap-2">
                                            <Info size={18} className="text-primary" />
                                            <span className="text-sm font-bold text-heading">Click to place marker</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {mapError && (
                                <p className="text-sm text-red-500 font-semibold ml-1 animate-in slide-in-from-left-2 transition-all">
                                    * Please select a point on the map for General Office reports.
                                </p>
                            )}

                            {selectedLocation && (
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-4 animate-in fade-in duration-500">
                                    <div className="flex flex-col flex-grow">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Coordinates Captured</span>
                                        <span className="text-sm font-mono text-primary font-bold">
                                            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedLocation(null)}
                                        className="text-xs text-red-400 hover:text-red-500 hover:bg-red-50"
                                    >
                                        Clear Marker
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Manual Location and Category */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label htmlFor="manualLocation" className="text-lg font-semibold text-slate-700 ml-1">
                                    Specific Area
                                </Label>
                                <Input
                                    id="manualLocation"
                                    placeholder="e.g., Room 302, Administrative Block, 2nd Floor"
                                    value={formData.manualLocation}
                                    onChange={(e) => setFormData({ ...formData, manualLocation: e.target.value })}
                                    className="h-12 text-base border-slate-200 focus:ring-primary rounded-xl px-5 bg-slate-50/50 shadow-sm placeholder:text-slate-400/60"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="category" className="text-lg font-semibold text-slate-700 ml-1">
                                    Issue Category
                                </Label>
                                <Select disabled value={formData.category}>
                                    <SelectTrigger className="h-12 text-sm border-slate-200 rounded-xl px-5 bg-slate-50/10 shadow-sm cursor-not-allowed opacity-70">
                                        <SelectValue placeholder="AI Categorizing..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['Electrical', 'Civil', 'Internet', 'Sanitation', 'Academic'].map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-slate-400 font-medium ml-1 flex items-center gap-1.5 italic">
                                    <Info size={12} className="text-primary/60" />
                                    AI will automatically categorize your issue based on the description.
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <Label htmlFor="description" className="text-lg font-semibold text-slate-700 ml-1">
                                Detailed Description
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Provide as much detail as possible. Where is it? When did you notice it? How severe is it?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="min-h-[160px] text-base border-slate-200 focus:ring-primary rounded-xl px-5 py-4 bg-slate-50/50 leading-relaxed resize-none shadow-sm placeholder:text-slate-400/60"
                            />
                        </div>

                        <div className="pt-8 mb-4 border-t border-slate-50 relative">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 mb-6 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                    {error}
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full md:w-auto px-12 h-14 bg-primary-gradient text-white text-lg font-bold rounded-2xl shadow-xl hover:brightness-110 transition-all duration-300 active:scale-[0.98] shadow-primary/20"
                            >
                                Submit Report
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportIssue;
