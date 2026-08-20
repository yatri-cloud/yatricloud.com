export interface YouTubeVideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
}

export interface YouTubeChannelStats {
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
}

const FALLBACK_VIDEOS: YouTubeVideoItem[] = [
  {
    id: "nVrhtHpawTI",
    title: "NEW: FREE Redis Certification in 2026 | Software Engineers | Cloud Engineers",
    description: "Looking for a FREE Redis Certification in 2026? Redis is widely used for caching, real-time applications, and cloud architecture.",
    thumbnail: "https://i.ytimg.com/vi/nVrhtHpawTI/hqdefault.jpg",
    publishedAt: "2026-08-19T13:32:36Z",
    channelTitle: "Yatri Cloud",
  },
  {
    id: "2PX7OebPgtA",
    title: "New Oracle Agentic AI Foundations Associate Certification for FREE",
    description: "Get 100% FREE Oracle Agentic AI Foundations Associate Certification with official voucher guidance.",
    thumbnail: "https://i.ytimg.com/vi/2PX7OebPgtA/hqdefault.jpg",
    publishedAt: "2026-06-23T11:50:45Z",
    channelTitle: "Yatri Cloud",
  },
  {
    id: "6l7Qn9cIeXw",
    title: "AWS Certified AI Practitioner (AIF-C01) Complete Prep & Voucher Guide",
    description: "Master AWS Certified AI Practitioner with exam breakdowns, practice dumps, and 50% discount voucher scheduling.",
    thumbnail: "https://i.ytimg.com/vi/6l7Qn9cIeXw/hqdefault.jpg",
    publishedAt: "2026-05-15T10:00:00Z",
    channelTitle: "Yatri Cloud",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "AWS Solutions Architect Associate SAA-C03 First-Attempt Pass Strategy",
    description: "Step-by-step roadmap to crack AWS SAA-C03 in 30 days with verified practice questions and hands-on labs.",
    thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    publishedAt: "2026-04-10T12:00:00Z",
    channelTitle: "Yatri Cloud",
  },
  {
    id: "3JZ_D3ELwOQ",
    title: "Azure Fundamentals AZ-900 Full Course & Exam Preparation",
    description: "Everything you need to know to pass Microsoft Azure Fundamentals AZ-900 on your first attempt.",
    thumbnail: "https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg",
    publishedAt: "2026-03-20T14:30:00Z",
    channelTitle: "Yatri Cloud",
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "How to Schedule AWS Exam with 50% Discount Voucher Step-by-Step",
    description: "Guided walkthrough to apply your official AWS 50% voucher on Pearson VUE smoothly.",
    thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    publishedAt: "2026-02-14T09:00:00Z",
    channelTitle: "Yatri Cloud",
  },
];

const CACHE_KEY = "yc_youtube_videos_v2";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function isShorts(title: string, desc: string): boolean {
  const text = `${title} ${desc}`.toLowerCase();
  return (
    text.includes("#shorts") ||
    text.includes("#short") ||
    text.includes("/shorts/") ||
    text.includes("shorts")
  );
}

/**
 * Fetches latest YouTube videos for Yatri Cloud, filtering out YouTube Shorts.
 */
export async function fetchLatestYouTubeVideos(maxResults: number = 3): Promise<YouTubeVideoItem[]> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || "AIzaSyBrml7unBj-8iZosshBkqk00MGxZUSyd2o";
  const channelId = import.meta.env.VITE_YOUTUBE_CHANNEL_ID || "UC0-tQsJ6S9mp2FYiaunFCYw";

  // Check localStorage cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.videos) && parsed.videos.length > 0) {
        return parsed.videos.slice(0, maxResults);
      }
    }
  } catch {
    // Ignore cache read errors
  }

  if (!apiKey) {
    return FALLBACK_VIDEOS.slice(0, maxResults);
  }

  try {
    // Fetch top 15 candidates so after filtering out shorts we have plenty of full-length videos
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=15&order=date&type=video&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      return FALLBACK_VIDEOS.slice(0, maxResults);
    }
    const data = await res.json();

    if (!data.items || !Array.isArray(data.items)) {
      return FALLBACK_VIDEOS.slice(0, maxResults);
    }

    const nonShortsVideos: YouTubeVideoItem[] = data.items
      .filter((item: any) => {
        if (!item.id?.videoId) return false;
        const title = item.snippet?.title || "";
        const desc = item.snippet?.description || "";
        return !isShorts(title, desc);
      })
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet?.title || "Yatri Cloud Video",
        description: item.snippet?.description || "",
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
        publishedAt: item.snippet?.publishedAt || "",
        channelTitle: item.snippet?.channelTitle || "Yatri Cloud",
      }));

    if (nonShortsVideos.length > 0) {
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            videos: nonShortsVideos,
          })
        );
      } catch {
        // Ignore cache write error
      }
      return nonShortsVideos.slice(0, maxResults);
    }

    return FALLBACK_VIDEOS.slice(0, maxResults);
  } catch {
    return FALLBACK_VIDEOS.slice(0, maxResults);
  }
}
