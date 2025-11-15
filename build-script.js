// Build script to replace environment variable placeholders with actual values
// This runs during Netlify build process
const fs = require('fs');
const path = require('path');

console.log('🔨 Starting build process...');

// Get environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'Portfolio';
const STORAGE_URL = process.env.STORAGE_URL;

// Validate required environment variables
const requiredEnvVars = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    STORAGE_URL
};

const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('Please set these in Netlify: Site settings > Environment variables');
    process.exit(1);
}

console.log('✅ All required environment variables found');

// Read supabase-config.js
const configPath = path.join(__dirname, 'supabase-config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace placeholders with actual values
configContent = configContent
    .replace(/'__SUPABASE_URL__'/g, `'${SUPABASE_URL}'`)
    .replace(/'__SUPABASE_ANON_KEY__'/g, `'${SUPABASE_ANON_KEY}'`)
    .replace(/'__STORAGE_BUCKET__'/g, `'${STORAGE_BUCKET}'`)
    .replace(/'__STORAGE_URL__'/g, `'${STORAGE_URL}'`);

// Write back to file
fs.writeFileSync(configPath, configContent, 'utf8');

console.log('✅ Environment variables injected successfully');
console.log('📦 Build complete!');
