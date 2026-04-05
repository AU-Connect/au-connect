import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { MapPin, Clock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import StatusStepper from './StatusStepper';
import ImageUpload from './ImageUpload';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminDetailsModal = ({ selectedIssue, onClose, onSuccess }) => {
    // Step 3 & 4 States extracted from dashboard
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [adminRemark, setAdminRemark] = useState('');
    const [resolvedImageUrl, setResolvedImageUrl] = useState(null);
    const [updating, setUpdating] = useState(false);

    const openActionModal = (action) => {
        setSelectedAction(action);
        setAdminRemark('');
        setResolvedImageUrl(null);
        setActionModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!selectedIssue || !selectedAction) return;
        
        // Final sanity checks
        if (adminRemark.trim().length < 10) return;
        if ((selectedAction === 'Resolved' || selectedAction === 'Rejected') && !resolvedImageUrl) return;

        setUpdating(true);

        try {
            const issueRef = doc(db, "issues", selectedIssue.id);
            const updateData = {
                status: selectedAction,
                adminRemarks: adminRemark,
                lastUpdatedAt: new Date(),
                statusHistory: arrayUnion({
                    status: selectedAction,
                    remarks: adminRemark,
                    timestamp: new Date()
                })
            };

            if (selectedAction === 'Resolved' || selectedAction === 'Rejected') {
                updateData.afterImageUrl = resolvedImageUrl;
                updateData.resolvedAt = new Date();
            }

            // Push changes to Firebase
            await updateDoc(issueRef, updateData);

            // Trigger success UI flow
            onSuccess(`Success: Issue marked as ${selectedAction}!`);
            setActionModalOpen(false);
            onClose();

        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Error updating database. Please try again.");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <>
            {/* Primary Details Popup Modal */}
            <Dialog open={!!selectedIssue} onOpenChange={(open) => { if (!open) onClose(); }}>
                <DialogContent className="max-w-[90vw] lg:max-w-6xl w-full max-h-[85vh] my-auto mt-6 p-0 overflow-hidden bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl">
                    <DialogTitle className="sr-only">Issue Details</DialogTitle>
                    <div className="flex flex-col md:flex-row h-full">
                        {/* Left Side: Full Image */}
                        <div className="w-full md:w-2/5 h-64 md:h-auto relative bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 hidden md:flex min-h-[400px]">
                            <div
                                className="absolute inset-0 bg-cover bg-center opacity-50 blur-xl scale-110"
                                style={{ backgroundImage: `url(${selectedIssue?.imageUrl})` }}
                            ></div>
                            <img
                                src={selectedIssue?.imageUrl}
                                alt={selectedIssue?.title}
                                className="w-full h-full object-contain relative z-10 p-4"
                            />
                        </div>

                        {/* Right Side: Details & Timeline */}
                        <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
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
                                    <DialogTitle className="text-2xl font-bold text-slate-800 leading-tight">
                                        {selectedIssue?.title}
                                    </DialogTitle>
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
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <MapPin size={14} /> Recorded Location
                                </h4>
                                <p className="text-sm font-medium text-slate-700 mb-3">
                                    {selectedIssue?.location?.manualAddress || selectedIssue?.manualLocation || selectedIssue?.department}
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

                            {/* Progress Tracking */}
                            <div className="mt-8 border-t border-slate-100 pt-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-1.5">
                                    <Clock size={14} /> Resolution Progress
                                </h4>
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

                            {/* Admin Actions */}
                            <div className="mt-auto pt-6 border-t border-slate-100 pb-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Admin Controls</h4>
                                
                                {selectedIssue?.status === 'Resolved' && (
                                    <div className="flex items-center justify-center p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 font-bold gap-2 tracking-wide shadow-inner">
                                        <CheckCircle size={18} />
                                        ISSUE RESOLVED
                                    </div>
                                )}

                                {selectedIssue?.status === 'Rejected' && (
                                    <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold gap-2 tracking-wide shadow-inner">
                                        <AlertCircle size={18} />
                                        ISSUE REJECTED
                                    </div>
                                )}

                                {selectedIssue?.status !== 'Resolved' && selectedIssue?.status !== 'Rejected' && (
                                    <div className="flex flex-wrap items-center gap-3">
                                        
                                        {/* Viewed Button */}
                                        <button 
                                            disabled={['Viewed', 'InProgress', 'OnHold'].includes(selectedIssue?.status)}
                                            onClick={() => openActionModal('Viewed')} 
                                            className={`flex-1 min-w-[100px] flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                                ['Viewed', 'InProgress', 'OnHold'].includes(selectedIssue?.status)
                                                ? 'bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed opacity-80'
                                                : 'bg-[#FFFFFF] border border-[#E2E8F0] text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]'
                                            }`}
                                        >
                                            {['Viewed', 'InProgress', 'OnHold'].includes(selectedIssue?.status) && <CheckCircle size={14} className="text-emerald-500 mr-1.5" />}
                                            Mark Viewed
                                        </button>
                                        
                                        {/* WIP Button */}
                                        <button 
                                            disabled={selectedIssue?.status === 'InProgress'}
                                            onClick={() => openActionModal('InProgress')} 
                                            className={`flex-1 min-w-[100px] flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                                selectedIssue?.status === 'InProgress'
                                                ? 'bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed opacity-80'
                                                : 'bg-[#FFFFFF] border border-[#E2E8F0] text-blue-600 shadow-sm hover:bg-blue-50 active:scale-[0.98]'
                                            }`}
                                        >
                                            {selectedIssue?.status === 'InProgress' && <CheckCircle size={14} className="text-emerald-500 mr-1.5" />}
                                            Start WIP
                                        </button>
                                        
                                        {/* On Hold Button */}
                                        <button 
                                            disabled={selectedIssue?.status === 'OnHold'}
                                            onClick={() => openActionModal('OnHold')} 
                                            className={`flex-1 min-w-[100px] flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                                selectedIssue?.status === 'OnHold'
                                                ? 'bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed opacity-80'
                                                : 'bg-[#FFFFFF] border border-[#E2E8F0] text-orange-600 shadow-sm hover:bg-orange-50 active:scale-[0.98]'
                                            }`}
                                        >
                                            {selectedIssue?.status === 'OnHold' && <CheckCircle size={14} className="text-emerald-500 mr-1.5" />}
                                            On Hold
                                        </button>
                                        
                                        {/* Reject Button */}
                                        <button 
                                            onClick={() => openActionModal('Rejected')} 
                                            className="flex-1 min-w-[100px] flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] text-xs font-bold text-red-600 shadow-sm hover:bg-red-50 transition-all active:scale-[0.98]"
                                        >
                                            Reject
                                        </button>

                                        {/* Resolve Button */}
                                        <button 
                                            onClick={() => openActionModal('Resolved')} 
                                            className="flex-[2] min-w-[140px] flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#34C1E3] to-[#1D4ED8] text-xs font-bold text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all active:scale-[0.98]"
                                        >
                                            Resolve Issue
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Admin Action Remark Modal */}
            <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
                <DialogContent className={`${
                    (selectedAction === 'Resolved' || selectedAction === 'Rejected') ? 'sm:max-w-2xl' : 'sm:max-w-md'
                } w-[95vw] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-2xl transition-all duration-300`}>
                    {/* Header: Static */}
                    <div className="p-5 pb-3 border-b border-slate-100">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black text-slate-800 tracking-tight">
                                Confirm Status Update
                            </DialogTitle>
                            <DialogDescription className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
                                You are about to change this issue's status to <span className="text-primary font-black uppercase mx-1">{selectedAction}</span>.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* Content: Dynamic Layout */}
                    <div className="flex-grow overflow-y-auto p-5 custom-scrollbar bg-slate-50/30">
                        <div className={`grid gap-5 ${
                            (selectedAction === 'Resolved' || selectedAction === 'Rejected') ? 'md:grid-cols-2' : 'grid-cols-1'
                        }`}>
                            {/* Remark Section */}
                            <div>
                                <label className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1.5 block">
                                    Mandatory Admin Remark <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={adminRemark}
                                    onChange={(e) => setAdminRemark(e.target.value)}
                                    placeholder="Explain the exact reason for this status change to the student (min 10 characters)..."
                                    className="w-full h-32 p-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 resize-none transition-all placeholder:text-slate-400 font-medium shadow-sm"
                                />
                                <div className="flex justify-between items-center mt-2 px-1">
                                    <span className={`text-[10px] uppercase tracking-widest font-black transition-colors ${adminRemark.trim().length >= 10 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {adminRemark.trim().length} / 10 Characters Needed
                                    </span>
                                </div>
                            </div>

                            {/* Proof/Photo Section (Conditional) */}
                            {(selectedAction === 'Resolved' || selectedAction === 'Rejected') && (
                                <div className="md:border-l md:border-slate-200/60 md:pl-5">
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 block">
                                        {selectedAction === 'Resolved' ? (
                                            <CheckCircle size={14} className="text-emerald-500" />
                                        ) : (
                                            <AlertCircle size={14} className="text-red-500" />
                                        )}
                                        Proof of Resolution <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-[11px] text-slate-500 font-medium mb-3 leading-tight opacity-90">
                                        As per university guidelines, you must upload an 'After Photo' before resolving.
                                    </p>
                                    <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm">
                                        <ImageUpload onUploadComplete={(url) => setResolvedImageUrl(url)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer: Static & Sticky at Bottom */}
                    <div className="p-5 bg-white border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
                        <button
                            onClick={() => setActionModalOpen(false)}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateStatus}
                            disabled={updating || adminRemark.trim().length < 10 || ((selectedAction === 'Resolved' || selectedAction === 'Rejected') && !resolvedImageUrl)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center min-w-[120px] ${
                                (updating || adminRemark.trim().length < 10 || ((selectedAction === 'Resolved' || selectedAction === 'Rejected') && !resolvedImageUrl))
                                    ? 'bg-slate-300 cursor-not-allowed opacity-50 shadow-none'
                                    : 'bg-primary-gradient hover:brightness-110 hover:shadow-lg active:scale-95'
                            }`}
                        >
                            {updating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin mr-2" /> 
                                    Syncing...
                                </>
                            ) : (
                                "Confirm Update"
                            )}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AdminDetailsModal;
