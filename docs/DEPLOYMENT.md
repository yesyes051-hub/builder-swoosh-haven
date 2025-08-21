# Deployment Setup Guide

This guide explains how to set up automatic deployment to Netlify using GitHub Actions.

## Prerequisites

1. **Netlify Account**: You need a Netlify account
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Netlify Site**: Create a new site on Netlify connected to your GitHub repo

## Setup Steps

### 1. Connect Netlify to Your Repository

1. Go to [Netlify](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and authorize Netlify
4. Select your repository: `yesyes051-hub/builder-swoosh-haven`
5. Configure build settings:
   - **Build command**: `npm run build:netlify`
   - **Publish directory**: `dist/spa`
   - **Node version**: `18`

### 2. Get Netlify Credentials

After creating the site, you'll need these values:

1. **Site ID**: Found in Site settings → General → Site details
2. **Auth Token**: 
   - Go to User settings → Applications → Personal access tokens
   - Click "New access token"
   - Give it a name and generate the token

### 3. Add GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

- `NETLIFY_AUTH_TOKEN`: Your Netlify personal access token
- `NETLIFY_SITE_ID`: Your Netlify site ID

### 4. Deployment Workflow

The CI/CD pipeline is configured to:

- **On Pull Requests**: Create preview deployments with unique URLs
- **On Main Branch**: Deploy to production automatically
- **Quality Checks**: Run tests and type checking before deployment

## Files Created

- `.github/workflows/deploy.yml`: GitHub Actions workflow
- `netlify.toml`: Netlify configuration
- `docs/DEPLOYMENT.md`: This documentation

## Environment Variables (Optional)

If your app needs environment variables in production:

1. In Netlify dashboard, go to Site settings → Environment variables
2. Add your production environment variables
3. They'll be available during the build process

## Manual Deployment

To deploy manually:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist/spa
```

## Troubleshooting

### Build Fails
- Check the build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### 404 Errors on Refresh
- The `netlify.toml` file includes SPA redirects
- All routes redirect to `index.html` for client-side routing

### API Calls Fail
- Update API endpoints to use absolute URLs in production
- Consider using environment variables for API base URLs

## Production Considerations

1. **Environment Variables**: Set production API URLs
2. **Domain**: Configure custom domain in Netlify
3. **SSL**: Netlify provides free SSL certificates
4. **Performance**: Consider enabling branch deploys for testing

## Branch Protection

Consider setting up branch protection rules:
1. Go to GitHub repo → Settings → Branches
2. Add rule for `main` branch
3. Require status checks (tests, type check)
4. Require pull request reviews
