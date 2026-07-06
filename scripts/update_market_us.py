#!/usr/bin/env python3
"""market_us.json を米国市場の終値で更新するスクリプト。

GitHub Actions から、米国市場が閉まった後の時間帯(JST朝)に毎日実行される想定。
NYダウ・S&P500・NASDAQ・米国10年債券利回りをYahoo Financeから取得する。

サマータイム(EDT)と標準時間(EST)で米国市場の開閉時刻が変わる点に対応するため、
固定時刻をハードコードするのではなく、Yahoo Financeのレスポンスに含まれる
`currentTradingPeriod.regular`(取引所が今まさに報告している「当日の正規取引時間」)
を見て、現在時刻がその取引終了時刻を過ぎているかどうかを都度判定する。
過ぎていなければ「まだ取引時間中 or ザラ場中のデータ」とみなし、その項目は更新しない
(取得に失敗した場合と同様、既存の値を保持するフェイルセーフ)。
"""

import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKET_JSON = os.path.join(ROOT, "market_us.json")
JST = timezone(timedelta(hours=9))

# Yahoo Finance から取得する項目。name は market_us.json 内の name と一致させる。
YAHOO = {
    "NYダウ(NY Dow Jones)": {"symbol": "^DJI", "decimals": 2, "unit": "", "pct": True},
    "S&P500": {"symbol": "^GSPC", "decimals": 2, "unit": "", "pct": True},
    "NASDAQ": {"symbol": "^IXIC", "decimals": 2, "unit": "", "pct": True},
    "米国10年債券利回り": {"symbol": "^TNX", "decimals": 3, "unit": "%", "pct": False},
}


def fetch_yahoo(symbol):
    url = (
        "https://query1.finance.yahoo.com/v8/finance/chart/"
        + urllib.parse.quote(symbol)
        + "?interval=1m&range=1d&includePrePost=true"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as res:
        data = json.load(res)
    meta = data["chart"]["result"][0]["meta"]
    price = meta.get("regularMarketPrice")
    prev = meta.get("chartPreviousClose")
    ts = meta.get("regularMarketTime")
    period = (meta.get("currentTradingPeriod") or {}).get("regular") or {}
    regular_end = period.get("end")
    if price is None or prev is None:
        raise ValueError("missing price/prevClose for " + symbol)
    return float(price), float(prev), ts, regular_end


def market_is_closed(ts, regular_end):
    """現在時刻が、取引所が報告する当日の正規取引終了時刻を過ぎているか判定する。"""
    if regular_end is None:
        return True  # 判定材料が無ければ(祝日等)、そのまま採用する
    now_utc = datetime.now(timezone.utc).timestamp()
    return now_utc >= regular_end


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
            continue
        try:
            price, prev, ts, regular_end = fetch_yahoo(cfg["symbol"])
        except Exception as e:  # noqa: BLE001 — フェイルセーフで既存値を維持
            print(f"[skip] {item['name']}: fetch error: {e}")
            continue

        if not market_is_closed(ts, regular_end):
            print(f"[skip] {item['name']}: 米国市場はまだ取引時間中のため見送り")
            continue

        change = price - prev
        pct = (change / prev * 100) if prev else 0.0
        sign = "+" if change >= 0 else "-"

        item["value"] = fmt(price, cfg["decimals"]) + cfg["unit"]
        item["change"] = f"{sign}{fmt(abs(change), cfg['decimals'])}"
        item["changePercent"] = f"{sign}{abs(pct):.2f}%" if cfg["pct"] else ""
        item["updated"] = now_jst.strftime("%Y-%m-%d") + " (自動取得)"
        changed = True
        print(f"[ok] {item['name']}: {item['value']} ({item['change']})")

    if changed:
        with open(MARKET_JSON, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print("market_us.json updated")
    else:
        print("no changes")


if __name__ == "__main__":
    main()
