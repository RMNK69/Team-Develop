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

    fetch('../data.json')
        .then(response => response.json())
        .then(data => {
            const artistData = data.artists.find(artist => artist.id === artistId);

            if (!artistData) {
                console.error(`Виконавця з ID "${artistId}" не знайдено.`);
                document.title = 'Виконавець не знайдено - Note';
                return;
            }

            document.title = `${artistData.name} - Note`;

            if (artistData.banner) {
                artistBannerImage.src = artistData.banner.replace(/\\/g, '/');
                artistBannerImage.alt = `Банер виконавця ${artistData.name}`;
            } else {
                artistBannerImage.src = '';
                artistBannerImage.alt = '';
            }

            artistLogoContainer.innerHTML = '';
            if (artistData.logo) {
                const logoImg = document.createElement('img');
                logoImg.src = artistData.logo.replace(/\\/g, '/');
                logoImg.alt = `Логотип ${artistData.name}`;
                artistLogoContainer.appendChild(logoImg);
                artistLogoContainer.style.opacity = '1';
            } else {
                artistLogoContainer.style.opacity = '0';
            }

            tracklistContainer.innerHTML = '';
            albumsContainer.innerHTML = '';

            const artistAlbums = artistData.albums;
            const artistTracks = data.tracks.filter(track => artistAlbums.includes(track.albumId));
            artistTracks.sort((a, b) => a.position - b.position);

            artistTracks.slice(0, 5).forEach(track => {
                const listItem = document.createElement('li');
                listItem.classList.add('track-item-li');
                listItem.innerHTML = `
                    <button class="track-item">
                        <div class="track-cover">
                            <img src="../${track.cover.replace(/\\/g, '/')}" alt="Обкладинка треку ${track.title}">
                        </div>
                        <div class="track-info">
                            <span class="artist-name">${track.artist}</span>
                            <span class="minus"> - </span>
                            <span class="track-title">${track.title}</span>
                        </div>
                    </button>
                `;
                listItem.addEventListener('click', () => {
                    window.location.href = `album_page.html?albumId=${track.albumId}&trackId=${track.id}`;
                });
                tracklistContainer.appendChild(listItem);
            });

            const albumsToDisplay = data.albums.filter(album => artistAlbums.includes(album.id));
            albumsToDisplay.forEach(album => {
                const albumItem = document.createElement('button');
                albumItem.classList.add('album-item');
                albumItem.addEventListener('click', () => {
                    window.location.href = `album_page.html?albumId=${album.id}`;
                });
                albumItem.innerHTML = `
                    <img src="../${album.cover.replace(/\\/g, '/')}" alt="Обкладинка альбому ${album.title}">
                    <h3 class="album-title">${album.title}</h3>
                    <p class="album-artist">${album.artist}</p>
                `;
                albumsContainer.appendChild(albumItem);
            });

            if (bannerLogoButton) {
                bannerLogoButton.addEventListener('click', () => {
                    window.location.href = 'main_page.html';
                });
            }

            if (footerLogoButton) {
                footerLogoButton.addEventListener('click', () => {
                    window.location.href = 'main_page.html';
                });
            }

        })
        .catch(error => {
            console.error('Помилка завантаження даних:', error);
            document.title = 'Помилка - Note';
        });
});