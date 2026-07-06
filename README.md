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
market.json        ← 本日の主要指数のデータ(日経平均・ドル円は自動更新、TOPIX・国債金利は手動)
market_us.json     ← 本日の米国市場のデータ(NYダウ・S&P500・NASDAQ・米10年金利。自動更新)
calendar.json      ← 経済カレンダーのイベントデータ(ここを編集)
assets/
  logo.png         公式ロゴ
  style.css        全ページ共通デザイン
  app.js           データ読み込み・描画
  calendar.js      経済カレンダーの描画
  i18n.js          JP/EN言語切り替え
  thumbs/          サムネイル画像を入れる場所
scripts/
  update_market.py    日本の市場データ(日経平均・ドル円)の自動更新スクリプト
  update_market_us.py 米国市場データの自動更新スクリプト
.github/workflows/
  update-market.yml    日本の市場データを毎日自動更新するワークフロー
  update-market-us.yml 米国市場データを毎日自動更新するワークフロー
```

## 公開方法(GitHub Pages・推奨)
Netlifyの無料枠(ビルド時間)を使い切ったため、現在は **GitHub Pages** で公開しています。
リポジトリの Settings → Pages → Source を `Deploy from a branch`、Branch を `main` / `/ (root)` に設定するだけで、
`main` にpushするたびに自動で再公開されます。ビルド時間の制限が無く、市場データの自動更新(1日3回のコミット)を
気にせず使えます。

公開URL: `https://<GitHubユーザー名>.github.io/joeshowkabu-site-/`(実際のURLはPages有効化後に確認してください)

### Netlifyを使う場合(代替・課金注意)
このフォルダごとドラッグ&ドロップするだけで公開できますが、無料枠には月間のビルド時間上限があります。
GitHub Actionsによる1日3回の自動コミット(市場データ更新)が積み重なるとすぐに上限に達するため、
Netlifyを使う場合は Site configuration → Build & deploy で「Stop builds」にするか、
自動更新ワークフロー(`.github/workflows/`)の頻度を減らすことを検討してください。

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

## 本日の主要指数(日経平均・米ドル/円は自動更新、TOPIX・国債金利は手動更新)
トップページの「NEWS」セクションに、1枚1指標のカードが3秒ごとに自動でスライドするカルーセルとして表示されます。データは `market.json`。掲載指標: 日経平均株価 / TOPIX / 米ドル/円 / 日本10年国債金利。

### 更新ルール(必ず守ること)
1. **毎日、取引時間終了後(15:30 JST)の値にリセットする。** それより前の値・寄り付き値・ザラ場中の速報値は使わない
2. **終値ベースの数値のみを使う。**
3. **情報源は、日本経済新聞・Yahoo Financeなど確度の高いところに限る。** 出典不明のサイトや個人ブログ等は使わない

### 自動更新される指標
- **日経平均株価 / 米ドル/円**: GitHub Actions(`.github/workflows/update-market.yml`)が平日16:00 JST(東証の取引終了後)に `scripts/update_market.py` を実行し、[Yahoo Finance](https://finance.yahoo.com/) から取得して `market.json` を自動コミットします
- 日経平均は、Yahoo Financeが返す「その日の正規取引終了時刻(15:30 JST)」を過ぎているかをスクリプト側で確認してから採用します。まだ取引時間中(祝日で取引が無い場合を除く)であれば、その日の更新を見送り既存の値を保持します(取引時間中の速報値を終値として誤採用しないためのフェイルセーフ)
- 米ドル/円は為替で「引け」という概念が無いため、日経平均と同じ実行タイミング(15:30 JST以降)でのスナップショットを終値相当の値として扱います

> **GitHub Actionsを有効にする手順**: リポジトリの Settings → Actions → General で「Workflow permissions」を **Read and write permissions** にしてください。Actionsタブの "Update market data (JP)" から手動実行(Run workflow)して動作確認できます。

### 手動更新が必要な指標
- **TOPIX**: 東証(JPX)の公式ページ「[JPX リアルタイム株価指数値一覧](https://www.jpx.co.jp/markets/indices/realvalues/01.html)」を15:30以降に開き、終値を転記します(JPXは無料の機械可読データを提供していないため自動化不可)
- **日本10年国債金利**: 日本経済新聞のマーケットページ等、確度の高い情報源から15:30以降の値を転記します

### `market.json` の各フィールド
```json
{
  "name": "日経平均株価",
  "value": "69,737.69",
  "change": "-6.38",
  "changePercent": "-0.01%",
  "updated": "2026-07-06 15:30 (自動取得)",
  "sourceLabel": "Yahoo Finance",
  "sourceUrl": "https://finance.yahoo.com/quote/%5EN225/"
}
```
- `name`: 指標名。**`日経平均株価` と `米ドル/円` は自動更新の対象キーなので、名前を変えないでください**
- `value`: 終値(相当)の表示テキスト
- `change`: 前日比。先頭の `+` / `-` で赤(上昇)/緑(下落)の色と▲▼が付きます。空欄 `""` ならその行は非表示
- `changePercent`: 前日比(%)。不要なら空欄 `""`
- `updated`: カード下部に表示される更新日時テキスト。「◯月◯日 15:30 終値」の形式で統一する
- `sourceLabel` / `sourceUrl`: 出典リンクのラベルとURL。TOPIXは必ずJPXの上記ページを設定する

日本10年国債金利は、JPXが直接発表する指標ではないため上記の「東証限定」ルールの対象外です。出典は引き続き日本経済新聞のマーケットページとしています。同様の厳格運用(15:30終値限定)を適用するかどうかは、必要であれば別途ご相談ください。

## 本日の米国市場(自動更新)
「本日の主要指数」ボックスの下に、NYダウ・S&P500・NASDAQ・米国10年債券利回りをまとめた2つ目のカルーセルがあります。データは `market_us.json`。グラフィック・挙動(1枚1指標、3秒ごとスライド)は上のボックスと共通です。

- **GitHub Actions(`.github/workflows/update-market-us.yml`)** が毎日 07:00 JST(米国市場の月〜金の取引終了後)に `scripts/update_market_us.py` を実行し、[Yahoo Finance](https://finance.yahoo.com/) から終値を取得して `market_us.json` を自動コミットします
- **サマータイム(EDT)と標準時間(EST)のずれへの対応**: 米国市場の終値確定時刻は季節で1時間変わる(EDT期間は05:00 JST、EST期間は06:00 JST)ため、07:00 JSTという「どちらの場合でも必ず既に閉まっている」時刻に実行しています。さらにスクリプト自身がYahoo Financeの返す取引時間情報(`currentTradingPeriod`)を見て、実際に取引が終了しているかを二重チェックし、万一取引時間中であればその日の更新をスキップします(祝日で市場が休みの日も安全に動作します)

> **注意**: このワークフローも、JP側と同様にリポジトリの Settings → Actions → General で「Workflow permissions」を **Read and write permissions** にしていないと動作しません(JP側で設定済みであれば、この米国側にも同じ設定が有効です)。Actionsタブの "Update US market data" から手動実行(Run workflow)して動作確認できます。

### `market_us.json` の各フィールド
`market.json` と同じ構造です。`name` は自動更新の対象キーなので変更しないでください(`NYダウ(NY Dow Jones)` / `S&P500` / `NASDAQ` / `米国10年債券利回り`)。

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
