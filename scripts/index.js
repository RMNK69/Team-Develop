// index.js
fetch('../data.json')
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
                        <img src="../${track.cover}" alt="Обкладинка треку ${track.title}">
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
                <img src="../${album.cover}" alt="Обкладинка альбому ${album.title}">
                <h3 class="album-title">${album.title}</h3>
                <p class="album-artist">${album.artist}</p>
            `;
            albumsContainer.appendChild(albumItem);
        });
    })
    .catch(error => console.error('Помилка завантаження даних:', error));