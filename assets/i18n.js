// Joe Show Kabu — 簡易i18n(JP/EN切り替え)の土台
// data-i18n="キー" を付けた要素の innerHTML を、選択言語の対訳に差し替えるだけの仕組みです。
// 新しい文言を増やす場合は、下記 translations の ja/en 両方に同じキーで追記し、
// HTML側にも同じ data-i18n="キー" を付ければ反映されます。
// 注意: lectures.json/news.json/market.json を元に JS が動的生成するカード・表・フィルターは
// この土台の対象外です(必要になった時点で別途対応してください)。

const translations = {
  ja: {
    'nav.home': 'ホーム',
    'nav.lectures': 'レクチャー',
    'nav.news': 'ニュース',
    'nav.calendar': '経済カレンダー',
    'nav.about': 'Joe Show Kabuについて',
    'nav.contact': 'お問い合わせ',
    'nav.insta': 'Instagramで見る',

    'hero.title': 'その一歩が、<span class="hl-green">将来の複利</span>になる。<br><span class="hl-red">〜高校生のための金融知識〜</span>',
    'hero.lead': 'Joe Show Kabu | 高校生投資家 Joe<br>2021年から投資と経済を学ぶ現役高校生<br>中高生の金融リテラシー向上を目指す情報発信をしています',
    'hero.cta.lectures': 'レクチャーを見る',
    'hero.cta.insta': 'Instagramをフォロー',

    'home.disclaimer.label': '免責事項',
    'home.disclaimer.text': '当サイトは一般的な金融知識の普及を目的としており、特定の銘柄推奨や売買指示は一切行いません。投資は自己責任です。',

    'news.sectionTitle': 'Joe Show NEWS 最新マーケット情報',
    'market.title': '本日の主要指数',

    'lectures.sectionTitle': '最新レクチャー',
    'lectures.seeAll': '全レクチャーを見る',

    'contact.sectionTitle': 'お問い合わせ',
    'contact.email.label': 'メールでのお問い合わせ',
    'contact.email.text': 'joe.kid.air@gmail.com にご連絡ください。',
    'contact.email.btn': 'メールを送る',
    'contact.form.label': 'お問い合わせフォーム',
    'contact.form.text': 'フォームからご用件をお伝えください。',
    'contact.form.btn': 'フォームを開く',

    'footer.disclaimer': '当アカウント(Joe Show Kabu)で発信する情報は、一般的な経済の仕組みおよび個人の学習記録を目的としたものであり、特定の金融商品の推奨、売買の指示、または将来の市場動向を示唆・保証するものではありません。資産運用には元本割れのリスクがあります。最終的な投資判断は必ずご自身で自己責任で行ってください。',
    'footer.nav.lectures': 'レクチャー',
    'footer.nav.disclaimer': '免責事項',
    'footer.nav.contact': 'お問い合わせ',

    'about.pageLead': 'Joe Show Kabu | 高校生投資家 Joe<br>2021年から投資と経済を学ぶ現役高校生<br>中高生の金融リテラシー向上を目指す情報発信をしています',
    'about.h2.story': 'Story',
    'about.p.story1': 'ほんの「お小遣い稼ぎ」として中学1年生の時に初めた株式投資。最初は右も左も分からず、とりあえず有名企業の株を買ってみた。そこからどんどん投資の世界に興味を持つようになり、相場の酸いも甘いも経験。そして一つとても重要なことを学んだ。それは、「若いうちからお金についてを学ぶべきだ」ということ。',
    'about.p.story2': '日本の金融教育は他の先進国の水準に達していない。「物価高」、「円安」、「新NISA」。これらの金融や経済に関わるワードが日々飛び交ってきた今だからこそ、微量ながら自分の経験と知識を基にJoe Show Kabuを通じて同世代の目線から中高生の金融リテラシーを高めたいと思いました。',
    'about.h2.concept': 'コンセプト',
    'about.p.concept': '見た目は<span class="highlight">ポップで親しみやすく</span>、中身は<span class="highlight">一切妥協しない</span>。これがJoe Show Kabuの一貫した方針です。株式・金利・NISA・複利・インデックス投資といったテーマを、専門用語に逃げず、けれど正確さを落とさずに解説していきます。',
    'about.h2.content': '2つのコンテンツ',
    'about.p.content': '<strong>Joe Show NEWS</strong>は、日本と米国のマーケットの動きを毎日ストーリーズでお届けする速報型のコンテンツです。<strong>レクチャー</strong>は、お金の知識をゼロから積み上げられるよう体系立てて設計した保存版の教材です。日々のニュースで「今」を知り、レクチャーで「土台」をつくる。この2つを行き来することで、断片的な情報が知識として定着していきます。',
    'about.h2.values': '大切にしていること',
    'about.p.values': '投資にはメリットとリスクの両面があります。Joe Show Kabuでは、良い面だけを強調することはしません。マスコットの<span class="highlight">黄金クロソ</span>がチャンスを、<span class="highlight">デッドクロス</span>が注意点を担当し、どちらの視点もフェアに伝えることを心がけています。',
    'about.h2.creator': '運営者',
    'about.p.creator': '高校生投資家Joeが個人で企画・制作・運営しています。高校生自身の視点から、「同世代がいま知っておきたいお金のこと」を発信しています。',
    'about.h2.notice': 'ご注意',
    'about.p.notice': '当アカウントで発信する情報は、一般的な経済の仕組みおよび個人の学習記録を目的としたものです。特定の金融商品の推奨や、将来の成果を保証するものではありません。詳しくは<a href="disclaimer.html" style="color:var(--red);font-weight:900;text-decoration:underline;">免責事項</a>をご確認ください。',

    'lecturesPage.pageTitle': 'レクチャーアーカイブ',
    'lecturesPage.pageLead': '株式・投資・お金の仕組みを、体系立てて学べる全レクチャー一覧です。新しい回はInstagram投稿と同時にここへ追加されます。',

    'calendarPage.pageTitle': '経済カレンダー',
    'calendarPage.pageLead': '日銀金融政策決定会合・FOMC・米CPI・米雇用統計など、マーケットを動かす2026年の重要経済イベントをまとめました。日付をクリックすると、その日のイベントの詳細が表示されます。',
    'calendarPage.hint': 'カレンダーの日付をクリックすると、その日の経済イベントが表示されます。',

    'disclaimerPage.pageTitle': '免責事項',
    'disclaimerPage.pageLead': 'Joe Show Kabu(以下「当アカウント」)をご利用いただく前に、以下の内容をご確認ください。',
    'disclaimerPage.h2.purpose': '情報の目的',
    'disclaimerPage.p.purpose': '当アカウントで発信する情報は、一般的な経済の仕組みおよび個人の学習記録を目的としたものであり、特定の金融商品の推奨、売買の指示、または将来の市場動向を示唆・保証するものではありません。',
    'disclaimerPage.h2.decision': '投資判断について',
    'disclaimerPage.p.decision': '資産運用には元本割れのリスクがあります。当アカウントの情報を参考にされる場合でも、最終的な投資判断は必ずご自身の責任において行ってください。当アカウントは、掲載情報を利用したことによって生じたいかなる損害についても責任を負いません。',
    'disclaimerPage.h2.accuracy': '情報の正確性',
    'disclaimerPage.p.accuracy': '掲載する数値やデータは、信頼できると考えられる情報源に基づいて作成していますが、その正確性・完全性を保証するものではありません。情報は予告なく変更・削除される場合があります。',
    'disclaimerPage.h2.simulation': 'シミュレーションについて',
    'disclaimerPage.p.simulation': '当アカウントで示す運用シミュレーションは、過去のデータや一定の前提に基づく試算であり、将来の成果を保証するものではありません。',
    'disclaimerPage.h2.contact': 'お問い合わせ',
    'disclaimerPage.p.contact': '本免責事項に関するご質問は、<a href="index.html#contact" style="color:var(--red);font-weight:900;text-decoration:underline;">お問い合わせ</a>よりご連絡ください。'
  },
  en: {
    'nav.home': 'Home',
    'nav.lectures': 'Lectures',
    'nav.news': 'News',
    'nav.calendar': 'Economic Calendar',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.insta': 'Follow on Instagram',

    'hero.title': 'That first step becomes <span class="hl-green">future compound interest</span>.<br><span class="hl-red">— Financial Literacy for Teens —</span>',
    'hero.lead': 'Joe Show Kabu | High-School Investor Joe<br>Current high schooler studying investing and economics since 2021<br>Sharing information aimed at improving financial literacy for junior high and high schoolers',
    'hero.cta.lectures': 'View Lectures',
    'hero.cta.insta': 'Follow on Instagram',

    'home.disclaimer.label': 'Disclaimer',
    'home.disclaimer.text': 'This site aims to spread general financial literacy. It does not recommend specific stocks or give trading instructions. Investing is done at your own risk.',

    'news.sectionTitle': 'Joe Show NEWS — Latest Market Updates',
    'market.title': "Today's Key Market Indices",

    'lectures.sectionTitle': 'Latest Lectures',
    'lectures.seeAll': 'View All Lectures',

    'contact.sectionTitle': 'Contact',
    'contact.email.label': 'Contact by Email',
    'contact.email.text': 'Please reach out to joe.kid.air@gmail.com.',
    'contact.email.btn': 'Send an Email',
    'contact.form.label': 'Contact Form',
    'contact.form.text': 'Please share your inquiry through the form.',
    'contact.form.btn': 'Open the Form',

    'footer.disclaimer': 'Information shared by this account (Joe Show Kabu) is intended for general economic education and personal learning records. It does not recommend specific financial products, instruct trades, or guarantee future market movements. Investing carries the risk of principal loss. Always make final investment decisions at your own responsibility.',
    'footer.nav.lectures': 'Lectures',
    'footer.nav.disclaimer': 'Disclaimer',
    'footer.nav.contact': 'Contact',

    'about.pageLead': 'Joe Show Kabu | High-School Investor Joe<br>Current high schooler studying investing and economics since 2021<br>Sharing information aimed at improving financial literacy for junior high and high schoolers',
    'about.h2.story': 'Story',
    'about.p.story1': 'I started investing in stocks as a junior high 1st-grader, just to "make some extra pocket money." At first I had no idea what I was doing, so I simply bought shares of well-known companies. From there I grew more and more interested in the world of investing, experiencing both the highs and lows of the market. And I learned one very important lesson: you should start learning about money while you\'re young.',
    'about.p.story2': 'Japan\'s financial education hasn\'t caught up to the standards of other developed countries. "Rising prices," "a weak yen," "the new NISA" — words about finance and the economy that come up constantly these days. That\'s exactly why I wanted to use my own experience and knowledge, however small, to raise financial literacy among junior high and high schoolers from a fellow student\'s perspective through Joe Show Kabu.',
    'about.h2.concept': 'Concept',
    'about.p.concept': 'Look <span class="highlight">pop and approachable</span>, but never <span class="highlight">compromise on substance</span>. That is Joe Show Kabu\'s consistent policy. Topics like stocks, interest rates, NISA, compound interest, and index investing are explained without hiding behind jargon, while staying accurate.',
    'about.h2.content': 'Two Types of Content',
    'about.p.content': '<strong>Joe Show NEWS</strong> delivers daily Stories covering market moves in Japan and the US. <strong>Lectures</strong> are the archived teaching material, systematically designed to build money knowledge from zero. Daily news tells you "now," lectures build the "foundation" — moving between the two turns fragmented information into lasting knowledge.',
    'about.h2.values': 'What We Value',
    'about.p.values': 'Investing has both upsides and risks. Joe Show Kabu never highlights only the good side. The mascots — <span class="highlight">Golden Croso</span> for opportunity and <span class="highlight">Dead Cross</span> for caution — work to present both perspectives fairly.',
    'about.h2.creator': 'About the Creator',
    'about.p.creator': 'High-school investor Joe plans, produces, and runs this account individually — sharing "what our generation should know about money right now" from a fellow high schooler\'s perspective.',
    'about.h2.notice': 'Note',
    'about.p.notice': 'Information shared by this account is intended for general economic education and personal learning records. It does not recommend specific financial products or guarantee future results. See the <a href="disclaimer.html" style="color:var(--red);font-weight:900;text-decoration:underline;">Disclaimer</a> page for details.',

    'lecturesPage.pageTitle': 'Lecture Archive',
    'lecturesPage.pageLead': 'A full, systematically organized list of lectures for learning stocks, investing, and how money works. New episodes are added here as soon as they go live on Instagram.',

    'calendarPage.pageTitle': 'Economic Calendar',
    'calendarPage.pageLead': 'Key 2026 market-moving events — BOJ policy meetings, FOMC, US CPI, and the US jobs report — all in one place. Click a date to see the details of that day\'s events.',
    'calendarPage.hint': 'Click a date on the calendar to see that day\'s economic events.',

    'disclaimerPage.pageTitle': 'Disclaimer',
    'disclaimerPage.pageLead': 'Please review the following before using Joe Show Kabu (referred to below as "this account").',
    'disclaimerPage.h2.purpose': 'Purpose of Information',
    'disclaimerPage.p.purpose': 'Information shared by this account is intended for general economic education and personal learning records. It does not recommend specific financial products, instruct trades, or suggest/guarantee future market movements.',
    'disclaimerPage.h2.decision': 'On Investment Decisions',
    'disclaimerPage.p.decision': 'Investing carries the risk of principal loss. Even if you reference this account\'s information, always make final investment decisions at your own responsibility. This account is not liable for any damages arising from the use of the information provided.',
    'disclaimerPage.h2.accuracy': 'Accuracy of Information',
    'disclaimerPage.p.accuracy': 'Figures and data presented are based on sources believed to be reliable, but their accuracy and completeness are not guaranteed. Information may be changed or removed without notice.',
    'disclaimerPage.h2.simulation': 'On Simulations',
    'disclaimerPage.p.simulation': 'Investment simulations shown by this account are estimates based on historical data and certain assumptions, and do not guarantee future results.',
    'disclaimerPage.h2.contact': 'Contact',
    'disclaimerPage.p.contact': 'For questions about this disclaimer, please reach us via <a href="index.html#contact" style="color:var(--red);font-weight:900;text-decoration:underline;">Contact</a>.'
  }
};

function applyLanguage(lang){
  document.documentElement.lang = lang;
  const dict = translations[lang] || translations.ja;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(dict[key] !== undefined){ el.innerHTML = dict[key]; }
  });
  document.querySelectorAll('.lang-toggle button').forEach(btn=>{
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  try{ localStorage.setItem('jsk_lang', lang); }catch(e){}
}

function initLangToggle(){
  let saved = 'ja';
  try{ saved = localStorage.getItem('jsk_lang') || 'ja'; }catch(e){}
  applyLanguage(saved);
  document.querySelectorAll('.lang-toggle button').forEach(btn=>{
    btn.addEventListener('click', ()=> applyLanguage(btn.getAttribute('data-lang')));
  });
}

document.addEventListener('DOMContentLoaded', initLangToggle);
