const textInput = document.getElementById('text-input');
const excludeSpacesCheckbox = document.getElementById('exclude-spaces');
const clearBtn = document.getElementById('clear-btn');

const totalNoNewlineEl = document.getElementById('total-no-newline');
const totalNoSpaceEl = document.getElementById('total-no-space');
const totalWithNewlineEl = document.getElementById('total-with-newline');
const lineCountEl = document.getElementById('line-count');
const nonEmptyLineCountEl = document.getElementById('non-empty-line-count');
const linesSummaryEl = document.getElementById('lines-summary');
const linesListEl = document.getElementById('lines-list');

const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter('ja', { granularity: 'grapheme' })
    : null;

function countChars(str) {
    if (!str) return 0;
    if (segmenter) {
        let count = 0;
        for (const _ of segmenter.segment(str)) {
            count++;
        }
        return count;
    }
    return Array.from(str).length;
}

function stripSpaces(str) {
    return str.replace(/[\s\u3000]+/g, '');
}

function updateCounts() {
    const raw = textInput.value;
    const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const excludeSpaces = excludeSpacesCheckbox.checked;

    if (normalized.length === 0) {
        totalNoNewlineEl.textContent = '0';
        totalNoSpaceEl.textContent = '0';
        totalWithNewlineEl.textContent = '0';
        lineCountEl.textContent = '0';
        nonEmptyLineCountEl.textContent = '0';
        linesSummaryEl.textContent = '最大: 0文字 / 平均: 0文字';
        linesListEl.innerHTML = '<div class="empty-state">テキストを入力すると、ここに行ごとの文字数が表示されます。</div>';
        return;
    }

    const lines = normalized.split('\n');
    const lineCount = lines.length;

    let totalNoNewline = 0;
    let totalNoSpace = 0;
    let nonEmptyLines = 0;
    let maxLineChars = 0;
    let sumDisplayedLineChars = 0;

    const fragment = document.createDocumentFragment();

    lines.forEach((line, idx) => {
        const charsWithSpace = countChars(line);
        const charsWithoutSpace = countChars(stripSpaces(line));
        const displayedCount = excludeSpaces ? charsWithoutSpace : charsWithSpace;

        totalNoNewline += charsWithSpace;
        totalNoSpace += charsWithoutSpace;
        if (charsWithoutSpace > 0) {
            nonEmptyLines++;
        }
        if (displayedCount > maxLineChars) {
            maxLineChars = displayedCount;
        }
        sumDisplayedLineChars += displayedCount;

        const row = document.createElement('div');
        const isEmpty = line.length === 0;
        row.className = 'line-row' + (isEmpty ? ' is-empty' : '');

        const numSpan = document.createElement('span');
        numSpan.className = 'line-number';
        numSpan.textContent = `${idx + 1}行目`;

        const countSpan = document.createElement('span');
        countSpan.className = 'line-count-badge';
        countSpan.textContent = `${displayedCount}文字`;

        const textSpan = document.createElement('span');
        textSpan.className = 'line-text';
        textSpan.textContent = isEmpty ? '（空行）' : line;

        row.appendChild(numSpan);
        row.appendChild(countSpan);
        row.appendChild(textSpan);
        fragment.appendChild(row);
    });

    const totalWithNewline = totalNoNewline + (lineCount - 1);
    const avgChars = lineCount > 0 ? (sumDisplayedLineChars / lineCount).toFixed(1) : '0';

    totalNoNewlineEl.textContent = totalNoNewline.toLocaleString();
    totalNoSpaceEl.textContent = totalNoSpace.toLocaleString();
    totalWithNewlineEl.textContent = totalWithNewline.toLocaleString();
    lineCountEl.textContent = lineCount.toLocaleString();
    nonEmptyLineCountEl.textContent = nonEmptyLines.toLocaleString();
    linesSummaryEl.textContent = `最大: ${maxLineChars.toLocaleString()}文字 / 平均: ${avgChars}文字`;

    linesListEl.innerHTML = '';
    linesListEl.appendChild(fragment);
}

textInput.addEventListener('input', updateCounts);
excludeSpacesCheckbox.addEventListener('change', updateCounts);

clearBtn.addEventListener('click', () => {
    textInput.value = '';
    updateCounts();
    textInput.focus();
});
