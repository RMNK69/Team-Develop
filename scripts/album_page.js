// album_page.js

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
const albumDetailsElement = document.querySelector('.album-details');

fetch('../data.json')
    .then(response => response.json())
    .then(data => {
        const album = data.albums.find(album => album.id === albumId);

        if (album) {
            console.log('Знайдений альбом:', album);
            albumCoverElement.src = album.cover;
            albumTitleElement.textContent = album.title;
            albumArtistElement.textContent = album.artist;
            albumYearElement.textContent = album.year;
            albumTrackCountElement.textContent = album.tracks.length;

            const tracksInAlbum = data.tracks.filter(track => album.tracks.includes(track.id));
            console.log('Треки в альбомі (до сортування):', tracksInAlbum);

            // Сортування треків за позицією
            tracksInAlbum.sort((a, b) => a.position - b.position);
            console.log('Треки в альбомі (після сортування):', tracksInAlbum);
            currentAlbumTracks = tracksInAlbum; // Ініціалізація currentAlbumTracks тут

            tracksInAlbum.forEach(track => {
                const listItem = document.createElement('li');
                listItem.classList.add('track-item-li');
                const trackButton = document.createElement('button');
                trackButton.classList.add('track-item-button');
                trackButton.addEventListener('click', () => {
                    console.log('Натиснуто трек:', track.title, track);
                    loadTrack(track);
                    setActiveTrack(trackButton);
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
                console.log('Завантажуємо перший трек:', tracksInAlbum[0]);
                loadTrack(tracksInAlbum[0]);
                const firstTrackButton = albumTracklistElement.querySelector('.track-item-button');
                if (firstTrackButton) {
                    setActiveTrack(firstTrackButton);
                }
            }

        } else {
            albumTitleElement.textContent = 'Альбом не знайдено';
        }
    })
    .catch(error => console.error('Помилка завантаження даних:', error));

// Код для керування кастомним плеєром на сторінці альбому
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const menu = document.getElementById('menu');
    const audioPlayer = document.getElementById('audio-player');
    const playPauseButton = document.getElementById('playPause');
    const prevTrackButton = document.getElementById('prevTrack');
    const nextTrackButton = document.getElementById('nextTrack');
    const progressBar = document.getElementById('progressBar');
    const progress = document.getElementById('progress');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const volumeSliderContainer = document.getElementById('volumeSliderContainer');
    const volumeSlider = document.getElementById('volumeSlider');
    const trackInfoDisplay = document.getElementById('track-info-display');
    const likeButton = document.getElementById('like');
    const repeatButton = document.getElementById('repeat');
    let currentTrackIndex = 0;
    let isPlaying = false;
    let isDraggingProgress = false;
    let isDraggingVolume = false;
    let isLiked = false;
    let isRepeating = false;
    let currentAlbumTracks = []; // Оголошення тут прибрано, ініціалізація відбувається після fetch

    // Функція для форматування часу (MM:SS)
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${remainingSeconds}`;
    }

    // Завантаження треку в плеєр
    function loadTrack(track) {
        console.log('Функція loadTrack викликана з треком:', track);
        audioPlayer.src = track.audioSrc || '';
        if (trackInfoDisplay) {
            trackInfoDisplay.textContent = `${track.artist} - ${track.title}`;
        }
        audioPlayer.addEventListener('loadedmetadata', () => {
            durationDisplay.textContent = formatTime(audioPlayer.duration);
        });
    }

    // Функція для встановлення візуального відображення активного треку
    function setActiveTrack(button) {
        const trackButtons = document.querySelectorAll('.track-item-button');
        trackButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
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
        if (currentAlbumTracks.length > 0) {
            currentTrackIndex--;
            if (currentTrackIndex < 0) {
                currentTrackIndex = currentAlbumTracks.length - 1;
            }
            const track = currentAlbumTracks[currentTrackIndex];
            console.log('Попередній трек:', track);
            loadTrack(track);
            const trackButton = albumTracklistElement.querySelectorAll('.track-item-button')[currentTrackIndex];
            if (trackButton) {
                setActiveTrack(trackButton);
            }
            if (isPlaying) audioPlayer.play();
        }
    });

    // Наступний трек
    nextTrackButton.addEventListener('click', () => {
        if (currentAlbumTracks.length > 0) {
            currentTrackIndex++;
            if (currentTrackIndex >= currentAlbumTracks.length) {
                currentTrackIndex = 0;
            }
            const track = currentAlbumTracks[currentTrackIndex];
            console.log('Наступний трек:', track);
            loadTrack(track);
            const trackButton = albumTracklistElement.querySelectorAll('.track-item-button')[currentTrackIndex];
            if (trackButton) {
                setActiveTrack(trackButton);
            }
            if (isPlaying) audioPlayer.play();
        }
    });

    // Оновлення прогрес-бару
    audioPlayer.addEventListener('timeupdate', () => {
        if (!isDraggingProgress) {
            const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progress.style.width = `${progressPercent}%`;
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

    // Меню-гамбургер
    menuToggle.addEventListener('click', () => {
        menu.classList.toggle('open');
    });
});