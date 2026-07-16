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

// 💡 현재 내 깃허브 Pages 고유 계정 도메인을 감지하여 내부 videos/ 폴더의 절대 웹 주소를 실시간 자동 조립
const GITHUB_VIDEOS_BASE = window.location.origin + window.location.pathname.replace('index.html', '') + 'videos/';

// 1. [복원 엔진] 페이지 오픈 시 주소창 압축코드(?list=...) 해독 후 실시간 스트리밍 매핑
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('list');

  if (!compressedData) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#555;">재생 목록이 비어 있습니다.<br>상단에 파일명과 제목을 입력해 등록하세요!</li>';
    return;
  }

  try {
    // 코딩애플 상남자 연산법 기반 디코딩 복원
    const decodedJson = decodeURIComponent(atob(compressedData));
    const videoList = JSON.parse(decodedJson);

    videoList.forEach((vid, index) => {
      const li = document.createElement('li');
      li.dataset.src = GITHUB_VIDEOS_BASE + vid.file; // 깃허브 클라우드 동영상 스트리밍 원천 URL 복원 성공!
      li.dataset.filename = vid.file; 
      li.textContent = vid.title;
      
      if (index === 0) {
        li.classList.add('active');
        video.src = li.dataset.src; // 조립된 절대 주소를 꽂아 타인 공유 시 100% 무조건 즉시 재생
        video.load();
      }
      playlist.appendChild(li);
    });
  } catch (e) {
    playlist.innerHTML = '<li style="color:#ff5b5b;">손상되었거나 잘못된 공유 URL 주소입니다.</li>';
  }
});

// 2. [등록 엔진] 기존 목록의 가벼운 파일명들과 신규 정보를 누적 병합해 단 한 줄로 재압축
generatorBtn.addEventListener('click', () => {
  const filenameValue = inputFilename.value.trim();
  const titleValue = inputTitle.value.trim() || "새로운 비디오";

  if (!filenameValue) {
    alert("videos 폴더에 올린 실제 파일명(예: test.mp4)을 입력해 주세요!");
    return;
  }

  const currentList = [];
  
  playlist.querySelectorAll('li').forEach(item => {
    if (item.dataset.filename) {
      currentList.push({ file: item.dataset.filename, title: item.textContent.trim() });
    }
  });

  currentList.push({ file: filenameValue, title: titleValue });

  // 용량 제한 걱정이 없는 경량 텍스트 단축 가공 코어 엔진
  const jsonString = encodeURIComponent(JSON.stringify(currentList));
  const compressedBase64 = btoa(jsonString);

  window.location.search = `list=${compressedBase64}`;
});

// 3. 리스트 아이템 클릭 시 즉시 비디오 엔진 가동
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

// 4. 복사 전송용 통합 단축 주소 복사
shareBtn.addEventListener('click', () => {
  if (!window.location.search.includes('list=')) {
    alert("공유할 플레이리스트 목록이 비어 있습니다!");
    return;
  }
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("URL 링크 압축 및 복사 성공! 이 주소를 다른 사람에게 복붙해서 보내면 전 세계 어디서든 영상이 100% 즉시 시원하게 재생됩니다."))
    .catch(() => alert("주소창 URL 링크를 마우스로 직접 복사해 주세요."));
});

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    if (video.requestFullscreen) video.requestFullscreen();
    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}
fullscreenBtn.addEventListener('click', toggleFullscreen);

/* --- ⌨️ 유튜브 스타일 명품 단축키 시스템 (Space 2배속, ◀, ▶, F) --- */
window.addEventListener('keydown', (e) => {
  if (document.activeElement === inputTitle || document.activeElement === inputFilename) return;

  switch (e.key) {
    case " ":
      e.preventDefault();
      if (!isSpacePressed) { togglePlay(); isSpacePressed = true; } 
      else { video.playbackRate = 2.0; speedBadge.style.opacity = "1"; }
      break;
    case "ArrowRight":
      e.preventDefault(); video.currentTime = Math.min(video.duration, video.currentTime + 5);
      break;
    case "ArrowLeft":
      e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 5);
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

function togglePlay() { video.paused ? video.play() : video.pause(); playBtn.textContent = video.paused ? '▶' : '❚❚'; }
function updateProgress() {
  if (!video.duration) return;
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
progressBar.addEventListener('input', () => { video.currentTime = (progressBar.value * video.duration) / 100; });
volumeBar.addEventListener('input', () => { video.volume = volumeBar.value; });

video.addEventListener('ended', () => {
  const currentActive = playlist.querySelector('.active');
  if (!currentActive) return;
  const nextVideo = currentActive.nextElementSibling;
  if (nextVideo && nextVideo.dataset.src) nextVideo.click();
});
