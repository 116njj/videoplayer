const video = document.querySelector('.video');
const playBtn = document.querySelector('.play-btn');
const progressBar = document.querySelector('.progress-bar');
const volumeBar = document.querySelector('.volume-bar');
const timeDisplay = document.querySelector('.time-display');
const fullscreenBtn = document.querySelector('.fullscreen-btn');
const playlist = document.getElementById('playlist');

const inputUrl = document.getElementById('input-url');
const inputTitle = document.getElementById('input-title');
const generatorBtn = document.getElementById('generator-btn');
const shareBtn = document.getElementById('share-btn');
const speedBadge = document.getElementById('speed-badge');

let isSpacePressed = false;

// 1. [복원] 페이지 켤 때 URL 주소창의 압축코드(?list=...)를 강제 디코딩 파싱
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('list');

  if (!compressedData) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#555;">재생 목록이 비어 있습니다.<br>상단에 동영상 웹 주소를 등록해 보세요!</li>';
    return;
  }

  try {
    // 💡 영상에 나왔던 btoa의 역연산인 atob 함수 사용!
    const decodedJson = decodeURIComponent(atob(compressedData));
    const videoList = JSON.parse(decodedJson); // 순수한 텍스트 링크 데이터 배열 복원

    videoList.forEach((vid, index) => {
      const li = document.createElement('li');
      li.dataset.src = vid.url; // 엘리먼트에 동영상 스트리밍 주소 매핑
      li.textContent = vid.title;
      
      if (index === 0) {
        li.classList.add('active');
        video.src = vid.url; // 첫 영상을 다이렉트로 로드
        video.load();
      }
      playlist.appendChild(li);
    });
  } catch (e) {
    playlist.innerHTML = '<li style="color:#ff5b5b;">잘못되었거나 손상된 단축 주소입니다.</li>';
  }
});

// 2. [등록] 기존 목록 정보와 신규 주소창 입력을 모아 Base64로 암호화 압축 후 이동
generatorBtn.addEventListener('click', () => {
  const newUrl = inputUrl.value.trim();
  const newTitle = inputTitle.value.trim() || "새로운 비디오";

  if (!newUrl) {
    alert("동영상 파일 웹 주소(.mp4 링크 URL)를 입력해 주세요!");
    return;
  }

  const currentList = [];
  
  // 이미 재생 목록에 올라와 있는 비디오 주소들과 제목 텍스트 데이터 수집
  playlist.querySelectorAll('li').forEach(item => {
    if (item.dataset.src) {
      currentList.push({ url: item.dataset.src, title: item.textContent });
    }
  });

  // 이번에 입력한 데이터 세트 누적 병합
  currentList.push({ url: newUrl, title: newTitle });

  // 💡 데이터 배열을 문자열로 만든 뒤 btoa 코드로 인코딩 압축!
  const jsonString = encodeURIComponent(JSON.stringify(currentList));
  const compressedBase64 = btoa(jsonString);

  // 주소창 강제 교체 및 페이지 이동
  window.location.search = `list=${compressedBase64}`;
});

// 3. 리스트 클릭 시 다이렉트 주소 주입 및 재생
playlist.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li || !li.dataset.src) return;

  document.querySelectorAll('#playlist li').forEach(item => item.classList.remove('active'));
  li.classList.add('active');

  video.src = li.dataset.src;
  video.load(); video.play(); playBtn.textContent = '❚❚';
});

// 4. 단축 주소 복사하기
shareBtn.addEventListener('click', () => {
  if (!window.location.search.includes('list=')) {
    alert("공유할 플레이리스트 목록이 비어 있습니다!");
    return;
  }
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("현재 재생목록 정보가 압축된 링크 주소가 복사되었습니다! 친구에게 보내보세요."))
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

/* --- ⌨️ 유튜브 스타일 단축키 엔진 --- */
window.addEventListener('keydown', (e) => {
  if (document.activeElement === inputTitle || document.activeElement === inputUrl) return;

  switch (e.key) {
    case " ":
      e.preventDefault();
      if (!isSpacePressed) { togglePlay(); isSpacePressed = true; } 
      else { video.playbackRate = 2.0; speedBadge.style.opacity = "1"; } // 꾹 누르면 2배속
      break;
    case "ArrowRight":
      e.preventDefault(); video.currentTime = Math.min(video.duration, video.currentTime + 5); // 5초 전진
      break;
    case "ArrowLeft":
      e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 5); // 5초 후진
      break;
    case "f":
    case "F":
      e.preventDefault(); toggleFullscreen(); // 전체화면
      break;
  }
});

window.addEventListener('keyup', (e) => {
  if (document.activeElement === inputTitle || document.activeElement === inputUrl) return;
  if (e.key === " ") {
    e.preventDefault(); isSpacePressed = false; video.playbackRate = 1.0; speedBadge.style.opacity = "0"; // 정상배속 원복
  }
});

/* --- 비디오 기본 조작 컨트롤 장치 --- */
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
