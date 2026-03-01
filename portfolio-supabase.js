// Portfolio Website - Powered by Supabase
// This file handles all frontend functionality for the portfolio

// Get Supabase client from window (set by supabase-config.js)
// Use window.supabase instead of creating a local const to ensure it's available when needed
function getSupabaseClient() {
    return window.supabase;
}

// Global State
let portfolioData = {
    about: {},
    skills: [],
    projects: [],
    certificates: [],
    education: [],
    profile: {},
    settings: {}
};

// Typing Effect
function startTypingEffect(element, text) {
    if (!element || !text) return;
    element.textContent = '';
    let i = 0;
    const speed = 100; // Typing speed in milliseconds
    
    function typeWriter() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        }
    }
    
    // Start typing after a short delay
    setTimeout(typeWriter, 500);
}

// Image URLs from database already include the correct /public/ path
function resolveImageUrl(url) {
    // URLs from uploadFile() already have format:
    // https://xxx.supabase.co/storage/v1/object/public/portfolio/profiles/filename.jpg
    return url;
}

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const themeToggle = document.getElementById('theme-toggle');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const contactForm = document.getElementById('contact-form');
const certificateModal = document.getElementById('certificate-modal');
const toast = document.getElementById('toast');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Wait for Supabase to be ready (with extended timeout)
async function waitForSupabase(maxWait = 10000) {
    const startTime = Date.now();
    while (!window.supabase || !window.getSignedUrl) {
        if (Date.now() - startTime > maxWait) {
            console.warn('⚠️ Supabase functions not ready, continuing with basic mode');
            return false;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return true;
}

async function initializeApp() {
    try {
        // Wait for Supabase to be ready (but don't fail if timeout)
        const supabaseReady = await waitForSupabase();
        console.log(supabaseReady ? '✅ Supabase ready' : '⚠️ Continuing without signed URLs');

        // Initialize AOS animations
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 1000,
                once: true,
                offset: 100
            });
        }

        // Load theme preference
        loadTheme();

        // Setup event listeners
        setupEventListeners();

        // Load all data from Supabase
        await loadAllData();

        // Render all sections with signed URLs
        await renderAllSections();

        // Hide loading screen
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }, 500);

    } catch (error) {
        console.error('Error initializing app:', error);
        if (loadingScreen) {
            loadingScreen.innerHTML = '<div class="text-red-500">Error loading portfolio. Please refresh the page.</div>';
        }
    }
}

// Load all data from Supabase
async function loadAllData() {
    try {
        console.log('Loading data from Supabase...');

        const supabaseClient = getSupabaseClient();

        if (!supabaseClient) {
            console.error('❌ Supabase client not initialized');
            return;
        }

        // Quick connection check with 7s timeout before loading all data
        const connectCheck = await Promise.race([
            supabaseClient.from('profile').select('count').limit(1),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 7000))
        ]).catch(err => ({ error: err }));

        if (connectCheck.error) {
            const msg = connectCheck.error.message || '';
            if (msg === 'timeout' || msg.includes('fetch') || msg.includes('network')) {
                console.error('💤 Supabase project appears PAUSED or unreachable.');
                console.error('👉 Fix: https://supabase.com/dashboard → Restore your project');
                const banner = document.getElementById('db-offline-banner');
                if (banner) banner.classList.remove('hidden');
                return; // Stop loading, don't hang
            }
        }

        // Load Profile
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profile')
            .select('*')
            .limit(1)
            .single();
        
        if (!profileError && profileData) {
            portfolioData.profile = profileData;
            console.log('✅ Profile loaded:', profileData);
        }

        // Load About
        const { data: aboutData, error: aboutError } = await supabaseClient
            .from('about')
            .select('*')
            .limit(1)
            .single();
        
        if (!aboutError && aboutData) {
            portfolioData.about = aboutData;
            // Parse skills if it's a JSON string
            if (typeof aboutData.skills === 'string') {
                portfolioData.about.skills = JSON.parse(aboutData.skills);
            }
            console.log('✅ About loaded:', aboutData);
        }

        // Load Projects
        const { data: projectsData, error: projectsError } = await supabaseClient
            .from('projects')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (!projectsError && projectsData) {
            portfolioData.projects = projectsData.map(project => {
                // Parse technologies if it's a JSON string
                if (typeof project.technologies === 'string') {
                    project.technologies = JSON.parse(project.technologies);
                }
                return project;
            });
            console.log('✅ Projects loaded:', projectsData.length);
        }

        // Load Skills
        const { data: skillsData, error: skillsError } = await supabaseClient
            .from('skills')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (!skillsError && skillsData) {
            portfolioData.skills = skillsData;
            console.log('✅ Skills loaded:', skillsData.length);
        }

        // Load Experience
        const { data: experienceData, error: experienceError } = await supabaseClient
            .from('experience')
            .select('*')
            .order('start_date', { ascending: false });
        
        if (!experienceError && experienceData) {
            portfolioData.experience = experienceData.map(exp => {
                // Parse achievements if it's a JSON string
                if (typeof exp.achievements === 'string') {
                    exp.achievements = JSON.parse(exp.achievements);
                }
                return exp;
            });
            console.log('✅ Experience loaded:', experienceData.length);
        }

        // Load Education
        const { data: educationData, error: educationError } = await supabaseClient
            .from('education')
            .select('*')
            .order('start_year', { ascending: false });
        
        if (!educationError && educationData) {
            portfolioData.education = educationData;
            console.log('✅ Education loaded:', educationData.length);
        }

        // Load Certificates
        const { data: certificatesData, error: certificatesError } = await supabaseClient
            .from('certificates')
            .select('*')
            .order('issue_date', { ascending: false });
        
        if (!certificatesError && certificatesData) {
            portfolioData.certificates = certificatesData;
            console.log('✅ Certificates loaded:', certificatesData.length);
        }

        console.log('✅ All data loaded successfully!');
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading portfolio data', 'error');
    }
}

