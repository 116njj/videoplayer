const video = document.querySelector('.video');
const playBtn = document.querySelector('.play-btn');
const progressBar = document.querySelector('.progress-bar');
const volumeBar = document.querySelector('.volume-bar');
const timeDisplay = document.querySelector('.time-display');
const fullscreenBtn = document.querySelector('.fullscreen-btn');
const playlist = document.getElementById('playlist');

const inputFilename = document.getElementById('input-filename');
const inputTitle = document.getElementById('input-title');
const generatorBtn = document.getElementById('generator-btn');
const shareBtn = document.getElementById('share-btn');
const speedBadge = document.getElementById('speed-badge');
const videoContainer = document.getElementById('video-container');

let isSpacePressed = false;

// 내 깃허브 Pages 고유 계정 도메인을 감지하여 내부 videos/ 폴더의 절대 웹 주소를 실시간 자동 조립
const GITHUB_VIDEOS_BASE = window.location.origin + window.location.pathname.replace('index.html', '') + 'videos/';

// 다국어 안심 Base64 인코더/디코더 모듈 (한글 깨짐 원천 방지)
function utoa(str) { return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1))); }
function atou(str) { return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }

// 1. [복원 ENGINE] 페이지 오픈 시 주소창 압축코드(?list=...) 해독 후 실시간 스트리밍 매핑
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('list');

  if (!compressedData) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#546e7a;">재생 목록이 비어 있습니다.<br>상단에 파일명과 제목을 입력해 등록하세요!</li>';
    return;
  }

  try {
    const decodedJson = atou(compressedData);
    const videoList = JSON.parse(decodedJson);

    videoList.forEach((vid, index) => {
      createPlaylistItem(vid.file, vid.title, index === 0);
    });
  } catch (e) {
    playlist.innerHTML = '<li style="color:#ef5350;">손상되었거나 잘못된 고유 단축 주소입니다.</li>';
  }
});

// 2. [UI 생성 모듈] 리스트 아이템과 우측 삭제 버튼을 생성하여 결합하는 함수
function createPlaylistItem(file, title, isFirst = false) {
  const li = document.createElement('li');
  li.dataset.src = GITHUB_VIDEOS_BASE + file; 
  li.dataset.filename = file;
  
  const textSpan = document.createElement('span');
  textSpan.className = 'list-item-text';
  textSpan.textContent = title;
  li.appendChild(textSpan);

  const delBtn = document.createElement('button');
  delBtn.className = 'item-del-btn';
  delBtn.innerHTML = `
    <svg xmlns="http://w3.org" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  `;
  
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    li.remove(); 
    rebuildUrlSearch();
  });
  li.appendChild(delBtn);

  if (isFirst) {
    li.classList.add('active');
    video.src = li.dataset.src; 
    video.load();
  }
  
  playlist.appendChild(li);
}

// 3. [재압축 ENGINE] 화면 리스트 상태를 파악하여 주소창(URL)을 동기화시키는 핵심 함수
function rebuildUrlSearch() {
  const currentList = [];
  playlist.querySelectorAll('li').forEach(item => {
    if (item.dataset.filename) {
      const cleanTitle = item.querySelector('.list-item-text').textContent.trim();
      currentList.push({ file: item.dataset.filename, title: cleanTitle });
    }
  });

  if (currentList.length === 0) {
    window.location.search = "";
    return;
  }

  const compressedBase64 = utoa(JSON.stringify(currentList));
  window.location.search = `list=${compressedBase64}`;
}

// 4. [등록 ENGINE] 파일명과 제목을 결합하여 누적 리스트 주소창 생성
generatorBtn.addEventListener('click', () => {
  const filenameValue = inputFilename.value.trim();
  const titleValue = inputTitle.value.trim() || "새로운 비디오";

  if (!filenameValue) {
    alert("videos 폴더에 올린 실제 파일명(예: test.mp4)을 정확히 기입하세요!");
    return;
  }

  const currentList = [];
  playlist.querySelectorAll('li').forEach(item => {
    if (item.dataset.filename) {
      const cleanTitle = item.querySelector('.list-item-text').textContent.trim();
      currentList.push({ file: item.dataset.filename, title: cleanTitle });
    }
  });

  currentList.push({ file: filenameValue, title: titleValue });

  const compressedBase64 = utoa(JSON.stringify(currentList));
  window.location.search = `list=${compressedBase64}`;
});

