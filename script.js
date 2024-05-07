const input = document.getElementById('input');
const preview = document.getElementById('preview');

input.addEventListener('input', function() {
  const text = this.value;
  let previewText = '';

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Check if the character is a 7-bit character (ASCII characters)
    if (charCode <= 127) {
      previewText += text[i];
    } else {
      // If not a 7-bit character, apply error class to change color
      previewText += `<span class="error">${text[i]}</span>`;
    }
  }

  preview.innerHTML = previewText;
});