// Render all sections
async function renderAllSections() {
    await renderProfile();
    renderAbout();
    renderSkills();
    await renderProjects();
    renderEducation();
    await renderCertificates();
}

// Render Profile Section
async function renderProfile() {
    const profile = portfolioData.profile;
    if (!profile || Object.keys(profile).length === 0) {
        console.warn('No profile data available');
        return;
    }

    console.log('Rendering profile with data:', profile);

    // Update hero section
    const heroName = document.getElementById('hero-name');
    const heroTitle = document.getElementById('hero-tagline');
    const heroBio = document.getElementById('hero-bio');
    const profileContainer = document.querySelector('.profile-container div');

    if (heroName) heroName.textContent = profile.name || 'Your Name';
    
    // Auto-changing titles with typing effect
    if (heroTitle) {
        const titles = profile.hero_typing_texts || ['Full Stack Developer', 'UI/UX Designer', 'Software Engineer'];
        let currentIndex = 0;
        
        function changeTitle() {
            heroTitle.textContent = '';
            const currentTitle = titles[currentIndex];
            let charIndex = 0;
            
            function typeChar() {
                if (charIndex < currentTitle.length) {
                    heroTitle.textContent += currentTitle.charAt(charIndex);
                    charIndex++;
                    setTimeout(typeChar, 100);
                } else {
                    // Wait before switching to next title
                    setTimeout(() => {
                        currentIndex = (currentIndex + 1) % titles.length;
                        changeTitle();
                    }, 3000);
                }
            }
            
            typeChar();
        }
        
        changeTitle();
    }
    
    if (heroBio) heroBio.textContent = profile.bio || 'Welcome to my portfolio';
    
    // Update profile image - ALWAYS use signed URLs for private bucket
    const imgPath = profile.profile_image_url || profile.profile_image;
    
    if (profileContainer && imgPath) {
        if (!window.getSignedUrl) {
            console.error('❌ getSignedUrl function not available');
            profileContainer.innerHTML = `<i class="fas fa-user text-6xl text-gray-400"></i>`;
            return;
        }
        
        // Show loading spinner while generating signed URL
        profileContainer.innerHTML = `<i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>`;
        console.log('🔐 Generating signed URL for profile image:', imgPath);
        
        try {
            const result = await window.getSignedUrl(imgPath, 3600);
            
            if (result.success && result.url) {
                profileContainer.innerHTML = `<img src="${result.url}" alt="${profile.name}" class="w-full h-full object-cover rounded-full" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-user text-6xl text-gray-400\\'></i>';">`;
                console.log('✅ Profile image loaded with signed URL');
            } else {
                console.error('❌ Failed to generate signed URL:', result.error);
                profileContainer.innerHTML = `<i class="fas fa-user text-6xl text-gray-400"></i>`;
            }
        } catch (err) {
            console.error('❌ Error generating signed URL:', err);
            profileContainer.innerHTML = `<i class="fas fa-user text-6xl text-gray-400"></i>`;
        }
    } else if (profileContainer) {
        // No image URL, show default icon
        profileContainer.innerHTML = `<i class="fas fa-user text-6xl text-gray-400"></i>`;
        console.log('ℹ️ No profile image URL, showing default icon');
    }

    // Update contact info
    const contactEmail = document.getElementById('contact-email');
    const contactPhone = document.getElementById('contact-phone');
    const contactLocation = document.getElementById('contact-location');

    if (contactEmail && profile.email) {
        contactEmail.textContent = profile.email;
        contactEmail.href = `mailto:${profile.email}`;
    }

    if (contactPhone && profile.phone) {
        contactPhone.textContent = profile.phone;
        contactPhone.href = `tel:${profile.phone}`;
    }

    if (contactLocation && profile.location) {
        contactLocation.textContent = profile.location;
    }

    // Update social links in both hero and contact sections
    const heroSocialLinks = document.getElementById('hero-social-links');
    const contactSocialLinks = document.getElementById('contact-social-links');
    
    const socialLinksHTML = [];
    
    if (profile.github_url) {
        socialLinksHTML.push(`<a href="${profile.github_url}" target="_blank" rel="noopener noreferrer" class="w-12 h-12 rounded-full bg-gray-200 dark:bg-dark-bg flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all duration-300 transform hover:scale-110"><i class="fab fa-github text-xl"></i></a>`);
    }
    
    if (profile.linkedin_url) {
        socialLinksHTML.push(`<a href="${profile.linkedin_url}" target="_blank" rel="noopener noreferrer" class="w-12 h-12 rounded-full bg-gray-200 dark:bg-dark-bg flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all duration-300 transform hover:scale-110"><i class="fab fa-linkedin text-xl"></i></a>`);
    }
    
    if (profile.twitter_url) {
        socialLinksHTML.push(`<a href="${profile.twitter_url}" target="_blank" rel="noopener noreferrer" class="w-12 h-12 rounded-full bg-gray-200 dark:bg-dark-bg flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all duration-300 transform hover:scale-110"><i class="fab fa-twitter text-xl"></i></a>`);
    }
    
    if (profile.naukri_url) {
        socialLinksHTML.push(`<a href="${profile.naukri_url}" target="_blank" rel="noopener noreferrer" class="w-12 h-12 rounded-full bg-gray-200 dark:bg-dark-bg flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all duration-300 transform hover:scale-110"><i class="fas fa-briefcase text-xl"></i></a>`);
    }
    
    if (profile.website_url) {
        socialLinksHTML.push(`<a href="${profile.website_url}" target="_blank" rel="noopener noreferrer" class="w-12 h-12 rounded-full bg-gray-200 dark:bg-dark-bg flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all duration-300 transform hover:scale-110"><i class="fas fa-globe text-xl"></i></a>`);
    }
    
    if (heroSocialLinks && socialLinksHTML.length > 0) {
        heroSocialLinks.innerHTML = socialLinksHTML.join('');
    }
    
    if (contactSocialLinks && socialLinksHTML.length > 0) {
        contactSocialLinks.innerHTML = socialLinksHTML.join('');
    }

    // Setup download resume button - ALWAYS use signed URLs for private bucket
    const downloadCV = document.getElementById('download-cv');
    if (downloadCV) {
        downloadCV.onclick = async () => {
            if (!profile.resume_url) {
                showToast('Resume not available', 'error');
                return;
            }
            
            if (!window.getSignedUrl) {
                showToast('Download function not available', 'error');
                return;
            }
            
            try {
                showToast('Generating download link...', 'info');
                
                console.log('🔐 Generating signed URL for resume:', profile.resume_url);
                
                // Always generate signed URL for private bucket
                const result = await window.getSignedUrl(profile.resume_url, 3600);
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to generate download link');
                }
                
                console.log('✅ Signed URL generated, downloading...');
                
                // Download using signed URL
                const response = await fetch(result.url);
                if (!response.ok) throw new Error('Failed to fetch resume');
                
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${profile.name || 'Resume'}_CV.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showToast('Resume downloaded successfully!', 'success');
                console.log('✅ Resume downloaded');
            } catch (error) {
                console.error('❌ Download error:', error);
                showToast('Failed to download resume. Please try again.', 'error');
            }
        };
    }

    console.log('✅ Profile rendered');
}

