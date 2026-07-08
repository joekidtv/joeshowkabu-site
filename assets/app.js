// Joe Show Kabu — data-driven rendering
// 新しい投稿は lectures.json / news.json に1件追記するだけで反映されます。
// 将来 Instagram Graph API と連携する場合は、この fetchJSON をAPI呼び出しに差し替えてください。

async function fetchJSON(path){
  try{
    const res = await fetch(path, {cache:'no-store'});
    if(!res.ok) throw new Error('load failed: '+path);
    return await res.json();
  }catch(e){
    console.error(e);
    return null;
  }
}

function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// カテゴリに応じてサムネ上部の帯色を決める(緑=積立/長期系, 赤=注意/個別系)
function thumbSide(cats){
  const green = ['基礎','複利','NISA','インデックス投資'];
  const first = (cats && cats[0]) || '';
  return green.indexOf(first) !== -1 ? 'side-green' : 'side-red';
}

// ロゴモチーフのミニローソク足
function miniCandles(){
  const cols = [[8,'var(--red)'],[14,'var(--green)'],[11,'var(--green)'],[18,'var(--green)'],[22,'var(--red)']];
  return '<span class="mini-candles" aria-hidden="true">' +
    cols.map(c=>`<i style="height:${c[0]}px;background:${c[1]};"></i>`).join('') +
    '</span>';
}

function thumbHTML(item, cats, upcoming){
  const soonBadge = upcoming ? '<span class="soon">近日公開</span>' : '';
  const numBadge = `<span class="num">${esc(item.number)}</span>`;
  // 実画像があればそれを使う
  if(item.thumbnail && String(item.thumbnail).trim() !== ''){
    return `<div class="thumb ${thumbSide(cats)}">${numBadge}${soonBadge}<img src="${esc(item.thumbnail)}" alt="${esc(item.title)}"></div>`;
  }
  // なければ番号+タイトルのデザイン枠を自動生成
  const cat = (cats && cats[0]) ? `<span class="t-cat">${esc(cats[0])}</span>` : '';
  return `<div class="thumb ${thumbSide(cats)} thumb-gen">${numBadge}${soonBadge}
      <span class="t-num"><span class="hash">#</span>${esc(item.number)}</span>
      <span class="t-title">${esc(item.title)}</span>
      ${cat}${miniCandles()}
    </div>`;
}

function lectureCard(item){
  const cats = Array.isArray(item.category) ? item.category : [item.category];
  const catAttr = esc(cats.join(' '));
  const catLabel = esc(cats.join(' / '));
  const upcoming = item.status === 'upcoming';
  const link = upcoming
    ? '<span class="link disabled">公開をお待ちください <span>―</span></span>'
    : `<a href="${esc(item.instagram_url)}" target="_blank" rel="noopener" class="link">Instagramで見る <span>→</span></a>`;
  return `
    <div class="lecture-card${upcoming ? ' upcoming' : ''}" data-cat="${catAttr}">
      ${thumbHTML(item, cats, upcoming)}
      <div class="body">
        <span class="cat">${catLabel}</span>
        <h3>${esc(item.title)}</h3>
        <p class="desc">${esc(item.summary)}</p>
        ${link}
      </div>
    </div>`;
}

