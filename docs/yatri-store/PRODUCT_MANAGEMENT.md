# Product Management with Google Sheets

## Overview

Products are managed through Google Sheets and automatically displayed in Yatri Store. Products are stored in Google Sheets and fetched dynamically when the store loads.

## Google Sheet Structure

**Main Sheet**: `add-product`
**Subsheet**: `certifications`
**Category Subshet**: `{category}-certifications` (e.g., `aws-certifications`)

### Sheet Columns

| Column | Description | Example |
|--------|-------------|---------|
| Timestamp | Auto-generated timestamp | 2024-01-15T10:30:00Z |
| ID | Unique product ID | product-1234567890 |
| Title | Product title | AWS Certified Solutions Architect - Associate (SAA-C03) |
| Category | Product category | AWS, Azure, GCP, etc. |
| Original Price | Original price in ₹ | 15900 |
| Discounted Price | Discounted price in ₹ | 7950 |
| Discount | Discount percentage | 50 |
| Image | Image URL | https://example.com/image.jpg |
| Description | Product description | Full description... |
| Exam Code | Certification exam code | SAA-C03 |
| Level | Certification level | Associate, Practitioner, etc. |
| Status | Product status | active, inactive |

## Setup Instructions

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Yatri Store Products" (or any name)
4. Copy the Sheet ID from URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

### Step 2: Set Up Google Apps Script

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Delete the default code
4. Copy the code from `appscript/add-product.gs`
5. Update `SPREADSHEET_ID` with your Sheet ID:
   ```javascript
   const SPREADSHEET_ID = '1fHKV9moStqvkc5LiL1YstH4LfygPAnhg0s6M78mNMcA';
   ```
6. Save the script (Ctrl+S or Cmd+S)
7. Click **Deploy** → **New deployment**
8. Click the gear icon ⚙️ → **Web app**
9. Set:
   - **Execute as**: Me
   - **Who has access**: Anyone
10. Click **Deploy**
11. Copy the **Web App URL** (looks like: `https://script.google.com/macros/s/.../exec`)

### Step 3: Configure Environment Variables

Add to your `.env` file:

```env
VITE_STORE_PRODUCTS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Step 4: Create Initial Sheet Structure

1. In your Google Sheet, create a sheet named `add-product`
2. Add headers in row 1:
   ```
   Timestamp | ID | Title | Category | Original Price | Discounted Price | Discount | Image | Description | Exam Code | Level | Status
   ```
3. Create a sheet named `certifications` with the same headers

## Adding Products

### Method 1: Using the Form (`/addproduct`)

1. Go to `/addproduct` in your app
2. Fill in the product details
3. Click "Add Product"
4. Product will be added to:
   - Main sheet: `add-product`
   - Category subsheet: `{category}-certifications` (e.g., `aws-certifications`)
   - General subsheet: `certifications`

### Method 2: Directly in Google Sheets

1. Open your Google Sheet
2. Go to the `add-product` sheet
3. Add a new row with product details
4. Set Status to `active` for the product to appear in store

## How It Works

1. **Adding Product**: 
   - Form submits to Google Apps Script
   - Script adds product to main sheet and category subsheet
   - Category subsheet is created automatically if it doesn't exist

2. **Displaying Products**:
   - YatriStore page loads
   - Fetches products from Google Sheets via Apps Script
   - Displays products in 3-column grid
   - Falls back to static products if sheet fetch fails

3. **Category Subshet Creation**:
   - If category is "AWS", creates `aws-certifications` subsheet
   - If category is "Azure", creates `azure-certifications` subsheet
   - And so on...

## API Endpoints

### GET - Fetch Products
```
GET https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Response:
```json
{
  "success": true,
  "products": [
    {
      "id": "product-123",
      "title": "AWS Certified Solutions Architect",
      "category": "AWS",
      "originalPrice": 15900,
      "discountedPrice": 7950,
      "discount": 50,
      "image": "https://example.com/image.jpg",
      "description": "...",
      "examCode": "SAA-C03",
      "level": "Associate",
      "status": "active"
    }
  ]
}
```

### POST - Add Product
```
POST https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
Content-Type: application/json

{
  "title": "Product Title",
  "category": "AWS",
  "originalPrice": 15900,
  "discountedPrice": 7950,
  "discount": 50,
  "image": "https://example.com/image.jpg",
  "description": "Product description",
  "examCode": "SAA-C03",
  "level": "Associate"
}
```

## Razorpay Integration

**Important**: Razorpay doesn't require products to be pre-added. Orders are created dynamically when customers checkout.

When a customer checks out:
1. Product details are sent to Razorpay order creation
2. Razorpay creates an order with product information
3. Payment is processed
4. Order is completed

## Troubleshooting

### Products Not Showing

1. Check if `VITE_STORE_PRODUCTS_WEBHOOK_URL` is set in `.env`
2. Verify Google Apps Script is deployed as Web App
3. Check browser console for errors
4. Verify products have `status: "active"` in sheet

### Form Submission Fails

1. Check Google Apps Script execution logs
2. Verify Sheet ID is correct
3. Check if sheet permissions allow script to write
4. Verify webhook URL is correct

### Category Subshet Not Created

- Check Apps Script logs
- Verify category name is valid (AWS, Azure, etc.)
- Manually create subsheet if needed

## Best Practices

1. **Keep Status Updated**: Set inactive products to `status: "inactive"` instead of deleting
2. **Use Valid Image URLs**: Ensure image URLs are accessible
3. **Validate Data**: Use the form at `/addproduct` for validation
4. **Backup**: Regularly backup your Google Sheet
5. **Permissions**: Keep Google Apps Script deployment as "Anyone" for public access

---

**Note**: Products are automatically synced from Google Sheets. No need to rebuild or redeploy when adding products!


