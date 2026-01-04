# Udemy Courses Google Sheets Setup Guide

This guide explains how to set up Google Sheets and Apps Scripts for managing Udemy courses.

## Overview

The system uses two separate Google Sheets:
1. **Yatharth Chauhan's Courses**: `udemy-yatharth-chauhan`
2. **Nensi Ravaliya's Courses**: `udemy-nensi-ravaliya`

Each sheet has its own Google Apps Script that handles form submissions and data retrieval.

## Google Sheets Setup

### Sheet 1: Yatharth Chauhan
- **Sheet ID**: `1nQFIH00eNhTqUWmZ7ixq8GFP59Kh-cvEmY-eNA5Kxtw`
- **Sheet Name**: `udemy-yatharth-chauhan`
- **URL**: https://docs.google.com/spreadsheets/d/1nQFIH00eNhTqUWmZ7ixq8GFP59Kh-cvEmY-eNA5Kxtw/edit?gid=0#gid=0

### Sheet 2: Nensi Ravaliya
- **Sheet ID**: `1Z6bGUMMIoPfWpKXE6xUnAFFp6dBSPP6VSvXUO0rLNz8`
- **Sheet Name**: `udemy-nensi-ravaliya`
- **URL**: https://docs.google.com/spreadsheets/d/1Z6bGUMMIoPfWpKXE6xUnAFFp6dBSPP6VSvXUO0rLNz8/edit?gid=0#gid=0

### Sheet Structure

Both sheets should have the following columns (headers in row 1):

| Column | Description |
|--------|-------------|
| Timestamp | Auto-generated timestamp |
| Course Title | Full course title |
| Course Link | Udemy course URL |
| Image Link | Course thumbnail image URL |
| Creator | Creator name (yatharth-chauhan or nensi-ravaliya) |
| Tech | Technology name (aws, azure, gcp, etc.) |
| Category | Category (cloud, devops, ai, etc.) |

## Google Apps Script Setup

### Step 1: Create Apps Script for Yatharth Chauhan

1. Open the Yatharth Chauhan Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Delete any existing code
4. Copy and paste the contents of `appscript/udemy-yatharth-chauhan.gs`
5. Click **Save** (💾)
6. Click **Deploy** → **New deployment**
7. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
8. Configure:
   - **Description**: "Udemy Courses - Yatharth Chauhan"
   - **Execute as**: Me
   - **Who has access**: Anyone
9. Click **Deploy**
10. Copy the **Web app URL** (looks like: `https://script.google.com/macros/s/.../exec`)
11. Add this URL to your `.env` file as `VITE_UDEMY_YATHARTH_WEBHOOK_URL`

### Step 2: Create Apps Script for Nensi Ravaliya

1. Open the Nensi Ravaliya Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Delete any existing code
4. Copy and paste the contents of `appscript/udemy-nensi-ravaliya.gs`
5. Click **Save** (💾)
6. Click **Deploy** → **New deployment**
7. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
8. Configure:
   - **Description**: "Udemy Courses - Nensi Ravaliya"
   - **Execute as**: Me
   - **Who has access**: Anyone
9. Click **Deploy**
10. Copy the **Web app URL**
11. Add this URL to your `.env` file as `VITE_UDEMY_NENSI_WEBHOOK_URL`

## Environment Variables

Add these to your `.env` file:

```env
VITE_UDEMY_YATHARTH_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_YATHARTH_WEBHOOK_URL/exec
VITE_UDEMY_NENSI_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_NENSI_WEBHOOK_URL/exec
```

**Important**: 
- Restart your dev server after adding these variables
- Never commit `.env` to git (it's already in `.gitignore`)

## Form Submission

The form on `/udemy` page will:
1. Route submissions to the correct webhook based on selected creator
2. Store data in the appropriate Google Sheet
3. Display courses in the course section automatically

## Data Flow

1. **Form Submission** (`/udemy` page)
   - User fills form and selects creator
   - Data is sent to appropriate webhook (Yatharth or Nensi)
   - Google Apps Script adds data to the sheet

2. **Course Display** (Course Section)
   - Fetches courses from both sheets
   - Combines and displays them
   - Filters work by creator, tech, and category

## Troubleshooting

### Courses not appearing
- Check that webhook URLs are correct in `.env`
- Verify Google Apps Scripts are deployed as web apps with "Anyone" access
- Check browser console for errors
- Verify sheet names match exactly: `udemy-yatharth-chauhan` and `udemy-nensi-ravaliya`

### CORS Errors
- Ensure Apps Scripts are deployed as web apps (not library)
- Verify "Who has access" is set to "Anyone"
- Check that `doOptions()` function exists in Apps Script

### Form submission fails
- Check webhook URL is correct
- Verify sheet ID matches in Apps Script
- Check Apps Script execution logs for errors

