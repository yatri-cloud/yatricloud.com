import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Upload, Trash2, Loader2, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import {
    uploadEventGalleryMedia,
    listEventGalleryMedia,
    deleteEventGalleryMedia,
    type EventGalleryItem,
} from "@/lib/events-api";
import { fetchMyProfile } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

/**
 * Admin gallery manager for a (past) event — reached from AdminEvents "Manage
 * Gallery". Multi-select upload into the PRIVATE event-gallery bucket +
 * event_media rows (migration 074); only attendees of the event can later view
 * these photos. RLS enforces admin-only writes regardless of this UI gate.
 */
export default function EventMediaUpload() {
    const { slug } = useParams<{ slug: string }>();
    const { toast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [event, setEvent] = useState<{ id: string; name: string } | null>(null);
    const [items, setItems] = useState<EventGalleryItem[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            const profile = await fetchMyProfile();
            const admin = profile?.role === "admin";
            if (!active) return;
            setIsAdmin(admin);
            if (slug) {
                const { data } = await supabase.from("events").select("id, name").eq("slug", slug).maybeSingle();
                if (active && data) {
                    setEvent(data as { id: string; name: string });
                    if (admin) setItems(await listEventGalleryMedia((data as { id: string }).id));
                }
            }
            if (active) setLoading(false);
        })();
        return () => { active = false; };
    }, [slug]);

    const handleFiles = async (files: FileList | null) => {
        if (!files?.length || !event) return;
        setUploading(true);
        const { uploaded, error } = await uploadEventGalleryMedia(event.id, Array.from(files));
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
        if (error) {
            toast({ title: "Upload failed", description: error, variant: "destructive" });
            return;
        }
        toast({ title: `Uploaded ${uploaded} file${uploaded !== 1 ? "s" : ""}`, description: "Attendees can now see these in the event gallery." });
        setItems(await listEventGalleryMedia(event.id));
    };

    const handleDelete = async (item: EventGalleryItem) => {
        const { ok, error } = await deleteEventGalleryMedia(item.id, item.path);
        if (ok) setItems((prev) => prev.filter((i) => i.id !== item.id));
        else toast({ title: "Delete failed", description: error, variant: "destructive" });
    };

    if (loading) {
        return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }
    if (!isAdmin) {
        return (
            <div className="mx-auto max-w-md px-4 py-24 text-center">
                <Lock className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="font-semibold text-foreground">Admins only</p>
                <p className="mt-1 text-sm text-muted-foreground">The event gallery is managed by the Yatri Cloud team.</p>
            </div>
        );
    }
    if (!event) {
        return <div className="mx-auto max-w-md px-4 py-24 text-center text-muted-foreground">Event not found.</div>;
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-10">
            <Link to="/admin/events" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4" /> Back to Events
            </Link>
            <h1 className="font-display text-2xl font-bold tracking-tight">Event Gallery — {event.name}</h1>
            <p className="mb-6 mt-1 text-muted-foreground">Upload photos and videos. Only Yatris who attended this event can view them.</p>

            <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                multiple
                data-testid="gallery-upload-input"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
            />
            <Button data-testid="gallery-upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading} className="min-h-[44px] rounded-xl">
                {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="mr-2 h-4 w-4" /> Upload photos</>}
            </Button>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4" data-testid="admin-gallery-grid">
                {items.map((item) => (
                    <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                        {item.mediaType === "photo"
                            ? <img src={item.url} alt="" className="h-full w-full object-cover" />
                            : <video src={item.url} className="h-full w-full object-cover" />}
                        <button
                            data-testid="gallery-item-delete"
                            onClick={() => handleDelete(item)}
                            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                            aria-label="Delete photo"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
            {items.length === 0 && <p className="mt-8 text-center text-muted-foreground">No photos yet — upload the first ones above.</p>}
        </div>
    );
}
