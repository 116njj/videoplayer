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

let isSpacePressed = false;

// 깃허브 호스팅 계정 도메인 videos/ 폴더 절대 경로 추출 공식
const GITHUB_VIDEOS_BASE = window.location.origin + window.location.pathname.replace('index.html', '') + 'videos/';

// 다국어 안심 Base64 인코더/디코더 모듈 (한글 깨짐 원천 방지)
function utoa(str) { return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1))); }
function atou(str) { return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }

// 1. [복원] 주소창의 list 코드를 파싱하여 리스트 빌드
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('list');

  if (!compressedData) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#555;">재생 목록이 비어 있습니다.<br>상단에 파일명과 제목을 입력해 등록하세요!</li>';
    return;
  }

  try {
    const decodedJson = atou(compressedData);
    const videoList = JSON.parse(decodedJson);

    videoList.forEach((vid, index) => {
      const li = document.createElement('li');
      li.dataset.src = GITHUB_VIDEOS_BASE + vid.file; 
      li.dataset.filename = vid.file; 
      li.textContent = vid.title;
      
      if (index === 0) {
        li.classList.add('active');
        video.src = li.dataset.src; 
        video.load();
      }
      playlist.appendChild(li);
    });
  } catch (e) {
    playlist.innerHTML = '<li style="color:#ff5b5b;">손상되었거나 잘못된 고유 단축 주소입니다.</li>';
  }
});

// 2. [등록] 파일명과 제목을 누적 압축 변환
generatorBtn.addEventListener('click', () => {
  const filenameValue = inputFilename.value.trim();
  const titleValue = inputTitle.value.trim() || "새로운 비디오";

  if (!filenameValue) {
    alert("videos 폴더에 올린 실제 파일명(예: test.mp4)을 정확히 입력해 주세요!");
    return;
  }

  const currentList = [];
  playlist.querySelectorAll('li').forEach(item => {
    if (item.dataset.filename) {
      currentList.push({ file: item.dataset.filename, title: item.textContent.trim() });
    }
  });

  currentList.push({ file: filenameValue, title: titleValue });

  const compressedBase64 = utoa(JSON.stringify(currentList));
  window.location.search = `list=${compressedBase64}`;
});

// 리스트 아이템 클릭 시 작동
playlist.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li || !li.dataset.src) return;

  document.querySelectorAll('#playlist li').forEach(item => item.classList.remove('active'));
  li.classList.add('active');

  video.src = li.dataset.src;
  video.load(); 
  video.play(); 
  playBtn.textContent = '❚❚';
});

// 공유 링크 주소 추출 복사
shareBtn.addEventListener('click', () => {
  if (!window.location.search.includes('list=')) {
    alert("공유할 목록이 비어 있습니다!");
    return;
  }
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("성공! 전 세계 어디서든 재생 오류가 없는 단축 공유 주소가 클립보드에 복사되었습니다."));
});

// 전체화면 토글 기능
function toggleFullscreen() {
  const videoContainer = document.getElementById('video-container');
  if (!document.fullscreenElement) {
    if (videoContainer.requestFullscreen) videoContainer.requestFullscreen();
    else if (videoContainer.webkitRequestFullscreen) videoContainer.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}
if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);

/* --- ⌨️ 유튜브 스타일 명품 단축키 시스템 --- */
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
      // 💡 [방어 코드] 영상 로드가 제대로 안 되었을 때 탐색하면 생기는 나눗셈 NaN 에러 방지
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
  // 💡 [방어 코드] 404 에러 등으로 영상이 주입되지 않은 먹통 상태일 때 재생 예외 우회
  if (!video.src || video.error) return;
  video.paused ? video.play() : video.pause(); 
  playBtn.textContent = video.paused ? '▶' : '❚❚'; 
}

function updateProgress() {
  // 💡 [방어 코드] 404 터져서 비디오 데이터가 전혀 없거나 정상 수치가 아닐 때 진행 바 연산 멈추기 (161번째 라인 에러 완벽 해결)
  if (!video.duration || isNaN(video.duration) || !isFinite(video.duration)) {
    timeDisplay.textContent = "00:00 / 00:00";
    return;
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
  if (!isNaN(video.duration) && isFinite(video.duration)) {
    video.currentTime = (progressBar.value * video.duration) / 100; 
  }
});
volumeBar.addEventListener('input', () => { video.volume = volumeBar.value; });

video.addEventListener('ended', () => {
  const currentActive = playlist.querySelector('.active');
  if (!currentActive) return;
  const nextVideo = currentActive.nextElementSibling;
  if (nextVideo && nextVideo.dataset.src) nextVideo.click();
});
