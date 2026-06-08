// HTMLの要素を取得
const urlsTextarea = document.getElementById('urls');
const qrcodeContainer = document.getElementById('qrcode-container');
const downloadAllBtn = document.getElementById('download-all-zip');
const transparentBgCheckbox = document.getElementById('transparent-bg');
const bgLabel = document.getElementById('bg-label');
const quietZoneCheckbox = document.getElementById('quiet-zone');
const marginLabel = document.getElementById('margin-label');

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
 * 規格準拠の4モジュール分のクワイエットゾーン（余白）を付けたcanvasを生成する。
 * 透過指定時は黒モジュールのみを残し、白背景時は白で塗りつぶす。
 * ライブラリ生成canvasはdisplay:noneにされるため、ここで作り直すことで表示も担保する。
 * @param {HTMLCanvasElement} srcCanvas - 元のQRコードcanvas
 * @param {number} moduleCount - QRコードのモジュール数（縦横のセル数）
 * @param {boolean} isTransparent - 背景を透過にするか
 * @param {boolean} withMargin - 余白を付けるか（falseなら余白なしで描き直す）
 * @returns {HTMLCanvasElement} 新しいcanvas
 */
function withQuietZone(srcCanvas, moduleCount, isTransparent, withMargin) {
    const srcSize = srcCanvas.width;
    const moduleSize = Math.round(srcSize / moduleCount);
    const quietZone = withMargin ? moduleSize * 4 : 0; // ISO/IEC 18004: 4モジュール分の余白
    const newSize = srcSize + quietZone * 2;

    const canvas = document.createElement('canvas');
    canvas.width = newSize;
    canvas.height = newSize;
    const ctx = canvas.getContext('2d');

    if (isTransparent) {
        // 黒モジュールのみを余白分オフセットしてコピー
        const srcData = srcCanvas.getContext('2d').getImageData(0, 0, srcSize, srcSize);
        const out = ctx.createImageData(newSize, newSize);
        for (let y = 0; y < srcSize; y++) {
            for (let x = 0; x < srcSize; x++) {
                if (srcData.data[(y * srcSize + x) * 4] < 128) {
                    const dIdx = ((y + quietZone) * newSize + (x + quietZone)) * 4;
                    out.data[dIdx + 3] = 255; // RGBは0のまま=黒、不透明にする
                }
            }
        }
        ctx.putImageData(out, 0, 0);
    } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newSize, newSize);
        ctx.drawImage(srcCanvas, quietZone, quietZone);
    }
    return canvas;
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
    const withMargin = quietZoneCheckbox.checked;

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
        const qr = new QRCode(tempQrElement, {
            text: url,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // 正確なモジュール数を取得し、規格準拠の余白を付けたcanvasを作り直す
        const rawCanvas = tempQrElement.querySelector('canvas');
        const moduleCount = qr._oQRCode.getModuleCount();
        const canvas = withQuietZone(rawCanvas, moduleCount, isTransparent, withMargin);

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

// 余白トグルの変更イベント
quietZoneCheckbox.addEventListener('change', () => {
    marginLabel.textContent = quietZoneCheckbox.checked ? 'あり' : 'なし';
    generateQRCodes();
});

// テキストエリアに入力があったらQRコード生成関数を呼び出す
urlsTextarea.addEventListener('input', generateQRCodes);
