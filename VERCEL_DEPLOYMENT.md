# Complete Vercel Deployment Guide

## 🚀 Step-by-Step Deployment Instructions

### Prerequisites
- GitHub account
- Vercel account (free tier is perfect)
- Udemy Instructor API tokens

---

## Step 1: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

Or use the web interface (easier for first-time deployment).

---

## Step 2: Push Code to GitHub

Your code is already pushed to:
```
https://github.com/yatricloud/certification.yatricloud.com.git
```

Make sure all changes are committed and pushed:
```bash
git add .
git commit -m "Add Vercel serverless functions"
git push origin main
```

---

## Step 3: Deploy on Vercel

### Option A: Deploy via Vercel Website (Recommended for First Time)

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub

2. **Import Project**
   - Click **"Add New..."** → **"Project"**
   - Select your GitHub repository: `yatricloud/certification.yatricloud.com`
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

4. **Add Environment Variables**
   Click **"Environment Variables"** and add:
   
   ```
   UDEMY_INSTRUCTOR_TOKEN=your_yatharth_token_here
   UDEMY_INSTRUCTOR_TOKEN_NENSI=your_nensi_token_here
   ```
   
   ⚠️ **Important**: 
   - Don't include `bearer` prefix in tokens
   - Keep these secret - never commit to GitHub
   - Add for all environments: Production, Preview, Development

5. **Deploy**
   - Click **"Deploy"**
   - Wait 2-3 minutes for build to complete
   - Your site will be live at: `https://your-project-name.vercel.app`

### Option B: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy (first time - will ask questions)
vercel

# Deploy to production
vercel --prod
```

---

## Step 4: Verify Deployment

1. **Check Frontend**
   - Visit your Vercel URL
   - Homepage should load

2. **Test API Endpoints**
   - Visit: `https://your-project.vercel.app/api/udemy/courses`
   - Should return JSON with courses
   - If you see an error, check environment variables

3. **Test Image Proxy**
   - Visit: `https://your-project.vercel.app/api/udemy/image/test-slug`
   - Should return image or 404 (which is fine for test)

---

## Step 5: Set Up Custom Domain (Optional)

1. **In Vercel Dashboard**
   - Go to your project → **Settings** → **Domains**
   - Click **"Add Domain"**
   - Enter: `certification.yatricloud.com`

2. **Update DNS Records**
   - Vercel will show you DNS records to add
   - Go to your domain registrar (where you manage yatricloud.com)
   - Add a CNAME record:
     ```
     Type: CNAME
     Name: certification
     Value: cname.vercel-dns.com
     ```
   - Or use A record if CNAME not supported

3. **Wait for DNS Propagation**
   - Usually takes 5-60 minutes
   - Vercel will automatically provision SSL certificate

---

## Step 6: Environment Variables Reference

### Required Variables:
```
UDEMY_INSTRUCTOR_TOKEN=your_token_here
```

### Optional Variables:
```
UDEMY_INSTRUCTOR_TOKEN_NENSI=your_nensi_token_here
```

### How to Get Udemy Tokens:
1. Go to: https://www.udemy.com/instructor/account/api/
2. Generate Instructor API token
3. Copy the token (starts with something like `xxxxx...`)
4. Paste into Vercel environment variables

---

## Troubleshooting

### ❌ Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Try: `npm install` locally to check for errors

### ❌ API Returns 500 Error
- Check environment variables are set correctly
- Verify tokens don't have `bearer` prefix
- Check Vercel function logs in dashboard

### ❌ Images Not Loading
- Check image proxy endpoint: `/api/udemy/image/[slug]`
- Verify course slugs are correct
- Check Vercel function logs

### ❌ CORS Errors
- Already handled in serverless functions
- If still seeing errors, check browser console

### ❌ Courses Not Showing
- Test API endpoint directly: `/api/udemy/courses`
- Check Vercel function logs
- Verify tokens are valid

---

## Project Structure for Vercel

```
your-project/
├── api/                    # Vercel serverless functions
│   └── udemy/
│       ├── courses.ts      # Main courses API
│       └── image/
│           └── [courseSlug].ts  # Image proxy
├── src/                    # Frontend React app
├── dist/                   # Build output (auto-generated)
├── vercel.json            # Vercel configuration
└── package.json
```

---

## Free Tier Limits

✅ **What's Included:**
- 100 GB bandwidth/month
- 100 GB-hours serverless function execution
- Unlimited deployments
- Automatic HTTPS
- Custom domains
- Preview deployments for every commit

⚠️ **Limits:**
- 10-second function timeout (Hobby plan)
- 50 MB function size limit
- Functions may have cold starts (first request ~1-2 seconds)

---

## Next Steps After Deployment

1. ✅ Test all features
2. ✅ Set up custom domain
3. ✅ Monitor Vercel dashboard for errors
4. ✅ Set up analytics (optional)
5. ✅ Configure automatic deployments from GitHub

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Discord**: https://vercel.com/discord
- **GitHub Issues**: Create issue in your repo

---

## Quick Commands Reference

```bash
# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs

# Pull environment variables
vercel env pull .env.local
```

---

**🎉 You're all set! Your site should be live on Vercel!**

