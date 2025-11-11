// Supabase Configuration for Portfolio Project
// This replaces Firebase with Supabase SQL database and storage
// NOTE: In production, these should come from environment variables
// For browser-based apps, these values are safe to expose (they're public)
// The real security is handled by Supabase Row Level Security (RLS)

const SUPABASE_URL = 'https://ckyxqzgckwzimmdukmvl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNreXhxemdja3d6aW1tZHVrbXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODgxNDUsImV4cCI6MjA3Nzc2NDE0NX0.7Yneds1Gz92R9V9IKiJ_67fB44-5LfV3CmCoe_XBZgA';
const STORAGE_BUCKET = 'Portfolio';  // Using the Portfolio bucket with folders: profiles/, resumes/, certificates/, projects/
// Storage endpoint for signed URLs
const STORAGE_URL = 'https://ckyxqzgckwzimmdukmvl.storage.supabase.co/storage/v1/s3/Portfolio';

// Initialize Supabase client using the global supabase object from CDN
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        console.log('🔍 Testing Supabase connection...');
        
        // Try to query profile table
        const { data, error } = await supabaseClient
            .from('profile')
            .select('*')
            .limit(1);
        
        if (error) {
            console.warn('⚠️ Profile table query failed:', error.message);
            console.log('ℹ️ This is normal if tables are not created yet.');
            console.log('📋 Please run the SQL schema in Supabase Dashboard.');
            return false;
        }
        
        console.log('✅ Supabase connection successful!');
        console.log('📊 Data:', data);
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
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
