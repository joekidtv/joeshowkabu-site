// Joe Show Kabu — 経済カレンダー
// calendar.json のイベントを月表示のカレンダーに描画します。
// - 各日のイベントはカテゴリごとに色分けされた丸い点で表示(jp=赤 / us=緑 / other=黒)
// - 日付をクリックすると、その日のイベント詳細が下のパネルに表示されます
// - イベントの追加・修正は calendar.json を編集するだけでOK(READMEを参照)

const CAL_COLOR = { red: 'var(--red)', green: 'var(--green)', black: 'var(--black)' };
const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];

let calData = null;
let calYear = 2026;
let calMonth = 0; // 0-11
let selectedDate = null;

function calCategoryColor(cat){
  const c = calData && calData.categories && calData.categories[cat];
  return CAL_COLOR[(c && c.color) || 'black'] || 'var(--black)';
}

function calEventsOn(dateStr){
  return (calData.events || []).filter(ev => ev.date === dateStr);
}

function calDateStr(y, m, d){
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function renderCalendarGrid(){
  const label = document.getElementById('cal-month-label');
  const grid = document.getElementById('cal-grid');
  if(!label || !grid) return;

  label.textContent = `${calYear}年${calMonth + 1}月`;

  const prevBtn = document.getElementById('cal-prev');
  const nextBtn = document.getElementById('cal-next');
  if(prevBtn) prevBtn.disabled = (calMonth === 0);
  if(nextBtn) nextBtn.disabled = (calMonth === 11);

  const first = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startWd = first.getDay();

  const today = new Date();
  const todayStr = calDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  let html = WEEKDAYS_JA.map((w, i) =>
    `<div class="cal-wd${i === 0 ? ' sun' : ''}${i === 6 ? ' sat' : ''}">${w}</div>`
  ).join('');

  for(let i = 0; i < startWd; i++){
    html += '<div class="cal-cell empty"></div>';
  }

  for(let d = 1; d <= daysInMonth; d++){
    const ds = calDateStr(calYear, calMonth, d);
    const events = calEventsOn(ds);
    const dots = events.slice(0, 4).map(ev =>
      `<i style="background:${calCategoryColor(ev.category)};"></i>`
    ).join('');
    const cls = [
      'cal-cell',
      events.length ? 'has-events' : '',
      ds === todayStr ? 'today' : '',
      ds === selectedDate ? 'selected' : ''
    ].filter(Boolean).join(' ');
    html += `
      <button type="button" class="${cls}" data-date="${ds}">
        <span class="cal-day">${d}</span>
        <span class="cal-dots">${dots}</span>
      </button>`;
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      selectedDate = cell.getAttribute('data-date');
      renderCalendarGrid();
      renderDayDetail(selectedDate);
    });
  });
}

function renderDayDetail(dateStr){
  const panel = document.getElementById('cal-detail');
  if(!panel) return;
  const d = new Date(dateStr + 'T00:00:00');
  const heading = `${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS_JA[d.getDay()]})`;
  const events = calEventsOn(dateStr);

  if(!events.length){
    panel.innerHTML = `
      <div class="cal-detail-head">${heading}</div>
      <p class="cal-noevents">この日の重要経済イベントは登録されていません。</p>`;
    return;
  }

  panel.innerHTML = `
    <div class="cal-detail-head">${heading}</div>
    ${events.map(ev => {
      const cat = calData.categories[ev.category] || {};
      return `
      <div class="cal-event" style="border-left-color:${calCategoryColor(ev.category)};">
        <span class="cal-event-cat" style="background:${calCategoryColor(ev.category)};">${esc(cat.label || ev.category)}</span>
        <div class="cal-event-title">${esc(ev.title)}</div>
        ${ev.desc ? `<p class="cal-event-desc">${esc(ev.desc)}</p>` : ''}
      </div>`;
    }).join('')}`;
}

function renderLegendAndSources(){
  const legend = document.getElementById('cal-legend');
  if(legend && calData.categories){
    legend.innerHTML = Object.keys(calData.categories).map(key => {
      const c = calData.categories[key];
      return `<span class="cal-legend-item"><i style="background:${calCategoryColor(key)};"></i>${esc(c.label)}</span>`;
    }).join('');
  }
  const sources = document.getElementById('cal-sources');
  if(sources && Array.isArray(calData.sources)){
    sources.innerHTML = '出典: ' + calData.sources.map(s =>
      `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`
    ).join(' ／ ');
  }
}

async function initEconomicCalendar(){
  const grid = document.getElementById('cal-grid');
  if(!grid) return;
  calData = await fetchJSON('calendar.json');
  if(!calData){
    grid.innerHTML = '<div class="state-msg">カレンダーを読み込めませんでした。</div>';
    return;
  }
  calYear = calData.year || 2026;

  const today = new Date();
  calMonth = (today.getFullYear() === calYear) ? today.getMonth() : 0;

  const prevBtn = document.getElementById('cal-prev');
  const nextBtn = document.getElementById('cal-next');
  if(prevBtn) prevBtn.addEventListener('click', () => { if(calMonth > 0){ calMonth--; selectedDate = null; renderCalendarGrid(); } });
  if(nextBtn) nextBtn.addEventListener('click', () => { if(calMonth < 11){ calMonth++; selectedDate = null; renderCalendarGrid(); } });

  renderCalendarGrid();
  renderLegendAndSources();

  // 今日が表示年内なら、初期表示で今日の詳細を出す
  if(today.getFullYear() === calYear){
    selectedDate = calDateStr(calYear, today.getMonth(), today.getDate());
    renderCalendarGrid();
    renderDayDetail(selectedDate);
  }
}
