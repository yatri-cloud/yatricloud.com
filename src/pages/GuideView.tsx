import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Info, ChevronRight, Home, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ADMIN_GUIDE_CONTENT, USER_GUIDE_CONTENT, ADMIN_URL_SITE_MAP, USER_URL_SITE_MAP } from "@/data/guides-content";
import { getGuide, useSiteContent, type Guide } from "@/lib/site-content";

interface GuideViewProps {
  type: "admin" | "user" | "admin-access" | "user-access";
}

/* Each view type maps to a row in the `guides` table. */
const GUIDE_SLUGS: Record<GuideViewProps["type"], string> = {
  admin: "admin-guide",
  user: "user-guide",
  "admin-access": "admin-sitemap",
  "user-access": "user-sitemap",
};

const GuideView: React.FC<GuideViewProps> = ({ type }) => {
  const navigate = useNavigate();
  const fallbackContent =
    type === "admin"
      ? ADMIN_GUIDE_CONTENT
      : type === "user"
      ? USER_GUIDE_CONTENT
      : type === "admin-access"
      ? ADMIN_URL_SITE_MAP
      : USER_URL_SITE_MAP;

  /* Loads the guide body from Supabase, session cached; the local
   * constant renders first and stays in place if the fetch fails. */
  const guide = useSiteContent<Guide | null>(() => getGuide(GUIDE_SLUGS[type]), null);
  const content = guide?.body_md ?? fallbackContent;

  const title =
    type === "admin"
      ? "Admin Guide"
      : type === "user"
      ? "User Guide"
      : type === "admin-access"
      ? "Admin Sitemap"
      : "User Sitemap";

  // The banner is what made the guide and the sitemap look identical, so make
  // it speak to what each page actually is.
  const isSitemap = type === "admin-access" || type === "user-access";
  const bannerHeading = isSitemap ? "Site map" : "Standard Operations Guide";
  const bannerText = isSitemap
    ? "A complete map of every page on this side of Yatri Cloud, so you always know where to find things."
    : "A step by step guide to how Yatri Cloud works, from day to day tasks to how the platform is run.";

  // Unified ID generation to ensure TOC and Content match exactly
  const generateSlug = (text: string) => {
    return text
      .replace(/^[0-9.]+\s*/, "") // Remove leading numbers like "1. "
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .trim()
      .replace(/\s+/g, "-"); // Replace spaces with dashes
  };

  // Helper to extract text from React children (for markdown headers)
  const getTextContent = (children: any): string => {
    if (typeof children === "string") return children;
    if (Array.isArray(children)) return children.map(getTextContent).join("");
    if (children?.props?.children) return getTextContent(children.props.children);
    return "";
  };

  // Extract navigation items from markdown headings
  const toc = useMemo(() => {
    const lines = content.split("\n");
    return lines
      .filter((line) => line.startsWith("## "))
      .map((line) => {
        const text = line.replace("## ", "").trim();
        const cleanText = text.replace(/^[0-9.]+\s*/, "").trim();
        const id = generateSlug(text);
        return { text: cleanText, id };
      });
  }, [content]);

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="hidden sm:flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={type === "admin" || type === "admin-access" ? "/admin/events" : "/"}>
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-12">
          {/* Sidebar TOC - Sticky */}
          <aside className="hidden lg:block relative">
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center gap-2 font-bold mb-4 px-2 uppercase tracking-wider text-xs text-muted-foreground">
                <List className="w-3 h-3" />
                Documentation
              </div>
              <ScrollArea className="h-[calc(100vh-160px)]">
                <nav className="flex flex-col gap-1 pr-4">
                  {toc.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToId(item.id)}
                      className="text-left text-sm px-3 py-2 rounded-md hover:bg-primary/5 hover:text-primary transition-colors text-muted-foreground border-l-2 border-transparent hover:border-primary/30"
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              </ScrollArea>
            </div>
          </aside>

          {/* Main Content */}
          <div className="max-w-4xl">
            {/* Banner */}
            <div className="mb-10 p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                {isSitemap ? <List className="w-6 h-6 text-primary" /> : <Info className="w-6 h-6 text-primary" />}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-bold mb-1">{bannerHeading}</h2>
                <p className="text-muted-foreground text-sm">
                  {bannerText}
                </p>
              </div>
            </div>

            {/* Markdown Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:pt-4 prose-h2:scroll-mt-24 prose-h3:text-xl prose-h3:mt-10 prose-p:text-muted-foreground/90 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-li:text-muted-foreground/90 prose-ul:list-disc prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1 prose-code:rounded prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:p-4 prose-blockquote:rounded-r-lg">
              <ReactMarkdown
                components={{
                  h2: ({ node, ...props }) => {
                    const text = getTextContent(props.children);
                    const id = generateSlug(text);
                    return <h2 id={id} {...props} />;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>

            {/* Footer Navigation */}
            <div className="mt-20 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground italic">
                Need more help? Join our community hub for standard support.
              </p>
              <a href="https://discord.com/invite/92warrKq9j" target="_blank" rel="noopener noreferrer">
                <Button className="gap-2">
                  Technical Support
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideView;
