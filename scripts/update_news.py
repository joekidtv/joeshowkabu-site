#!/usr/bin/env python3
"""news.json を market.json / market_us.json の数値から自動生成して更新するスクリプト。

market.json(日本市場)・market_us.json(米国市場)はすでにGitHub Actionsで日次更新
されている。このスクリプトはその最新値を使って「日本株」「米国株」「為替」「指標」の
最大4本の見出しカードを作り、news.json の先頭に追記する(README の運用ルール通り)。
同じ日付・タグの既存カードがあれば、重複させずに新しい内容へ置き換える。

Instagramのストーリーズは投稿ごとの恒久リンクを持たないため、instagram_url は
プロフィールURLを設定する(README参照)。
"""

import json
import os
from datetime import datetime, timezone, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS_JSON = os.path.join(ROOT, "news.json")
MARKET_JSON = os.path.join(ROOT, "market.json")
MARKET_US_JSON = os.path.join(ROOT, "market_us.json")
JST = timezone(timedelta(hours=9))
PROFILE_URL = "https://www.instagram.com/joeshowkabu/"


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def find(items, name):
    return next((it for it in items if it.get("name") == name), None)


def main():
    market = load(MARKET_JSON)
    market_us = load(MARKET_US_JSON)
    today = datetime.now(JST).strftime("%Y-%m-%d")

    nikkei = find(market, "日経平均株価")
    usdjpy = find(market, "米ドル/円")
    jp10y = find(market, "日本10年国債金利")
    dow = find(market_us, "NYダウ(NY Dow Jones)")
    nasdaq = find(market_us, "NASDAQ")
    us10y = find(market_us, "米国10年債券利回り")

    new_entries = []

    if nikkei and nikkei.get("change"):
        new_entries.append({
            "tag": "日本株",
            "date": today,
            "summary": f"日経平均株価 {nikkei['value']}円({nikkei['change']} / {nikkei['changePercent']})",
            "instagram_url": PROFILE_URL,
        })
    if dow and nasdaq and dow.get("change"):
        new_entries.append({
            "tag": "米国株",
            "date": today,
            "summary": f"NYダウ {dow['value']}ドル({dow['change']})、NASDAQ {nasdaq['value']}({nasdaq['change']})",
            "instagram_url": PROFILE_URL,
        })
    if usdjpy and usdjpy.get("change"):
        new_entries.append({
            "tag": "為替",
            "date": today,
            "summary": f"ドル円 {usdjpy['value']}円({usdjpy['change']})",
            "instagram_url": PROFILE_URL,
        })
    if jp10y and us10y:
        new_entries.append({
            "tag": "指標",
            "date": today,
            "summary": f"日本10年金利 {jp10y['value']} / 米10年金利 {us10y['value']}",
            "instagram_url": PROFILE_URL,
        })

    if not new_entries:
        print("no market data available, nothing to do")
        return

    existing = load(NEWS_JSON)
    # 同じ日付・タグの既存カードは除去してから、新しいものを先頭に追加(重複防止)
    keys_today = {(e["tag"], e["date"]) for e in new_entries}
    kept = [e for e in existing if (e.get("tag"), e.get("date")) not in keys_today]
    result = new_entries + kept

    with open(NEWS_JSON, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"news.json updated with {len(new_entries)} entries for {today}")


if __name__ == "__main__":
    main()
