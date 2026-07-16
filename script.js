const video = document.querySelector('.video');
const playBtn = document.querySelector('.play-btn');
const progressBar = document.querySelector('.progress-bar');
const volumeBar = document.querySelector('.volume-bar');
const timeDisplay = document.querySelector('.time-display');
const playlist = document.getElementById('playlist');

// 등록 인터페이스 노드 추출
const inputUrl = document.getElementById('input-url');
const inputTitle = document.getElementById('input-title');
const generatorBtn = document.getElementById('generator-btn');

let isInitialLoaded = false;

// 1. [기존 기능] 페이지가 열릴 때 현재 URL에 박혀있는 영상 정보 추출하여 파싱
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const urls = urlParams.getAll('url');
  const titles = urlParams.getAll('title');

  if (urls.length === 0) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#555;">재생 목록이 비어 있습니다.<br>상단에 mp4 주소를 등록해 보세요!</li>';
    return;
  }

  urls.forEach((url, index) => {
    const title = titles[index] || `영상 ${index + 1}`;
    const li = document.createElement('li');
    li.dataset.src = decodeURIComponent(url);
    li.textContent = decodeURIComponent(title);
    
    if (index === 0) {
      li.classList.add('active');
      video.src = li.dataset.src;
      video.load();
    }
    playlist.appendChild(li);
  });
});

// 2. 💡 [핵심 신규 기능] 입력창에 정보를 쓰고 버튼을 누르면 완성된 파라미터 URL 주소로 강제 이동
generatorBtn.addEventListener('click', () => {
  const urlValue = inputUrl.value.trim();
  const titleValue = inputTitle.value.trim() || "새로운 비디오";

  if (!urlValue) {
    alert("동영상 파일 주소(.mp4)를 입력해 주세요!");
    return;
  }

  // 현재 브라우저 URL 정보 분석
  const currentParams = new URLSearchParams(window.location.search);

  // 기존 플레이리스트에 누적으로 추가하고 싶다면 뒤에 새 파라미터 덧붙이기
  currentParams.append('url', encodeURIComponent(urlValue));
  currentParams.append('title', encodeURIComponent(titleValue));

  // 조립된 최종 쿼리문을 들고 해당 URL 주소로 강제 페이지 리프레시 이동!
  window.location.search = currentParams.toString();
});

/* --- 비디오 플레이어 제어 로직 --- */
function togglePlay() {
  video.paused ? video.play() : video.pause();
  playBtn.textContent = video.paused ? '▶' : '❚❚';
}

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

video.addEventListener('ended', () => {
  const currentActive = playlist.querySelector('.active');
  if (!currentActive) return;
  const nextVideo = currentActive.nextElementSibling;
  if (nextVideo && nextVideo.dataset.src) nextVideo.click();
});
