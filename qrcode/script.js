// HTMLの要素を取得
const urlsTextarea = document.getElementById('urls');
const qrcodeContainer = document.getElementById('qrcode-container');
const downloadAllBtn = document.getElementById('download-all-zip');

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
 * QRコードを生成・表示するメイン関数
 */
function generateQRCodes() {
    // 古いQRコードをすべて削除
    qrcodeContainer.innerHTML = '';
    
    // 入力されたテキストを改行で分割し、空行は除外
    const urls = urlsTextarea.value.split('\n').filter(url => url.trim() !== '');

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
            width: 128,
            height: 128,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // 生成されたcanvas要素を取得してboxに追加
        const canvas = tempQrElement.querySelector('canvas');
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
            const filename = downloadLink.download; // 個別ダウンロードのファイル名を利用
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

// テキストエリアに入力があったらQRコード生成関数を呼び出す
urlsTextarea.addEventListener('input', generateQRCodes);