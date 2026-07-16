const video = document.querySelector('.video');
const playBtn = document.querySelector('.play-btn');
const progressBar = document.querySelector('.progress-bar');
const volumeBar = document.querySelector('.volume-bar');
const timeDisplay = document.querySelector('.time-display');
const fullscreenBtn = document.querySelector('.fullscreen-btn');
const playlist = document.getElementById('playlist');
const videoContainer = document.getElementById('video-container'); // 💡 부모 컨테이너 수집

const inputFilename = document.getElementById('input-filename');
const inputTitle = document.getElementById('input-title');
const generatorBtn = document.getElementById('generator-btn');
const shareBtn = document.getElementById('share-btn');
const speedBadge = document.getElementById('speed-badge');

let isSpacePressed = false;

// 내 깃허브 고유 호스팅 도메인 주소 자동 추출 공식
const GITHUB_VIDEOS_BASE = window.location.origin + window.location.pathname.replace('index.html', '') + 'videos/';

// 안전한 유니코드 다국어(한글) Base64 변환 압축 세트 (인코딩 에러 원천 차단)
/* 전 세계 브라우저 표준 명세에 맞춘 암호화 가공 처리 */
function utoa(str) { return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1))); }
function atou(str) { return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }

// 1. [복원] 주소창 암호문을 에러 없이 완벽히 해독하여 리스트 연동
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('list');

  if (!compressedData) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#555;">재생 목록이 비어 있습니다.<br>상단에 파일명과 제목을 입력해 등록하세요!</li>';
    return;
  }

  try {
    // 안전 디코더 구동
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

// 2. [등록] 리스트 데이터를 가공 및 한글 깨짐 없이 정밀 압축 전환
generatorBtn.addEventListener('click', () => {
  const filenameValue = inputFilename.value.trim();
  const titleValue = inputTitle.value.trim() || "새로운 비디오";

  if (!filenameValue) {
    alert("videos 폴더에 올린 실제 파일명(예: test.mp4)을 기입하세요!");
    return;
  }

  const currentList = [];
  playlist.querySelectorAll('li').forEach(item => {
    if (item.dataset.filename) {
      currentList.push({ file: item.dataset.filename, title: item.textContent.trim() });
    }
  });

  currentList.push({ file: filenameValue, title: titleValue });

  // 자체 보정 특수 안심 인코더 모듈 통과
  const compressedBase64 = utoa(JSON.stringify(currentList));
  window.location.search = `list=${compressedBase64}`;
});

// 3. 리스트 클릭 시 매칭 스트리밍
playlist.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li || !li.dataset.src) return;

  document.querySelectorAll('#playlist li').forEach(item => item.classList.remove('active'));
  li.classList.add('active');

  video.src = li.dataset.src;
  video.load(); video.play(); playBtn.textContent = '❚❚';
});

// 4. 단축 주소 원클릭 클립보드 패치 복사
shareBtn.addEventListener('click', () => {
  if (!window.location.search.includes('list=')) {
    alert("공유할 목록이 비어 있습니다!");
    return;
  }
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("성공! 전 세계 어디서든 재생 오류가 없는 단축 공유 주소가 클립보드에 복사되었습니다!"))
    .catch(() => alert("주소창 URL 링크를 마우스로 직접 복사해 주세요."));
});

// 5. 💡 [전체화면 핵심 교정] HTML5 순정창을 무력화하고 우리가 만든 네온 UI 상자 전체를 전체화면 처리
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    // 비디오 단독이 아닌, 비디오 컨테이너 상자 전체를 스크린 확장
    if (videoContainer.requestFullscreen) videoContainer.requestFullscreen();
    else if (videoContainer.webkitRequestFullscreen) videoContainer.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}
fullscreenBtn.addEventListener('click', toggleFullscreen);

/* --- ⌨️ 유튜브 스타일 고급 단축키 엔진 --- */
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
