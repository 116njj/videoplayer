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
const speedBadge = document.getElementById('speed-badge'); // 배속 알림창 수집

let db = null;
let currentSelectedFile = null;
let isSpacePressed = false; // 스페이스바 연속 누름 감지 플래그

// IndexedDB 초기화 설정 구동
const dbRequest = indexedDB.open("VideoPlayerDB", 1);
dbRequest.onupgradeneeded = (e) => {
  db = e.target.result;
  if (!db.objectStoreNames.contains("videos")) {
    db.createObjectStore("videos", { keyPath: "title" });
  }
};
dbRequest.onsuccess = (e) => {
  db = e.target.result;
  initPlayer();
};

function initPlayer() {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('list');

  if (!compressedData) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#555;">재생 목록이 비어 있습니다.<br>상단에서 동영상 파일을 추가하세요!</li>';
    return;
  }

  try {
    const decodedJson = decodeURIComponent(atob(compressedData));
    const titleList = JSON.parse(decodedJson);

    const transaction = db.transaction(["videos"], "readonly");
    const store = transaction.objectStore("videos");

    titleList.forEach((title, index) => {
      const li = document.createElement('li');
      li.textContent = title;
      playlist.appendChild(li);

      if (index === 0) {
        li.classList.add('active');
        const getReq = store.get(title);
        getReq.onsuccess = () => {
          if (getReq.result) {
            video.src = URL.createObjectURL(getReq.result.blob);
            video.load();
          }
        };
      }
    });
  } catch (e) {
    playlist.innerHTML = '<li style="color:#ff5b5b;">재생목록 파싱 오류가 발생했습니다.</li>';
  }
}

fileUploader.addEventListener('change', (e) => {
  const file = e.target.files;
  if (!file) return;
  currentSelectedFile = file;
  inputTitle.value = file.name.replace('.mp4', '');
});

generatorBtn.addEventListener('click', () => {
  const newTitle = inputTitle.value.trim();
  if (!currentSelectedFile || !newTitle) {
    alert("파일을 선택하고 동영상 제목을 입력해 주세요!");
    return;
  }

  const transaction = db.transaction(["videos"], "readwrite");
  const store = transaction.objectStore("videos");
  store.put({ title: newTitle, blob: currentSelectedFile });

  transaction.oncomplete = () => {
    const currentTitles = [];
    playlist.querySelectorAll('li').forEach(item => {
      if (item.textContent && !item.textContent.includes("비어 있습니다")) {
        currentTitles.push(item.textContent);
      }
    });
    currentTitles.push(newTitle);
    const compressedBase64 = btoa(encodeURIComponent(JSON.stringify(currentTitles)));
    window.location.search = `list=${compressedBase64}`;
  };
});

shareBtn.addEventListener('click', () => {
  if (!window.location.search.includes('list=')) {
    alert("공유할 플레이리스트 목록이 비어 있습니다!");
    return;
  }
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("현재 재생목록 전체가 누적된 단축 주소가 클립보드에 복사되었습니다!"))
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

/* --- ⌨️ 유튜브 스타일 고성능 단축키 엔진 구현 --- */
window.addEventListener('keydown', (e) => {
  // 제목 입력창 타이핑 중에는 단축키 전면 차단
  if (document.activeElement === inputTitle) return;

  switch (e.key) {
    case " ": // 스페이스바 제어
      e.preventDefault();
      if (!isSpacePressed) {
        // 처음 한 번 뚝 눌렸을 때는 일반 일시정지/재생 토글
        togglePlay();
        isSpacePressed = true;
      } else {
        // 꾹 누르고 있는 상태(연속 발생)가 감지되면 즉시 2배속 가속 및 안내창 노출
        video.playbackRate = 2.0;
        speedBadge.style.opacity = "1";
      }
      break;

    case "ArrowRight": // 오른쪽 화살표: 5초 건너뛰기
      e.preventDefault();
      video.currentTime = Math.min(video.duration, video.currentTime + 5);
      break;

    case "ArrowLeft": // 왼쪽 화살표: 5초 전으로 가기
      e.preventDefault();
      video.currentTime = Math.max(0, video.currentTime - 5);
      break;

    case "f":
    case "F": // F키: 전체화면 토글
      e.preventDefault();
      toggleFullscreen();
      break;
  }
});

// 스페이스바에서 손을 떼었을 때 속도를 원상복구시키는 릴리즈 감지기
window.addEventListener('keyup', (e) => {
  if (document.activeElement === inputTitle) return;

  if (e.key === " ") {
    e.preventDefault();
    isSpacePressed = false;
    video.playbackRate = 1.0; // 정상 속도 복귀
    speedBadge.style.opacity = "0"; // 배속 안내창 숨김
  }
});

/* --- 비디오 플레이어 기본 액션 구현부 --- */
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
  if (!li || li.style.color === 'rgb(85, 85, 85)') return;
  document.querySelectorAll('#playlist li').forEach(item => item.classList.remove('active'));
  li.classList.add('active');
  const transaction = db.transaction(["videos"], "readonly");
  const store = transaction.objectStore("videos");
  const getReq = store.get(li.textContent);
  getReq.onsuccess = () => {
    if (getReq.result) {
      video.src = URL.createObjectURL(getReq.result.blob);
      video.load(); video.play(); playBtn.textContent = '❚❚';
    } else {
      alert("해당 영상 파일이 브라우저 데이터베이스에 존재하지 않습니다.");
    }
  };
});

video.addEventListener('ended', () => {
  const currentActive = playlist.querySelector('.active');
  if (!currentActive) return;
  const nextVideo = currentActive.nextElementSibling;
  if (nextVideo) nextVideo.click();
});
