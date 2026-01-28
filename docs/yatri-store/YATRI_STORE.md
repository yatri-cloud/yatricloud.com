# Yatri Store Documentation

## Overview

Yatri Store is a comprehensive e-commerce solution for selling certification exam vouchers. It features a modern, responsive UI with shopping cart functionality and Razorpay payment integration.

## Features

### 🛍️ Core Features
- **Product Catalog**: Display certification vouchers with images, pricing, and descriptions
- **Category Filtering**: Filter products by certification provider (AWS, Azure, GCP, etc.)
- **Shopping Cart**: Add/remove items, update quantities, view totals
- **Payment Integration**: Razorpay payment gateway integration
- **Responsive Design**: Mobile-first design that works on all devices
- **Dark Mode Support**: Full dark/light theme support

### 🎨 UI/UX Features
- **3-Column Grid Layout**: Clean, organized product display
- **Smooth Animations**: Framer Motion animations for better user experience
- **Product Cards**: Beautiful cards with hover effects, discount badges, and category tags
- **Cart Sidebar**: Slide-out cart with item management
- **Toast Notifications**: User feedback for cart actions
- **Sticky Filters**: Category filters stay visible while scrolling

## File Structure

```
src/
├── pages/
│   └── YatriStore.tsx              # Main store page
├── components/
│   └── store/
│       ├── ProductCard.tsx         # Product card component
│       └── CartSheet.tsx           # Shopping cart sidebar
├── contexts/
│   └── CartContext.tsx             # Cart state management
├── data/
│   └── store-products.ts           # Product data
└── lib/
    └── razorpay.ts                 # Payment integration utilities
```

## Product Data Structure

### Product Interface

```typescript
interface Product {
  id: string;
  title: string;
  category: ProductCategory;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  image: string;
  description: string;
  examCode?: string;
  level: "Associate" | "Practitioner" | "Professional" | "Specialty";
}
```

### Available Categories

- AWS
- Azure
- GCP
- Oracle
- Salesforce
- ServiceNow
- GitHub

## Current Products

### AWS Certifications (7 products)

#### Associate Level (5)
1. **AWS Certified Solutions Architect - Associate (SAA-C03)**
   - Price: ₹7,950 (50% OFF from ₹15,900)
   - Exam Code: SAA-C03

2. **AWS Certified Developer - Associate (DVA-C02)**
   - Price: ₹7,950 (50% OFF from ₹15,900)
   - Exam Code: DVA-C02

3. **AWS Certified CloudOps Engineer - Associate (SOA-C03)**
   - Price: ₹7,950 (50% OFF from ₹15,900)
   - Exam Code: SOA-C03

4. **AWS Certified Data Engineer - Associate (DEA-C01)**
   - Price: ₹7,950 (50% OFF from ₹15,900)
   - Exam Code: DEA-C01

5. **AWS Certified Machine Learning Engineer - Associate (MLA-C01)**
   - Price: ₹7,950 (50% OFF from ₹15,900)
   - Exam Code: MLA-C01

#### Practitioner Level (2)
6. **AWS Certified Cloud Practitioner (CLF-C02)**
   - Price: ₹7,950 (50% OFF from ₹15,900)
   - Exam Code: CLF-C02

7. **AWS Certified Cloud Practitioner (CLF-C03)**
   - Price: ₹7,950 (50% OFF from ₹15,900)
   - Exam Code: CLF-C03

## Routes

### Store Page
- **URL**: `/yatristore`
- **Component**: `YatriStore`
- **Access**: Public

## Components

### YatriStore Page

Main store page component that includes:
- Header section with store branding
- Category filter bar (sticky)
- Product grid (3 columns)
- Trust section
- Fixed cart button

**Key Features:**
- Category filtering
- Product count display
- Responsive grid layout
- Empty state handling

### ProductCard Component

Displays individual product information:
- Product image with hover effects
- Discount badge (top-right)
- Category badge (top-left)
- Product title and exam code
- Pricing (original + discounted)
- Limited time offer badge
- "View Details" button (opens modal)
- "Add to Cart" button

**Props:**
```typescript
interface ProductCardProps {
  product: Product;
}
```

### CartSheet Component

Shopping cart sidebar with:
- Cart items list
- Quantity controls (+/-)
- Remove item functionality
- Subtotal calculation
- GST calculation (18%)
- Total price
- Checkout button
- Clear cart button

