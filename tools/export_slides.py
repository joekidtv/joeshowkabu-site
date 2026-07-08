#!/usr/bin/env python3
"""Joe Show Kabu スライドPNG書き出しツール。

slides/ 配下のスライドHTML(slide-01.html, slide-02.html, ...)を、
インストール済みGoogle Chromeのヘッドレスモードで同名のPNGに書き出す。
Node.jsやnpmライブラリは不要。ネットワークはWebフォント取得にのみ使用。

使い方:
  python3 tools/export_slides.py slides/lectures/episode-10 assets/lectures/episode-10 --format lecture
  python3 tools/export_slides.py slides/news/2026-07-08 assets/news/2026-07-08 --format news

--format の代わりに --width/--height で任意サイズも指定可能。
"""

import argparse
import glob
import os
import shutil
import subprocess
import sys
import tempfile
import time

CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
]

FORMATS = {
    "lecture": (1080, 1350),  # 4:5 Instagramフィード縦長(レクチャー教材の標準)
    "square": (1080, 1080),   # 1:1
    "news": (1080, 1920),     # 9:16 ストーリーズ(Joe Show NEWS)
}


def find_chrome():
    for path in CHROME_CANDIDATES:
        if os.path.exists(path):
            return path
    found = shutil.which("google-chrome") or shutil.which("chromium")
    if found:
        return found
    sys.exit("エラー: Google Chromeが見つかりません。/Applications にインストールしてください。")


def export(chrome, html_path, png_path, width, height, timeout=90):
    """Chromeヘッドレスで1枚書き出す。

    注意: この環境ではChromeがスクリーンショット書き出し後もプロセスが終了しない
    ことがあるため、PNGファイルの完成(存在+サイズが安定)を検知したら
    こちらからChromeを終了させる方式にしている。
    """
    png_abs = os.path.abspath(png_path)
    if os.path.exists(png_abs):
        os.remove(png_abs)
    # 毎回まっさらな一時プロファイルを使う(普段のChromeの設定・ログイン情報と完全分離)
    with tempfile.TemporaryDirectory() as profile:
        cmd = [
            chrome,
            "--headless=new",
            "--disable-gpu",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-default-apps",
            "--disable-sync",
            "--disable-extensions",
            "--hide-scrollbars",
            "--force-device-scale-factor=1",
            f"--user-data-dir={profile}",
            f"--window-size={width},{height}",
            # Webフォント(Noto Sans JP)の読み込み完了を待つための仮想時間
            "--virtual-time-budget=10000",
            f"--screenshot={png_abs}",
            "file://" + os.path.abspath(html_path),
        ]
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            deadline = time.time() + timeout
            last_size = -1
            while time.time() < deadline:
                if os.path.exists(png_abs):
                    size = os.path.getsize(png_abs)
                    if size > 0 and size == last_size:
                        return  # 書き出し完了(サイズが安定した)
                    last_size = size
                if proc.poll() is not None:
                    break  # Chromeが自分で終了した
                time.sleep(0.5)
        finally:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    proc.kill()
    if not (os.path.exists(png_abs) and os.path.getsize(png_abs) > 0):
        sys.exit(f"エラー: {png_path} の書き出しに失敗しました(タイムアウト)。")


def main():
    parser = argparse.ArgumentParser(description="スライドHTMLをPNGに書き出す")
    parser.add_argument("src", help="スライドHTMLのあるディレクトリ、または単一のHTMLファイル")
    parser.add_argument("dest", help="PNGの出力先ディレクトリ")
    parser.add_argument("--format", choices=FORMATS.keys(), default=None,
                        help="lecture=1080x1350 / square=1080x1080 / news=1080x1920")
    parser.add_argument("--width", type=int, default=None)
    parser.add_argument("--height", type=int, default=None)
    args = parser.parse_args()

    if args.format:
        width, height = FORMATS[args.format]
    elif args.width and args.height:
        width, height = args.width, args.height
    else:
        sys.exit("エラー: --format か --width/--height のどちらかを指定してください。")

    if os.path.isfile(args.src):
        html_files = [args.src]
    else:
        html_files = sorted(glob.glob(os.path.join(args.src, "*.html")))
    if not html_files:
        sys.exit(f"エラー: {args.src} にHTMLファイルがありません。")

    os.makedirs(args.dest, exist_ok=True)
    chrome = find_chrome()

    for html_path in html_files:
        name = os.path.splitext(os.path.basename(html_path))[0] + ".png"
        png_path = os.path.join(args.dest, name)
        export(chrome, html_path, png_path, width, height)
        print(f"OK  {html_path} -> {png_path} ({width}x{height})")

    print(f"完了: {len(html_files)}枚を書き出しました。")


if __name__ == "__main__":
    main()
