// ==========================================
// STATE MANAGEMENT
// ==========================================

let currentSlideIndex = 0;
let slides = [];
let assetsDirectoryHandle = null;
let roundSlides = [];

// ==========================================
// SLIDE TEMPLATES
// ==========================================

const slideTemplates = {
    cover: (data) => `
        <div class="slide slide-cover active">
            <h1>${data.title}</h1>
            <h2>${data.subtitle}</h2>
            <div class="accent-line" style="margin: 0 auto;"></div>
            ${data.emoji ? `<div class="decorative">${data.emoji}</div>` : ''}
        </div>
    `,

    rules: (data) => `
        <div class="slide slide-rules active">
            <h1>${data.title}</h1>
            <div class="accent-line"></div>
            <ul class="rule-list">
                ${data.rules.map(rule => `<li>${rule}</li>`).join('')}
            </ul>
        </div>
    `,

    gameplay: (data) => `
        <div class="slide slide-gameplay active">
            <div class="gameplay-text">
                <h1>${data.title}</h1>
                <div class="accent-line"></div>
                <p>${data.description}</p>
            </div>
            <div class="gameplay-visual">
                ${data.visual || '🎬'}
            </div>
        </div>
    `,

    scoring: (data) => `
        <div class="slide slide-scoring active">
            <h1>${data.title}</h1>
            <div class="scoring-grid">
                ${data.dimensions.map(dim => `
                    <div class="scoring-card">
                        <div class="icon">${dim.icon}</div>
                        <h3>${dim.name}</h3>
                        <p>${dim.description}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `,

    roundPreview: (data) => {
        const roundId = `round-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const canvasId = `radar-${roundId}`;
        const videoId = `video-preview-${roundId}`;

        return `
            <div class="slide slide-round-preview active" data-canvas-id="${canvasId}" data-video-id="${videoId}">
                <div class="round-left">
                    <div class="video-container">
                        ${data.originalVideoUrl
                ? `<video id="${videoId}" controls ${data.posterUrl ? `poster="${data.posterUrl}"` : ''}>
                                <source src="${data.originalVideoUrl}" type="video/mp4">
                                Your browser does not support video playback.
                              </video>`
                : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 3rem; color: var(--text-gold);">🎬 Original video not found</div>`
            }
                    </div>
                    <div class="panel info-panel">
                        <h2>${data.title || 'Round Info'}</h2>
                        <div class="info-item">
                            <span class="info-label">参与人数</span>
                            <span class="info-value">${data.players || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">难度</span>
                            <span class="info-value">${data.difficulty || 'N/A'}</span>
                        </div>
                        ${data.extraInfo ? `
                            <div class="info-item">
                                <span class="info-label">备注</span>
                                <span class="info-value">${data.extraInfo}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="round-right">
                    <div class="radar-container">
                        <canvas id="${canvasId}" width="400" height="400"></canvas>
                    </div>
                    ${data.props && data.props.length > 0 ? `
                        <div class="panel props-panel">
                            <div class="props-header">
                                <h3>推荐道具</h3>
                                <button class="picker-btn" onclick="showPicker()">
                                    🎲 随机抽人
                                </button>
                            </div>
                            <div class="props-list">
                                ${data.props.map(prop => `<span class="prop-tag">${prop}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    dubbing: (data) => {
        const videoId = `video-dubbing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return `
            <div class="slide slide-dubbing active" data-video-id="${videoId}">
                ${data.dubbingVideoUrl
                ? `<video id="${videoId}" controls>
                        <source src="${data.dubbingVideoUrl}" type="video/mp4">
                        Your browser does not support video playback.
                      </video>`
                : `<div class="fallback-message">
                        ⚠️ Dubbing video not found<br>
                        <small>Missing: dubbing.mp4</small>
                      </div>`
            }
            </div>
        `;
    },

    ending: (data) => `
        <div class="slide slide-ending active">
            <h1>${data.title}</h1>
            <p>${data.message}</p>
            <div class="decorative">${data.emoji || '✨'}</div>
        </div>
    `
};

// ==========================================
// BASE SLIDES (Static Content)
// ==========================================

const baseSlides = [
    {
        type: 'cover',
        data: {
            title: '声动信通',
            subtitle: '沉浸式角色扮演体验',
            emoji: '' // Removed mask emoji as requested
        }
    },
    {
        type: 'rules',
        data: {
            title: '游戏规则',
            rules: [
                '每位玩家将获得一个角色剧本',
                '通过表演和互动完成剧情',
                '根据六大维度进行评分',
                '团队协作，共创精彩故事'
            ]
        }
    },
    {
        type: 'gameplay',
        data: {
            title: '如何游玩',
            description: '选择您的剧本，观看视频了解剧情背景。根据角色卡片提示，发挥创意进行角色扮演。团队协作完成任务，享受沉浸式体验！',
            visual: '🎬'
        }
    },
    {
        type: 'scoring',
        data: {
            title: '评分维度',
            dimensions: [
                { icon: '🗣️', name: '语速', description: '表达流畅度与节奏感' },
                { icon: '😊', name: '情绪', description: '情感投入与感染力' },
                { icon: '✅', name: '准确度', description: '台词完整度与字数' },
                { icon: '🎭', name: '动作', description: '肢体表现与舞台感' },
                { icon: '🤝', name: '互动', description: '团队配合与回应' },
                { icon: '💡', name: '创意', description: '即兴发挥与创新' }
            ]
        }
    }
];

// ==========================================
// ASSET LOADING
// ==========================================

async function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    contentFiles = files;
    console.log(`📂 Selected ${files.length} files`);

    try {
        await scanRoundsFolder();
        await loadBackground();

        // Hide instruction overlay
        document.getElementById('instructionOverlay').classList.add('hidden');

        // Initialize presentation
        initializePresentation();
    } catch (error) {
        console.error('❌ Error initializing presentation:', error);
        alert('无法初始化演示，请检查控制台错误信息。');
    }
}

async function scanRoundsFolder() {
    try {
        roundSlides = [];

        // Group files by round directory
        // Expected structure: rounds/roundName/file
        const roundsMap = new Map();

        contentFiles.forEach(file => {
            const pathParts = (file.webkitRelativePath || file.name).split('/');
            // Check if file is inside a "rounds" directory
            // e.g., root/rounds/round1/video.mp4 -> parts: [root, rounds, round1, video.mp4]
            // We need to robustly find "rounds" segment
            const roundsIndex = pathParts.findIndex(p => p.toLowerCase() === 'rounds');

            if (roundsIndex !== -1 && roundsIndex + 2 < pathParts.length) {
                const roundName = pathParts[roundsIndex + 1];
                if (!roundsMap.has(roundName)) {
                    roundsMap.set(roundName, []);
                }
                roundsMap.get(roundName).push(file);
            }
        });

        if (roundsMap.size === 0) {
            console.warn('⚠️ No rounds found in "rounds" folder');
            return;
        }

        // Convert map to array and sort by round name
        const roundNames = Array.from(roundsMap.keys()).sort();

        for (const roundName of roundNames) {
            const files = roundsMap.get(roundName);
            const roundData = await loadRoundDataFromFiles(files, roundName);

            if (roundData) {
                // Generate TWO slides per round
                roundSlides.push({
                    type: 'roundPreview',
                    data: roundData
                });

                roundSlides.push({
                    type: 'dubbing',
                    data: roundData
                });
            }
        }

        console.log(`✅ Loaded ${roundSlides.length} rounds`);

    } catch (error) {
        console.error('❌ Error scanning rounds folder:', error);
    }
}

async function loadRoundDataFromFiles(files, roundName) {
    let infoData = {};
    let originalVideoUrl = null;
    let dubbingVideoUrl = null;
    let posterUrl = null;

    // Helper to read file as text
    const readFileText = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });

    for (const file of files) {
        const fileName = file.name.toLowerCase();

        if (fileName === 'info.json') {
            try {
                const text = await readFileText(file);
                infoData = JSON.parse(text);
            } catch (e) {
                console.error(`Error parsing info.json for ${roundName}:`, e);
            }
        } else if (fileName === 'original.mp4') {
            originalVideoUrl = URL.createObjectURL(file);
        } else if (fileName === 'dubbing.mp4') {
            dubbingVideoUrl = URL.createObjectURL(file);
        } else if (/\.(jpg|jpeg|png)$/.test(fileName) && !fileName.startsWith('background.')) {
            posterUrl = URL.createObjectURL(file);
        }
    }

    return {
        id: roundName,
        title: infoData.title || roundName,
        originalVideoUrl: originalVideoUrl,
        dubbingVideoUrl: dubbingVideoUrl,
        posterUrl: posterUrl,
        players: infoData.players,
        difficulty: infoData.difficulty,
        extraInfo: infoData.extraInfo,
        props: infoData.props || [],
        radar: infoData.radar || {
            emotion: 3,
            speed: 3,
            accuracy: 3,
            interaction: 3,
            action: 3,
            creativity: 3
        }
    };
}

