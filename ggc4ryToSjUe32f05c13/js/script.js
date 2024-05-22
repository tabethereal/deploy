/**
 * 全局变量
 */
let currentMusic = 0;
let lastPlayedMusic = 0;

const playModeType = {
  CYCLE: 0,
  REPEAT: 1,
  SHUFFLE: 2
};
let playMode = playModeType.CYCLE;

let playRate = 1;

let shuffleList = [];

let currentCollection = 0;


/**
 * 为元素批量添加监听事件
 */
const addEventOnElements = function (elements, eventType, callback) {
  for (let i = 0, len = elements.length; i < len; i++) {
    elements[i].addEventListener(eventType, callback);
  }
}

/**
 * 获取音乐信息
 */
let musicData;
const loadMusicData = function () {
  musicData = [];
  let mids = (currentCollection == 0) ? Object.keys(map) : playlistInfo[currentCollection]["mids"];
  for (let mid of mids){
    meta = {
      title: map[mid], 
      collection: playlistInfo[currentCollection]["name"], 
      musicPath: "./" + mid + ".mp3"
    }
    musicData.push(meta);
  }
}

/**
 * 填充播放列表
 */
const playlist = document.querySelector("[data-music-list]");
let playlistItems;
const fillPlayList = function () {
  playlist.innerHTML = ``;
  const fragment = document.createDocumentFragment();
  for (let i = 0, len = musicData.length; i < len; i++) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    const p = document.createElement('p');
    const div = document.createElement('div');
    const span = document.createElement('span');
    button.classList.add('music-item');
    button.setAttribute('data-playlist-toggler', '');
    button.setAttribute('data-playlist-item', i);
    p.classList.add('txt-cover');
    p.textContent = musicData[i].title;
    div.classList.add('item-icon');
    span.classList.add('material-symbols-rounded');
    span.textContent = 'equalizer';
    li.appendChild(button);
    button.appendChild(p);
    button.appendChild(div);
    div.appendChild(span);
    fragment.appendChild(li);
  }
  playlist.appendChild(fragment);
  playlistItems = document.querySelectorAll("[data-playlist-item]");
  attachTogglePlaylist();
  attachSwitchMusic();
}

/**
 * 窗体变窄时，点击按钮弹出播放列表
 */
const playlistSideModal = document.querySelector("[data-playlist]");
const overlay = document.querySelector("[data-overlay]");
const togglePlaylist = function () {
  playlistSideModal.classList.toggle("active");
  overlay.classList.toggle("active");
  document.body.classList.toggle("modalActive");
}
const attachTogglePlaylist = function () {
  let playlistTogglers = document.querySelectorAll("[data-playlist-toggler]");
  addEventOnElements(playlistTogglers, "click", togglePlaylist);
}

/**
 * 为当前音乐添加播放高亮，取消上一首音乐的播放高亮
 */
const highlightMusic = function () {
  playlistItems[lastPlayedMusic].classList.remove("playing");
  playlistItems[currentMusic].classList.add("playing");
  playlist.children[currentMusic].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * 展示音乐的标题和所属歌单，设置音源
 */
const playerTitle = document.querySelector("[data-title]");
const playerCollection = document.querySelector("[data-collection]");
const audioSource = new Audio();
const loadMusic = function () {
  playerTitle.textContent = musicData[currentMusic].title;
  playerCollection.textContent = musicData[currentMusic].collection;
  audioSource.src = musicData[currentMusic].musicPath;
  audioSource.addEventListener("loadeddata", updateDuration);
}

/**
 * 切换音乐并播放
 * 鼠标单击音乐时，执行此动作
 */
const switchMusic = function () {
  highlightMusic();
  loadMusic();
  playMusic();
}
const attachSwitchMusic = () => 
addEventOnElements(playlistItems, "click", function () {
  lastPlayedMusic = currentMusic;
  currentMusic = Number(this.dataset.playlistItem);
  switchMusic();
});

/**
 * 将时间值转为时间显示文本
 */
const getTimecode = function (duration) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.ceil(duration - (minutes * 60));
  const timecode = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  return timecode;
}

