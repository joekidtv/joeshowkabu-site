#!/usr/bin/env python3
"""market.json を最新の市場データで更新するスクリプト。

GitHub Actions から毎日実行される想定。日経平均と米ドル/円は Yahoo Finance の
公開エンドポイントから取得する(サーバー側実行なので CORS 制限を受けない)。
TOPIX と日本10年国債金利は無料で安定取得できる公開ソースが無いため、
既存 market.json の値をそのまま保持する(手動更新 + 出典リンク運用)。

取得に失敗した項目は、既存の値を維持する(フェイルセーフ)。
市場が閉まっている時間帯は、Yahoo が直前営業日の終値を返すため、
そのまま「直前営業日の値」として反映される。
"""

import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKET_JSON = os.path.join(ROOT, "market.json")
JST = timezone(timedelta(hours=9))

# Yahoo Finance から自動取得する項目。name は market.json 内の name と一致させる。
YAHOO = {
    "日経平均株価": {"symbol": "^N225", "decimals": 2, "unit": ""},
    "米ドル/円": {"symbol": "USDJPY=X", "decimals": 2, "unit": ""},
}


def fetch_yahoo(symbol):
    url = (
        "https://query1.finance.yahoo.com/v8/finance/chart/"
        + urllib.parse.quote(symbol)
        + "?interval=1d&range=5d"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as res:
        data = json.load(res)
    meta = data["chart"]["result"][0]["meta"]
    price = meta.get("regularMarketPrice")
    prev = meta.get("chartPreviousClose") or meta.get("previousClose")
    ts = meta.get("regularMarketTime")
    if price is None or prev is None:
        raise ValueError("missing price/prevClose for " + symbol)
    return float(price), float(prev), ts


def fmt(value, decimals):
    return f"{value:,.{decimals}f}"


def main():
    with open(MARKET_JSON, encoding="utf-8") as f:
        items = json.load(f)

    now_jst = datetime.now(JST)
    changed = False

    for item in items:
        cfg = YAHOO.get(item.get("name"))
        if not cfg:
            continue  # TOPIX / 国債金利などは手動値を保持
        try:
            price, prev, ts = fetch_yahoo(cfg["symbol"])
        except Exception as e:  # noqa: BLE001 — フェイルセーフで既存値を維持
            print(f"[skip] {item['name']}: {e}")
            continue

        change = price - prev
        pct = (change / prev * 100) if prev else 0.0
        sign = "+" if change >= 0 else "-"

        item["value"] = fmt(price, cfg["decimals"]) + cfg["unit"]
        item["change"] = f"{sign}{fmt(abs(change), cfg['decimals'])}"
        item["changePercent"] = f"{sign}{abs(pct):.2f}%"

        if ts:
            d = datetime.fromtimestamp(ts, JST)
            item["updated"] = d.strftime("%Y-%m-%d %H:%M") + " (自動取得)"
        else:
            item["updated"] = now_jst.strftime("%Y-%m-%d %H:%M") + " (自動取得)"
        changed = True
        print(f"[ok] {item['name']}: {item['value']} ({item['change']})")

    if changed:
        with open(MARKET_JSON, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print("market.json updated")
    else:
        print("no changes")


if __name__ == "__main__":
    main()
