// 各要素の取得
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const canvas = document.getElementById('canvas');
const captureButton = document.getElementById('captureButton');
const downloadLink = document.getElementById('downloadLink');
const gallery = document.getElementById('gallery');
const context = canvas.getContext('2d');

// 比較用の要素（HTMLに追加済み）
const compareButton = document.getElementById('compareButton');
const comparisonDiv = document.getElementById('comparison');

// ServiceWorker の登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('ServiceWorker登録成功: ', registration.scope);
      })
      .catch(function(err) {
        console.log('ServiceWorker登録失敗: ', err);
      });
  });
}

// 撮影した画像を保存する配列
let photos = [];

// ローカルストレージから過去の写真を読み込む
function loadGallery() {
  const storedPhotos = localStorage.getItem('photoGallery');
  if (storedPhotos) {
    photos = JSON.parse(storedPhotos);
    updateGalleryUI();
    if (photos.length > 0) {
      overlay.src = photos[photos.length - 1].data;
      overlay.style.display = 'block';
    }
  }
}

// ギャラリーのHTMLを更新する関数
function updateGalleryUI() {
  gallery.innerHTML = '';
  photos.forEach((photo, index) => {
    const container = document.createElement('div');
    container.className = 'gallery-item';

    const imgElem = document.createElement('img');
    imgElem.src = photo.data;
    imgElem.alt = 'Captured face';
    container.appendChild(imgElem);

    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = photo.date;
    container.appendChild(timestamp);

    const actionWrapper = document.createElement('div');
    actionWrapper.className = 'gallery-actions';

    const downloadBtn = document.createElement('a');
    downloadBtn.href = photo.data;
    downloadBtn.download = photo.date.replace(/[:\s-]/g, '_') + '_face.png';
    downloadBtn.className = 'download-button';
    downloadBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M.5 9.9v4.6c0 .3.2.5.5.5h14c.3 0 .5-.2.5-.5V9.9c0-.3-.2-.5-.5-.5s-.5.2-.5.5v4.1H1V9.9c0-.3-.2-.5-.5-.5s-.5.2-.5.5z"/>
        <path d="M7.5 1v9.793L4.354 7.646a.5.5 0 1 0-.708.708l4 4a.5.5 0 0 0 .708 0l4-4a.5.5 0 1 0-.708-.708L8.5 10.793V1a.5.5 0 0 0-1 0z"/>
      </svg>
      Download`;
    actionWrapper.appendChild(downloadBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5z"/>
        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 1 1 0-2H5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1h2.5a1 1 0 0 1 1 1zM5 4v9h6V4H5z"/>
      </svg>
      Delete`;
    deleteBtn.addEventListener('click', function() {
      photos.splice(index, 1);
      localStorage.setItem('photoGallery', JSON.stringify(photos));
      updateGalleryUI();
      if (overlay.src === photo.data) {
        overlay.style.display = 'none';
      }
    });
    actionWrapper.appendChild(deleteBtn);

    container.appendChild(actionWrapper);
    gallery.appendChild(container);
  });
}

function startCamera() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(function(stream) {
        video.srcObject = stream;
        video.play();
      })
      .catch(function(err) {
        console.error("カメラの起動に失敗しました:", err);
      });
  } else {
    alert("このブラウザはカメラ機能に対応していません。");
  }
}

function capturePhoto() {
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = canvas.toDataURL('image/png');
  const now = new Date();
  const formattedDate = now.getFullYear() + '-' +
    ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
    ('0' + now.getDate()).slice(-2) + ' ' +
    ('0' + now.getHours()).slice(-2) + ':' +
    ('0' + now.getMinutes()).slice(-2) + ':' +
    ('0' + now.getSeconds()).slice(-2);
  const photoObj = { data: imageData, date: formattedDate };
  photos.push(photoObj);
  localStorage.setItem('photoGallery', JSON.stringify(photos));
  updateGalleryUI();
  const fileName = now.getFullYear() + '-' +
    ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
    ('0' + now.getDate()).slice(-2) + '_face.png';
  downloadLink.href = imageData;
  downloadLink.download = fileName;
  downloadLink.textContent = "Download (" + fileName + ")";
  overlay.src = imageData;
  overlay.style.display = 'block';
  overlay.style.width = video.clientWidth + 'px';
  overlay.style.height = video.clientHeight + 'px';
}

window.addEventListener('load', function() {
  startCamera();
  loadGallery();
  video.addEventListener('loadedmetadata', function() {
    const width = video.clientWidth;
    const height = video.clientHeight;
    canvas.width = width;
    canvas.height = height;
    overlay.style.width = width + 'px';
    overlay.style.height = height + 'px';
  });
});

window.addEventListener('resize', function() {
  const width = video.clientWidth;
  const height = video.clientHeight;
  canvas.width = width;
  canvas.height = height;
  overlay.style.width = width + 'px';
  overlay.style.height = height + 'px';
});

captureButton.addEventListener('click', capturePhoto);

compareButton.addEventListener('click', function() {
  const checkedBoxes = document.querySelectorAll('.compareCheckbox:checked');
  if (checkedBoxes.length !== 2) {
    alert("比較するには、2枚の写真を選択してください。");
    return;
  }

  comparisonDiv.innerHTML = '';
  checkedBoxes.forEach(function(box) {
    const index = box.dataset.index;
    const photo = photos[index];
    const imgElem = document.createElement('img');
    imgElem.src = photo.data;
    imgElem.style.width = '45%';
    imgElem.style.margin = '2%';
    comparisonDiv.appendChild(imgElem);
  });
});
