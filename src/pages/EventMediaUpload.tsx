import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEventBySlug } from "@/lib/events-store";
import { uploadEventMedia } from "@/lib/event-automation-api";
import { useToast } from "@/hooks/use-toast";

interface UploadFile {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
    preview?: string;
}

export default function EventMediaUpload() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    const MAX_FILES = 20;

    useEffect(() => {
        if (slug) {
            getEventBySlug(slug).then((eventData) => {
                if (eventData) {
                    setEvent(eventData);
                }
                setLoading(false);
            });
        }
    }, [slug]);

    const validateFile = (file: File): string | null => {
        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
        const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

        if (!isImage && !isVideo) {
            return 'File type not supported. Please upload JPG, PNG, GIF, WEBP, MP4, MOV, or AVI files.';
        }

        if (isImage && file.size > MAX_IMAGE_SIZE) {
            return `Image too large. Maximum size is 10MB.`;
        }

        if (isVideo && file.size > MAX_VIDEO_SIZE) {
            return `Video too large. Maximum size is 100MB.`;
        }

        return null;
    };

    const handleFileSelect = (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const newFiles: UploadFile[] = [];
        const errors: string[] = [];

        Array.from(selectedFiles).forEach((file) => {
            if (files.length + newFiles.length >= MAX_FILES) {
                errors.push(`Maximum of ${MAX_FILES} files allowed`);
                return;
            }

            const error = validateFile(file);
            if (error) {
                errors.push(`${file.name}: ${error}`);
                return;
            }

            // Create preview for images
            let preview: string | undefined;
            if (file.type.startsWith('image/')) {
                preview = URL.createObjectURL(file);
            }

            newFiles.push({
                id: Math.random().toString(36).substring(7),
                file,
                status: 'pending',
                progress: 0,
                preview
            });
        });

        if (errors.length > 0) {
            toast({
                title: "Some files were skipped",
                description: errors.join(', '),
                variant: "destructive"
            });
        }

        setFiles([...files, ...newFiles]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const removeFile = (id: string) => {
        setFiles(files.filter(f => f.id !== id));
    };

    const uploadFile = async (uploadFile: UploadFile) => {
        try {
            // Update status to uploading
            setFiles(prev => prev.map(f =>
                f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 30 } : f
            ));

            // Update progress
            setFiles(prev => prev.map(f =>
                f.id === uploadFile.id ? { ...f, progress: 60 } : f
            ));

            const result = await uploadEventMedia(
                uploadFile.file.name,
                uploadFile.file,
                uploadFile.file.type
            );

            if (result.success) {
                setFiles(prev => prev.map(f =>
                    f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f
                ));
                return { success: true };
            } else {
                setFiles(prev => prev.map(f =>
                    f.id === uploadFile.id ? { ...f, status: 'error', error: result.error } : f
                ));
                return { success: false, error: result.error };
            }
        } catch (error: any) {
            setFiles(prev => prev.map(f =>
                f.id === uploadFile.id ? { ...f, status: 'error', error: error.message } : f
            ));
            return { success: false, error: error.message };
        }
    };

    const handleUploadAll = async () => {
        setUploading(true);

        const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');

        for (const file of pendingFiles) {
            await uploadFile(file);
        }

        setUploading(false);

        const successCount = files.filter(f => f.status === 'success').length;
        const errorCount = files.filter(f => f.status === 'error').length;

        if (errorCount === 0) {
            toast({
                title: "Upload Complete!",
                description: `Successfully uploaded ${successCount} file(s) to the event media folder.`
            });
        } else {
            toast({
                title: "Upload Completed with Errors",
                description: `Uploaded ${successCount} file(s), ${errorCount} failed.`,
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
                    <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist.</p>
                    <Button onClick={() => navigate('/events')}>Back to Events</Button>
                </div>
            </div>
        );
    }

    const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length;
    const successCount = files.filter(f => f.status === 'success').length;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    className="gap-2 mb-6"
                    onClick={() => navigate(`/events/${slug}`)}
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Event
                </Button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Upload Your Event Photos & Videos</h1>
                    <p className="text-xl text-primary mb-2">{event.name}</p>
                    <p className="text-muted-foreground">
                        Share your favorite moments from the event. Your uploads help preserve the memories!
                    </p>
                </div>

                {/* Upload Area */}
                <div
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors mb-6 ${isDragging ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Drag & drop files here</h3>
                    <p className="text-muted-foreground mb-4">or click to browse</p>
                    <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/x-msvideo"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                        id="file-input"
                        disabled={uploading}
                    />
                    <Button
                        onClick={() => document.getElementById('file-input')?.click()}
                        disabled={uploading || files.length >= MAX_FILES}
                    >
                        Choose Files
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                        Supported: JPG, PNG, GIF, WEBP (max 10MB) • MP4, MOV, AVI (max 100MB)
                        <br />
                        Maximum {MAX_FILES} files per session
                    </p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="space-y-4 mb-6">
                        <h3 className="font-semibold">
                            Selected Files ({files.length}) • {successCount} uploaded
                        </h3>
                        <div className="space-y-2">
                            {files.map((uploadFile) => (
                                <div
                                    key={uploadFile.id}
                                    className="flex items-center gap-4 p-4 bg-card border rounded-lg"
                                >
                                    {/* Preview/Icon */}
                                    <div className="flex-shrink-0">
                                        {uploadFile.preview ? (
                                            <img
                                                src={uploadFile.preview}
                                                alt=""
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                                {uploadFile.file.type.startsWith('video/') ? (
                                                    <Video className="w-6 h-6 text-muted-foreground" />
                                                ) : (
                                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{uploadFile.file.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {uploadFile.status === 'uploading' && (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                <span className="text-sm">{uploadFile.progress}%</span>
                                            </>
                                        )}
                                        {uploadFile.status === 'success' && (
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        )}
                                        {uploadFile.status === 'error' && (
                                            <AlertCircle className="w-5 h-5 text-destructive" />
                                        )}
                                        {(uploadFile.status === 'pending' || uploadFile.status === 'error') && !uploading && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFile(uploadFile.id)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload Button */}
                {files.length > 0 && pendingCount > 0 && (
                    <Button
                        onClick={handleUploadAll}
                        disabled={uploading}
                        className="w-full"
                        size="lg"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Uploading {successCount}/{files.length}...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5 mr-2" />
                                Upload {pendingCount} File{pendingCount !== 1 ? 's' : ''}
                            </>
                        )}
                    </Button>
                )}

                {files.length > 0 && pendingCount === 0 && (
                    <div className="text-center p-8 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">All Files Uploaded!</h3>
                        <p className="text-muted-foreground mb-4">
                            Your photos and videos have been successfully uploaded to the event folder.
                        </p>
                        <Button onClick={() => navigate(`/events/${slug}`)}>
                            View Event Details
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