// 리스트 클릭 시 해당 비디오 스트리밍 실행
playlist.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li || !li.dataset.src) return;

  document.querySelectorAll('#playlist li').forEach(item => item.classList.remove('active'));
  li.classList.add('active');

  video.src = li.dataset.src;
  video.load(); video.play(); playBtn.textContent = '❚❚';
});

// 주소창 URL 공유 클립보드 원클릭 캡처 복사
shareBtn.addEventListener('click', () => {
  if (!window.location.search.includes('list=')) {
    alert("공유할 목록이 비어 있습니다!");
    return;
  }
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("성공! 고유 공유용 단축 주소창이 클립보드에 복사되었습니다."));
});

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    if (videoContainer.requestFullscreen) videoContainer.requestFullscreen();
    else if (videoContainer.webkitRequestFullscreen) videoContainer.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}
if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);

/* --- ⌨️ 유튜브 스타일 명품 단축키 시스템 (볼륨 제어 기능 보강) --- */
window.addEventListener('keydown', (e) => {
  if (document.activeElement === inputTitle || document.activeElement === inputFilename) return;

  switch (e.key) {
    case " ":
      e.preventDefault();
      if (!isSpacePressed) { togglePlay(); isSpacePressed = true; } 
      else { video.playbackRate = 2.0; speedBadge.style.opacity = "1"; }
      break;
    case "ArrowRight":
      e.preventDefault(); 
      if (!isNaN(video.duration) && isFinite(video.duration)) {
        video.currentTime = Math.min(video.duration, video.currentTime + 5);
      }
      break;
    case "ArrowLeft":
      e.preventDefault(); 
      if (!isNaN(video.duration) && isFinite(video.duration)) {
        video.currentTime = Math.max(0, video.currentTime - 5);
      }
      break;
    // 💡 [신규 기능] 위쪽 방향키: 볼륨 5% 올리기
    case "ArrowUp":
      e.preventDefault();
      video.volume = Math.min(1.0, video.volume + 0.05);
      volumeBar.value = video.volume; // UI 슬라이더 위치 연동
      break;
    // 💡 [신규 기능] 아래쪽 방향키: 볼륨 5% 내리기
    case "ArrowDown":
      e.preventDefault();
      video.volume = Math.max(0.0, video.volume - 0.05);
      volumeBar.value = video.volume; // UI 슬라이더 위치 연동
      break;
    case "f":
    case "F":
      e.preventDefault(); toggleFullscreen();
      break;
  }
});

window.addEventListener('keyup', (e) => {
  if (document.activeElement === inputTitle || document.activeElement === inputFilename) return;
  if (e.key === " ") {
    e.preventDefault(); isSpacePressed = false; video.playbackRate = 1.0; speedBadge.style.opacity = "0";
  }
});

function togglePlay() { 
  if (!video.src || video.error) return;
  video.paused ? video.play() : video.pause(); playBtn.textContent = video.paused ? '▶' : '❚❚'; 
}

function updateProgress() {
  if (!video.duration || isNaN(video.duration) || !isFinite(video.duration)) {
    timeDisplay.textContent = "00:00 / 00:00"; return;
  }
  progressBar.value = (video.currentTime / video.duration) * 100;
  const curMin = String(Math.floor(video.currentTime / 60)).padStart(2, '0');
  const curSec = String(Math.floor(video.currentTime % 60)).padStart(2, '0');
  const durMin = String(Math.floor(video.duration / 60)).padStart(2, '0');
  const durSec = String(Math.floor(video.duration % 60)).padStart(2, '0');
  timeDisplay.textContent = `${curMin}:${curSec} / ${durMin}:${durSec}`;
}

playBtn.addEventListener('click', togglePlay);
video.addEventListener('click', togglePlay);
video.addEventListener('timeupdate', updateProgress);
progressBar.addEventListener('input', () => { 
  if (!isNaN(video.duration) && isFinite(video.duration)) { video.currentTime = (progressBar.value * video.duration) / 100; }
});
volumeBar.addEventListener('input', () => { video.volume = volumeBar.value; });

video.addEventListener('ended', () => {
  const currentActive = playlist.querySelector('.active');
  if (!currentActive) return;
  const nextVideo = currentActive.nextElementSibling;
  if (nextVideo && nextVideo.dataset.src) nextVideo.click();
});
