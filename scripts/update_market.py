#!/usr/bin/env python3
"""market.json のうち、日経平均株価・米ドル/円を更新するスクリプト。

GitHub Actions から、東証の取引終了時刻(15:30 JST)以降に毎日実行される想定。
日経平均・米ドル/円ともに二次ソースとして Yahoo Finance を利用する
(確度の高い情報源として、日本経済新聞社が算出する日経平均の値をYahoo Finance
経由で取得する形)。TOPIX・日本10年国債金利はこのスクリプトの対象外で、
既存の値をそのまま保持する(東証公式ページからの手動更新を継続)。

日経平均は「15:30の取引終了時点にリセットする」というルールを厳格に守るため、
Yahoo Financeが返す `currentTradingPeriod.regular.end`(その日の正規取引の
終了時刻)を見て、現在時刻がそれを過ぎているかを確認してから採用する。
過ぎていなければ(まだ取引時間中、または祝日でデータが更新されていない等)
その日の更新を見送り、既存の値を保持する。

米ドル/円は為替のため取引所としての「引け」は無いが、同じく15:30 JSTの
基準時刻にスナップショットを取ることで、日経平均と同じタイミングの値に揃える。
"""

import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKET_JSON = os.path.join(ROOT, "market.json")
JST = timezone(timedelta(hours=9))

YAHOO = {
    "日経平均株価": {"symbol": "^N225", "decimals": 2, "unit": "", "check_close": True},
    "米ドル/円": {"symbol": "USDJPY=X", "decimals": 2, "unit": "", "check_close": False},
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
    prev = meta.get("chartPreviousClose") or meta.get("previousClose")
    period = (meta.get("currentTradingPeriod") or {}).get("regular") or {}
    regular_end = period.get("end")
    if price is None or prev is None:
        raise ValueError("missing price/prevClose for " + symbol)
    return float(price), float(prev), regular_end


def market_is_closed(regular_end):
    if regular_end is None:
        return True  # 判定材料が無ければ(祝日等)、そのまま採用する
    return datetime.now(timezone.utc).timestamp() >= regular_end


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
            continue  # TOPIX / 国債金利は東証公式ページからの手動更新を維持
        try:
            price, prev, regular_end = fetch_yahoo(cfg["symbol"])
        except Exception as e:  # noqa: BLE001 — フェイルセーフで既存値を維持
            print(f"[skip] {item['name']}: fetch error: {e}")
            continue

        if cfg["check_close"] and not market_is_closed(regular_end):
            print(f"[skip] {item['name']}: まだ取引時間中(15:30未到達)のため見送り")
            continue

        change = price - prev
        pct = (change / prev * 100) if prev else 0.0
        sign = "+" if change >= 0 else "-"

        item["value"] = fmt(price, cfg["decimals"]) + cfg["unit"]
        item["change"] = f"{sign}{fmt(abs(change), cfg['decimals'])}"
        item["changePercent"] = f"{sign}{abs(pct):.2f}%"
        item["updated"] = now_jst.strftime("%Y-%m-%d") + " 15:30 (自動取得)"
        item["sourceLabel"] = "Yahoo Finance"
        item["sourceUrl"] = f"https://finance.yahoo.com/quote/{urllib.parse.quote(cfg['symbol'], safe='=')}/"
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
