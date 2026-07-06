# Joe Show Kabu 公式サイト — 運用マニュアル

## ファイル構成
```
index.html         トップページ
lectures.html      レクチャーアーカイブ
calendar.html      経済カレンダーページ
about.html         Aboutページ
disclaimer.html    免責事項ページ
lectures.json      ← レクチャーのデータ(ここを編集)
news.json          ← NEWSのデータ(ここを編集)
market.json        ← 本日の主要指数のデータ(日経平均・ドル円は自動更新)
calendar.json      ← 経済カレンダーのイベントデータ(ここを編集)
assets/
  logo.png         公式ロゴ
  style.css        全ページ共通デザイン
  app.js           データ読み込み・描画
  calendar.js      経済カレンダーの描画
  i18n.js          JP/EN言語切り替え
  thumbs/          サムネイル画像を入れる場所
scripts/
  update_market.py 市場データの自動更新スクリプト(GitHub Actionsが実行)
.github/workflows/
  update-market.yml 市場データを毎日自動更新するワークフロー
```

## 公開方法(どちらか)
- **Netlify**: このフォルダごとドラッグ&ドロップするだけで公開
- **GitHub Pages**: このフォルダをリポジトリにpushし、Pagesを有効化

※ローカルのブラウザでindex.htmlを直接開くと、JSON読み込み(fetch)がブラウザの制限でブロックされる場合があります。正しく確認するには、上記のように公開するか、簡易サーバー(`python3 -m http.server`)を使ってください。

## 新しいレクチャーを追加するには
`lectures.json` の配列の**末尾**に、以下の形式で1件追記して保存するだけです。
トップの「最新レクチャー」とアーカイブの両方に自動で反映されます。

```json
{
  "id": "lecture-10",
  "number": "10",
  "title": "分散投資とリスク許容度",
  "category": ["分散投資"],
  "summary": "1〜2文の紹介文をここに書く。",
  "thumbnail": "",
  "instagram_url": "https://www.instagram.com/p/実際の投稿ID/",
  "status": "published"
}
```

- `category`: 配列。ここに書いた言葉がアーカイブのフィルターに自動で追加されます
- `thumbnail`: 空欄 `""` でもOK(その場合は番号+タイトルのデザイン枠が自動表示される)。Instagram投稿1ページ目の画像を使う場合は、`assets/thumbs/lecture01.png` のように連番でファイルを置き、パスを書く(例: `"assets/thumbs/lecture01.png"`)。カード上部の枠(4:5の縦長・太い黒枠)に自動でトリミング表示されます
- `instagram_url`: その回の投稿URL。まだ無ければプロフィールURLでも可
- `status`: `"published"`(公開) か `"upcoming"`(近日公開・半透明表示)

## 新しいNEWSを追加するには
`news.json` の配列の**先頭**に1件追記(新しいものが左に来ます)。

```json
{
  "tag": "日本株",
  "date": "2026-07-10",
  "summary": "見出しを1文で",
  "instagram_url": ""
}
```

- `date`: `YYYY-MM-DD` 形式で書くと、サイト側で自動的に `07/10 (木)` のように曜日付きで表示されます
- `instagram_url`: その回の投稿URLを入れるとカードがリンクになります。空欄 `""` ならリンクなしのカードになります

## 本日の主要指数(自動更新)
トップページの「NEWS」セクションに、1枚1指標のカードが3秒ごとに自動でスライドするカルーセルとして表示されます。データは `market.json`。更新方法は指標ごとに次の通りです。

### 自動更新される指標(手作業不要)
- **日経平均株価 / 米ドル/円**: GitHub Actions(`.github/workflows/update-market.yml`)が毎日決まった時刻に `scripts/update_market.py` を実行し、Yahoo Financeから最新値を取得して `market.json` を自動コミットします。コミットが入るとNetlifyが自動で再デプロイします。市場が閉まっている時間帯は直前営業日の終値が入ります。
- さらに **米ドル/円** は、ページを開くたびにブラウザ側でも `frankfurter.dev`(ECB基準レート)から取得して上書きするので、日次コミットの合間でも最新の営業日レートになります。

> **GitHub Actionsを有効にする手順**: リポジトリの Settings → Actions → General で "Allow all actions" を選び、"Workflow permissions" を **Read and write permissions** にしてください(botがコミットをpushするため)。有効化後、Actionsタブの "Update market data" から手動実行(Run workflow)して動作確認できます。

