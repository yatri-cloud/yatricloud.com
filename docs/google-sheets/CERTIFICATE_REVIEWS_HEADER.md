# Sheet: yatri-certifications-reviews

Subsheet (tab): `certificates-reviews`

Expected header row (first row) for `certificates-reviews`:

| Column | Key | Description |
|---|---|---|
| A | timestamp | When the review was submitted (Date) |
| B | name | Reviewer's name |
| C | feedback | The review text |
| D | rating | Numeric rating (1-5) |
| E | linkedinProfile | URL to LinkedIn profile |
| F | source | Optional source label (web, form, import) |

## Environment Variables

Add to `.env.local` for development or deployment:

```env
VITE_CERTIFICATE_REVIEWS_APPS_SCRIPT_URL=https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercss
```

To get the `DEPLOYMENT_ID`:
1. Open `appscript/certificates-reviews.gs` in Google Apps Script editor
2. Click **Deploy** → **New Deployment**
3. Select type: **Web App**
4. Set **Execute as**: Your Google Account
5. Set **Who has access**: **Anyone**
6. Copy the deployment URL from the dialog
7. Extract the ID between `/d/` and `/usercss` and add it to `.env.local`

## Usage Notes

- The included Apps Script `appscript/certificates-reviews.gs` will create the subsheet and set this header row if missing.
- The script exposes `doPost(e)` so external forms or webhooks can POST JSON to append rows. JSON keys should match the `Key` column names above.
- For manual testing, open the spreadsheet and use the custom menu `Yatri Reviews → Add Sample Review`.
- Front-end forms should POST to the Apps Script deployment URL with the body: `{ name, feedback, rating, linkedinProfile, source }`
