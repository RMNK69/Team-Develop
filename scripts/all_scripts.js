// all_scripts.js

// Код з index.html
/*fetch('data.json')
    .then(response => response.json())
    .then(data => {
        const tracklistContainer = document.getElementById('tracklist-container');
        const albumsContainer = document.getElementById('albums-container');

        // Відображення треків з альбому "Deftones_Album" на головній сторінці
        const deftonesAlbumTracks = data.tracks.filter(track => track.albumId === 'deftones_album');
        deftonesAlbumTracks.sort((a, b) => a.position - b.position); // Сортування за позицією
        deftonesAlbumTracks.forEach(track => {
            const listItem = document.createElement('li');
            listItem.classList.add('track-item-li');
            listItem.innerHTML = `
                <button class="track-item" onclick="window.location.href='track_page.html?trackId=${track.id}'">
                    <div class="track-cover">
                        <img src="${track.cover}" alt="Обкладинка треку ${track.title}">
                    </div>
                    <div class="track-info">
                        <span class="artist-name">${track.artist}</span> - <span class="track-title">${track.title}</span>
                    </div>
                </button>
            `;
            tracklistContainer.appendChild(listItem);
        });

        // Відображення альбомів "Deftones" та "Koi No Yokan" на головній сторінці
        const displayedAlbums = data.albums.filter(album => album.id === 'deftones_album' || album.id === 'koi_no_yokan_album');
        displayedAlbums.forEach(album => {
            const albumItem = document.createElement('button');
            albumItem.classList.add('album-item');
            albumItem.addEventListener('click', () => {
                window.location.href = `album_page.html?albumId=${album.id}&albumTitle=${encodeURIComponent(album.title)}&albumArtist=${encodeURIComponent(album.artist)}`;
            });
            albumItem.innerHTML = `
                <img src="${album.cover}" alt="Обкладинка альбому ${album.title}">
                <h3 class="album-title">${album.title}</h3>
                <p class="album-artist">${album.artist}</p>
            `;
            albumsContainer.appendChild(albumItem);
        });
    })
    .catch(error => console.error('Помилка завантаження даних:', error));

// Код з album_page.html
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

const albumId = getUrlParam('albumId');
const albumCoverElement = document.getElementById('album-cover');
const albumTitleElement = document.getElementById('album-title');
const albumArtistElement = document.getElementById('album-artist');
const albumYearElement = document.getElementById('album-year');
const albumTracklistElement = document.getElementById('album-tracklist');
const albumTrackCountElement = document.getElementById('album-track-count');
const audioPlayerElement = document.getElementById('audio-player');
const albumDetailsElement = document.querySelector('.album-details'); // Отримання елементу

fetch('data.json')
    .then(response => response.json())
    .then(data => {
        const album = data.albums.find(album => album.id === albumId);

        if (album) {
            albumCoverElement.src = album.cover;
            albumTitleElement.textContent = album.title;
            albumArtistElement.textContent = album.artist;
            albumYearElement.textContent = album.year;
            albumTrackCountElement.textContent = album.tracks.length;

            const tracksInAlbum = data.tracks.filter(track => album.tracks.includes(track.id));

            // Сортування треків за позицією
            tracksInAlbum.sort((a, b) => a.position - b.position);

            tracksInAlbum.forEach(track => {
                const listItem = document.createElement('li');
                listItem.classList.add('track-item-li');
                const trackButton = document.createElement('button');
                trackButton.classList.add('track-item-button');
                trackButton.addEventListener('click', () => {
                    loadTrack(track);
                });
                trackButton.innerHTML = `
                    <div class="track-info">
                        <span class="track-artist">${track.artist}</span> - <span class="track-title">${track.title}</span>
                    </div>
                `;
                listItem.appendChild(trackButton);
                albumTracklistElement.appendChild(listItem);
            });

            if (tracksInAlbum.length > 0) {
                loadTrack(tracksInAlbum[0]);
            }

        } else {
            albumTitleElement.textContent = 'Альбом не знайдено';
        }
    })
    .catch(error => console.error('Помилка завантаження даних:', error));

// Код з track_page.html
const trackIdPage = getUrlParam('trackId');
const trackCoverElementPage = document.getElementById('track-cover');
const trackTitleElementPage = document.getElementById('track-title');
const trackArtistElementPage = document.getElementById('track-artist');
const trackAlbumElementPage = document.getElementById('track-album');

fetch('data.json')
    .then(response => response.json())
    .then(data => {
        const track = data.tracks.find(track => track.id === trackIdPage);

        if (track) {
            trackCoverElementPage.src = track.cover;
            trackTitleElementPage.textContent = track.title;
            trackArtistElementPage.textContent = track.artist;

            const album = data.albums.find(album => album.id === track.albumId);
            trackAlbumElementPage.textContent = album ? album.title : 'Невідомо';
        } else {
            trackTitleElementPage.textContent = 'Трек не знайдено';
        }
    })
    .catch(error => console.error('Помилка завантаження даних:', error));

// Код для керування кастомним плеєром на сторінці альбому
document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audio-player');
    const playPauseButton = document.getElementById('playPause');
    const prevTrackButton = document.getElementById('prevTrack');
    const nextTrackButton = document.getElementById('nextTrack');
    const progressBar = document.getElementById('progressBar');
    const progress = document.getElementById('progress');
    const progressThumb = document.getElementById('progressThumb');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const volumeSliderContainer = document.getElementById('volumeSliderContainer');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeThumb = document.getElementById('volumeThumb');
    const likeButton = document.getElementById('like');
    const repeatButton = document.getElementById('repeat');
    const tracklistContainer = document.getElementById('album-tracklist');
    let currentTrackIndex = 0;
    let isPlaying = false;
    let isDraggingProgress = false;
    let isDraggingVolume = false;
    let isLiked = false;
    let isRepeating = false;
    let currentAlbumTracks = []; // Масив треків поточного альбому з data.json

    // Функція для форматування часу (MM:SS)
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${remainingSeconds}`;
    }

    // Завантаження треків альбому
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            const albumId = getUrlParam('albumId');
            const album = data.albums.find(album => album.id === albumId);
            if (album) {
                currentAlbumTracks = data.tracks.filter(track => album.tracks.includes(track.id));
                if (currentAlbumTracks.length > 0) {
                    loadTrack(currentAlbumTracks[0]);
                }
            }
        });

    // Завантаження треку в плеєр
    function loadTrack(track) {
        audioPlayer.src = track.audioSrc || ''; // Переконайтеся, що audioSrc існує
        const albumTitle = getUrlParam('albumTitle') || '';
        const albumArtist = getUrlParam('albumArtist') || '';
        const albumDetailsTitle = document.querySelector('.album-details h1');
        const albumDetailsArtist = document.getElementById('album-artist');

        if (albumDetailsTitle) {
            albumDetailsTitle.textContent = albumTitle;
        }
        if (albumDetailsArtist) {
            albumDetailsArtist.textContent = albumArtist;
        }

        audioPlayer.addEventListener('loadedmetadata', () => {
            durationDisplay.textContent = formatTime(audioPlayer.duration);
        });
    }

    // Відтворення/пауза
    playPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            audioPlayer.pause();
            playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            audioPlayer.play();
            playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
        }
        isPlaying = !isPlaying;
    });

    // Попередній трек
    prevTrackButton.addEventListener('click', () => {
        currentTrackIndex--;
        if (currentTrackIndex < 0) {
            currentTrackIndex = currentAlbumTracks.length - 1;
        }
        loadTrack(currentAlbumTracks[currentTrackIndex]);
        if (isPlaying) audioPlayer.play();
    });

    // Наступний трек
    nextTrackButton.addEventListener('click', () => {
        currentTrackIndex++;
        if (currentTrackIndex >= currentAlbumTracks.length) {
            currentTrackIndex = 0;
        }
        loadTrack(currentAlbumTracks[currentTrackIndex]);
        if (isPlaying) audioPlayer.play();
    });

    // Оновлення прогрес-бару
    audioPlayer.addEventListener('timeupdate', () => {
        if (!isDraggingProgress) {
            const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progress.style.width = `${progressPercent}%`;
            progressThumb.style.left = `calc(${progressPercent}% - 7.5px)`;
            currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
        }
    });

    // Перемотування треку
    progressBar.addEventListener('mousedown', (e) => {
        isDraggingProgress = true;
        updateProgress(e);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDraggingProgress) {
            updateProgress(e);
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDraggingProgress) {
            isDraggingProgress = false;
            const seekTime = (parseFloat(progress.style.width) / 100) * audioPlayer.duration;
            audioPlayer.currentTime = seekTime;
        }
    });

    function updateProgress(e) {
        const progressBarRect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - progressBarRect.left;
        let progressPercent = (clickX / progressBarRect.width) * 100;
        progressPercent = Math.max(0, Math.min(100, progressPercent));
        progress.style.width = `${progressPercent}%`;
        progressThumb.style.left = `${progressPercent}%`; // Просто встановлюємо left у відсотках
    }

    // Регулювання гучності
    volumeSliderContainer.addEventListener('mousedown', (e) => {
        isDraggingVolume = true;
        updateVolume(e);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDraggingVolume) {
            updateVolume(e);
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDraggingVolume) {
            isDraggingVolume = false;
        }
    });

    function updateVolume(e) {
        const volumeSliderRect = volumeSliderContainer.getBoundingClientRect();
        const clickX = e.clientX - volumeSliderRect.left;
        let volumePercent = clickX / volumeSliderRect.width;
        volumePercent = Math.max(0, Math.min(1, volumePercent));
        volumeSlider.style.width = `${volumePercent * 100}%`;
        volumeThumb.style.left = `${volumePercent * 100}%`; // Просто встановлюємо left у відсотках
        audioPlayer.volume = volumePercent;
    }

    // Лайк
    likeButton.addEventListener('click', () => {
        isLiked = !isLiked;
        likeButton.innerHTML = isLiked ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    });

    // Повтор
    repeatButton.addEventListener('click', () => {
        isRepeating = !isRepeating;
        repeatButton.classList.toggle('active', isRepeating);
        audioPlayer.loop = isRepeating;
    });

    // Автоматичний перехід на наступний трек після закінчення поточного
    audioPlayer.addEventListener('ended', () => {
        if (isRepeating) {
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        } else {
            nextTrackButton.click();
        }
    });
});*/