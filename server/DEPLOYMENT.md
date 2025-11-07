# Vercel Backend Deployment Guide

This guide will help you deploy the CargoMatch backend to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed: `npm i -g vercel`
3. All environment variables ready

## Step 1: Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
cd server
vercel login
```

## Step 3: Set Environment Variables

You need to set the following environment variables in Vercel:

### Required Environment Variables

1. **Database Configuration:**
   - `DB_HOST` - Your Neon database host (e.g., `ep-xxx-xxx.us-east-2.aws.neon.tech`)
   - `DB_USER` - Database username
   - `DB_PASS` - Database password
   - `DB_NAME` - Database name
   - `DB_PORT` - Database port (usually `5432`)
   - `DB_SSL` - Set to `true` for Neon databases

2. **JWT Configuration:**
   - `JWT_SECRET` - Your JWT secret key (use a strong random string)

3. **Cloudinary Configuration:**
   - `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY` - Your Cloudinary API key
   - `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

4. **Node Environment:**
   - `NODE_ENV` - Set to `production`

### How to Set Environment Variables in Vercel

#### Option 1: Via Vercel Dashboard
1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with its value
4. Select the environment (Production, Preview, Development)

#### Option 2: Via Vercel CLI
```bash
vercel env add DB_HOST
vercel env add DB_USER
vercel env add DB_PASS
vercel env add DB_NAME
vercel env add DB_PORT
vercel env add DB_SSL
vercel env add JWT_SECRET
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
vercel env add NODE_ENV
```

## Step 4: Deploy to Vercel

### First Deployment

```bash
cd server
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No** (for first deployment)
- Project name? `cargomatch-backend` (or your preferred name)
- Directory? `./` (current directory)
- Override settings? **No**

### Subsequent Deployments

```bash
vercel --prod
```

## Step 5: Update Frontend API URL

After deployment, Vercel will provide you with a URL like:
`https://cargomatch-backend.vercel.app`

Update your frontend to use this URL:

1. In your frontend code, update the API base URL:
   ```javascript
   const API_BASE_URL = 'https://cargomatch-backend.vercel.app';
   ```

2. Or set it as an environment variable in your frontend Vercel project:
   ```
   VITE_API_URL=https://cargomatch-backend.vercel.app
   ```

## Step 6: Configure CORS

The backend is already configured to allow requests from:
- `https://cargomatch-orcin.vercel.app` (your frontend)
- Local development URLs

If you need to add more origins, update `server/api/index.js`:

```javascript
const corsOptions = {
  origin: [
    'https://cargomatch-orcin.vercel.app',
    'https://your-other-domain.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

## Step 7: Set Up Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Follow the DNS configuration instructions

## Important Notes

### File Storage
- **Vercel doesn't support persistent file storage**
- All files are uploaded to **Cloudinary** (already configured)
- The `/uploads` endpoint is for local development only
- In production, files are accessed via Cloudinary URLs stored in the database

### Cron Jobs
- Cron jobs are **disabled** in the serverless function
- If you need scheduled tasks, use:
  - **Vercel Cron Jobs** (recommended): Add `vercel.json` cron configuration
  - External service like **cron-job.org** or **EasyCron**
  - Database triggers

### Database Connections
- The database connection uses connection pooling
- Configured for Neon PostgreSQL with SSL
- Connection is tested on startup

### Serverless Function Limits
- **Execution timeout**: 10 seconds (Hobby), 60 seconds (Pro)
- **Memory**: 1024 MB
- **Request size**: 4.5 MB (can be increased with configuration)

## Troubleshooting

### Database Connection Issues
- Verify all database environment variables are set correctly
- Check that `DB_SSL=true` is set for Neon databases
- Ensure your Neon database allows connections from Vercel IPs

### CORS Errors
- Verify the frontend URL is in the CORS origins list
- Check that credentials are properly configured

### File Upload Issues
- Ensure Cloudinary environment variables are set
- Verify Cloudinary account is active
- Check file size limits (Vercel has a 4.5 MB limit by default)

### Environment Variables Not Working
- Redeploy after adding environment variables
- Check that variables are set for the correct environment (Production/Preview)
- Verify variable names match exactly (case-sensitive)

## Monitoring

- View logs in Vercel Dashboard → **Deployments** → Click on deployment → **Functions** tab
- Use Vercel Analytics for performance monitoring
- Set up error tracking (Sentry, etc.) for production

## Support

For issues:
1. Check Vercel logs in the dashboard
2. Verify all environment variables are set
3. Test API endpoints using the Vercel deployment URL
4. Check database connectivity

---

**Deployment URL Format:**
- Production: `https://your-project-name.vercel.app`
- Preview: `https://your-project-name-git-branch.vercel.app`

