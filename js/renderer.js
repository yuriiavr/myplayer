const audio = document.getElementById('audio');
const playButton = document.getElementById('play');
const nextButton = document.getElementById('next');
const prevButton = document.getElementById('prev');
const volumeSlider = document.getElementById('volume');
const repeatButton = document.getElementById('repeat');
const progressSlider = document.getElementById('progress');
const tooltip = document.getElementById('tooltip');
const currentTimeDisplay = document.getElementById('current-time');
const totalDurationDisplay = document.getElementById('total-duration');
const likeButton = document.getElementById('like')
const addSong = document.getElementById('add-song')
const addSongModal = document.getElementById('add-modal')
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const playlistElement = document.getElementById('playlist');
const songNameElement = document.querySelector('.name');
const artistElement = document.querySelector('.artist');
const openList = document.getElementById('open-playlist')
const playList = document.getElementById('playlist-cont')

let songs = [];
let currentSongIndex = 0;
let isRepeating = false;
let isLiked = false;
let isModalOpen = false;
let isListOpen = false;
let draggedItem = null;

window.addEventListener('load', () => {
    const savedVolume = localStorage.getItem('volume');
    if (savedVolume !== null) {
        audio.volume = parseFloat(savedVolume);
        volumeSlider.value = savedVolume;
    }

    const savedSongIndex = localStorage.getItem('currentSongIndex');
    if (savedSongIndex !== null) {
        currentSongIndex = parseInt(savedSongIndex, 10);
        audio.src = songs[currentSongIndex];
    }

    audio.addEventListener('loadedmetadata', () => {
        totalDurationDisplay.textContent = formatTime(audio.duration);
    });

    updatePlaylist();
});

addSong.addEventListener('click', () => {
    isModalOpen = !isModalOpen;
    addSongModal.style.display = isModalOpen ? 'flex' : 'none';
})

openList.addEventListener('click', () => {
    isListOpen = !isListOpen;
    playList.style.display = isListOpen ? 'block' : 'none';
})

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      addSongModal.style.display = 'none';
      isModalOpen = false;
    }
})

playButton.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playButton.innerHTML = '<img src="img/pause.png" alt="play">';
    } else {
        audio.pause();
        playButton.innerHTML = '<img src="img/play.png" alt="play">';
    }
});

nextButton.addEventListener('click', playNextSong);
prevButton.addEventListener('click', playPrevSong);

repeatButton.addEventListener('click', () => {
    isRepeating = !isRepeating;
    repeatButton.innerHTML = isRepeating ? '<img width="40" src="img/repeat-active.png" alt="repeat" />' : '<img width="40" src="img/repeat.png" alt="repeat" />';
    audio.loop = isRepeating;
});

likeButton.addEventListener('click', () => {
    isLiked = !isLiked;
    likeButton.innerHTML = isLiked ? '<img width="40" src="img/like-active.png" alt="like" />' : '<img width="40" src="img/like.png" alt="like" />';
    audio.loop = isLiked;
});

volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value;
    audio.volume = volume;
    localStorage.setItem('volume', volume);
});

audio.addEventListener('ended', () => {
    if (!isRepeating) {
        playNextSong();
    }
});

function playNextSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    audio.src = songs[currentSongIndex].url;
    audio.play();
    playButton.innerHTML = '<img src="img/pause.png" alt="play">';
    updatePlaylist();
    updateSongInfo();
    localStorage.setItem('currentSongIndex', currentSongIndex);
}

function playPrevSong() {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    audio.src = songs[currentSongIndex].url;
    audio.play();
    playButton.innerHTML = '<img src="img/pause.png" alt="play">';
    updatePlaylist();
    updateSongInfo();
    localStorage.setItem('currentSongIndex', currentSongIndex);
}


function sliderValueChange(e) {
    console.log(e.value);
}

audio.addEventListener('timeupdate', () => {
    progressSlider.value = (audio.currentTime / audio.duration) * 100;
});

progressSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    audio.currentTime = (value / 100) * audio.duration;
});

progressSlider.addEventListener('mousemove', (e) => {
    const rect = progressSlider.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * audio.duration;
    tooltip.style.display = 'block';
    tooltip.style.left = `${e.clientX - rect.left}px`;
    tooltip.textContent = formatTime(time);
});

progressSlider.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
});

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