async function loadBackground() {
    // Look for background.jpg/png/etc in root or assets folder
    // contentFiles is a flat array of File objects with webkitRelativePath

    // Priorities:
    // 1. Root background.*
    // 2. assets/background.*

    const bgFile = contentFiles.find(f => {
        const path = (f.webkitRelativePath || f.name).toLowerCase();
        const name = f.name.toLowerCase();

        // Check if file is an image
        if (!/\.(jpg|jpeg|png|webp)$/i.test(name)) return false;

        // Check filename
        if (!name.startsWith('background.')) return false;

        // Check location
        const parts = path.split('/');

        // Root file: RootFolder/background.jpg (2 parts)
        if (parts.length === 2) return true;

        // Assets folder file: RootFolder/assets/background.jpg (3 parts)
        if (parts.length === 3 && parts[1] === 'assets') return true;

        return false;
    });

    if (bgFile) {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target.result;
                // Update CSS variable
                document.documentElement.style.setProperty('--bg-gradient', `url('${url}') no-repeat center center fixed`);

                // Also update .background element if exists
                const bgEl = document.querySelector('.background');
                if (bgEl) {
                    bgEl.style.backgroundImage = `url('${url}')`;
                    bgEl.style.backgroundSize = 'cover';
                }
                console.log(`✅ Loaded background: ${bgFile.name}`);
            };
            reader.readAsDataURL(bgFile);
        } catch (e) {
            console.warn('⚠️ Failed to load background image:', e);
        }
    } else {
        console.log('ℹ️ No custom background found, using default');
    }
}

// ==========================================
// PRESENTATION INITIALIZATION
// ==========================================

function initializePresentation() {
    // Construct full slide array
    slides = [
        ...baseSlides,
        ...roundSlides,
        {
            type: 'ending',
            data: {
                title: '感谢参与',
                message: '期待下次相遇！',
                emoji: '✨'
            }
        }
    ];

    currentSlideIndex = 0;
    renderSlide(currentSlideIndex);
    updateSlideCounter();
}

// ==========================================
// SLIDE RENDERING
// ==========================================

