document.addEventListener('DOMContentLoaded', () => {
    const tracklistContainer = document.getElementById('tracklist-container');
    const albumsContainer = document.getElementById('albums-container');
    const artistBannerImage = document.getElementById('artist-banner-image');
    const artistLogoContainer = document.getElementById('artist-logo-container');
    const bannerLogoButton = document.querySelector('.banner-logo');
    const footerLogoButton = document.querySelector('.footer-logo');

    const urlParams = new URLSearchParams(window.location.search);
    const artistId = urlParams.get('artistId');

    if (!artistId) {
        console.error('ID виконавця не знайдено в параметрах URL.');
        document.title = 'Виконавець не знайдено - Note';
        return;
    }

    const apiUrl = `https://webproject-latest.onrender.com/api/Artist/artist/${artistId}`;
    const randomTracksUrl = `https://webproject-latest.onrender.com/api/Artist/5randomMusic/ArtistId/${artistId}`;

    // --- Перевірка кешу виконавця ---
    const cachedArtist = sessionStorage.getItem(`artist_${artistId}`);
    if (cachedArtist) {
        renderArtist(JSON.parse(cachedArtist));
    } else {
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
            })
            .then(artistData => {
                if (!artistData) {
                    console.error(`Виконавця з ID "${artistId}" не знайдено.`);
                    document.title = 'Виконавець не знайдено - Note';
                    return;
                }
                sessionStorage.setItem(`artist_${artistId}`, JSON.stringify(artistData));
                renderArtist(artistData);
            })
            .catch(error => {
                console.error('Помилка завантаження даних виконавця:', error);
                document.title = 'Помилка - Note';
            });
    }

    // --- Перевірка кешу треків ---
    const cachedTracks = sessionStorage.getItem(`randomTracks_${artistId}`);
    if (cachedTracks) {
        renderTracks(JSON.parse(cachedTracks));
    } else {
        fetch(randomTracksUrl)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                return res.json();
            })
            .then(tracks => {
                if (!tracks || tracks.length === 0) {
                    tracklistContainer.innerHTML = '<p>У цього виконавця поки немає треків.</p>';
                    return;
                }
                sessionStorage.setItem(`randomTracks_${artistId}`, JSON.stringify(tracks));
                renderTracks(tracks);
            })
            .catch(err => {
                console.error('Помилка завантаження треків:', err);
                tracklistContainer.innerHTML = '<p>Не вдалося завантажити треки виконавця.</p>';
            });
    }

    // --- Функція рендерингу виконавця (банер, логотип, альбоми) ---
    function renderArtist(artistData) {
        document.title = `${artistData.Name || artistData.name} - Note`;

        // --- Банер ---
        artistBannerImage.src = artistData.BannerUrl
            ? artistData.BannerUrl
            : `https://webproject-latest.onrender.com/api/Artist/banner/${artistId}`;
        artistBannerImage.alt = `Банер виконавця ${artistData.Name || artistData.name}`;

        // --- Логотип ---
        artistLogoContainer.innerHTML = '';
        const logoImg = document.createElement('img');
        logoImg.src = artistData.LogoUrl
            ? artistData.LogoUrl
            : `https://webproject-latest.onrender.com/api/Artist/logo/${artistId}`;
        logoImg.alt = `Логотип ${artistData.Name || artistData.name}`;
        artistLogoContainer.appendChild(logoImg);
        artistLogoContainer.style.opacity = '1';

        // --- Альбоми ---
        albumsContainer.innerHTML = '';
        const albums = artistData.Albums || artistData.albums || [];
        if (albums.length === 0) {
            albumsContainer.innerHTML = '<p>У цього виконавця поки немає альбомів.</p>';
        } else {
            albums.forEach(album => {
                const albumId = album.Id || album.id;
                const albumTitle = album.Title || album.title;
                const albumArtist = album.Artist?.Name || artistData.Name || 'Невідомо';
                const coverUrl = `https://webproject-latest.onrender.com/api/album/AlbumCover/${albumId}`;

                const albumItem = document.createElement('div');
                albumItem.classList.add('album-item');
                albumItem.dataset.albumId = albumId;

                albumItem.innerHTML = `
                    <div class="album-cover-container">
                        <img src="${coverUrl}" alt="Обкладинка альбому ${albumTitle}" class="album-cover">
                    </div>
                    <div class="album-info">
                        <h3 class="album-title">${albumTitle}</h3>
                        <p class="album-artist">${albumArtist}</p>
                    </div>
                `;

                albumItem.addEventListener('click', () => {
                    window.location.href = `album_page.html?albumId=${albumId}`;
                });

                albumsContainer.appendChild(albumItem);
            });
        }

        // --- Кнопки логотипів ---
        bannerLogoButton?.addEventListener('click', () => window.location.href = 'main_page.html');
        footerLogoButton?.addEventListener('click', () => window.location.href = 'main_page.html');
    }

    // --- Функція рендерингу треків ---
    function renderTracks(tracks) {
        tracklistContainer.innerHTML = '';
        tracks.forEach(track => {
            const trackId = track.Id || track.id;
            const albumId = track.Album?.Id || track.albumId;
            const title = track.Title || track.title;
            const artistName = track.Artist?.Name || 'Невідомо';
            const coverUrl = `https://webproject-latest.onrender.com/api/music/cover/${trackId}`;

            const listItem = document.createElement('li');
            listItem.classList.add('track-item-li');
            listItem.innerHTML = `
                <button class="track-item">
                    <div class="track-cover">
                        <img src="${coverUrl}" alt="Обкладинка треку ${title}">
                    </div>
                    <div class="track-info">
                        <span class="artist-name">${artistName}</span>
                        <span class="minus"> - </span>
                        <span class="track-title">${title}</span>
                    </div>
                </button>
            `;

            listItem.addEventListener('click', () => {
                if (albumId && trackId) {
                    window.location.href = `album_page.html?albumId=${albumId}&trackId=${trackId}`;
                }
            });

            tracklistContainer.appendChild(listItem);
        });
    }
});
