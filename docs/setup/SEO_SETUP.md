# SEO & Social Sharing Setup Guide

## ✅ What's Already Done

- ✅ Comprehensive meta tags in `index.html`
- ✅ Open Graph tags for Facebook/LinkedIn
- ✅ Twitter Card tags
- ✅ Structured Data (JSON-LD) for better search results
- ✅ Dynamic SEO component for different pages
- ✅ Sitemap.xml created
- ✅ Robots.txt optimized
- ✅ Site manifest for PWA

## 🖼️ Create Social Sharing Image (OG Image)

You need to create an **og-image.png** file (1200x630px) for social sharing.

### Option 1: Use Online Tool
1. Go to: https://www.canva.com or https://www.figma.com
2. Create image: **1200 x 630 pixels**
3. Include:
   - Yatri Cloud logo
   - Text: "Free Cloud Certification Practice Tests"
   - Subtitle: "AWS • Azure • GCP • DevOps • Kubernetes"
   - Background: Use your brand colors
4. Export as PNG
5. Save as: `public/og-image.png`

### Option 2: Use AI Tool
- Use DALL-E, Midjourney, or similar
- Prompt: "Create a professional social media image 1200x630px for Yatri Cloud certification practice tests, modern design with blue gradient background"

### Option 3: Quick Template
You can use this design:
- Background: Blue gradient (#007CFF to #0052CC)
- Logo: Yatri Cloud logo (centered top)
- Title: "Free Cloud Certification Practice Tests" (white, bold, large)
- Subtitle: "Master AWS, Azure, GCP, DevOps & More" (white, medium)
- Bottom: "50K+ Learners • 4.8 Rating • Always Free"

## 📁 File Structure

```
public/
├── og-image.png          # 1200x630px (YOU NEED TO CREATE THIS)
├── sitemap.xml          # ✅ Created
├── robots.txt           # ✅ Updated
└── site.webmanifest     # ✅ Created
```

## 🔍 SEO Features Included

### 1. Meta Tags
- Title, description, keywords
- Author, robots, language
- Theme color, mobile app tags

### 2. Open Graph (Facebook/LinkedIn)
- og:title, og:description
- og:image (1200x630px)
- og:url, og:type, og:site_name

### 3. Twitter Cards
- Large image card
- Title, description, image
- Creator and site handles

### 4. Structured Data (JSON-LD)
- Organization schema
- Website schema with search action
- Course schema with ratings

### 5. Dynamic SEO Component
- Updates meta tags per page
- Automatic canonical URLs
- Page-specific titles/descriptions

## 🚀 After Creating og-image.png

1. **Place the file:**
   ```bash
   # Put og-image.png in public/ folder
   public/og-image.png
   ```

2. **Verify it's accessible:**
   - After deployment, visit: `https://certification.yatricloud.com/og-image.png`
   - Should load the image

3. **Test Social Sharing:**
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator
   - LinkedIn: Share a link and check preview

## 📊 SEO Checklist

- [x] Meta tags optimized
- [x] Open Graph tags added
- [x] Twitter Cards configured
- [x] Structured data (JSON-LD)
- [x] Sitemap.xml created
- [x] Robots.txt optimized
- [x] Canonical URLs set
- [x] Mobile-friendly tags
- [ ] **Create og-image.png** (YOU NEED TO DO THIS)
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools

## 🔗 Submit to Search Engines

### Google Search Console
1. Go to: https://search.google.com/search-console
2. Add property: `certification.yatricloud.com`
3. Verify ownership
4. Submit sitemap: `https://certification.yatricloud.com/sitemap.xml`

### Bing Webmaster Tools
1. Go to: https://www.bing.com/webmasters
2. Add site: `certification.yatricloud.com`
3. Verify ownership
4. Submit sitemap

## 🧪 Test Your SEO

### Meta Tags
```bash
# Check meta tags
curl -I https://certification.yatricloud.com
```

### Open Graph
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

### Twitter Cards
- Card Validator: https://cards-dev.twitter.com/validator

### Structured Data
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/

## 📝 Current SEO Settings

- **Title**: "Yatri Cloud – Free Cloud Certification Practice Tests & Exam Prep"
- **Description**: "Master AWS, Azure, GCP, DevOps, Kubernetes, and Terraform certifications with free practice tests from Yatri Cloud. 50K+ learners trust us."
- **Keywords**: Comprehensive list of certification-related terms
- **Image**: Will use `/og-image.png` (needs to be created)

## 🎨 OG Image Design Tips

1. **Size**: Exactly 1200x630px
2. **Text**: Keep it readable, use large fonts
3. **Logo**: Include Yatri Cloud logo prominently
4. **Colors**: Match your brand (blue theme)
5. **Content**: Highlight key value propositions
6. **Format**: PNG with transparency or solid background

---

**Once you create og-image.png and place it in public/, your SEO setup will be complete! 🎉**

