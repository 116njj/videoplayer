const video = document.querySelector('.video');
const playBtn = document.querySelector('.play-btn');
const progressBar = document.querySelector('.progress-bar');
const volumeBar = document.querySelector('.volume-bar');
const timeDisplay = document.querySelector('.time-display');
const fullscreenBtn = document.querySelector('.fullscreen-btn');
const playlist = document.getElementById('playlist');

const fileUploader = document.getElementById('file-uploader');
const inputUrl = document.getElementById('input-url');
const inputTitle = document.getElementById('input-title');
const generatorBtn = document.getElementById('generator-btn');
const shareBtn = document.getElementById('share-btn');

let isInitialLoaded = false;

// 1. [복원] 페이지 로드 시 URL 내부 단축 암호문 압축 해제
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('list');

  if (!compressedData) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#555;">재생 목록이 비어 있습니다.<br>상단에 mp4 주소를 등록해 보세요!</li>';
    return;
  }

  try {
    // 한글 및 기호 안전 해독 연산
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

// 2. 💡 [자동설정] 파일 탐색기에서 파일을 고르면 주소와 제목을 인풋창에 자동 입력
fileUploader.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 브라우저 내부에서 임시로 재생 가능한 가상 링크(Blob URL) 객체 추출
  const objectURL = URL.createObjectURL(file);
  
  inputUrl.value = objectURL; // 인풋창에 링크 주소 강제 세팅
  inputTitle.value = file.name.replace('.mp4', ''); // 확장자를 제외한 파일명을 제목에 세팅
});

// 3. [등록] 기존 축적 리스트 데이터 취합 후 통합 단축 링크로 갱신 이동
generatorBtn.addEventListener('click', () => {
  const newUrl = inputUrl.value.trim();
  const newTitle = inputTitle.value.trim() || "새로운 비디오";

  if (!newUrl) {
    alert("동영상 파일을 선택하여 주소를 생성해 주세요!");
    return;
  }

  const currentList = [];
  playlist.querySelectorAll('li').forEach(item => {
    if (item.dataset.src) {
      currentList.push({ url: item.dataset.src, title: item.textContent });
    }
  });

  currentList.push({ url: newUrl, title: newTitle });

  // 하나의 JSON 텍스트 배열로 압축 및 완전 암호화 가공
  const jsonString = encodeURIComponent(JSON.stringify(currentList));
  const compressedBase64 = btoa(jsonString);

  window.location.search = `list=${compressedBase64}`;
});

// 4. 💡 [단축공유] 현재 압축 주소를 클립보드에 원클릭 자동 복사
shareBtn.addEventListener('click', () => {
  if (!window.location.search.includes('list=')) {
    alert("공유할 플레이리스트 목록이 비어 있습니다. 영상을 먼저 등록해 주세요!");
    return;
  }
  
  // 현재 완성형 주소를 통째로 가져와 클립보드로 전송
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("현재 재생목록이 압축된 단축 공유 링크가 클립보드에 복사되었습니다!"))
    .catch(() => alert("링크 복사에 실패했습니다. 주소창을 직접 복사해 주세요."));
});

// 5. 💡 [전체화면] 전체 화면 이벤트 바인딩
fullscreenBtn.addEventListener('click', () => {
  if (video.requestFullscreen) {
    video.requestFullscreen();
  } else if (video.webkitRequestFullscreen) { /* 사파리 호환성 */
    video.webkitRequestFullscreen();
  }
});

/* --- 비디오 기본 구동부 엔진 --- */
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
