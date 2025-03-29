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
    // 最後の写真をオーバーレイとして設定
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
    container.style.display = 'inline-block';
    container.style.position = 'relative';
    container.style.margin = '10px';

    // 比較用チェックボックス
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'compareCheckbox';
    checkbox.dataset.index = index;
    container.appendChild(checkbox);

    // 写真表示
    const imgElem = document.createElement('img');
    imgElem.src = photo.data;
    imgElem.style.width = '320px';
    imgElem.style.height = 'auto';
    container.appendChild(imgElem);

    // キャプション（撮影日時）
    const caption = document.createElement('p');
    caption.textContent = photo.date;
    container.appendChild(caption);

    // ダウンロードリンク
    const downloadLinkElem = document.createElement('a');
    downloadLinkElem.href = photo.data;
    downloadLinkElem.download = photo.date.replace(/[:\s-]/g, '_') + '_face.png';
    downloadLinkElem.textContent = 'ダウンロード';
    downloadLinkElem.style.display = 'block';
    container.appendChild(downloadLinkElem);

    // 削除ボタン
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '削除';
    deleteBtn.style.display = 'block';
    deleteBtn.addEventListener('click', function() {
      photos.splice(index, 1);
      localStorage.setItem('photoGallery', JSON.stringify(photos));
      updateGalleryUI();
      if (overlay.src === photo.data) {
        overlay.style.display = 'none';
      }
    });
    container.appendChild(deleteBtn);

    gallery.appendChild(container);
  });
}

// カメラ映像の開始
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

// 写真を撮影する関数
function capturePhoto() {
  console.log("capturePhoto() が呼ばれました");
  
  // canvas に映像を描画
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // 画像データを作成
  const imageData = canvas.toDataURL('image/png');
  console.log("imageData の長さ:", imageData.length);
  
  // 撮影日時の取得
  const now = new Date();
  const formattedDate = now.getFullYear() + '-' +
                        ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
                        ('0' + now.getDate()).slice(-2) + ' ' +
                        ('0' + now.getHours()).slice(-2) + ':' +
                        ('0' + now.getMinutes()).slice(-2) + ':' +
                        ('0' + now.getSeconds()).slice(-2);
  
  // 新しい写真オブジェクトを作成し配列に追加
  const photoObj = { data: imageData, date: formattedDate };
  photos.push(photoObj);
  
  // ローカルストレージとギャラリーの更新
  localStorage.setItem('photoGallery', JSON.stringify(photos));
  updateGalleryUI();
  
  // ダウンロードリンクの設定
  const fileName = now.getFullYear() + '-' +
                   ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
                   ('0' + now.getDate()).slice(-2) + '_face.png';
  downloadLink.href = imageData;
  downloadLink.download = fileName;
  downloadLink.textContent = "写真をダウンロード (" + fileName + ")";
  
  // 今回の撮影画像をオーバーレイとして設定
  overlay.src = imageData;
  overlay.style.display = 'block';
  
  // オーバーレイのサイズを、CSSでリサイズされたvideoの表示サイズに合わせる
  overlay.style.width = video.clientWidth + 'px';
  overlay.style.height = video.clientHeight + 'px';
}

// ページ読み込み時の処理
window.addEventListener('load', function() {
  startCamera();
  loadGallery();
  
  // videoのメタデータ読み込み後、CSS適用後の表示サイズ（clientWidth/Height）でキャンバスとオーバーレイを調整
  video.addEventListener('loadedmetadata', function() {
    const width = video.clientWidth;
    const height = video.clientHeight;
    canvas.width = width;
    canvas.height = height;
    overlay.style.width = width + 'px';
    overlay.style.height = height + 'px';
  });
});

// ウィンドウリサイズ時にも調整（ホーム画面モードなどでサイズ変化する場合に対応）
window.addEventListener('resize', function() {
  const width = video.clientWidth;
  const height = video.clientHeight;
  canvas.width = width;
  canvas.height = height;
  overlay.style.width = width + 'px';
  overlay.style.height = height + 'px';
});

// キャプチャボタンがクリックされたら写真撮影
captureButton.addEventListener('click', capturePhoto);

// 比較するボタンの機能実装
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