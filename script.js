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

let isInitialLoaded = false;
let tempVideoUrl = ""; // 💡 화면에 안 보이고 내부에만 가상 주소를 안전하게 저장할 숨김 변수

// 1. [복원] 페이지 오픈 시 단축 압축 데이터 해독 연산
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('list');

  if (!compressedData) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#555;">재생 목록이 비어 있습니다.<br>상단에서 동영상 파일을 선택해 보세요!</li>';
    return;
  }

  try {
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
    isInitialLoaded = true;
  } catch (e) {
    playlist.innerHTML = '<li style="color:#ff5b5b;">잘못되었거나 손상된 단축 주소입니다.</li>';
  }
});

// 2. [자동설정] 주소 입력창 노출 없이 파일 변경 즉시 내부 전역 메모리에 동영상 소스 안착
fileUploader.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  tempVideoUrl = URL.createObjectURL(file); // 내부 메모리에 안전하게 매핑
  inputTitle.value = file.name.replace('.mp4', ''); // 인풋창엔 타이틀만 깔끔히 자동 완성
});

// 3. [등록] 주소창 누락 에러 원천 차단 및 통합 데이터 압축 이주
generatorBtn.addEventListener('click', () => {
  const newTitle = inputTitle.value.trim() || "새로운 비디오";

  // 인풋박스 대신 내부 변수 검증을 거침으로써 주소 오류 완벽 차단
  if (!tempVideoUrl) {
    alert("먼저 '동영상 파일 선택' 버튼을 눌러 비디오를 등록해 주세요!");
    return;
  }

  const currentList = [];
  playlist.querySelectorAll('li').forEach(item => {
    if (item.dataset.src) {
      currentList.push({ url: item.dataset.src, title: item.textContent });
    }
  });

  currentList.push({ url: tempVideoUrl, title: newTitle });

  const jsonString = encodeURIComponent(JSON.stringify(currentList));
  const compressedBase64 = btoa(jsonString);

  window.location.search = `list=${compressedBase64}`;
});

// 4. [단축공유] 단축 링크 원클릭 자동 캡처 복사
shareBtn.addEventListener('click', () => {
  if (!window.location.search.includes('list=')) {
    alert("공유할 플레이리스트 목록이 비어 있습니다. 영상을 먼저 등록해 주세요!");
    return;
  }
  
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("현재 재생목록이 압축된 단축 공유 링크가 클립보드에 복사되었습니다!"))
    .catch(() => alert("주소창을 마우스로 직접 복사해 주세요."));
});

// 5. [전체화면] 브라우저 고유 네이티브 확장 스크린 구동
fullscreenBtn.addEventListener('click', () => {
  if (video.requestFullscreen) video.requestFullscreen();
  else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
});

/* --- 미디어 플레이어 기본 구동부 프레임 --- */
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

playlist.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li || !li.dataset.src) return;
  document.querySelectorAll('#playlist li').forEach(item => item.classList.remove('active'));
  li.classList.add('active');
  video.src = li.dataset.src;
  video.load(); video.play(); playBtn.textContent = '❚❚';
});

video.addEventListener('ended', () => {
  const currentActive = playlist.querySelector('.active');
  if (!currentActive) return;
  const nextVideo = currentActive.nextElementSibling;
  if (nextVideo && nextVideo.dataset.src) nextVideo.click();
});
