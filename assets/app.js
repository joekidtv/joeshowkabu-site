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

// トップページ：本日の主要指数(日経平均・TOPIX・米ドル/円・国債金利など)
function marketRow(item){
  const change = String(item.change || '').trim();
  const dir = change.startsWith('-') ? 'down' : (change.startsWith('+') ? 'up' : '');
  const arrow = dir === 'up' ? '▲' : (dir === 'down' ? '▼' : '');
  const pct = item.changePercent ? ` (${esc(item.changePercent)})` : '';
  return `
    <tr>
      <td class="m-name">${esc(item.name)}</td>
      <td class="m-value">${esc(item.value)}</td>
      <td class="m-change ${dir}">${arrow} ${esc(change)}${pct}</td>
    </tr>`;
}

async function renderMarketIndices(tbodyId, updatedId){
  const tbody = document.getElementById(tbodyId);
  if(!tbody) return;
  const data = await fetchJSON('market.json');
  if(!data || !data.length){ tbody.innerHTML = '<tr><td colspan="3" class="state-msg">市場データを読み込めませんでした。</td></tr>'; return; }
  tbody.innerHTML = data.map(marketRow).join('');
  const updatedEl = document.getElementById(updatedId);
  if(updatedEl && data[0] && data[0].updated){ updatedEl.textContent = `更新: ${esc(data[0].updated)}`; }
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
