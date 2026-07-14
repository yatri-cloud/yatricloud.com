import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Bold, Italic, Heading2, Quote, Code, List, Link2, Image as ImageIcon, Loader2, Eye, PenLine, Send, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getUserId, createPost, getMyPost, updatePost, publishPost, unpublishPost, deletePost, setPostTags,
  readingMinutes, type MyPost,
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
    if (id && await publishPost(id, content)) {
      const { data } = await supabase.from("blog_posts").select("slug").eq("id", id).single();
      toast.success("Published! 🎉");
      navigate(`/blog/${data?.slug}`);
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
      <main className="container mx-auto max-w-3xl px-4 pb-20 pt-24 md:px-6">
        {/* Top bar */}
        <div className="sticky top-16 z-20 -mx-4 mb-4 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:top-20">
          <span className="text-xs text-muted-foreground">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Draft saved" : "Draft"} {status === "published" && "· Published"}
          </span>
          <div className="flex items-center gap-2">
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
            <Input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Cover image URL (optional)" className="rounded-xl" />

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
              {TOOLBAR.map(({ icon: Icon, label, wrap, sample }) => (
                <button key={label} type="button" title={label} onClick={() => insert(wrap, sample)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground">
                  <Icon className="h-4 w-4" />
                </button>
              ))}
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
