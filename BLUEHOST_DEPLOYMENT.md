# Deploying DankNet on Bluehost

## Prerequisites
1. Bluehost hosting account with:
   - Node.js support enabled
   - SSH access enabled
   - SSL certificate (can be obtained free through Let's Encrypt in Bluehost)
   - MongoDB database (you'll need to use MongoDB Atlas since Bluehost doesn't provide MongoDB)

## Step 1: Set Up MongoDB Atlas
1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier is sufficient to start)
3. Set up database access:
   - Create a database user
   - Save the connection string
4. Whitelist IP addresses:
   - Add your Bluehost server IP
   - Temporarily add your local IP for testing

## Step 2: Prepare Your Domain
1. Log in to Bluehost control panel
2. Go to "Domains" section
3. Point app.dankbulls.com to your Bluehost hosting:
   - Add a new subdomain
   - Set up DNS A record for app.dankbulls.com
   - Wait for DNS propagation (can take up to 48 hours)

## Step 3: Set Up SSL Certificate
1. In Bluehost control panel, go to "Security" section
2. Select "SSL Certificates"
3. Request a new certificate for app.dankbulls.com
4. Wait for certificate installation

## Step 4: Configure Node.js Environment
1. Log in to Bluehost via SSH:
   ```bash
   ssh username@your-domain.com
   ```

2. Install Node Version Manager (nvm):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   ```

3. Install Node.js:
   ```bash
   nvm install 18
   nvm use 18
   ```

4. Install PM2 for process management:
   ```bash
   npm install -g pm2
   ```

## Step 5: Deploy Backend
1. Create deployment directory:
   ```bash
   mkdir -p ~/app.dankbulls.com/backend
   cd ~/app.dankbulls.com/backend
   ```

2. Upload backend files:
   - Use SFTP to upload your backend directory
   - Exclude node_modules and .env files

3. Install dependencies:
   ```bash
   npm install --production
   ```

4. Create .env file:
   ```bash
   nano .env
   ```
   Add environment variables:
   ```
   NODE_ENV=production
   PORT=4000
   MONGODB_URI=your_mongodb_atlas_uri
   WEATHER_API_KEY=your_weather_api_key
   OPENAI_API_KEY=your_openai_api_key
   MODEL_STORAGE_PATH=/home/username/app.dankbulls.com/backend/models
   ```

5. Start backend with PM2:
   ```bash
   pm2 start npm --name "danknet-backend" -- start
   pm2 save
   ```

## Step 6: Deploy Frontend
1. Build frontend locally:
   ```bash
   cd frontend
   npm run build
   ```

2. Create frontend directory on Bluehost:
   ```bash
   mkdir -p ~/app.dankbulls.com/public_html
   ```

3. Upload build files:
   - Use SFTP to upload the contents of your build directory to public_html

## Step 7: Configure Apache (Bluehost uses Apache)
1. Create .htaccess file:
   ```bash
   nano ~/app.dankbulls.com/public_html/.htaccess
   ```

2. Add rewrite rules:
   ```apache
   RewriteEngine On
   RewriteBase /
   
   # Handle frontend routes
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ /index.html [L]
   
   # Proxy /api requests to backend
   RewriteCond %{REQUEST_URI} ^/api/
   RewriteRule ^api/(.*) http://localhost:4000/api/$1 [P,L]
   ```

## Step 8: Set Up Reverse Proxy
1. Contact Bluehost support to:
   - Enable mod_proxy
   - Configure virtual host for app.dankbulls.com
   - Set up reverse proxy for the backend

2. Request this configuration:
   ```apache
   <VirtualHost *:80>
       ServerName app.dankbulls.com
       DocumentRoot /home/username/app.dankbulls.com/public_html
       
       RewriteEngine On
       RewriteCond %{HTTPS} off
       RewriteRule (.*) https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
   </VirtualHost>

   <VirtualHost *:443>
       ServerName app.dankbulls.com
       DocumentRoot /home/username/app.dankbulls.com/public_html
       
       SSLEngine on
       SSLCertificateFile /path/to/certificate.crt
       SSLCertificateKeyFile /path/to/private.key
       
       ProxyRequests Off
       ProxyPreserveHost On
       
       <Location /api>
           ProxyPass http://localhost:4000/api
           ProxyPassReverse http://localhost:4000/api
       </Location>
       
       <Directory /home/username/app.dankbulls.com/public_html>
           Options -MultiViews
           RewriteEngine On
           RewriteCond %{REQUEST_FILENAME} !-f
           RewriteRule ^ index.html [QSA,L]
       </Directory>
   </VirtualHost>
   ```

## Step 9: Final Steps
1. Set up automatic backend startup:
   ```bash
   pm2 startup
   ```
   Follow the instructions provided by PM2

2. Test your deployment:
   - Visit https://app.dankbulls.com
   - Test API endpoints
   - Check SSL certificate
   - Verify MongoDB connection

## Monitoring and Maintenance
1. Monitor backend process:
   ```bash
   pm2 monit
   pm2 logs danknet-backend
   ```

2. Update application:
   ```bash
   cd ~/app.dankbulls.com/backend
   git pull
   npm install
   pm2 restart danknet-backend
   
   cd ~/app.dankbulls.com/public_html
   # Upload new frontend build files
   ```

## Troubleshooting
1. Check backend logs:
   ```bash
   pm2 logs danknet-backend
   ```

2. Check Apache error logs:
   ```bash
   tail -f /var/log/apache2/error.log
   ```

3. Common issues:
   - 502 Bad Gateway: Backend not running or proxy misconfiguration
   - CORS errors: Check backend CORS configuration
   - MongoDB connection issues: Check IP whitelist and credentials