function formatDate(s){
  const d = new Date(s + 'T00:00:00');
  if(isNaN(d)) return esc(s);
  const wd = ['日','月','火','水','木','金','土'][d.getDay()];
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} (${wd})`;
}

function newsCard(item){
  const inner = `
      <div class="tag">${esc(item.tag)}</div>
      <div class="date">${formatDate(item.date)}</div>
      <p>${esc(item.summary)}</p>`;
  // instagram_url があればリンク化、なければ非リンクのカード
  if(item.instagram_url && String(item.instagram_url).trim() !== ''){
    return `<a href="${esc(item.instagram_url)}" target="_blank" rel="noopener" class="news-card">${inner}</a>`;
  }
  return `<div class="news-card">${inner}</div>`;
}

// トップページ：最新3件のレクチャー
async function renderHomeLectures(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const data = await fetchJSON('lectures.json');
  if(!data){ el.innerHTML = '<div class="state-msg">レクチャーを読み込めませんでした。</div>'; return; }
  const latest = data.slice().reverse().filter(it => it.status !== 'upcoming').slice(0,3);
  el.innerHTML = latest.map(lectureCard).join('');
}

// トップページ：本日の主要指数(TOPIX・国債金利。毎日15:30終値で手動更新)
// 1枚に1指標を表示し、3秒ごとに自動でスライドするカルーセル
function marketSlide(item){
  const change = String(item.change || '').trim();
  const dir = change.startsWith('-') ? 'down' : (change.startsWith('+') ? 'up' : '');
  const arrow = dir === 'up' ? '▲ ' : (dir === 'down' ? '▼ ' : '');
  const pct = item.changePercent ? ` (${esc(item.changePercent)})` : '';
  const changeLine = change ? `<div class="m-change ${dir}">${arrow}${esc(change)}${pct}</div>` : '';
  const source = item.sourceUrl
    ? `出典: <a href="${esc(item.sourceUrl)}" target="_blank" rel="noopener">${esc(item.sourceLabel || item.sourceUrl)}</a>`
    : '';
  const meta = [esc(item.updated || ''), source].filter(Boolean).join(' ／ ');
  return `
    <div class="market-slide">
      <div class="m-name">${esc(item.name)}</div>
      <div class="m-value">${esc(item.value)}</div>
      ${changeLine}
      ${meta ? `<div class="m-meta">${meta}</div>` : ''}
    </div>`;
}

function startMarketCarousel(trackId, dotsId, intervalMs){
  const track = document.getElementById(trackId);
  const dotsWrap = document.getElementById(dotsId);
  if(!track) return;
  const realSlides = Array.from(track.querySelectorAll('.market-slide'));
  const count = realSlides.length;
  if(count <= 1) return;

  // 4枚目→1枚目で逆戻りせず同じ方向に流れ続けて見えるよう、先頭スライドの複製を末尾に足しておく。
  // 複製に到達したら、トランジション終了直後だけアニメ無しで本物の先頭(index 0)へ瞬時に戻す。
  const clone = realSlides[0].cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.appendChild(clone);

  let index = 0;
  if(dotsWrap){
    dotsWrap.innerHTML = Array.from({length:count}, (_,i)=>`<button type="button" data-index="${i}" class="${i===0?'active':''}" aria-label="${i+1}"></button>`).join('');
  }

  function updateDots(){
    if(!dotsWrap) return;
    const realIndex = index % count;
    dotsWrap.querySelectorAll('button').forEach((btn,i)=> btn.classList.toggle('active', i===realIndex));
  }

  function goTo(i, animate){
    if(animate === false){ track.style.transition = 'none'; }
    index = i;
    track.style.transform = `translateX(-${index * 100}%)`;
    updateDots();
    if(animate === false){
      void track.offsetHeight; // reflowを強制してtransition無効化を確定させる
      track.style.transition = '';
    }
  }

  // transitionend はブラウザ・端末によって発火しないことがあるため、
  // CSSのトランジション時間(.5s)に合わせた setTimeout で確実に snap-back させる。
  function next(){
    goTo(index + 1);
    if(index === count){
      setTimeout(()=>{
        if(index === count){ goTo(0, false); }
      }, 520);
    }
  }

  let timer = setInterval(next, intervalMs);
  function resetTimer(){
    clearInterval(timer);
    timer = setInterval(next, intervalMs);
  }

  if(dotsWrap){
    dotsWrap.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        goTo(parseInt(btn.getAttribute('data-index'),10));
        resetTimer();
      });
    });
  }

  // カード自体をクリック(タップ)しても次のスライドへ進められるようにする(出典リンクのクリックは除く)
  track.style.cursor = 'pointer';
  track.addEventListener('click', (e)=>{
    if(e.target.closest('a')) return;
    next();
    resetTimer();
  });
}

async function renderMarketIndices(trackId, dotsId, jsonPath){
  const track = document.getElementById(trackId);
  if(!track) return;
  const data = await fetchJSON(jsonPath || 'market.json');
  if(!data || !data.length){ track.innerHTML = '<div class="market-slide"><div class="state-msg">市場データを読み込めませんでした。</div></div>'; return; }
  track.innerHTML = data.map(marketSlide).join('');
  startMarketCarousel(trackId, dotsId, 3000);
}

// トップページ：NEWS
async function renderNews(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const data = await fetchJSON('news.json');
  if(!data){ el.innerHTML = '<div class="state-msg">NEWSを読み込めませんでした。</div>'; return; }
  el.innerHTML = data.map(newsCard).join('');
}

// アーカイブページ：全レクチャー＋フィルター
async function renderArchive(gridId, filterId){
  const grid = document.getElementById(gridId);
  if(!grid) return;
  const data = await fetchJSON('lectures.json');
  if(!data){ grid.innerHTML = '<div class="state-msg">レクチャーを読み込めませんでした。</div>'; return; }
  const ordered = data.slice().reverse();
  grid.innerHTML = ordered.map(lectureCard).join('');

  const filterWrap = document.getElementById(filterId);
  if(!filterWrap) return;
  const cats = [];
  data.forEach(it => (Array.isArray(it.category)?it.category:[it.category]).forEach(c=>{ if(cats.indexOf(c)===-1) cats.push(c); }));
  filterWrap.innerHTML =
    '<button class="filter-pill active" data-filter="all">すべて</button>' +
    cats.map(c=>`<button class="filter-pill" data-filter="${esc(c)}">${esc(c)}</button>`).join('');

  const pills = filterWrap.querySelectorAll('.filter-pill');
  pills.forEach(pill=>{
    pill.addEventListener('click', ()=>{
      pills.forEach(p=>p.classList.remove('active'));
      pill.classList.add('active');
      const f = pill.getAttribute('data-filter');
      grid.querySelectorAll('.lecture-card').forEach(card=>{
        const cat = card.getAttribute('data-cat') || '';
        card.style.display = (f==='all' || cat.split(' ').indexOf(f)!==-1) ? '' : 'none';
      });
    });
  });
}
