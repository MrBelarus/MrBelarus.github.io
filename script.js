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

const loadedProjectsData = {};

async function initProjects() {
    for (const folder of projectsList) {
        const projectPath = `projects/${folder}`;
        
        try {
            const response = await fetch(`${projectPath}/info.json`);
            if (!response.ok) throw new Error(`Не удалось загрузить info.json для ${folder}`);
            
            const info = await response.json();
            
            loadedProjectsData[folder] = info;

            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <h3>${info.cardTitle}</h3>
                <div class="project-image-wrapper">
                    <img src="${projectPath}/icon.png" alt="${info.cardTitle}" onerror="this.src='https://placeholder.com'">
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
                <video controls width="100%" preload="metadata">
                    <source src="${projectPath}/video.mp4" type="video/mp4">
                    Ваш браузер не поддерживает видео.
                </video>
            `;

            modal.classList.add('active');
        });
    });
}

function closeModal() {
    modal.classList.remove('active');
    modalVideoWrapper.innerHTML = ''; 
}

closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});


document.addEventListener('click', (e) => {
    if (e.target.classList.contains('previewable')) {
        previewImage.src = e.target.src;
        imageModal.classList.add('active');
    }
});

const imageModalClose = imageModal.querySelector('.modal-close');
function closeImageModal() {
    imageModal.classList.remove('active');
    previewImage.src = ''; 
}

imageModalClose.addEventListener('click', closeImageModal);
imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) closeImageModal();
});

initProjects();
