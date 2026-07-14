import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Bold, Italic, Heading2, Quote, Code, List, Link2, Image as ImageIcon, Loader2, Eye, PenLine, Send, Trash2, Upload, FileUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getUserId, createPost, getMyPost, updatePost, publishPost, unpublishPost, deletePost, setPostTags,
  readingMinutes, uploadBlogMedia, setSlugFromTitle, type MyPost,
} from "@/lib/blog-api";
import { supabase } from "@/lib/supabase";

const TOOLBAR = [
  { icon: Bold, label: "Bold", wrap: ["**", "**"], sample: "bold" },
  { icon: Italic, label: "Italic", wrap: ["_", "_"], sample: "italic" },
  { icon: Heading2, label: "Heading", wrap: ["\n## ", ""], sample: "Heading" },
  { icon: Quote, label: "Quote", wrap: ["\n> ", ""], sample: "quote" },
  { icon: Code, label: "Code", wrap: ["`", "`"], sample: "code" },
  { icon: List, label: "List", wrap: ["\n- ", ""], sample: "item" },
  { icon: Link2, label: "Link", wrap: ["[", "](https://)"], sample: "text" },
  { icon: ImageIcon, label: "Image", wrap: ["\n![alt](", ")"], sample: "https://" },
] as const;

const BlogWrite = () => {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<number | null>(null);
  const mdFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const imgFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<null | "cover" | "inline">(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [status, setStatus] = useState<MyPost["status"]>("draft");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [preview, setPreview] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [publishing, setPublishing] = useState(false);

  // Auth + load existing draft
  useEffect(() => {
    (async () => {
      const uid = await getUserId();
      setSignedIn(!!uid);
      setAuthChecked(true);
      if (!uid) return;
      if (editId) {
        const p = await getMyPost(editId);
        if (p) {
          setPostId(p.id); setStatus(p.status); setTitle(p.title); setSubtitle(p.subtitle ?? "");
          setCover(p.cover_image_url ?? ""); setContent(p.content ?? "");
          const { data } = await supabase.from("blog_post_tags").select("tag:blog_tags(label)").eq("post_id", p.id);
          setTagsInput((data ?? []).map((r: any) => r.tag?.label).filter(Boolean).join(", "));
        } else { toast.error("Draft not found"); navigate("/blog/write"); }
      }
    })();
  }, [editId]);

  // Debounced autosave (creates the draft on first keystroke, then updates)
  useEffect(() => {
    if (!signedIn || (!title.trim() && !content.trim())) return;
    setSaveState("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      let id = postId;
      if (!id) {
        const created = await createPost({ title, subtitle, content, cover_image_url: cover });
        if (created) { id = created.id; setPostId(created.id); }
      } else {
        await updatePost(id, { title, subtitle, content, cover_image_url: cover });
      }
      setSaveState("saved");
    }, 900);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [title, subtitle, cover, content, signedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Import a .md/.markdown file from the user's system.
  const importMarkdown = (file: File) => {
    if (!/\.(md|markdown|txt)$/i.test(file.name)) { toast.error("Choose a .md or .markdown file"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      // Pull an H1 as the title if the field is empty, then strip it from body.
      const h1 = text.match(/^\s*#\s+(.+)$/m);
      if (!title.trim()) setTitle(h1?.[1]?.trim() || file.name.replace(/\.(md|markdown|txt)$/i, ""));
      setContent(h1 ? text.replace(h1[0], "").trim() : text.trim());
      toast.success("Markdown imported");
    };
    reader.readAsText(file);
  };

  const uploadCover = async (file: File) => {
    setUploading("cover");
    const url = await uploadBlogMedia(file);
    setUploading(null);
    if (url) { setCover(url); toast.success("Cover uploaded"); } else toast.error("Upload failed (images only, ≤10MB)");
  };

  const uploadInlineImage = async (file: File) => {
    setUploading("inline");
    const url = await uploadBlogMedia(file);
    setUploading(null);
    if (!url) { toast.error("Upload failed (images only, ≤10MB)"); return; }
    const el = areaRef.current;
    const pos = el?.selectionStart ?? content.length;
    const md = `\n![${file.name.replace(/\.[^.]+$/, "")}](${url})\n`;
    setContent(content.slice(0, pos) + md + content.slice(pos));
    toast.success("Image inserted");
  };

  const insert = (wrap: readonly [string, string], sample: string) => {
    const el = areaRef.current; if (!el) return;
    const [s, e] = [el.selectionStart, el.selectionEnd];
    const chosen = content.slice(s, e) || sample;
    const next = content.slice(0, s) + wrap[0] + chosen + wrap[1] + content.slice(e);
    setContent(next);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = s + wrap[0].length + chosen.length + wrap[1].length; });
  };

  const savePersist = async (): Promise<string | null> => {
    let id = postId;
    if (!id) { const c = await createPost({ title, subtitle, content, cover_image_url: cover }); id = c?.id ?? null; setPostId(id); }
    else await updatePost(id, { title, subtitle, content, cover_image_url: cover });
    if (id) await setPostTags(id, tagsInput.split(",").map((t) => t.trim()).filter(Boolean));
    return id;
  };

  const onPublish = async () => {
    if (!title.trim()) { toast.error("Add a title first."); return; }
    if (content.trim().length < 30) { toast.error("Write a bit more before publishing."); return; }
    setPublishing(true);
    const id = await savePersist();
    if (!id) { toast.error("Could not publish"); setPublishing(false); return; }
    // First publish → give it a clean slug from the final title.
    let finalSlug = status === "draft" ? await setSlugFromTitle(id, title) : null;
    if (await publishPost(id, content)) {
      if (!finalSlug) { const { data } = await supabase.from("blog_posts").select("slug").eq("id", id).single(); finalSlug = data?.slug ?? null; }
      toast.success("Published! 🎉");
      navigate(`/blog/${finalSlug}`);
    } else { toast.error("Could not publish"); setPublishing(false); }
  };

  const onUnpublish = async () => { if (postId && await unpublishPost(postId)) { setStatus("draft"); toast.success("Moved to drafts"); } };
  const onDelete = async () => { if (postId && await deletePost(postId)) { toast.success("Deleted"); navigate("/blog"); } };

  if (!authChecked) return <div className="min-h-screen bg-background"><Navbar /><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div></div>;

  if (!signedIn) return (
    <div className="min-h-screen bg-background text-foreground"><Navbar />
      <main className="container mx-auto max-w-lg px-4 py-32 text-center">
        <PenLine className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-bold">Sign in to start writing</h1>
        <p className="mt-2 text-muted-foreground">Share your cloud journey, exam playbooks, and lessons with the Yatri community.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/certifiedyatris">Sign in to write</Link></Button>
      </main><Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Write a story | Yatri Blog" noindex />
      <Navbar />
      {/* Hidden file inputs for .md import + image uploads */}
      <input ref={mdFileRef} type="file" accept=".md,.markdown,.txt,text/markdown" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importMarkdown(f); e.target.value = ""; }} />
      <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }} />
      <input ref={imgFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadInlineImage(f); e.target.value = ""; }} />
      <main className="container mx-auto max-w-3xl px-4 pb-20 pt-24 md:px-6">
        {/* Top bar */}
        <div className="sticky top-16 z-20 -mx-4 mb-4 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:top-20">
          <span className="text-xs text-muted-foreground">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Draft saved" : "Draft"} {status === "published" && "· Published"}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => mdFileRef.current?.click()} className="rounded-full" title="Import a Markdown file"><FileUp className="mr-1.5 h-4 w-4" /> Import .md</Button>
            <Button size="sm" variant="ghost" onClick={() => setPreview((p) => !p)} className="rounded-full"><Eye className="mr-1.5 h-4 w-4" /> {preview ? "Edit" : "Preview"}</Button>
            {status === "published" ? (
              <Button size="sm" variant="outline" onClick={onUnpublish} className="rounded-full">Unpublish</Button>
            ) : (
              <Button size="sm" onClick={onPublish} disabled={publishing} className="rounded-full shadow-inset-btn">{publishing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />} Publish</Button>
            )}
            {postId && <Button size="icon" variant="ghost" onClick={onDelete} className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>}
          </div>
        </div>

        {preview ? (
          <article className="prose prose-slate mt-4 max-w-none dark:prose-invert prose-headings:font-display">
            <h1>{title || "Untitled"}</h1>
            {subtitle && <p className="lead text-muted-foreground">{subtitle}</p>}
            {cover && <img src={cover} alt="" className="rounded-xl" />}
            <ReactMarkdown>{content || "_Nothing to preview yet._"}</ReactMarkdown>
          </article>
        ) : (
          <div className="space-y-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full bg-transparent font-display text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40 md:text-4xl" />
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle (optional)" className="w-full bg-transparent text-lg text-muted-foreground outline-none placeholder:text-muted-foreground/40" />
            {cover && <img src={cover} alt="cover preview" className="max-h-56 w-full rounded-xl object-cover" />}
            <div className="flex gap-2">
              <Input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Cover image URL — or upload →" className="rounded-xl" />
              <Button type="button" variant="outline" onClick={() => coverFileRef.current?.click()} disabled={uploading === "cover"} className="shrink-0 rounded-xl">
                {uploading === "cover" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />} Upload cover
              </Button>
              {cover && <Button type="button" variant="ghost" onClick={() => setCover("")} className="shrink-0 rounded-xl text-muted-foreground">Clear</Button>}
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
              {TOOLBAR.map(({ icon: Icon, label, wrap, sample }) => (
                <button key={label} type="button" title={label === "Image" ? "Insert image link" : label} onClick={() => insert(wrap, sample)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground">
                  <Icon className="h-4 w-4" />
                </button>
              ))}
              <button type="button" title="Upload image from your device" onClick={() => imgFileRef.current?.click()} className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground">
                {uploading === "inline" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
              </button>
              <span className="ml-auto px-2 text-xs text-muted-foreground">{readingMinutes(content)} min read</span>
            </div>

            <textarea ref={areaRef} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tell your story… (Markdown supported)"
              className="min-h-[420px] w-full resize-y rounded-xl border border-border bg-card p-4 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring" />

            <div>
              <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Tags — comma separated, up to 5 (e.g. AWS, Career, AZ-104)" className="rounded-xl" />
              <p className="mt-1.5 text-xs text-muted-foreground">Good tags help Yatris discover your story.</p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogWrite;