**Features:**
- Persistent cart (localStorage)
- Real-time price updates
- Empty cart state
- Payment integration

### CartContext

Global cart state management:
- Add to cart
- Remove from cart
- Update quantity
- Clear cart
- Calculate totals
- Persist to localStorage

**Usage:**
```typescript
const { items, addToCart, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
```

## Payment Integration

### Razorpay Configuration

**Test Credentials:**
- Test Key: `rzp_test_S05Hqy9qMsJRVs`
- Test Key Secret: `AbZUaer9h9iPXWHK3QNUF3TG`

### Payment Flow

1. User clicks "Checkout" in cart
2. Cart total is calculated (including 18% GST)
3. Razorpay order is created (currently mock - needs backend)
4. Payment modal opens
5. User completes payment
6. Success/error handling

### Backend Integration Required

⚠️ **Important**: The current implementation uses a mock order ID. For production:

1. **Create Backend API Endpoint**
   ```javascript
   POST /api/razorpay/create-order
   Body: {
     amount: number, // in paise
     currency: "INR",
     receipt?: string,
     notes?: Record<string, string>
   }
   Response: {
     orderId: string
   }
   ```

2. **Update `createRazorpayOrder` function** in `src/lib/razorpay.ts`:
   ```typescript
   const response = await fetch('/api/razorpay/create-order', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(orderData)
   });
   const { orderId } = await response.json();
   return orderId;
   ```

3. **Implement Payment Verification** on backend:
   ```javascript
   POST /api/razorpay/verify-payment
   Body: {
     razorpay_order_id: string,
     razorpay_payment_id: string,
     razorpay_signature: string
   }
   ```

## Styling

### Design System
- **Primary Color**: `#007CFF` (Yatri Cloud Blue)
- **Grid Layout**: 3 columns on large screens, 2 on medium, 1 on mobile
- **Spacing**: Consistent spacing using Tailwind utilities
- **Animations**: Framer Motion for smooth transitions

### Key Classes
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` - Responsive grid
- `gap-6 lg:gap-8` - Product card spacing
- `sticky top-16` - Sticky filter bar
- `fixed bottom-6 right-6` - Fixed cart button

## State Management

### Cart State
- Stored in React Context (`CartContext`)
- Persisted to `localStorage` as `yatri-cart`
- Automatically syncs on page load

### Cart Data Structure
```typescript
interface CartItem extends Product {
  quantity: number;
}
```

## Adding New Products

To add new products, edit `src/data/store-products.ts`:

```typescript
{
  id: "unique-product-id",
  title: "Product Title",
  category: "AWS", // or other category
  originalPrice: 15900,
  discountedPrice: 7950,
  discount: 50,
  image: "https://image-url.com/image.jpg",
  description: "Product description...",
  examCode: "EXAM-CODE",
  level: "Associate", // or "Practitioner", "Professional", "Specialty"
}
```

## Adding New Categories

1. Add category to `ProductCategory` type in `src/data/store-products.ts`
2. Add category to `categories` array
3. Category will automatically appear in filter bar

## Environment Variables

For production, update Razorpay keys:

```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_secret_key
```

Update `src/lib/razorpay.ts`:
```typescript
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_S05Hqy9qMsJRVs";
```

## Testing

### Test Payment Flow
1. Add products to cart
2. Click checkout
3. Use Razorpay test cards:
   - **Success**: `4111 1111 1111 1111`
   - **Failure**: `4000 0000 0000 0002`
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date

## Troubleshooting

### Cart Not Persisting
- Check browser localStorage is enabled
- Verify `CartContext` is wrapping the store page

### Payment Not Working
- Verify Razorpay script is loading
- Check browser console for errors
- Ensure backend API is configured (for production)

### Products Not Showing
- Check `store-products.ts` has products
- Verify category filter is set correctly
- Check console for errors

## Future Enhancements

- [ ] Backend API integration for order creation
- [ ] Payment verification on backend
- [ ] Order history page
- [ ] Email notifications
- [ ] Product search functionality
- [ ] Product sorting (price, name, etc.)
- [ ] Wishlist functionality
- [ ] Product reviews/ratings
- [ ] Coupon code support
- [ ] Bulk purchase discounts

## Support

For issues or questions:
- Check the codebase documentation
- Review Razorpay documentation: https://razorpay.com/docs/
- Contact Yatri Cloud team

---

**Last Updated**: 2024
**Version**: 1.0.0


