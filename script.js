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

let encodedVideoData = ""; 
let isSpacePressed = false;

// 1. [복원 엔진] 페이지가 열릴 때 URL 주소창에 내장된 '진짜 비디오 데이터 코드'를 완전 디코딩하여 즉시 스트리밍 재생 세팅
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('list');

  if (!compressedData) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#555;">재생 목록이 비어 있습니다.<br>상단에서 동영상 파일을 선택하세요!</li>';
    return;
  }

  try {
    // URL에 압축되어 있던 동영상 소스 및 타이틀 배열을 완벽 복원
    const decodedJson = decodeURIComponent(atob(compressedData));
    const videoList = JSON.parse(decodedJson);

    videoList.forEach((vid, index) => {
      const li = document.createElement('li');
      li.dataset.src = vid.url; // 💡 여기에 복원된 진짜 동영상 데이터 텍스트 코드가 그대로 보관됨!
      li.textContent = vid.title;
      
      if (index === 0) {
        li.classList.add('active');
        video.src = vid.url; // DB 접근 없이 복원된 원천 주소를 플레이어 소스에 다이렉트 주입하여 재생 대기
        video.load();
      }
      playlist.appendChild(li);
    });
  } catch (e) {
    playlist.innerHTML = '<li style="color:#ff5b5b;">잘못되었거나 손상된 압축 URL 데이터 주소입니다.</li>';
  }
});

// 2. [컴파일러 엔진] 내 컴퓨터에서 mp4 파일을 고르면 즉시 주소창 호환용 텍스트 스트림 코드로 쪼개기 변환
fileUploader.addEventListener('change', (e) => {
  const file = e.target.files;
  if (!file) return;

  inputTitle.value = file.name.replace('.mp4', ''); 
  
  // 데이터 변환 안정성 확보를 위해 대기 가이드 작동
  generatorBtn.disabled = true;
  generatorBtn.textContent = "⏳ 비디오 파일 시스템 압축 및 호스팅 변환 중...";
  generatorBtn.style.opacity = "0.6";

  const reader = new FileReader();
  reader.onload = (event) => {
    encodedVideoData = event.target.result; // 비디오 파일 바이너리 완전 코드화 성공
    
    // 변환 완료 후 안전 락 해제
    generatorBtn.disabled = false;
    generatorBtn.textContent = "🔗 영상 내부 호스팅 및 URL 압축";
    generatorBtn.style.opacity = "1";

    // 선택하자마자 플레이어에서 먼저 즉시 시청 가능하게 처리
    video.src = encodedVideoData;
    video.load();
    video.play();
    playBtn.textContent = '❚❚';
  };
  reader.onerror = () => {
    alert("동영상 파일 파일 포맷 컴파일에 실패했습니다.");
    generatorBtn.disabled = false;
  };
  reader.readAsDataURL(file); 
});

// 3. [통합 엔진] 기존 리스트 데이터(동영상 데이터 포함)와 이번 신규 영상을 합쳐 단 한 줄의 압축 링크 생성
generatorBtn.addEventListener('click', () => {
  const newTitle = inputTitle.value.trim();

  if (!encodedVideoData) {
    alert("동영상 파일 변환이 아직 완료되지 않았습니다. 잠시만 대기 후 눌러주세요!");
    return;
  }
  if (!newTitle) {
    alert("동영상 제목을 작성해 주세요!");
    return;
  }

  const currentList = [];
  
  // 💡 핵심: 기존 목록에 박혀 있던 모든 비디오들의 '진짜 비디오 데이터'를 누락 없이 싹 긁어모음!
  playlist.querySelectorAll('li').forEach(item => {
    if (item.dataset.src) {
      currentList.push({ url: item.dataset.src, title: item.textContent.trim() });
    }
  });

  // 이번에 새로 호스팅 가공 완료한 비디오 텍스트 데이터 병합 누적
  currentList.push({ url: encodedVideoData, title: newTitle });

  // 상남자식 코딩애플 JSON 대용량 원시 변환 레이어 연산 실행
  const jsonString = encodeURIComponent(JSON.stringify(currentList));
  const compressedBase64 = btoa(jsonString);

  // 데이터가 완전 누적 빌드된 주소창으로 리다이렉션 점프 새로고침!
  window.location.search = `list=${compressedBase64}`;
});

// 4. [리스트 재생 엔진] 리스트 제목을 마우스로 클릭하면 저장된 비디오 데이터 소스를 실시간 다이렉트 덤프 재생!
playlist.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li || !li.dataset.src) return;

  document.querySelectorAll('#playlist li').forEach(item => item.classList.remove('active'));
  li.classList.add('active');

  // 외부 연동이나 데이터베이스 매칭 없이 엘리먼트 내부에 각인된 원시 코드로 100% 즉시 강제 재생!
  video.src = li.dataset.src;
  video.load(); 
  video.play(); 
  playBtn.textContent = '❚❚';
});

// 5. 단축 공유 주소 원클릭 캡처 복사
shareBtn.addEventListener('click', () => {
  if (!window.location.search.includes('list=')) {
    alert("공유할 플레이리스트 목록이 비어 있습니다. 영상을 먼저 등록해 주세요!");
    return;
  }
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("현재 재생목록의 모든 파일 정보가 암호화 결합된 단축 공유 주소가 복사되었습니다!"))
    .catch(() => alert("주소창 URL 링크를 마우스로 직접 긁어 복사해 주세요."));
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
