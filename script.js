const projectsList = [
    "pet-wheel-balance",
    "pet-hook-stars",
];

const projectsGrid = document.getElementById('projectsGrid');
const modal = document.getElementById('projectModal');
const closeBtn = document.querySelector('.modal-close');

const modalTitle = document.getElementById('modalTitle');
const modalScreenshots = document.getElementById('modalScreenshots');
const modalVideoWrapper = document.getElementById('modalVideoWrapper');
const modalDescription = document.getElementById('modalDescription');

const imageModal = document.getElementById('imageModal');
const previewImage = document.getElementById('previewImage');

const prevBtn = imageModal.querySelector('.prev-btn');
const nextBtn = imageModal.querySelector('.next-btn');

let currentGalleryImages = [];
let currentImgIndex = 0;

const loadedProjectsData = {};

async function initProjects() {
    for (const folder of projectsList) {
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
                    <img src="${projectPath}/icon.png" class="project-image-click" data-folder="${folder}" alt="${info.cardTitle}" onerror="this.src='https://placeholder.com'">
                </div>
                
                <div class="project-tags-list">
                    ${tagsHtml}
                </div>
                <p>${info.cardShortDesc}</p>
                <button class="project-btn-open" data-folder="${folder}">Подробнее</button>
            `;
            
            projectsGrid.appendChild(card);

        } catch (error) {
            console.error(`Ошибка инициализации проекта ${folder}:`, error);
        }
    }

    initModalEvents();
}

function initModalEvents() {
    const openButtons = document.querySelectorAll('.project-btn-open');
    
    openButtons.forEach(button => {
        button.addEventListener('click', () => {
            const folderName = button.getAttribute('data-folder');
            const info = loadedProjectsData[folderName];
            const projectPath = `projects/${folderName}`;

            if (!info) return;

            modalTitle.textContent = info.title;
            modalDescription.textContent = info.description;

            modalScreenshots.innerHTML = '';
            for (let i = 1; i <= 3; i++) {
                const img = document.createElement('img');
                img.src = `${projectPath}/screen${i}.png`;
                img.alt = `Скриншот ${i}`;
                img.className = 'previewable';
                img.onerror = () => img.style.display = 'none';
                modalScreenshots.appendChild(img);
            }

            modalVideoWrapper.innerHTML = `
                <!-- blurred -->
                <video class="video-blur" muted playsinline preload="none">
                    <source src="${projectPath}/video.mp4" type="video/mp4">
                </video>
                
                <!-- main -->
                <video class="video-main" controls autoplay preload="auto">
                    <source src="${projectPath}/video.mp4" type="video/mp4">
                </video>
            `;

            const mainVid = modalVideoWrapper.querySelector('.video-main');
            const blurVid = modalVideoWrapper.querySelector('.video-blur');

            mainVid.addEventListener('play', () => blurVid.play());
            mainVid.addEventListener('pause', () => blurVid.pause());
            mainVid.addEventListener('seeking', () => blurVid.currentTime = mainVid.currentTime);

            mainVid.volume = 0.25;

            modal.classList.add('active');
            modelOpenHistoryPush();
        });
    });
}

function closeModal() {
    modal.classList.remove('active');
    modalVideoWrapper.innerHTML = '';
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

projectsGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('project-image-click')) {
        const folder = e.target.getAttribute('data-folder');
        const matchingButton = projectsGrid.querySelector(`.project-btn-open[data-folder="${folder}"]`);
        
        if (matchingButton) {
            matchingButton.click();
        }
    }
});

initProjects();
