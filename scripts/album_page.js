function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

const albumId = getUrlParam('albumId');
const initialTrackId = getUrlParam('trackId'); 
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

// --- Функція завантаження і кешування зображень у localStorage ---
function loadAndCacheImage(imgElement, url, storageKey) {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
        imgElement.src = cached;
    } else {
        fetch(url)
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onload = () => {
                    imgElement.src = reader.result;
                    try {
                        localStorage.setItem(storageKey, reader.result);
                    } catch (e) {
                        console.warn('LocalStorage переповнений, не зберегли зображення', e);
                    }
                };
                reader.readAsDataURL(blob);
            });
    }
}

function loadTrack(track, index) {
    audioPlayerElement.src = `https://webproject-latest.onrender.com/api/Music/file/${track.Id}`;
    currentTrackIndex = index;
    updateTrackInfoDisplay(track);
    updateActiveTrackClass();

    audioPlayerElement.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatTime(audioPlayerElement.duration);
    });
}

function updateTrackInfoDisplay(track) {
    if (trackInfoDisplay) {
        trackInfoDisplay.textContent = `${track.Artist.Name} - ${track.Title}`;
    }
}

function updateActiveTrackClass() {
    const trackItems = document.querySelectorAll('.track-item-li');
    trackItems.forEach((item, index) => {
        item.classList.remove('active');
        if (index === currentTrackIndex) item.classList.add('active');
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
        currentTrackIndex = (currentTrackIndex - 1 + currentAlbumTracks.length) % currentAlbumTracks.length;
        loadTrack(currentAlbumTracks[currentTrackIndex], currentTrackIndex);
        if (isPlaying) audioPlayerElement.play();
    }
}

function playNextTrack() {
    if (currentAlbumTracks.length > 0) {
        currentTrackIndex = (currentTrackIndex + 1) % currentAlbumTracks.length;
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
        let volumePercent = Math.max(0, Math.min(1, clickX / volumeSliderRect.width));
        audioPlayerElement.volume = volumePercent;
        volumeSlider.style.width = `${volumePercent * 100}%`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetch(`https://webproject-latest.onrender.com/api/Album/${albumId}`)
        .then(res => res.json())
        .then(album => {
            if (!album) {
                document.title = 'Альбом не знайдено - Note';
                albumTitleElement.textContent = 'Альбом не знайдено';
                return;
            }

            document.title = `${album.Artist.Name} - ${album.Title} - Note`;

            // --- Кешуємо обкладинку альбому ---
            loadAndCacheImage(albumCoverElement, `https://webproject-latest.onrender.com/api/Image/Covers/${album.AlbCoverUrl}`, `albumCover_${albumId}`);

            albumTitleElement.textContent = album.Title;
            albumArtistElement.textContent = album.Artist.Name;
            albumYearElement.textContent = album.MusicInAlbum[0].Year;
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
        })
        .catch(error => {
            console.error('Помилка завантаження даних:', error);
            document.title = 'Помилка - Note';
        });

    audioPlayerElement.addEventListener('timeupdate', () => {
        progress.style.width = `${(audioPlayerElement.currentTime / audioPlayerElement.duration) * 100}%`;
        currentTimeDisplay.textContent = formatTime(audioPlayerElement.currentTime);
    });

    progressBar.addEventListener('mousedown', (event) => { isDraggingProgress = true; updateProgress(event); });
    document.addEventListener('mousemove', updateProgress);
    document.addEventListener('mouseup', () => { isDraggingProgress = false; });

    volumeSliderContainer.addEventListener('mousedown', (event) => { isDraggingVolume = true; setVolume(event); });
    document.addEventListener('mousemove', setVolume);
    document.addEventListener('mouseup', () => { isDraggingVolume = false; });

    playPauseButton.addEventListener('click', playPauseTrack);
    prevTrackButton.addEventListener('click', playPreviousTrack);
    nextTrackButton.addEventListener('click', playNextTrack);

    audioPlayerElement.addEventListener('ended', playNextTrack);
});
