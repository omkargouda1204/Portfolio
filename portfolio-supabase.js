// Portfolio Website - Powered by Supabase
// This file handles all frontend functionality for the portfolio

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

        // Load Profile
        const { data: profileData, error: profileError } = await supabase
            .from('profile')
            .select('*')
            .limit(1)
            .single();
        
        if (!profileError && profileData) {
            portfolioData.profile = profileData;
            console.log('✅ Profile loaded:', profileData);
        }

        // Load About
        const { data: aboutData, error: aboutError } = await supabase
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
        const { data: projectsData, error: projectsError } = await supabase
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
        const { data: skillsData, error: skillsError } = await supabase
            .from('skills')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (!skillsError && skillsData) {
            portfolioData.skills = skillsData;
            console.log('✅ Skills loaded:', skillsData.length);
        }

        // Load Experience
        const { data: experienceData, error: experienceError } = await supabase
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
        const { data: educationData, error: educationError } = await supabase
            .from('education')
            .select('*')
            .order('start_year', { ascending: false });
        
        if (!educationError && educationData) {
            portfolioData.education = educationData;
            console.log('✅ Education loaded:', educationData.length);
        }

        // Load Certificates
        const { data: certificatesData, error: certificatesError } = await supabase
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
                ${project.featured ? '<span class="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs mb-3">⭐ Featured</span>' : ''}
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

// Render Certificates Section
async function renderCertificates() {
    const certificates = portfolioData.certificates;
    if (!certificates || certificates.length === 0) return;

    const certificatesGrid = document.getElementById('certificates-grid');
    if (!certificatesGrid) return;

    if (!window.getSignedUrl) {
        console.error('❌ getSignedUrl function not available');
        return;
    }

    // Generate signed URLs for ALL certificates (required for private bucket)
    console.log('🔐 Generating signed URLs for', certificates.length, 'certificates...');
    
    const certificatesWithUrls = await Promise.all(certificates.map(async cert => {
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

    certificatesGrid.innerHTML = certificatesWithUrls.map(cert => {
        const issueDate = new Date(cert.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const certUrl = cert.signedUrl;
        const imageUrl = cert.signedImageUrl;
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:scale-105 hover:-translate-y-2 duration-300" data-aos="fade-up">
                ${imageUrl ? `
                    <!-- Certificate has image thumbnail (like projects) -->
                    <div class="relative group h-64 overflow-hidden">
                        <img src="${imageUrl}" 
                             alt="${cert.name || cert.title}" 
                             class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                             onerror="this.parentElement.innerHTML='<div class=\\'h-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center\\'><i class=\\'fas fa-certificate text-white text-6xl\\'></i></div>';">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center">
                            ${certUrl ? `
                                <a href="${certUrl}" target="_blank" class="opacity-0 group-hover:opacity-100 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-lg hover:shadow-xl">
                                    <i class="fas fa-file-pdf mr-2"></i>View Certificate
                                </a>
                            ` : ''}
                        </div>
                        <div class="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                            <i class="fas fa-certificate mr-1"></i>Certified
                        </div>
                    </div>
                ` : certUrl ? `
                    <!-- No image, show gradient with icon -->
                    <div class="relative group h-64 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500">
                        <div class="absolute inset-0 flex items-center justify-center">
                            <i class="fas fa-certificate text-white text-6xl opacity-30"></i>
                        </div>
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                            <a href="${certUrl}" target="_blank" class="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-lg">
                                <i class="fas fa-eye mr-2"></i>View Certificate
                            </a>
                        </div>
                    </div>
                ` : `
                    <!-- No image and no PDF -->
                    <div class="h-64 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center">
                        <i class="fas fa-certificate text-white text-6xl"></i>
                    </div>
                `}
                
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-2 text-gray-800 dark:text-white">${cert.name || cert.title}</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-3 flex items-center">
                        <i class="fas fa-building mr-2 text-yellow-500"></i>${cert.issuing_organization}
                    </p>
                    <div class="flex items-center justify-between text-sm pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span class="text-gray-500 flex items-center">
                            <i class="far fa-calendar mr-2 text-yellow-500"></i>${issueDate}
                        </span>
                        ${certUrl ? `
                            <a href="${certUrl}" target="_blank" class="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 font-semibold flex items-center transition-colors duration-200">
                                <i class="fas fa-external-link-alt mr-1"></i>Open PDF
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Update count
    const countEl = document.getElementById('certificates-count');
    if (countEl) countEl.textContent = certificates.length;

    console.log('✅ Certificates rendered:', certificates.length);
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
        // Save to database
        const { data, error } = await supabase
            .from('contact_messages')
            .insert([formData])
            .select();

        if (error) throw error;

        // Send email notification using EmailJS
        try {
            // Initialize EmailJS (only needed once)
            if (typeof emailjs !== 'undefined' && !window.emailJsInitialized) {
                // Replace 'YOUR_PUBLIC_KEY' with your actual EmailJS public key
                emailjs.init('YOUR_PUBLIC_KEY');
                window.emailJsInitialized = true;
            }
            
            // Send email via EmailJS
            if (typeof emailjs !== 'undefined') {
                const emailParams = {
                    from_name: formData.name,
                    from_email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                    to_email: 'omkargouda1204@gmail.com'
                };
                
                // Replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' with actual values
                await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', emailParams);
                console.log('✅ Email sent via EmailJS');
            } else {
                console.warn('⚠️ EmailJS not loaded, message saved to database only');
            }
        } catch (emailError) {
            console.error('❌ Error sending email via EmailJS:', emailError);
            // Don't fail the whole operation if email fails
        }
        
        showToast('✅ Message sent successfully! I\'ll get back to you soon.', 'success');
        contactForm.reset();
        
        console.log('✅ Contact message saved:', data);
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
    const { data, error } = await supabase.from('profile').select('*').limit(1).single();
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
