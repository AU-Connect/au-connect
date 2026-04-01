import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, or, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import ComplaintCard from '../components/ComplaintCard';
import Background from '../components/Background';
import StatusStepper from '../components/StatusStepper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, CheckCircle, Search, ListFilter, Filter, ArrowUpDown } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Feed = () => {
    const { currentUser, userData } = useAuth();
    const [issues, setIssues] = useState([]);
    const [activeFilter, setActiveFilter] = useState('My Department');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('latest');

    useEffect(() => {
        // Wait until user data is fully loaded
        if (!currentUser || !userData?.department) return;

        // Build the specific query logic for the feed
        // Included General Department to ensure those issues are fetched for the new filter tab
        const q = query(
            collection(db, "issues"),
            or(
                where("userId", "==", currentUser.uid),
                where("department", "==", userData.department),
                where("department", "==", "GENERAL/PRINCIPAL OFFICE DEPARTMENT")
            ),
            orderBy("timestamp", "desc")
        );

        // Fetch using a realtime listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setIssues(fetchedList);
            setLoading(false);
            setError("");
        }, (err) => {
            console.error("Firebase fetch error:", err);
            setError(err.message);
            setLoading(false);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, [currentUser, userData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                    <h3 className="font-bold">Error loading feed</h3>
                    <p className="text-sm mt-1">{error}</p>
                    {error.includes("index") && (
                        <p className="text-sm font-semibold mt-2 underline">
                            This requires creating a new Firestore Database Index. Check the browser console log for the exact Firebase link!
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const filteredIssues = issues.filter(issue => {
        const matchesSearch = (issue.title && issue.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
                              (issue.id && issue.id.toLowerCase().includes(searchQuery.toLowerCase()));
        
        if (!matchesSearch) return false;
        
        const issueStatus = issue.status || 'Reported';
        if (statusFilter !== 'All' && issueStatus !== statusFilter) return false;

        if (activeFilter === 'My Department') return issue.department === userData?.department;
        if (activeFilter === 'General Department') return issue.department === 'GENERAL/PRINCIPAL OFFICE DEPARTMENT';
        if (activeFilter === 'My Reported Issues') return issue.userId === currentUser.uid;
        return true;
    }).sort((a, b) => {
        if (sortBy === 'latest') return b.timestamp?.seconds - a.timestamp?.seconds;
        if (sortBy === 'oldest') return a.timestamp?.seconds - b.timestamp?.seconds;
        if (sortBy === 'upvotes') return (b.upvotes || 0) - (a.upvotes || 0);
        return 0;
    });

    return (
        <div className="min-h-[calc(100vh-64px)] w-full flex flex-col p-4 md:p-8 relative overflow-hidden bg-app-bg">
            <Background />

            <div className="max-w-7xl mx-auto w-full relative z-10">
                <div className="mb-8 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="inline-block shrink-0">
                        <h1 className="text-3xl md:text-4xl font-black text-[#1E293B] tracking-tight">
                            Campus <span className="text-transparent bg-clip-text bg-primary-gradient">Feed</span>
                        </h1>
                        <div className="h-1 w-1/3 bg-primary-gradient rounded-full mt-2"></div>
                    </div>

                    {/* Category Tabs moved beside the title for space efficiency */}
                    <div className="flex flex-wrap items-center gap-3">
                        {['My Department', 'General Department', 'My Reported Issues'].map((filterTab) => (
                            <button
                                key={filterTab}
                                onClick={() => {
                                    setActiveFilter(filterTab);
                                    setSearchQuery('');
                                    setStatusFilter('All');
                                    setSortBy('latest');
                                }}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeFilter === filterTab
                                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300'
                                    }`}
                            >
                                {filterTab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search, Status, and Sort Integrated Toolbar */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                    {/* Search Bar */}
                    <div className="relative group w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search ticket ID or title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full transition-all shadow-sm"
                        />
                    </div>

                    {/* Filters & Sort */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                        {/* Status Filter */}
                        <div className="flex items-center bg-white pr-2 pl-1 py-1 rounded-full border border-slate-200 shrink-0 shadow-sm transition-all hover:border-slate-300">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[160px] h-9 text-xs font-bold border-none bg-transparent focus:ring-0 shadow-none px-2">
                                    <div className="flex items-center gap-2 w-full truncate">
                                        <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg shrink-0">
                                            <Filter size={14} />
                                        </div>
                                        <div className="flex flex-col items-start gap-0 flex-grow text-left mt-0.5 truncate overflow-hidden">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Filter</span>
                                            <SelectValue placeholder="All" className="truncate" />
                                        </div>
                                    </div>
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={5} className="rounded-xl border-slate-200 shadow-xl min-w-[160px]">
                                    <SelectItem value="All" className="text-xs font-bold py-2 focus:bg-primary/5">All Statuses</SelectItem>
                                    <SelectItem value="Reported" className="text-xs font-bold py-2 focus:bg-primary/5">Reported</SelectItem>
                                    <SelectItem value="Viewed" className="text-xs font-bold py-2 focus:bg-primary/5">Viewed</SelectItem>
                                    <SelectItem value="InProgress" className="text-xs font-bold py-2 focus:bg-primary/5">In Progress</SelectItem>
                                    <SelectItem value="OnHold" className="text-xs font-bold py-2 focus:bg-primary/5">On Hold</SelectItem>
                                    <SelectItem value="Resolved" className="text-xs font-bold py-2 focus:bg-primary/5">Resolved</SelectItem>
                                    <SelectItem value="Rejected" className="text-xs font-bold py-2 focus:bg-primary/5">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sort Toggle */}
                        <div className="flex items-center bg-white pr-2 pl-1 py-1 rounded-full border border-slate-200 shrink-0 shadow-sm transition-all hover:border-slate-300">
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[160px] h-9 text-xs font-bold border-none bg-transparent focus:ring-0 shadow-none px-2">
                                    <div className="flex items-center gap-2 w-full truncate">
                                        <div className="p-1.5 bg-purple-50 text-purple-500 rounded-lg shrink-0">
                                            <ArrowUpDown size={14} />
                                        </div>
                                        <div className="flex flex-col items-start gap-0 flex-grow text-left mt-0.5 truncate overflow-hidden">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Sort By</span>
                                            <SelectValue placeholder="Sort" className="truncate" />
                                        </div>
                                    </div>
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={5} className="rounded-xl border-slate-200 shadow-xl min-w-[160px]">
                                    <SelectItem value="latest" className="text-xs font-bold py-2 focus:bg-primary/5">Latest First</SelectItem>
                                    <SelectItem value="oldest" className="text-xs font-bold py-2 focus:bg-primary/5">Oldest First</SelectItem>
                                    <SelectItem value="upvotes" className="text-xs font-bold py-2 focus:bg-primary/5">Most Upvoted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Complaint Cards Grid */}
                {filteredIssues.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center shadow-sm">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📭</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">No Issues Found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">There are no reports matching this filter right now. You're all caught up!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredIssues.map((issue, index) => (
                            <ComplaintCard
                                key={issue.id}
                                issue={issue}
                                index={index}
                                onClick={() => setSelectedIssue(issue)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <Dialog open={!!selectedIssue} onOpenChange={(open) => { if (!open) setSelectedIssue(null); }}>
                <DialogContent className="max-w-[90vw] lg:max-w-6xl w-full max-h-[85vh] my-auto mt-6 p-0 overflow-hidden bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl">
                    <DialogTitle className="sr-only">Issue Details</DialogTitle>
                    <div className="grid grid-cols-1 md:grid-cols-5">
                        {/* Left Side: Full Image */}
                        <div className="h-64 md:h-full min-h-[400px] relative bg-slate-900 hidden md:flex items-center justify-center overflow-hidden md:col-span-2">
                            {/* Blurred Background Layer */}
                            <div
                                className="absolute inset-0 bg-cover bg-center opacity-50 blur-xl scale-110"
                                style={{ backgroundImage: `url(${selectedIssue?.imageUrl})` }}
                            ></div>
                            {/* Main Uncropped Image */}
                            <img
                                src={selectedIssue?.imageUrl}
                                alt={selectedIssue?.title}
                                className="w-full h-full object-contain relative z-10 p-4"
                            />
                        </div>

                        {/* Right Side: Details & Timeline */}
                        <div className="p-6 md:p-8 flex flex-col max-h-[85vh] md:max-h-[85vh] overflow-y-auto w-full md:col-span-3">
                            <DialogHeader>
                                {/* Show image on mobile only since left column hides */}
                                <div className="h-48 w-full rounded-xl overflow-hidden mb-4 md:hidden relative bg-slate-900 flex items-center justify-center">
                                    <div
                                        className="absolute inset-0 bg-cover bg-center opacity-50 blur-xl scale-110"
                                        style={{ backgroundImage: `url(${selectedIssue?.imageUrl})` }}
                                    ></div>
                                    <img
                                        src={selectedIssue?.imageUrl}
                                        alt={selectedIssue?.title}
                                        className="w-full h-full object-contain relative z-10 p-2"
                                    />
                                </div>
                                <DialogTitle className="text-2xl font-bold text-slate-800 leading-tight">
                                    {selectedIssue?.title}
                                </DialogTitle>
                                <DialogDescription className="flex flex-wrap items-center gap-2 mt-3">
                                    <span className="px-3 py-1 bg-primary/10 text-primary font-extrabold rounded-full border border-primary/20 text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        {selectedIssue?.category || 'Uncategorized'}
                                    </span>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold rounded-full border border-slate-200 text-xs uppercase tracking-wider shadow-sm">
                                        {selectedIssue?.department}
                                    </span>
                                </DialogDescription>
                            </DialogHeader>

                            {/* Reporter Profile Details */}
                            {selectedIssue?.reporter && (
                                <div className="mt-6">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reported By</h4>
                                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.05)] flex items-start gap-3 transition-all hover:shadow-[0_4px_20px_rgb(0,0,0,0.09)]">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0 ring-4 ring-primary/5">
                                            {selectedIssue.reporter.name?.charAt(0) || 'S'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">
                                                {selectedIssue.reporter.name}
                                                <span className="font-normal text-slate-500 ml-2">({selectedIssue.reporter.rollNumber})</span>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                                                <span><span className="font-medium text-slate-600">Degree:</span> {selectedIssue.reporter.degree}</span>
                                                <span className="text-slate-300">•</span>
                                                <span><span className="font-medium text-slate-600">Year:</span> {selectedIssue.reporter.admissionYear}</span>

                                                {selectedIssue.department === 'GENERAL/PRINCIPAL OFFICE DEPARTMENT' && (
                                                    <>
                                                        <span className="text-slate-300">•</span>
                                                        <span><span className="font-medium text-slate-600">Dept:</span> {selectedIssue.reporter.department}</span>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Issue Description</h4>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {selectedIssue?.description}
                                </p>
                            </div>

                            {/* Location Section */}
                            <div className="mt-8 border-t border-slate-100 pt-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <MapPin size={14} /> Recorded Location
                                </h4>
                                <p className="text-sm font-medium text-slate-700 mb-3">
                                    {selectedIssue?.location?.manualAddress || selectedIssue?.department}
                                </p>
                                {(selectedIssue?.location?.coordinates || selectedIssue?.coordinates) && (
                                    <div className="space-y-2">
                                        <div className="h-40 md:h-56 w-full rounded-xl overflow-hidden border border-slate-200 z-0 relative shadow-inner">
                                            <MapContainer
                                                key={selectedIssue.id}
                                                center={[
                                                    selectedIssue?.location?.coordinates?.lat || selectedIssue?.coordinates?.lat, 
                                                    selectedIssue?.location?.coordinates?.lng || selectedIssue?.coordinates?.lng
                                                ]}
                                                zoom={16}
                                                style={{ height: "100%", width: "100%", zIndex: 0 }}
                                            >
                                                <TileLayer
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                />
                                                <Marker position={[
                                                    selectedIssue?.location?.coordinates?.lat || selectedIssue?.coordinates?.lat, 
                                                    selectedIssue?.location?.coordinates?.lng || selectedIssue?.coordinates?.lng
                                                ]} />
                                            </MapContainer>
                                        </div>
                                        {/* Coordinates Display Block */}
                                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 flex-wrap gap-2 text-xs text-slate-500 font-medium">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold uppercase tracking-wider text-[12px] text-slate-600">Coordinates:</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Lat:</span> 
                                                    <span className="text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                                                        {(selectedIssue?.location?.coordinates?.lat || selectedIssue?.coordinates?.lat).toFixed(6)}°
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Lng:</span> 
                                                    <span className="text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                                                        {(selectedIssue?.location?.coordinates?.lng || selectedIssue?.coordinates?.lng).toFixed(6)}°
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 border-t border-slate-100 pt-6 flex-grow">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Tracking Timeline</h4>
                                <StatusStepper issue={selectedIssue} />
                            </div>

                            {/* Documented Proof Section */}
                            {selectedIssue?.afterImageUrl && (
                                <div className="mt-8 border-t border-slate-100 pt-6">
                                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">
                                        <CheckCircle size={14} className="text-emerald-500" /> Documented Proof
                                    </h4>
                                    <div className="h-56 md:h-72 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative shadow-inner flex items-center justify-center">
                                        <div
                                            className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-125 transition-all"
                                            style={{ backgroundImage: `url(${selectedIssue.afterImageUrl})` }}
                                        ></div>
                                        <img 
                                            src={selectedIssue.afterImageUrl} 
                                            alt="Proof Output" 
                                            className="w-full h-full object-contain relative z-10 p-2"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Feed;
