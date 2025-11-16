// COMPLETE ADMIN PANEL - SUPABASE POWERED WITH FULL CRUD
// Full featured admin panel with Add, Edit, Delete, Settings, and Messaging

// Get Supabase client from window (set by supabase-config.js)
const supabase = window.supabase;

let portfolioData = {
    about: {},
    profile: {},
    projects: [],
    skills: [],
    certificates: [],
    messages: [],
    education: []
};

let adminPassword = localStorage.getItem('adminPassword') || 'Admin@123';

// LOGIN
function login(e) {
    if (e) e.preventDefault();
    const pwdInput = document.getElementById('admin-password');
    const errorEl = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const pw = pwdInput ? pwdInput.value : '';
    const saved = localStorage.getItem('adminPassword') || 'Admin@123';
    if (pw === saved) {
        if (errorEl) errorEl.classList.add('hidden');
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        showToast('Welcome to Admin Panel', 'success');
        // Initialize UI
        setupThemeToggle();
        setupEventListeners();
        loadAllData();
    } else {
        if (errorEl) {
            errorText.textContent = 'Wrong password!';
            errorEl.classList.remove('hidden');
        }
        showToast('Wrong password!', 'error');
    }
}

function logout() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('admin-password').value = '';
    showToast('Logged out successfully', 'success');
}

// THEME TOGGLE
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) document.documentElement.classList.add('dark');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            showToast(`${isDark ? 'Dark' : 'Light'} mode activated`, 'success');
        });
    }
}

function setupEventListeners() {
    document.querySelectorAll('.admin-sidebar-link').forEach(link => {
        link.addEventListener('click', function() {
            const sec = this.getAttribute('data-section');
            showSection(sec);
            document.querySelectorAll('.admin-sidebar-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            const titles = {
                dashboard: 'Dashboard',
                about: 'About Me',
                profile: 'Profile & Contact',
                education: 'Education',
                skills: 'Skills',
                projects: 'Projects',
                certificates: 'Certificates',
                messages: 'Messages',
                settings: 'Settings'
            };
            document.getElementById('page-title').textContent = titles[sec] || 'Dashboard';
        });
    });
    
    const lb = document.getElementById('logout-btn');
    if (lb) lb.addEventListener('click', logout);
    
    // Modal close buttons
    const closeModal = document.getElementById('close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('modal').classList.add('hidden');
        });
    }
    
    // Click outside modal to close
    document.getElementById('modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal') {
            document.getElementById('modal').classList.add('hidden');
        }
    });
}

function showSection(n) {
    const sections = {
        dashboard: renderDashboard,
        profile: renderProfile,
        about: renderAbout,
        projects: renderProjects,
        skills: renderSkills,
        education: renderEducation,
        certificates: renderCertificates,
        messages: renderMessages,
        settings: renderSettings
    };
    (sections[n] || renderDashboard)();
}

// LOAD DATA
async function loadAllData() {
    try {
        console.log('Loading all data...');
        
        // Load Profile
        const { data: profile } = await supabase.from('profile').select('*').single();
        if (profile) portfolioData.profile = profile;
        
        // Load About
        const { data: about } = await supabase.from('about').select('*').single();
        if (about) portfolioData.about = about;
        
        // Load Projects
        const { data: projects } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (projects) portfolioData.projects = projects;
        
        // Load Skills
        const { data: skills } = await supabase.from('skills').select('*').order('display_order');
        if (skills) portfolioData.skills = skills;
        
        // Load Education
        const { data: education } = await supabase.from('education').select('*').order('start_year', { ascending: false });
        if (education) portfolioData.education = education;
        
        // Load Certificates
        const { data: certificates } = await supabase.from('certificates').select('*').order('issue_date', { ascending: false });
        if (certificates) {
            portfolioData.certificates = certificates;
            console.log('✅ Admin loaded certificates:', certificates.length, certificates.map(c => ({ id: c.id, name: c.name })));
        }
        
        // Load Messages
        const { data: messages } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
        if (messages) portfolioData.messages = messages;
        
        console.log('✅ All data loaded:', portfolioData);
        showToast('Data loaded successfully!', 'success');
        renderDashboard();
        
        // Update unread messages count
        updateUnreadCount();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data: ' + error.message, 'error');
    }
}

