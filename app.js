
const icons = {
  home:'<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Zm6 11v-7h6v7"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  square:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',
  file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8m-8 4h6"/>',
  history:'<path d="M3 12a9 9 0 1 1 3 7m-3-7V6m0 6h6m3-5v5l3 2"/>',
  'chevron-right':'<path d="m9 18 6-6-6-6"/>',
  'chevron-left':'<path d="m15 18-6-6 6-6"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>'
};
function icon(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
}
const $ = (selector) => document.querySelector(selector);
const demoDay = '2026-11-20';
const types = {meeting:'회의',deadline:'마감',task:'작업'};
const statuses = {todo:'할 일',doing:'진행 중',done:'완료'};
const titles = {calendar:'캘린더',gantt:'간트 차트',tasks:'할 일 보드',notes:'회의록',profile:'회원 정보',myTasks:'내 할 일',activity:'내 활동 로그'};
const self = '김두열';
const members = ['팀 전원',self,'팀원 A','팀원 B','팀원 C'];
const demoProfile = {name:self,email:''};
const key = 'ssa-teamflow-v1';
const demoSchedules = [
  ['02','19:00','팀 프로젝트 킥오프','meeting','팀 전원'],
  ['06','18:00','프로젝트 주제 후보 정리','task','팀원 A'],
  ['09','20:00','주제 선정 회의','meeting','팀 전원'],
  ['12','23:59','프로젝트 제안서 제출','deadline','김두열'],
  ['16','18:00','요구사항 초안 작성','task','팀원 B'],
  ['18','19:30','요구사항 검토','meeting','팀 전원'],
  ['20','19:00','2주차 팀 회의','meeting','팀 전원'],
  ['23','23:59','유스케이스 명세서 제출','deadline','김두열'],
  ['25','18:00','프로토타입 화면 검토','task','팀원 A'],
  ['27','20:00','중간 점검 회의','meeting','팀 전원'],
  ['30','23:59','분석 모델 초안 마감','deadline','팀원 B']
];
const seed = {
  schedules:demoSchedules.map(([day,time,title,type,owner], index)=>({id:'e'+index,date:'2026-11-'+day,time,title,type,owner,body:'',endDate:({'16':'2026-11-18','25':'2026-11-26'})[day]||''})),
  tasks:[
    {id:'t1',title:'유스케이스 시나리오 작성',date:'2026-11-23',owner:'김두열',status:'doing',body:'일정 등록과 수정의 기본·예외 흐름을 작성한다.'},
    {id:'t2',title:'기능 요구사항 정리',date:'2026-11-18',owner:'팀원 B',status:'done',body:''},
    {id:'t3',title:'프로토타입 화면 검토',date:'2026-11-25',owner:'팀원 A',status:'todo',body:''},
    {id:'t4',title:'클래스 다이어그램 초안',date:'2026-11-30',owner:'팀원 C',status:'todo',body:''}
  ],
  notes:[{id:'n1',title:'1주차 팀 회의',date:'2026-11-12',body:'팀 프로젝트 일정 관리 플랫폼을 주제로 정했다.\n다음 회의까지 일정 등록과 조회의 유스케이스 초안을 작성한다.'}],
  activity:[],
  profile:demoProfile
};
let state;
try { state = JSON.parse(localStorage.getItem(key)) || structuredClone(seed); }
catch { state = structuredClone(seed); }
state.profile ??= {...demoProfile};
let view = 'dashboard';
let month = new Date(2026,10,1);
let toastTimer;
const main = $('#main');
const modal = $('#dialog');
const modalContent = $('#dialog-content');
const esc = (value='') => String(value).replace(/[&<>"']/g, character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const pad = (value) => String(value).padStart(2,'0');
const dateKey = (date) => [date.getFullYear(),pad(date.getMonth()+1),pad(date.getDate())].join('-');
const pretty = (date) => date && Number(date.slice(5,7))+'월 '+Number(date.slice(8,10))+'일';
const endOf = (event) => event.endDate || event.date;
const sortDate = (a,b) => ((a.date||'9999')+(a.time||'')).localeCompare((b.date||'9999')+(b.time||''));
const upcoming = () => state.schedules.filter(event=>endOf(event)>=demoDay).sort(sortDate);
const ownerName = (owner) => owner===self ? state.profile.name : owner;
const initial = () => Array.from(state.profile.name).at(-1) || '나';
const shiftDate = (key,days) => {
  const [year,month,day] = key.split('-').map(Number);
  return new Date(year,month-1,day+days);
};
const schedulePeriod = (event) => pretty(event.date)+(endOf(event)!==event.date?' ~ '+pretty(endOf(event)):'');
function button(label,action,kind='secondary',sym='') {
  return '<button type="button" class="'+kind+'" data-action="'+action+'">'+(sym?icon(sym):'')+label+'</button>';
}

function heading(title,description,action='') {
  return '<div class="page-head"><div><h1>'+title+'</h1><p>'+description+'</p></div>'+action+'</div>';
}
function tabs(label,choices) {
  return '<nav class="tabs" aria-label="'+label+'">'+choices.map(id=>'<button type="button" data-action="view:'+id+'" '+(view===id?'aria-current="page"':'')+'>'+titles[id]+'</button>').join('')+'</nav>';
}
function stat(label,count,sym,klass='') {
  return '<article class="stat"><span class="tile-icon '+klass+'">'+icon(sym)+'</span><div><span class="label">'+label+'</span><strong>'+count+'<small>건</small></strong></div></article>';
}
function upcomingRows(items) {
  if (!items.length) return '<p class="empty">예정된 일정이 없어요.</p>';
  return items.map(event=>'<button class="upcoming-row" data-action="edit:schedules:'+event.id+'"><span class="date-box '+event.type+'">'+Number(event.date.slice(5,7))+'월<b>'+Number(event.date.slice(8,10))+'</b></span><span><span class="row-title">'+esc(event.title)+'</span><small class="row-meta">'+types[event.type]+' · '+esc(event.endDate && event.endDate!==event.date ? schedulePeriod(event) : event.time || '종일')+' · '+esc(ownerName(event.owner))+'</small></span></button>').join('');
}
function dashboard() {
  const week = upcoming().filter(event=>event.date<=dateKey(shiftDate(demoDay,6)));
  const mine = state.tasks.filter(task=>task.owner===self && task.status!=='done').sort(sortDate);
  const done = state.tasks.filter(task=>task.status==='done').length;
  const percent = state.tasks.length ? Math.round(done/state.tasks.length*100) : 0;
  return heading('대시보드','11월 20일 기준 · 전지적 액터 시점의 팀 프로젝트',button('새 일정','new:schedules','primary','plus'))+
    '<section class="stats" aria-label="프로젝트 요약">'+stat('7일 내 일정',week.length,'calendar')+stat('7일 내 마감',week.filter(event=>event.type==='deadline').length,'clock','deadline')+stat('남은 내 할 일',mine.length,'square','task')+'</section>'+
    '<div class="dashboard"><section class="panel upcoming"><div class="panel-head"><h2>7일 내 예정된 일정</h2>'+button('일정 관리','view:calendar','text-btn')+'</div><div class="row-list">'+upcomingRows(week)+'</div></section>'+
    '<aside class="side-stack"><section class="panel"><div class="panel-head bordered"><h2>내 할 일</h2>'+button('모두 보기','view:myTasks','text-btn')+'</div><div class="row-list">'+personalTasks(mine.slice(0,3))+'</div></section>'+
    '<section class="panel progress"><div class="split"><h2>팀 할 일 진행률</h2>'+button('보드 보기','view:tasks','text-btn')+'</div><div class="progress-bar" role="progressbar" aria-label="팀 할 일 진행률" aria-valuenow="'+percent+'"><span style="width:'+percent+'%"></span></div><p class="row-meta"><span>'+state.tasks.length+'건 중 '+done+'건 완료</span><strong>'+percent+'%</strong></p></section></aside></div>';
}
function calendar() {
  const year = month.getFullYear();
  const number = month.getMonth();
  const start = month.getDay();
  const last = new Date(year,number+1,0).getDate();
  const total = Math.ceil((start+last)/7)*7;
  const days = Array.from({length:total},(_,index)=>{
    const date = new Date(year,number,1-start+index);
    const key = dateKey(date);
    const classes = ['day',date.getMonth()!==number?'outside':'',key===demoDay?'today':''].join(' ');
    const items = state.schedules.filter(event=>event.date<=key&&endOf(event)>=key).sort(sortDate);
    return '<div class="'+classes+'"><button class="day-number" data-action="day:'+key+'" aria-label="'+pretty(key)+' 일정 추가" '+(key===demoDay?'aria-current="date"':'')+'>'+date.getDate()+'</button>'+items.map(event=>'<button class="chip '+event.type+'" title="'+esc(event.title+' · '+schedulePeriod(event))+'" data-action="edit:schedules:'+event.id+'">'+esc(event.title)+'</button>').join('')+'</div>';
  }).join('');
  return '<div class="weekdays">'+['일','월','화','수','목','금','토'].map(day=>'<span>'+day+'</span>').join('')+'</div><div class="month-grid">'+days+'</div>';
}
function gantt() {
  const year = month.getFullYear();
  const number = month.getMonth();
  const last = new Date(year,number+1,0).getDate();
  const monthPrefix = year+'-'+pad(number+1)+'-';
  const firstKey = monthPrefix+'01';
  const lastKey = monthPrefix+pad(last);
  const items = state.schedules.filter(item=>item.date<=lastKey && endOf(item)>=firstKey).sort(sortDate);
  const tableTitle = '<div class="gantt-row header"><span class="gantt-label">일정 / 기간</span><div class="gantt-track">'+Array.from({length:last},(_,index)=>{
    const day = index+1;
    return '<span'+(monthPrefix+pad(day)===demoDay?' aria-current="date"':'')+'>'+day+'</span>';
  }).join('')+'</div></div>';
  const rows = items.map(item=>{
    const start = item.date<firstKey ? 1 : Number(item.date.slice(8));
    const end = endOf(item)>lastKey ? last : Number(endOf(item).slice(8));
    const name = esc(item.title+' · '+schedulePeriod(item));
    return '<div class="gantt-row"><div class="gantt-label">'+button(esc(item.title),'edit:schedules:'+item.id,'text-btn')+'<small class="row-meta">'+esc(schedulePeriod(item))+'</small></div>'+
      '<div class="gantt-track"><button class="gantt-bar '+item.type+'" type="button" data-action="edit:schedules:'+item.id+'" aria-label="'+name+'" title="'+name+'" style="grid-column:'+start+' / '+(end+1)+'">'+(end>start?esc(item.title):'')+'</button></div></div>';
  }).join('');
  return '<div class="gantt-scroll" tabindex="0" aria-label="간트 차트 날짜별 일정"><div class="gantt-table" style="--days:'+last+'">'+tableTitle+rows+'</div></div>'+(rows?'':'<p class="gantt-empty empty">이 달에 등록된 일정이 없어요.</p>');
}
function schedule() {
  const date = dateKey(month);
  const title = month.getFullYear()+'년 '+(month.getMonth()+1)+'월';
  const defaultDate = date.slice(0,7)===demoDay.slice(0,7) ? demoDay : date;
  return heading('일정 관리','팀 일정과 작업 기간을 확인하고 관리하세요.',button('새 일정','day:'+defaultDate,'primary','plus'))+
    tabs('일정 보기',['calendar','gantt'])+
    '<section class="panel"><div class="panel-head"><h2>'+title+'</h2><div class="controls"><button class="icon-btn" data-action="month:-1" aria-label="이전 달">'+icon('chevron-left')+'</button>'+button('오늘','today')+'<button class="icon-btn" data-action="month:1" aria-label="다음 달">'+icon('chevron-right')+'</button></div></div>'+
    (view==='calendar'?calendar():gantt())+'<div class="legend">'+Object.entries(types).map(([kind,label])=>'<span class="'+kind+'"><i></i>'+label+'</span>').join('')+'</div></section>';
}
function options(choices,selected) {
  return Object.entries(choices).map(([value,label])=>'<option value="'+esc(value)+'"'+(value===selected?' selected':'')+'>'+esc(label)+'</option>').join('');
}
function taskStatus(task) {
  return '<select aria-label="'+esc(task.title)+' 진행 상태" data-task="'+task.id+'">'+options(statuses,task.status)+'</select>';
}
function taskLabel(task) {
  const note = state.notes.find(item=>item.id===task.sourceNoteId);
  return '<div>'+button(esc(task.title),'edit:tasks:'+task.id,'text-btn')+'<small class="row-meta">'+esc(ownerName(task.owner))+' · '+(pretty(task.date)||'마감 미정')+(note?' · '+esc(note.title):'')+'</small></div>';
}
function personalTasks(items) {
  return items.map(task=>'<article class="task-row">'+taskLabel(task)+taskStatus(task)+'</article>').join('')||'<p class="empty">내게 배정된 할 일이 없어요.</p>';
}
function board() {
  return '<section class="board">'+Object.entries(statuses).map(([status,label])=>{
    const items = state.tasks.filter(task=>task.status===status);
    return '<section class="column"><h2>'+label+' · '+items.length+'</h2>'+(items.map(task=>'<article class="task-card">'+taskLabel(task)+taskStatus(task)+'</article>').join('')||'<p class="empty">등록된 할 일이 없어요.</p>')+'</section>';
  }).join('')+'</section>';
}
function notes() {
  return '<section class="note-grid">'+(state.notes.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(note=>{
    const count = state.tasks.filter(task=>task.sourceNoteId===note.id).length;
    return '<article class="note-card"><h2 class="note-title">'+esc(note.title)+'</h2><small class="row-meta">'+pretty(note.date)+(count?' · 후속 할 일 '+count+'건':'')+'</small><p>'+esc(note.body)+'</p><div class="note-actions">'+button('회의록 수정','edit:notes:'+note.id)+button('후속 할 일 추가','followup:'+note.id,'secondary','plus')+'</div></article>';
  }).join('')||'<p class="empty">등록된 회의록이 없어요.</p>')+'</section>';
}
function collaboration() {
  const isNotes = view==='notes';
  return heading('팀 협업','팀 할 일과 회의에서 결정한 내용을 관리하세요.',isNotes?button('새 회의록','new:notes','primary','plus'):button('새 할 일','new:tasks','primary','plus'))+
    tabs('팀 협업 보기',['tasks','notes'])+(isNotes?notes():board());
}
function activity() {
  return '<section class="panel">'+(state.activity.map(item=>'<div class="activity-entry"><strong>'+esc(item.message)+'</strong><small class="row-meta">'+esc(new Date(item.time).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}))+'</small></div>').join('')||'<div class="activity-entry"><p class="empty">변경 내역이 없어요.</p></div>')+'</section>';
}
function profile() {
  let content;
  if (view==='activity') content = activity();
  else if (view==='myTasks') content = '<section class="panel row-list">'+personalTasks(state.tasks.filter(task=>task.owner===self).sort(sortDate))+'</section>';
  else {
    const details = [['이름',state.profile.name],['이메일',state.profile.email||'미등록'],['팀','8조 · 전지적 액터 시점'],['역할','팀원']];
    content = '<section class="panel profile-card"><div class="identity"><span class="avatar">'+esc(initial())+'</span><h2>'+esc(state.profile.name)+'</h2></div><dl>'+
      details.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl></section>';
  }
  return heading('내 프로필','회원 정보와 내 할 일, 변경 기록을 확인하세요.',view==='profile'?button('회원 정보 수정','profile-edit','secondary'):'')+tabs('내 프로필 보기',['profile','myTasks','activity'])+content;
}
function render() {
  const views = {dashboard,calendar:schedule,gantt:schedule,tasks:collaboration,notes:collaboration,profile,myTasks:profile,activity:profile};
  const topView = ({gantt:'calendar',notes:'tasks',myTasks:'profile',activity:'profile'})[view]||view;
  $('#crumb').textContent = {dashboard:'대시보드',calendar:'일정 관리',tasks:'팀 협업',profile:'내 프로필'}[topView];
  for (const nav of document.querySelectorAll('[data-view]')) {
    if (nav.dataset.view===topView) nav.setAttribute('aria-current','page');
    else nav.removeAttribute('aria-current');
  }
  for (const name of document.querySelectorAll('[data-name]')) name.textContent=state.profile.name;
  for (const element of document.querySelectorAll('[data-initial]')) element.textContent=initial();
  main.innerHTML = views[view]();
}

