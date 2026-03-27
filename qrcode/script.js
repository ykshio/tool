// HTMLの要素を取得
const urlsTextarea = document.getElementById('urls');
const qrcodeContainer = document.getElementById('qrcode-container');
const downloadAllBtn = document.getElementById('download-all-zip');
const transparentBgCheckbox = document.getElementById('transparent-bg');
const bgLabel = document.getElementById('bg-label');

/**
 * URLから安全なファイル名を生成するヘルパー関数
 * @param {string} url - 元のURL
 * @returns {string} サニタイズされたファイル名
 */
function sanitizeFilename(url) {
    // 'https://' や 'http://' を除去
    let filename = url.replace(/https?:\/\//, '');
    // ファイル名として使えない文字を'_'に置換
    filename = filename.replace(/[\\/:*?"<>|]+/g, '_');
    // 末尾のスラッシュを除去
    if (filename.endsWith('/')) {
        filename = filename.slice(0, -1);
    }
    return filename || "qrcode";
}

/**
 * QRコードのcanvasに規格準拠のクワイエットゾーン（余白）を追加する
 * ISO/IEC 18004 では4モジュール分の余白が必要
 * @param {HTMLCanvasElement} srcCanvas - 元のQRコードcanvas
 * @param {boolean} transparentBg - 背景を透過にするか
 * @returns {HTMLCanvasElement} 余白付きの新しいcanvas
 */
function addQuietZone(srcCanvas, transparentBg) {
    const srcSize = srcCanvas.width;
    // QRコードのモジュール数を推定（暗いピクセルの境界から計算）
    const srcCtx = srcCanvas.getContext('2d');
    const imageData = srcCtx.getImageData(0, 0, srcSize, srcSize);

    // 最初の行をスキャンしてモジュールサイズを推定
    let moduleSize = 0;
    let firstPixelColor = imageData.data[0]; // 左上のピクセルの色
    for (let x = 1; x < srcSize; x++) {
        const idx = x * 4;
        if (imageData.data[idx] !== firstPixelColor) {
            moduleSize = x;
            break;
        }
    }
    if (moduleSize === 0) moduleSize = Math.round(srcSize / 33); // フォールバック

    // 4モジュール分のクワイエットゾーン
    const quietZone = moduleSize * 4;
    const newSize = srcSize + quietZone * 2;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = newSize;
    newCanvas.height = newSize;
    const ctx = newCanvas.getContext('2d');

    if (!transparentBg) {
        // 白背景で塗りつぶし
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newSize, newSize);
        ctx.drawImage(srcCanvas, quietZone, quietZone);
    } else {
        // 透過背景：QRコードの黒モジュールのみ描画
        const srcData = srcCtx.getImageData(0, 0, srcSize, srcSize);
        const newCtx = newCanvas.getContext('2d');
        const newImageData = newCtx.createImageData(newSize, newSize);

        for (let y = 0; y < srcSize; y++) {
            for (let x = 0; x < srcSize; x++) {
                const srcIdx = (y * srcSize + x) * 4;
                const r = srcData.data[srcIdx];
                // 暗いピクセル（モジュール）のみコピー
                if (r < 128) {
                    const destX = x + quietZone;
                    const destY = y + quietZone;
                    const destIdx = (destY * newSize + destX) * 4;
                    newImageData.data[destIdx] = srcData.data[srcIdx];
                    newImageData.data[destIdx + 1] = srcData.data[srcIdx + 1];
                    newImageData.data[destIdx + 2] = srcData.data[srcIdx + 2];
                    newImageData.data[destIdx + 3] = 255;
                }
            }
        }
        newCtx.putImageData(newImageData, 0, 0);
    }

    return newCanvas;
}

/**
 * QRコードを生成・表示するメイン関数
 */
function generateQRCodes() {
    // 古いQRコードをすべて削除
    qrcodeContainer.innerHTML = '';

    // 入力されたテキストを改行で分割し、空行は除外
    const urls = urlsTextarea.value.split('\n').filter(url => url.trim() !== '');
    const isTransparent = transparentBgCheckbox.checked;

    // 一括ダウンロードボタンの表示/非表示を切り替え
    if (urls.length > 0) {
        downloadAllBtn.style.display = 'inline-block';
    } else {
        downloadAllBtn.style.display = 'none';
    }

    // 各URLに対してQRコードを生成
    urls.forEach((url, index) => {
        // QRコードを表示するための入れ物を作成
        const box = document.createElement('div');
        box.className = 'qr-code-box';

        // URLのテキスト表示
        const urlText = document.createElement('p');
        urlText.textContent = url;

        // QRコードを生成する本体 (一時的な非表示要素に生成)
        const tempQrElement = document.createElement('div');
        new QRCode(tempQrElement, {
            text: url,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // 生成されたcanvas要素を取得し、クワイエットゾーンを追加
        const rawCanvas = tempQrElement.querySelector('canvas');
        const canvas = addQuietZone(rawCanvas, isTransparent);

        // 透過時はチェッカーパターンのプレビューを表示
        if (isTransparent) {
            canvas.classList.add('transparent-preview');
        }

        // 表示用にサイズを制限
        canvas.style.width = '160px';
        canvas.style.height = '160px';

        box.appendChild(canvas);
        box.appendChild(urlText);

        // --- 個別ダウンロードボタンの追加 ---
        const downloadLink = document.createElement('a');
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = `${String(index + 1).padStart(3, '0')}_${sanitizeFilename(url)}.png`;
        downloadLink.className = 'download-btn';
        downloadLink.textContent = 'PNG ダウンロード';
        box.appendChild(downloadLink);

        // ページにQRコードボックスを追加
        qrcodeContainer.appendChild(box);
    });
}

/**
 * 一括ダウンロードボタンのクリックイベント
 */
downloadAllBtn.addEventListener('click', () => {
    const zip = new JSZip();
    const qrBoxes = document.querySelectorAll('.qr-code-box');

    if (qrBoxes.length === 0) return;

    // 各QRコードのcanvasから画像データを取得してZIPに追加
    qrBoxes.forEach((box) => {
        const canvas = box.querySelector('canvas');
        const downloadLink = box.querySelector('a.download-btn');

        if (canvas && downloadLink) {
            const filename = downloadLink.download;
            const imageData = canvas.toDataURL('image/png').split(',')[1];
            zip.file(filename, imageData, { base64: true });
        }
    });

    // ZIPファイルを生成してダウンロードを実行
    zip.generateAsync({ type: 'blob' }).then((content) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'qr_codes.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});

// 背景トグルの変更イベント
transparentBgCheckbox.addEventListener('change', () => {
    bgLabel.textContent = transparentBgCheckbox.checked ? '透過' : '白';
    generateQRCodes();
});

// テキストエリアに入力があったらQRコード生成関数を呼び出す
urlsTextarea.addEventListener('input', generateQRCodes);
