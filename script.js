const video = document.querySelector('.video');
const playBtn = document.querySelector('.play-btn');
const progressBar = document.querySelector('.progress-bar');
const volumeBar = document.querySelector('.volume-bar');
const timeDisplay = document.querySelector('.time-display');
const fullscreenBtn = document.querySelector('.fullscreen-btn');
const playlist = document.getElementById('playlist');

const fileUploader = document.getElementById('file-uploader');
const inputTitle = document.getElementById('input-title');
const generatorBtn = document.getElementById('generator-btn');
const shareBtn = document.getElementById('share-btn');
const speedBadge = document.getElementById('speed-badge');

let currentFileBlob = null;
let isSpacePressed = false;

// 1. 페이지 로드 시 URL 압축 코드 해석 후 리스트 복원
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('list');

  if (!compressedData) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#555;">재생 목록이 비어 있습니다.<br>상단에서 동영상 파일을 선택하세요!</li>';
    return;
  }

  try {
    const decodedJson = decodeURIComponent(atob(compressedData));
    const titleList = JSON.parse(decodedJson);

    titleList.forEach((title, index) => {
      const li = document.createElement('li');
      li.textContent = title;
      
      if (index === 0) {
        li.classList.add('active');
        playlist.innerHTML = `<li class='active'>📌 [${title}] 재생 대기 중<br><small style="color:#ff2e7e; font-size:11px;">(내 컴퓨터의 영상 파일을 선택하면 즉시 매칭 재생됩니다!)</small></li>`;
      } else {
        playlist.appendChild(li);
      }
    });
  } catch (e) {
    playlist.innerHTML = '<li style="color:#ff5b5b;">손상된 단축 주소입니다.</li>';
  }
});

// 2. 파일 선택 시 메모리에 스트리밍 주소 매핑 및 즉시 재생
fileUploader.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  currentFileBlob = file; 
  inputTitle.value = file.name.replace('.mp4', ''); 

  const objectURL = URL.createObjectURL(file);
  video.src = objectURL;
  video.load();
  video.play();
  playBtn.textContent = '❚❚';
});

// 3. 등록 버튼 누르면 제목들을 어레이로 모아 주소창에 싹 집어넣기
generatorBtn.addEventListener('click', () => {
  const newTitle = inputTitle.value.trim();

  if (!currentFileBlob || !newTitle) {
    alert("먼저 '동영상 파일 선택' 버튼을 눌러 파일을 등록해 주세요!");
    return;
  }

  const currentTitles = [];
  playlist.querySelectorAll('li').forEach(item => {
    if (item.textContent && !item.textContent.includes("비어 있습니다") && !item.textContent.includes("재생 대기")) {
      currentTitles.push(item.textContent.trim());
    }
  });

  currentTitles.push(newTitle);

  const jsonString = encodeURIComponent(JSON.stringify(currentTitles));
  const compressedBase64 = btoa(jsonString);

  window.location.search = `list=${compressedBase64}`;
});

playlist.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li || li.style.color === 'rgb(85, 85, 85)') return;

  document.querySelectorAll('#playlist li').forEach(item => item.classList.remove('active'));
  li.classList.add('active');

  if (currentFileBlob) {
    video.src = URL.createObjectURL(currentFileBlob);
    video.load();
    video.play();
    playBtn.textContent = '❚❚';
  }
});

shareBtn.addEventListener('click', () => {
  if (!window.location.search.includes('list=')) {
    alert("공유할 플레이리스트 목록이 비어 있습니다!");
    return;
  }
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("URL 압축 성공! 단축 공유 링크가 클립보드에 복사되었습니다."));
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

/* --- ⌨️ 유튜브 스타일 고급 단축키 엔진 --- */
window.addEventListener('keydown', (e) => {
  if (document.activeElement === inputTitle) return;

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
  if (document.activeElement === inputTitle) return;
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
  if (nextVideo) nextVideo.click();
});