function renderSlide(index) {
    if (index < 0 || index >= slides.length) return;

    const slide = slides[index];
    const slideCanvas = document.getElementById('slideCanvas');

    // Clean up all videos from previous slide
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(video => {
        video.pause();
        video.currentTime = 0;
    });

    // Generate HTML
    const html = slideTemplates[slide.type](slide.data);

    // Update canvas
    slideCanvas.innerHTML = html;

    // If round preview slide, draw radar chart
    if (slide.type === 'roundPreview') {
        const slideElement = slideCanvas.querySelector('.slide-round-preview');
        const canvasId = slideElement.getAttribute('data-canvas-id');

        // Wait for DOM to render
        setTimeout(() => {
            drawRadarChart(canvasId, slide.data.radar);
        }, 50);
    }


    // If dubbing slide, set up click-to-next behavior
    if (slide.type === 'dubbing') {
        const slideElement = slideCanvas.querySelector('.slide-dubbing');
        const video = slideElement ? slideElement.querySelector('video') : null;

        if (slideElement) {
            // Add click handler to slide background
            slideElement.addEventListener('click', function (e) {
                // Check if the click target is the video element or its controls
                if (video && (e.target === video || video.contains(e.target))) {
                    // Click was on video controls - allow normal video interaction
                    return;
                }

                // Click was on background/empty space - advance to next slide
                nextSlide();
            });
        }
    }

    currentSlideIndex = index;
    updateSlideCounter();
}

function updateSlideCounter() {
    const counter = document.getElementById('slideCounter');
    counter.textContent = `${currentSlideIndex + 1} / ${slides.length}`;
}

// ==========================================
// NAVIGATION
// ==========================================

function nextSlide() {
    if (currentSlideIndex < slides.length - 1) {
        renderSlide(currentSlideIndex + 1);
    }
}

function prevSlide() {
    if (currentSlideIndex > 0) {
        renderSlide(currentSlideIndex - 1);
    }
}

function handleSpaceKey() {
    const currentSlide = document.querySelector('.slide.active');
    if (!currentSlide) return;

    // Check for video element
    const video = currentSlide.querySelector('video');

    if (video) {
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }
}

// ==========================================
// FULLSCREEN
// ==========================================

