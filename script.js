const video = document.querySelector('.video');
const playBtn = document.querySelector('.play-btn');
const progressBar = document.querySelector('.progress-bar');
const volumeBar = document.querySelector('.volume-bar');
const timeDisplay = document.querySelector('.time-display');
const playlist = document.getElementById('playlist');

const inputUrl = document.getElementById('input-url');
const inputTitle = document.getElementById('input-title');
const generatorBtn = document.getElementById('generator-btn');

let isInitialLoaded = false;

// [복원] 페이지 로드 시 압축된 코드를 해독하여 재생 목록 빌드
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('list'); // 💡 '?list=...' 한 개만 가져옴

  if (!compressedData) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#555;">재생 목록이 비어 있습니다.<br>상단에 mp4 주소를 등록해 보세요!</li>';
    return;
  }

  try {
    // Base64 디코딩 후 UTF-8 한글 문자열로 복원하고 JSON 배열로 파싱
    const decodedJson = decodeURIComponent(atob(compressedData));
    const videoList = JSON.parse(decodedJson);

    videoList.forEach((vid, index) => {
      const li = document.createElement('li');
      li.dataset.src = vid.url;
      li.textContent = vid.title;
      
      if (index === 0) {
        li.classList.add('active');
        video.src = li.dataset.src;
        video.load();
      }
      playlist.appendChild(li);
    });
  } catch (e) {
    console.error("데이터 복원 실패:", e);
    playlist.innerHTML = '<li style="color:#ff5b5b;">잘못되거나 손상된 URL 주소입니다.</li>';
  }
});

// 💡 [압축] 기존 리스트와 새 입력을 모아 구조화된 텍스트로 압축 후 이동
generatorBtn.addEventListener('click', () => {
  const newUrl = inputUrl.value.trim();
  const newTitle = inputTitle.value.trim() || "새로운 비디오";

  if (!newUrl) {
    alert("동영상 파일 주소(.mp4)를 입력해 주세요!");
    return;
  }

  const currentList = [];

  // 1. 기존 리스트 UI에 표기된 누적 비디오 정보들 객체로 수집
  playlist.querySelectorAll('li').forEach(item => {
    if (item.dataset.src) {
      currentList.push({ url: item.dataset.src, title: item.textContent });
    }
  });

  // 2. 방금 추가한 신규 비디오 데이터 병합
  currentList.push({ url: newUrl, title: newTitle });

  // 3. 전체 배열 데이터를 문자열(JSON)로 만든 뒤, 한글 깨짐 방지 인코딩 후 Base64로 완전 압축
  const jsonString = encodeURIComponent(JSON.stringify(currentList));
  const compressedBase64 = btoa(jsonString);

  // 4. 단 한 줄의 깔끔한 압축 주소 파라미터로 이동!
  window.location.search = `list=${compressedBase64}`;
});

/* --- 비디오 플레이어 코어 컨트롤러 (동일) --- */
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
  video.load(); video.play();
  playBtn.textContent = '❚❚';
});

video.addEventListener('ended', () => {
  const currentActive = playlist.querySelector('.active');
  if (!currentActive) return;
  const nextVideo = currentActive.nextElementSibling;
  if (nextVideo && nextVideo.dataset.src) nextVideo.click();
});
