// Journal PWA - Application Logic
// With love for Alexa

// SVG Icon Helper - Returns dark pink SVG icons
function getIcon(iconName) {
    const darkPink = '#ff8fb5';
    const icons = {
        sparkles: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="${darkPink}"/>
            <circle cx="6" cy="6" r="1.5" fill="${darkPink}"/>
            <circle cx="18" cy="6" r="1.5" fill="${darkPink}"/>
            <circle cx="6" cy="18" r="1.5" fill="${darkPink}"/>
            <circle cx="18" cy="18" r="1.5" fill="${darkPink}"/>
        </svg>`,
        fire: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <path d="M12 22C16.4183 22 20 18.4183 20 14C20 10 17 7 14 5C14 8 12 10 11 12C11 10 9 8 8 6C5 8 4 11 4 14C4 18.4183 7.58172 22 12 22Z" fill="${darkPink}"/>
        </svg>`,
        thought: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C13.54 22 14.98 21.65 16.26 21.04L20.5 22L19.04 17.74C19.65 16.46 20 15.02 20 13.5C20 8.52 16.48 5 12 5V2Z" fill="${darkPink}"/>
            <circle cx="9" cy="12" r="1.5" fill="white"/>
            <circle cx="12" cy="12" r="1.5" fill="white"/>
            <circle cx="15" cy="12" r="1.5" fill="white"/>
        </svg>`,
        camera: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <path d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z" fill="${darkPink}"/>
            <path d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="${darkPink}"/>
        </svg>`,
        gift: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <path d="M20 6H17.42C17.7 5.4 17.89 4.75 17.89 4.05C17.89 2.25 16.64 0.7 15 0.2C13.5 -0.3 12 0.3 11 1.5C10 0.3 8.5 -0.3 7 0.2C5.36 0.7 4.11 2.25 4.11 4.05C4.11 4.75 4.3 5.4 4.58 6H2C1.45 6 1 6.45 1 7V10C1 10.55 1.45 11 2 11H3V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V11H22C22.55 11 23 10.55 23 10V7C23 6.45 22.55 6 22 6H20ZM12 2.5C12.83 2.5 13.5 3.17 13.5 4C13.5 4.83 12.83 5.5 12 5.5C11.17 5.5 10.5 4.83 10.5 4C10.5 3.17 11.17 2.5 12 2.5ZM6.5 4.05C6.5 3.4 7.05 2.85 7.7 2.85C8.35 2.85 8.9 3.4 8.9 4.05C8.9 4.7 8.35 5.25 7.7 5.25C7.05 5.25 6.5 4.7 6.5 4.05ZM19 20H5V11H19V20ZM20 9H4V8H20V9Z" fill="${darkPink}"/>
        </svg>`,
        celebration: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="${darkPink}"/>
            <path d="M19 15L20.5 18.5L24 20L20.5 21.5L19 25L17.5 21.5L14 20L17.5 18.5L19 15Z" fill="${darkPink}"/>
            <path d="M5 19L5.5 20.5L7 21L5.5 21.5L5 23L4.5 21.5L3 21L4.5 20.5L5 19Z" fill="${darkPink}"/>
            <circle cx="18" cy="6" r="1.5" fill="${darkPink}"/>
            <circle cx="6" cy="14" r="1" fill="${darkPink}"/>
        </svg>`,
        heart: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="${darkPink}"/>
        </svg>`,
        flower: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <circle cx="12" cy="12" r="3" fill="${darkPink}"/>
            <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="${darkPink}" stroke-width="2" stroke-linecap="round"/>
            <path d="M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="${darkPink}" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="5" r="1.5" fill="${darkPink}"/>
            <circle cx="12" cy="19" r="1.5" fill="${darkPink}"/>
            <circle cx="5" cy="12" r="1.5" fill="${darkPink}"/>
            <circle cx="19" cy="12" r="1.5" fill="${darkPink}"/>
            <circle cx="7.76" cy="7.76" r="1.5" fill="${darkPink}"/>
            <circle cx="16.24" cy="16.24" r="1.5" fill="${darkPink}"/>
            <circle cx="7.76" cy="16.24" r="1.5" fill="${darkPink}"/>
            <circle cx="16.24" cy="7.76" r="1.5" fill="${darkPink}"/>
        </svg>`,
        seedling: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <path d="M17 8C15.9 8 15 8.9 15 10C15 11.1 15.9 12 17 12C18.1 12 19 11.1 19 10C19 8.9 18.1 8 17 8Z" fill="${darkPink}"/>
            <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" fill="${darkPink}"/>
            <path d="M7 8C5.9 8 5 8.9 5 10C5 11.1 5.9 12 7 12C8.1 12 9 11.1 9 10C9 8.9 8.1 8 7 8Z" fill="${darkPink}"/>
            <path d="M12 6V22M17 12V22M7 12V22" stroke="${darkPink}" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        hibiscus: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <circle cx="12" cy="12" r="3" fill="${darkPink}"/>
            <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="${darkPink}" stroke-width="2" stroke-linecap="round"/>
            <path d="M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="${darkPink}" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 8C13.5 8 14.5 9 14.5 10.5C14.5 12 13.5 13 12 13" stroke="${darkPink}" stroke-width="1.5" fill="none"/>
            <circle cx="12" cy="5" r="1.5" fill="${darkPink}"/>
            <circle cx="12" cy="19" r="1.5" fill="${darkPink}"/>
            <circle cx="5" cy="12" r="1.5" fill="${darkPink}"/>
            <circle cx="19" cy="12" r="1.5" fill="${darkPink}"/>
        </svg>`,
        sunflower: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <circle cx="12" cy="12" r="4" fill="#FFD700"/>
            <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="${darkPink}" stroke-width="2" stroke-linecap="round"/>
            <path d="M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="${darkPink}" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="5" r="1.5" fill="${darkPink}"/>
            <circle cx="12" cy="19" r="1.5" fill="${darkPink}"/>
            <circle cx="5" cy="12" r="1.5" fill="${darkPink}"/>
            <circle cx="19" cy="12" r="1.5" fill="${darkPink}"/>
            <circle cx="7.76" cy="7.76" r="1.5" fill="${darkPink}"/>
            <circle cx="16.24" cy="16.24" r="1.5" fill="${darkPink}"/>
            <circle cx="7.76" cy="16.24" r="1.5" fill="${darkPink}"/>
            <circle cx="16.24" cy="7.76" r="1.5" fill="${darkPink}"/>
        </svg>`,
        rose: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <path d="M12 2C10 4 8 5 6 6C4 7 3 9 3 11C3 13 4 15 6 16C8 17 10 16 12 14C14 16 16 17 18 16C20 15 21 13 21 11C21 9 20 7 18 6C16 5 14 4 12 2Z" fill="${darkPink}"/>
            <path d="M12 14V22" stroke="${darkPink}" stroke-width="2" stroke-linecap="round"/>
            <path d="M10 18L12 20L14 18" stroke="${darkPink}" stroke-width="1.5" fill="none"/>
        </svg>`,
        crown: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z" fill="${darkPink}"/>
            <path d="M5 16H19V18H5V16Z" fill="${darkPink}"/>
            <circle cx="7" cy="20" r="1.5" fill="${darkPink}"/>
            <circle cx="12" cy="20" r="1.5" fill="${darkPink}"/>
            <circle cx="17" cy="20" r="1.5" fill="${darkPink}"/>
        </svg>`,
        phone: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="${darkPink}"/>
        </svg>`
    };
    return icons[iconName] || '';
}

// State Management
const state = {
    currentStreak: 0,
    lastEntryDate: null,
    totalEntries: 0,
    usedPrompts: [],
    milestones: [],
    currentPhoto: null,
    currentPhotoHash: null,
    previousPhotoHashes: [],
    allPrompts: []
};

// Milestones Configuration
const MILESTONES = [
    {
        id: 'week',
        name: '1 Week Streak',
        days: 7,
        icon: 'seedling',
        reward: 'Hell yeah! Let me go get you a bottle of wine.',
        achieved: false
    },
    {
        id: 'month',
        name: '1 Month Streak',
        days: 30,
        icon: 'flower',
        reward: 'You\'re crushing it Angel! Let\'s go get you a nice dinner out on the town.',
        achieved: false
    },
    {
        id: 'season',
        name: '3 Month Streak',
        days: 90,
        icon: 'hibiscus',
        reward: 'Alright, silly girl, you\'re doing great! Now, keep it realistic, but what\'s something in your cart you\'ve been wanting?',
        achieved: false
    },
    {
        id: 'halfyear',
        name: '6 Month Streak',
        days: 180,
        icon: 'sunflower',
        reward: 'Let\'s take the train somewhere for the weekend!',
        achieved: false
    },
    {
        id: 'ninemonth',
        name: '9 Month Streak',
        days: 270,
        icon: 'rose',
        reward: 'If you\'ve made it this far, you\'re awfully close to your birthday! Let\'s up the ante on the birthday gifts!',
        achieved: false
    },
    {
        id: 'year',
        name: '1 Year Streak',
        days: 365,
        icon: 'crown',
        reward: 'A TRIP! You\'ve spent the last year on your own journey! Now, let\'s go share one together!',
        achieved: false
    }
];

// Initialize app
function init() {
    loadState();
    loadPrompts();
    registerServiceWorker();
    setupEventListeners();
    initializeIcons();
    updateUI();
    checkInstallPrompt();
}

// Initialize SVG icons in the DOM
function initializeIcons() {
    // Sparkles in title
    const sparklesLeft = document.getElementById('sparkles-left');
    const sparklesRight = document.getElementById('sparkles-right');
    if (sparklesLeft) sparklesLeft.innerHTML = getIcon('sparkles');
    if (sparklesRight) sparklesRight.innerHTML = getIcon('sparkles');
    
    // Fire icon in streak
    const fireIcon = document.getElementById('fire-icon');
    if (fireIcon) fireIcon.innerHTML = getIcon('fire');
    
    // Thought icon in prompt
    const promptIcon = document.getElementById('prompt-icon');
    if (promptIcon) promptIcon.innerHTML = getIcon('thought');
    
    // Camera icon
    const cameraIcon = document.getElementById('camera-icon-svg');
    if (cameraIcon) cameraIcon.innerHTML = getIcon('camera');
    
    // Gift icon
    const giftIcon = document.getElementById('gift-icon');
    if (giftIcon) giftIcon.innerHTML = getIcon('gift');
    
    // Success celebration icon
    const successIcon = document.getElementById('success-icon-svg');
    if (successIcon) successIcon.innerHTML = getIcon('celebration');
}

// Load prompts (embedded in JS to avoid external file dependency)
function loadPrompts() {
    state.allPrompts = [
        // Letting Go & Acceptance (15 prompts)
        { text: "Write about something you've been holding onto that no longer serves you. What would it feel like to release it?", category: "letting_go", canRevisit: true },
        { text: "Describe a worry that keeps coming back. Now, write a gentle goodbye letter to it.", category: "letting_go", canRevisit: false },
        { text: "What would you tell your best friend if they had your exact worries? Write those words to yourself.", category: "letting_go", canRevisit: true },
        { text: "List 5 things you can't control right now. Then write: 'I release my need to control these things.'", category: "letting_go", canRevisit: true },
        { text: "Write about a time you let something go and felt lighter. How can you recreate that feeling today?", category: "letting_go", canRevisit: false },
        { text: "What are you afraid will happen if you stop worrying about ___? Explore this fear with curiosity, not judgment.", category: "letting_go", canRevisit: false },
        { text: "Write: 'I forgive myself for...' and complete it with something that's been weighing on you.", category: "letting_go", canRevisit: true },
        { text: "Describe the physical sensations in your body when you're anxious. Now imagine breathing each one out.", category: "letting_go", canRevisit: false },
        { text: "What would you do differently today if you weren't afraid? Write about that version of your day.", category: "letting_go", canRevisit: false },
        { text: "Write about a 'worst case scenario' you fear. Then write 3 ways you would handle it if it happened.", category: "letting_go", canRevisit: false },
        { text: "What does your anxiety want you to know? Give it a voice, then respond with compassion.", category: "letting_go", canRevisit: true },
        { text: "List everything racing through your mind right now. Look at each item and ask: 'Is this mine to carry today?'", category: "letting_go", canRevisit: true },
        { text: "Write a permission slip to yourself: 'Today, I give myself permission to...'", category: "letting_go", canRevisit: false },
        { text: "What would 'good enough' look like today? How can you honor that instead of chasing perfect?", category: "letting_go", canRevisit: true },
        { text: "Imagine your worries as clouds passing by. Describe them floating away, one by one.", category: "letting_go", canRevisit: false },

        // Present Moment & Mindfulness (12 prompts)
        { text: "Right now, list 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.", category: "mindfulness", canRevisit: true },
        { text: "Describe this exact moment in detail - what's around you, how you feel, what's beautiful right now.", category: "mindfulness", canRevisit: false },
        { text: "Write about something small that brought you joy today, no matter how tiny.", category: "mindfulness", canRevisit: false },
        { text: "What does your body need right now? Write about how you can honor that need today.", category: "mindfulness", canRevisit: true },
        { text: "Describe your breathing for one minute. Just notice it, without trying to change it. What did you discover?", category: "mindfulness", canRevisit: false },
        { text: "Write about a moment today when you felt fully present. What was different about that moment?", category: "mindfulness", canRevisit: false },
        { text: "Look around and find something pink. Write about why you're drawn to this color and what it means to you.", category: "mindfulness", canRevisit: false },
        { text: "What's one small pleasure you can experience right now? Write about engaging all your senses with it.", category: "mindfulness", canRevisit: false },
        { text: "If your current mood was a weather pattern, what would it be? Describe it without judgment.", category: "mindfulness", canRevisit: true },
        { text: "Write about the last time you laughed. What made it funny? Can you smile thinking about it now?", category: "mindfulness", canRevisit: false },
        { text: "Describe your perfect peaceful moment. What elements make it peaceful for you?", category: "mindfulness", canRevisit: false },
        { text: "Take 3 deep breaths. Write about any shift you notice in your body or mind.", category: "mindfulness", canRevisit: false },

        // Self-Compassion & Body Image (15 prompts)
        { text: "Write a love letter to your body, thanking it for all it does for you every single day.", category: "self_compassion", canRevisit: true },
        { text: "What would you say to comfort a close friend feeling how you feel right now? Say those words to yourself.", category: "self_compassion", canRevisit: true },
        { text: "List 5 things your body allows you to do (hug, laugh, create, etc). Express gratitude for each one.", category: "self_compassion", canRevisit: true },
        { text: "Write about a time you were kind to yourself. How can you practice that kindness today?", category: "self_compassion", canRevisit: false },
        { text: "Describe yourself the way someone who loves you would describe you.", category: "self_compassion", canRevisit: false },
        { text: "What are 3 things you like about yourself that have nothing to do with appearance?", category: "self_compassion", canRevisit: false },
        { text: "Write: 'My body is not an ornament, it is...' Complete this sentence with what your body really is.", category: "self_compassion", canRevisit: false },
        { text: "What does your body need to feel nourished today - not punished, but truly cared for?", category: "self_compassion", canRevisit: true },
        { text: "Write about a part of yourself you've been judging harshly. Offer it compassion instead.", category: "self_compassion", canRevisit: false },
        { text: "List 10 things you're grateful your body can do, starting with: 'I'm grateful I can breathe...'", category: "self_compassion", canRevisit: false },
        { text: "Write about how you want to feel in your body, not how you want to look.", category: "self_compassion", canRevisit: true },
        { text: "What would treating yourself with gentleness look like today? Write specific actions.", category: "self_compassion", canRevisit: false },
        { text: "Describe a moment you felt strong, capable, or powerful. What made you feel that way?", category: "self_compassion", canRevisit: false },
        { text: "Write to your future self 6 months from now. What do you hope they feel about their body?", category: "self_compassion", canRevisit: false },
        { text: "What compliment about yourself (appearance or otherwise) have you been deflecting? Write why you deserve it.", category: "self_compassion", canRevisit: false },

        // Challenging Intrusive Thoughts (12 prompts)
        { text: "Write down a recurring intrusive thought. Now write 3 reasons why it's not true.", category: "thought_challenge", canRevisit: true },
        { text: "What's the difference between a thought and a fact? Write about a thought you've been treating as fact.", category: "thought_challenge", canRevisit: true },
        { text: "Describe your inner critic's voice. Now give your inner compassionate voice a turn to respond.", category: "thought_challenge", canRevisit: false },
        { text: "Write about a fear that feels huge. Then write: 'Even if this happens, I will...'", category: "thought_challenge", canRevisit: false },
        { text: "List 'thinking traps' you fall into (all-or-nothing, catastrophizing, etc). Which one is strongest today?", category: "thought_challenge", canRevisit: true },
        { text: "What evidence do you have AGAINST the worry that's consuming you right now?", category: "thought_challenge", canRevisit: false },
        { text: "Write about a time your anxiety was wrong about something. What actually happened instead?", category: "thought_challenge", canRevisit: false },
        { text: "If your OCD thoughts were a bully, what would you say to stand up to them?", category: "thought_challenge", canRevisit: false },
        { text: "What's the kindest interpretation of [situation causing anxiety]? Write that story instead.", category: "thought_challenge", canRevisit: false },
        { text: "Write: 'This thought is just a thought. It is not...' and complete it with what it's not.", category: "thought_challenge", canRevisit: false },
        { text: "What would you tell past-you who was worried about something that turned out okay?", category: "thought_challenge", canRevisit: false },
        { text: "List 5 times your anxiety/OCD made you avoid something that would have actually been fine or good.", category: "thought_challenge", canRevisit: false },

        // Gratitude & Joy (10 prompts)
        { text: "List 10 small things that made today a little bit better, even if the day was hard.", category: "gratitude", canRevisit: false },
        { text: "Write about someone who made you smile recently. What did they do? How did it feel?", category: "gratitude", canRevisit: false },
        { text: "What's something you're taking for granted that you'd miss if it was gone?", category: "gratitude", canRevisit: false },
        { text: "Describe your favorite cozy moment. What makes it perfect for you?", category: "gratitude", canRevisit: false },
        { text: "Write about something that went better than expected this week.", category: "gratitude", canRevisit: false },
        { text: "What's one thing about your life right now that past-you would be excited about?", category: "gratitude", canRevisit: false },
        { text: "List everything you're grateful for that starts with the first letter of your name.", category: "gratitude", canRevisit: false },
        { text: "Write about a simple pleasure you experienced today (warm shower, good coffee, soft blanket).", category: "gratitude", canRevisit: false },
        { text: "What's something kind you did for yourself recently? Acknowledge and appreciate it.", category: "gratitude", canRevisit: false },
        { text: "Describe a place (real or imagined) where you feel completely at peace.", category: "gratitude", canRevisit: false },

        // Health & Hashimoto's (10 prompts)
        { text: "How is your body feeling today? Write about it with curiosity, not judgment.", category: "health", canRevisit: true },
        { text: "What does nourishment mean to you beyond just food? How can you nourish yourself today?", category: "health", canRevisit: false },
        { text: "Write about your relationship with your thyroid condition. What would you say to it?", category: "health", canRevisit: false },
        { text: "List 5 ways you've taken care of your health this week, no matter how small.", category: "health", canRevisit: false },
        { text: "What does your body need more of? What does it need less of? Write without shame.", category: "health", canRevisit: true },
        { text: "Describe how you feel after eating something that truly nourishes you vs. eating from stress.", category: "health", canRevisit: false },
        { text: "Write about your energy levels today. What patterns do you notice? What do you need?", category: "health", canRevisit: false },
        { text: "If your body could speak, what would it thank you for today?", category: "health", canRevisit: false },
        { text: "What's one gentle way you can move your body today that would feel good, not punishing?", category: "health", canRevisit: false },
        { text: "Write about progress you've made with your health, even tiny steps forward.", category: "health", canRevisit: false },

        // Social Media & Digital Wellness (8 prompts)
        { text: "How much time did you spend on TikTok today? How did it make you feel? Write honestly.", category: "digital", canRevisit: true },
        { text: "What are you really looking for when you open social media? Write about what you truly need instead.", category: "digital", canRevisit: true },
        { text: "Describe how your body feels before vs. after scrolling. What changes?", category: "digital", canRevisit: false },
        { text: "Write about something real you could do instead of scrolling right now.", category: "digital", canRevisit: false },
        { text: "What emotions trigger you to reach for your phone? List them and explore why.", category: "digital", canRevisit: false },
        { text: "If you could spend the time you scroll on something else, what would fill you up instead?", category: "digital", canRevisit: false },
        { text: "Write about the last time you put your phone down and felt genuinely present. What was different?", category: "digital", canRevisit: false },
        { text: "What comparison thoughts come up when you're on social media? Challenge each one.", category: "digital", canRevisit: false },

        // Relationships & Connection (8 prompts)
        { text: "Write about someone who loves you exactly as you are. How does their love feel?", category: "connection", canRevisit: false },
        { text: "What do you appreciate most about Chaz? Be specific and write from your heart.", category: "connection", canRevisit: false },
        { text: "Describe a moment when you felt truly seen and understood by someone. What made it special?", category: "connection", canRevisit: false },
        { text: "Write a thank you note to someone who's been patient with you during hard times.", category: "connection", canRevisit: false },
        { text: "What makes you feel most loved? How can you ask for more of that?", category: "connection", canRevisit: false },
        { text: "Write about a quality you bring to your relationships that you're proud of.", category: "connection", canRevisit: false },
        { text: "Who makes you feel like you can be your authentic self? What do they do that creates that safety?", category: "connection", canRevisit: false },
        { text: "Write about what you need from others when you're struggling. Practice asking for it.", category: "connection", canRevisit: false },

        // Values & Purpose (8 prompts)
        { text: "What matters most to you in life? Write about your core values.", category: "values", canRevisit: false },
        { text: "Describe who you want to be, not what you want to achieve or look like.", category: "values", canRevisit: false },
        { text: "What would you do if you weren't afraid of judgment? Write about that authentic version of you.", category: "values", canRevisit: false },
        { text: "Write about a time you acted in alignment with your values. How did it feel?", category: "values", canRevisit: false },
        { text: "What do you want to be remembered for? How can you live that today?", category: "values", canRevisit: false },
        { text: "List 5 things that give your life meaning, big or small.", category: "values", canRevisit: false },
        { text: "What lights you up? Write about activities or moments where you feel most alive.", category: "values", canRevisit: false },
        { text: "If you could give advice to someone struggling like you, what would you say? That's your wisdom - honor it.", category: "values", canRevisit: false },

        // Medication & Treatment (6 prompts)
        { text: "How are your medications making you feel? Write without judgment - just observe.", category: "treatment", canRevisit: true },
        { text: "What positive changes have you noticed since starting your treatment? List even small improvements.", category: "treatment", canRevisit: false },
        { text: "Write about your relationship with taking medication. What feelings come up?", category: "treatment", canRevisit: false },
        { text: "What support do you need with your treatment plan? Who can you ask?", category: "treatment", canRevisit: false },
        { text: "Describe how you feel on days when you take care of your health vs. days when you don't.", category: "treatment", canRevisit: false },
        { text: "Write a reminder to yourself about why your treatment is important for your wellbeing.", category: "treatment", canRevisit: false },

        // Growth & Future (8 prompts)
        { text: "What's one small brave thing you can do today? Write about taking that step.", category: "growth", canRevisit: false },
        { text: "Describe who you're becoming through this healing journey. What's different now?", category: "growth", canRevisit: false },
        { text: "Write to yourself one year from now. What do you hope they've learned?", category: "growth", canRevisit: false },
        { text: "What's a pattern you're ready to break? What would replacing it look like?", category: "growth", canRevisit: false },
        { text: "List 5 ways you've grown in the past month, no matter how subtle.", category: "growth", canRevisit: false },
        { text: "What boundary do you need to set for your own wellbeing? Practice writing it.", category: "growth", canRevisit: false },
        { text: "Describe your ideal day - not in terms of achievements, but in how you'd feel.", category: "growth", canRevisit: false },
        { text: "What old story about yourself are you ready to rewrite? Start writing the new version.", category: "growth", canRevisit: false }
    ];
}

// Register Service Worker for PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Welcome screen
    document.getElementById('start-today-btn').addEventListener('click', showPromptScreen);
    document.getElementById('view-milestones-btn').addEventListener('click', showMilestonesScreen);
    
    // Prompt screen
    document.getElementById('back-to-home').addEventListener('click', showWelcomeScreen);
    document.getElementById('upload-photo-btn').addEventListener('click', () => {
        document.getElementById('photo-input').click();
    });
    document.getElementById('photo-input').addEventListener('change', handlePhotoUpload);
    document.getElementById('enable-ai-feedback').addEventListener('change', handleAIFeedbackToggle);
    document.getElementById('complete-entry-btn').addEventListener('click', completeEntry);
    
    // Milestones screen
    document.getElementById('back-to-home-2').addEventListener('click', showWelcomeScreen);
    
    // Modals
    document.getElementById('close-modal').addEventListener('click', closeSuccessModal);
}

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('journalState');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Don't load apiKey - it's no longer used
        const { apiKey, ...stateData } = parsed;
        Object.assign(state, stateData);
        
        // Update milestones with saved data
        if (state.milestones && state.milestones.length > 0) {
            state.milestones.forEach((savedMilestone, idx) => {
                if (MILESTONES[idx]) {
                    MILESTONES[idx].achieved = savedMilestone.achieved;
                }
            });
        }
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('journalState', JSON.stringify({
        currentStreak: state.currentStreak,
        lastEntryDate: state.lastEntryDate,
        totalEntries: state.totalEntries,
        usedPrompts: state.usedPrompts,
        milestones: MILESTONES.map(m => ({ id: m.id, achieved: m.achieved })),
        previousPhotoHashes: state.previousPhotoHashes
    }));
}

// Update UI
function updateUI() {
    document.getElementById('current-streak').textContent = state.currentStreak;
    updateMilestonesUI();
}

// Show screens
function showWelcomeScreen() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('welcome-screen').classList.add('active');
    updateUI();
}

function showPromptScreen() {
    // For testing: Reset date check on each deployment
    // This allows testing without waiting for the next day
    const deploymentKey = 'journal-deployment-v1';
    const lastReset = localStorage.getItem(deploymentKey);
    const now = Date.now();
    
    // Reset if more than 1 hour has passed (for testing) or if it's a new session
    if (!lastReset || (now - parseInt(lastReset)) > 3600000) {
        state.lastEntryDate = null;
        localStorage.setItem(deploymentKey, now.toString());
    }
    
    // Check if already completed today
    const today = new Date().toDateString();
    if (state.lastEntryDate === today) {
        alert('You\'ve already completed your entry today! Come back tomorrow for a new prompt.');
        return;
    }
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('prompt-screen').classList.add('active');
    
    // Update date
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Show loading, then generate prompt
    document.getElementById('loading-state').style.display = 'block';
    document.getElementById('prompt-content').style.display = 'none';
    
    setTimeout(() => {
        generatePrompt();
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('prompt-content').style.display = 'block';
    }, 2000);
}

function showMilestonesScreen() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('milestones-screen').classList.add('active');
    updateMilestonesUI();
}

// Generate Prompt
function generatePrompt() {
    // Filter out used prompts, unless they can be revisited and haven't been used in last 30 prompts
    const availablePrompts = state.allPrompts.filter(prompt => {
        const promptIndex = state.allPrompts.indexOf(prompt);
        const lastUsedIndex = state.usedPrompts.indexOf(promptIndex);
        
        if (lastUsedIndex === -1) return true; // Never used
        if (!prompt.canRevisit) return false; // Can't revisit
        
        // Can revisit if not used in last 30 prompts
        const recentPrompts = state.usedPrompts.slice(-30);
        return !recentPrompts.includes(promptIndex);
    });
    
    // If we've used everything, reset (but keep recent 20)
    if (availablePrompts.length === 0) {
        state.usedPrompts = state.usedPrompts.slice(-20);
        return generatePrompt(); // Try again
    }
    
    // Random selection
    const randomPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
    const promptIndex = state.allPrompts.indexOf(randomPrompt);
    
    // Mark as used
    state.usedPrompts.push(promptIndex);
    
    // Display prompt
    document.getElementById('prompt-text').textContent = randomPrompt.text;
}

// Convert image to supported format (handles HEIC from iPhone)
async function convertImageToJpeg(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Create canvas and convert to JPEG
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Convert to blob as JPEG
                canvas.toBlob((blob) => {
                    if (blob) {
                        // Create a new File object with JPEG extension
                        const jpegFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(jpegFile);
                    } else {
                        reject(new Error('Failed to convert image'));
                    }
                }, 'image/jpeg', 0.95); // 95% quality
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Handle Photo Upload
async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        // Convert HEIC/other formats to JPEG for compatibility
        let processedFile = file;
        const fileType = file.type.toLowerCase();
        
        // If it's not a standard web format, convert it
        if (!fileType.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
            console.log('Converting image format from', fileType, 'to JPEG');
            processedFile = await convertImageToJpeg(file);
        }
    
    // Check if photo is different from previous ones
        const hash = await generateImageHash(processedFile);
    
    if (state.previousPhotoHashes.includes(hash)) {
            alert('Please use a different photo! Each entry should have a unique photo of your journal page.');
        e.target.value = '';
        return;
    }
    
        state.currentPhoto = processedFile;
    state.currentPhotoHash = hash;
    
    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('photo-preview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Journal entry">`;
    };
        reader.readAsDataURL(processedFile);
    
    // Enable complete button
    document.getElementById('complete-entry-btn').disabled = false;
    
        // Show AI feedback section (always available now)
        document.querySelector('.ai-feedback-section').style.display = 'block';
        
        // Hide the result div initially (only show when there's content)
        const feedbackResult = document.getElementById('ai-feedback-result');
        feedbackResult.style.display = 'none';
        feedbackResult.innerHTML = '';
    } catch (error) {
        console.error('Error processing photo:', error);
        alert('Error processing photo. Please try again with a different image.');
        e.target.value = '';
    }
}

