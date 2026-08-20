import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import { fetchLatestYouTubeVideos, type YouTubeVideoItem } from "@/lib/youtube-api";

export const YouTubeVideosSection = () => {
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideoItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchLatestYouTubeVideos(3).then((vids) => {
      if (active) {
        setVideos(vids.slice(0, 3));
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Background ambient accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-red-500/5 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[120px]"
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-7xl">
        {/* Header */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-[1.05] text-foreground">
                Learn with our <span className="gradient-text">Latest Videos</span>
              </h2>
              <p className="mt-4 text-muted-foreground text-base md:text-lg">
                Get Your FREE Certification Voucher Now.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://www.youtube.com/@yatricloud?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-card hover:bg-muted border border-border text-foreground font-semibold text-sm shadow-xs transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1280px-YouTube_full-color_icon_%282017%29.svg.png"
                  alt="YouTube"
                  className="w-5 h-auto object-contain"
                />
                <span>Subscribe on YouTube</span>
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {videos.map((video, index) => (
            <ScrollReveal key={video.id || index} delay={index * 0.08}>
              {/* Outer wrapper with relative position for the glow layer */}
              <div
                onClick={() => setSelectedVideo(video)}
                className="group relative h-full rounded-2xl cursor-pointer"
              >
                {/* Subtle blue glow layer */}
                <div
                  className="absolute -inset-0.5 z-0 opacity-0 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none rounded-[22px] bg-primary/40 blur-lg"
                />

                {/* Card content on top of glow */}
                <div className="relative z-10 flex flex-col h-full rounded-2xl overflow-hidden bg-card border border-border/80 transition-all duration-300">
                  {/* Thumbnail container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                      }}
                    />

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-col flex-1 p-5 md:p-6 justify-start">
                    <h3 className="font-display font-bold text-base md:text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Footer CTA */}
        <ScrollReveal delay={0.2}>
          <div className="mt-10 md:mt-14 text-center">
            <Button asChild size="lg" className="rounded-xl px-7 text-sm md:text-base font-semibold shadow-xs">
              <a
                href="https://www.youtube.com/@yatricloud"
                target="_blank"
                rel="noopener noreferrer"
              >
                View All Videos on YouTube
              </a>
            </Button>
          </div>
        </ScrollReveal>
      </div>

      {/* Video Modal Player */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVideo(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* YouTube Iframe Player — full bleed, no header/footer */}
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id}?autoplay=1&rel=0`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default YouTubeVideosSection;
