// Email Service using Nodemailer
// This file can be deployed as a serverless function (Vercel, Netlify, etc.)
// Or run as a simple Express server

require('dotenv').config();
const nodemailer = require('nodemailer');

// Email configuration from environment variables
const EMAIL_CONFIG = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS || 'bhojanaxpress@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'wogz xosm yqvp prwa' // App password
    }
};

// Create transporter
const transporter = nodemailer.createTransporter(EMAIL_CONFIG);

// Send email function
async function sendContactEmail(contactData) {
    const { name, email, subject, message } = contactData;
    
    const mailOptions = {
        from: EMAIL_CONFIG.auth.user,
        to: process.env.EMAIL_TO || 'omkargouda1204@gmail.com', // Your email from .env
        replyTo: email, // User's email for easy reply
        subject: `Portfolio Contact: ${subject}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #8B5CF6; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px;">
                    New Contact Form Submission
                </h2>
                
                <div style="margin: 20px 0;">
                    <p style="margin: 10px 0;"><strong>From:</strong> ${name}</p>
                    <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
                </div>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Message:</h3>
                    <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
                    <p>This email was sent from your portfolio contact form.</p>
                    <p>Sent at: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: error.message };
    }
}

// Express server example (for local testing or deployment)
if (require.main === module) {
    const express = require('express');
    const cors = require('cors');
    const app = express();
    
    app.use(cors());
    app.use(express.json());
    
    app.post('/api/send-email', async (req, res) => {
        try {
            const result = await sendContactEmail(req.body);
            if (result.success) {
                res.json({ success: true, message: 'Email sent successfully' });
            } else {
                res.status(500).json({ success: false, error: result.error });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`📧 Email service running on port ${PORT}`);
    });
}

// Export for serverless functions
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        const result = await sendContactEmail(req.body);
        if (result.success) {
            res.status(200).json({ success: true, message: 'Email sent successfully' });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
