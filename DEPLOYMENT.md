# Deployment Guide for AutoCare Pro

This guide covers deploying AutoCare Pro to various hosting platforms.

## 📋 Prerequisites

Before deploying, ensure you have:

- Node.js 16+ installed locally
- A build of the application (`npm run build`)
- Environment variables configured
- Domain name (optional)

## 🏗️ Build Process

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create production environment file**
   ```bash
   cp .env.example .env
   # Configure your production environment variables
   ```

3. **Build the application**
   ```bash
   npm run build
   ```

4. **Test the build locally**
   ```bash
   npm run preview
   ```

## ☁️ Deployment Platforms

### Vercel (Recommended)

Vercel provides the easiest deployment for React applications with zero configuration.

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from local machine**
   ```bash
   vercel --prod
   ```

3. **Or connect GitHub repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables
   - Deploy automatically on push

**Environment Variables in Vercel:**
- Go to Project Settings → Environment Variables
- Add your production environment variables
- Redeploy after adding variables

### Netlify

Netlify offers great static site hosting with continuous deployment.

1. **Manual deployment**
   ```bash
   # Build the project
   npm run build
   
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Deploy
   netlify deploy --prod --dir=dist
   ```

2. **GitHub integration**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Configure environment variables

**Netlify Configuration** (`netlify.toml`):
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### AWS S3 + CloudFront

For scalable, enterprise-grade hosting on AWS.

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Create S3 bucket**
   ```bash
   aws s3 mb s3://your-autocare-pro-bucket
   ```

3. **Configure bucket for static hosting**
   ```bash
   aws s3 website s3://your-autocare-pro-bucket \
     --index-document index.html \
     --error-document index.html
   ```

4. **Upload files**
   ```bash
   aws s3 sync dist/ s3://your-autocare-pro-bucket --delete
   ```

5. **Set up CloudFront distribution**
   - Create CloudFront distribution
   - Point to S3 bucket
   - Configure custom error pages for SPA routing

### DigitalOcean App Platform

1. **Create app via CLI**
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

2. **App specification** (`.do/app.yaml`):
   ```yaml
   name: autocare-pro
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/autocare-pro
       branch: main
     run_command: npm start
     build_command: npm run build
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     routes:
     - path: /
     envs:
     - key: NODE_ENV
       value: production
   ```

### Traditional VPS/Server

For deployment on your own server or VPS.

1. **Install dependencies on server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Clone and build application**
   ```bash
   git clone https://github.com/your-username/autocare-pro.git
   cd autocare-pro
   npm install
   npm run build
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/autocare-pro/dist;
       index index.html;
   
       location / {
           try_files $uri $uri/ /index.html;
       }
   
       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   
       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header X-Content-Type-Options "nosniff" always;
   }
   ```

4. **Enable and start Nginx**
   ```bash
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

## 🔒 SSL/HTTPS Setup

### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Using Cloudflare

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS encryption
4. Configure page rules for caching

## 🌍 Environment Variables

Set these environment variables in your hosting platform:

```bash
# Application
VITE_APP_NAME=AutoCare Pro
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.your-domain.com

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Error tracking (optional)
VITE_SENTRY_DSN=https://your-sentry-dsn
```

## 📊 Performance Optimization

### Build Optimizations

1. **Enable compression**
   ```bash
   # Gzip compression in build
   npm install --save-dev vite-plugin-compression
   ```

2. **Bundle analysis**
   ```bash
   npm install --save-dev rollup-plugin-visualizer
   npm run build -- --analyze
   ```

3. **Image optimization**
   - Use WebP format for images
   - Implement lazy loading
   - Use appropriate image sizes

### CDN Configuration

1. **Static assets on CDN**
   - Upload static assets to CDN
   - Update build to use CDN URLs
   - Configure cache headers

2. **Popular CDN options**
   - Cloudflare
   - AWS CloudFront
   - KeyCDN
   - MaxCDN

## 🔍 Monitoring & Analytics

### Error Tracking

1. **Sentry integration**
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

2. **Google Analytics**
   ```bash
   npm install gtag
   ```

### Performance Monitoring

- **Web Vitals**: Monitor Core Web Vitals
- **Lighthouse**: Regular performance audits
- **Real User Monitoring**: Track actual user experience

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 🚨 Troubleshooting

### Common Issues

1. **Routing issues (404 on refresh)**
   - Configure server for SPA routing
   - Add fallback to `index.html`

2. **Environment variables not working**
   - Ensure variables start with `VITE_`
   - Restart build after adding variables

3. **Build failures**
   - Check Node.js version compatibility
   - Clear cache: `rm -rf node_modules package-lock.json && npm install`

4. **Performance issues**
   - Enable compression
   - Optimize images
   - Use CDN for static assets

### Debugging

1. **Build locally first**
   ```bash
   npm run build
   npm run preview
   ```

2. **Check browser console for errors**

3. **Use development build for debugging**
   ```bash
   npm run dev
   ```

## 📞 Support

If you encounter deployment issues:

1. Check the [Issues](https://github.com/your-username/autocare-pro/issues) page
2. Create a new issue with deployment details
3. Include error logs and environment information

---

**Happy Deploying! 🚀**