function updateUnreadCount() {
    const unreadCount = portfolioData.messages.filter(m => !m.read).length;
    const badge = document.getElementById('unread-count');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

// ==================== RENDER FUNCTIONS ====================

function renderDashboard() {
    const content = document.getElementById('content-area');
    const unreadMessages = portfolioData.messages.filter(m => !m.read).length;
    
    content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-500 text-white">
                        <i class="fas fa-project-diagram text-2xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 dark:text-gray-400 text-sm">Projects</p>
                        <p class="text-3xl font-bold">${portfolioData.projects.length}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-500 text-white">
                        <i class="fas fa-code text-2xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 dark:text-gray-400 text-sm">Skills</p>
                        <p class="text-3xl font-bold">${portfolioData.skills.length}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-purple-500 text-white">
                        <i class="fas fa-graduation-cap text-2xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 dark:text-gray-400 text-sm">Education</p>
                        <p class="text-3xl font-bold">${portfolioData.education.length}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-yellow-500 text-white">
                        <i class="fas fa-certificate text-2xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 dark:text-gray-400 text-sm">Certificates</p>
                        <p class="text-3xl font-bold">${portfolioData.certificates.length}</p>
                    </div>
                </div>
            </div>
        </div>
        
        ${unreadMessages > 0 ? `
        <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-lg mb-8">
            <div class="flex items-center">
                <i class="fas fa-envelope text-red-500 text-2xl mr-4"></i>
                <div>
                    <h3 class="text-lg font-bold text-red-700 dark:text-red-300">New Messages!</h3>
                    <p class="text-red-600 dark:text-red-400">You have ${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}</p>
                </div>
                <button onclick="showSection('messages')" class="ml-auto bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg">
                    View Messages
                </button>
            </div>
        </div>
        ` : ''}
        
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-bold mb-6">Quick Actions</h3>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <button onclick="showSection('profile')" class="p-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg">
                    <i class="fas fa-user text-2xl mb-2"></i>
                    <p class="font-semibold">Edit Profile</p>
                </button>
                <button onclick="showSection('projects')" class="p-4 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg">
                    <i class="fas fa-project-diagram text-2xl mb-2"></i>
                    <p class="font-semibold">Projects</p>
                </button>
                <button onclick="showSection('skills')" class="p-4 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg">
                    <i class="fas fa-code text-2xl mb-2"></i>
                    <p class="font-semibold">Skills</p>
                </button>
                <button onclick="showSection('certificates')" class="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg">
                    <i class="fas fa-certificate text-2xl mb-2"></i>
                    <p class="font-semibold">Certificates</p>
                </button>
                <button onclick="showSection('messages')" class="p-4 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg relative">
                    <i class="fas fa-envelope text-2xl mb-2"></i>
                    <p class="font-semibold">Messages</p>
                    ${unreadMessages > 0 ? `<span class="absolute top-2 right-2 bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full">${unreadMessages}</span>` : ''}
                </button>
            </div>
        </div>
    `;
}

function renderProfile() {
    const p = portfolioData.profile;
    document.getElementById('content-area').innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold"><i class="fas fa-user text-blue-500 mr-2"></i>Profile & Contact Information</h3>
                <button onclick="editProfile()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-lg transition-all">
                    <i class="fas fa-edit mr-2"></i>Edit Profile
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                    <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                        <p class="text-lg font-semibold">${p.name || 'Not set'}</p>
                    </div>
                    
                    <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Professional Title</label>
                        <p class="text-lg font-semibold">${p.title || 'Not set'}</p>
                    </div>
                    
                    <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            <i class="fas fa-envelope text-blue-500 mr-2"></i>Email
                        </label>
                        <p class="text-lg">${p.email || 'Not set'}</p>
                    </div>
                    
                    <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            <i class="fas fa-phone text-green-500 mr-2"></i>Phone
                        </label>
                        <p class="text-lg">${p.phone || 'Not set'}</p>
                    </div>
                    
                    <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            <i class="fas fa-map-marker-alt text-red-500 mr-2"></i>Location
                        </label>
                        <p class="text-lg">${p.location || 'Not set'}</p>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            <i class="fas fa-share-alt text-purple-500 mr-2"></i>Social Media Links
                        </label>
                        <div class="space-y-2">
                            ${p.github_url ? `<p><i class="fab fa-github mr-2"></i><a href="${p.github_url}" target="_blank" class="text-blue-600 hover:underline">${p.github_url}</a></p>` : '<p class="text-gray-400">GitHub: Not set</p>'}
                            ${p.linkedin_url ? `<p><i class="fab fa-linkedin mr-2"></i><a href="${p.linkedin_url}" target="_blank" class="text-blue-600 hover:underline">${p.linkedin_url}</a></p>` : '<p class="text-gray-400">LinkedIn: Not set</p>'}
                            ${p.twitter_url ? `<p><i class="fab fa-twitter mr-2"></i><a href="${p.twitter_url}" target="_blank" class="text-blue-600 hover:underline">${p.twitter_url}</a></p>` : '<p class="text-gray-400">Twitter: Not set</p>'}
                            ${p.website_url ? `<p><i class="fas fa-globe mr-2"></i><a href="${p.website_url}" target="_blank" class="text-blue-600 hover:underline">${p.website_url}</a></p>` : '<p class="text-gray-400">Website: Not set</p>'}
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bio / Description</label>
                        <p class="text-base leading-relaxed">${p.bio || 'No bio added yet'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderAbout() {
    const a = portfolioData.about;
    document.getElementById('content-area').innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold"><i class="fas fa-info-circle text-purple-500 mr-2"></i>About Me Section</h3>
                <button onclick="editAbout()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg shadow-lg transition-all">
                    <i class="fas fa-edit mr-2"></i>Edit About
                </button>
            </div>
            
            <div class="space-y-6">
                <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Description</label>
                    <p class="text-lg leading-relaxed">${a.description || 'No description added yet'}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                        <div class="text-center">
                            <i class="fas fa-briefcase text-4xl text-blue-600 mb-3"></i>
                            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Years of Experience</label>
                            <p class="text-5xl font-bold text-blue-600">${a.experience_years || '0'}</p>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-700">
                        <div class="text-center">
                            <i class="fas fa-project-diagram text-4xl text-green-600 mb-3"></i>
                            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Projects Completed</label>
                            <p class="text-5xl font-bold text-green-600">${a.projects_completed || '0'}</p>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                        <div class="text-center">
                            <i class="fas fa-users text-4xl text-purple-600 mb-3"></i>
                            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Happy Clients</label>
                            <p class="text-5xl font-bold text-purple-600">${a.happy_clients || '0'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderProjects() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
        <div class="mb-6">
            <button onclick="addProject()" class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all">
                <i class="fas fa-plus mr-2"></i>Add New Project
            </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${portfolioData.projects.length === 0 ? `
                <div class="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                    <i class="fas fa-project-diagram text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <p class="text-xl text-gray-500 dark:text-gray-400">No projects yet. Add your first project!</p>
                </div>
            ` : portfolioData.projects.map(p => `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105">
                    ${p.image_url ? 
                        `<img src="${p.image_url}" class="w-full h-48 object-cover" alt="${p.title}">` : 
                        `<div class="w-full h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                            <i class="fas fa-project-diagram text-white text-5xl"></i>
                        </div>`
                    }
                    
                    <div class="p-6">
                        <h3 class="text-xl font-bold mb-2 line-clamp-1">${p.title}</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">${p.description || 'No description'}</p>
                        
                        ${Array.isArray(p.technologies) && p.technologies.length > 0 ? `
                            <div class="flex flex-wrap gap-2 mb-4">
                                ${p.technologies.slice(0, 3).map(tech => `
                                    <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                                        ${tech}
                                    </span>
                                `).join('')}
                                ${p.technologies.length > 3 ? `<span class="text-gray-500 text-sm">+${p.technologies.length - 3} more</span>` : ''}
                            </div>
                        ` : ''}
                        
                        <div class="flex gap-2 mt-4">
                            <button onclick="editProject('${p.id}')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all">
                                <i class="fas fa-edit mr-2"></i>Edit
                            </button>
                            <button onclick="deleteProject('${p.id}')" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all">
                                <i class="fas fa-trash mr-2"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderSkills() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
        <div class="mb-6">
            <button onclick="addSkill()" class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all">
                <i class="fas fa-plus mr-2"></i>Add New Skill
            </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${portfolioData.skills.length === 0 ? `
                <div class="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                    <i class="fas fa-code text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <p class="text-xl text-gray-500 dark:text-gray-400">No skills yet. Add your first skill!</p>
                </div>
            ` : portfolioData.skills.map(s => `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-2xl transition-all">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <h3 class="text-xl font-bold mb-1">${s.name}</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${s.category || 'General'}</p>
                        </div>
                        <button onclick="deleteSkill('${s.id}')" class="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    
                    <div class="mt-4">
                        <div class="flex justify-between text-sm mb-2">
                            <span class="font-medium">Proficiency Level</span>
                            <span class="font-bold text-blue-600">${s.proficiency_level}%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500" style="width: ${s.proficiency_level}%"></div>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex gap-2">
                        <button onclick="editSkill('${s.id}')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all">
                            <i class="fas fa-edit mr-2"></i>Edit
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderEducation() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
        <div class="mb-6">
            <button onclick="addEducation()" class="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all">
                <i class="fas fa-plus mr-2"></i>Add Education
            </button>
        </div>
        
        <div class="space-y-4">
            ${portfolioData.education.length === 0 ? `
                <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                    <i class="fas fa-graduation-cap text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <p class="text-xl text-gray-500 dark:text-gray-400">No education records yet. Add your first entry!</p>
                </div>
            ` : portfolioData.education.map(e => `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-2xl transition-all">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-start gap-4">
                                <div class="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                                    <i class="fas fa-graduation-cap text-3xl"></i>
                                </div>
                                <div class="flex-1">
                                    <h3 class="text-2xl font-bold mb-1">${e.degree}</h3>
                                    <p class="text-lg text-blue-600 dark:text-blue-400 mb-2">${e.institution}</p>
                                    <p class="text-gray-600 dark:text-gray-400 mb-3">
                                        <i class="fas fa-calendar mr-2"></i>
                                        ${e.start_date} - ${e.end_date || 'Present'}
                                    </p>
                                    ${e.description ? `<p class="text-gray-700 dark:text-gray-300 mt-3 leading-relaxed">${e.description}</p>` : ''}
                                    ${e.grade ? `
                                        <div class="mt-3 inline-block bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-lg">
                                            <i class="fas fa-award text-green-600 mr-2"></i>
                                            <span class="text-green-700 dark:text-green-400 font-semibold">${e.grade}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-col gap-2 ml-4">
                            <button onclick="editEducation('${e.id}')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all">
                                <i class="fas fa-edit mr-2"></i>Edit
                            </button>
                            <button onclick="deleteEducation('${e.id}')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all">
                                <i class="fas fa-trash mr-2"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderCertificates() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
        <div class="mb-6">
            <button onclick="addCertificate()" class="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all">
                <i class="fas fa-plus mr-2"></i>Add Certificate
            </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${portfolioData.certificates.length === 0 ? `
                <div class="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                    <i class="fas fa-certificate text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <p class="text-xl text-gray-500 dark:text-gray-400">No certificates yet. Add your first certificate!</p>
                </div>
            ` : portfolioData.certificates.map(c => `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105">
                    ${c.certificate_url ? `
                        <div class="relative group">
                            <img src="${c.certificate_url}" class="w-full h-48 object-cover" alt="${c.name}">
                            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                                <a href="${c.certificate_url}" target="_blank" class="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-4 py-2 rounded-lg transition-all">
                                    <i class="fas fa-external-link-alt mr-2"></i>View
                                </a>
                            </div>
                        </div>
                    ` : `
                        <div class="w-full h-48 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center">
                            <i class="fas fa-certificate text-white text-6xl"></i>
                        </div>
                    `}
                    
                    <div class="p-6">
                        <h3 class="text-xl font-bold mb-2 line-clamp-2">${c.name}</h3>
                        <p class="text-blue-600 dark:text-blue-400 mb-2 font-semibold">${c.issuing_organization}</p>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            <i class="fas fa-calendar mr-2"></i>${c.issue_date}
                        </p>
                        
                        <div class="flex gap-2">
                            <button onclick="editCertificate(${c.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all">
                                <i class="fas fa-edit mr-2"></i>Edit
                            </button>
                            <button onclick="deleteCertificate(${c.id})" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all">
                                <i class="fas fa-trash mr-2"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderMessages() {
    const content = document.getElementById('content-area');
    const unreadMessages = portfolioData.messages.filter(m => !m.read).length;
    
    content.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold">
                    <i class="fas fa-envelope text-red-500 mr-2"></i>
                    Messages
                    ${unreadMessages > 0 ? `<span class="ml-3 bg-red-500 text-white text-sm px-3 py-1 rounded-full">${unreadMessages} New</span>` : ''}
                </h3>
            </div>
            
            ${portfolioData.messages.length === 0 ? `
                <div class="text-center py-12">
                    <i class="fas fa-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <p class="text-xl text-gray-500 dark:text-gray-400">No messages yet</p>
                </div>
            ` : `
                <div class="space-y-4">
                    ${portfolioData.messages.map(m => `
                        <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border-l-4 ${m.read ? 'border-gray-400 opacity-75' : 'border-blue-500'} hover:shadow-lg transition-all">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-3">
                                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                            ${m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 class="text-xl font-bold">${m.name}</h3>
                                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                                <i class="fas fa-clock mr-1"></i>${new Date(m.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        ${!m.read ? '<span class="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold">NEW</span>' : ''}
                                    </div>
                                    
                                    <div class="mb-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
                                        <p class="text-blue-600 dark:text-blue-400 mb-2">
                                            <i class="fas fa-envelope mr-2"></i>${m.email}
                                        </p>
                                        ${m.phone ? `<p class="text-green-600 dark:text-green-400 mb-2"><i class="fas fa-phone mr-2"></i>${m.phone}</p>` : ''}
                                        ${m.subject ? `<p class="mb-2"><strong>Subject:</strong> ${m.subject}</p>` : ''}
                                    </div>
                                    
                                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4">
                                        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${m.message}</p>
                                    </div>
                                </div>
                                
                                <div class="flex flex-col gap-2 ml-4">
                                    ${!m.read ? `
                                        <button onclick="markAsRead('${m.id}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all whitespace-nowrap">
                                            <i class="fas fa-check mr-2"></i>Mark Read
                                        </button>
                                    ` : ''}
                                    
                                    <button onclick="replyToMessage('${m.id}', '${m.email}', '${m.name.replace(/'/g, "\\'")}', '${m.phone || ''}')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all whitespace-nowrap">
                                        <i class="fas fa-reply mr-2"></i>Reply
                                    </button>
                                    
                                    ${m.phone ? `
                                    <a href="https://wa.me/${m.phone.replace(/\D/g, '')}" target="_blank" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all whitespace-nowrap text-center">
                                        <i class="fab fa-whatsapp mr-2"></i>WhatsApp
                                    </a>
                                    ` : ''}
                                    
                                    <button onclick="deleteMessage('${m.id}')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all whitespace-nowrap">
                                        <i class="fas fa-trash mr-2"></i>Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

function renderSettings() {
    document.getElementById('content-area').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Password Settings -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 class="text-2xl font-bold mb-6">
                    <i class="fas fa-lock text-red-500 mr-2"></i>Security Settings
                </h3>
                
                <form onsubmit="changePassword(event)" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Current Password</label>
                        <input type="password" id="current-password" required
                            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter current password">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">New Password</label>
                        <input type="password" id="new-password" required minlength="6"
                            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter new password (min 6 characters)">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Confirm New Password</label>
                        <input type="password" id="confirm-password" required minlength="6"
                            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                            placeholder="Confirm new password">
                    </div>
                    
                    <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all">
                        <i class="fas fa-save mr-2"></i>Change Password
                    </button>
                </form>
                
                <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p class="text-sm text-blue-700 dark:text-blue-300">
                        <i class="fas fa-info-circle mr-2"></i>
                        Current Password: <span class="font-mono font-bold">${adminPassword}</span>
                    </p>
                </div>
            </div>
            
            <!-- Database Settings -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 class="text-2xl font-bold mb-6">
                    <i class="fas fa-database text-green-500 mr-2"></i>Database Connection
                </h3>
                
                <div class="space-y-4">
                    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-700">
                        <div class="flex items-center mb-4">
                            <i class="fas fa-check-circle text-green-600 text-3xl mr-3"></i>
                            <div>
                                <p class="text-lg font-bold text-green-700 dark:text-green-300">Connected to Supabase</p>
                                <p class="text-sm text-green-600 dark:text-green-400">Database is active and responding</p>
                            </div>
                        </div>
                        
                        <div class="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <strong>Project URL:</strong><br>
                                <code class="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded">${window.SUPABASE_URL || 'Not configured'}</code>
                            </p>
                        </div>
                    </div>
                    
                    <button onclick="testDatabaseConnection()" class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all">
                        <i class="fas fa-sync mr-2"></i>Test Connection
                    </button>
                </div>
            </div>
            
            <!-- Theme Settings -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 class="text-2xl font-bold mb-6">
                    <i class="fas fa-palette text-purple-500 mr-2"></i>Appearance
                </h3>
                
                <div class="space-y-4">
                    <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <label class="block text-sm font-medium mb-3">Theme Mode</label>
                        <div class="flex gap-4">
                            <button onclick="setTheme('light')" class="flex-1 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-all">
                                <i class="fas fa-sun text-yellow-500 text-2xl mb-2"></i>
                                <p class="font-semibold">Light</p>
                            </button>
                            <button onclick="setTheme('dark')" class="flex-1 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-all">
                                <i class="fas fa-moon text-blue-400 text-2xl mb-2"></i>
                                <p class="font-semibold">Dark</p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- System Info -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 class="text-2xl font-bold mb-6">
                    <i class="fas fa-info-circle text-blue-500 mr-2"></i>System Information
                </h3>
                
                <div class="space-y-3">
                    <div class="flex justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span class="text-gray-600 dark:text-gray-400">Version</span>
                        <span class="font-bold">1.0.0</span>
                    </div>
                    <div class="flex justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span class="text-gray-600 dark:text-gray-400">Last Login</span>
                        <span class="font-bold">${new Date().toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span class="text-gray-600 dark:text-gray-400">Total Records</span>
                        <span class="font-bold">${portfolioData.projects.length + portfolioData.skills.length + portfolioData.education.length + portfolioData.certificates.length}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Theme Functions
function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        showToast('Dark mode activated', 'success');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        showToast('Light mode activated', 'success');
    }
}

async function testDatabaseConnection() {
    showToast('Testing connection...', 'info');
    try {
        const { data, error } = await supabase.from('profile').select('count').limit(1);
        if (error) throw error;
        showToast('✅ Database connection successful!', 'success');
    } catch (error) {
        showToast('❌ Connection failed: ' + error.message, 'error');
    }
}

// ==================== EDIT PROFILE ====================
function editProfile() {
    const p = portfolioData.profile;
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = 'Edit Profile & Contact';
    document.getElementById('modal-content').innerHTML = `
        <form onsubmit="saveProfile(event)" class="space-y-4">
            <!-- Profile Image Upload -->
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                <label class="block text-sm font-medium mb-2">
                    <i class="fas fa-user-circle mr-2"></i>Profile Image
                </label>
                ${ (p.profile_image_url || p.profile_image) ? `
                    <div class="mb-3 text-center">
                        <img id="profile-image-preview" src="${p.profile_image_url || p.profile_image}" class="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white dark:border-gray-700 shadow-lg">
                    </div>
                ` : `<div class="mb-3 text-center"><img id="profile-image-preview" class="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white dark:border-gray-700 shadow-lg hidden"></div>` }
                <input type="file" id="profile-image-file" accept="image/*" onchange="previewProfileImage(event)"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                <p class="text-xs text-gray-500 mt-1">Recommended: Square image, min 400x400px</p>
            </div>
            
            <!-- Resume Upload -->
            <div class="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-4 rounded-lg">
                <label class="block text-sm font-medium mb-2">
                    <i class="fas fa-file-pdf mr-2"></i>Resume/CV (PDF)
                </label>
                ${p.resume_url ? `
                    <div class="mb-2">
                        <a href="${p.resume_url}" target="_blank" class="text-blue-600 hover:underline">
                            <i class="fas fa-download mr-1"></i>Current Resume
                        </a>
                    </div>
                ` : ''}
                <input type="file" id="profile-resume-file" accept=".pdf"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                <p class="text-xs text-gray-500 mt-1">PDF format only</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Full Name *</label>
                    <input type="text" id="profile-name" value="${p.name || ''}" required
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Professional Title *</label>
                    <input type="text" id="profile-title" value="${p.title || ''}" required
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Email *</label>
                    <input type="email" id="profile-email" value="${p.email || ''}" required
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Phone</label>
                    <input type="tel" id="profile-phone" value="${p.phone || ''}"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Location</label>
                    <input type="text" id="profile-location" value="${p.location || ''}"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Bio</label>
                <textarea id="profile-bio" rows="3"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">${p.bio || ''}</textarea>
            </div>
            
            <!-- Hero Auto-Typing Texts -->
            <div class="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg">
                <label class="block text-sm font-medium mb-2">
                    <i class="fas fa-keyboard mr-2"></i>Hero Section Auto-Typing Texts
                </label>
                <textarea id="profile-hero-texts" rows="3" placeholder="Full Stack Developer&#10;UI/UX Designer&#10;Software Engineer"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">${p.hero_typing_texts ? p.hero_typing_texts.join('\n') : 'Full Stack Developer\nUI/UX Designer\nSoftware Engineer'}</textarea>
                <p class="text-xs text-gray-500 mt-1">Enter one title per line. These will auto-rotate in the hero section.</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2"><i class="fab fa-github mr-2"></i>GitHub URL (Optional)</label>
                    <input type="url" id="profile-github" value="${p.github_url || ''}" placeholder="https://github.com/username"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2"><i class="fab fa-linkedin mr-2"></i>LinkedIn URL (Optional)</label>
                    <input type="url" id="profile-linkedin" value="${p.linkedin_url || ''}" placeholder="https://linkedin.com/in/username"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2"><i class="fab fa-twitter mr-2"></i>Twitter URL (Optional)</label>
                    <input type="url" id="profile-twitter" value="${p.twitter_url || ''}" placeholder="https://twitter.com/username"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2"><i class="fas fa-briefcase mr-2"></i>Naukri URL (Optional)</label>
                    <input type="url" id="profile-naukri" value="${p.naukri_url || ''}" placeholder="https://naukri.com/profile/username"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2"><i class="fas fa-globe mr-2"></i>Website URL (Optional)</label>
                    <input type="url" id="profile-website" value="${p.website_url || ''}" placeholder="https://yourwebsite.com"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            
            <div class="flex gap-4 pt-4">
                <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" 
                    class="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all">
                    Cancel
                </button>
                <button type="submit" id="save-profile-btn" class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
                    <i class="fas fa-save mr-2"></i>Save Changes
                </button>
            </div>
        </form>
    `;
    modal.classList.remove('hidden');
}

async function saveProfile(e) {
    e.preventDefault();
    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading...';
    
    try {
        const heroTextsValue = document.getElementById('profile-hero-texts').value;
        const heroTypingTexts = heroTextsValue.split('\n').filter(line => line.trim() !== '');
        
        const data = {
            name: document.getElementById('profile-name').value,
            title: document.getElementById('profile-title').value,
            email: document.getElementById('profile-email').value,
            phone: document.getElementById('profile-phone').value,
            location: document.getElementById('profile-location').value,
            bio: document.getElementById('profile-bio').value,
            hero_typing_texts: heroTypingTexts,
            github_url: document.getElementById('profile-github').value,
            linkedin_url: document.getElementById('profile-linkedin').value,
            twitter_url: document.getElementById('profile-twitter').value,
            naukri_url: document.getElementById('profile-naukri').value,
            website_url: document.getElementById('profile-website').value
        };
        
        // Upload profile image if selected
        const imageFile = document.getElementById('profile-image-file').files[0];
        if (imageFile) {
            showToast('Uploading profile image...', 'info');
            const result = await uploadFile(imageFile, 'profiles');
            if (result.success) {
                // store the public url
                data.profile_image_url = result.url;
                // delete old image after successful upload (if it was stored in our storage)
                try {
                    const oldUrl = portfolioData.profile.profile_image_url || portfolioData.profile.profile_image;
                    if (oldUrl && oldUrl.includes(window.STORAGE_URL)) {
                        const oldPath = oldUrl.replace(window.STORAGE_URL + '/', '');
                        await deleteFile(oldPath);
                    }
                } catch (delErr) {
                    console.warn('Could not delete old profile image:', delErr);
                }
            } else {
                throw new Error('Image upload failed: ' + result.error);
            }
        }
        
        // Upload resume if selected
        const resumeFile = document.getElementById('profile-resume-file').files[0];
        if (resumeFile) {
            showToast('Uploading resume...', 'info');
            const result = await uploadFile(resumeFile, 'resumes');
            if (result.success) {
                data.resume_url = result.url;
            } else {
                throw new Error('Resume upload failed: ' + result.error);
            }
        }
        
        const { error } = await supabase.from('profile').update(data).eq('id', portfolioData.profile.id);
        if (error) throw error;
        
        // Update local data
        portfolioData.profile = { ...portfolioData.profile, ...data };
        
        console.log('Profile updated in database. New profile data:', portfolioData.profile);
        
        // Close modal and refresh
        document.getElementById('modal').classList.add('hidden');
        
        // Show success message with image info
        if (data.profile_image_url) {
            showToast('Profile and image updated successfully! Refresh portfolio page to see changes.', 'success');
            console.log('✅ Profile image URL saved:', data.profile_image_url);
        } else {
            showToast('Profile updated successfully!', 'success');
        }
        
        // Refresh the profile display
        renderProfile();
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Changes';
    }
}

// Preview selected profile image in admin modal
function previewProfileImage(event) {
    try {
        const file = event.target.files[0];
        const img = document.getElementById('profile-image-preview');
        if (!img) return;
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
                img.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            img.src = '';
            img.classList.add('hidden');
        }
    } catch (err) {
        console.error('Preview image error:', err);
    }
}

// ==================== EDIT ABOUT ====================
function editAbout() {
    const a = portfolioData.about;
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = 'Edit About Section';
    document.getElementById('modal-content').innerHTML = `
        <form onsubmit="saveAbout(event)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Description *</label>
                <textarea id="about-description" rows="5" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">${a.description || ''}</textarea>
            </div>
            
            <div class="grid grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Years of Experience</label>
                    <input type="number" id="about-experience" value="${a.experience_years || 0}" min="0"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Projects Completed</label>
                    <input type="number" id="about-projects" value="${a.projects_completed || 0}" min="0"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Happy Clients</label>
                    <input type="number" id="about-clients" value="${a.happy_clients || 0}" min="0"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            
            <div class="flex gap-4 pt-4">
                <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" 
                    class="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all">
                    Cancel
                </button>
                <button type="submit" class="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all">
                    <i class="fas fa-save mr-2"></i>Save Changes
                </button>
            </div>
        </form>
    `;
    modal.classList.remove('hidden');
}

async function saveAbout(e) {
    e.preventDefault();
    const data = {
        description: document.getElementById('about-description').value,
        experience_years: parseInt(document.getElementById('about-experience').value) || 0,
        projects_completed: parseInt(document.getElementById('about-projects').value) || 0,
        happy_clients: parseInt(document.getElementById('about-clients').value) || 0
    };
    
    try {
        const { error } = await supabase.from('about').update(data).eq('id', portfolioData.about.id);
        if (error) throw error;
        portfolioData.about = { ...portfolioData.about, ...data };
        document.getElementById('modal').classList.add('hidden');
        renderAbout();
        showToast('About section updated successfully!', 'success');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// ==================== PROJECTS CRUD ====================
function addProject() {
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = 'Add New Project';
    document.getElementById('modal-content').innerHTML = `
        <form onsubmit="saveProject(event, null)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Project Title *</label>
                <input type="text" id="project-title" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Description *</label>
                <textarea id="project-description" rows="3" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Project Image</label>
                <input type="file" id="project-image-file" accept="image/*"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                <p class="text-xs text-gray-500 mt-1">Upload project screenshot or thumbnail</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Live Project URL</label>
                    <input type="url" id="project-live-url" placeholder="https://your-project.com"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Deployed project link</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">GitHub Repository URL</label>
                    <input type="url" id="project-github-url" placeholder="https://github.com/..."
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Source code repository</p>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Technologies (comma separated)</label>
                <input type="text" id="project-tech" placeholder="React, Node.js, MongoDB"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div class="flex gap-4 pt-4">
                <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" 
                    class="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all">
                    Cancel
                </button>
                <button type="submit" class="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all">
                    <i class="fas fa-plus mr-2"></i>Add Project
                </button>
            </div>
        </form>
    `;
    modal.classList.remove('hidden');
}

function editProject(id) {
    const project = portfolioData.projects.find(p => p.id === id);
    if (!project) return;
    
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = 'Edit Project';
    document.getElementById('modal-content').innerHTML = `
        <form onsubmit="saveProject(event, '${id}')" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Project Title *</label>
                <input type="text" id="project-title" value="${project.title || ''}" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Description *</label>
                <textarea id="project-description" rows="3" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">${project.description || ''}</textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Project Image</label>
                ${project.image_url ? `<p class="text-sm text-gray-600 mb-2">Current: <a href="${project.image_url}" target="_blank" class="text-blue-600 hover:underline">View Image</a></p>` : ''}
                <input type="file" id="project-image-file" accept="image/*"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                <p class="text-xs text-gray-500 mt-1">Upload new image to replace current one</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Live Project URL</label>
                    <input type="url" id="project-live-url" value="${project.live_url || ''}" placeholder="https://your-project.com"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">GitHub Repository URL</label>
                    <input type="url" id="project-github-url" value="${project.github_url || ''}" placeholder="https://github.com/..."
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Technologies (comma separated)</label>
                <input type="text" id="project-tech" value="${project.technologies ? project.technologies.join(', ') : ''}" placeholder="React, Node.js, MongoDB"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div class="flex gap-4 pt-4">
                <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" 
                    class="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all">
                    Cancel
                </button>
                <button type="submit" class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
                    <i class="fas fa-save mr-2"></i>Save Changes
                </button>
            </div>
        </form>
    `;
    modal.classList.remove('hidden');
}

async function saveProject(e, id) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
        
        const tech = document.getElementById('project-tech').value;
        const data = {
            title: document.getElementById('project-title').value,
            description: document.getElementById('project-description').value,
            live_url: document.getElementById('project-live-url').value || null,
            github_url: document.getElementById('project-github-url').value || null,
            technologies: tech ? tech.split(',').map(t => t.trim()) : []
        };
        
        // Handle image file upload
        const imageFile = document.getElementById('project-image-file').files[0];
        if (imageFile) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading image...';
            const uploadResult = await uploadFile(imageFile, 'projects');
            if (uploadResult.success) {
                data.image_url = uploadResult.url;
                // Delete old image if updating
                if (id && portfolioData.projects.find(p => p.id === id)?.image_url) {
                    const oldUrl = portfolioData.projects.find(p => p.id === id).image_url;
                    if (oldUrl && oldUrl.includes('portfolio/')) {
                        const oldPath = oldUrl.split('portfolio/')[1];
                        await deleteFile(oldPath);
                    }
                }
            } else {
                throw new Error('Failed to upload image: ' + uploadResult.error);
            }
        } else if (!id) {
            // No image provided for new project
            data.image_url = null;
        }
        
        if (id) {
            // Update
            const { error } = await supabase.from('projects').update(data).eq('id', id);
            if (error) throw error;
            const index = portfolioData.projects.findIndex(p => p.id === id);
            if (index !== -1) portfolioData.projects[index] = { ...portfolioData.projects[index], ...data };
            showToast('Project updated successfully!', 'success');
        } else {
            // Insert
            const { data: newProject, error } = await supabase.from('projects').insert([data]).select();
            if (error) throw error;
            portfolioData.projects.push(newProject[0]);
            showToast('Project added successfully!', 'success');
        }
        document.getElementById('modal').classList.add('hidden');
        renderProjects();
        renderDashboard();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
        portfolioData.projects = portfolioData.projects.filter(p => p.id !== id);
        renderProjects();
        renderDashboard();
        showToast('Project deleted successfully!', 'success');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// ==================== SKILLS CRUD ====================
function addSkill() {
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = 'Add New Skill';
    document.getElementById('modal-content').innerHTML = `
        <form onsubmit="saveSkill(event, null)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Skill Name *</label>
                <input type="text" id="skill-name" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Category</label>
                <select id="skill-category"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Database">Database</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Tools">Tools</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Proficiency Level (%) *</label>
                <input type="range" id="skill-proficiency" min="0" max="100" value="50" 
                    oninput="document.getElementById('proficiency-value').textContent = this.value + '%'"
                    class="w-full">
                <div class="text-center">
                    <span id="proficiency-value" class="text-2xl font-bold text-blue-600">50%</span>
                </div>
            </div>
            
            <div class="flex gap-4 pt-4">
                <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" 
                    class="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all">
                    Cancel
                </button>
                <button type="submit" class="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all">
                    <i class="fas fa-plus mr-2"></i>Add Skill
                </button>
            </div>
        </form>
    `;
    modal.classList.remove('hidden');
}

function editSkill(id) {
    const skill = portfolioData.skills.find(s => s.id === id);
    if (!skill) return;
    
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = 'Edit Skill';
    document.getElementById('modal-content').innerHTML = `
        <form onsubmit="saveSkill(event, '${id}')" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Skill Name *</label>
                <input type="text" id="skill-name" value="${skill.name || ''}" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Category</label>
                <select id="skill-category"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                    <option value="Frontend" ${skill.category === 'Frontend' ? 'selected' : ''}>Frontend</option>
                    <option value="Backend" ${skill.category === 'Backend' ? 'selected' : ''}>Backend</option>
                    <option value="Database" ${skill.category === 'Database' ? 'selected' : ''}>Database</option>
                    <option value="DevOps" ${skill.category === 'DevOps' ? 'selected' : ''}>DevOps</option>
                    <option value="Tools" ${skill.category === 'Tools' ? 'selected' : ''}>Tools</option>
                    <option value="Other" ${skill.category === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Proficiency Level (%) *</label>
                <input type="range" id="skill-proficiency" min="0" max="100" value="${skill.proficiency_level || 50}" 
                    oninput="document.getElementById('proficiency-value').textContent = this.value + '%'"
                    class="w-full">
                <div class="text-center">
                    <span id="proficiency-value" class="text-2xl font-bold text-blue-600">${skill.proficiency_level || 50}%</span>
                </div>
            </div>
            
            <div class="flex gap-4 pt-4">
                <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" 
                    class="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all">
                    Cancel
                </button>
                <button type="submit" class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
                    <i class="fas fa-save mr-2"></i>Save Changes
                </button>
            </div>
        </form>
    `;
    modal.classList.remove('hidden');
}

async function saveSkill(e, id) {
    e.preventDefault();
    const data = {
        name: document.getElementById('skill-name').value,
        category: document.getElementById('skill-category').value,
        proficiency_level: parseInt(document.getElementById('skill-proficiency').value)
    };
    
    try {
        if (id) {
            const { error } = await supabase.from('skills').update(data).eq('id', id);
            if (error) throw error;
            const index = portfolioData.skills.findIndex(s => s.id === id);
            if (index !== -1) portfolioData.skills[index] = { ...portfolioData.skills[index], ...data };
            showToast('Skill updated successfully!', 'success');
        } else {
            const { data: newSkill, error } = await supabase.from('skills').insert([data]).select();
            if (error) throw error;
            portfolioData.skills.push(newSkill[0]);
            showToast('Skill added successfully!', 'success');
        }
        document.getElementById('modal').classList.add('hidden');
        renderSkills();
        renderDashboard();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function deleteSkill(id) {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    try {
        const { error } = await supabase.from('skills').delete().eq('id', id);
        if (error) throw error;
        portfolioData.skills = portfolioData.skills.filter(s => s.id !== id);
        renderSkills();
        renderDashboard();
        showToast('Skill deleted successfully!', 'success');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// ==================== EDUCATION CRUD ====================
function addEducation() {
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = 'Add Education';
    document.getElementById('modal-content').innerHTML = `
        <form onsubmit="saveEducation(event, null)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Degree/Qualification *</label>
                <input type="text" id="edu-degree" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Institution *</label>
                <input type="text" id="edu-institution" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Start Year *</label>
                    <input type="text" id="edu-start-year" required placeholder="2020" pattern="[0-9]{4}"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Enter 4-digit year</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">End Year</label>
                    <input type="text" id="edu-end-year" placeholder="2024 or leave empty" pattern="[0-9]{4}"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Leave empty if ongoing</p>
                </div>
            </div>
            
            <div>
                <label class="flex items-center gap-2">
                    <input type="checkbox" id="edu-completed" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500">
                    <span class="text-sm font-medium">Completed</span>
                </label>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Description</label>
                <textarea id="edu-description" rows="3"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            
            <div class="flex gap-4 pt-4">
                <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" 
                    class="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all">
                    Cancel
                </button>
                <button type="submit" class="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all">
                    <i class="fas fa-plus mr-2"></i>Add Education
                </button>
            </div>
        </form>
    `;
    modal.classList.remove('hidden');
}

function editEducation(id) {
    const edu = portfolioData.education.find(e => e.id === id);
    if (!edu) return;
    
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = 'Edit Education';
    document.getElementById('modal-content').innerHTML = `
        <form onsubmit="saveEducation(event, '${id}')" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Degree/Qualification *</label>
                <input type="text" id="edu-degree" value="${edu.degree || ''}" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Institution *</label>
                <input type="text" id="edu-institution" value="${edu.institution || ''}" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Start Year *</label>
                    <input type="text" id="edu-start-year" value="${edu.start_year || ''}" required placeholder="2020" pattern="[0-9]{4}"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Enter 4-digit year</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">End Year</label>
                    <input type="text" id="edu-end-year" value="${edu.end_year || ''}" placeholder="2024 or leave empty" pattern="[0-9]{4}"
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Leave empty if ongoing</p>
                </div>
            </div>
            
            <div>
                <label class="flex items-center gap-2">
                    <input type="checkbox" id="edu-completed" ${edu.completed ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500">
                    <span class="text-sm font-medium">Completed</span>
                </label>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Description</label>
                <textarea id="edu-description" rows="3"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">${edu.description || ''}</textarea>
            </div>
            
            <div class="flex gap-4 pt-4">
                <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" 
                    class="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all">
                    Cancel
                </button>
                <button type="submit" class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
                    <i class="fas fa-save mr-2"></i>Save Changes
                </button>
            </div>
        </form>
    `;
    modal.classList.remove('hidden');
}

async function saveEducation(e, id) {
    e.preventDefault();
    const data = {
        degree: document.getElementById('edu-degree').value,
        institution: document.getElementById('edu-institution').value,
        start_year: document.getElementById('edu-start-year').value,
        end_year: document.getElementById('edu-end-year').value || null,
        completed: document.getElementById('edu-completed').checked,
        description: document.getElementById('edu-description').value
    };
    
    try {
        if (id) {
            const { error } = await supabase.from('education').update(data).eq('id', id);
            if (error) throw error;
            const index = portfolioData.education.findIndex(e => e.id === id);
            if (index !== -1) portfolioData.education[index] = { ...portfolioData.education[index], ...data };
            showToast('Education updated successfully!', 'success');
        } else {
            const { data: newEdu, error } = await supabase.from('education').insert([data]).select();
            if (error) throw error;
            portfolioData.education.unshift(newEdu[0]);
            showToast('Education added successfully!', 'success');
        }
        document.getElementById('modal').classList.add('hidden');
        renderEducation();
        renderDashboard();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function deleteEducation(id) {
    if (!confirm('Are you sure you want to delete this education record?')) return;
    try {
        const { error } = await supabase.from('education').delete().eq('id', id);
        if (error) throw error;
        portfolioData.education = portfolioData.education.filter(e => e.id !== id);
        renderEducation();
        renderDashboard();
        showToast('Education deleted successfully!', 'success');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// ==================== CERTIFICATES CRUD ====================
function addCertificate() {
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = 'Add Certificate';
    document.getElementById('modal-content').innerHTML = `
        <form onsubmit="saveCertificate(event, null)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Certificate Name *</label>
                <input type="text" id="cert-name" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Certificate Title</label>
                <input type="text" id="cert-title"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                    placeholder="E.g., Professional Certificate, Course Completion">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Issuing Organization *</label>
                <input type="text" id="cert-org" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Issue Date *</label>
                <input type="date" id="cert-date" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Certificate File (PDF/Image)</label>
                <input type="file" id="cert-file" accept=".pdf,image/*"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                <p class="text-xs text-gray-500 mt-1">Upload certificate PDF or image</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Verification URL (optional)</label>
                <input type="url" id="cert-verify-url" placeholder="https://verify-certificate.com/..."
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                <p class="text-xs text-gray-500 mt-1">External verification link</p>
            </div>
            
            <div class="flex gap-4 pt-4">
                <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" 
                    class="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all">
                    Cancel
                </button>
                <button type="submit" class="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all">
                    <i class="fas fa-plus mr-2"></i>Add Certificate
                </button>
            </div>
        </form>
    `;
    modal.classList.remove('hidden');
}

function editCertificate(id) {
    console.log('editCertificate called with ID:', id, 'Type:', typeof id);
    console.log('Total certificates loaded:', portfolioData.certificates?.length);
    console.log('Available certificates:', portfolioData.certificates?.map(c => ({ id: c.id, name: c.name })));
    
    // Ensure we have certificates data
    if (!portfolioData.certificates || portfolioData.certificates.length === 0) {
        console.error('No certificates loaded. Portfolio data:', portfolioData);
        showToast('No certificates loaded. Refreshing...', 'error');
        loadAllData();
        return;
    }
    
    // Find certificate by ID - try both number and string comparison
    let cert = portfolioData.certificates.find(c => c.id == id);
    
    // If not found, try with strict number conversion
    if (!cert) {
        cert = portfolioData.certificates.find(c => Number(c.id) === Number(id));
    }
    
    // If still not found, list all IDs for debugging
    if (!cert) {
        console.error('Certificate not found. Searching ID:', id);
        console.error('Available IDs:', portfolioData.certificates.map(c => ({ id: c.id, type: typeof c.id })));
        showToast('Certificate not found. Please refresh the page.', 'error');
        return;
    }
    
    console.log('Found certificate:', cert);
    
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = 'Edit Certificate';
    document.getElementById('modal-content').innerHTML = `
        <form onsubmit="saveCertificate(event, '${id}')" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Certificate Name *</label>
                <input type="text" id="cert-name" value="${(cert.name || cert.title || '').replace(/"/g, '&quot;')}" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Title *</label>
                <input type="text" id="cert-title" value="${(cert.title || cert.name || '').replace(/"/g, '&quot;')}" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Issuing Organization *</label>
                <input type="text" id="cert-org" value="${(cert.issuing_organization || '').replace(/"/g, '&quot;')}" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Issue Date *</label>
                <input type="date" id="cert-date" value="${cert.issue_date || ''}" required
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Certificate File (PDF/Image)</label>
                ${cert.certificate_url ? `<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Current: <a href="${cert.certificate_url}" target="_blank" class="text-blue-600 hover:underline">View Certificate</a></p>` : ''}
                <input type="file" id="cert-file" accept=".pdf,image/*"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                <p class="text-xs text-gray-500 mt-1">Upload new file to replace current one</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Verification URL (optional)</label>
                <input type="url" id="cert-verify-url" value="${cert.certificate_url || ''}" placeholder="https://verify-certificate.com/..."
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                <p class="text-xs text-gray-500 mt-1">External verification link (if available)</p>
            </div>
            
            <div class="flex gap-4 pt-4">
                <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" 
                    class="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all">
                    Cancel
                </button>
                <button type="submit" class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
                    <i class="fas fa-save mr-2"></i>Save Changes
                </button>
            </div>
        </form>
    `;
    modal.classList.remove('hidden');
}

async function saveCertificate(e, id) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
        
        const name = document.getElementById('cert-name').value.trim();
        const titleElement = document.getElementById('cert-title');
        const title = titleElement ? titleElement.value.trim() : name;
        const issuing_organization = document.getElementById('cert-org').value.trim();
        const issue_date = document.getElementById('cert-date').value;
        const verifyUrlElement = document.getElementById('cert-verify-url');
        const verify_url = verifyUrlElement ? verifyUrlElement.value.trim() : '';
        
        const data = {
            name: name,
            title: title || name,
            issuing_organization: issuing_organization,
            issue_date: issue_date
        };
        
        // Handle certificate file upload
        const certFileElement = document.getElementById('cert-file');
        const certFile = certFileElement ? certFileElement.files[0] : null;
        if (certFile) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading certificate...';
            const uploadResult = await uploadFile(certFile, 'certificates');
            if (uploadResult.success) {
                data.certificate_url = uploadResult.url;
                // Delete old file if updating
                if (id) {
                    const oldCert = portfolioData.certificates.find(c => c.id === id);
                    if (oldCert && oldCert.certificate_url && oldCert.certificate_url.includes('portfolio/')) {
                        const oldPath = oldCert.certificate_url.split('portfolio/')[1];
                        await deleteFile(oldPath);
                    }
                }
            } else {
                throw new Error('Failed to upload certificate: ' + uploadResult.error);
            }
        } else if (verify_url) {
            // If no file uploaded but verification URL provided, use it
            data.certificate_url = verify_url;
        }
        
        if (id) {
            const { error } = await supabase.from('certificates').update(data).eq('id', id);
            if (error) throw error;
            const index = portfolioData.certificates.findIndex(c => c.id === id);
            if (index !== -1) {
                portfolioData.certificates[index] = { ...portfolioData.certificates[index], ...data };
            }
            showToast('Certificate updated successfully!', 'success');
        } else {
            const { data: newCert, error } = await supabase.from('certificates').insert([data]).select();
            if (error) throw error;
            portfolioData.certificates.unshift(newCert[0]);
            showToast('Certificate added successfully!', 'success');
        }
        document.getElementById('modal').classList.add('hidden');
        renderCertificates();
        renderDashboard();
    } catch (error) {
        console.error('Error saving certificate:', error);
        showToast('Error: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

async function deleteCertificate(id) {
    if (!confirm('Are you sure you want to delete this certificate?')) return;
    try {
        const { error } = await supabase.from('certificates').delete().eq('id', id);
        if (error) throw error;
        portfolioData.certificates = portfolioData.certificates.filter(c => c.id !== id);
        renderCertificates();
        renderDashboard();
        showToast('Certificate deleted successfully!', 'success');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// ==================== MESSAGE FUNCTIONS ====================
async function markAsRead(id) {
    try {
        const { error } = await supabase.from('contact_messages').update({ read: true }).eq('id', id);
        if (error) throw error;
        const msg = portfolioData.messages.find(m => m.id === id);
        if (msg) msg.read = true;
        updateUnreadCount();
        renderMessages();
        showToast('Message marked as read', 'success');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function deleteMessage(id) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
        const { error } = await supabase.from('contact_messages').delete().eq('id', id);
        if (error) throw error;
        portfolioData.messages = portfolioData.messages.filter(m => m.id !== id);
        updateUnreadCount();
        renderMessages();
        showToast('Message deleted successfully!', 'success');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

function replyToMessage(id, email, name, phone) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = 'Reply to Message';
    document.getElementById('modal-content').innerHTML = `
        <div class="space-y-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p class="text-sm"><strong>To:</strong> ${name}</p>
                <p class="text-sm"><strong>Email:</strong> ${email}</p>
                ${phone ? `<p class="text-sm"><strong>Phone:</strong> ${phone}</p>` : ''}
            </div>
            
            <div class="grid grid-cols-3 gap-4">
                <a href="mailto:${email}" target="_blank" 
                    class="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-lg transition-all transform hover:scale-105">
                    <i class="fas fa-envelope text-4xl mb-3"></i>
                    <span class="font-semibold">Reply via Email</span>
                </a>
                
                ${phone ? `
                <a href="https://wa.me/${phone.replace(/\D/g, '')}" target="_blank" 
                    class="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-lg transition-all transform hover:scale-105">
                    <i class="fab fa-whatsapp text-4xl mb-3"></i>
                    <span class="font-semibold">WhatsApp</span>
                </a>
                
                <a href="sms:${phone}" target="_blank" 
                    class="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg shadow-lg transition-all transform hover:scale-105">
                    <i class="fas fa-sms text-4xl mb-3"></i>
                    <span class="font-semibold">Text Message</span>
                </a>
                ` : `
                <div class="col-span-2 flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p class="text-gray-500 dark:text-gray-400">No phone number provided</p>
                </div>
                `}
            </div>
            
            <div class="pt-4">
                <button onclick="document.getElementById('modal').classList.add('hidden')" 
                    class="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all">
                    Close
                </button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

// ==================== PASSWORD CHANGE ====================
function changePassword(e) {
    e.preventDefault();
    const current = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    
    if (current !== adminPassword) {
        showToast('Current password is incorrect!', 'error');
        return;
    }
    
    if (newPass.length < 6) {
        showToast('New password must be at least 6 characters!', 'error');
        return;
    }
    
    if (newPass !== confirm) {
        showToast('Passwords do not match!', 'error');
        return;
    }
    
    // Update password in both memory and localStorage
    adminPassword = newPass;
    localStorage.setItem('adminPassword', newPass);
    
    // Clear form fields
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    // Show success message
    showToast('Password changed successfully! You can now use the new password to login.', 'success');
    
    // Re-render settings to show updated password
    setTimeout(() => {
        renderSettings();
    }, 500);
}

// ==================== UTILITY FUNCTIONS ====================
function showToast(msg, type = 'success') {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'admin-toast';
        toast.className = 'fixed bottom-6 right-6 z-50 transform translate-y-full transition-transform duration-300';
        document.body.appendChild(toast);
    }
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="${colors[type] || colors.success} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 min-w-[300px]">
            <i class="fas ${icons[type] || icons.success} text-xl"></i>
            <span class="font-medium">${msg}</span>
        </div>
    `;
    
    setTimeout(() => toast.classList.remove('translate-y-full'), 100);
    setTimeout(() => toast.classList.add('translate-y-full'), 3000);
}

console.log('✅ Admin Panel Fully Loaded - All CRUD Operations Ready!');

// UTILITY
function showToast(msg,type='success') {
    let t = document.getElementById('admin-toast');
    if(!t) {
        t = document.createElement('div');
        t.id = 'admin-toast';
        t.className = 'fixed bottom-6 right-6 z-50 transform translate-y-full transition-transform duration-300';
        document.body.appendChild(t);
    }
    const cols = {success:'bg-green-500',error:'bg-red-500',warning:'bg-yellow-500',info:'bg-blue-500'};
    const icons = {success:'fa-check-circle',error:'fa-exclamation-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle'};
    t.innerHTML = `<div class="${cols[type]||cols.success} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 min-w-[300px]"><i class="fas ${icons[type]||icons.success} text-xl"></i><span class="font-medium">${msg}</span></div>`;
    setTimeout(()=>t.classList.remove('translate-y-full'),100);
    setTimeout(()=>t.classList.add('translate-y-full'),3000);
}

console.log('✅ Admin Panel loaded - All features ready!');