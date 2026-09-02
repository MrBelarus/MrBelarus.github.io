const projectsList = [
    "guns-factory",
	"bucket-hero",
    "soccer-strike",
    "town-takeover",
    "hex-city-defense",
    "pin-bullet",
    "pals-io",
    "wild-west-idle",
    "survival-race",
    "royal-wars",
    "lasers-td",
    "wild-arena-pvp",
];

const petProjectsList = [
    "pet-wheel-balance",
    "pet-snail-io",
    "pet-pixel-madness",
    "pet-forever-fall"
];

const projectsGrid = document.getElementById('projectsGrid');
const petProjectsGrid = document.getElementById('petProjectsGrid');

const modal = document.getElementById('projectModal');
const closeBtn = document.querySelector('.modal-close');

const modalTitle = document.getElementById('modalTitle');
const modalScreenshots = document.getElementById('modalScreenshots');
const modalVideoWrapper = document.getElementById('modalVideoWrapper');
const modalDescription = document.getElementById('modalDescription');
const embeddedWrapper = document.getElementById('embeddedWrapper');

const imageModal = document.getElementById('imageModal');
const previewImage = document.getElementById('previewImage');

const prevBtn = imageModal.querySelector('.prev-btn');
const nextBtn = imageModal.querySelector('.next-btn');

let currentGalleryImages = [];
let currentImgIndex = 0;

const loadedProjectsData = {};

/* Markdown It plugin support */
const md = new markdownit({
    html: true,   
    linkify: true, 
    breaks: true   
});

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrSet('target', '_blank');
  tokens[idx].attrSet('rel', 'noopener noreferrer');
  
  return self.renderToken(tokens, idx, options, env, self);
};

async function initProjects() {
    if (projectsGrid) {
        await renderProjects(projectsList, projectsGrid);
    }

    if (petProjectsGrid) {
        await renderProjects(petProjectsList, petProjectsGrid);
    }

    initModalEvents();
}

async function renderProjects(list, gridContainer) {
    for (const folder of list) {
        const projectPath = `projects/${folder}`;
        
        try {
            const response = await fetch(`${projectPath}/info.json`);
            if (!response.ok) throw new Error(`Не удалось загрузить info.json для ${folder}`);
            
            const info = await response.json();
            const tagsHtml = (info.tags || []).map(tag => `<span class="project-tag">${tag}</span>`).join('');
            
            loadedProjectsData[folder] = info;

            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <h3>${info.cardTitle}</h3>
                <div class="project-image-wrapper">
                    <img src="${projectPath}/icon.jpg" class="project-image-click" data-folder="${folder}" alt="${info.cardTitle}" onerror="this.src='https://placeholder.com'">
                </div>
                
                <div class="project-tags-list">
                    ${tagsHtml}
                </div>
                <p>${info.cardShortDesc}</p>
                <button class="project-btn-open" data-folder="${folder}">Learn more</button>
            `;
            
            gridContainer.appendChild(card);

        } catch (error) {
            console.error(`Init ${folder} error:`, error);
        }
    }
}

function initModalEvents() {
    const openButtons = document.querySelectorAll('.project-btn-open');
    
    openButtons.forEach(button => {
        button.replaceWith(button.cloneNode(true));
    });

    document.querySelectorAll('.project-btn-open').forEach(button => {
        button.addEventListener('click', async () => {
            const folderName = button.getAttribute('data-folder');
            const info = loadedProjectsData[folderName];
            const projectPath = `projects/${folderName}`;

            if (!info) return;

            modalTitle.textContent = info.title;
            modalDescription.innerHTML = 'loading...';
            modalDescription.classList.add('md-content');
        
            try {
                const mdResponse = await fetch(`${projectPath}/description.md`);
                if (!mdResponse.ok) throw new Error('description.md not found');
                
                const markdownText = await mdResponse.text();
                modalDescription.innerHTML = md.render(markdownText);
            } catch (error) {
                console.error(`Can't load description.md for ${folderName}:`, error);
                modalDescription.innerHTML = md.render(info.cardShortDesc || 'Описание отсутствует.');
            }

            modalScreenshots.innerHTML = '';
            for (let i = 1; i <= 3; i++) {
                const img = document.createElement('img');
                img.src = `${projectPath}/screen${i}.jpg`;
                img.alt = `Скриншот ${i}`;
                img.className = 'previewable';
                img.onerror = () => img.style.display = 'none';
                modalScreenshots.appendChild(img);
            }

            modalVideoWrapper.innerHTML = '';
            
            const videoType = info.video ? info.video.trim() : 'none';

            if (videoType !== 'none') {
                const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                const match = videoType.match(ytRegExp);
                const isYouTube = match && match[2].length === 11;

                if (isYouTube) {
                    const videoId = match[2];
                    
                    modalVideoWrapper.innerHTML = `
                        <div class="youtube-responsive-wrapper">
                            <iframe 
                                src="https://youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&rel=0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                frameborder="0" 
                                allowfullscreen>
                            </iframe>
                        </div>
                    `;
                } else if (videoType === 'local') {
                    modalVideoWrapper.innerHTML = `
                        <video class="video-blur" muted playsinline preload="none">
                            <source src="${projectPath}/video.mp4" type="video/mp4">
                        </video>
                        <video class="video-main" controls autoplay preload="auto">
                            <source src="${projectPath}/video.mp4" type="video/mp4">
                        </video>
                    `;

                    const mainVid = modalVideoWrapper.querySelector('.video-main');
                    const blurVid = modalVideoWrapper.querySelector('.video-blur');

                    if (mainVid && blurVid) {
                        mainVid.addEventListener('play', () => blurVid.play());
                        mainVid.addEventListener('pause', () => blurVid.pause());
                        mainVid.addEventListener('seeking', () => blurVid.currentTime = mainVid.currentTime);
                        mainVid.volume = 0.25;
                    }
                }
            }

            embeddedWrapper.innerHTML = '';

            if (info.hasEmbed === true) {
                const startBtn = document.createElement('button');
                startBtn.className = 'project-btn-embed';
                startBtn.innerHTML = 'Run';
                
                startBtn.addEventListener('click', async () => {
                    embeddedWrapper.innerHTML = '<div style="text-align:center; padding:20px; color:#aaa;">Loading game...</div>';
                    
                    try {
                        const embedPath = `${projectPath}/embed.html`;
                        const response = await fetch(embedPath);
                        
                        if (!response.ok) throw new Error(`Embed get error ${embedPath}`);
                        
                        const embedHtmlText = await response.text();
                        
                        embeddedWrapper.innerHTML = `
                            <div class="embed-responsive-wrapper">
                                ${embedHtmlText}
                            </div>
                        `;
                    } catch (err) {
                        console.error(`Embed load error:`, err);
                        embeddedWrapper.innerHTML = `<p style="text-align:center; color:#fa5c5c;">Couldn't load the embed :(</p>`;
                    }
                });
                
                embeddedWrapper.appendChild(startBtn);
            }

            modal.classList.add('active');
            modelOpenHistoryPush();
        });
    });
}

