// HTMLの要素を取得
const urlsTextarea = document.getElementById('urls');
const qrcodeContainer = document.getElementById('qrcode-container');

// テキストエリアに入力があるたびに実行する関数
function generateQRCodes() {
    // 古いQRコードをすべて削除
    qrcodeContainer.innerHTML = '';
    
    // 入力されたテキストを改行で分割し、空行は除外
    const urls = urlsTextarea.value.split('\n').filter(url => url.trim() !== '');
    
    // 各URLに対してQRコードを生成
    urls.forEach(url => {
        // QRコードを表示するための入れ物を作成
        const box = document.createElement('div');
        box.className = 'qr-code-box';

        // QRコードを生成する本体
        new QRCode(box, {
            text: url,
            width: 128,
            height: 128,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
        
        // URLのテキスト表示
        const urlText = document.createElement('p');
        urlText.textContent = url;
        box.appendChild(urlText);
        
        // ページにQRコードを追加
        qrcodeContainer.appendChild(box);
    });
}

// テキストエリアに入力があったらgenerateQRCodes関数を呼び出す
urlsTextarea.addEventListener('input', generateQRCodes);