// Generate simple image hash
async function generateImageHash(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Handle AI Feedback Toggle
function handleAIFeedbackToggle(e) {
    // AI feedback is always available now via backend API
    // No action needed - just process when checkbox is checked
}

// Process AI Feedback
async function processAIFeedback() {
    const feedbackDiv = document.getElementById('ai-feedback-result');
    const feedbackSection = document.querySelector('.ai-feedback-section');
    
    // Show the feedback section and display loading state
    feedbackSection.style.display = 'block';
    feedbackDiv.style.display = 'block';
    feedbackDiv.innerHTML = '<p style="color: var(--text-medium);"><em>Processing your entry...</em></p>';
    
    try {
        // Always convert to JPEG base64 to ensure OpenAI compatibility
        let imageBase64;
        
        // Convert the file to an image and then to JPEG base64
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                // Convert to JPEG base64 with explicit format
                imageBase64 = canvas.toDataURL('image/jpeg', 0.95);
                console.log('Converted image to JPEG, size:', imageBase64.length, 'format:', imageBase64.substring(0, 50));
                
                // Verify it's actually JPEG
                if (!imageBase64.startsWith('data:image/jpeg')) {
                    console.error('Conversion failed - not JPEG format:', imageBase64.substring(0, 50));
                    reject(new Error('Image conversion to JPEG failed'));
                    return;
                }
                resolve();
            };
            img.onerror = (err) => {
                console.error('Image load error:', err);
                reject(new Error('Failed to load image for conversion'));
            };
            
            // Load the file as data URL first
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(state.currentPhoto);
        });
        
        // Verify the image is in the correct format before sending
        if (!imageBase64 || !imageBase64.startsWith('data:image/jpeg')) {
            console.error('Image format verification failed:', imageBase64 ? imageBase64.substring(0, 50) : 'null');
            throw new Error('Image conversion failed. Please try a different image.');
        }
        
        // Get API endpoint (works in both dev and production)
        const apiUrl = window.location.origin + '/api/process-journal';
        
        console.log('Calling AI feedback API:', apiUrl);
        console.log('Image format verified as JPEG, size:', imageBase64.length);
        
        // Call backend API (which securely handles OpenAI)
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageBase64: imageBase64
            })
        });
        
        console.log('API response status:', response.status);
        
        const data = await response.json();
        console.log('API response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Unable to process journal entry');
        }
        
        if (!data.success || !data.reflection) {
            throw new Error('Unexpected response from server');
        }
        
        const reflection = data.reflection;
        
        feedbackDiv.innerHTML = `
            <h4>${getIcon('thought')} Reflection</h4>
            <p>${reflection}</p>
        `;
        feedbackDiv.style.display = 'block';
    } catch (error) {
        console.error('AI feedback error:', error);
        
        // User-friendly error messages
        let errorMessage = 'Unable to process feedback right now. Your entry is still saved!';
        
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
            errorMessage = 'Processing took too long. Please try again with a smaller or clearer image.';
        } else if (error.message.includes('rate limit') || error.message.includes('Too many requests')) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('too large') || error.message.includes('Image too large')) {
            errorMessage = 'Image is too large. Please use a smaller image (max 10MB).';
        } else if (error.message.includes('Invalid image')) {
            errorMessage = 'Invalid image format. Please use a valid image file.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
        } else if (error.message) {
            errorMessage = `Error: ${error.message}`;
        }
        
        feedbackDiv.innerHTML = `
            <p style="color: var(--text-medium);">
                <em>${errorMessage} ${getIcon('heart')}</em>
            </p>
        `;
        feedbackDiv.style.display = 'block';
    }
}

