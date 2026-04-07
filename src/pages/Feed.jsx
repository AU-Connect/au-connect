import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, or, where, orderBy, onSnapshot, doc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import ComplaintCard from '../components/ComplaintCard';
import Background from '../components/Background';
import StatusStepper from '../components/StatusStepper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, CheckCircle, Search, ListFilter, Filter, ArrowUpDown, ThumbsUp, Clock, Star, Loader2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Feed = () => {
    const { currentUser, userData, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [hoverRating, setHoverRating] = useState(0);
    const [localRating, setLocalRating] = useState(0);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackSuccess, setFeedbackSuccess] = useState(false);
    const [feedbackType, setFeedbackType] = useState('resolved'); // 'resolved' or 'reopened'
    const [issues, setIssues] = useState([]);
    const [activeFilter, setActiveFilter] = useState('My Department');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('latest');
    const [viewMode, setViewMode] = useState('current'); // 'current' or 'original'

    const handleFeedbackSubmit = async (type) => {
        if (!selectedIssue) return;
        setIsSubmittingFeedback(true);
        const shouldReopen = type === 'reopened';
        
        try {
            const issueRef = doc(db, "issues", selectedIssue.id);
            
            // Step 2 Logic: Capture History Snapshot on Re-open
            if (shouldReopen) {
                const historyEntry = {
                    status: selectedIssue.status,
                    adminRemarks: selectedIssue.adminRemarks || "No remarks provided",
                    resolvedAt: selectedIssue.resolvedAt || new Date().toISOString(),
                    afterImageUrl: selectedIssue.afterImageUrl || null,
                    studentRating: localRating,
                    studentFeedback: feedbackText,
                    timelineSnapshot: selectedIssue.timeline || []
                };

                await setDoc(issueRef, {
                    oldTimeline: arrayUnion(historyEntry),
                    // Reset fields for the NEW cycle
                    status: 'Reported',
                    adminRemarks: "", // Clear for new admin entry
                    afterImageUrl: null, // Clear for new proof entry
                    reopenedByStudent: true,
                    studentRating: localRating, // Latest rating
                    studentFeedbackText: feedbackText, // Latest feedback
                    timeline: [...(selectedIssue.timeline || []), {
                        status: 'Reported',
                        message: `Student Remarks: ${feedbackText || 'No remarks provided'}`,
                        timestamp: new Date().toISOString()
                    }]
                }, { merge: true });
            } else {
                // Normal resolution feedback
                await setDoc(issueRef, {
                    studentRating: localRating,
                    studentFeedbackText: feedbackText,
                    reopenedByStudent: false,
                    timeline: [...(selectedIssue.timeline || []), {
                        status: 'Resolved',
                        message: `Student feedback: ${localRating} stars - "${feedbackText || 'No comments'}"`,
                        timestamp: new Date().toISOString()
                    }]
                }, { merge: true });
            }

            // Success Visual Feedback (In-Modal Success)
            setFeedbackType(type);
            setFeedbackSuccess(true);
            
            // Auto-close after 2 seconds
            setTimeout(() => {
                setFeedbackModalOpen(false);
                setFeedbackSuccess(false);
                setFeedbackText("");
            }, 2000);

            // Update selected issue locally
            setSelectedIssue({ 
                ...selectedIssue, 
                status: shouldReopen ? 'Reported' : selectedIssue.status,
                oldTimeline: shouldReopen ? [...(selectedIssue.oldTimeline || []), {}] : selectedIssue.oldTimeline,
                rating: localRating,
                feedbackText: feedbackText
            });
        } catch (error) {
            console.error("Error submitting feedback:", error);
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    useEffect(() => {
        // 1. Initial Gate - Not logged in
        if (!currentUser && !authLoading) {
            navigate('/login');
            return;
        }

        // 2. Onboarding Gate - Logged in but no profile (Students only)
        if (currentUser && !userData && !authLoading) {
            // Note: Admins are pre-seeded in DB, students create their docs here
            navigate('/onboarding');
            return;
        }

        // 3. Early Return if still loading or missing safe prerequisites
        if (authLoading || !currentUser || !userData) return;

        // Determine target department filter
        const userDept = userData.department || userData.department_in_charge || "";

        // Build the query
        // Students see: Own issues OR their Department OR General issues
        // Admins see: Official department issues OR General issues
        const q = query(
            collection(db, "issues"),
            or(
                where("userId", "==", currentUser.uid),
                where("department", "==", userDept),
                where("department", "==", "GENERAL/PRINCIPAL OFFICE DEPARTMENT")
            ),
            orderBy("timestamp", "desc")
        );

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
    }, [currentUser, userData, authLoading, navigate]);

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
                                <div className="flex flex-col mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">
                                        ID: {selectedIssue?.id?.slice(-6)}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <DialogTitle className="text-2xl font-bold text-slate-800 leading-tight">
                                            {selectedIssue?.title}
                                        </DialogTitle>
                                        
                                        {/* Accountability Step: Re-opened Badge */}
                                        {selectedIssue?.reopenedByStudent && (
                                            <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse flex items-center gap-1 shrink-0 border border-red-500">
                                                RE-OPENED
                                            </span>
                                        )}
                                    </div>
                                </div>
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
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
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

                            <div className="mt-8 border-t border-slate-100 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tracking Timeline</h4>
                                    
                                    {/* History Toggle Switch */}
                                    {selectedIssue?.oldTimeline?.length > 0 && (
                                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
                                            <button 
                                                onClick={() => setViewMode('current')}
                                                className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-md transition-all duration-300 ${viewMode === 'current' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Current
                                            </button>
                                            <button 
                                                onClick={() => setViewMode('original')}
                                                className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-md transition-all duration-300 ${viewMode === 'original' ? 'bg-amber-100 text-amber-700 shadow-sm border border-amber-200' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Original
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <StatusStepper 
                                    issue={viewMode === 'current' 
                                        ? {
                                            ...selectedIssue,
                                            // Defensive check: Only slice if timeline exists
                                            timeline: (selectedIssue?.timeline || []).slice(
                                                Math.max(0, (selectedIssue?.timeline || []).map(t => t?.status).lastIndexOf('Reported'))
                                            )
                                          }
                                        : { 
                                            ...selectedIssue, 
                                            status: selectedIssue.oldTimeline?.[0]?.status, 
                                            timeline: selectedIssue.oldTimeline?.[0]?.timelineSnapshot || [],
                                            // ARCHIVE FIX: Pin the start and end times separately
                                            timestamp: selectedIssue.timestamp, // Original Start
                                            resolvedAt: selectedIssue.oldTimeline?.[0]?.resolvedAt, // Original End
                                            lastUpdatedAt: selectedIssue.oldTimeline?.[0]?.resolvedAt,
                                            adminRemarks: selectedIssue.oldTimeline?.[0]?.adminRemarks
                                          }
                                    } 
                                    className={viewMode === 'original' ? 'opacity-70 grayscale-[30%] pointer-events-none' : ''}
                                />
                            </div>

                            {/* Rating Section - Accountability Step 1 & 2 */}
                            {selectedIssue?.status === 'Resolved' && viewMode === 'current' && (currentUser?.email === (selectedIssue?.reporter?.email || selectedIssue?.userId)) && (
                                <div className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <CheckCircle className="text-emerald-600" size={16} />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-800 tracking-tight">Rate the Resolution</h4>
                                        </div>
                                        
                                        <p className="text-xs text-slate-500 mb-4 text-center px-4">
                                            How satisfied are you with the work done?
                                        </p>

                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    disabled={selectedIssue?.rating}
                                                    onMouseEnter={() => !selectedIssue?.rating && setHoverRating(star)}
                                                    onMouseLeave={() => !selectedIssue?.rating && setHoverRating(0)}
                                                    onClick={() => {
                                                        if (!selectedIssue?.rating) {
                                                            setLocalRating(star);
                                                            setFeedbackModalOpen(true);
                                                        }
                                                    }}
                                                    className={`p-1 transition-all duration-200 ${!selectedIssue?.rating ? 'hover:scale-125 cursor-pointer' : 'cursor-default'}`}
                                                >
                                                    <Star
                                                        size={32}
                                                        fill={(hoverRating || localRating || selectedIssue?.rating) >= star ? "#FFD700" : "transparent"}
                                                        stroke={(hoverRating || localRating || selectedIssue?.rating) >= star ? "#FFD700" : "#CBD5E1"}
                                                        className="transition-colors duration-200"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {selectedIssue?.rating && (
                                            <div className="mt-4 flex flex-col items-center gap-2">
                                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Feedback Submitted</p>
                                                {selectedIssue?.feedbackText && (
                                                    <p className="text-sm italic text-slate-600 bg-white/60 p-3 rounded-lg border border-slate-100 max-w-md text-center shadow-sm">
                                                        "{selectedIssue.feedbackText}"
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Feedback Modal - Accountability Step 2 */}
                            <Dialog 
                                open={feedbackModalOpen} 
                                onOpenChange={(open) => {
                                    setFeedbackModalOpen(open);
                                    // SAFETY FIX: If closing without success, clear the local stars
                                    if (!open && !feedbackSuccess) {
                                        setLocalRating(0);
                                        setFeedbackText("");
                                    }
                                }}
                            >
                                <DialogContent className="max-w-md w-[95vw] rounded-3xl p-6 md:p-8 bg-white border-none shadow-2xl overflow-visible">
                                    {feedbackSuccess ? (
                                        <div className="py-12 flex flex-col items-center text-center animate-in zoom-in duration-300">
                                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                                                <CheckCircle className="text-emerald-500 w-10 h-10" />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-800 mb-2">
                                                {feedbackType === 'reopened' ? "Sent for Re-inspection" : "Feedback Submitted"}
                                            </h3>
                                            <p className="text-slate-500 font-medium px-4">
                                                {feedbackType === 'reopened' 
                                                    ? "This issue has been moved back to the Reported state. Faculty will be notified."
                                                    : "Thank you for helping us maintain AU quality standards!"}
                                            </p>
                                            <div className="mt-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <Loader2 className="animate-spin" size={12} /> Closing Modal...
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <DialogHeader className="text-center space-y-4 pt-4">
                                                <DialogTitle className="text-2xl font-black text-slate-800">
                                                    How was your experience?
                                                </DialogTitle>

                                                {/* Visual Star Confirmation Recap */}
                                                <div className="flex items-center justify-center gap-1.5 my-1">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star 
                                                            key={s} 
                                                            size={18} 
                                                            fill={s <= localRating ? "#FFD700" : "transparent"} 
                                                            stroke={s <= localRating ? "#FFD700" : "#CBD5E1"} 
                                                            className="transition-all duration-300"
                                                        />
                                                    ))}
                                                    <span className="ml-2 text-sm font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
                                                        {localRating}/5
                                                    </span>
                                                </div>

                                                <DialogDescription className="text-slate-500 font-medium pb-2 text-sm">
                                                    Please tell us more about the resolution.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-6 mt-4">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-xs font-black uppercase tracking-widest text-slate-800">Additional Feedback</label>
                                                        {localRating <= 2 && (
                                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">* Required for {localRating} stars</span>
                                                        )}
                                                    </div>
                                                    <textarea
                                                        value={feedbackText}
                                                        onChange={(e) => setFeedbackText(e.target.value)}
                                                        placeholder={localRating <= 2 ? "Please explain what went wrong and how we can fix it..." : "Anything else you want to share? (Optional)"}
                                                        className="w-full h-32 p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-700 font-medium resize-none placeholder:text-slate-400"
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                    <Button
                                                        disabled={isSubmittingFeedback || (localRating <= 2 && feedbackText.trim().length < 5)}
                                                        onClick={() => handleFeedbackSubmit('resolved')}
                                                        className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                                                    >
                                                        {isSubmittingFeedback ? <Loader2 className="animate-spin" /> : "Submit Feedback"}
                                                    </Button>

                                                    {(localRating >= 3) && !isSubmittingFeedback && (
                                                        <button
                                                            onClick={() => {
                                                                setFeedbackText(""); // Clear any accidental typing
                                                                handleFeedbackSubmit('resolved');
                                                            }}
                                                            className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                                                        >
                                                            No thanks, just submit rating
                                                        </button>
                                                    )}

                                                    {localRating <= 2 && (
                                                        <div className="flex flex-col gap-2 pt-2">
                                                            <button
                                                                disabled={isSubmittingFeedback || feedbackText.trim().length < 5}
                                                                onClick={() => handleFeedbackSubmit('reopened')}
                                                                className="w-full py-2 flex items-center justify-center gap-2 text-xs font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest disabled:opacity-30 underline decoration-red-500/30 underline-offset-4"
                                                            >
                                                                <ArrowUpDown size={14} className="rotate-180" />
                                                                Submit & Re-open Issue
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </DialogContent>
                            </Dialog>

                            {/* Documented Proof Section */}
                            {(viewMode === 'current' ? selectedIssue?.afterImageUrl : selectedIssue?.oldTimeline?.[0]?.afterImageUrl) && (
                                <div className={`mt-8 border-t border-slate-100 pt-6 transition-all duration-300 ${viewMode === 'original' ? 'opacity-70 scale-95 origin-top grayscale-[50%]' : ''}`}>
                                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">
                                        <CheckCircle size={14} className="text-emerald-500" /> 
                                        {viewMode === 'original' ? 'Historical Proof (Attempt 1)' : 'Documented Proof'}
                                    </h4>
                                    <div className="h-56 md:h-72 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative shadow-inner flex items-center justify-center">
                                        <div
                                            className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-125 transition-all"
                                            style={{ backgroundImage: `url(${viewMode === 'current' ? selectedIssue.afterImageUrl : selectedIssue.oldTimeline[0].afterImageUrl})` }}
                                        ></div>
                                        <img 
                                            src={viewMode === 'current' ? selectedIssue.afterImageUrl : selectedIssue.oldTimeline[0].afterImageUrl} 
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
