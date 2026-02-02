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
            <div class="decorative">${data.emoji || '🎭'}</div>
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
                            <h3>推荐道具</h3>
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
            emoji: '🎭'
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

async function selectAssetsFolder() {
    try {
        // Check if File System Access API is supported
        if (!window.showDirectoryPicker) {
            alert('您的浏览器不支持文件系统访问API。请使用最新版本的Chrome或Edge。');
            return;
        }

        // Request directory access
        assetsDirectoryHandle = await window.showDirectoryPicker({
            mode: 'read'
        });

        console.log('📁 Folder selected:', assetsDirectoryHandle.name);

        // Scan for rounds
        await scanRoundsFolder();

        // Load background image
        await loadBackground(assetsDirectoryHandle);

        // Hide instruction overlay
        document.getElementById('instructionOverlay').classList.add('hidden');

        // Initialize presentation
        initializePresentation();

    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('❌ Error selecting folder:', error);
            alert('无法访问文件夹。请确保您已授予权限。');
        }
    }
}

async function scanRoundsFolder() {
    try {
        roundSlides = [];

        // Look for "rounds" directory
        let roundsDir = null;
        for await (const entry of assetsDirectoryHandle.values()) {
            if (entry.kind === 'directory' && entry.name.toLowerCase() === 'rounds') {
                roundsDir = entry;
                break;
            }
        }

        if (!roundsDir) {
            console.warn('⚠️ No "rounds" folder found');
            return;
        }

        // Scan each round subdirectory
        const roundFolders = [];
        for await (const entry of roundsDir.values()) {
            if (entry.kind === 'directory') {
                roundFolders.push(entry);
            }
        }

        // Sort folders alphabetically
        roundFolders.sort((a, b) => a.name.localeCompare(b.name));

        // Load data for each round
        for (const roundFolder of roundFolders) {
            const roundData = await loadRoundData(roundFolder);
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

async function loadRoundData(roundFolderHandle) {
    try {
        let infoData = {};
        let originalVideoUrl = null;
        let dubbingVideoUrl = null;
        let posterUrl = null;

        // Read files in round folder
        for await (const entry of roundFolderHandle.values()) {
            if (entry.kind === 'file') {
                const file = await entry.getFile();

                // Parse info.json
                if (entry.name.toLowerCase() === 'info.json') {
                    const text = await file.text();
                    infoData = JSON.parse(text);
                }

                // Load original video (with vocals)
                if (entry.name.toLowerCase() === 'original.mp4') {
                    originalVideoUrl = URL.createObjectURL(file);
                }

                // Load dubbing video (vocal-removed)
                if (entry.name.toLowerCase() === 'dubbing.mp4') {
                    dubbingVideoUrl = URL.createObjectURL(file);
                }

                // Load poster
                if (entry.name.toLowerCase().endsWith('.jpg') ||
                    entry.name.toLowerCase().endsWith('.jpeg') ||
                    entry.name.toLowerCase().endsWith('.png')) {
                    posterUrl = URL.createObjectURL(file);
                }
            }
        }

        // Construct round data
        return {
            title: infoData.title || roundFolderHandle.name,
            players: infoData.players || 'N/A',
            difficulty: infoData.difficulty || 'Medium',
            extraInfo: infoData.extraInfo || null,
            props: infoData.props || [],
            radar: infoData.radar || {
                emotion: 3,
                speed: 3,
                accuracy: 3,
                interaction: 3,
                action: 3,
                creativity: 3
            },
            originalVideoUrl,
            dubbingVideoUrl,
            posterUrl
        };

    } catch (error) {
        console.error(`❌ Error loading round data for ${roundFolderHandle.name}:`, error);
        return null;
    }
}

async function loadBackground(directoryHandle) {
    try {
        let bgFileHandle = null;

        // 1. Check root directory for background.jpg/png/etc
        for await (const entry of directoryHandle.values()) {
            if (entry.kind === 'file' && entry.name.match(/^background\.(jpg|jpeg|png|webp)$/i)) {
                bgFileHandle = entry;
                break;
            }
        }

        // 2. If not in root, check assets/ folder if it exists
        if (!bgFileHandle) {
            // We need to see if there is an assets folder
            try {
                const assetsDir = await directoryHandle.getDirectoryHandle('assets');
                for await (const entry of assetsDir.values()) {
                    if (entry.kind === 'file' && entry.name.match(/^background\.(jpg|jpeg|png|webp)$/i)) {
                        bgFileHandle = entry;
                        break;
                    }
                }
            } catch (e) {
                // assets folder might not exist, ignore
            }
        }

        if (bgFileHandle) {
            const file = await bgFileHandle.getFile();
            const url = URL.createObjectURL(file);
            console.log(`✅ Loaded background: ${bgFileHandle.name}`);

            // Update CSS variable
            // note: the CSS uses: url('...') no-repeat center center fixed
            document.documentElement.style.setProperty('--bg-gradient', `url('${url}') no-repeat center center fixed`);

            // Also ensure the element has background-size: cover if not already guaranteed by shorthand or class
            const bgEl = document.querySelector('.background');
            if (bgEl) {
                bgEl.style.backgroundSize = 'cover';
            }
        }
    } catch (error) {
        console.warn('⚠️ Failed to load background image:', error);
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

// ==========================================
// FULLSCREEN
// ==========================================

function toggleFullscreen() {
    const container = document.querySelector('.presentation-container');

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
    document.getElementById('selectFolderBtn').addEventListener('click', selectAssetsFolder);

    // Navigation buttons
    document.getElementById('prevBtn').addEventListener('click', prevSlide);
    document.getElementById('nextBtn').addEventListener('click', nextSlide);
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowRight':
            case ' ':
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
});