// File to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Complete Entry
async function completeEntry() {
    if (!state.currentPhoto) {
        alert('Please upload a photo first!');
        return;
    }
    
    // Disable button during processing
    const completeBtn = document.getElementById('complete-entry-btn');
    completeBtn.disabled = true;
    completeBtn.textContent = 'Processing...';
    
    // Process AI feedback if enabled
    const aiFeedbackEnabled = document.getElementById('enable-ai-feedback').checked;
    if (aiFeedbackEnabled) {
        try {
        await processAIFeedback();
        } catch (error) {
            console.error('Error processing AI feedback:', error);
            // Continue with entry completion even if AI feedback fails
        }
    } else {
        // Hide feedback section if not enabled
        document.querySelector('.ai-feedback-section').style.display = 'none';
    }
    
    // Update streak
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (state.lastEntryDate === yesterday) {
        state.currentStreak++;
    } else if (state.lastEntryDate !== today) {
        state.currentStreak = 1;
    }
    
    state.lastEntryDate = today;
    state.totalEntries++;
    state.previousPhotoHashes.push(state.currentPhotoHash);
    
    // Keep only last 30 photo hashes
    if (state.previousPhotoHashes.length > 30) {
        state.previousPhotoHashes = state.previousPhotoHashes.slice(-30);
    }
    
    // Check milestones
    const achievedMilestones = [];
    MILESTONES.forEach(milestone => {
        if (!milestone.achieved && state.currentStreak >= milestone.days) {
            milestone.achieved = true;
            achievedMilestones.push(milestone);
        }
    });
    
    // Save state
    saveState();
    
    // Show success modal
    let successMessage = 'Keep going! You\'re doing amazing.';
    let useHTML = false;
    if (achievedMilestones.length > 0) {
        const milestone = achievedMilestones[0];
        successMessage = `${getIcon('celebration')} ${milestone.name} achieved! ${getIcon('celebration')}<br><br>${milestone.reward}<br><br>You're incredible!`;
        useHTML = true;
    }
    
    document.getElementById('success-title').textContent = 'Entry Complete!';
    const successMsgEl = document.getElementById('success-message');
    if (useHTML) {
        successMsgEl.innerHTML = successMessage;
    } else {
        successMsgEl.textContent = successMessage;
    }
    document.getElementById('success-modal').classList.add('active');
    
    // Reset form
    state.currentPhoto = null;
    state.currentPhotoHash = null;
    document.getElementById('photo-input').value = '';
    document.getElementById('photo-preview').innerHTML = '';
    document.getElementById('enable-ai-feedback').checked = false;
    document.getElementById('ai-feedback-result').innerHTML = '';
    document.getElementById('ai-feedback-result').style.display = 'none';
    document.querySelector('.ai-feedback-section').style.display = 'none';
    completeBtn.textContent = 'Complete Entry';
}