/**
 * 音源加载后执行：设置进度条的最大值和显示时间最大值
 */
const playerDuration = document.querySelector("[data-duration]");
const playerSeekRange = document.querySelector("[data-seek]");
const updateDuration = function () {
  playerSeekRange.max = Math.ceil(audioSource.duration);
  playerDuration.textContent = getTimecode(Number(playerSeekRange.max));
}

/**
 * 播放按钮：切换播放与暂停
 */
const playBtn = document.querySelector("[data-play-btn]");
let playTimer;
const playMusic = function () {
  if (audioSource.paused) {
    audioSource.play();
    playBtn.classList.add("active");
    playTimer = setInterval(updateRunningTime, 500);
  } else {
    audioSource.pause();
    playBtn.classList.remove("active");
    clearInterval(playTimer);
  }
}
playBtn.addEventListener("click", playMusic);

/**
 * 播放时周期执行：更新进度条的数值和显示时间数值，检查是否播放结束
 */
const playerRunningTime = document.querySelector("[data-running-time");
const updateRunningTime = function () {
  if (audioSource.ended) {
    playBtn.classList.remove("active");
    audioSource.currentTime = 0;
    skipNext();
  }
  playerSeekRange.value = audioSource.currentTime;
  playerRunningTime.textContent = getTimecode(audioSource.currentTime);
  updateRangeFill();
}

/**
 * 更新滑动条的视觉效果，包括进度条和音量条
 */
const ranges = document.querySelectorAll("[data-range]");
const rangeFill = document.querySelector("[data-range-fill]");
const updateRangeFill = function () {
  let element = Array.from(ranges).includes(this) ? this : ranges[0];
  const rangeValue = (element.value / element.max) * 100;
  element.nextElementSibling.style.width = `${rangeValue}%`;
}
addEventOnElements(ranges, "input", updateRangeFill);

/**
 * 拨动进度条时设置进度
 */
const seek = function () {
  audioSource.currentTime = playerSeekRange.value;
  playerRunningTime.textContent = getTimecode(playerSeekRange.value);
}
playerSeekRange.addEventListener("input", seek);

/**
 * 下一首
 */
const playerSkipNextBtn = document.querySelector("[data-skip-next]");
const skipNext = function () {
  lastPlayedMusic = currentMusic;
  if (playMode == playModeType.SHUFFLE) {
    if (shuffleList.length == 0) { createShuffleList(); }
    currentMusic = shuffleList[(shuffleList.indexOf(currentMusic) + 1) % shuffleList.length];
  } else if (playMode == playModeType.REPEAT) {
  } else {
    currentMusic = (currentMusic + 1) % musicData.length;
  }
  switchMusic();
}
playerSkipNextBtn.addEventListener("click", skipNext);

/**
 * 上一首
 */
const playerSkipPrevBtn = document.querySelector("[data-skip-prev]");
const skipPrev = function () {
  lastPlayedMusic = currentMusic;
  if (playMode == playModeType.SHUFFLE) {
    if (shuffleList.length == 0) { createShuffleList(); }
    currentMusic = shuffleList[(shuffleList.indexOf(currentMusic) - 1 + shuffleList.length) % shuffleList.length];
  } else if (playMode == playModeType.REPEAT) {
  } else {
    currentMusic = (currentMusic - 1 + musicData.length) % musicData.length;
  }
  switchMusic();
}
playerSkipPrevBtn.addEventListener("click", skipPrev);

/**
 * 创建随机音乐下标列表
 */