### 手動更新が必要な指標
- **TOPIX / 日本10年国債金利**: 無料で安定して取得できる公開データソースが見つからなかったため、自動化の対象外です。値が古くなったら `market.json` の該当項目を手で書き換えてください。各項目の `sourceUrl`(日本経済新聞のマーケットページ)を開いて数値を確認し、コピーします。ワークフローはこの2項目を上書きしません(既存値を保持します)。

### `market.json` の各フィールド
```json
{
  "name": "日経平均株価",
  "value": "69,744.07",
  "change": "+1,010.92",
  "changePercent": "+1.47%",
  "updated": "2026-07-03 15:00 終値",
  "sourceLabel": "日本経済新聞",
  "sourceUrl": "https://www.nikkei.com/marketdata/quote/NK225/"
}
```
- `name`: 指標名。**`日経平均株価` と `米ドル/円` は自動更新の対象キーなので、名前を変えないでください**
- `value`: 現在値の表示テキスト
- `change`: 前日比。先頭の `+` / `-` で赤(上昇)/緑(下落)の色と▲▼が付きます。空欄 `""` ならその行は非表示
- `changePercent`: 前日比(%)。不要なら空欄 `""`
- `updated`: カード下部に表示される更新日時テキスト
- `sourceLabel` / `sourceUrl`: 出典リンクのラベルとURL

※出典: 日経平均・米ドル/円の自動取得は [Yahoo Finance](https://finance.yahoo.com/)、米ドル/円のブラウザ側ライブ更新は [Frankfurter(ECB基準レート)](https://www.frankfurter.dev/) を利用しています。

## 経済カレンダーを更新するには
`calendar.html` が経済カレンダーページ、データは `calendar.json` です。
2026年の「日銀金融政策決定会合(全8回)」「FOMC(全8回)」「米CPI(全12回)」「米雇用統計(全12回)」は、
各機関の公式発表スケジュールを元に登録済みです(出典はページ下部と `calendar.json` の `sources` に明記)。

**新しいイベント(例: 日米首脳会談)を追加するには**、`calendar.json` の `events` 配列に1件追記するだけです:

```json
{
  "date": "2026-08-15",
  "category": "other",
  "title": "日米首脳会談",
  "desc": "ワシントンで開催予定。通商・為替が議題になる可能性。"
}
```

- `date`: `YYYY-MM-DD` 形式
- `category`: `"jp"`(日本・赤) / `"us"`(米国・緑) / `"other"`(その他・国際・黒)。カレンダーの丸い点の色分けに使われます
- `title`: イベント名(詳細パネルに表示)
- `desc`: 補足説明(省略可)

**運用上の注意**:
- このカレンダーは自動では更新されません。日程変更(政府機関閉鎖による延期など)や新規イベントは、出典元(下記)を確認のうえ手動で `calendar.json` に反映してください
- 外部サイトの情報を使う場合は、`sources` 配列に出典(ラベルとURL)を必ず追加してください。ページ下部に自動で出典一覧として表示されます
- 登録済みイベントの出典: [日本銀行(2026年会合日程PDF)](https://www.boj.or.jp/mopo/mpmsche_minu/m_ref/mref250731a.pdf) / [FRB(FOMCカレンダー)](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm) / [BLS(CPI)](https://www.bls.gov/schedule/news_release/cpi.htm) / [BLS(雇用統計)](https://www.bls.gov/schedule/news_release/empsit.htm)

## 現在の状態・差し替え推奨
- 第1〜8回の `instagram_url` は実際の投稿URLを設定済み。第9回は近日公開のため空欄
- 各レクチャーの `thumbnail` は空欄で、番号+タイトルのデザイン枠が自動生成されて表示されます。Instagram投稿1枚目の画像を `assets/thumbs/` に入れてパスを設定すれば、その画像に差し替わります
- `news.json` は現在サンプル内容。実運用時に日々のNEWS見出しへ差し替えてください

## 将来の拡張(未実装)
`assets/app.js` の `fetchJSON` 関数が全データ取得の入り口です。将来Instagram Graph APIで
投稿を自動取得したくなった場合は、ここをAPI呼び出しに差し替えれば、HTML側は変更不要です。
（トークンの定期更新やサーバー処理が必要になるため、必要になった時点で別途実装してください）

## デザイン変更時の注意
- カラーは 赤#FF3333 / 緑#33CC66 / 黒#000000 / 白#FFFFFF のみ
- 白背景・グラデーション禁止・角丸あり・2px枠・ハードシャドウ が統一ルール
- 色やレイアウトは `assets/style.css` の先頭 `:root` の変数でまとめて管理
