# Complete Supabase Setup Guide

This guide will help you set up your new Supabase project with all the necessary tables, policies, and configurations.

## Step 1: Update Environment Variables in Lovable

1. Go to your new Supabase project dashboard
2. Navigate to **Settings → API**
3. Copy the following:
   - **Project URL**
   - **anon/public key**
4. In Lovable, update these environment variables:
   - `VITE_SUPABASE_URL` → your Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` → your anon/public key

## Step 2: Run Database Migrations

Go to your Supabase dashboard → **SQL Editor** and run these files in order:

1. **`new_supabase_complete_setup.sql`** - Main database setup (all tables, RLS policies, functions)
2. **`product_images_migration.sql`** - Product images table and storage

## Step 3: Configure Authentication Settings

1. In Supabase dashboard, go to **Authentication → URL Configuration**
2. Set:
   - **Site URL**: Your Lovable app URL (e.g., `https://yourapp.lovable.app`)
   - **Redirect URLs**: Add your Lovable app URL

3. Go to **Authentication → Providers → Email**
4. **Disable "Confirm email"** (optional, makes testing easier)

## Step 4: Create Your First Admin User

After running the migrations, you need to manually create an admin user:

1. Sign up for an account in your app
2. In Supabase dashboard, go to **SQL Editor**
3. Run this SQL (replace `YOUR_USER_EMAIL` with the email you signed up with):

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'YOUR_USER_EMAIL';

-- Make that user an admin (use the ID from above)
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin');
```

## Step 5: Test Your Setup

1. Log in to your app
2. Try accessing the admin dashboard at `/admin`
3. Try creating a product with images
4. Test the cart and checkout flow

## What's Included

### Tables Created:
- **categories** - Product categories
- **products** - Product catalog
- **product_images** - Multiple images per product
- **profiles** - User profiles (auto-created on signup)
- **user_roles** - Role management (admin/customer/showroom)
- **cart_items** - Shopping cart
- **orders** - Order history
- **order_items** - Order line items
- **showrooms** - Showroom management
- **reviews** - Product reviews

### Storage Buckets:
- **product-images** - Public bucket for product images

### Key Features:
- ✅ Row Level Security (RLS) on all tables
- ✅ Admin role management
- ✅ Automatic profile creation on signup
- ✅ Automatic order number generation
- ✅ Multiple images per product
- ✅ Product reviews system
- ✅ Showroom management

## Troubleshooting

### "Row violates row-level security policy"
- Make sure you've assigned the admin role to your user
- Check that you're logged in

### "Requested path is invalid" when logging in
- Check your Site URL and Redirect URLs in Supabase Authentication settings

### Images not uploading
- Verify the product-images bucket was created
- Check storage policies were applied

### Need help?
- Check the Supabase logs in your dashboard
- Review the RLS policies in the Table Editor
