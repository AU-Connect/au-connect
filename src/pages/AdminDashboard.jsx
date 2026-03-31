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
    Loader2
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
            if (activeTab === 'resolved') return matchesSearch && issue.status === 'Resolved';
            return matchesSearch;
        })
        .sort((a, b) => {
            if (sortBy === 'latest') return b.timestamp?.seconds - a.timestamp?.seconds;
            if (sortBy === 'oldest') return a.timestamp?.seconds - b.timestamp?.seconds;
            if (sortBy === 'upvotes') return (b.upvotes || 0) - (a.upvotes || 0);
            return 0;
        });

    const departmentName = userData?.department_in_charge || "General";

    const sidebarItems = [
        { id: 'all', label: 'All Issues', icon: <Inbox size={20} /> },
        { id: 'reported', label: 'Pending', icon: <AlertCircle size={20} /> },
        { id: 'progress', label: 'In Progress', icon: <Clock size={20} /> },
        { id: 'resolved', label: 'Resolved', icon: <CheckCircle size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden relative">
            
            {/* Custom Success Toast */}
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald-50 text-emerald-600 border border-emerald-200 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
                    <CheckCircle size={18} className="text-emerald-500" />
                    <span className="font-bold text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Sidebar */}
            <aside className="w-64 bg-[#F1F5F9] border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <LayoutDashboard className="text-white" size={18} />
                        </div>
                        <span className="font-black text-slate-800 text-lg tracking-tight">AU Connect Admin</span>
                    </div>

                    <nav className="space-y-1.5">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === item.id
                                    ? 'bg-white text-primary shadow-sm shadow-slate-200 border border-slate-100 scale-[1.02]'
                                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-slate-200">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow flex flex-col h-full overflow-hidden bg-white/50 backdrop-blur-xl">
                {/* Header */}
                <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                            {departmentName} <span className="text-primary text-[10px] px-2 py-0.5 bg-primary/10 rounded-md uppercase tracking-wider">Workspace</span>
                        </h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Dashboard Overview</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by ticket ID or title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-100/50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
                            />
                        </div>
                        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 relative transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Dashboard Body */}
                <div className="p-8 h-full overflow-y-auto custom-scrollbar">
                    <div className="max-w-7xl mx-auto w-full">

                        {/* Statistics Banner */}
                        {!loading && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-[#34C1E3]/30 transition-all duration-300">
                                    <div className="w-12 h-12 rounded-xl bg-[#34C1E31A] text-[#34C1E3] flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Inbox size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Reports</p>
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tighter mt-0.5">{issues.length}</h4>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-blue-200 transition-all duration-300">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tighter mt-0.5">
                                            {issues.filter(i => i.status === 'Reported').length}
                                        </h4>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-purple-200 transition-all duration-300">
                                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Progress</p>
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tighter mt-0.5">
                                            {issues.filter(i => i.status === 'InProgress').length}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-8">
                            <div className="inline-block">
                                <h3 className="text-2xl font-black text-[#1E293B] tracking-tight">
                                    {sidebarItems.find(item => item.id === activeTab)?.label}
                                </h3>
                                <div className="h-1 w-1/3 bg-primary-gradient rounded-full mt-2"></div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <ListFilter size={14} className="text-primary" />
                                    Sort By
                                </div>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[140px] h-9 text-xs font-bold border-slate-200 bg-white shadow-sm rounded-xl focus:ring-primary/20">
                                        <SelectValue placeholder="Sort" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="latest" className="text-xs font-bold py-2 focus:bg-primary/5">Latest First</SelectItem>
                                        <SelectItem value="oldest" className="text-xs font-bold py-2 focus:bg-primary/5">Oldest First</SelectItem>
                                        <SelectItem value="upvotes" className="text-xs font-bold py-2 focus:bg-primary/5">Most Upvoted</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Issue Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                            {loading ? (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 className="animate-spin mb-4" size={40} />
                                    <p className="font-bold uppercase tracking-widest text-xs">Accessing Secure Records...</p>
                                </div>
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
