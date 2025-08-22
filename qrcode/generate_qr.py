import qrcode
import os
import re

# --- 設定項目 ---
# URLリストが書かれたテキストファイル名
URL_FILE = 'urls.txt'
# QRコード画像を保存するフォルダ名
OUTPUT_DIR = 'qr_codes_output'

def sanitize_filename(url):
    """ URLから安全なファイル名を生成する """
    # 'https://' や 'http://' を除去
    sanitized = re.sub(r'https?://', '', url)
    # ファイル名として使えない文字を'_'に置換
    sanitized = re.sub(r'[\\/:*?"<>|]+', '_', sanitized)
    # 末尾のスラッシュを除去
    if sanitized.endswith('/'):
        sanitized = sanitized[:-1]
    return sanitized if sanitized else "no_name"

def main():
    """メイン処理"""
    # 1. TXTファイルが存在するかチェック
    if not os.path.exists(URL_FILE):
        print(f"エラー: URLファイル '{URL_FILE}' が見つかりません。")
        print("スクリプトと同じ場所にファイルを作成してください。")
        return

    # 2. ファイルからURLリストを読み込む
    print(f"'{URL_FILE}' を読み込んでいます...")
    with open(URL_FILE, 'r', encoding='utf-8') as f:
        # 各行の空白文字（改行含む）を除去し、空行は無視する
        urls_to_generate = [line.strip() for line in f if line.strip()]

    if not urls_to_generate:
        print(f"'{URL_FILE}' の中身が空です。URLを1行に1つずつ入力してください。")
        return

    # 3. 保存用フォルダを作成
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"保存フォルダ '{OUTPUT_DIR}' を作成しました。")

    print(f"\n{len(urls_to_generate)}個のQRコードを生成します...")

    # 4. 各URLに対してQRコードを生成
    for i, url in enumerate(urls_to_generate):
        try:
            img = qrcode.make(url)
            
            # 保存ファイル名をURLから生成
            filename = f"{i+1:03d}_{sanitize_filename(url)}.png"
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            # 画像を保存
            img.save(filepath)
            print(f"  ✅ [{i+1}/{len(urls_to_generate)}] {filename} を保存しました。")

        except Exception as e:
            print(f"  ❌ [{i+1}/{len(urls_to_generate)}] {url} の生成に失敗しました: {e}")

    print("\nすべての処理が完了しました。")

if __name__ == '__main__':
    main()