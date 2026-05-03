# Environment Variables Reference for Vercel

Copy these variables to Vercel Dashboard > Settings > Environment Variables

---

## 🧪 TEST MODE (No Real Money - Use for Testing)

```env
VITE_RAZORPAY_KEY_ID=[YOUR_TEST_KEY_ID]
VITE_API_BASE_URL=https://api.certification.yatricloud.com
VITE_STORE_PRODUCTS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbzQLPzAi5aD6uyjJnAUPYOkEKisUNvMwzmTIKqUObRlgsS-9gsexkuEMurKOgZgKb8-8w/exec
VITE_AZURE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbyJvIQi0ynKIIgA401IbDFjB4D_aTSGRYGjiaicQaoguIXpfcoYUgM6FvRP9IlzV5iN/exec
VITE_AWS_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbz8I8avfRCcTdYoPcRK95WZlvA3tCVKCJ3IVYA0Z5tkY2U86R4xoR3q7Up1dxW7KJBE/exec
VITE_GCP_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbw_EDOrXoWB0E-WB0B4tfQKZbqDESFrrdtCj7R_sUTHfLVjWnPKQEwxcQ086jPiKCL7/exec
VITE_GITHUB_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycby2NKqOwsFNhR1_6TYSjro6BE5rOEZW3Y17as5WWsaThP4WuqbYeoMaDFHgpYqHmIMr/exec
VITE_ORACLE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbyrsPGGxL5MKBfJKCyaWn590qYIR5i8AX0P-uZTwEzn6ua2DAztCauRP7vKwhSvwRcF/exec
VITE_SALESFORCE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbwOFa9Zx25YMK-nGyunllmwyULSGIRE2cZcAAwYOP5irep4IOdjt1O1qXY3m2UMF7M/exec
VITE_SERVICENOW_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbxqQMML8LvjE8bKIknZThbKX3ikehDidqDdzXfSOmbR8ghWZSuurTcROcb5qvgCZ0J-/exec
VITE_UDEMY_YATHARTH_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbzG7mJbtL9kCJxRhKPEawImuKVphW4Dj4H0gI_rxzDCo73exucrgRqqCa9rz9_Pa1Nv/exec
VITE_UDEMY_NENSI_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbxo_PNFMqIZttrLkCzPM6oxaXDA_LJ702_FwCj3hbwv2yHvHzuGV4tZgZktLj9PgIHA/exec
VITE_UDEMY_CREDENTIALS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbwsL5nNkmskfCqKQAwdykxWX0bDj7kaeTE0DIVM9ZioVwKtNVLkhUkAP7AiXjxGDInM/exec
VITE_UDEMY_INSTRUCTOR_TOKEN=[YOUR_INSTRUCTOR_TOKEN]

# Canva Connect API (for automated image generation)
# Get these from: https://www.canva.com/developers/
CANVA_CLIENT_ID=your_canva_client_id_here
CANVA_CLIENT_SECRET=your_canva_client_secret_here
VITE_CANVA_TEMPLATE_ID=your_template_id_here

# Yatris Users API (Google Apps Script Web App URL)
# Deploy yatris-users.gs as a web app and use the URL here
YATRIS_USERS_API_URL=https://script.google.com/macros/s/AKfycbxHqWK2-fa7hRWf40_jZBKOUxLktgeVawx6e7pe68V83-dx9Ol34ShdqPtXTn0fNiOT5g/exec
```

---

## 🚀 PRODUCTION MODE (Real Money - Use for Live Site)

```env
VITE_RAZORPAY_KEY_ID=[YOUR_LIVE_KEY_ID]
VITE_API_BASE_URL=https://api.certification.yatricloud.com
VITE_STORE_PRODUCTS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbzQLPzAi5aD6uyjJnAUPYOkEKisUNvMwzmTIKqUObRlgsS-9gsexkuEMurKOgZgKb8-8w/exec
VITE_AZURE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbyJvIQi0ynKIIgA401IbDFjB4D_aTSGRYGjiaicQaoguIXpfcoYUgM6FvRP9IlzV5iN/exec
VITE_AWS_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbz8I8avfRCcTdYoPcRK95WZlvA3tCVKCJ3IVYA0Z5tkY2U86R4xoR3q7Up1dxW7KJBE/exec
VITE_GCP_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbw_EDOrXoWB0E-WB0B4tfQKZbqDESFrrdtCj7R_sUTHfLVjWnPKQEwxcQ086jPiKCL7/exec
VITE_GITHUB_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycby2NKqOwsFNhR1_6TYSjro6BE5rOEZW3Y17as5WWsaThP4WuqbYeoMaDFHgpYqHmIMr/exec
VITE_ORACLE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbyrsPGGxL5MKBfJKCyaWn590qYIR5i8AX0P-uZTwEzn6ua2DAztCauRP7vKwhSvwRcF/exec
VITE_SALESFORCE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbwOFa9Zx25YMK-nGyunllmwyULSGIRE2cZcAAwYOP5irep4IOdjt1O1qXY3m2UMF7M/exec
VITE_SERVICENOW_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbxqQMML8LvjE8bKIknZThbKX3ikehDidqDdzXfSOmbR8ghWZSuurTcROcb5qvgCZ0J-/exec
VITE_UDEMY_YATHARTH_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbzG7mJbtL9kCJxRhKPEawImuKVphW4Dj4H0gI_rxzDCo73exucrgRqqCa9rz9_Pa1Nv/exec
VITE_UDEMY_NENSI_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbxo_PNFMqIZttrLkCzPM6oxaXDA_LJ702_FwCj3hbwv2yHvHzuGV4tZgZktLj9PgIHA/exec
VITE_UDEMY_CREDENTIALS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbwsL5nNkmskfCqKQAwdykxWX0bDj7kaeTE0DIVM9ZioVwKtNVLkhUkAP7AiXjxGDInM/exec
VITE_UDEMY_INSTRUCTOR_TOKEN=[YOUR_INSTRUCTOR_TOKEN]

# Canva Connect API (for automated image generation)
# Get these from: https://www.canva.com/developers/
CANVA_CLIENT_ID=your_canva_client_id_here
CANVA_CLIENT_SECRET=your_canva_client_secret_here
VITE_CANVA_TEMPLATE_ID=your_template_id_here

# Yatris Users API (Google Apps Script Web App URL)
# Deploy yatris-users.gs as a web app and use the URL here
YATRIS_USERS_API_URL=https://script.google.com/macros/s/AKfycbxHqWK2-fa7hRWf40_jZBKOUxLktgeVawx6e7pe68V83-dx9Ol34ShdqPtXTn0fNiOT5g/exec
```
```

---

## 📝 How to Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Copy each variable above (one at a time)
6. Select **Environments**: Production, Preview, Development
7. Click **Save**
8. **Redeploy** your project

---

## ⚠️ Important

- **Backend variables** (`RAZORPAY_KEY_SECRET`) go on your backend server (Render/Railway), NOT Vercel
- Use **TEST** keys for testing, **LIVE** keys for production
- Always **redeploy** after adding/changing environment variables

