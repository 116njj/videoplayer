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

let encodedVideoData = ""; // 동영상 원시 바이너리를 담을 가상 주소 바인딩 변수
let isSpacePressed = false;

// 1. [복원] 페이지 실행 시 URL 압축 쿼리(?list=...)에서 순수 텍스트 및 영상 스트림 해독 추출
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('list');

  if (!compressedData) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#555;">재생 목록이 비어 있습니다.<br>상단에서 동영상 파일을 먼저 로드하세요!</li>';
    return;
  }

  try {
    // btoa 압축의 역연산 해독 실행
    const decodedJson = decodeURIComponent(atob(compressedData));
    const videoList = JSON.parse(decodedJson);

    videoList.forEach((vid, index) => {
      const li = document.createElement('li');
      li.dataset.src = vid.url; // 텍스트 형태의 비디오 소스를 데이터셋에 저장
      li.textContent = vid.title;
      
      if (index === 0) {
        li.classList.add('active');
        video.src = vid.url; // 비동기 간섭 없이 다이렉트로 호스팅 연동
        video.load();
      }
      playlist.appendChild(li);
    });
  } catch (e) {
    playlist.innerHTML = '<li style="color:#ff5b5b;">잘못되었거나 손상된 고유 단축 주소입니다.</li>';
  }
});

// 2. [자동인식] 파일 탐색기에서 영상을 선택하면 호스팅용 원시 텍스트(Base64)로 변환 가공
fileUploader.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  inputTitle.value = file.name.replace('.mp4', ''); // 확장자를 제거한 파일명을 제목에 자동 기입

  const reader = new FileReader();
  reader.onload = (event) => {
    // 💡 파일을 텍스트 형태의 문자열 주소로 영구 변환 (data:video/mp4;base64,...)
    encodedVideoData = event.target.result; 
  };
  reader.readAsDataURL(file); // 대용량 스트리밍 변환 작동
});

// 3. [등록] 기존 리스트 정보들과 새로 추출된 동영상 텍스트 데이터를 한데 모아 압축 및 주소 이동
generatorBtn.addEventListener('click', () => {
  const newTitle = inputTitle.value.trim();

  if (!encodedVideoData) {
    alert("동영상 파일을 먼저 선택해 주세요! (변환 중일 수 있으니 잠시 후 다시 시도하세요)");
    return;
  }
  if (!newTitle) {
    alert("동영상 제목을 적어주세요!");
    return;
  }

  const currentList = [];
  
  // 기존 리스트 UI에 등록된 데이터 긁어오기
  playlist.querySelectorAll('li').forEach(item => {
    if (item.dataset.src) {
      currentList.push({ url: item.dataset.src, title: item.textContent });
    }
  });

  // 새 파일 결합 누적 (자체 호스팅된 텍스트 주소가 누적됨)
  currentList.push({ url: encodedVideoData, title: newTitle });

  // 상남자식 코딩애플 JSON 문자열 통째 인코딩 레이어 연산
  const jsonString = encodeURIComponent(JSON.stringify(currentList));
  const compressedBase64 = btoa(jsonString);

  // 완성된 거대 압축 주소로 점프 리다이렉션 이동!
  window.location.search = `list=${compressedBase64}`;
});

// 재생 목록 아이템 클릭 제어
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

// 현재 전체 리스트 링크 클립보드 원클릭 캡처 복사
shareBtn.addEventListener('click', () => {
  if (!window.location.search.includes('list=')) {
    alert("공유할 플레이리스트 목록이 비어 있습니다!");
    return;
  }
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("축하합니다! 재생목록 전체 파일 정보가 녹아든 상남자식 단축 URL 주소가 복사되었습니다!"))
    .catch(() => alert("주소창 링크를 직접 복사해 주세요."));
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

/* --- ⌨️ 유튜브 스타일 명품 단축키 시스템 --- */
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

/* --- 비디오 플레이어 원초적 핸들러 부품 --- */
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
