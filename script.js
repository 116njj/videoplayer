const video = document.querySelector('.video');
const playBtn = document.querySelector('.play-btn');
const progressBar = document.querySelector('.progress-bar');
const volumeBar = document.querySelector('.volume-bar');
const timeDisplay = document.querySelector('.time-display');
const fileInput = document.getElementById('file-input');
const playlist = document.getElementById('playlist');

let isInitialLoaded = false;

// 1. 페이지 로드 시: 관리자 JSON과 방문자 LocalStorage 동시 로드
document.addEventListener("DOMContentLoaded", () => {
  // 관리자 영상 불러오기 (video-list.json)
  fetch('video-list.json')
    .then(res => res.json())
    .then(adminVideos => {
      adminVideos.forEach(vid => {
        addVideoUI(vid.title, vid.file, true);
      });
      loadVisitorVideos(); // 관리자 영상 뒤에 방문자 영상 로드
    })
    .catch(() => {
      console.log("고정 영상이 없거나 json 파일 로드 실패");
      loadVisitorVideos();
    });
});

// 방문자 로컬 비디오 로드 함수
function loadVisitorVideos() {
  const savedList = JSON.parse(localStorage.getItem("userVideos")) || [];
  savedList.forEach(vid => {
    addVideoUI(vid.name, vid.src, false);
  });
}

// 2. 리스트 UI에 영상 추가하는 공통 함수
function addVideoUI(name, src, isFixed = false) {
  const li = document.createElement('li');
  li.dataset.src = src;
  
  const titleSpan = document.createElement('span');
  titleSpan.textContent = name;
  li.appendChild(titleSpan);

  if (isFixed) {
    li.classList.add('fixed-video');
  } else {
    // 방문자 영상일 경우에만 우측에 삭제 버튼 추가
    const delBtn = document.createElement('button');
    delBtn.textContent = '삭제';
    delBtn.classList.add('del-btn');
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 리스트 클릭 이벤트 방지
      li.remove();
      removeFormStorage(name);
    });
    li.appendChild(delBtn);
  }

  playlist.appendChild(li);

  // 처음으로 로드된 영상이 있다면 플레이어 기본 영상으로 세팅 (자동 재생X)
  if (!isInitialLoaded) {
    video.src = src;
    video.load();
    isInitialLoaded = true;
  }
}

/* --- 플레이어 기본 기능 컨트롤 동작 --- */
function togglePlay() {
  video.paused ? video.play() : video.pause();
  playBtn.textContent = video.paused ? '▶' : '❚❚';
}

function updateProgress() {
  if (!video.duration) return;
  const percent = (video.currentTime / video.duration) * 100;
  progressBar.value = percent;
  
  // 시간 표시 포맷 (00:00)
  const curMin = String(Math.floor(video.currentTime / 60)).padStart(2, '0');
  const curSec = String(Math.floor(video.currentTime % 60)).padStart(2, '0');
  const durMin = String(Math.floor(video.duration / 60)).padStart(2, '0');
  const durSec = String(Math.floor(video.duration % 60)).padStart(2, '0');
  timeDisplay.textContent = `${curMin}:${curSec} / ${durMin}:${durSec}`;
}

// 플레이어 컨트롤러 이벤트 바인딩
playBtn.addEventListener('click', togglePlay);
video.addEventListener('click', togglePlay);
video.addEventListener('timeupdate', updateProgress);
progressBar.addEventListener('input', () => {
  video.currentTime = (progressBar.value * video.duration) / 100;
});
volumeBar.addEventListener('input', () => { video.volume = volumeBar.value; });

// 리스트 아이템 클릭 시 해당 영상 재생
playlist.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  video.src = li.dataset.src;
  video.load();
  video.play();
  playBtn.textContent = '❚❚';
});

// 3. 방문자 파일 업로드 처리 및 로컬 저장소 저장
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const videoURL = URL.createObjectURL(file);
  
  // UI 추가
  addVideoUI(file.name, videoURL, false);

  // LocalStorage에 메타데이터 저장 (다음 접속 시 로드용)
  const savedList = JSON.parse(localStorage.getItem("userVideos")) || [];
  savedList.push({ name: file.name, src: videoURL });
  localStorage.setItem("userVideos", JSON.stringify(savedList));
  
  // 올리자마자 바로 재생 가능하게 처리
  video.src = videoURL;
  video.load();
  video.play();
  playBtn.textContent = '❚❚';
});

// 로컬 저장소에서 제거 함수
function removeFormStorage(name) {
  let savedList = JSON.parse(localStorage.getItem("userVideos")) || [];
  savedList = savedList.filter(vid => vid.name !== name);
  localStorage.setItem("userVideos", JSON.stringify(savedList));
}
