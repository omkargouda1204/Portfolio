# Portfolio Website with Admin Panel

A modern, responsive portfolio website with a comprehensive admin panel for managing content dynamically.

## Features

### Portfolio Website
- ✨ Modern, responsive design with dark mode
- 📱 Mobile-friendly interface
- 🎨 Gradient animations and smooth transitions
- 📧 Contact form with email notifications
- 🖼️ Dynamic content loading from Supabase
- 📜 Sections: About, Skills, Projects, Education, Certificates

### Admin Panel
- 🔐 Password-protected dashboard
- 📊 Real-time statistics
- 📝 CRUD operations for all content
- 📤 File upload support (images, PDFs, resumes)
- 💬 Message inbox with unread count
- 🌓 Theme toggle (dark/light mode)
- ✅ Form validation

## Database Schema

### Tables
1. **profile** - Personal information, social links, profile image, resume
2. **about** - About section content and description
3. **skills** - Technical skills with proficiency levels and categories
4. **projects** - Portfolio projects with images, technologies, links
5. **education** - Educational background with timeline
6. **certificates** - Certifications and achievements with files
7. **contact_messages** - Messages from contact form

## Setup Instructions

### 1. Supabase Setup

1. Create account at [https://supabase.com](https://supabase.com)
2. Create new project
3. Run the SQL from `database-fix.sql` in SQL Editor to create all columns
4. Create storage bucket named "Portfolio" (private bucket recommended)
5. Copy your Supabase URL and Anon Key
6. Add to `.env` file (local) or Netlify environment variables (production):
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   STORAGE_BUCKET=Portfolio
   STORAGE_URL=your_storage_url
   ```

### 2. Email Service Setup

#### Option A: Local Development
```bash
# Install dependencies
npm install

# Start email service
npm start
```
The email service will run on `http://localhost:3000`

#### Option B: Deploy to Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "email-service.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/send-email",
      "dest": "email-service.js"
    }
  ]
}
```
3. Deploy: `vercel --prod`
4. Update `portfolio-supabase.js` with your Vercel URL

#### Option C: Use EmailJS (No Backend Required)
1. Create free account at [https://www.emailjs.com](https://www.emailjs.com)
2. Create email service and template
3. Add EmailJS SDK to `index.html`:
```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
```
4. Update contact form handler with EmailJS code

### 3. Local Development

```bash
# Start Python HTTP server (Python 3)
python -m http.server 8000

# Or use Python 2
python -m SimpleHTTPServer 8000

# Or use Node.js http-server
npx http-server -p 8000
```

Visit:
- Portfolio: `http://localhost:8000/index.html`
- Admin Panel: `http://localhost:8000/admin.html`

### 4. Admin Login

Default password: `Admin@123`

To change, update line 16 in `admin-supabase.js`:
```javascript
const ADMIN_PASSWORD = 'YourNewPassword';
```

## Email Configuration

The email service uses Gmail SMTP. Configure via environment variables:
- **EMAIL_ADDRESS**: Your Gmail address (sender)
- **EMAIL_PASSWORD**: Gmail app-specific password
- **EMAIL_TO**: Recipient email address

### Gmail App Password Setup
1. Enable 2FA on your Gmail account
2. Go to Google Account > Security > 2-Step Verification
3. Scroll to "App passwords" and generate new password
4. Add to `.env` file or Netlify environment variables

## File Upload

Supported file types:
- **Profile Image**: JPG, PNG, GIF (max 5MB)
- **Resume**: PDF (max 10MB)
- **Project Images**: JPG, PNG, GIF (max 5MB)
- **Certificates**: PDF, JPG, PNG (max 10MB)

Files are stored in Supabase Storage bucket "portfolio".

## Deployment

### Deploy to GitHub Pages
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/portfolio.git
git push -u origin main
```

Enable GitHub Pages in repository settings → Pages → Deploy from main branch.

### Deploy to Netlify
1. Drag and drop your folder to [https://app.netlify.com](https://app.netlify.com)
2. Or connect GitHub repository
3. Build settings: none needed (static site)

### Deploy to Vercel
```bash
npm i -g vercel
vercel --prod
```

## File Structure

```
portfolio/
├── index.html                 # Portfolio website
├── admin.html                 # Admin panel
├── portfolio-supabase.js      # Portfolio logic
├── admin-supabase.js          # Admin panel logic
├── supabase-config.js         # Supabase configuration
├── styles.css                 # Custom styles
├── email-service.js           # Email backend service
├── package.json               # Node.js dependencies
├── database-fix.sql           # Database schema
└── README.md                  # This file
```

## Technologies Used

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Email**: Nodemailer with Gmail SMTP
- **Icons**: Font Awesome 6
- **Fonts**: Google Fonts (Inter)
- **Animations**: AOS (Animate On Scroll)

## Troubleshooting

### Admin Panel Issues
1. **setupThemeToggle is not defined**
   - Fixed: Function added to admin-supabase.js

2. **Data not displaying**
   - Check browser console for errors
   - Verify Supabase credentials in supabase-config.js
   - Ensure database tables have data
   - Check RLS policies are disabled or properly configured

3. **File upload fails**
   - Verify storage bucket "portfolio" exists
   - Ensure bucket is public
   - Check file size limits

### Portfolio Issues
1. **No data showing**
   - Add data through admin panel first
   - Check browser console for errors
   - Verify loadAllData() is being called

2. **Images not loading**
   - Check Supabase storage URLs
   - Verify bucket is public
   - Check file paths in database

### Email Issues
1. **Emails not sending**
   - Start email service: `npm start`
   - Check Gmail app password is correct
   - Verify SMTP settings in email-service.js
   - Check console for errors

2. **CORS errors**
   - Enable CORS in email-service.js (already configured)
   - Or deploy to same domain

## Support

For issues or questions:
- Check browser console for detailed error messages
- Verify all setup steps were completed
- Review the documentation files included in this project

## License

MIT License - Feel free to use for your own portfolio!

---

Made with ❤️ by Omkar Gouda