function toggleFullscreen() {
    // 使用 body 作为全屏容器，这样 picker 也能在全屏模式下正常交互
    const container = document.body;

    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.error(`Error entering fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// ==========================================
// RADAR CHART
// ==========================================

function drawRadarChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`Canvas ${canvasId} not found`);
        return;
    }

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 40;

    // Dimensions
    const dimensions = [
        { key: 'emotion', label: '情绪', angle: 0 },
        { key: 'speed', label: '语速', angle: Math.PI / 3 },
        { key: 'accuracy', label: '准确度', angle: 2 * Math.PI / 3 },
        { key: 'interaction', label: '互动', angle: Math.PI },
        { key: 'action', label: '动作', angle: 4 * Math.PI / 3 },
        { key: 'creativity', label: '创意', angle: 5 * Math.PI / 3 }
    ];

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.lineWidth = 1;

    for (let level = 1; level <= 5; level++) {
        ctx.beginPath();
        const radius = (maxRadius / 5) * level;

        dimensions.forEach((dim, i) => {
            const x = centerX + radius * Math.cos(dim.angle - Math.PI / 2);
            const y = centerY + radius * Math.sin(dim.angle - Math.PI / 2);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.closePath();
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 1;

    dimensions.forEach(dim => {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        const x = centerX + maxRadius * Math.cos(dim.angle - Math.PI / 2);
        const y = centerY + maxRadius * Math.sin(dim.angle - Math.PI / 2);
        ctx.lineTo(x, y);
        ctx.stroke();
    });

    // Draw labels
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    dimensions.forEach(dim => {
        const labelRadius = maxRadius + 25;
        const x = centerX + labelRadius * Math.cos(dim.angle - Math.PI / 2);
        const y = centerY + labelRadius * Math.sin(dim.angle - Math.PI / 2);
        ctx.fillText(dim.label, x, y);
    });

    // Animate data polygon
    let animationProgress = 0;
    const animationDuration = 1000; // 1 second
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        animationProgress = Math.min(elapsed / animationDuration, 1);

        // Clear previous frame (preserve grid)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw grid
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let level = 1; level <= 5; level++) {
            ctx.beginPath();
            const radius = (maxRadius / 5) * level;
            dimensions.forEach((dim, i) => {
                const x = centerX + radius * Math.cos(dim.angle - Math.PI / 2);
                const y = centerY + radius * Math.sin(dim.angle - Math.PI / 2);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();
        }

        // Redraw axes
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        dimensions.forEach(dim => {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            const x = centerX + maxRadius * Math.cos(dim.angle - Math.PI / 2);
            const y = centerY + maxRadius * Math.sin(dim.angle - Math.PI / 2);
            ctx.lineTo(x, y);
            ctx.stroke();
        });

        // Redraw labels
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Inter';
        dimensions.forEach(dim => {
            const labelRadius = maxRadius + 25;
            const x = centerX + labelRadius * Math.cos(dim.angle - Math.PI / 2);
            const y = centerY + labelRadius * Math.sin(dim.angle - Math.PI / 2);
            ctx.fillText(dim.label, x, y);
        });

        // Draw data polygon
        ctx.beginPath();
        dimensions.forEach((dim, i) => {
            const value = (data[dim.key] || 3) * animationProgress;
            const radius = (maxRadius / 5) * value;
            const x = centerX + radius * Math.cos(dim.angle - Math.PI / 2);
            const y = centerY + radius * Math.sin(dim.angle - Math.PI / 2);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();

        // Fill
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fill();

        // Stroke
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw data points
        ctx.fillStyle = '#FFD700';
        dimensions.forEach(dim => {
            const value = (data[dim.key] || 3) * animationProgress;
            const radius = (maxRadius / 5) * value;
            const x = centerX + radius * Math.cos(dim.angle - Math.PI / 2);
            const y = centerY + radius * Math.sin(dim.angle - Math.PI / 2);

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Continue animation
        if (animationProgress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Folder selection
    // Managed via inline onclick in HTML

    // Navigation buttons
    document.getElementById('prevBtn').addEventListener('click', prevSlide);
    document.getElementById('nextBtn').addEventListener('click', nextSlide);
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case ' ':
                e.preventDefault();
                handleSpaceKey();
                break;
            case 'ArrowRight':
            case 'PageDown':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                prevSlide();
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                toggleFullscreen();
                break;
        }
    });

    // Mouse wheel navigation (optional)
    let wheelTimeout;
    document.addEventListener('wheel', (e) => {
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                // Horizontal scroll
                if (e.deltaX > 0) nextSlide();
                else prevSlide();
            } else {
                // Vertical scroll
                if (e.deltaY > 0) nextSlide();
                else prevSlide();
            }
        }, 50);
    }, { passive: true });

    // Picker back button
    document.getElementById('backToPresentation')?.addEventListener('click', hidePicker);
});

// ==========================================
// PICKER INTEGRATION
// ==========================================

// Page switching functions
function showPicker() {
    // Hide presentation, show picker
    document.querySelector('.presentation-container').style.display = 'none';
    document.getElementById('instructionOverlay').style.display = 'none';
    document.getElementById('pickerContainer').classList.remove('hidden');

    // Pause current videos
    const videos = document.querySelectorAll('.slide-canvas video');
    videos.forEach(v => v.pause());
}

function hidePicker() {
    // Hide picker, show presentation
    document.getElementById('pickerContainer').classList.add('hidden');
    document.querySelector('.presentation-container').style.display = 'flex';
}

// ==========================================
// PICKER CORE LOGIC (Encapsulated)
// ==========================================

(function initPicker() {
    // People data - extracted from namelist.txt
    // Format: { department, gender, name }
    // Gender is empty string for now as data is not yet collected
    const pickerPeople = [
        // 港航物流部
        { department: "港航物流部", gender: "", name: "华路" },
        { department: "港航物流部", gender: "", name: "金亮亮" },
        { department: "港航物流部", gender: "", name: "陈剑峰" },
        { department: "港航物流部", gender: "", name: "张凯凯" },
        { department: "港航物流部", gender: "", name: "刘婧瑜" },
        { department: "港航物流部", gender: "", name: "董浩" },
        { department: "港航物流部", gender: "", name: "蔡朱静" },
        { department: "港航物流部", gender: "", name: "张恒" },
        { department: "港航物流部", gender: "", name: "晏明熙" },
        { department: "港航物流部", gender: "", name: "黄锋" },
        { department: "港航物流部", gender: "", name: "楼嘉超" },
        { department: "港航物流部", gender: "", name: "潘宇轩" },
        { department: "港航物流部", gender: "", name: "刘文韬" },
        { department: "港航物流部", gender: "", name: "胡立博文" },
        { department: "港航物流部", gender: "", name: "邱倬亮" },
        { department: "港航物流部", gender: "", name: "徐逸凡" },
        { department: "港航物流部", gender: "", name: "陈安迪" },
        { department: "港航物流部", gender: "", name: "颜豪洁" },
        { department: "港航物流部", gender: "", name: "严方" },
        { department: "港航物流部", gender: "", name: "乐碧瑶" },
        { department: "港航物流部", gender: "", name: "马显威" },
        { department: "港航物流部", gender: "", name: "杨帆" },
        { department: "港航物流部", gender: "", name: "胡瞿益" },
        { department: "港航物流部", gender: "", name: "沈贺嵩" },
        { department: "港航物流部", gender: "", name: "张云" },
        { department: "港航物流部", gender: "", name: "赵宇舟" },
        { department: "港航物流部", gender: "", name: "胡子威" },
        { department: "港航物流部", gender: "", name: "周同" },
        { department: "港航物流部", gender: "", name: "余娜" },
        // 港运通
        { department: "港运通", gender: "", name: "傅云娟" },
        // 后勤采购中心
        { department: "后勤采购中心", gender: "", name: "麻凌涛" },
        { department: "后勤采购中心", gender: "", name: "柯洁" },
        { department: "后勤采购中心", gender: "", name: "牛文晶" },
        { department: "后勤采购中心", gender: "", name: "孙涌涛" },
        { department: "后勤采购中心", gender: "", name: "张坤" },
        { department: "后勤采购中心", gender: "", name: "汪凌云" },
        { department: "后勤采购中心", gender: "", name: "吴嘉喻" },
        // 计划财务部
        { department: "计划财务部", gender: "", name: "钟慧倩" },
        { department: "计划财务部", gender: "", name: "张怡" },
        { department: "计划财务部", gender: "", name: "陈蔚" },
        { department: "计划财务部", gender: "", name: "顾辰奕" },
        { department: "计划财务部", gender: "", name: "王汇" },
        { department: "计划财务部", gender: "", name: "赵雅婷" },
        { department: "计划财务部", gender: "", name: "崔骏" },
        // 技术中心
        { department: "技术中心", gender: "", name: "汪健" },
        { department: "技术中心", gender: "", name: "王爱女" },
        { department: "技术中心", gender: "", name: "贺伟国" },
        { department: "技术中心", gender: "", name: "滕雷斌" },
        { department: "技术中心", gender: "", name: "陆一芸" },
        { department: "技术中心", gender: "", name: "张柳宁" },
        { department: "技术中心", gender: "", name: "陈龙" },
        { department: "技术中心", gender: "", name: "金睿凝" },
        { department: "技术中心", gender: "", name: "刘挺" },
        // 宁波电子口岸
        { department: "宁波电子口岸", gender: "", name: "周吉" },
        // 软件开发部
        { department: "软件开发部", gender: "", name: "吴晓崧" },
        { department: "软件开发部", gender: "", name: "张驰" },
        { department: "软件开发部", gender: "", name: "罗雯洁" },
        { department: "软件开发部", gender: "", name: "顾增晖" },
        { department: "软件开发部", gender: "", name: "蒋舟" },
        { department: "软件开发部", gender: "", name: "胡晶" },
        { department: "软件开发部", gender: "", name: "周小成" },
        { department: "软件开发部", gender: "", name: "项珂艳" },
        { department: "软件开发部", gender: "", name: "胡彬" },
        { department: "软件开发部", gender: "", name: "马赟" },
        { department: "软件开发部", gender: "", name: "奚天晔" },
        { department: "软件开发部", gender: "", name: "周宇浩" },
        { department: "软件开发部", gender: "", name: "雷佳晨" },
        { department: "软件开发部", gender: "", name: "王惟贇" },
        { department: "软件开发部", gender: "", name: "胡斌" },
        { department: "软件开发部", gender: "", name: "郭海滨" },
        { department: "软件开发部", gender: "", name: "姚奕存" },
        { department: "软件开发部", gender: "", name: "徐晨林" },
        { department: "软件开发部", gender: "", name: "陈泱" },
        { department: "软件开发部", gender: "", name: "朱海玉" },
        { department: "软件开发部", gender: "", name: "王佳敏" },
        { department: "软件开发部", gender: "", name: "岑恩杰" },
        { department: "软件开发部", gender: "", name: "李梓恒" },
        { department: "软件开发部", gender: "", name: "侯柯羽" },
        { department: "软件开发部", gender: "", name: "史俞" },
        { department: "软件开发部", gender: "", name: "杨烜" },
        { department: "软件开发部", gender: "", name: "林鹏腾" },
        { department: "软件开发部", gender: "", name: "蔡宇翔" },
        { department: "软件开发部", gender: "", name: "王宇翔" },
        { department: "软件开发部", gender: "", name: "陈琪泽" },
        { department: "软件开发部", gender: "", name: "陈杰" },
        { department: "软件开发部", gender: "", name: "林立" },
        { department: "软件开发部", gender: "", name: "林瑞祥" },
        { department: "软件开发部", gender: "", name: "解宇隆" },
        { department: "软件开发部", gender: "", name: "冯展望" },
        { department: "软件开发部", gender: "", name: "陈凯" },
        // 市场部
        { department: "市场部", gender: "", name: "忻杰" },
        { department: "市场部", gender: "", name: "毛水英" },
        { department: "市场部", gender: "", name: "马军" },
        { department: "市场部", gender: "", name: "常宁" },
        { department: "市场部", gender: "", name: "叶又锦" },
        { department: "市场部", gender: "", name: "徐杭炜" },
        { department: "市场部", gender: "", name: "闵禹乔" },
        { department: "市场部", gender: "", name: "朱梓炎" },
        { department: "市场部", gender: "", name: "汪先波" },
        { department: "市场部", gender: "", name: "曹思超" },
        // 数据运营部
        { department: "数据运营部", gender: "", name: "王振勇" },
        { department: "数据运营部", gender: "", name: "毛雯雯" },
        { department: "数据运营部", gender: "", name: "吕作印" },
        { department: "数据运营部", gender: "", name: "周桢挺" },
        { department: "数据运营部", gender: "", name: "杜卓伟" },
        { department: "数据运营部", gender: "", name: "何丽莎" },
        { department: "数据运营部", gender: "", name: "赵世浩" },
        { department: "数据运营部", gender: "", name: "朱丹勇" },
        { department: "数据运营部", gender: "", name: "赵泽华" },
        { department: "数据运营部", gender: "", name: "张正源" },
        { department: "数据运营部", gender: "", name: "叶政艺" },
        { department: "数据运营部", gender: "", name: "陈悦" },
        { department: "数据运营部", gender: "", name: "李哲祺" },
        { department: "数据运营部", gender: "", name: "忻奕杰" },
        { department: "数据运营部", gender: "", name: "翁晨阳" },
        { department: "数据运营部", gender: "", name: "李欣雨" },
        { department: "数据运营部", gender: "", name: "虞正树" },
        { department: "数据运营部", gender: "", name: "郝恩蔚" },
        { department: "数据运营部", gender: "", name: "张海宁" },
        { department: "数据运营部", gender: "", name: "屠增健" },
        { department: "数据运营部", gender: "", name: "殷学远" },
        { department: "数据运营部", gender: "", name: "李霜双" },
        { department: "数据运营部", gender: "", name: "程仁义" },
        { department: "数据运营部", gender: "", name: "王雪燕" },
        // 系统运维部
        { department: "系统运维部", gender: "", name: "张方方" },
        { department: "系统运维部", gender: "", name: "范巍" },
        { department: "系统运维部", gender: "", name: "李世斌" },
        { department: "系统运维部", gender: "", name: "郑扬平" },
        { department: "系统运维部", gender: "", name: "郑超前" },
        { department: "系统运维部", gender: "", name: "陈晔" },
        { department: "系统运维部", gender: "", name: "胡星飞" },
        { department: "系统运维部", gender: "", name: "宋文誉" },
        { department: "系统运维部", gender: "", name: "柯东宇" },
        { department: "系统运维部", gender: "", name: "范剑雄" },
        { department: "系统运维部", gender: "", name: "陈荣" },
        { department: "系统运维部", gender: "", name: "王利军" },
        { department: "系统运维部", gender: "", name: "朱力" },
        { department: "系统运维部", gender: "", name: "张硕" },
        { department: "系统运维部", gender: "", name: "黄高立" },
        { department: "系统运维部", gender: "", name: "夏超俊" },
        { department: "系统运维部", gender: "", name: "戴俊杰" },
        { department: "系统运维部", gender: "", name: "马书勤" },
        { department: "系统运维部", gender: "", name: "叶晋" },
        { department: "系统运维部", gender: "", name: "汪迪" },
        { department: "系统运维部", gender: "", name: "陈庆南" },
        { department: "系统运维部", gender: "", name: "罗哲扬" },
        { department: "系统运维部", gender: "", name: "冯诚淏" },
        { department: "系统运维部", gender: "", name: "包思诚" },
        { department: "系统运维部", gender: "", name: "杜琛涛" },
        { department: "系统运维部", gender: "", name: "金崇实" },
        { department: "系统运维部", gender: "", name: "王润东" },
        { department: "系统运维部", gender: "", name: "顾玮" },
        { department: "系统运维部", gender: "", name: "秦涛" },
        { department: "系统运维部", gender: "", name: "金径" },
        { department: "系统运维部", gender: "", name: "张骏" },
        { department: "系统运维部", gender: "", name: "徐雷" },
        { department: "系统运维部", gender: "", name: "袁洁" },
        { department: "系统运维部", gender: "", name: "黄佳奇" },
        { department: "系统运维部", gender: "", name: "史凌怡" },
        { department: "系统运维部", gender: "", name: "谢超群" },
        { department: "系统运维部", gender: "", name: "徐步云" },
        { department: "系统运维部", gender: "", name: "郑欣" },
        { department: "系统运维部", gender: "", name: "章力博" },
        { department: "系统运维部", gender: "", name: "陈航裕" },
        // 颐博科技
        { department: "颐博科技", gender: "", name: "王汉君" },
        { department: "颐博科技", gender: "", name: "蔡婕" },
        { department: "颐博科技", gender: "", name: "卢伟力" },
        { department: "颐博科技", gender: "", name: "乔耿嘉" },
        // 智能工程部
        { department: "智能工程部", gender: "", name: "唐志钧" },
        { department: "智能工程部", gender: "", name: "毛意峰" },
        { department: "智能工程部", gender: "", name: "蔡顺强" },
        { department: "智能工程部", gender: "", name: "应楠娜" },
        { department: "智能工程部", gender: "", name: "陆斌" },
        { department: "智能工程部", gender: "", name: "周涵" },
        { department: "智能工程部", gender: "", name: "吴高德" },
        { department: "智能工程部", gender: "", name: "方佳斌" },
        { department: "智能工程部", gender: "", name: "胡迁辉" },
        { department: "智能工程部", gender: "", name: "李奇" },
        { department: "智能工程部", gender: "", name: "华杰" },
        { department: "智能工程部", gender: "", name: "杨侃" },
        { department: "智能工程部", gender: "", name: "易杨林" },
        { department: "智能工程部", gender: "", name: "胡斌斌" },
        { department: "智能工程部", gender: "", name: "夏泽华" },
        { department: "智能工程部", gender: "", name: "叶倩莹" },
        { department: "智能工程部", gender: "", name: "杨子江" },
        { department: "智能工程部", gender: "", name: "黄韬霖" },
        { department: "智能工程部", gender: "", name: "娄城" },
        { department: "智能工程部", gender: "", name: "鲍朝前" },
        { department: "智能工程部", gender: "", name: "贺冰之" },
        { department: "智能工程部", gender: "", name: "杨昆霖" },
        { department: "智能工程部", gender: "", name: "何文珂" },
        { department: "智能工程部", gender: "", name: "王嘉羽" },
        { department: "智能工程部", gender: "", name: "欧阳康" },
        { department: "智能工程部", gender: "", name: "陈培琰" },
        { department: "智能工程部", gender: "", name: "马雨骐" },
        { department: "智能工程部", gender: "", name: "杨正" },
        { department: "智能工程部", gender: "", name: "杨煜" },
        { department: "智能工程部", gender: "", name: "张驰" },
        { department: "智能工程部", gender: "", name: "贺晓宇" },
        { department: "智能工程部", gender: "", name: "李银辉" },
        { department: "智能工程部", gender: "", name: "王君宇" },
        { department: "智能工程部", gender: "", name: "张金硕" },
        { department: "智能工程部", gender: "", name: "郭跃波" },
        { department: "智能工程部", gender: "", name: "蔡正奕" },
        { department: "智能工程部", gender: "", name: "柯锡芬" },
        // 综合办公室
        { department: "综合办公室", gender: "", name: "吴俊尉" },
        { department: "综合办公室", gender: "", name: "闻佳颖" },
        { department: "综合办公室", gender: "", name: "丁寅" },
        { department: "综合办公室", gender: "", name: "叶琦" },
        { department: "综合办公室", gender: "", name: "邬佳昱" },
        { department: "综合办公室", gender: "", name: "徐睿" },
        { department: "综合办公室", gender: "", name: "朱俊帆" },
        { department: "综合办公室", gender: "", name: "王凝韵" },
        { department: "综合办公室", gender: "", name: "洪佳雷" }
    ];

    // Extract unique departments and genders
    const departments = [...new Set(pickerPeople.map(p => p.department))];
    const genders = [...new Set(pickerPeople.map(p => p.gender).filter(g => g !== ''))];

    // Check if we have gender data for all people
    const hasGenderData = pickerPeople.every(p => p.gender !== '');

    // DOM elements
    const deptFilter = document.getElementById('pickerDeptFilter');
    const genderFilter = document.getElementById('pickerGenderFilter');
    const genderFilterGroup = genderFilter?.closest('.filter-group');
    const startBtn = document.getElementById('pickerStartBtn');
    const resultPanel = document.getElementById('pickerResultPanel');
    const resultContent = document.getElementById('pickerResultContent');
    const messageArea = document.getElementById('pickerMessageArea');

    const reelDept = document.getElementById('pickerReelDept');
    const reelGender = document.getElementById('pickerReelGender');
    const reelGenderWrapper = reelGender?.closest('.reel-wrapper');
    const reelName = document.getElementById('pickerReelName');
    const reelDeptContent = document.getElementById('pickerReelDeptContent');
    const reelGenderContent = document.getElementById('pickerReelGenderContent');
    const reelNameContent = document.getElementById('pickerReelNameContent');

    // Configuration
    const REEL_ITEM_HEIGHT = 60;
    const SPIN_DURATION = 2000;
    const STOP_DELAY = 500;

    // State
    let isSpinning = false;
    let selectedPerson = null;

    // Hide gender-related UI elements if no gender data
    function hideGenderUI() {
        if (!hasGenderData) {
            if (genderFilterGroup) genderFilterGroup.style.display = 'none';
            if (reelGenderWrapper) reelGenderWrapper.style.display = 'none';
        }
    }

    // Initialize filters
    function initFilters() {
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            deptFilter.appendChild(option);
        });

        // Only add gender options if we have gender data
        if (hasGenderData) {
            genders.forEach(gender => {
                const option = document.createElement('option');
                option.value = gender;
                option.textContent = gender;
                genderFilter.appendChild(option);
            });
        }
    }

    // Get eligible people based on filters
    function getEligiblePeople() {
        const selectedDept = deptFilter.value;
        const selectedGender = genderFilter.value;

        return pickerPeople.filter(person => {
            if (selectedDept && person.department !== selectedDept) return false;
            if (selectedGender && person.gender !== selectedGender) return false;
            return true;
        });
    }

    // Random selection
    function randomSelectPerson(eligiblePeople) {
        if (eligiblePeople.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * eligiblePeople.length);
        return eligiblePeople[randomIndex];
    }

    // Generate reel items
    function generateReelItems(items, targetValue, reelContent) {
        reelContent.innerHTML = '';

        const repeatCount = 10;
        const allItems = [];

        for (let i = 0; i < repeatCount; i++) {
            items.forEach(item => allItems.push(item));
        }

        // Shuffle
        for (let i = allItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
        }

        // Place target value
        const targetIndex = allItems.length - 2;
        allItems[targetIndex] = targetValue;

        // Create DOM elements
        allItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'reel-item';
            div.textContent = item;
            reelContent.appendChild(div);
        });

        return targetIndex;
    }

    // Show locked reel
    function showLockedReel(value, reelContent) {
        reelContent.innerHTML = '';

        for (let i = 0; i < 3; i++) {
            const div = document.createElement('div');
            div.className = 'reel-item';
            div.textContent = i === 1 ? value : '';
            reelContent.appendChild(div);
        }

        // 中间项目在索引1，translateY = -60px 让它居中
        reelContent.style.transform = `translateY(-60px) rotateX(0deg)`;
    }

    // Animate reel
    function animateReel(reelContent, targetIndex, duration, isLocked = false) {
        return new Promise(resolve => {
            if (isLocked) {
                resolve();
                return;
            }

            const startTime = Date.now();

            // 计算最终的 translateY 位置（停止时 rotateX = 0）
            const finalTranslateY = -((targetIndex - 1) * REEL_ITEM_HEIGHT);

            // 旋转参数
            const rotationsCount = 5; // 旋转圈数
            const totalRotationDegrees = 360 * rotationsCount; // 总旋转角度

            function animate() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3);

                let currentRotation, currentTranslateY;

                if (progress < 0.8) {
                    // 快速旋转阶段（80% 时间）
                    // 同时旋转和移动
                    currentRotation = easeOut * totalRotationDegrees;
                    currentTranslateY = easeOut * finalTranslateY;
                } else {
                    // 减速阶段（20% 时间）- 渐渐停止旋转，回到 0 度
                    const slowProgress = (progress - 0.8) / 0.2;
                    const slowEase = 1 - Math.pow(1 - slowProgress, 2);

                    // 旋转从当前角度渐渐回到 0（360的倍数）
                    const rotationAtSlowStart = easeOut * totalRotationDegrees;
                    const remainingRotation = totalRotationDegrees - rotationAtSlowStart;
                    currentRotation = rotationAtSlowStart + slowEase * remainingRotation;

                    // 位置继续移动到最终位置
                    currentTranslateY = finalTranslateY;
                }

                // 应用 3D 变换 - 旋转 + 位移
                reelContent.style.transform =
                    `translateY(${currentTranslateY}px) rotateX(${currentRotation}deg)`;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // 最终状态：rotateX = 0（或360的倍数），translateY = 最终位置
                    reelContent.style.transform =
                        `translateY(${finalTranslateY}px) rotateX(${totalRotationDegrees}deg)`;

                    // 立即重置为等效的 0 度（消除任何残留的扭曲）
                    setTimeout(() => {
                        reelContent.style.transition = 'none';
                        reelContent.style.transform =
                            `translateY(${finalTranslateY}px) rotateX(0deg)`;
                        // 恢复过渡效果（下次动画需要）
                        setTimeout(() => {
                            reelContent.style.transition = 'transform 0.1s linear';
                        }, 10);
                    }, 10);

                    resolve();
                }
            }

            requestAnimationFrame(animate);
        });
    }

    // Show message
    function showMessage(message, type = 'error') {
        messageArea.textContent = message;
        messageArea.className = `message-area visible ${type}`;

        setTimeout(() => {
            messageArea.className = 'message-area';
        }, 3000);
    }

    // Hide message
    function hideMessage() {
        messageArea.className = 'message-area';
    }

    // Update result
    function updateResult(person) {
        if (person) {
            // Only show gender if we have gender data
            if (hasGenderData && person.gender) {
                resultContent.textContent = `${person.department} / ${person.gender} / ${person.name}`;
            } else {
                resultContent.textContent = `${person.department} / ${person.name}`;
            }
            resultContent.className = 'result-content';
            resultPanel.className = 'result-panel success';
        } else {
            resultContent.textContent = '等待抽取...';
            resultContent.className = 'result-content empty';
            resultPanel.className = 'result-panel';
        }
    }

    // Set controls disabled
    function setControlsDisabled(disabled) {
        startBtn.disabled = disabled;
        deptFilter.disabled = disabled;
        if (hasGenderData && genderFilter) {
            genderFilter.disabled = disabled;
        }

        if (disabled) {
            document.getElementById('pickerContainer').classList.add('spinning');
        } else {
            document.getElementById('pickerContainer').classList.remove('spinning');
        }
    }

    // Main spin logic
    async function startSpin() {
        if (isSpinning) return;

        hideMessage();

        const eligiblePeople = getEligiblePeople();

        if (eligiblePeople.length === 0) {
            showMessage('当前筛选条件下没有可抽取的人员', 'error');
            return;
        }

        selectedPerson = randomSelectPerson(eligiblePeople);

        isSpinning = true;
        setControlsDisabled(true);
        updateResult(null);

        const isDeptLocked = deptFilter.value !== '';
        const isGenderLocked = hasGenderData && genderFilter && genderFilter.value !== '';

        const deptList = isDeptLocked ? [selectedPerson.department] : departments;
        const genderList = isGenderLocked ? [selectedPerson.gender] : genders;
        const nameList = eligiblePeople.map(p => p.name);

        reelDept.classList.toggle('locked', isDeptLocked);
        if (hasGenderData && reelGender) {
            reelGender.classList.toggle('locked', isGenderLocked);
        }

        let deptTargetIndex, genderTargetIndex, nameTargetIndex;

        if (isDeptLocked) {
            showLockedReel(selectedPerson.department, reelDeptContent);
        } else {
            deptTargetIndex = generateReelItems(deptList, selectedPerson.department, reelDeptContent);
        }

        // Only handle gender reel if we have gender data
        if (hasGenderData && reelGenderContent) {
            if (isGenderLocked) {
                showLockedReel(selectedPerson.gender, reelGenderContent);
            } else {
                genderTargetIndex = generateReelItems(genderList, selectedPerson.gender, reelGenderContent);
            }
        }

        nameTargetIndex = generateReelItems(nameList, selectedPerson.name, reelNameContent);

        const animations = [];

        animations.push(
            animateReel(reelDeptContent, deptTargetIndex, SPIN_DURATION, isDeptLocked)
        );

        // Only animate gender reel if we have gender data
        if (hasGenderData && reelGenderContent) {
            animations.push(
                new Promise(resolve => {
                    setTimeout(async () => {
                        await animateReel(reelGenderContent, genderTargetIndex, SPIN_DURATION, isGenderLocked);
                        resolve();
                    }, STOP_DELAY);
                })
            );
        }

        // Delay for name reel depends on whether gender reel exists
        const nameDelay = hasGenderData ? STOP_DELAY * 2 : STOP_DELAY;
        animations.push(
            new Promise(resolve => {
                setTimeout(async () => {
                    await animateReel(reelNameContent, nameTargetIndex, SPIN_DURATION, false);
                    resolve();
                }, nameDelay);
            })
        );

        await Promise.all(animations);

        updateResult(selectedPerson);

        isSpinning = false;
        setControlsDisabled(false);
    }

    // Initialize reels
    function initReels() {
        reelDeptContent.innerHTML = '';
        ['', departments[0] || '-', ''].forEach((item, i) => {
            const div = document.createElement('div');
            div.className = 'reel-item';
            div.textContent = i === 1 ? item : '';
            reelDeptContent.appendChild(div);
        });
        // 初始状态：中间项目（索引1）居中显示
        reelDeptContent.style.transform = 'translateY(-60px) rotateX(0deg)';

        // Only initialize gender reel if we have gender data
        if (hasGenderData && reelGenderContent) {
            reelGenderContent.innerHTML = '';
            ['', genders[0] || '-', ''].forEach((item, i) => {
                const div = document.createElement('div');
                div.className = 'reel-item';
                div.textContent = i === 1 ? item : '';
                reelGenderContent.appendChild(div);
            });
            reelGenderContent.style.transform = 'translateY(-60px) rotateX(0deg)';
        }

        reelNameContent.innerHTML = '';
        ['', pickerPeople[0]?.name || '-', ''].forEach((item, i) => {
            const div = document.createElement('div');
            div.className = 'reel-item';
            div.textContent = i === 1 ? item : '';
            reelNameContent.appendChild(div);
        });
        reelNameContent.style.transform = 'translateY(-60px) rotateX(0deg)';
    }

    // Event binding
    startBtn.addEventListener('click', startSpin);

    // Initialize
    hideGenderUI();  // Hide gender UI if no gender data
    initFilters();
    initReels();
})();
