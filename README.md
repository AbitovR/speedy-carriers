# Speedy Carriers - Driver Management System

A comprehensive driver payment and trip management system built with Next.js, Supabase, and Tailwind CSS.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AbitovR/speedy-carriers)

## Features

✅ **Authentication**
- Secure login/logout
- Password reset functionality
- Single-user system (expandable to multi-user)

✅ **Driver Management**
- Add, edit, and manage driver profiles
- Support for two driver types:
  - Company Driver (32% of gross revenue)
  - Owner Operator (90% of net revenue after expenses)
- Track driver status (active/inactive)
- Store contact information and license numbers

✅ **Trip Management**
- Upload trip files (CSV/Excel) from SuperDispatch
- Automatic calculation of driver payments
- Expense tracking for owner operators
- Complete payment breakdowns
- File storage for audit trail

✅ **Analytics Dashboard**
- Total trips and revenue
- Driver performance metrics
- This month's summary
- Recent trip history

✅ **Payment Calculations**
- Automatic broker fee deductions
- 10% dispatch fee calculation
- Expense management (parking, ELD, insurance, fuel, IFTA, towing)
- Payment method breakdown (cash, check, billing)
- Accurate settlement calculations

✅ **Reporting**
- Detailed trip statements
- Print-friendly layouts
- Individual load breakdowns
- Complete payment calculations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **File Parsing**: xlsx (SheetJS)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))
- A Vercel account for deployment ([sign up here](https://vercel.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd speedy-carriers-vercel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   Follow the comprehensive guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

4. **Configure environment variables**

   Create a `.env.local` file in the root directory:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

Your app will be live at `https://your-project.vercel.app`

## Usage Guide

### Adding a Driver

1. Navigate to **Drivers** page
2. Click **Add Driver**
3. Fill in driver details:
   - Name (required)
   - Driver type (Company Driver or Owner Operator)
   - Contact information
   - License number
   - Status
4. Click **Add Driver**

### Uploading a Trip

1. Go to a driver's profile page
2. Click **Upload Trip**
3. Select your trip file (CSV or Excel from SuperDispatch)
4. Enter trip name and date
5. For owner operators, add expenses if applicable
6. Click **Upload Trip**

The system will:
- Parse the trip file
- Calculate all payments automatically
- Store the original file
- Generate a detailed breakdown

### Viewing Trip Details

1. Click on any trip from:
   - Dashboard recent trips
   - Driver profile trip history
2. View complete payment breakdown
3. Click **Print Statement** to generate a PDF

### Understanding Payment Calculations

#### Company Driver (32%)
```
Gross = Invoice Price - Broker Fee
Driver Pay = Gross × 32%
Company Keeps = Gross × 68% (covers all expenses)
```

#### Owner Operator (90%)
```
Gross Before = Invoice Price - Broker Fee
Expenses = Dispatch Fee (10%) + Other Expenses
Net Gross = Gross Before - Expenses
Owner Pay = Net Gross × 90%
Company Keeps = Net Gross × 10%

Settlement:
Total Owed = Owner Pay
Less: Cash Collected by Owner = (actual gross of cash/COD loads)
Due from Company = Total Owed - Cash Collected
```

## Project Structure

```
speedy-carriers-vercel/
├── app/
│   ├── dashboard/          # Dashboard page
│   ├── drivers/            # Driver management pages
│   │   ├── [id]/          # Driver profile
│   │   └── new/           # Add new driver
│   ├── trips/
│   │   └── [id]/          # Trip details
│   ├── login/             # Login page
│   ├── reset-password/    # Password reset
│   ├── settings/          # Settings page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Root page (redirects)
├── components/
│   ├── sidebar.tsx        # Navigation sidebar
│   ├── stat-card.tsx      # Dashboard stat cards
│   └── trip-upload-button.tsx  # Trip upload modal
├── lib/
│   ├── calculations.ts    # Payment calculation logic
│   ├── utils.ts           # Utility functions
│   └── supabase/          # Supabase client configs
├── public/                # Static assets
├── backup-static-version/ # Original static HTML app
├── SUPABASE_SETUP.md     # Database setup guide
└── README.md             # This file
```

## Database Schema

### Tables

- **drivers** - Driver profiles and information
- **trips** - Trip records with calculations
- **loads** - Individual loads within trips
- **expenses** - Trip expenses (owner operators)

### Storage

- **trip-files** - Original uploaded CSV/Excel files

## Customization

### Changing Payment Percentages

Edit [lib/calculations.ts](./lib/calculations.ts):

```typescript
const percentage = driverType === 'owner_operator' ? 0.9 : 0.32
```

### Adding Expense Categories

1. Update the `Expenses` interface in [lib/calculations.ts](./lib/calculations.ts)
2. Add input fields in [components/trip-upload-button.tsx](./components/trip-upload-button.tsx)
3. Update calculation logic

### Customizing Colors

Edit [tailwind.config.ts](./tailwind.config.ts) to change theme colors.

## Troubleshooting

### "Not authenticated" errors
- Make sure you're logged in
- Check your Supabase auth configuration
- Verify environment variables are set

### File upload fails
- Ensure Supabase Storage bucket `trip-files` exists
- Check bucket is set to public
- Verify storage policies are configured

### Database errors
- Confirm all SQL from setup guide was executed
- Check Row Level Security policies
- Verify user_id matches authenticated user

### Deployment issues
- Ensure environment variables are set in Vercel
- Check build logs for errors
- Verify Supabase URL is accessible

## Support

For issues or questions:
1. Check the [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) guide
2. Review error messages carefully
3. Check Supabase dashboard for logs

## License

MIT License - feel free to use this for your business!

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.com/)
- Icons by [Lucide](https://lucide.dev/)
- File parsing with [SheetJS](https://sheetjs.com/)