// Render About Section
function renderAbout() {
    const about = portfolioData.about;
    if (!about || Object.keys(about).length === 0) return;

    const aboutName = document.getElementById('about-name');
    const aboutDesc = document.getElementById('about-description');
    const projectsCount = document.getElementById('projects-count');
    const certificatesCount = document.getElementById('certificates-count');
    const happyClientsCount = document.getElementById('happy-clients-count');

    if (aboutName && portfolioData.profile && portfolioData.profile.name) {
        aboutName.textContent = portfolioData.profile.name;
    }
    
    if (aboutDesc && about.description) {
        aboutDesc.innerHTML = `<p>${about.description}</p>`;
    }
    
    // Display projects count - auto count or manual
    if (projectsCount) {
        if (about.auto_count_projects) {
            projectsCount.textContent = portfolioData.projects.length;
        } else {
            projectsCount.textContent = about.projects_count || 0;
        }
    }
    
    // Display certificates count - auto count or manual
    if (certificatesCount) {
        if (about.auto_count_certificates) {
            certificatesCount.textContent = portfolioData.certificates.length;
        } else {
            certificatesCount.textContent = about.certificates_count || 0;
        }
    }
    
    // Display happy clients count
    if (happyClientsCount) {
        happyClientsCount.textContent = about.happy_clients || 0;
    }

    console.log('✅ About rendered');
}

