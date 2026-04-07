import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend
} from 'recharts';
import { 
    TrendingUp, 
    AlertCircle, 
    CheckCircle, 
    Clock, 
    BarChart3,
    PieChart as PieChartIcon,
    Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminStatistics = ({ issues = [] }) => {
    // 1. Process Data for Category Distribution (Pie Chart)
    const categoryData = useMemo(() => {
        const counts = {};
        issues.forEach(issue => {
            const cat = issue.category || 'Uncategorized';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({
            name: key,
            value: counts[key]
        }));
    }, [issues]);

    // 2. Process Data for Status Summary (Bar Chart)
    const statusData = useMemo(() => {
        const counts = {
            'Reported': 0,
            'InProgress': 0,
            'Resolved': 0,
            'Rejected': 0,
            'OnHold': 0
        };
        issues.forEach(issue => {
            if (counts.hasOwnProperty(issue.status)) {
                counts[issue.status]++;
            }
        });
        return Object.keys(counts).map(key => ({
            status: key,
            count: counts[key]
        }));
    }, [issues]);

    // 3. Process Data for Timeline Trend (Line Chart - Last 7 Days)
    const timelineData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }).reverse();

        const counts = {};
        last7Days.forEach(day => counts[day] = 0);

        issues.forEach(issue => {
            if (issue.timestamp) {
                const date = new Date(issue.timestamp.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (counts.hasOwnProperty(date)) {
                    counts[date]++;
                }
            }
        });

        return last7Days.map(day => ({
            date: day,
            issues: counts[day]
        }));
    }, [issues]);

    // 4. Process Re-opened Issue Stats
    const reopenedStats = useMemo(() => {
        return {
            active: issues.filter(i => i.reopenedByStudent && i.status !== 'Resolved').length,
            corrected: issues.filter(i => (i.oldTimeline?.length > 0 || i.reopenedByStudent === false && i.oldTimeline?.length > 0) && i.status === 'Resolved').length
        };
    }, [issues]);

    const COLORS = ['#34C1E3', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#64748B'];

    if (issues.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <BarChart3 size={48} className="text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-500">No Data to Analyze</h3>
                <p className="text-slate-400">Detailed analytics will appear once issues are reported.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Row: Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Volume</p>
                        <h4 className="text-2xl font-bold text-slate-800">{issues.length} Issues</h4>
                    </div>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Resolution Rate</p>
                        <h4 className="text-2xl font-bold text-slate-800">
                            {Math.round((statusData.find(d => d.status === 'Resolved')?.count / issues.length) * 100) || 0}%
                        </h4>
                    </div>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Critical Load</p>
                        <h4 className="text-2xl font-bold text-slate-800">
                            {statusData.find(d => d.status === 'Reported')?.count || 0} Pending
                        </h4>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Category Distribution (Pie Chart) */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 min-h-[450px]"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <PieChartIcon className="text-[#34C1E3]" size={24} />
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Issue Categories</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 2. Volume Timeline (Line Chart) */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 min-h-[450px]"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <Calendar className="text-[#34C1E3]" size={24} />
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Daily Intake</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timelineData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="issues" 
                                    stroke="#34C1E3" 
                                    strokeWidth={4} 
                                    dot={{ r: 6, fill: '#34C1E3', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 3. Status Breakdown (Bar Chart) - Full Width Below */}
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 min-h-[400px]"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <BarChart3 className="text-[#34C1E3]" size={24} />
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Resolution Funnel</h3>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis 
                                    dataKey="status" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                />
                                <Bar 
                                    dataKey="count" 
                                    radius={[10, 10, 0, 0]}
                                    isAnimationActive={true}
                                    animationDuration={1500}
                                    animationEasing="ease-out"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={
                                                entry.status === 'Resolved' ? '#059669' : // emerald-600
                                                entry.status === 'Reported' ? '#F97316' : // orange-500
                                                entry.status === 'Rejected' ? '#DC2626' : // red-600
                                                entry.status === 'InProgress' ? '#2563EB' : // blue-600
                                                entry.status === 'OnHold' ? '#D97706' : // amber-600
                                                entry.status === 'Viewed' ? '#4F46E5' : // indigo-600
                                                '#475569' // slate-600 default
                                            } 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Accountability Row: Moved to bottom as per user request */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white p-4 rounded-2xl border border-slate-200 border-l-4 border-l-red-500 shadow-sm flex items-center gap-3 group relative overflow-hidden"
                >
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                        <AlertCircle size={18} className="animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Re-opens</p>
                        <h4 className="text-xl font-black text-red-600 tracking-tighter leading-none">{reopenedStats.active}</h4>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-4 rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm flex items-center gap-3 group relative overflow-hidden"
                >
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <CheckCircle size={18} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fixed Re-opens</p>
                        <h4 className="text-xl font-black text-emerald-600 tracking-tighter leading-none">{reopenedStats.corrected}</h4>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminStatistics;
