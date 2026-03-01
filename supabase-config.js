// Supabase Configuration for Portfolio Project
// This replaces Firebase with Supabase SQL database and storage

// For development/testing, you can set your Supabase credentials here:
// Copy these from your Supabase project dashboard -> Settings -> API
let SUPABASE_URL = 'https://ckyxqzgckwzimmdukmvl.supabase.co';
let SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNreXhxemdja3d6aW1tZHVrbXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODgxNDUsImV4cCI6MjA3Nzc2NDE0NX0.7Yneds1Gz92R9V9IKiJ_67fB44-5LfV3CmCoe_XBZgA';
let STORAGE_BUCKET = 'Portfolio';
let STORAGE_URL = 'https://ckyxqzgckwzimmdukmvl.supabase.co/storage/v1/object/public/Portfolio/';

console.log('✅ Using real Supabase credentials');
console.log('📍 Project URL:', SUPABASE_URL);
console.log('📦 Storage Bucket:', STORAGE_BUCKET);

// Initialize Supabase client safely
let supabaseClient = null;
try {
    if (window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized with real credentials');
    } else {
        console.error('❌ Supabase library not loaded. Make sure to include the CDN script.');
    }
} catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    supabaseClient = null;
}

// Export for use in other files
window.supabase = supabaseClient;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_KEY = SUPABASE_ANON_KEY;
window.STORAGE_BUCKET = STORAGE_BUCKET;
window.STORAGE_URL = STORAGE_URL;

// Generate Signed URL for Private Files (certificates, resumes, images)
async function getSignedUrl(filePath, expiresIn = 3600) {
    try {
        if (!filePath) throw new Error('No file path provided');
        
        console.log('🔐 Generating signed URL for:', filePath);
        
        // Remove any URL prefix and clean the path
        let cleanPath = filePath;
        
        // Remove full URL if present (multiple patterns)
        cleanPath = cleanPath
            .replace(/^https?:\/\/[^\/]+\.storage\.supabase\.co\/storage\/v1\/s3\/Portfolio\//, '')
            .replace(/^https?:\/\/[^\/]+\/storage\/v1\/object\/public\/[Pp]ortfolio\//, '')
            .replace(/^https?:\/\/[^\/]+\/storage\/v1\/object\/sign\/[Pp]ortfolio\//, '')
            .replace(/^[Pp]ortfolio\//, '')
            .replace(/^\/*/, ''); // Remove leading slashes
        
        console.log('📂 Clean path:', cleanPath);
        
        const { data, error } = await supabaseClient.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(cleanPath, expiresIn);
        
        if (error) {
            console.error('❌ Signed URL error:', error);
            throw error;
        }
        
        console.log('✅ Signed URL generated:', data.signedUrl);
        return { success: true, url: data.signedUrl };
    } catch (error) {
        console.error('❌ Signed URL generation failed:', error.message);
        return { success: false, error: error.message };
    }
}

// File Upload Helper Function
async function uploadFile(file, folder = 'uploads') {
    try {
        if (!file) throw new Error('No file provided');
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        console.log('📤 Uploading file:', fileName);
        
        // Upload file to Supabase Storage
        const { data, error } = await supabaseClient.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        
        console.log('✅ File uploaded successfully:', fileName);
        
        // For PRIVATE bucket, always return path only (not public URL)
        // Signed URLs will be generated when needed
        return { success: true, url: fileName, path: fileName };
    } catch (error) {
        console.error('❌ Upload error:', error);
        return { success: false, error: error.message };
    }
}

// Delete File Helper Function
async function deleteFile(filePath) {
    try {
        if (!filePath) return { success: true };
        
        console.log('🗑️ Deleting file:', filePath);
        
        // Clean path - remove any URL prefix
        let cleanPath = filePath
            .replace(/^https?:\/\/[^\/]+\.storage\.supabase\.co\/storage\/v1\/s3\/Portfolio\//, '')
            .replace(/^https?:\/\/[^\/]+\/storage\/v1\/object\/[^\/]+\/[Pp]ortfolio\//, '')
            .replace(/^[Pp]ortfolio\//, '')
            .replace(/^\/*/, ''); // Remove leading slashes
        
        console.log('📂 Clean path for deletion:', cleanPath);
        
        const { error } = await supabaseClient.storage
            .from(STORAGE_BUCKET)
            .remove([cleanPath]);
        
        if (error) throw error;
        
        console.log('✅ File deleted successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Delete error:', error);
        return { success: false, error: error.message };
    }
}

window.uploadFile = uploadFile;
window.deleteFile = deleteFile;
window.getSignedUrl = getSignedUrl;

console.log('✅ Supabase initialized successfully');
console.log('📍 Project URL:', SUPABASE_URL);
console.log('📦 Storage Bucket:', STORAGE_BUCKET);

// Test connection function
async function testConnection() {
    try {
        if (!supabaseClient) {
            console.error('❌ Supabase client not initialized');
            return false;
        }

        console.log('🔍 Testing Supabase connection...');

        // Race the query against a 6-second timeout
        const queryPromise = supabaseClient.from('profile').select('count').limit(1);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timed out after 6s')), 6000)
        );

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (error) {
            console.warn('⚠️ Database query failed:', error.message);
            console.log('ℹ️ This might mean tables are not created yet.');
            console.log('📋 Please run the database schema in your Supabase Dashboard > SQL Editor.');
            window.supabaseOnline = false;
            return false;
        }

        console.log('✅ Supabase connection successful!');
        window.supabaseOnline = true;
        return true;
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        if (error.message.includes('timed out') || error.message.includes('fetch')) {
            console.error('💤 Supabase project may be PAUSED. Go to https://supabase.com/dashboard to restore it.');
            window.supabaseOnline = false;
            // Show visible banner on page
            const banner = document.getElementById('db-offline-banner');
            if (banner) banner.classList.remove('hidden');
        }
        return false;
    }
}

// Auto-test connection on load
setTimeout(() => {
    testConnection();
}, 1000);

// Export test function
window.testSupabaseConnection = testConnection;

// Debug function to check profile data
async function debugProfileData() {
    console.log('=== DEBUG PROFILE DATA ===');
    const { data, error } = await supabaseClient.from('profile').select('*').limit(1).single();
    if (error) {
        console.error('Error fetching profile:', error);
    } else {
        console.log('Profile from database:', data);
        console.log('Profile image URL:', data.profile_image_url);
        console.log('Profile image (legacy):', data.profile_image);
    }
    return data;
}

window.debugProfileData = debugProfileData;

// Test if image URL is accessible
async function testImageUrl(url) {
    console.log('Testing image URL:', url);
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            console.log('✅ Image loads successfully:', url);
            resolve(true);
        };
        img.onerror = (err) => {
            console.error('❌ Image failed to load:', url, err);
            resolve(false);
        };
        img.src = url;
    });
}

window.testImageUrl = testImageUrl;