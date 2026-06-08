const $ = (id) => document.getElementById(id);

// --- 数値入力を読む（空・0・負は無効として0を返す） ---
function countOf(id) {
    const n = parseInt($(id).value, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

// --- IDの整形（@や空白を除去し、複数を配列で返す） ---
function parseIds(value) {
    return value
        .split(/[\s,]+/)
        .map((s) => s.trim().replace(/^@/, ''))
        .filter(Boolean);
}

// --- クエリ組み立て ---
function buildQuery() {
    const parts = [];

    // アカウント
    parseIds($('from').value).forEach((id) => parts.push(`from:${id}`));
    parseIds($('to').value).forEach((id) => parts.push(`to:${id}`));
    parseIds($('exclude-from').value).forEach((id) => parts.push(`-from:${id}`));

    // キーワード
    const kw = $('keywords').value.trim();
    if (kw) parts.push(kw);

    const phrase = $('phrase').value.trim();
    if (phrase) parts.push(`"${phrase}"`);

    $('exclude-words').value
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((w) => parts.push(`-${w}`));

    const tag = $('hashtag').value.trim().replace(/^#/, '');
    if (tag) parts.push(`#${tag}`);

    // 期間
    if ($('since').value) parts.push(`since:${$('since').value}`);
    if ($('until').value) parts.push(`until:${$('until').value}`);

    // 人気度しきい値
    const faves = countOf('min-faves');
    if (faves) parts.push(`min_faves:${faves}`);
    const rts = countOf('min-retweets');
    if (rts) parts.push(`min_retweets:${rts}`);
    const replies = countOf('min-replies');
    if (replies) parts.push(`min_replies:${replies}`);

    // 種類フィルタ
    if ($('only-rt').checked) parts.push('filter:nativeretweets');
    if ($('no-rt').checked) parts.push('-filter:nativeretweets');
    if ($('no-replies').checked) parts.push('-filter:replies');
    if ($('only-media').checked) parts.push('filter:media');
    if ($('only-images').checked) parts.push('filter:images');
    if ($('only-videos').checked) parts.push('filter:videos');
    if ($('only-links').checked) parts.push('filter:links');
    if ($('only-ja').checked) parts.push('lang:ja');

    const query = parts.join(' ');
    $('query-preview').value = query;
    return query;
}

// --- Xの検索URLを生成 ---
function buildUrl() {
    const query = buildQuery();
    if (!query) return null;
    const tab = document.querySelector('input[name="tab"]:checked').value;
    const params = new URLSearchParams({ q: query });
    if (tab === 'live') params.set('f', 'live'); // 最新順。topは指定なし
    return `https://x.com/search?${params.toString()}`;
}

// --- クイック日付ボタン ---
function toDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
document.querySelectorAll('.quick-dates button').forEach((btn) => {
    btn.addEventListener('click', () => {
        const range = btn.dataset.range;
        if (range === 'clear') {
            $('since').value = '';
            $('until').value = '';
        } else {
            const days = Number(range);
            const now = new Date();
            const past = new Date();
            past.setDate(now.getDate() - days);
            $('since').value = toDateStr(past);
            $('until').value = toDateStr(now);
        }
        buildQuery();
    });
});

// --- 入力のたびにプレビュー更新 ---
document
    .querySelectorAll('input[type="text"], input[type="date"], input[type="number"], input[type="checkbox"], input[type="radio"]')
    .forEach((el) => el.addEventListener('input', buildQuery));

// --- ボタン操作 ---
$('search-btn').addEventListener('click', () => {
    const url = buildUrl();
    if (!url) {
        alert('検索条件を1つ以上入力してください。');
        return;
    }
    window.open(url, '_blank');
});

$('copy-btn').addEventListener('click', async () => {
    const query = buildQuery();
    if (!query) return;
    await navigator.clipboard.writeText(query);
    const btn = $('copy-btn');
    const original = btn.textContent;
    btn.textContent = 'コピーしました！';
    setTimeout(() => (btn.textContent = original), 1500);
});

$('reset-btn').addEventListener('click', () => {
    document.querySelectorAll('input[type="text"], input[type="date"]').forEach((el) => (el.value = ''));
    document.querySelectorAll('input[type="number"]').forEach((el) => (el.value = 0));
    document.querySelectorAll('input[type="checkbox"]').forEach((el) => (el.checked = false));
    document.querySelector('input[name="tab"][value="live"]').checked = true;
    buildQuery();
});

buildQuery();
