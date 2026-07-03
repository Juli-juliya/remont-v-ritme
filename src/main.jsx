import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, Building2, CalendarDays, Check, ChevronDown, ChevronRight,
  CircleAlert, Clock3, Hammer, House, ImagePlus, Layers3, ListChecks,
  Minus, PackageCheck, Plug, Plus, ReceiptText, Settings2, Sofa,
  Sparkles, ToggleLeft, Trash2, Upload, WalletCards, X
} from 'lucide-react';
import './styles.css';

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const shortDate = value => value ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`)).replace('.', '') : 'Не указано';
const longDate = value => value ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : 'Не указан';
const plural = (n, one, few, many) => { const n10=n%10,n100=n%100; return n10===1&&n100!==11?one:n10>=2&&n10<=4&&(n100<12||n100>14)?few:many };
const roomColors = ['#ef7456', '#65735b', '#d8aa48', '#4f7e80', '#8b6f9b', '#bd7a4f'];

const seedStore = {
  activeObjectId: 'lugovaya',
  objects: [
    {
      id: 'lugovaya', name: 'Квартира на Луговой', kind: 'Квартира', budget: 1850000,
      deadline: '2026-09-18', planImage: null,
      rooms: [
        { id: 'kitchen', name: 'Кухня', area: 12.4, outlets: 8, switches: 2, color: roomColors[0] },
        { id: 'living', name: 'Гостиная', area: 21.8, outlets: 10, switches: 3, color: roomColors[1] },
        { id: 'bedroom', name: 'Спальня', area: 15.2, outlets: 7, switches: 2, color: roomColors[2] },
        { id: 'bath', name: 'Санузел', area: 4.7, outlets: 3, switches: 2, color: roomColors[3] },
      ],
      tasks: [
        { id: 1, group: 'Черновые работы', title: 'Демонтаж и вывоз', roomIds: ['kitchen','living','bedroom','bath'], start: '2026-06-10', end: '2026-06-16', cost: 118000, done: true, progress: 100 },
        { id: 2, group: 'Инженерия', title: 'Электрика', roomIds: ['kitchen','living','bedroom','bath'], start: '2026-06-17', end: '2026-06-28', cost: 182000, done: true, progress: 100 },
        { id: 3, group: 'Стены', title: 'Штукатурка и шпаклёвка', roomIds: ['kitchen','living','bedroom'], start: '2026-06-24', end: '2026-07-12', cost: 236000, done: false, progress: 72 },
        { id: 4, group: 'Сантехника', title: 'Разводка сантехники', roomIds: ['kitchen','bath'], start: '2026-07-01', end: '2026-07-08', cost: 96000, done: false, progress: 45, risk: true },
        { id: 5, group: 'Потолки', title: 'Натяжной потолок', roomIds: ['kitchen','living','bedroom','bath'], start: '2026-08-05', end: '2026-08-08', cost: 87000, done: false, progress: 0 },
      ],
      materials: [
        { id: 1, name: 'Керамогранит', category: 'Материалы', detail: '18 м²', roomIds: ['bath'], price: 54000, bought: true },
        { id: 2, name: 'Краска для стен', category: 'Материалы', detail: '42 л', roomIds: ['kitchen','living','bedroom'], price: 38600, bought: false, urgent: true },
        { id: 3, name: 'Диван', category: 'Мебель', detail: 'Модульный', roomIds: ['living'], price: 124000, bought: false },
      ]
    },
    {
      id: 'prospekt', name: 'Дом на проспекте', kind: 'Дом', budget: 4200000,
      deadline: '2026-12-20', planImage: null,
      rooms: [
        { id: 'hall-house', name: 'Кухня-гостиная', area: 38, outlets: 18, switches: 6, color: roomColors[1] },
        { id: 'terrace', name: 'Терраса', area: 24, outlets: 4, switches: 2, color: roomColors[2] },
      ],
      tasks: [
        { id: 11, group: 'Фасад', title: 'Утепление фасада', roomIds: [], start: '2026-07-15', end: '2026-08-15', cost: 480000, done: false, progress: 15 },
      ],
      materials: [
        { id: 12, name: 'Утеплитель', category: 'Материалы', detail: '120 м²', roomIds: [], price: 186000, bought: false },
      ]
    }
  ]
};

function loadStore() {
  try {
    const current = JSON.parse(localStorage.getItem('remont-portfolio-v2'));
    if (current?.objects?.length) {
      if (current.designVersion !== 3) {
        return { ...current, designVersion:3, objects:current.objects.map(o=>o.id==='lugovaya'&&o.deadline==='2026-07-01'?{...o,deadline:'2026-09-18'}:o) };
      }
      return current;
    }
    const old = JSON.parse(localStorage.getItem('remont-data'));
    if (old?.rooms) {
      const rooms = old.rooms.map((r,i)=>({ ...r, id:String(r.id), outlets:0, switches:0, color:r.color||roomColors[i%roomColors.length] }));
      return { activeObjectId:'migrated', objects:[{ id:'migrated', name:'Квартира на Светлой', kind:'Квартира', budget:old.budget||0, deadline:'2026-09-18', planImage:null, rooms, tasks:(old.tasks||[]).map(t=>({...t,roomIds:(t.rooms||[]).map(String),start:'2026-07-01',end:'2026-07-15'})), materials:(old.materials||[]).map(m=>({...m,category:'Материалы',roomIds:rooms.map(r=>r.id)})) }] };
    }
  } catch { /* use clean demo data */ }
  return seedStore;
}

function ProgressRing({ value }) {
  const r = 55, c = 2 * Math.PI * r;
  return <div className="ring-wrap"><svg viewBox="0 0 128 128" className="ring"><circle cx="64" cy="64" r={r} className="ring-track"/><circle cx="64" cy="64" r={r} className="ring-value" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}/></svg><div className="ring-label"><b>{value}%</b><span>готово</span></div></div>;
}

function Sheet({ open, onClose, children, wide = false }) {
  if (!open) return null;
  return <div className="sheet-layer" onMouseDown={onClose}><section className={`sheet ${wide ? 'sheet-wide' : ''}`} onMouseDown={e=>e.stopPropagation()}><div className="sheet-handle"/><button aria-label="Закрыть" className="icon-button sheet-close" onClick={onClose}><X size={20}/></button>{children}</section></div>;
}

function RoomPicker({ rooms, selected, onChange }) {
  const all = selected.length === rooms.length && rooms.length > 0;
  const toggle = id => onChange(selected.includes(id) ? selected.filter(x=>x!==id) : [...selected,id]);
  return <div className="room-picker"><button type="button" className={all?'selected':''} onClick={()=>onChange(all?[]:rooms.map(r=>r.id))}>Весь объект</button>{rooms.map(r=><button type="button" className={selected.includes(r.id)?'selected':''} key={r.id} onClick={()=>toggle(r.id)}>{r.name}</button>)}</div>;
}

function ObjectForm({ onSave, initial }) {
  const [name,setName]=useState(initial?.name||''); const [kind,setKind]=useState(initial?.kind||'Квартира');
  const [budget,setBudget]=useState(initial?.budget||''); const [deadline,setDeadline]=useState(initial?.deadline||'');
  return <><p className="eyebrow">{initial?'НАСТРОЙКИ':'НОВЫЙ ОБЪЕКТ'}</p><h2>{initial?'Параметры объекта':'Добавить объект'}</h2>
    <label className="field"><span>Название</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Например, дача в Артёме"/></label>
    <div className="form-grid"><label className="field"><span>Тип</span><select value={kind} onChange={e=>setKind(e.target.value)}><option>Квартира</option><option>Дом</option><option>Офис</option><option>Другое</option></select></label><label className="field"><span>Бюджет, ₽</span><input inputMode="numeric" value={budget} onChange={e=>setBudget(e.target.value.replace(/\D/g,''))} placeholder="0"/></label></div>
    <label className="field"><span>Дедлайн готовности</span><input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}/></label>
    <button className="primary-button" disabled={!name.trim()||!Number(budget)||!deadline} onClick={()=>onSave({name:name.trim(),kind,budget:Number(budget),deadline})}><Check size={18}/> Сохранить</button></>;
}

function RoomForm({ onSave }) {
  const [name,setName]=useState(''); const [area,setArea]=useState(''); const [outlets,setOutlets]=useState('0'); const [switches,setSwitches]=useState('0');
  return <><p className="eyebrow">НОВОЕ ПРОСТРАНСТВО</p><h2>Добавить комнату</h2><label className="field"><span>Название</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Например, детская"/></label><label className="field"><span>Площадь, м²</span><input inputMode="decimal" value={area} onChange={e=>setArea(e.target.value.replace(',','.').replace(/[^\d.]/g,''))} placeholder="0"/></label><div className="form-grid"><label className="field"><span>Розетки</span><input inputMode="numeric" value={outlets} onChange={e=>setOutlets(e.target.value.replace(/\D/g,''))}/></label><label className="field"><span>Выключатели</span><input inputMode="numeric" value={switches} onChange={e=>setSwitches(e.target.value.replace(/\D/g,''))}/></label></div><button className="primary-button" disabled={!name.trim()||!Number(area)} onClick={()=>onSave({name:name.trim(),area:Number(area),outlets:Number(outlets),switches:Number(switches)})}><Plus size={18}/> Добавить пространство</button></>;
}

function TaskForm({ rooms, onSave }) {
  const [title,setTitle]=useState(''); const [group,setGroup]=useState('Отделка'); const [cost,setCost]=useState('');
  const [start,setStart]=useState(''); const [end,setEnd]=useState(''); const [roomIds,setRoomIds]=useState([]);
  return <><p className="eyebrow">ПЛАН РАБОТ</p><h2>Новая работа</h2><label className="field"><span>Название</span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Например, монтаж потолка"/></label><div className="form-grid"><label className="field"><span>Раздел</span><select value={group} onChange={e=>setGroup(e.target.value)}><option>Черновые работы</option><option>Инженерия</option><option>Отделка</option><option>Мебель</option><option>Прочее</option></select></label><label className="field"><span>Стоимость, ₽</span><input inputMode="numeric" value={cost} onChange={e=>setCost(e.target.value.replace(/\D/g,''))} placeholder="0"/></label></div><div className="form-grid"><label className="field"><span>Дата начала</span><input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label className="field"><span>Дата окончания</span><input type="date" min={start} value={end} onChange={e=>setEnd(e.target.value)}/></label></div><div className="field"><span>Где выполняем</span><RoomPicker rooms={rooms} selected={roomIds} onChange={setRoomIds}/></div><button className="primary-button" disabled={!title.trim()||!Number(cost)||!start||!end} onClick={()=>onSave({title:title.trim(),group,cost:Number(cost),start,end,roomIds})}><Check size={18}/> Добавить в план</button></>;
}

function MaterialForm({ rooms, onSave, expense = false }) {
  const [name,setName]=useState(''); const [category,setCategory]=useState(expense?'Прочее':'Материалы'); const [price,setPrice]=useState(''); const [detail,setDetail]=useState(''); const [roomIds,setRoomIds]=useState([]);
  return <><p className="eyebrow">{expense?'НОВЫЙ РАСХОД':'КОМПЛЕКТАЦИЯ'}</p><h2>{expense?'Добавить расход':'Новая покупка'}</h2><label className="field"><span>Название</span><input value={name} onChange={e=>setName(e.target.value)} placeholder={expense?'Например, доставка':'Например, обеденный стол'}/></label><div className="form-grid"><label className="field"><span>Категория</span><select value={category} onChange={e=>setCategory(e.target.value)}><option>Материалы</option><option>Предметы</option><option>Мебель</option><option>Расходники</option><option>Прочее</option></select></label><label className="field"><span>Стоимость, ₽</span><input inputMode="numeric" value={price} onChange={e=>setPrice(e.target.value.replace(/\D/g,''))} placeholder="0"/></label></div><label className="field"><span>Количество / примечание</span><input value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Например, 12 шт."/></label><div className="field"><span>Для каких пространств</span><RoomPicker rooms={rooms} selected={roomIds} onChange={setRoomIds}/></div><button className="primary-button" disabled={!name.trim()||!Number(price)} onClick={()=>onSave({name:name.trim(),category,price:Number(price),detail,roomIds,bought:expense})}><Check size={18}/> Сохранить</button></>;
}

function App() {
  const [store,setStore]=useState(loadStore);
  const [tab,setTab]=useState('home'); const [filter,setFilter]=useState('Все'); const [sheet,setSheet]=useState(null);
  const object = store.objects.find(o=>o.id===store.activeObjectId) || store.objects[0];

  useEffect(()=>{ try { localStorage.setItem('remont-portfolio-v2',JSON.stringify(store)); } catch { /* large plan images may exceed local storage */ } },[store]);
  useEffect(()=>{ const tg=window.Telegram?.WebApp; if(!tg)return; tg.ready();tg.expand();tg.setHeaderColor?.('#f4f2ec');tg.setBackgroundColor?.('#f4f2ec'); },[]);
  const updateObject = updater => setStore(s=>({...s,objects:s.objects.map(o=>o.id===object.id?(typeof updater==='function'?updater(o):{...o,...updater}):o)}));
  const planned=useMemo(()=>object.tasks.reduce((s,t)=>s+t.cost,0)+object.materials.reduce((s,m)=>s+m.price,0),[object]);
  const spent=useMemo(()=>object.tasks.filter(t=>t.done).reduce((s,t)=>s+t.cost,0)+object.materials.filter(m=>m.bought).reduce((s,m)=>s+m.price,0),[object]);
  const taskProgress=object.tasks.length?Math.round(object.tasks.reduce((s,t)=>s+(t.done?100:t.progress||0),0)/object.tasks.length):0;
  const progress=Math.round(taskProgress*.8+Math.min(100,Math.max(0,(1-planned/object.budget)*100+50))*.2);
  const daysLeft=Math.ceil((new Date(`${object.deadline}T12:00:00`)-new Date())/86400000);
  const area=object.rooms.reduce((s,r)=>s+r.area,0);
  const roomNames=ids=>!ids?.length?'Общие работы':ids.length===object.rooms.length?'Весь объект':ids.map(id=>object.rooms.find(r=>r.id===id)?.name).filter(Boolean).join(', ');
  const toggleTask=id=>updateObject(o=>({...o,tasks:o.tasks.map(t=>t.id===id?{...t,done:!t.done,progress:!t.done?100:0}:t)}));
  const toggleMaterial=id=>updateObject(o=>({...o,materials:o.materials.map(m=>m.id===id?{...m,bought:!m.bought}:m)}));
  const addTask=v=>{updateObject(o=>({...o,tasks:[...o.tasks,{id:Date.now(),...v,done:false,progress:0}]}));setSheet(null)};
  const addMaterial=v=>{updateObject(o=>({...o,materials:[...o.materials,{id:Date.now(),...v}]}));setSheet(null)};
  const setActive=id=>{setStore(s=>({...s,activeObjectId:id}));setTab('home');setSheet(null)};
  const addObject=v=>{const id=`object-${Date.now()}`;setStore(s=>({...s,activeObjectId:id,objects:[...s.objects,{id,...v,planImage:null,rooms:[],tasks:[],materials:[]}]}));setTab('home');setSheet(null)};
  const saveSettings=v=>{updateObject(v);setSheet(null)};
  const deleteObject=()=>{if(store.objects.length<2)return;setStore(s=>{const rest=s.objects.filter(o=>o.id!==object.id);return{...s,objects:rest,activeObjectId:rest[0].id}});setSheet(null)};
  const addRoom=v=>{updateObject(o=>({...o,rooms:[...o.rooms,{id:`room-${Date.now()}`,...v,color:roomColors[o.rooms.length%roomColors.length]}]}));setSheet('rooms')};
  const deleteRoom=id=>updateObject(o=>({...o,rooms:o.rooms.filter(r=>r.id!==id),tasks:o.tasks.map(t=>({...t,roomIds:t.roomIds.filter(x=>x!==id)})),materials:o.materials.map(m=>({...m,roomIds:m.roomIds.filter(x=>x!==id)}))}));
  const updateRoom=(id,patch)=>updateObject(o=>({...o,rooms:o.rooms.map(r=>r.id===id?{...r,...patch}:r)}));
  const uploadPlan=file=>{if(!file)return;const reader=new FileReader();reader.onload=()=>updateObject({planImage:reader.result});reader.readAsDataURL(file)};

  const Home=()=> <>
    <header className="topbar"><button className="project-switch" onClick={()=>setSheet('objects')}><span className="project-icon">{object.kind==='Дом'?<House/>:<Building2/>}</span><span><small>{object.kind} · {store.objects.length} {plural(store.objects.length,'объект','объекта','объектов')}</small><b>{object.name}</b></span><ChevronDown size={17}/></button><button aria-label="Настройки объекта" className="avatar" onClick={()=>setSheet('settings')}><Settings2 size={18}/></button></header>
    <section className="hero-card"><div className="hero-copy"><span className="status-pill"><Sparkles size={13}/>{daysLeft>=0?'В графике':'Срок истёк'}</span><h2>{daysLeft>=0?'Финиш уже\nвиден':'Нужен новый\nплан'}</h2><p>{daysLeft>=0?`Осталось ${daysLeft} ${plural(daysLeft,'день','дня','дней')}`:`Просрочка ${Math.abs(daysLeft)} ${plural(Math.abs(daysLeft),'день','дня','дней')}`}<br/>до готовности</p></div><ProgressRing value={Math.max(0,Math.min(100,progress))}/><div className="hero-stripe"/></section>
    <div className="section-title"><div><p className="eyebrow">СЕГОДНЯ В ФОКУСЕ</p><h3>Что требует внимания</h3></div><span>{object.tasks.filter(t=>t.risk).length+object.materials.filter(m=>m.urgent&&!m.bought).length}</span></div>
    <div className="focus-list">{object.materials.find(m=>m.urgent&&!m.bought)&&<button className="focus-card coral" onClick={()=>setTab('materials')}><div className="focus-icon"><PackageCheck size={21}/></div><div><b>Купить: {object.materials.find(m=>m.urgent&&!m.bought).name}</b><span>{roomNames(object.materials.find(m=>m.urgent&&!m.bought).roomIds)}</span></div><ChevronRight size={19}/></button>}{object.tasks.find(t=>t.risk)&&<button className="focus-card amber" onClick={()=>{setTab('works');setFilter('Риски')}}><div className="focus-icon"><Clock3 size={21}/></div><div><b>{object.tasks.find(t=>t.risk).title}</b><span>Есть риск задержки</span></div><ChevronRight size={19}/></button>}{!object.tasks.some(t=>t.risk)&&!object.materials.some(m=>m.urgent&&!m.bought)&&<div className="all-good"><Check size={18}/> Всё идёт спокойно</div>}</div>
    <div className="section-title"><div><p className="eyebrow">КОНТРОЛЬНЫЕ ТОЧКИ</p><h3>Бюджет и дедлайн</h3></div></div><div className="metric-grid"><button className="metric-card" onClick={()=>setSheet('budget')}><div className="metric-icon green"><WalletCards size={20}/></div><span>В СМЕТЕ</span><b>{money.format(planned)} ₽</b><div className="meter"><i style={{width:`${Math.min(100,planned/object.budget*100)}%`}}/></div><small>из {money.format(object.budget)} ₽</small></button><button className="metric-card" onClick={()=>setSheet('settings')}><div className="metric-icon blue"><CalendarDays size={20}/></div><span>ДЕДЛАЙН</span><b>{shortDate(object.deadline)}</b><div className="pace"><i/><i/><i/><i/><i className={daysLeft<14?'warning':'muted'}/></div><small>{daysLeft>=0?`${daysLeft} дней в запасе`:'Требует переноса'}</small></button></div>
    <div className="section-title inline"><div><p className="eyebrow">ПРОСТРАНСТВА</p><h3>{object.rooms.length} {plural(object.rooms.length,'пространство','пространства','пространств')} · {area.toFixed(1)} м²</h3></div><button onClick={()=>setSheet('rooms')}>Управлять <ArrowRight size={16}/></button></div><div className="room-scroll">{object.rooms.map((r,i)=>{const rt=object.tasks.filter(t=>t.roomIds.includes(r.id));const rp=rt.length?Math.round(rt.reduce((s,t)=>s+(t.done?100:t.progress||0),0)/rt.length):0;return <button className="room-card" key={r.id} onClick={()=>setSheet({type:'room',id:r.id})}><div className="room-art" style={{'--accent':r.color}}><House size={28}/><span>{rp}%</span></div><b>{r.name}</b><small>{r.area} м² · {r.outlets} {plural(r.outlets,'розетка','розетки','розеток')}</small></button>})}<button className="room-card add-room-card" onClick={()=>setSheet('add-room')}><div className="room-art"><Plus size={27}/></div><b>Добавить</b><small>Новое пространство</small></button></div>
    <button className={`plan-card ${object.planImage?'has-image':''}`} onClick={()=>setSheet('plan')}>{object.planImage?<img src={object.planImage} alt="Планировка объекта"/>:<span className="plan-icon"><ImagePlus/></span>}<span><small>ПЛАНИРОВКА</small><b>{object.planImage?'Посмотреть или заменить':'Загрузить план объекта'}</b></span><ChevronRight/></button>
  </>;

  const Works=()=>{const visible=object.tasks.filter(t=>filter==='Все'||(filter==='В работе'?!t.done:t.risk));return <><header className="page-head"><p className="eyebrow">{object.name}</p><h1>Работы</h1><p>{object.tasks.filter(t=>t.done).length} из {object.tasks.length} завершено</p></header><div className="segmented">{['Все','В работе','Риски'].map(f=><button className={filter===f?'active':''} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div><div className="timeline">{visible.map(t=><article className={`task-card ${t.done?'done':''}`} key={t.id}><button className="check" aria-label={t.done?`Вернуть «${t.title}» в работу`:`Завершить «${t.title}»`} onClick={()=>toggleTask(t.id)}>{t.done&&<Check size={16}/>}</button><div className="task-body"><div className="task-meta"><span>{t.group}</span>{t.risk&&<em><CircleAlert size={12}/> риск</em>}</div><h3>{t.title}</h3><p>{roomNames(t.roomIds)}</p><div className="task-bottom"><span><CalendarDays size={14}/>{shortDate(t.start)} — {shortDate(t.end)}</span><b>{money.format(t.cost)} ₽</b></div>{!t.done&&t.progress>0&&<div className="task-progress"><i style={{width:`${t.progress}%`}}/><span>{t.progress}%</span></div>}</div></article>)}{!visible.length&&<div className="empty"><Check/><b>Здесь пока пусто</b><span>Добавьте первую работу</span></div>}</div><button className="primary-button sticky-action" onClick={()=>setSheet('add-task')}><Plus size={18}/> Добавить работу</button></>};

  const Materials=()=> <><header className="page-head"><p className="eyebrow">{object.name}</p><h1>Покупки</h1><p>{object.materials.filter(m=>m.bought).length} из {object.materials.length} куплено</p></header><section className="material-summary"><PackageCheck size={30}/><div><span>Осталось купить</span><b>{money.format(object.materials.filter(m=>!m.bought).reduce((s,m)=>s+m.price,0))} ₽</b></div></section><div className="material-list">{object.materials.map(m=><button key={m.id} className={`material-row ${m.bought?'done':''}`} onClick={()=>toggleMaterial(m.id)}><span className="material-check">{m.category==='Мебель'?<Sofa size={18}/>:m.bought?<Check size={16}/>:<PackageCheck size={18}/>}</span><span className="material-copy"><span className="category-tag">{m.category}</span><b>{m.name}</b><small>{roomNames(m.roomIds)}{m.detail?` · ${m.detail}`:''}</small>{m.urgent&&!m.bought&&<em>Купить в первую очередь</em>}</span><strong>{money.format(m.price)} ₽</strong></button>)}</div><button className="primary-button" onClick={()=>setSheet('add-material')}><Plus size={19}/> Добавить покупку</button></>;

  const selectedRoom=sheet?.type==='room'?object.rooms.find(r=>r.id===sheet.id):null;
  return <div className="app-shell"><main>{tab==='home'?<Home/>:tab==='works'?<Works/>:<Materials/>}</main><nav className="bottom-nav"><button className={tab==='home'?'active':''} onClick={()=>setTab('home')}><House/><span>Главная</span></button><button className={tab==='works'?'active':''} onClick={()=>setTab('works')}><ListChecks/><span>Работы</span></button><button className="add-button" aria-label="Добавить" onClick={()=>setSheet('quick')}><Plus/></button><button className={tab==='materials'?'active':''} onClick={()=>setTab('materials')}><Layers3/><span>Покупки</span></button><button onClick={()=>setSheet('budget')}><ReceiptText/><span>Смета</span></button></nav>
    <Sheet open={!!sheet} onClose={()=>setSheet(null)} wide={['add-task','add-material','expense'].includes(sheet)}>
      {sheet==='objects'&&<><p className="eyebrow">МОИ ОБЪЕКТЫ</p><h2>Где идёт ремонт?</h2><div className="object-list">{store.objects.map(o=><button className={o.id===object.id?'active':''} key={o.id} onClick={()=>setActive(o.id)}><span>{o.kind==='Дом'?<House/>:<Building2/>}</span><span><b>{o.name}</b><small>{money.format(o.budget)} ₽ · до {shortDate(o.deadline)}</small></span>{o.id===object.id?<Check/>:<ChevronRight/>}</button>)}</div><button className="primary-button" onClick={()=>setSheet('add-object')}><Plus/> Добавить объект</button></>}
      {sheet==='add-object'&&<ObjectForm onSave={addObject}/>} {sheet==='settings'&&<><ObjectForm initial={object} onSave={saveSettings}/>{store.objects.length>1&&<button className="danger-button" onClick={deleteObject}><Trash2 size={17}/> Удалить объект</button>}</>}
      {sheet==='rooms'&&<><p className="eyebrow">{object.name}</p><h2>Пространства</h2><div className="space-list">{object.rooms.map(r=><button key={r.id} onClick={()=>setSheet({type:'room',id:r.id})}><span className="space-dot" style={{background:r.color}}/><span><b>{r.name}</b><small>{r.area} м² · {r.outlets} розеток · {r.switches} выключ.</small></span><ChevronRight/></button>)}</div><button className="primary-button" onClick={()=>setSheet('add-room')}><Plus/> Добавить пространство</button></>}
      {sheet==='add-room'&&<RoomForm onSave={addRoom}/>} {selectedRoom&&<><p className="eyebrow">ПРОСТРАНСТВО</p><h2>{selectedRoom.name}</h2><div className="room-detail" style={{'--accent':selectedRoom.color}}><House/><b>{selectedRoom.area} м²</b><span>{object.tasks.filter(t=>t.roomIds.includes(selectedRoom.id)).length} работ в плане</span></div><div className="counter-list"><Counter icon={<Plug/>} label="Розетки" value={selectedRoom.outlets} onChange={v=>updateRoom(selectedRoom.id,{outlets:v})}/><Counter icon={<ToggleLeft/>} label="Выключатели" value={selectedRoom.switches} onChange={v=>updateRoom(selectedRoom.id,{switches:v})}/></div><button className="danger-button" onClick={()=>{deleteRoom(selectedRoom.id);setSheet('rooms')}}><Trash2 size={17}/> Удалить пространство</button></>}
      {sheet==='plan'&&<><p className="eyebrow">{object.name}</p><h2>Планировка</h2>{object.planImage?<img className="plan-preview" src={object.planImage} alt="Планировка объекта"/>:<div className="plan-empty"><ImagePlus/><b>Добавьте фото или схему</b><span>JPG, PNG или фото бумажного плана</span></div>}<label className="upload-button"><Upload size={18}/>{object.planImage?'Заменить изображение':'Загрузить изображение'}<input type="file" accept="image/*" onChange={e=>uploadPlan(e.target.files?.[0])}/></label>{object.planImage&&<button className="danger-button" onClick={()=>updateObject({planImage:null})}><Trash2 size={17}/> Удалить планировку</button>}</>}
      {sheet==='quick'&&<><p className="eyebrow">{object.name}</p><h2>Что добавим?</h2><div className="action-grid"><button onClick={()=>setSheet('add-task')}><Hammer/><b>Работу</b><span>Комнаты, даты и стоимость</span></button><button onClick={()=>setSheet('add-material')}><PackageCheck/><b>Покупку</b><span>Материал, предмет или мебель</span></button><button onClick={()=>setSheet('expense')}><ReceiptText/><b>Расход</b><span>Оплаченный прочий расход</span></button></div></>}
      {sheet==='add-task'&&<TaskForm rooms={object.rooms} onSave={addTask}/>} {sheet==='add-material'&&<MaterialForm rooms={object.rooms} onSave={addMaterial}/>} {sheet==='expense'&&<MaterialForm rooms={object.rooms} expense onSave={addMaterial}/>} 
      {sheet==='budget'&&<><p className="eyebrow">{object.name}</p><h2>Смета объекта</h2><div className="budget-big"><span>Свободный резерв</span><b>{money.format(object.budget-planned)} ₽</b><small>{Math.round(planned/object.budget*100)}% бюджета распределено</small></div><div className="budget-rows"><div><span>Плановый бюджет</span><b>{money.format(object.budget)} ₽</b></div><div><span>Работы в смете</span><b>{money.format(object.tasks.reduce((s,t)=>s+t.cost,0))} ₽</b></div><div><span>Покупки в смете</span><b>{money.format(object.materials.reduce((s,m)=>s+m.price,0))} ₽</b></div><div><span>Фактически оплачено</span><b>{money.format(spent)} ₽</b></div></div><button className="primary-button" onClick={()=>setSheet('settings')}><Settings2 size={17}/> Изменить бюджет</button></>}
    </Sheet></div>;
}

function Counter({icon,label,value,onChange}) { return <div className="counter"><span className="counter-icon">{icon}</span><b>{label}</b><div><button aria-label={`Уменьшить: ${label}`} onClick={()=>onChange(Math.max(0,value-1))}><Minus/></button><strong>{value}</strong><button aria-label={`Увеличить: ${label}`} onClick={()=>onChange(value+1)}><Plus/></button></div></div> }

createRoot(document.getElementById('root')).render(<App/>);
