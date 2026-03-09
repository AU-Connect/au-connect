import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ImageUpload = ({ onUploadComplete }) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Basic validation
        if (!selectedFile.type.startsWith('image/')) {
            setError("Please select an image file (PNG, JPG, etc.)");
            return;
        }

        // Reset states
        setError('');
        setUploadedUrl('');

        // Save file and create preview
        setFile(selectedFile);
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);
    };

    const removeImage = () => {
        setFile(null);
        setPreviewUrl(null);
        setUploadedUrl('');
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadImage = async () => {
        if (!file) {
            setError("Please select an image first");
            return;
        }

        setLoading(true);
        setError('');

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'au_connect_preset';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Upload failed");
            }

            const data = await response.json();
            const secureUrl = data.secure_url;

            setUploadedUrl(secureUrl);
            if (onUploadComplete) {
                onUploadComplete(secureUrl);
            }
        } catch (err) {
            console.error("Cloudinary Upload Error:", err);
            const errorMessage = "Failed to upload image. Please check your internet and try again.";
            setError(errorMessage);
            alert(errorMessage); // Added alert for clarity
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full border-2 border-dashed border-slate-200 bg-slate-50/30 p-6 rounded-2xl transition-all hover:border-primary/30">
            <div className="flex flex-col items-center justify-center space-y-4">
                {!previewUrl ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center cursor-pointer space-y-3 group"
                    >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                            <UploadCloud className="text-primary" size={32} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-700">Click to upload issue photo</p>
                            <p className="text-xs text-slate-400 mt-1">PNG, JPG or JPEG (Max. 5MB)</p>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full max-w-[300px] aspect-video rounded-xl overflow-hidden shadow-lg border-2 border-white">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        {!loading && !uploadedUrl && (
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors z-[40]"
                                title="Remove Image"
                            >
                                <X size={16} />
                            </button>
                        )}
                        {loading && (
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                                <Loader2 className="animate-spin mb-2" size={32} />
                                <span className="text-xs font-bold uppercase tracking-wider">Uploading...</span>
                            </div>
                        )}
                        {uploadedUrl && (
                            <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                                <div className="bg-white/90 p-2 rounded-full shadow-lg">
                                    <CheckCircle2 className="text-green-600" size={24} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {error && (
                    <div className="flex items-center gap-2 text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                )}

                {previewUrl && !uploadedUrl && !loading && (
                    <div className="flex gap-4 w-full justify-center pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={removeImage}
                            className="flex-1 max-w-[120px] rounded-xl border-slate-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={uploadImage}
                            className="flex-1 max-w-[180px] bg-primary-gradient text-white rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all"
                        >
                            <Camera size={18} className="mr-2" />
                            Use This Photo
                        </Button>
                    </div>
                )}

                {uploadedUrl && (
                    <div className="flex flex-col items-center space-y-2">
                        <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 uppercase tracking-widest pt-1">
                            <CheckCircle2 size={12} />
                            Image Securely Uploaded
                        </p>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={removeImage}
                            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 h-8 font-bold"
                        >
                            Remove & Try Different Photo
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ImageUpload;