const shuffleArray = function (array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
const createShuffleList = () => shuffleList = shuffleArray([...Array(musicData.length).keys()]);

/**
 * 播放模式按钮：切换列表循环、单曲循环、随机播放
 */
const playerModeBtn = document.querySelector("[data-play-mode]");
const playerModeBtnActive = playerModeBtn.querySelector("[data-play-mode-active]");
const changeMode = function () {
  playMode = (playMode + 1) % 3;
  this.classList.remove("active");
  audioSource.loop = false;
  if (playMode == playModeType.CYCLE) {
  } else if (playMode == playModeType.REPEAT) {
    this.classList.add("active");
    audioSource.loop = true;
    playerModeBtnActive.textContent = "repeat_one";
  } else if (playMode == playModeType.SHUFFLE) {
    this.classList.add("active");
    playerModeBtnActive.textContent = "shuffle";
  }
}
playerModeBtn.addEventListener("click", changeMode);

/**
 * 播放速率切换
 */
const playerRateBtn = document.querySelector("[data-play-rate]");
const playerRateBtnActive = playerRateBtn.querySelector("[data-play-rate-active]");
const changeRate = function () {
  if (playRate == 0.5) {
    playRate = 1;
  } else if (playRate == 1) {
    playRate = 1.5;
    playerRateBtnActive.textContent = "speed_1_5x";
  } else if (playRate == 1.5) {
    playRate = 2;
    playerRateBtnActive.textContent = "speed_2x";
  } else if (playRate == 2) {
    playRate = 0.5;
    playerRateBtnActive.textContent = "speed_0_5x";
  }
  playRate == 1 ? this.classList.remove("active") : this.classList.add("active");
  audioSource.playbackRate = playRate;
  audioSource.defaultPlaybackRate = playRate;
}
playerRateBtn.addEventListener("click", changeRate);

/**
 * 调整音量
 */
const playerVolumeRange = document.querySelector("[data-volume]");
const playerVolumeBtn = document.querySelector("[data-volume-btn]");
const changeVolume = function () {
  audioSource.volume = playerVolumeRange.value;
  audioSource.muted = false;
  if (audioSource.volume == 0) {
    playerVolumeBtn.children[0].textContent = "volume_off";
  } else if (audioSource.volume <= 0.1) {
    playerVolumeBtn.children[0].textContent = "volume_mute";
  } else if (audioSource.volume <= 0.5) {
    playerVolumeBtn.children[0].textContent = "volume_down";
  } else {
    playerVolumeBtn.children[0].textContent = "volume_up";
  }
}
playerVolumeRange.addEventListener("input", changeVolume);

/**
 * 静音
 */
const muteVolume = function () {
  if (!audioSource.muted) {
    audioSource.muted = true;
    playerVolumeBtn.children[0].textContent = "volume_off";
  } else {
    changeVolume();
  }
}
playerVolumeBtn.addEventListener("click", muteVolume);

/**
 * 展示歌单列表
 */
const collectionList = document.querySelector("[data-collection-list]");
const showCollection = function () {
  collectionList.innerHTML = ``;
  const fragment = document.createDocumentFragment();
  for (let i = 0, len = playlistInfo.length; i < len; i++) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    const p = document.createElement('p');
    button.classList.add('collection-item');
    button.setAttribute('data-collection-item', i);
    p.classList.add('txt-collection');
    p.textContent = playlistInfo[i]["name"];
    li.appendChild(button);
    button.appendChild(p);
    fragment.appendChild(li);
  }
  collectionList.appendChild(fragment);
  let collectionItems = document.querySelectorAll("[data-collection-item]");
  addEventOnElements(collectionItems, "click", function () {
    currentCollection = Number(this.dataset.collectionItem);
    refreshCollection();
  });
}

/**
 * 按歌单更新歌曲
 */
const refreshCollection = function () {
  playBtn.classList.remove("active");
  clearInterval(playTimer);
  audioSource.currentTime = 0;
  updateRunningTime();
  currentMusic = lastPlayedMusic = 0;
  shuffleList = [];
  loadMusicData();
  fillPlayList();
  loadMusic();
  highlightMusic();
}


/**
 * 初始化
 */
showCollection();
refreshCollection();

playerVolumeRange.value = 0.5;
playerVolumeRange.dispatchEvent(new Event("input"));
changeVolume();

