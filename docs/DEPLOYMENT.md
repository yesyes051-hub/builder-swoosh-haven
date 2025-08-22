# Quick Deployment Guide - Vercel & Render

This is a quick reference guide for deploying TrackZen. For detailed instructions, see `DEPLOYMENT.md` in the root directory.

## Architecture
- **Frontend**: Vercel (React SPA)
- **Backend**: Render (Node.js/Express API)
- **Database**: MongoDB Atlas (recommended)

## Quick Setup

### 1. Database Setup (MongoDB Atlas)
1. Create free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create database user and get connection string
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)

### 2. Backend Deployment (Render)
1. Go to [render.com](https://render.com) and connect GitHub
2. Create "New Web Service" from your repository
3. Configure:
   - Build Command: `npm run build:server`
   - Start Command: `npm start`
4. Add environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```

### 3. Frontend Deployment (Vercel)
1. Go to [vercel.com](https://vercel.com) and connect GitHub
2. Import your repository (auto-detects Vite project)
3. Add environment variable:
   ```
   VITE_API_BASE_URL=https://your-render-app.onrender.com
   ```

### 4. Update CORS
After deploying frontend, update the `CORS_ORIGIN` environment variable in Render with your actual Vercel URL.

## Testing
1. Visit your Vercel frontend URL
2. Try logging in with: `admin@trackzen.com` / `admin123`
3. Check that all features work correctly

## Configuration Files
- `vercel.json` - Vercel deployment configuration
- `render.yaml` - Render deployment configuration
- `.env.example` - Environment variables template

## Support
- [Detailed Deployment Guide](../DEPLOYMENT.md)
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
