/**
 * Fetch course image from Udemy course URL
 * This function attempts to get the course image by fetching the course page
 */

export async function fetchCourseImageFromUrl(courseUrl: string): Promise<string | null> {
  try {
    // Extract course slug from URL
    const urlMatch = courseUrl.match(/\/course\/([^\/]+)/);
    if (!urlMatch || !urlMatch[1]) {
      return null;
    }

    const courseSlug = urlMatch[1].replace(/\/$/, '');
    
    // Try multiple Udemy CDN image URL patterns
    const imageUrls = [
      `https://img-c.udemycdn.com/course/480x270/${courseSlug}/`,
      `https://img-c.udemycdn.com/course/240x135/${courseSlug}/`,
      `https://img-c.udemycdn.com/course/750x422/${courseSlug}/`,
      `https://img-c.udemycdn.com/course/125_H/${courseSlug}/`,
    ];

    // Try to verify which image URL works
    for (const imageUrl of imageUrls) {
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (response.ok) {
          return imageUrl;
        }
      } catch (error) {
        // Continue to next URL
        continue;
      }
    }

    // If none work, return the most common one (480x270)
    return imageUrls[0];
  } catch (error) {
    console.error('Error fetching course image:', error);
    return null;
  }
}

/**
 * Get course image URL from course slug
 * This is a simpler version that just constructs the URL
 */
export function getCourseImageUrl(courseUrl: string, size: '480x270' | '240x135' | '750x422' = '480x270'): string {
  const urlMatch = courseUrl.match(/\/course\/([^\/]+)/);
  if (!urlMatch || !urlMatch[1]) {
    return '';
  }

  const courseSlug = urlMatch[1].replace(/\/$/, '');
  return `https://img-c.udemycdn.com/course/${size}/${courseSlug}/`;
}

