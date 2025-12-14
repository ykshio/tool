// 現在のRGB値を保持
const colorState = {
  r: 0,
  g: 0,
  b: 0
};

// DOM要素
const colorCodeDisplay = document.getElementById('color-code');
const channelRadios = document.querySelectorAll('input[name="channel"]');
const valueButtons = document.querySelectorAll('.value-btn');

// 数値を2桁の16進数に変換
function toHex(value) {
  return value.toString(16).padStart(2, '0').toUpperCase();
}

// 現在の背景色を更新
function updateBackgroundColor() {
  const hexColor = `#${toHex(colorState.r)}${toHex(colorState.g)}${toHex(colorState.b)}`;
  document.body.style.backgroundColor = hexColor;
  colorCodeDisplay.textContent = hexColor;
}

// 選択中のチャンネルを取得
function getSelectedChannel() {
  const selected = document.querySelector('input[name="channel"]:checked');
  return selected ? selected.value : 'r';
}

// ボタンの色を更新（選択中のチャンネルに応じて）
function updateButtonColors() {
  const channel = getSelectedChannel();

  valueButtons.forEach(btn => {
    const value = parseInt(btn.dataset.value);
    const hex = toHex(value);

    let bgColor;
    switch (channel) {
      case 'r':
        bgColor = `#${hex}0000`;
        break;
      case 'g':
        bgColor = `#00${hex}00`;
        break;
      case 'b':
        bgColor = `#0000${hex}`;
        break;
    }

    btn.style.backgroundColor = bgColor;
    // 明るさに応じてテキスト色を変更
    btn.style.color = value > 128 ? '#000000' : '#FFFFFF';
  });
}

// チャンネル選択が変わった時
channelRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    updateButtonColors();
  });
});

// 値ボタンがクリックされた時
valueButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const value = parseInt(btn.dataset.value);
    const channel = getSelectedChannel();

    // 選択中のチャンネルの値を更新
    colorState[channel] = value;

    // 背景色を更新
    updateBackgroundColor();
  });
});

// 初期化
updateButtonColors();
updateBackgroundColor();