function closeModal() {
    modal.classList.remove('active');
    modalVideoWrapper.innerHTML = '';
    modalDescription.innerHTML = '';
    embeddedWrapper.innerHTML = '';
    checkScrollLock();
}

closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// previewable open modal
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('previewable')) {
        const container = e.target.closest('.modal-screenshots') || e.target.closest('.project-image-wrapper');
        
        if (container) {
            currentGalleryImages = Array.from(container.querySelectorAll('.previewable'));
            currentImgIndex = currentGalleryImages.indexOf(e.target);
        } else {
            currentGalleryImages = [e.target];
            currentImgIndex = 0;
        }

        updateGalleryImage();
        imageModal.classList.add('active'); 
        modalOpenHistoryPush(); 
    }
});

document.addEventListener('keydown', (e) => {
    if (imageModal.classList.contains('active')) {
        if (e.key === 'ArrowRight' && currentImgIndex < currentGalleryImages.length - 1) {
            currentImgIndex++;
            updateGalleryImage();
        } else if (e.key === 'ArrowLeft' && currentImgIndex > 0) {
            currentImgIndex--;
            updateGalleryImage();
        }
    }
});

nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentImgIndex < currentGalleryImages.length - 1) {
        currentImgIndex++;
        updateGalleryImage();
    }
});

prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentImgIndex > 0) {
        currentImgIndex--;
        updateGalleryImage();
    }
});

function updateGalleryImage() {
    const targetImg = currentGalleryImages[currentImgIndex];
    previewImage.src = targetImg.src;

    if (currentImgIndex === 0) {
        prevBtn.style.opacity = '0';
        prevBtn.style.pointerEvents = 'none';
    } else {
        prevBtn.style.opacity = '1';
        prevBtn.style.pointerEvents = 'all';
    }

    if (currentImgIndex === currentGalleryImages.length - 1) {
        nextBtn.style.opacity = '0';
        nextBtn.style.pointerEvents = 'none';
    } else {
        nextBtn.style.opacity = '1';
        nextBtn.style.pointerEvents = 'all';
    }
}

const imageModalClose = imageModal.querySelector('.modal-close');
function closeImageModal() {
    imageModal.classList.remove('active');
    previewImage.src = ''; 
    checkScrollLock();
}

imageModalClose.addEventListener('click', closeImageModal);
imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) closeImageModal();
});

// exit events
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeImageModal();
    }
});

function checkScrollLock() {
    if (modal.classList.contains('active') || imageModal.classList.contains('active')) {
        document.body.classList.add('no-scroll');
    } else {
        document.body.classList.remove('no-scroll');
    }
}

function modelOpenHistoryPush() {
    history.pushState({ modalOpen: true }, '', '#modal');
    checkScrollLock();
}

function handlePageFocus(isFocused) {
    const mainVid = modalVideoWrapper.querySelector('.video-main');
    
    if (mainVid) {
        if (isFocused) {
            mainVid.muted = false;
        } else {
            mainVid.muted = true;
        }
    }
}

document.addEventListener('visibilitychange', () => {
    handlePageFocus(!document.hidden);
});

window.addEventListener('blur', () => handlePageFocus(false));
window.addEventListener('focus', () => handlePageFocus(true));

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('project-image-click')) {
        const folder = e.target.getAttribute('data-folder');
        const matchingButton = document.querySelector(`.project-btn-open[data-folder="${folder}"]`);
        
        if (matchingButton) {
            matchingButton.click();
        }
    }
});

initProjects();
