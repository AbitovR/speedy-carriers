# Speedy Carriers - Driver Payment System

Professional Driver Compensation & Trip Management Platform

## Features

- 📤 Import SuperDispatch trip reports (CSV/Excel)
- 💰 Automatic driver payment calculations (32% for drivers, 90% for owner operators)
- 📊 Real-time expense tracking (parking, ELD, insurance, fuel, IFTA)
- 💸 Payment method breakdown (cash, check/ACH, billing)
- 📄 Professional PDF statement generation
- ✨ Responsive, modern UI

## Deployment to Vercel

### Prerequisites

1. GitHub account
2. Vercel account (free at vercel.com)
3. This repository

### Step-by-Step Deployment

#### 1. Create a GitHub Repository

```bash
# Initialize git in the project directory
git init
git add .
git commit -m "Initial commit"

# Push to GitHub (create repo first at github.com)
git remote add origin https://github.com/YOUR_USERNAME/speedy-carriers.git
git branch -M main
git push -u origin main
```

#### 2. Deploy to Vercel

**Option A: Using Vercel Dashboard (Easiest)**
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Select your GitHub repository
5. Vercel will auto-detect it's a static site
6. Click "Deploy"

**Option B: Using Vercel CLI**
```bash
npm install -g vercel
vercel --prod
```

#### 3. Connect Your Domain

After deployment:

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your domain: `speedycarriers.management`
4. Follow the DNS instructions from Vercel
5. Update your domain registrar's DNS settings

**If using a subdomain like `app.speedycarriers.management`:**
- Create a CNAME record pointing to `cname.vercel.com`

### Local Development

```bash
# Install Vercel CLI
npm install -g vercel

# Run locally
vercel dev

# Visit http://localhost:3000
```

### File Structure

```
speedy-carriers-vercel/
├── public/
│   ├── index.html          # Main application
│   └── test-data.csv       # Sample test data
├── package.json            # Project metadata
├── vercel.json            # Vercel configuration
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

### Environment

- **Framework**: Static HTML
- **Language**: JavaScript (vanilla, no build required)
- **Dependencies**: None (all CDN-based)
- **Deployment**: Instant (no build step)

### CDN Libraries Used

- XLSX (Excel parsing): https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js

### Support

For issues with:
- **Vercel**: https://vercel.com/docs
- **Domain DNS**: Contact your domain registrar
- **Application**: Check browser console (F12) for errors

### Next Steps

After deployment, consider:
- [ ] Add analytics (Vercel Analytics)
- [ ] Set up email notifications for statements
- [ ] Add database for trip history
- [ ] Implement user authentication
- [ ] Add multi-user support for your drivers

---

**Live at**: https://speedycarriers.management