function save(message) {
  state.activity.unshift({message,time:Date.now()});
  state.activity = state.activity.slice(0,100);
  try { localStorage.setItem(key,JSON.stringify(state)); }
  catch { message += ' (브라우저 저장 공간을 사용할 수 없어요.)'; }
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{toast.hidden=true;},3000);
  render();
}
function show(title,body) {
  modalContent.innerHTML = '<header class="modal-head"><h2 id="dialog-title">'+title+'</h2><button class="icon-btn" type="button" data-action="close" aria-label="닫기">'+icon('close')+'</button></header>'+body;
  modal.setAttribute('aria-labelledby','dialog-title');
  if (!modal.open) modal.showModal();
}
const names = {schedules:'일정',tasks:'할 일',notes:'회의록'};
function edit(kind,id,date=demoDay,sourceNoteId='') {
  const item = state[kind].find(entry=>entry.id===id) || {title:'',date,owner:members[0],type:'meeting',status:'todo',time:'',body:''};
  const referenceNote = state.notes.find(note=>note.id===(sourceNoteId||item.sourceNoteId));
  const ownerChoices = Object.fromEntries(members.map(member=>[member,ownerName(member)]));
  const dateField = '<label>'+({schedules:'시작일',tasks:'마감일',notes:'회의 날짜'}[kind])+'<input type="date" name="date" value="'+esc(item.date)+'" '+(kind==='tasks'?'':'required')+'></label>';
  const endField = '<label>종료일 (선택)<input type="date" name="endDate" min="'+esc(item.date)+'" value="'+esc(item.endDate)+'"></label>';
  const timeField = '<label>시간<input type="time" name="time" value="'+esc(item.time)+'"></label>';
  const ownerField = '<label>담당자<select name="owner">'+options(ownerChoices,item.owner)+'</select></label>';
  const detail = kind==='schedules' ? '<div class="form-row">'+dateField+endField+'</div><div class="form-row">'+timeField+'<label>유형<select name="type">'+options(types,item.type)+'</select></label></div>'+ownerField
    : kind==='tasks' ? '<div class="form-row">'+dateField+ownerField+'</div><label>상태<select name="status">'+options(statuses,item.status)+'</select></label>' : dateField;
  show(names[kind]+(id?' 수정':' 추가'),'<form id="editor" data-kind="'+kind+'" data-id="'+(id||'')+'" data-note="'+(referenceNote?.id||'')+'"><div class="form-body">'+(referenceNote?'<p class="row-meta">연결된 회의록 · '+esc(referenceNote.title)+'</p>':'')+'<label>제목<input name="title" value="'+esc(item.title)+'" required maxlength="80" autofocus></label>'+detail+
    '<label>'+(kind==='notes'?'회의 내용':'메모')+'<textarea name="body" rows="4" maxlength="3000">'+esc(item.body)+'</textarea></label></div><footer class="modal-foot">'+(id?button('삭제','confirm:'+kind+':'+id,'danger'):'')+button('취소','close')+'<button type="submit" class="primary">저장</button></footer></form>');
  modalContent.querySelector('[name="title"]').focus();
}
function editProfile() {
  show('회원 정보 수정','<form id="profile-editor"><div class="form-body"><label>이름<input name="name" maxlength="40" autocomplete="name" value="'+esc(state.profile.name)+'" required autofocus></label><label>이메일<input name="email" type="email" maxlength="120" autocomplete="email" value="'+esc(state.profile.email)+'"></label></div><footer class="modal-foot">'+button('취소','close')+'<button type="submit" class="primary">저장</button></footer></form>');
}
document.addEventListener('click',event=>{
  const nav = event.target.closest('[data-view]');
  if (nav) { view=nav.dataset.view; render(); return; }
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const [action,entry,id] = control.dataset.action.split(':');
  switch(action) {
    case 'close': modal.close(); break;
    case 'view': view=entry; render(); break;
    case 'today': month=new Date(2026,10,1); render(); break;
    case 'month': month=new Date(month.getFullYear(),month.getMonth()+Number(entry),1); render(); break;
    case 'day': edit('schedules','',entry); break;
    case 'new': edit(entry); break;
    case 'followup': edit('tasks','',demoDay,entry); break;
    case 'profile-edit': editProfile(); break;
    case 'edit': edit(entry,id); break;
    case 'confirm':
      show(names[entry]+' 삭제','<div class="form-body"><p>이 '+names[entry]+'을 삭제할까요?</p></div><footer class="modal-foot">'+button('취소','edit:'+entry+':'+id)+button('삭제','delete:'+entry+':'+id,'danger')+'</footer>');
      break;
    case 'delete': {
      const item = state[entry].find(record=>record.id===id);
      state[entry] = state[entry].filter(record=>record.id!==id);
      modal.close();
      save(names[entry]+' 삭제 · '+item.title);
      break;
    }
  }
});
$('#alerts').addEventListener('click',()=>{
  show('예정 일정 알림','<div class="row-list">'+upcomingRows(upcoming().slice(0,4))+'</div>');
});
modal.addEventListener('submit',event=>{
  const form = event.target;
  if (form.id==='profile-editor') {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const name = values.name.trim();
    if (!name) {
      form.elements.name.setCustomValidity('이름을 입력하세요.');
      form.elements.name.reportValidity();
      return;
    }
    state.profile = {name,email:values.email.trim()};
    modal.close();
    save('회원 정보 수정');
    return;
  }
  if (form.id!=='editor') return;
  event.preventDefault();
  const {kind,id} = form.dataset;
  const values = Object.fromEntries(new FormData(form));
  values.title = values.title.trim();
  if (!values.title) {
    form.elements.title.setCustomValidity('제목을 입력하세요.');
    form.elements.title.reportValidity();
    return;
  }
  const index = state[kind].findIndex(item=>item.id===id);
  if (kind==='tasks' && form.dataset.note) values.sourceNoteId=form.dataset.note;
  const item = {...values,id:id||globalThis.crypto?.randomUUID?.()||String(Date.now())};
  if (index<0) state[kind].push(item);
  else state[kind][index]=item;
  if (kind==='schedules'&&(view==='calendar'||view==='gantt')) {
    month = new Date(Number(item.date.slice(0,4)),Number(item.date.slice(5,7))-1,1);
  }
  modal.close();
  save(names[kind]+(id?' 수정 · ':' 추가 · ')+item.title);
});
modal.addEventListener('input',event=>{
  const input = event.target;
  if (input.name==='title'||input.name==='name') input.setCustomValidity('');
  if (input.name==='date' && input.form.elements.endDate) input.form.elements.endDate.min=input.value;
});
main.addEventListener('change',event=>{
  if (!event.target.dataset.task) return;
  const task = state.tasks.find(item=>item.id===event.target.dataset.task);
  task.status = event.target.value;
  save('할 일 상태 변경 · '+task.title+' → '+statuses[task.status]);
  main.querySelector('[data-task="'+task.id+'"]')?.focus();
});
for (const element of document.querySelectorAll('[data-icon]')) element.innerHTML=icon(element.dataset.icon);
render();