// Render Skills Section
function renderSkills() {
    const skills = portfolioData.skills;
    if (!skills || skills.length === 0) return;

    const skillsGrid = document.getElementById('skills-grid');
    if (!skillsGrid) return;

    // Group skills by category
    const skillsByCategory = {};
    skills.forEach(skill => {
        const category = skill.category || 'other';
        if (!skillsByCategory[category]) {
            skillsByCategory[category] = [];
        }
        skillsByCategory[category].push(skill);
    });

    // Create category filter buttons dynamically
    const skillsSection = document.getElementById('skills');
    const existingFilter = document.querySelector('.skills-filter');
    
    if (!existingFilter && skillsSection) {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'skills-filter flex justify-center flex-wrap gap-4 mb-8';
        
        // Add "All" button
        filterContainer.innerHTML = `
            <button class="skill-category-btn active px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white transition-all" data-category="all">
                All Skills
            </button>
        `;
        
        // Add category buttons
        Object.keys(skillsByCategory).forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'skill-category-btn px-6 py-2 rounded-full border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-all';
            btn.setAttribute('data-category', category);
            btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            filterContainer.appendChild(btn);
        });
        
        // Insert before skills grid
        skillsGrid.parentElement.insertBefore(filterContainer, skillsGrid);
    }

    // Render all skills
    skillsGrid.innerHTML = skills.map(skill => `
        <div class="skill-card bg-white dark:bg-dark-bg rounded-xl p-6 hover:shadow-2xl transition-all duration-300 hover-glow" data-category="${skill.category || 'other'}" data-aos="zoom-in">
            <div class="text-4xl mb-4 text-center">
                ${skill.icon_url ? `<img src="${skill.icon_url}" alt="${skill.name}" class="w-16 h-16 mx-auto">` : '<i class="fas fa-code text-purple-500"></i>'}
            </div>
            <h3 class="text-xl font-bold text-center mb-3 text-gray-800 dark:text-white">${skill.name}</h3>
            ${skill.proficiency_level ? `
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style="width: ${skill.proficiency_level}%"></div>
                </div>
                <p class="text-center text-sm text-gray-500 dark:text-gray-400">${skill.proficiency_level}%</p>
            ` : ''}
        </div>
    `).join('');

    // Setup category filter
    const categoryButtons = document.querySelectorAll('.skill-category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            
            // Update active button
            categoryButtons.forEach(b => {
                b.classList.remove('active', 'bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white');
                b.classList.add('border-2', 'border-purple-500', 'text-purple-500');
            });
            btn.classList.remove('border-2', 'border-purple-500', 'text-purple-500');
            btn.classList.add('active', 'bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white');
            
            // Filter skills
            const skillCards = document.querySelectorAll('.skill-card');
            skillCards.forEach(card => {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    console.log('✅ Skills rendered');
}

// Render Projects Section
async function renderProjects() {
    const projects = portfolioData.projects;
    if (!projects || projects.length === 0) return;

    const projectsContainer = document.getElementById('projects-grid');
    if (!projectsContainer) return;

    if (!window.getSignedUrl) {
        console.error('❌ getSignedUrl function not available');
        return;
    }

    // Generate signed URLs for ALL project images (required for private bucket)
    console.log('🔐 Generating signed URLs for', projects.length, 'projects...');
    
    const projectsWithSignedUrls = await Promise.all(projects.map(async project => {
        if (project.image_url) {
            try {
                console.log('🔐 Generating signed URL for project:', project.title);
                const result = await window.getSignedUrl(project.image_url, 3600);
                
                if (result.success) {
                    console.log('✅ Signed URL generated for:', project.title);
                    return { ...project, signedImageUrl: result.url };
                } else {
                    console.error('❌ Failed to generate signed URL for:', project.title, result.error);
                    return { ...project, signedImageUrl: null };
                }
            } catch (err) {
                console.error('❌ Error generating signed URL for project:', project.title, err);
                return { ...project, signedImageUrl: null };
            }
        }
        return { ...project, signedImageUrl: null };
    }));

    projectsContainer.innerHTML = projectsWithSignedUrls.map(project => `
        <div class="bg-white dark:bg-dark-bg rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover-glow" data-aos="fade-up">
            ${project.signedImageUrl ? `
                <img src="${project.signedImageUrl}" alt="${project.title}" class="w-full h-48 object-cover">
            ` : `
                <div class="w-full h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <i class="fas fa-project-diagram text-6xl text-white opacity-50"></i>
                </div>
            `}
            <div class="p-6">
                ${project.featured && localStorage.getItem('showFeaturedBadge') !== 'false' ? '<span class="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs mb-3">⭐ Featured</span>' : ''}
                <h3 class="text-2xl font-bold mb-3 text-gray-800 dark:text-white">${project.title}</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">${project.description || ''}</p>
                
                ${project.technologies && project.technologies.length > 0 ? `
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${project.technologies.map(tech => 
                            `<span class="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm">${tech}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                
                <div class="flex space-x-4">
                    ${project.live_url ? `
                        <a href="${project.live_url}" target="_blank" rel="noopener noreferrer" class="flex items-center text-white bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-lg hover:shadow-lg transition-all">
                            <i class="fas fa-external-link-alt mr-2"></i> Live Demo
                        </a>
                    ` : ''}
                    ${project.github_url ? `
                        <a href="${project.github_url}" target="_blank" rel="noopener noreferrer" class="flex items-center text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                            <i class="fab fa-github mr-2"></i> Code
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');

    console.log('✅ Projects rendered:', projects.length);
}

// Render Experience Section
function renderExperience() {
    const experience = portfolioData.experience;
    if (!experience || experience.length === 0) return;

    const experienceContainer = document.querySelector('[data-experience-container]');
    if (!experienceContainer) return;

    experienceContainer.innerHTML = experience.map(exp => {
        const startDate = new Date(exp.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const endDate = exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present';
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow" data-aos="fade-up">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold">${exp.position}</h3>
                        <p class="text-blue-600 dark:text-blue-400 font-semibold">${exp.company}</p>
                        ${exp.location ? `<p class="text-sm text-gray-600 dark:text-gray-400">${exp.location}</p>` : ''}
                    </div>
                    <span class="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                        ${startDate} - ${endDate}
                    </span>
                </div>
                ${exp.description ? `<p class="text-gray-600 dark:text-gray-400 mb-4">${exp.description}</p>` : ''}
                ${exp.achievements && exp.achievements.length > 0 ? `
                    <ul class="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                        ${exp.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `;
    }).join('');

    console.log('✅ Experience rendered:', experience.length);
}

// Render Education Section
function renderEducation() {
    const education = portfolioData.education;
    if (!education || education.length === 0) return;

    const educationContainer = document.getElementById('education-timeline');
    if (!educationContainer) return;

    educationContainer.innerHTML = education.map((edu, index) => {
        const startYear = edu.start_year || 'N/A';
        // If no end_year or ongoing is true, show "Ongoing"
        const endYear = edu.end_year || (edu.ongoing || !edu.end_year ? 'Ongoing' : 'Present');
        
        return `
            <div class="relative pl-8 pb-8 border-l-2 border-purple-500 ${index === education.length - 1 ? '' : 'mb-8'}" data-aos="fade-up">
                <div class="absolute -left-3 top-0 w-6 h-6 rounded-full bg-purple-500 border-4 border-white dark:border-dark-card"></div>
                <div class="bg-white dark:bg-dark-bg rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover-glow ml-4">
                    <div class="flex flex-wrap justify-between items-start mb-3">
                        <div>
                            <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-1">${edu.degree}</h3>
                            <p class="text-purple-600 dark:text-purple-400 font-semibold text-lg">${edu.institution}</p>
                        </div>
                        <span class="text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-medium">
                            ${startYear} - ${endYear}
                        </span>
                    </div>
                    ${edu.description ? `<p class="text-gray-600 dark:text-gray-400 leading-relaxed">${edu.description}</p>` : ''}
                    ${edu.field_of_study ? `<p class="text-gray-500 dark:text-gray-500 text-sm mt-2"><i class="fas fa-graduation-cap mr-2"></i>${edu.field_of_study}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');

    console.log('✅ Education rendered:', education.length);
}

// Render Certifications & Internships Section
async function renderCertificates() {
    const certifications = portfolioData.certificates;
    if (!certifications || certifications.length === 0) return;

    const certificatesGrid = document.getElementById('certificates-grid');
    if (!certificatesGrid) return;

    if (!window.getSignedUrl) {
        console.error('❌ getSignedUrl function not available');
        return;
    }

    // Sort certifications: pinned first, then by date
    const sortedCertifications = [...certifications].sort((a, b) => {
        if (a.pin_to_top && !b.pin_to_top) return -1;
        if (!a.pin_to_top && b.pin_to_top) return 1;
        return new Date(b.issue_date) - new Date(a.issue_date);
    });

    // Generate signed URLs for ALL certifications
    console.log('🔐 Generating signed URLs for', sortedCertifications.length, 'certifications...');
    
    const certificationsWithUrls = await Promise.all(sortedCertifications.map(async cert => {
        const certPath = cert.certificate_url || cert.certificate_file;
        const imagePath = cert.image_url;
        
        let signedCertUrl = null;
        let signedImageUrl = null;
        
        // Generate signed URL for PDF certificate
        if (certPath) {
            try {
                console.log('🔐 Generating signed URL for certificate PDF:', cert.name || cert.title);
                const result = await window.getSignedUrl(certPath, 3600);
                
                if (result.success) {
                    console.log('✅ Signed URL generated for certificate PDF:', cert.name || cert.title);
                    signedCertUrl = result.url;
                } else {
                    console.error('❌ Failed to generate signed URL for certificate PDF:', cert.name || cert.title, result.error);
                }
            } catch (err) {
                console.error('❌ Error generating signed URL for certificate PDF:', cert.name || cert.title, err);
            }
        }
        
        // Generate signed URL for certificate image/thumbnail
        if (imagePath) {
            try {
                console.log('🔐 Generating signed URL for certificate image:', cert.name || cert.title);
                const result = await window.getSignedUrl(imagePath, 3600);
                
                if (result.success) {
                    console.log('✅ Signed URL generated for certificate image:', cert.name || cert.title);
                    signedImageUrl = result.url;
                } else {
                    console.error('❌ Failed to generate signed URL for certificate image:', cert.name || cert.title, result.error);
                }
            } catch (err) {
                console.error('❌ Error generating signed URL for certificate image:', cert.name || cert.title, err);
            }
        }
        
        return { ...cert, signedUrl: signedCertUrl, signedImageUrl };
    }));

    certificatesGrid.innerHTML = certificationsWithUrls.map(cert => {
        const issueDate = new Date(cert.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const certUrl = cert.signedUrl;
        const imageUrl = cert.signedImageUrl;
        
        // Determine type-specific styling
        const isInternship = cert.type === 'internship';
        const typeIcon = isInternship ? 'fas fa-briefcase' : 'fas fa-certificate';
        const typeColor = isInternship ? 'text-blue-500' : 'text-yellow-500';
        const gradientClass = isInternship 
            ? 'from-blue-400 via-purple-500 to-indigo-500' 
            : 'from-yellow-400 via-orange-500 to-red-500';
        const typeLabel = isInternship ? 'Internship' : 'Certificate';

        // Detect file type from stored RAW path (has real extension, before signing)
        const rawPath = cert.certificate_url || cert.certificate_file || '';
        const isPdfFile = /\.pdf$/i.test(rawPath);
        const isImgFile = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(rawPath);
        // effectiveImageUrl: prefer image_url field, fallback to certUrl if it's an image
        const effectiveImageUrl = imageUrl || (isImgFile ? certUrl : null);
        // effectivePdfUrl: use certUrl when it's a PDF
        const effectivePdfUrl = isPdfFile ? certUrl : null;

        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-[1.02] hover:-translate-y-1 duration-300" data-aos="fade-up">

                <!-- Media Area -->
                <div class="cert-media-box relative w-full">
                    ${effectiveImageUrl ? `
                        <img src="${effectiveImageUrl}"
                             alt="${cert.name || cert.title}"
                             class="cert-media-img"
                             loading="lazy"
                             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                        <div style="display:none;" class="cert-media-fallback bg-gradient-to-br ${gradientClass}">
                            <i class="${typeIcon} text-white text-5xl opacity-80"></i>
                        </div>
                    ` : effectivePdfUrl ? `
                        <canvas class="cert-pdf-canvas" data-pdf-url="${effectivePdfUrl}"></canvas>
                        <div class="cert-pdf-loading">
                            <i class="fas fa-spinner fa-spin text-gray-400 text-2xl"></i>
                        </div>
                    ` : `
                        <div class="cert-media-fallback bg-gradient-to-br ${gradientClass}">
                            <i class="${typeIcon} text-white text-5xl mb-2 opacity-90"></i>
                            <p class="text-sm font-medium text-white opacity-80">${typeLabel}</p>
                        </div>
                    `}
                    <!-- Type Badge -->
                    <div class="absolute top-3 right-3 z-10">
                        <span class="${typeColor} bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                            <i class="${typeIcon}"></i> ${typeLabel}
                        </span>
                    </div>
                </div>
                
                <div class="p-4 sm:p-5">
                    <div class="flex items-start justify-between mb-2">
                        <h3 class="text-base sm:text-lg font-bold text-gray-800 dark:text-white flex-grow pr-2">${cert.name || cert.title}</h3>
                    </div>
                    
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center">
                        <i class="fas fa-building mr-2 ${typeColor} flex-shrink-0"></i>
                        <span class="truncate">${cert.issuing_organization}</span>
                    </p>
                    
                    ${cert.description && cert.description !== 'No description provided' ? `
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">${cert.description}</p>
                    ` : ''}
                    
                    <div class="flex items-center justify-between text-sm sm:text-base pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span class="text-gray-500 flex items-center">
                            <i class="far fa-calendar mr-2 ${typeColor}"></i>
                            <span>${issueDate}</span>
                        </span>
                        ${certUrl || cert.verification_url ? `
                            <div class="flex gap-2">
                                ${certUrl ? `
                                    <a href="${certUrl}" target="_blank" 
                                       class="bg-gradient-to-r ${isInternship ? 'from-blue-500 to-purple-500' : 'from-yellow-500 to-orange-500'} text-white px-3 py-1 rounded-lg font-semibold flex items-center gap-1 text-xs hover:shadow-lg transition-all duration-200">
                                        <i class="fas fa-file-alt"></i>
                                        <span>View</span>
                                    </a>
                                ` : ''}
                                ${cert.verification_url && cert.verification_url !== certUrl ? `
                                    <a href="${cert.verification_url}" target="_blank" 
                                       class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg font-semibold flex items-center gap-1 text-xs transition-all duration-200">
                                        <i class="fas fa-external-link-alt"></i>
                                        <span>Link</span>
                                    </a>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Update count display
    const countEl = document.getElementById('certificates-count');
    if (countEl) countEl.textContent = certificationsWithUrls.length;

    // Render PDF canvases using PDF.js (no browser toolbar/scrollbar)
    renderPdfCanvases();

    console.log('✅ Certifications & Internships rendered:', certificationsWithUrls.length);
}

// Render all PDF canvases via PDF.js — produces identical output in every browser
async function renderPdfCanvases() {
    const canvases = document.querySelectorAll('.cert-pdf-canvas');
    if (!canvases.length) return;

    // Wait for PDF.js library
    if (typeof pdfjsLib === 'undefined') {
        console.warn('⚠️ PDF.js not loaded, PDF previews will not render');
        return;
    }

    // Set worker
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    canvases.forEach(async (canvas) => {
        const url = canvas.getAttribute('data-pdf-url');
        if (!url) return;

        const container = canvas.parentElement;
        const loader = canvas.nextElementSibling; // .cert-pdf-loading spinner

        try {
            const pdf = await pdfjsLib.getDocument({ url, withCredentials: false }).promise;
            const page = await pdf.getPage(1);

            // Measure the container
            const boxW = container.offsetWidth;
            const boxH = container.offsetHeight;

            const vp = page.getViewport({ scale: 1 });

            // Scale to COVER the container (like object-fit:cover)
            const scale = Math.max(boxW / vp.width, boxH / vp.height);
            // Use a minimum DPR of 2 for crisp rendering
            const dpr = Math.max(window.devicePixelRatio || 1, 2);
            const renderScale = scale * dpr;

            const scaledVp = page.getViewport({ scale: renderScale });

            canvas.width = scaledVp.width;
            canvas.height = scaledVp.height;

            // Display size = container size (CSS pixels); canvas resolution = high DPI
            canvas.style.width = boxW + 'px';
            canvas.style.height = boxH + 'px';
            // Center the "cover" crop like object-position: center top
            canvas.style.objectFit = 'cover';
            canvas.style.objectPosition = 'center top';

            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport: scaledVp }).promise;

            // Hide loader
            if (loader && loader.classList.contains('cert-pdf-loading')) {
                loader.style.display = 'none';
            }

            console.log('✅ PDF canvas rendered:', url.substring(0, 60) + '…');
        } catch (err) {
            console.error('❌ PDF canvas render failed:', err);
            // On failure, show a gradient fallback instead of broken canvas
            canvas.style.display = 'none';
            if (loader && loader.classList.contains('cert-pdf-loading')) {
                loader.innerHTML = '<i class="fas fa-file-pdf text-gray-400 text-4xl"></i>';
            }
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Mobile menu
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Contact form
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Smooth scrolling for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                // Close mobile menu if open
                if (mobileMenu) mobileMenu.classList.add('hidden');
            }
        });
    });
}

// Handle Contact Form Submission
async function handleContactForm(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = document.getElementById('contact-btn-text');
    const originalText = btnText?.textContent;
    
    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Sending...';
    
    const formData = {
        name: document.getElementById('name')?.value,
        email: document.getElementById('email')?.value,
        subject: document.getElementById('subject')?.value,
        message: document.getElementById('message')?.value,
        created_at: new Date().toISOString(),
        read: false
    };

    try {
        // Get supabase client
        const supabaseClient = getSupabaseClient();
        
        if (!supabaseClient) {
            throw new Error('Supabase client not available');
        }
        
        // Save to database
        const { data, error } = await supabaseClient
            .from('contact_messages')
            .insert([formData])
            .select();

        if (error) throw error;

        // Show success message
        showToast('✅ Message sent successfully! I will get back to you soon.', 'success');
        contactForm.reset();
        
        console.log('✅ Contact message saved to database:', data);
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('❌ Error sending message. Please try again.', 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = originalText;
    }
}

// Theme Management
function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (themeToggle) {
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
}

// Debug function to check profile data
async function debugProfileData() {
    console.log('=== DEBUG PROFILE DATA ===');
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
        console.error('Supabase client not available');
        return null;
    }
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

// Toast Notification
function showToast(message, type = 'success') {
    if (!toast) return;
    
    const toastMessage = document.getElementById('toast-message');
    const toastContent = document.getElementById('toast-content');
    
    if (toastMessage) toastMessage.textContent = message;
    
    // Remove hidden class and show toast
    toast.classList.remove('hidden', 'translate-y-full');
    toast.classList.add('translate-y-0');
    
    // Change color based on type
    if (toastContent) {
        toastContent.className = type === 'error' 
            ? 'bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg'
            : 'bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg';
    }
    
    setTimeout(() => {
        toast.classList.remove('translate-y-0');
        toast.classList.add('translate-y-full');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

// Auto-refresh signed URLs every 50 minutes (before 1-hour expiry)
function setupAutoRefresh() {
    setInterval(() => {
        console.log('🔄 Refreshing signed URLs...');
        renderAllSections();
    }, 50 * 60 * 1000); // 50 minutes
}

// Export functions for debugging
window.portfolioDebug = {
    loadAllData,
    renderAllSections,
    portfolioData
};

console.log('✅ Portfolio.js loaded - Powered by Supabase');

// Setup auto-refresh after page load
setTimeout(setupAutoRefresh, 5000);