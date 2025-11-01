function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

const albumId = getUrlParam('albumId');
const initialTrackId = getUrlParam('trackId'); // Отримуємо trackId з URL
const albumCoverElement = document.getElementById('album-cover');
const albumTitleElement = document.getElementById('album-title');
const albumArtistElement = document.getElementById('album-artist');
const albumYearElement = document.getElementById('album-year');
const albumTracklistElement = document.getElementById('album-tracklist');
const albumTrackCountElement = document.getElementById('album-track-count');
const audioPlayerElement = document.getElementById('audio-player');
const currentTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const volumeSliderContainer = document.getElementById('volumeSliderContainer');
const volumeSlider = document.getElementById('volumeSlider');
const playPauseButton = document.getElementById('playPause');
const prevTrackButton = document.getElementById('prevTrack');
const nextTrackButton = document.getElementById('nextTrack');
const trackInfoDisplay = document.querySelector('.music-player h3');

let currentAlbumTracks = [];
let currentTrackIndex = 0;
let isPlaying = false;
let isDraggingProgress = false;
let isDraggingVolume = false;

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
}

function loadTrack(track, index) {
    console.log('Завантаження треку:', track.title, 'URL:', track.audioSrc, 'Індекс:', index);
    audioPlayerElement.src = track.audioSrc || '';
    currentTrackIndex = index;
    updateTrackInfoDisplay(track);
    updateActiveTrackClass();

    audioPlayerElement.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatTime(audioPlayerElement.duration);
    });
}

function updateTrackInfoDisplay(track) {
    if (trackInfoDisplay) {
        trackInfoDisplay.textContent = `${track.artist} - ${track.title}`;
    }
}

function updateActiveTrackClass() {
    const trackItems = document.querySelectorAll('.track-item-li');
    trackItems.forEach((item, index) => {
        item.classList.remove('active');
        if (index === currentTrackIndex) {
            item.classList.add('active');
        }
    });
}

function playPauseTrack() {
    if (isPlaying) {
        audioPlayerElement.pause();
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        audioPlayerElement.play();
        playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

function playPreviousTrack() {
    if (currentAlbumTracks.length > 0) {
        currentTrackIndex--;
        if (currentTrackIndex < 0) {
            currentTrackIndex = currentAlbumTracks.length - 1;
        }
        loadTrack(currentAlbumTracks[currentTrackIndex], currentTrackIndex);
        if (isPlaying) audioPlayerElement.play();
    }
}

function playNextTrack() {
    if (currentAlbumTracks.length > 0) {
        currentTrackIndex++;
        if (currentTrackIndex >= currentAlbumTracks.length) {
            currentTrackIndex = 0;
        }
        loadTrack(currentAlbumTracks[currentTrackIndex], currentTrackIndex);
        if (isPlaying) audioPlayerElement.play();
    }
}

function updateProgress(event) {
    if (isDraggingProgress) {
        const progressBarRect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - progressBarRect.left;
        const progressPercent = clickX / progressBarRect.width;
        audioPlayerElement.currentTime = progressPercent * audioPlayerElement.duration;
    }
}

function setVolume(event) {
    if (isDraggingVolume) {
        const volumeSliderRect = volumeSliderContainer.getBoundingClientRect();
        const clickX = event.clientX - volumeSliderRect.left;
        let volumePercent = clickX / volumeSliderRect.width;
        volumePercent = Math.max(0, Math.min(1, volumePercent));
        audioPlayerElement.volume = volumePercent;
        volumeSlider.style.width = `${volumePercent * 100}%`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetch(`https://webproject-latest.onrender.com/api/Album/${albumId}`)
        .then(response => response.json())
        .then(album => {
            if (album) {
                document.title = `${album.Artist.Name} - ${album.Title} - Note`; 
                albumCoverElement.src = `https://webproject-latest.onrender.com/api/Image/Covers/${album.AlbCoverUrl}`;
                albumTitleElement.textContent = album.Title;
                albumArtistElement.textContent = album.Artist.Name;
                albumYearElement.textContent = album.MusicInAlbum[0].Year; // Using Year from first track
                albumTrackCountElement.textContent = album.CountOfMusicInAlbum;

                currentAlbumTracks = album.MusicInAlbum;

                albumTracklistElement.innerHTML = '';

                let initialTrackLoaded = false;

                currentAlbumTracks.forEach((track, index) => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('track-item-li');
                    listItem.innerHTML = `
                        <button class="track-item-button">
                            <div class="track-info">
                                <span class="track-artist">${track.Artist.Name}</span> - <span class="track-title">${track.Title}</span>
                            </div>
                        </button>
                    `;
                    listItem.addEventListener('click', () => {
                        loadTrack(track, index);
                        if (isPlaying) audioPlayerElement.play();
                    });
                    albumTracklistElement.appendChild(listItem);

                    if (initialTrackId && track.Id === initialTrackId && !initialTrackLoaded) {
                        loadTrack(track, index);
                        initialTrackLoaded = true;
                    }
                });

                if (currentAlbumTracks.length > 0 && !initialTrackLoaded) {
                    loadTrack(currentAlbumTracks[0], 0);
                }
                updateActiveTrackClass();

            } else {
                document.title = 'Альбом не знайдено - Note';
                albumTitleElement.textContent = 'Альбом не знайдено';
            }
        })
        .catch(error => {
            console.error('Помилка завантаження даних:', error);
            document.title = 'Помилка - Note';
        });

    audioPlayerElement.addEventListener('timeupdate', () => {
        const progressPercent = (audioPlayerElement.currentTime / audioPlayerElement.duration) * 100;
        progress.style.width = `${progressPercent}%`;
        currentTimeDisplay.textContent = formatTime(audioPlayerElement.currentTime);
    });

    progressBar.addEventListener('mousedown', (event) => {
        isDraggingProgress = true;
        updateProgress(event);
    });

    document.addEventListener('mousemove', (event) => {
        updateProgress(event);
    });

    document.addEventListener('mouseup', () => {
        isDraggingProgress = false;
    });

    volumeSliderContainer.addEventListener('mousedown', (event) => {
        isDraggingVolume = true;
        setVolume(event);
    });

    document.addEventListener('mousemove', (event) => {
        setVolume(event);
    });

    document.addEventListener('mouseup', () => {
        isDraggingVolume = false;
    });

    playPauseButton.addEventListener('click', playPauseTrack);
    prevTrackButton.addEventListener('click', playPreviousTrack);
    nextTrackButton.addEventListener('click', playNextTrack);

    audioPlayerElement.addEventListener('ended', () => {
        playNextTrack();
    });
});