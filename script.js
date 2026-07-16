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

let db = null;
let currentSelectedFile = null;

// 1. 브라우저 데이터베이스(IndexedDB) 초기화 설정 구동
const dbRequest = indexedDB.open("VideoPlayerDB", 1);
dbRequest.onupgradeneeded = (e) => {
  db = e.target.result;
  if (!db.objectStoreNames.contains("videos")) {
    db.createObjectStore("videos", { keyPath: "title" });
  }
};
dbRequest.onsuccess = (e) => {
  db = e.target.result;
  initPlayer(); // DB가 활성화된 후 플레이어 연산 작동
};

// 2. 초기 리스트 복원 로직
function initPlayer() {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('list');

  if (!compressedData) {
    playlist.innerHTML = '<li style="cursor:default; border:none; color:#555;">재생 목록이 비어 있습니다.<br>상단에서 동영상 파일을 추가하세요!</li>';
    return;
  }

  try {
    const decodedJson = decodeURIComponent(atob(compressedData));
    const titleList = JSON.parse(decodedJson); // URL에서는 제목 배열들만 해독함

    const transaction = db.transaction(["videos"], "readonly");
    const store = transaction.objectStore("videos");

    titleList.forEach((title, index) => {
      const li = document.createElement('li');
      li.textContent = title;
      playlist.appendChild(li);

      // 첫 영상은 활성화 및 비디오 로드 연동
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

// 3. 파일 선택 시 제목 칸에 자동 이름 기입
fileUploader.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  currentSelectedFile = file; // 원본 바이너리 보존
  inputTitle.value = file.name.replace('.mp4', '');
});

// 4. 저장 및 등록 버튼 클릭 이벤트
generatorBtn.addEventListener('click', () => {
  const newTitle = inputTitle.value.trim();

  if (!currentSelectedFile || !newTitle) {
    alert("파일을 선택하고 동영상 제목을 입력해 주세요!");
    return;
  }

  // 대용량 파일을 데이터베이스에 완전 격리 저장 (용량 무제한, 주소 안 깨짐)
  const transaction = db.transaction(["videos"], "readwrite");
  const store = transaction.objectStore("videos");
  
  store.put({ title: newTitle, blob: currentSelectedFile });

  transaction.oncomplete = () => {
    // 기존에 URL에 등록되어 있던 텍스트 제목 정보 싹 긁어오기
    const currentTitles = [];
    playlist.querySelectorAll('li').forEach(item => {
      if (item.textContent && !item.textContent.includes("비어 있습니다")) {
        currentTitles.push(item.textContent);
      }
    });

    // 새 제목 배열 추가 결합
    currentTitles.push(newTitle);

    // 오직 제목 텍스트 배열만 주소창에 압축 가공
    const compressedBase64 = btoa(encodeURIComponent(JSON.stringify(currentTitles)));
    
    // 최종 URL 점프 리팩토링 이동
    window.location.search = `list=${compressedBase64}`;
  };
});

// 5. 재생 목록의 타이틀 클릭 시 매칭 비디오 추출 구동
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
      video.load();
      video.play();
      playBtn.textContent = '❚❚';
    } else {
      alert("해당 영상 파일이 브라우저 데이터베이스에 존재하지 않습니다.");
    }
  };
});

// 6. 현재 누적된 단축 URL 링크 클립보드 원클릭 복사
shareBtn.addEventListener('click', () => {
  if (!window.location.search.includes('list=')) {
    alert("공유할 플레이리스트 목록이 비어 있습니다!");
    return;
  }
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("축하합니다! 현재 재생목록 전체가 누적된 단축 주소가 클립보드에 복사되었습니다!"))
    .catch(() => alert("주소창 링크를 직접 복사해 주세요."));
});

// 전체화면 구동 매직 매핑
fullscreenBtn.addEventListener('click', () => {
  if (video.requestFullscreen) video.requestFullscreen();
  else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
});

/* --- 비디오 플레이어 기본 조작 코어 액션 --- */
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
