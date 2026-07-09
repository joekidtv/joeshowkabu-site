#!/usr/bin/env python3
"""market_us.json を米国市場の終値で更新するスクリプト。

GitHub Actions から、米国市場が閉まった後の時間帯(JST朝)に毎日実行される想定。
NYダウ・S&P500・NASDAQ・米国10年債券利回りをYahoo Financeから取得する。

サマータイム(EDT)と標準時間(EST)で米国市場の開閉時刻が変わる点に対応するため、
固定時刻をハードコードするのではなく、Yahoo Financeのレスポンスに含まれる
実際の最終取引時刻(`regularMarketTime`)を取引所のローカル時間(通常
America/New_York)に変換し、それが当日の通常取引終了時刻(16:00)を過ぎているか、
または前営業日以前の日付になっているかで判定する。

(以前は `currentTradingPeriod.regular.end` と現在時刻を比較していたが、
取引終了直後にYahoo側が「次の取引セッション」の予定時刻を返すことがあり、
その場合いつまで経っても現在時刻がそれを超えず、毎回「取引時間中」と誤判定されて
更新が止まり続けるバグがあった。最終取引時刻そのものを見る方式に変更し、
この問題を回避する)
"""

import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, time as dtime, timezone, timedelta
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKET_JSON = os.path.join(ROOT, "market_us.json")
JST = timezone(timedelta(hours=9))
MARKET_CLOSE_LOCAL = dtime(16, 0)  # 通常取引の終了時刻(取引所ローカル時間)

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
    tz_name = meta.get("exchangeTimezoneName") or "America/New_York"
    if price is None or prev is None:
        raise ValueError("missing price/prevClose for " + symbol)
    return float(price), float(prev), ts, tz_name


def market_is_closed(ts, tz_name):
    """最終取引時刻を取引所のローカル時間に変換し、当日の取引終了時刻(16:00)を
    過ぎているか、または前営業日以前のデータかを見て、確定した終値かどうかを判定する。"""
    if ts is None:
        return True  # 判定材料が無ければ(祝日等)、そのまま採用する
    tz = ZoneInfo(tz_name)
    trade_local = datetime.fromtimestamp(ts, tz)
    now_local = datetime.now(tz)
    if trade_local.date() < now_local.date():
        return True  # 最終取引が前営業日以前 → 確実に確定した終値
    return trade_local.time() >= MARKET_CLOSE_LOCAL


def fmt(value, decimals):
    return f"{value:,.{decimals}f}"


def main():
    with open(MARKET_JSON, encoding="utf-8") as f:
        items = json.load(f)

    changed = False

    for item in items:
        cfg = YAHOO.get(item.get("name"))
        if not cfg:
            continue
        try:
            price, prev, ts, tz_name = fetch_yahoo(cfg["symbol"])
        except Exception as e:  # noqa: BLE001 — フェイルセーフで既存値を維持
            print(f"[skip] {item['name']}: fetch error: {e}")
            continue

        if not market_is_closed(ts, tz_name):
            print(f"[skip] {item['name']}: 米国市場はまだ取引時間中のため見送り")
            continue

        change = price - prev
        pct = (change / prev * 100) if prev else 0.0
        sign = "+" if change >= 0 else "-"

        # 表示上の日付は「その終値が実際にどの取引日のものか」を、
        # スクリプト実行時刻(JST)ではなく最終取引時刻(ts)から求めて正しく表示する。
        trade_date_jst = datetime.fromtimestamp(ts, JST) if ts else datetime.now(JST)

        item["value"] = fmt(price, cfg["decimals"]) + cfg["unit"]
        item["change"] = f"{sign}{fmt(abs(change), cfg['decimals'])}"
        item["changePercent"] = f"{sign}{abs(pct):.2f}%" if cfg["pct"] else ""
        item["updated"] = trade_date_jst.strftime("%Y-%m-%d") + " (自動取得)"
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
