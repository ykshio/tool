const input = document.getElementById("input");
const preview = document.getElementById("preview");

input.addEventListener("input", function () {
  const text = this.value;
  let previewText = "";

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (text[i] === "\n") {
      // Check for newline character
      previewText += "<br>"; // Convert newline to <br> tag
    } else if (charCode <= 127) {
      previewText += text[i];
    } else {
      previewText += `<span class="error">${text[i]}</span>`;
    }
  }

  preview.innerHTML = previewText;
});
