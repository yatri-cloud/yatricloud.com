import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Upload, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getUserId, getMyWriterProfile, updateMyWriterProfile, uploadBlogMedia } from "@/lib/blog-api";

const BlogSettings = () => {
  const navigate = useNavigate();
  const photoRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const id = await getUserId();
      setSignedIn(!!id); setUid(id);
      if (id) { const p = await getMyWriterProfile(); if (p) { setName(p.full_name || ""); setBio(p.bio || ""); setPhoto(p.photo_url || ""); } }
      setReady(true);
    })();
  }, []);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const url = await uploadBlogMedia(file);
    setUploading(false);
    if (url) { setPhoto(url); toast.success("Photo uploaded"); } else toast.error("Upload failed (images only, ≤10MB)");
  };

  const save = async () => {
    if (!name.trim()) { toast.error("Name can't be empty"); return; }
    setSaving(true);
    const ok = await updateMyWriterProfile({ full_name: name.trim(), bio: bio.trim(), photo_url: photo.trim() || undefined });
    setSaving(false);
    if (ok) { toast.success("Profile saved"); if (uid) navigate(`/blog/author/${uid}`); }
    else toast.error("Could not save");
  };

  if (!ready) return <div className="min-h-screen bg-background"><Navbar /><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div></div>;

  if (!signedIn) return (
    <div className="min-h-screen bg-background text-foreground"><Navbar />
      <main className="container mx-auto max-w-lg px-4 py-32 text-center">
        <User className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-bold">Sign in to edit your writer profile</h1>
        <Button asChild className="mt-6 rounded-full"><Link to="/certifiedyatris">Sign in</Link></Button>
      </main><Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Writer profile | Yatri Blog" noindex />
      <Navbar />
      <main className="container mx-auto max-w-xl px-4 pb-20 pt-28 md:px-6">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Your writer profile</h1>
        <p className="mt-1 text-muted-foreground">This is your byline across every story you publish.</p>

        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }} />

        <div className="mt-8 space-y-5">
          <div className="flex items-center gap-4">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-primary">
              {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : (name || "Y").slice(0, 1).toUpperCase()}
            </span>
            <Button type="button" variant="outline" onClick={() => photoRef.current?.click()} disabled={uploading} className="rounded-xl">
              {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />} Upload photo
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="w-name">Display name</Label>
            <Input id="w-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="w-bio">Bio</Label>
            <Textarea id="w-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} placeholder="A line about you — what you write about and where you're headed." className="min-h-[90px] rounded-xl" />
            <p className="text-right text-xs text-muted-foreground">{bio.length}/280</p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={save} disabled={saving} className="rounded-full shadow-inset-btn">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save profile</Button>
            {uid && <Button asChild variant="outline" className="rounded-full"><Link to={`/blog/author/${uid}`}>View public profile</Link></Button>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogSettings;
