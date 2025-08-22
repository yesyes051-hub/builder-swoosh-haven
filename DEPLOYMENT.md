# TrackZen Deployment Guide - Vercel & Render

This guide explains how to deploy TrackZen with the frontend on Vercel and the backend on Render.

## Architecture Overview

- **Frontend**: React SPA deployed on Vercel
- **Backend**: Node.js/Express API deployed on Render
- **Database**: MongoDB (can be hosted on MongoDB Atlas or other providers)

## Frontend Deployment (Vercel)

### Prerequisites

1. GitHub repository with your code
2. Vercel account (free tier available)

### Setup Steps

1. **Connect to Vercel**

   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "New Project" and import your repository
   - Vercel will automatically detect it's a Vite project

2. **Configure Build Settings** (Vercel should auto-detect these)

   - Build Command: `npm run build:client`
   - Output Directory: `dist/spa`
   - Install Command: `npm install`
   - Node.js Version: `18.x`

3. **Environment Variables**

   - In Vercel dashboard, go to Project Settings → Environment Variables
   - Add:
     ```
     VITE_API_BASE_URL=https://your-render-app.onrender.com
     ```

4. **Custom Domain** (Optional)
   - In Vercel dashboard, go to Project Settings → Domains
   - Add your custom domain and configure DNS

### Build Configuration

The project includes a `vercel.json` file with:

- SPA routing configuration (all routes redirect to index.html)
- Security headers
- Static asset caching
- Build optimization

## Backend Deployment (Render)

### Prerequisites

1. GitHub repository with your code
2. Render account (free tier available)
3. MongoDB database (MongoDB Atlas recommended)

### Setup Steps

1. **Connect to Render**

   - Go to [render.com](https://render.com) and sign in with GitHub
   - Click "New Web Service" and connect your repository
   - Select the repository and branch

2. **Configure Service Settings**

   - Name: `trackzen-api` (or your preferred name)
   - Runtime: `Node`
   - Build Command: `npm run build:server`
   - Start Command: `npm start`
   - Plan: `Starter` (free tier)

3. **Environment Variables**

   - In Render dashboard, go to Environment Variables
   - Add the following variables:
     ```
     NODE_ENV=production
     PORT=10000
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_secure_jwt_secret
     CORS_ORIGIN=https://your-vercel-app.vercel.app
     ```

4. **Health Check**
   - Health Check Path: `/api/ping`
   - This ensures your service stays active

### Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Account**

   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Create a free cluster

2. **Configure Database**

   - Create a database user
   - Whitelist IP addresses (or use 0.0.0.0/0 for all IPs in development)
   - Get the connection string

3. **Update Environment Variables**
   - Add `MONGODB_URI` in Render with your Atlas connection string

## Configuration Files

### render.yaml

The project includes a `render.yaml` file for automated deployment configuration.

### vercel.json

Configures Vercel deployment with:

- SPA routing
- Security headers
- Caching rules
- Build settings

## Environment Variables Reference

### Frontend (Vercel)

```bash
VITE_API_BASE_URL=https://your-render-app.onrender.com
```

### Backend (Render)

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trackzen
JWT_SECRET=your-super-secure-secret-key
CORS_ORIGIN=https://your-vercel-app.vercel.app
PING_MESSAGE=TrackZen API is running
```

## Post-Deployment Configuration

1. **Update Frontend API Calls**

   - The frontend is configured to use `VITE_API_BASE_URL` environment variable
   - Ensure all API calls use this base URL

2. **Test the Deployment**

   - Visit your Vercel frontend URL
   - Check that API calls work correctly
   - Test authentication and main features

3. **CORS Configuration**
   - Ensure CORS is configured in your backend to allow requests from your Vercel domain
   - Update `CORS_ORIGIN` environment variable in Render

## Monitoring and Maintenance

### Vercel

- Check deployment logs in Vercel dashboard
- Monitor build performance and errors
- Set up notifications for failed deployments

### Render

- Monitor service health in Render dashboard
- Check application logs for errors
- Set up notifications for service downtime

## Troubleshooting

### Common Issues

1. **CORS Errors**

   - Ensure `CORS_ORIGIN` is set correctly in Render
   - Check that frontend URL matches exactly

2. **API Not Found Errors**

   - Verify `VITE_API_BASE_URL` is set correctly in Vercel
   - Check that Render service is running and healthy

3. **Build Failures**

   - Check build logs in respective dashboards
   - Ensure all dependencies are listed in `package.json`
   - Verify Node.js version compatibility

4. **Database Connection Issues**
   - Check MongoDB Atlas network access settings
   - Verify connection string format
   - Ensure database user has correct permissions

### Performance Optimization

1. **Frontend**

   - Enable Vercel Analytics
   - Use Vercel Edge Functions for dynamic content
   - Implement proper caching strategies

2. **Backend**
   - Monitor Render service metrics
   - Consider upgrading to paid plan for better performance
   - Implement database indexing and query optimization

## Security Considerations

1. **Environment Variables**

   - Never commit secrets to version control
   - Use secure, random values for JWT secrets
   - Regularly rotate sensitive credentials

2. **CORS Configuration**

   - Only allow necessary origins
   - Don't use wildcard (\*) in production

3. **Database Security**
   - Use MongoDB Atlas network access controls
   - Implement proper authentication and authorization
   - Regular security updates and monitoring

## Cost Considerations

### Free Tier Limitations

**Vercel (Hobby Plan)**

- 100GB bandwidth per month
- Serverless functions execution time limits
- No custom authentication

**Render (Free Plan)**

- Service spins down after 15 minutes of inactivity
- 750 hours per month (shared across services)
- Limited to 512MB RAM

**MongoDB Atlas (Free Tier)**

- 512MB storage
- No backups
- Limited connection pooling

### Scaling Options

- Consider upgrading to paid plans as your application grows
- Monitor usage and performance metrics
- Plan for traffic spikes and growth

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [TrackZen GitHub Repository](https://github.com/your-username/trackzen)

---

**Next Steps:**

1. Set up MongoDB Atlas database
2. Deploy backend to Render with environment variables
3. Deploy frontend to Vercel with API URL configuration
4. Test end-to-end functionality
5. Configure monitoring and alerts