audio.addEventListener('timeupdate', () => {
    progressSlider.value = (audio.currentTime / audio.duration) * 100;
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
});

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    handleFiles(files);
});

dropArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    handleFiles(files);
});

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('audio/')) {
            const url = URL.createObjectURL(file);
            songs.push({ name: '', artist: '', url, file });
            extractMetadata(file, url);
        }
    });
}

function extractMetadata(file, url) {
    jsmediatags.read(file, {
        onSuccess: (tag) => {
            const title = tag.tags.title || file.name || 'Unknown Title';
            const artist = tag.tags.artist || 'Unknown Artist';
            
            const picture = tag.tags.picture;
            let coverImageUrl = 'img/songback.png';
            if (picture) {
                const base64String = getBase64String(picture.data);
                coverImageUrl = `data:${picture.format};base64,${base64String}`;
            }

            const index = songs.findIndex(song => song.url === url);
            if (index !== -1) {
                songs[index].name = title;
                songs[index].artist = artist;
                songs[index].coverImage = coverImageUrl;

                updatePlaylist();

                songNameElement.textContent = title;
                artistElement.textContent = artist;
                document.getElementById('cover-image').src = coverImageUrl; 

                if (index === 0) {
                    audio.src = url;
                    audio.play();
                    playButton.innerHTML = '<img src="img/pause.png" alt="play">';
                }
            }
        },
        onError: (error) => {
            console.error('Error reading metadata: ', error);
        }
    });
}

function updateSongInfo() {
    const currentSong = songs[currentSongIndex];
    if (currentSong) {
        songNameElement.textContent = currentSong.name || 'Unknown Title';
        artistElement.textContent = currentSong.artist || 'Unknown Artist';
        document.getElementById('cover-image').src = currentSong.coverImage || 'img/default-cover.jpg';
    }
}

function getBase64String(data) {
    let base64String = '';
    for (let i = 0; i < data.length; i++) {
        base64String += String.fromCharCode(data[i]);
    }
    return window.btoa(base64String);
}

function updatePlaylist() {
    const playlistElement = document.getElementById('playlist');
    if (!playlistElement) return; 
    playlistElement.innerHTML = '';
    songs.forEach((song, index) => {
        const songElement = document.createElement('li');
        songElement.textContent = `${song.name} - ${song.artist}`;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delButton'
        deleteButton.textContent = 'X';
        deleteButton.onclick = () => {
            removeSong(index);
        };

        songElement.appendChild(deleteButton);
        playlistElement.appendChild(songElement);

        if (song.isPlaying) {
            songElement.style.color = '#BB86FC'; 
        } else {
            songElement.style.color = '';
        }

        songElement.onclick = () => {
            playSong(index);
        };
    });
}


    playlistElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(playlistElement, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (afterElement == null) {
            playlistElement.appendChild(dragging);
        } else {
            playlistElement.insertBefore(dragging, afterElement);
        }
    });

    playlistElement.addEventListener('drop', () => {
        const newIndex = Array.from(playlistElement.children).indexOf(draggedItem);
        const oldIndex = draggedItem.dataset.index;

        const [movedSong] = songs.splice(oldIndex, 1);
        songs.splice(newIndex, 0, movedSong);

        Array.from(playlistElement.children).forEach((item, index) => {
            item.dataset.index = index;
        });

        updatePlaylist();
    });
    if (songs[currentSongIndex]) {
        songNameElement.textContent = songs[currentSongIndex].name;
        artistElement.textContent = songs[currentSongIndex].artist;
    }



function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.playlist-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function loadSongs() {
    try {
        const loadedSongs = await window.electronAPI.loadSongs();
        if (loadedSongs.length > 0) {
            songs = loadedSongs;
            updatePlaylist();
        } else {
            console.warn('Плейлист порожній або пісні не були збережені.');
        }
    } catch (error) {
        console.error('Помилка при завантаженні пісень:', error);
    }
}
function saveSongs() {
    window.electronAPI.saveSongs(songs);
}

function playSong(index) {
    songs.forEach((song, i) => {
        song.isPlaying = i === index; 
    });
    currentSongIndex = index;
    audio.src = songs[index].url;
    audio.play();
    updatePlaylist();
    updateSongInfo();
}

function removeSong(index) {
    songs.splice(index, 1);  
    saveSongs();            
    updatePlaylist();     
}