// Close Success Modal
function closeSuccessModal() {
    document.getElementById('success-modal').classList.remove('active');
    showWelcomeScreen();
}

// Update Milestones UI
function updateMilestonesUI() {
    const grid = document.getElementById('milestones-grid');
    grid.innerHTML = '';
    
    MILESTONES.forEach(milestone => {
        const progress = Math.min((state.currentStreak / milestone.days) * 100, 100);
        const card = document.createElement('div');
        card.className = `milestone-card ${milestone.achieved ? 'achieved' : ''}`;
        card.innerHTML = `
            <div class="milestone-icon">${getIcon(milestone.icon)}</div>
            <h3 class="milestone-title">${milestone.name}</h3>
            <p class="milestone-description">${milestone.reward}</p>
            <div class="milestone-progress">
                <div class="milestone-progress-bar" style="width: ${progress}%"></div>
            </div>
            <p style="text-align: center; margin-top: 10px; color: var(--text-medium); font-size: 0.9em;">
                ${state.currentStreak} / ${milestone.days} days
            </p>
        `;
        grid.appendChild(card);
    });
}

// Check install prompt
function checkInstallPrompt() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show custom install prompt
        const installPrompt = document.createElement('div');
        installPrompt.className = 'install-prompt';
        installPrompt.innerHTML = `
            <p><strong>${getIcon('phone')} Add to Home Screen</strong></p>
            <p style="font-size: 0.9em; margin-bottom: 15px;">Install this app for the best experience!</p>
            <button class="primary-btn" id="install-btn">Install</button>
            <button class="secondary-btn" id="dismiss-install">Maybe Later</button>
        `;
        document.body.appendChild(installPrompt);
        
        document.getElementById('install-btn').addEventListener('click', async () => {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            installPrompt.remove();
        });
        
        document.getElementById('dismiss-install').addEventListener('click', () => {
            installPrompt.remove();
        });
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
