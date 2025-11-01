document.addEventListener('DOMContentLoaded', () => {
    const mainMenu = document.getElementById('mainMenu').querySelector('ul');
    const jwtToken = localStorage.getItem('jwtToken');

    if (jwtToken) {
        mainMenu.innerHTML = `
            <li><a href="/main_page.html" id="logoutBtn">Вийти з аккаунту</a></li>
            <li><a href="/my_playlists.html">Мої плейлісти</a></li>
        `;

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                localStorage.removeItem('jwtToken');
                window.location.href = '/login_page.html';
            });
        }
    } else {
        mainMenu.innerHTML = `
            <li><a href="/registration_page.html">Реєстрація</a></li>
            <li><a href="/login_page.html">Авторизація</a></li>
        `;
    }

    // Отримання випадкових альбомів
    fetch('https://webproject-latest.onrender.com/api/Album/10random-album')
        .then(response => response.json())
        .then(albums => {
            renderRandomAlbums(albums);
        })
        .catch(error => console.error('Помилка завантаження випадкових альбомів:', error));

    // Отримання випадкових артистів
    fetch('https://webproject-latest.onrender.com/api/Artist/5random-artists')
        .then(response => response.json())
        .then(artists => {
            console.log("Отримані артисти перед рендерингом:", artists);
            renderArtists(artists);
        })
        .catch(error => console.error('Помилка завантаження випадкових артистів:', error));

    // Отримання випадкових треків
    fetch('https://webproject-latest.onrender.com/api/Music/10random-music')
        .then(response => response.json())
        .then(tracks => {
            console.log("Отримані треки перед рендерингом:", tracks);
            renderRandomTracks(tracks);
        })
        .catch(error => console.error('Помилка завантаження випадкових треків:', error));

    // Завантаження UI елементів (логотипу)
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            renderLogo(data.ui);
            initializeConditionalScroll();
        })
        .catch(error => console.error('Помилка завантаження даних UI:', error));
});

function findUIElement(uiElements, id) {
    return uiElements.find(element => element.id === id);
}

function renderLogo(uiElements) {
    const logoData = findUIElement(uiElements, 'logo_and_title');
    const logoImg = document.querySelector('.logo');
    if (logoData && logoImg) {
        logoImg.src = logoData.src;
        logoImg.alt = logoData.description;
    }
}

function renderRandomTracks(tracks) {
    const tracksContainer = document.getElementById('random-tracks');
    tracksContainer.innerHTML = '';

    tracks.forEach(track => {
        const trackItem = document.createElement('div');
        trackItem.classList.add('track-item');
        trackItem.dataset.albumId = track.Album?.Id || '';
        trackItem.dataset.trackId = track.Id;

        // Використання API для завантаження обкладинки треку
        const coverUrl = `http://webproject-latest.onrender.com/api/music/cover/${track.Id}`;

        trackItem.innerHTML = `
            <div class="track-cover-container">
                <img src="${coverUrl}" alt="${track.Title}" class="track-cover">
            </div>
            <div class="track-info">
                <h3 class="track-title">${track.Title}</h3>
                <p class="track-artist-album">${track.Artist?.Name || 'Невідомо'} - ${track.Album?.Title || ''}</p>
            </div>
        `;
        tracksContainer.appendChild(trackItem);


        trackItem.addEventListener('click', function(event) {
            if (event.target.tagName !== 'AUDIO' && event.target.parentNode.tagName !== 'AUDIO') {
                const albumId = this.dataset.albumId;
                const trackId = this.dataset.trackId;
                window.location.href = `album_page.html?albumId=${albumId}&trackId=${trackId}`;
            }
        });
    });
}

function renderArtists(artists) {
    const artistsContainer = document.getElementById('artists');
    artistsContainer.innerHTML = '';
    artists.forEach(artist => {
        const artistItem = document.createElement('div');
        artistItem.classList.add('artist-item');
        artistItem.dataset.artistId = artist.Id;

        // URL до аватарки через API
        const avatarUrl = `http://webproject-latest.onrender.com/api/artist/avatar/${artist.Id}`;

        artistItem.innerHTML = `
            <div class="artist-avatar-container">
                <img src="${avatarUrl}" alt="${artist.Name}" class="artist-avatar">
            </div>
            <div class="artist-name">${artist.Name}</div>
        `;
        artistsContainer.appendChild(artistItem);

        artistItem.addEventListener('click', function() {
            const artistId = this.dataset.artistId;
            window.location.href = `index.html?artistId=${artistId}`;
        });
    });
}

function renderRandomAlbums(albums) {
    const albumsContainer = document.getElementById('random-albums');
    albumsContainer.innerHTML = '';

    albums.forEach(album => {
        const albumItem = document.createElement('div');
        albumItem.classList.add('album-item');
        albumItem.dataset.albumId = album.Id;

        // URL до обкладинки альбому через API
        const coverUrl = `http://webproject-latest.onrender.com/api/album/AlbumCover/${album.Id}`;

        albumItem.innerHTML = `
            <div class="album-cover-container">
                <img src="${coverUrl}" alt="${album.Title}" class="album-cover">
            </div>
            <div class="album-info">
                <h3 class="album-title">${album.Title}</h3>
                <p class="album-artist">${album.Artist?.Name || 'Невідомо'}</p>
            </div>
        `;
        albumsContainer.appendChild(albumItem);

        albumItem.addEventListener('click', function() {
            const albumId = this.dataset.albumId;
            window.location.href = `album_page.html?albumId=${albumId}`;
        });
    });
}

function renderRollItems(container, items, templateCallback) {
    container.innerHTML = items.map(templateCallback).join('');
}

function scrollHorizontallySmooth(element, targetScrollLeft, duration) {
    const startScrollLeft = element.scrollLeft;
    const startTime = performance.now();

    const animate = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(1, elapsedTime / duration);
        const easedProgress = progress;

        element.scrollLeft = startScrollLeft + (targetScrollLeft - startScrollLeft) * easedProgress;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
}

function initializeConditionalScroll() {
    const horizontalRollContainers = document.querySelectorAll('.horizontal-roll-container');

    horizontalRollContainers.forEach(container => {
        const rollContainer = container.querySelector('.roll-container');
        const scrollLeftButton = container.querySelector('.scroll-left');
        const scrollRightButton = container.querySelector('.scroll-right');

        if (rollContainer && scrollLeftButton && scrollRightButton) {
            const scrollAmount = rollContainer.offsetWidth * 0.5;
            const scrollDuration = 500;

            scrollLeftButton.addEventListener('click', () => {
                const target = Math.max(0, rollContainer.scrollLeft - scrollAmount);
                scrollHorizontallySmooth(rollContainer, target, scrollDuration);
            });


            scrollRightButton.addEventListener('click', () => {
                const target = Math.min(rollContainer.scrollWidth - rollContainer.offsetWidth, rollContainer.scrollLeft + scrollAmount);
                scrollHorizontallySmooth(rollContainer, target, scrollDuration);
            });

            const checkScrollVisibility = () => {
                if (rollContainer.scrollWidth > rollContainer.offsetWidth) {
                    scrollLeftButton.style.display = 'block';
                    scrollRightButton.style.display = 'block';
                } else {
                    scrollLeftButton.style.display = 'none';
                    scrollRightButton.style.display = 'none';
                }
            };


            checkScrollVisibility();
            window.addEventListener('resize', checkScrollVisibility);
            setTimeout(checkScrollVisibility, 500);
        }
    });
}
