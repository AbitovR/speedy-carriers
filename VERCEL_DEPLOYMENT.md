# Vercel Deployment Guide for Speedy Carriers

## Quick Summary

Your app is ready to deploy to Vercel with your domain `speedycarriers.management`. Here's exactly what to do:

---

## Step 1: Prepare Your GitHub Repository

### 1.1 Create a GitHub Repository

1. Go to https://github.com/new
2. Name it: `speedy-carriers`
3. Add description: "Professional Driver Payment System"
4. Choose **Public** (Vercel free tier works with public repos)
5. Click "Create repository"

### 1.2 Push Your Code to GitHub

In your terminal, in the speedy-carriers-vercel folder:

```bash
git init
git add .
git commit -m "Initial commit: Driver payment system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/speedy-carriers.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 2: Deploy to Vercel

### 2.1 Connect to Vercel

1. Go to https://vercel.com
2. Click "Sign up" or "Sign in"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### 2.2 Import Your Project

1. Click "New Project" or "Add New..."
2. Select your `speedy-carriers` repository from the list
3. Vercel will auto-detect it's a static site - no changes needed
4. Click "Deploy"

**That's it!** Vercel will deploy your app in ~1-2 minutes.

You'll get a URL like: `https://speedy-carriers-xyz123.vercel.app`

---

## Step 3: Connect Your Domain

### 3.1 In Vercel Dashboard

1. Go to your project: https://vercel.com/dashboard
2. Click on your `speedy-carriers` project
3. Go to **Settings** → **Domains**
4. Under "Production Domains", enter: `speedycarriers.management`
5. Click "Add"

You'll see DNS instructions appear.

### 3.2 Update Your Domain Registrar

Vercel will show you DNS records to add. The most common setup:

**If using the root domain (speedycarriers.management):**

Add these DNS records at your registrar:

```
Type: A
Name: @
Value: 76.76.19.165

Type: AAAA
Name: @
Value: 2606:4700:4400::521b:13a5
```

**If using a subdomain (app.speedycarriers.management):**

Add this DNS record:

```
Type: CNAME
Name: app
Value: cname.vercel.com
```

### 3.3 Wait for DNS Propagation

DNS changes can take 15 minutes to 24 hours. Check status in Vercel:
- Green checkmark = Domain is connected ✓
- Yellow = Still propagating...

Once connected, your app will be live at: **https://speedycarriers.management**

---

## Step 4: Verify It's Working

1. Visit https://speedycarriers.management
2. Upload test-data.csv from the public folder
3. Test the calculations
4. Generate a PDF statement

Everything should work exactly as it did locally!

---

## Common Issues & Solutions

### Issue: "Domain not found" or "Not pointing to Vercel"

**Solution:**
1. Double-check DNS records at your registrar
2. Copy the exact values from Vercel's DNS instructions
3. Wait 15-30 minutes for propagation
4. Use https://whatsmydns.net to check DNS status

### Issue: App shows "404 Not Found"

**Solution:**
1. Make sure `public/index.html` was deployed
2. Check in Vercel deployment logs (Project → Deployments)
3. Click the deployment to see file structure

### Issue: File upload not working

**Solution:**
1. Press F12 to open browser console
2. Check for errors
3. Make sure you're using Chrome, Firefox, or Safari (not Internet Explorer)

---

## Next Steps

Once deployed, you can:

1. **Add analytics** - Vercel has built-in analytics
2. **Add a custom favicon** - Place `favicon.ico` in `public/`
3. **Add more features** - We can expand the app
4. **Share with drivers** - Give them the link!

---

## Support

- **Vercel Help**: https://vercel.com/help
- **Domain Issues**: Contact your domain registrar support
- **App Issues**: Check browser console (F12 → Console tab)

---

## Your Files Are Ready

All files are in the `speedy-carriers-vercel` folder:

- ✅ `public/index.html` - Your app
- ✅ `public/test-data.csv` - Test data
- ✅ `package.json` - Project info
- ✅ `vercel.json` - Vercel config
- ✅ `.gitignore` - Git settings
- ✅ `README.md` - Documentation

Everything is configured and ready to go!
