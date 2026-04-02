import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot
} from 'firebase/firestore';
import AdminIssueCard from '../components/AdminIssueCard';
import AdminDetailsModal from '../components/AdminDetailsModal';
import AdminStatistics from '../components/AdminStatistics';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    LayoutDashboard,
    ListFilter,
    LogOut,
    Bell,
    Search,
    Inbox,
    CheckCircle,
    Clock,
    AlertCircle,
    PauseCircle,
    XCircle,
    Loader2,
    BarChart3,
    TrendingUp
} from 'lucide-react';

const AdminDashboard = () => {
    const { userData, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [selectedIssue, setSelectedIssue] = useState(null);

    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        if (!userData?.department_in_charge) return;

        // Special Case: If the admin is a 'General Admin', fetch 'General' issues
        let targetDept = userData.department_in_charge;
        if (targetDept === "General Admin") {
            targetDept = "GENERAL/PRINCIPAL OFFICE DEPARTMENT";
        }

        const q = query(
            collection(db, "issues"),
            where("department", "==", targetDept),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedIssues = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setIssues(fetchedIssues);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching admin issues:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData]);

    // Client-side filtering and sorting
    const filteredIssues = issues
        .filter(issue => {
            const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                issue.id.toLowerCase().includes(searchQuery.toLowerCase());

            if (activeTab === 'all') return matchesSearch;
            if (activeTab === 'reported') return matchesSearch && issue.status === 'Reported';
            if (activeTab === 'progress') return matchesSearch && issue.status === 'InProgress';
            if (activeTab === 'onhold') return matchesSearch && issue.status === 'OnHold';
            if (activeTab === 'resolved') return matchesSearch && issue.status === 'Resolved';
            if (activeTab === 'rejected') return matchesSearch && issue.status === 'Rejected';
            return matchesSearch;
        })
        .sort((a, b) => {
            if (sortBy === 'latest') return b.timestamp?.seconds - a.timestamp?.seconds;
            if (sortBy === 'oldest') return a.timestamp?.seconds - b.timestamp?.seconds;
            if (sortBy === 'upvotes') return (b.upvotes || 0) - (a.upvotes || 0);
            return 0;
        });

    const departmentName = userData?.department_in_charge || "General";

    const activeStats = [
        { id: 'all', label: 'All Issues', icon: <Inbox size={22} />, count: issues.length, color: 'text-[#34C1E3]', bg: 'bg-[#34C1E31A]', border: 'hover:border-[#34C1E3]/30' },
        { id: 'reported', label: 'Pending', icon: <AlertCircle size={22} />, count: issues.filter(i => i.status === 'Reported').length, color: 'text-amber-500', bg: 'bg-amber-50', border: 'hover:border-amber-300' },
        { id: 'progress', label: 'In Progress', icon: <Clock size={22} />, count: issues.filter(i => i.status === 'InProgress').length, color: 'text-blue-500', bg: 'bg-blue-50', border: 'hover:border-blue-300' },
        { id: 'onhold', label: 'On Hold', icon: <PauseCircle size={22} />, count: issues.filter(i => i.status === 'OnHold').length, color: 'text-orange-500', bg: 'bg-orange-50', border: 'hover:border-orange-300' },
        { id: 'resolved', label: 'Resolved', icon: <CheckCircle size={22} />, count: issues.filter(i => i.status === 'Resolved').length, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'hover:border-emerald-300' },
        { id: 'rejected', label: 'Rejected', icon: <XCircle size={22} />, count: issues.filter(i => i.status === 'Rejected').length, color: 'text-red-500', bg: 'bg-red-50', border: 'hover:border-red-300' },
        { id: 'stats', label: 'Resource Stats', icon: <BarChart3 size={22} />, count: null, color: 'text-purple-500', bg: 'bg-purple-50', border: 'hover:border-purple-300' },
    ];

    return (
        <div className="flex min-h-[calc(100vh-65px)] bg-slate-50 font-sans relative items-start">
            
            {/* Custom Success Toast */}
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald-50 text-emerald-600 border border-emerald-200 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
                    <CheckCircle size={18} className="text-emerald-500" />
                    <span className="font-bold text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Left Vertical Stats Panel */}
            <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-slate-200 flex flex-col shrink-0 z-30 sticky top-[65px] h-[calc(100vh-65px)]">
                <div className="p-4 pt-6 flex-grow flex flex-col gap-2 overflow-y-auto hide-scrollbar">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Live Tracker & Statistics</h3>
                    {activeStats.map((stat) => (
                        <button
                            key={stat.id}
                            onClick={() => {
                                setActiveTab(stat.id);
                                setSearchQuery('');
                                setSortBy('latest');
                            }}
                            className={`w-full bg-white p-3 rounded-xl border transition-all duration-300 text-left shrink-0 hover:-translate-y-0.5 ${
                                activeTab === stat.id 
                                ? `border-primary shadow-md shadow-primary/20 ring-1 ring-primary/20 z-10 scale-[1.02]` 
                                : `border-slate-100 shadow-sm ${stat.border}`
                            }`}
                        >
                            <div className="flex flex-row items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${activeTab === stat.id ? 'bg-primary text-white shadow-inner' : `${stat.bg} ${stat.color}`}`}>
                                    {stat.icon}
                                </div>
                                <div className="flex flex-col items-start gap-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{stat.label}</p>
                                    <h4 className="text-xl font-black text-slate-800 tracking-tighter leading-none">{stat.count}</h4>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow flex flex-col min-h-[calc(100vh-65px)] bg-slate-50/50 backdrop-blur-xl">
                
                {/* Sticky Analytics Toolbar */}
                <div className="sticky top-[65px] z-20 bg-slate-50/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm px-8 py-3 shrink-0">
                    <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="inline-block shrink-0">
                            <h3 className="text-[20px] font-black text-[#1E293B] tracking-tight leading-none mb-1">
                                {activeStats.find(item => item.id === activeTab)?.label}
                            </h3>
                            <div className="h-1 w-1/3 bg-primary-gradient rounded-full"></div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            {/* Search and Sort - Hide in Stats Mode */}
                            {activeTab !== 'stats' && (
                                <>
                                    {/* Search Bar */}
                                    <div className="relative group w-full md:w-72">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search ticket ID or title..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 w-full transition-all shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
                                        />
                                    </div>

                                    {/* Sort Filter */}
                                    <div className="flex items-center bg-white pr-2 pl-1.5 py-1 rounded-full border border-slate-200 shrink-0 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] transition-all hover:border-slate-300">
                                        <Select value={sortBy} onValueChange={setSortBy}>
                                            <SelectTrigger className="w-[160px] h-8 text-xs font-bold border-none bg-transparent focus:ring-0 shadow-none px-2">
                                                <div className="flex items-center gap-2 w-full truncate">
                                                    <div className="p-1 bg-purple-50 text-purple-500 rounded-md shrink-0">
                                                        <ListFilter size={14} />
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
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dashboard Body */}
                <div className="px-8 pb-8 pt-8">
                    <div className="max-w-7xl mx-auto w-full">

                        {/* Issue List, Cards Grid, or Stats Dashboard */}
                        <div className={`${activeTab === 'stats' ? '' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'} pb-12`}>
                            {loading ? (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 className="animate-spin mb-4" size={40} />
                                    <p className="font-bold uppercase tracking-widest text-xs">Accessing Secure Records...</p>
                                </div>
                            ) : activeTab === 'stats' ? (
                                <AdminStatistics issues={issues} />
                            ) : filteredIssues.length > 0 ? (
                                filteredIssues.map(issue => (
                                    <AdminIssueCard
                                        key={issue.id}
                                        issue={issue}
                                        onClick={(issue) => setSelectedIssue(issue)}
                                    />
                                ))
                            ) : (
                                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center col-span-full">
                                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Inbox className="text-slate-300" size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-400 mb-2">No Reports Found</h3>
                                    <p className="text-slate-400 max-w-sm mx-auto text-sm">
                                        {searchQuery ? `No issues match "${searchQuery}" in this category.` : `Waiting for incoming reports from the ${departmentName} department.`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modularized Details Popup Modal & Actions */}
                <AdminDetailsModal 
                    selectedIssue={selectedIssue} 
                    onClose={() => setSelectedIssue(null)} 
                    onSuccess={(msg) => {
                        setToastMessage(msg);
                        setTimeout(() => setToastMessage(null), 3000);
                    }}
                />
            </main>
        </div>
    );
};

export default AdminDashboard;
