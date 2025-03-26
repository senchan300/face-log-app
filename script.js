// 各要素の取得
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const canvas = document.getElementById('canvas');
const captureButton = document.getElementById('captureButton');
const downloadLink = document.getElementById('downloadLink');
const gallery = document.getElementById('gallery');
const context = canvas.getContext('2d');

// 比較用の要素（HTMLに追加済みのはずです）
const compareButton = document.getElementById('compareButton');
const comparisonDiv = document.getElementById('comparison');



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





// 撮影した画像を保存する配列（初期は空）
let photos = [];

// ローカルストレージから過去の写真を読み込む（キー: "photoGallery"）
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

// ギャラリーのHTMLを更新する関数（削除、ダウンロード、比較用チェックボックス付き）
function updateGalleryUI() {
  gallery.innerHTML = '';
  photos.forEach((photo, index) => {
    // コンテナの作成
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.position = 'relative';
    container.style.margin = '10px';

    // ★ 比較用チェックボックスの追加
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'compareCheckbox';
    checkbox.dataset.index = index; // この写真のインデックスを設定
    container.appendChild(checkbox);

    // 写真の表示
    const imgElem = document.createElement('img');
    imgElem.src = photo.data;
    imgElem.style.width = '320px';
    imgElem.style.height = 'auto';
    container.appendChild(imgElem);

    // キャプション（撮影日時）の追加
    const caption = document.createElement('p');
    caption.textContent = photo.date;
    container.appendChild(caption);

    // ダウンロードリンクの追加
    const downloadLinkElem = document.createElement('a');
    downloadLinkElem.href = photo.data;
    // ファイル名に使えるようにコロンや空白をアンダースコアに変換
    downloadLinkElem.download = photo.date.replace(/[:\s-]/g, '_') + '_face.png';
    downloadLinkElem.textContent = 'ダウンロード';
    downloadLinkElem.style.display = 'block';
    container.appendChild(downloadLinkElem);

    // 削除ボタンの追加
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '削除';
    deleteBtn.style.display = 'block';
    deleteBtn.addEventListener('click', function() {
      photos.splice(index, 1);
      localStorage.setItem('photoGallery', JSON.stringify(photos));
      updateGalleryUI();
      // オーバーレイに表示している場合は非表示にする
      if (overlay.src === photo.data) {
        overlay.style.display = 'none';
      }
    });
    container.appendChild(deleteBtn);

    // コンテナをギャラリーに追加
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

navigator.mediaDevices.getUserMedia({ 
  video: { 
    width: { ideal: 1280 }, 
    height: { ideal: 720 } 
  } 
})


// 写真を撮影する関数
function capturePhoto() {
  console.log("capturePhoto() が呼ばれました");
  
  // canvas に映像を描画
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // 画像データを作成
  const imageData = canvas.toDataURL('image/png');
  console.log("imageData の長さ:", imageData.length);
  
  // 撮影日時を取得
  const now = new Date();
  const formattedDate = now.getFullYear() + '-' +
                        ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
                        ('0' + now.getDate()).slice(-2) + ' ' +
                        ('0' + now.getHours()).slice(-2) + ':' +
                        ('0' + now.getMinutes()).slice(-2) + ':' +
                        ('0' + now.getSeconds()).slice(-2);
  
  // 新たな写真オブジェクトを作成して配列に追加
  const photoObj = { data: imageData, date: formattedDate };
  photos.push(photoObj);
  
  // ローカルストレージに保存し、ギャラリーを更新
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
  // 撮影後にオーバーレイのサイズをcanvasのサイズに合わせて再設定
  overlay.style.width = canvas.width + 'px';
  overlay.style.height = canvas.height + 'px';
}

// ページ読み込み時の処理
window.addEventListener('load', function() {
  startCamera();
  loadGallery();
  
  // videoのメタデータが読み込まれたときに、canvasとオーバーレイのサイズを設定する
  video.addEventListener('loadedmetadata', function() {
    // video要素の実際の幅・高さをキャンバスに反映
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // オーバーレイ画像も同じサイズに設定
    overlay.style.width = video.videoWidth + 'px';
    overlay.style.height = video.videoHeight + 'px';
  });
});

// キャプチャボタンがクリックされたら写真撮影
captureButton.addEventListener('click', capturePhoto);

// ★ 比較するボタンの機能実装
compareButton.addEventListener('click', function() {
  // チェックされた比較用チェックボックスを全て取得
  const checkedBoxes = document.querySelectorAll('.compareCheckbox:checked');
  
  // チェックされている写真が2枚でなければ警告
  if (checkedBoxes.length !== 2) {
    alert("比較するには、2枚の写真を選択してください。");
    return;
  }
  
  // 比較エリアをクリア
  comparisonDiv.innerHTML = '';
  
  // 選択された各写真を取得して、比較エリアに横並びで追加
  checkedBoxes.forEach(function(box) {
    const index = box.dataset.index;  // data-index属性から写真のインデックスを取得
    const photo = photos[index];
    
    const imgElem = document.createElement('img');
    imgElem.src = photo.data;
    // 2枚を横並びに表示するため、幅を調整（例: 45%ずつ）
    imgElem.style.width = '45%';
    imgElem.style.margin = '2%';
    comparisonDiv.appendChild(imgElem);
  });
});
