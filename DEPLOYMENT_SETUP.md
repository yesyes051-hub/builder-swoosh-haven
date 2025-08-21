# 🚀 TrackZen Netlify Auto-Deployment Setup

Your TrackZen app is now configured for automatic deployment to Netlify! Here's how to complete the setup:

## 🔑 Required GitHub Secrets

You need to add one secret to your GitHub repository for automatic deployments to work:

### 1. Get Netlify Auth Token

1. Go to [Netlify User Settings](https://app.netlify.com/user/applications#personal-access-tokens)
2. Click **"New access token"**
3. Give it a name like "TrackZen GitHub Actions"
4. Copy the generated token

### 2. Add GitHub Secret

1. Go to your GitHub repository: `https://github.com/yesyes051-hub/builder-swoosh-haven`
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **"New repository secret"**
5. Add this secret:
   - **Name**: `NETLIFY_AUTH_TOKEN`
   - **Value**: [The token you copied from Netlify]

## 🎯 Site Configuration

Your Netlify site details:

- **Site ID**: `d3da4e1f-f57b-46c4-aec0-232a99d5cd4f`
- **Site Name**: `trackzen-pms-dashboard`
- **Production URL**: https://trackzen-pms-dashboard.netlify.app
- **Netlify Dashboard**: https://app.netlify.com/sites/d3da4e1f-f57b-46c4-aec0-232a99d5cd4f

## 🔄 How Auto-Deployment Works

### When you merge a PR to `main`:

1. ✅ GitHub Actions triggers automatically
2. ✅ Code is checked out and dependencies installed
3. ✅ TypeScript type checking runs
4. ✅ Project builds with `npm run build:netlify`
5. ✅ Built files deploy to production Netlify site
6. ✅ Live at https://trackzen-pms-dashboard.netlify.app

### When you create a PR:

1. ✅ GitHub Actions creates a preview deployment
2. ✅ Preview URL is commented on the PR
3. ✅ Test your changes before merging!

## 🧪 Testing the Setup

1. **Add the GitHub secret** (see steps above)
2. **Create a test PR**:
   ```bash
   git checkout -b test-deployment
   echo "# Test deployment" >> README.md
   git add README.md
   git commit -m "Test: trigger deployment"
   git push origin test-deployment
   ```
3. **Create PR on GitHub** and watch the deployment happen!
4. **Merge the PR** to trigger production deployment

## 🛠️ Current Features Deployed

Your TrackZen app includes:

- ✅ **Enhanced PMS Dashboard** with 8 modules
- ✅ **Admin User Management** with temporary passwords
- ✅ **Advanced Timesheet System** with approval workflow
- ✅ **Role-based Access Control** (Admin, HR, Manager, Employee)
- ✅ **MongoDB Integration** for data persistence
- ✅ **Birthday Notifications** with automated wishes
- ✅ **Project & Ticket Management**
- ✅ **Interview Management System**

## 🔧 Troubleshooting

If deployment fails:

1. Check the **Actions** tab in your GitHub repo
2. Review the build logs for errors
3. Ensure all dependencies are in `package.json`
4. Verify the `NETLIFY_AUTH_TOKEN` secret is set correctly

## 📱 Access Your Live App

Once setup is complete:

- **Production**: https://trackzen-pms-dashboard.netlify.app
- **Login with**: `admin@trackzen.com` / `admin123`

Ready to deploy! 🎉
