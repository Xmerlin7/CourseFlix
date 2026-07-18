# -*- coding: utf-8 -*-
"""CourseFlix UI generator — builds standalone HTML pages (RTL Arabic, Material 3).
Run: python3 build.py
Each output page carries the full CSS/JS inline so it is self-contained."""

import pages_student, pages_teacher

CSS = r"""
/* ---------- Material 3 tokens ---------- */
:root{
  --primary:#65558F; --on-primary:#FFFFFF;
  --primary-container:#E9DDFF; --on-primary-container:#4F378B;
  --secondary-container:#E8DEF8; --on-secondary-container:#4A4458;
  --tertiary-container:#FFD8E4; --on-tertiary-container:#633B48;
  --success-container:#C9EFD4; --on-success-container:#14532D;
  --error:#B3261E; --on-error:#FFFFFF;
  --error-container:#F9DEDC; --on-error-container:#852221;
  --danger-text:#8C3A34;
  --bg:#EFE6F5;
  --surface:#FEFBFF;
  --surface-container-low:#F7F1FA;
  --surface-container:#F1EAF6;
  --surface-container-high:#EBE3F1;
  --surface-container-highest:#E4DBEC;
  --on-surface:#1D1B20; --on-surface-variant:#4A4458;
  --outline:#7A757F; --outline-variant:#D5CCDD;
  --logo:#432B87;
  --nav-active:#4F378A;
  --bubble-sent:#4A4458; --on-bubble-sent:#F5EFF7;
  --data:#6C4BC4; --data-track:#E4DBEC;
  --shadow:0 1px 3px rgba(30,20,50,.12),0 4px 14px rgba(30,20,50,.08);
  --shadow-lg:0 6px 24px rgba(30,20,50,.18);
  --hover:rgba(29,27,32,.08);
  --scrim:rgba(20,10,35,.45);
}
html[data-theme="dark"]{
  --primary:#CFBCFF; --on-primary:#36265D;
  --primary-container:#4F378B; --on-primary-container:#E9DDFF;
  --secondary-container:#4A4458; --on-secondary-container:#E8DEF8;
  --tertiary-container:#633B48; --on-tertiary-container:#FFD8E4;
  --success-container:#1B4A2C; --on-success-container:#BFEBC9;
  --error:#F2B8B5; --on-error:#601410;
  --error-container:#5C1714; --on-error-container:#F9DEDC;
  --danger-text:#F2B8B5;
  --bg:#0F0D13;
  --surface:#1A1620;
  --surface-container-low:#221E28;
  --surface-container:#272231;
  --surface-container-high:#2E2938;
  --surface-container-highest:#37313F;
  --on-surface:#E7E0EE; --on-surface-variant:#CBC3D6;
  --outline:#948E9E; --outline-variant:#49444F;
  --logo:#D9CCFF;
  --nav-active:#E9DDFF;
  --bubble-sent:#524B63; --on-bubble-sent:#F5EFF7;
  --data:#9C7BEA; --data-track:#37313F;
  --shadow:0 1px 3px rgba(0,0,0,.4),0 4px 14px rgba(0,0,0,.3);
  --shadow-lg:0 6px 24px rgba(0,0,0,.5);
  --hover:rgba(231,224,238,.09);
  --scrim:rgba(0,0,0,.55);
}

/* ---------- Base ---------- */
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  font-family:"Rubik",system-ui,-apple-system,"Segoe UI",sans-serif;
  background:var(--bg);color:var(--on-surface);
  min-height:100vh;font-size:15px;line-height:1.6;
  -webkit-font-smoothing:antialiased;
}
a{color:inherit;text-decoration:none}
button{font-family:inherit;cursor:pointer}
input,textarea,select{font-family:inherit}
:focus-visible{outline:3px solid var(--primary);outline-offset:2px;border-radius:8px}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}
::selection{background:var(--primary-container);color:var(--on-primary-container)}

/* scrollbars: square corners; RTL document puts them on the left */
html{direction:rtl}
*{scrollbar-width:thin;scrollbar-color:var(--outline-variant) transparent}
::-webkit-scrollbar{width:12px;height:12px}
::-webkit-scrollbar-track{background:transparent;border-radius:0}
::-webkit-scrollbar-thumb{background:var(--outline-variant);border-radius:0;border:none}
::-webkit-scrollbar-thumb:hover{background:var(--outline)}
::-webkit-scrollbar-corner{background:transparent}
.page::-webkit-scrollbar-track{margin-block:10%}
/* auto-hide: thumb only visible while actively scrolling */
.page,.chat-scroll,.convo-list{scrollbar-color:transparent transparent}
.page::-webkit-scrollbar-thumb,.chat-scroll::-webkit-scrollbar-thumb,.convo-list::-webkit-scrollbar-thumb{background:transparent}
.page.scrolling,.chat-scroll.scrolling,.convo-list.scrolling{scrollbar-color:var(--outline-variant) transparent}
.page.scrolling::-webkit-scrollbar-thumb,.chat-scroll.scrolling::-webkit-scrollbar-thumb,.convo-list.scrolling::-webkit-scrollbar-thumb{background:var(--outline-variant)}

.ms{
  font-family:"Material Symbols Rounded";font-weight:normal;font-style:normal;
  font-size:24px;line-height:1;display:inline-block;user-select:none;flex:none;
  font-variation-settings:"FILL" 0,"wght" 500,"GRAD" 0,"opsz" 24;
}
.ms.fill{font-variation-settings:"FILL" 1,"wght" 500,"GRAD" 0,"opsz" 24}
.ms.sm{font-size:20px}

/* ---------- App layout ---------- */
body.shell{height:100vh;overflow:hidden}
.app{display:flex;height:100vh}
.main{flex:1;min-width:0;height:100vh;padding:14px;padding-inline-start:0}
.sheet{
  background:var(--surface);border-radius:28px;height:100%;overflow:hidden;
  padding:0 clamp(18px,4vw,48px);display:flex;flex-direction:column;
}
.page{flex:1;min-height:0;overflow-y:auto;padding-top:26px;padding-bottom:48px;padding-inline-end:12px}

/* ---------- Sidebar ---------- */
.sidebar{
  width:250px;flex:none;position:sticky;top:0;height:100vh;
  display:flex;flex-direction:column;padding:18px 14px;gap:8px;
}
.sidebar .rail-toggle{align-self:flex-start;margin-bottom:22px}
.sidebar nav{display:flex;flex-direction:column;gap:6px}
.nav-item{
  display:flex;align-items:center;gap:14px;padding:12px 18px;border-radius:999px;
  color:var(--on-surface-variant);font-weight:600;font-size:15px;
  transition:background .15s;
}
.nav-item:hover{background:var(--hover)}
.nav-item.active{background:var(--secondary-container);color:var(--nav-active);font-weight:700}
.nav-item.active .ms{font-variation-settings:"FILL" 1,"wght" 600,"GRAD" 0,"opsz" 24}
.side-footer{margin-top:auto;display:flex;flex-direction:column;gap:4px}
.side-footer .nav-item{font-size:14px}
.nav-item.logout{color:var(--danger-text);font-weight:700}
.avatar{
  width:34px;height:34px;border-radius:50%;flex:none;
  background:var(--primary-container);color:var(--on-primary-container);
  display:grid;place-items:center;
}
.avatar .ms{font-size:20px}

.sidebar.rail{width:96px;padding-inline:10px}
.sidebar.rail .nav-item{flex-direction:column;gap:4px;padding:10px 6px;font-size:11.5px;text-align:center;border-radius:18px}
.sidebar.rail .side-footer .lbl{display:none}
.sidebar.rail .side-footer .nav-item{align-items:center;justify-content:center}

/* ---------- Top bar ---------- */
.topbar{
  display:flex;align-items:center;gap:8px;padding:22px 0 16px;
  border-bottom:1px solid var(--outline-variant);flex:none;
}
.logo{
  font-family:"Anton",sans-serif;font-size:26px;letter-spacing:.5px;
  color:var(--logo);line-height:1;
}
.grow{flex:1}
.icon-btn{
  width:44px;height:44px;border-radius:999px;border:none;background:none;
  display:grid;place-items:center;color:var(--on-surface-variant);position:relative;
  transition:background .15s;
}
.icon-btn:hover{background:var(--hover)}
.badge{
  position:absolute;top:2px;inset-inline-start:2px;min-width:18px;height:18px;
  padding:0 4px;border-radius:999px;background:var(--primary);color:var(--on-primary);
  font-size:11px;font-weight:700;display:grid;place-items:center;line-height:1;
}

/* ---------- Buttons ---------- */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:10px 24px;border-radius:999px;border:none;
  background:var(--primary);color:var(--on-primary);
  font-weight:700;font-size:14px;line-height:1.4;transition:box-shadow .15s,filter .15s;
}
.btn:hover{box-shadow:var(--shadow);filter:brightness(1.06)}
.btn .ms{font-size:20px}
.btn.tonal{background:var(--secondary-container);color:var(--on-secondary-container)}
.btn.outlined{background:transparent;border:1px solid var(--outline);color:var(--primary)}
.btn.text{background:transparent;color:var(--primary);padding:10px 14px}
.btn.text:hover{box-shadow:none;background:var(--hover)}
.btn.danger{background:var(--error-container);color:var(--on-error-container)}
.btn.big{padding:14px 32px;font-size:15px}
.btn:disabled{opacity:.5;cursor:not-allowed;box-shadow:none;filter:none}

/* ---------- Chips ---------- */
.chip{
  display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;
  font-size:13px;font-weight:700;line-height:1.3;border:none;white-space:nowrap;
  background:var(--secondary-container);color:var(--on-secondary-container);
}
.chip .ms{font-size:17px}
.chip.green{background:var(--success-container);color:var(--on-success-container)}
.chip.pink{background:var(--tertiary-container);color:var(--on-tertiary-container)}
.chip.red{background:var(--error-container);color:var(--on-error-container)}
.chip.outline{background:transparent;border:1px solid var(--outline-variant);color:var(--on-surface-variant)}
.chip.clickable{cursor:pointer;transition:background .15s}
.chip.clickable:hover{filter:brightness(.97)}
.chip.clickable.selected{background:var(--secondary-container);color:var(--on-secondary-container);border-color:transparent}

/* ---------- Sections / headings ---------- */
.section{margin-bottom:36px}
.section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}
.section-head h2{font-size:24px;font-weight:700}
.see-all{display:inline-flex;align-items:center;gap:4px;color:var(--primary);font-weight:700;font-size:15px}
.see-all .ms{font-size:20px}
h1.page-title{font-size:28px;font-weight:700;margin-bottom:6px}
.subtitle{color:var(--on-surface-variant);margin-bottom:28px}
.divider{border:none;border-top:1px solid var(--outline-variant);margin:32px 0}

/* ---------- Cards ---------- */
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:22px}
.card{
  background:var(--surface-container-low);border-radius:22px;padding:22px;
  display:flex;flex-direction:column;gap:14px;
}
.card.lift{transition:box-shadow .2s,transform .2s}
.card.lift:hover{box-shadow:var(--shadow);transform:translateY(-2px)}
.card h3{font-size:18px;font-weight:700;line-height:1.45}
.card .meta{color:var(--on-surface-variant);font-size:13.5px}

/* course thumb placeholder (abstract shapes) */
.thumb{
  width:118px;height:112px;flex:none;border-radius:16px;
  background:var(--surface-container-high);position:relative;overflow:hidden;
}
.thumb i{position:absolute;background:var(--outline-variant);opacity:.9}
.thumb .t1{width:38px;height:34px;top:16px;inset-inline-start:38px;clip-path:polygon(50% 0,100% 100%,0 100%);border-radius:6px}
.thumb .t2{width:30px;height:30px;bottom:18px;inset-inline-start:22px;border-radius:50% 45% 55% 50%/55% 50% 50% 45%}
.thumb .t3{width:32px;height:30px;bottom:20px;inset-inline-end:20px;border-radius:9px}
.course-card .row{display:flex;gap:18px;align-items:center}
.course-card .row .info{flex:1;min-width:0;display:flex;flex-direction:column;gap:12px}
.actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}

/* ---------- Progress ---------- */
.progress{height:6px;border-radius:999px;background:var(--data-track);position:relative}
.progress .bar{position:absolute;inset-inline-start:0;top:0;bottom:0;border-radius:999px;background:var(--data);min-width:6px}
.progress::after{
  content:"";position:absolute;inset-inline-end:0;top:50%;transform:translateY(-50%);
  width:4px;height:4px;border-radius:50%;background:var(--data);
}

/* ---------- Stat tiles ---------- */
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.tile{background:var(--surface-container-low);border-radius:20px;padding:20px 22px;display:flex;flex-direction:column;gap:6px}
.tile .lbl{font-size:13px;font-weight:600;color:var(--on-surface-variant)}
.tile .num{font-size:32px;font-weight:700;line-height:1.15}
.tile .sub{font-size:12.5px;color:var(--on-surface-variant)}
.tile .lead-ic{
  width:40px;height:40px;border-radius:12px;background:var(--secondary-container);
  color:var(--on-secondary-container);display:grid;place-items:center;margin-bottom:6px;
}

/* ---------- Bar list (data viz) ---------- */
.barlist{display:flex;flex-direction:column;gap:16px}
.barlist .brow{display:grid;grid-template-columns:minmax(120px,180px) 1fr 52px;align-items:center;gap:14px}
.barlist .blabel{font-size:13.5px;font-weight:600;color:var(--on-surface-variant);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.barlist .btrack{height:10px;border-radius:999px;background:var(--data-track);position:relative}
.barlist .bfill{position:absolute;inset-inline-start:0;top:0;bottom:0;border-radius:999px;background:var(--data);min-width:10px}
.barlist .bval{font-size:13.5px;font-weight:700;text-align:start}

/* ---------- Lists ---------- */
.list{display:flex;flex-direction:column;gap:12px}
.list-item{
  display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:18px;
  background:var(--surface-container-low);transition:background .15s;
}
a.list-item:hover,.list-item.hoverable:hover{background:var(--surface-container)}
.lead{
  width:46px;height:46px;border-radius:50%;flex:none;
  background:var(--secondary-container);color:var(--on-secondary-container);
  display:grid;place-items:center;
}
.lead.green{background:var(--success-container);color:var(--on-success-container)}
.lead.pink{background:var(--tertiary-container);color:var(--on-tertiary-container)}
.lead.red{background:var(--error-container);color:var(--on-error-container)}
.list-item .body{flex:1;min-width:0}
.list-item .body .t{font-weight:700}
.list-item .body .s{font-size:13.5px;color:var(--on-surface-variant)}
.list-item .end{flex:none;display:flex;align-items:center;gap:10px;color:var(--on-surface-variant);font-size:13px}
.unread-dot{width:10px;height:10px;border-radius:50%;background:var(--primary);flex:none}

/* ---------- Tabs ---------- */
.tabs{display:flex;gap:2px;border-bottom:1px solid var(--outline-variant);margin-bottom:26px;overflow-x:auto;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{
  padding:13px 20px;font-weight:700;font-size:14.5px;color:var(--on-surface-variant);
  background:none;border:none;position:relative;white-space:nowrap;
}
.tab:hover{color:var(--on-surface)}
.tab.active{color:var(--primary)}
.tab.active::after{
  content:"";position:absolute;bottom:-1px;inset-inline:16px;height:3px;
  border-radius:3px 3px 0 0;background:var(--primary);
}
.tabpane{display:none}
.tabpane.active{display:block}

/* ---------- Forms ---------- */
.tf{display:flex;flex-direction:column;gap:7px;margin-bottom:16px}
.tf label{font-size:13.5px;font-weight:700;color:var(--on-surface-variant)}
.tf input,.tf textarea,.tf select{
  background:var(--surface-container-high);border:1.5px solid transparent;border-radius:14px;
  padding:13px 16px;font-size:14.5px;color:var(--on-surface);width:100%;
}
.tf textarea{resize:vertical;min-height:96px}
.tf input:focus,.tf textarea:focus,.tf select:focus{outline:none;border-color:var(--primary);background:var(--surface)}
.tf .hint{font-size:12px;color:var(--on-surface-variant)}

/* switch */
.switch{position:relative;display:inline-block;width:52px;height:32px;flex:none}
.switch input{opacity:0;width:0;height:0}
.switch .track{
  position:absolute;inset:0;border-radius:999px;background:var(--surface-container-highest);
  border:2px solid var(--outline);transition:.2s;
}
.switch .track::before{
  content:"";position:absolute;top:50%;inset-inline-start:6px;transform:translateY(-50%);
  width:16px;height:16px;border-radius:50%;background:var(--outline);transition:.2s;
}
.switch input:checked + .track{background:var(--primary);border-color:var(--primary)}
.switch input:checked + .track::before{inset-inline-start:26px;width:22px;height:22px;background:var(--on-primary)}

/* segmented */
.segmented{display:inline-flex;border:1px solid var(--outline-variant);border-radius:999px;overflow:hidden}
.segmented button{
  padding:10px 22px;background:none;border:none;font-weight:700;font-size:14px;
  color:var(--on-surface-variant);display:inline-flex;align-items:center;gap:6px;
}
.segmented button + button{border-inline-start:1px solid var(--outline-variant)}
.segmented button.selected{background:var(--secondary-container);color:var(--on-secondary-container)}
.segmented button .ms{font-size:18px}

/* ---------- Dialog ---------- */
dialog{
  border:none;border-radius:28px;background:var(--surface-container-high);color:var(--on-surface);
  padding:28px;max-width:min(440px,92vw);width:100%;box-shadow:var(--shadow-lg);
  margin:auto;
}
dialog::backdrop{background:var(--scrim)}
dialog h3{font-size:20px;margin-bottom:8px}
dialog p{color:var(--on-surface-variant);font-size:14.5px;margin-bottom:20px}
.dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}

/* ---------- FAB / speed dial ---------- */
.fab-wrap{position:fixed;bottom:28px;inset-inline-end:calc(14px + clamp(18px,4vw,48px));z-index:60;display:flex;flex-direction:column;align-items:flex-start;gap:12px}
.fab{
  width:60px;height:60px;border-radius:18px;border:none;background:var(--primary);
  color:var(--on-primary);display:grid;place-items:center;box-shadow:var(--shadow-lg);
  transition:transform .15s;
}
.fab:hover{transform:scale(1.05)}
.fab .ms{font-size:26px}
.dial{display:none;flex-direction:column;align-items:flex-start;gap:10px}
.fab-wrap.open .dial{display:flex}
.dial a{
  display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:999px;
  background:var(--primary-container);color:var(--on-primary-container);
  font-weight:700;font-size:13.5px;box-shadow:var(--shadow);
}
.dial a .ms{font-size:18px}

/* ---------- Chat ---------- */
.chat-wrap{display:flex;gap:0;flex:1;min-height:0}
.convo-list{width:330px;flex:none;border-inline-start:1px solid var(--outline-variant);padding-inline-start:22px;display:flex;flex-direction:column;gap:10px;overflow-y:auto}
.convo-list h2{font-size:15px;font-weight:700;margin-bottom:8px}
.convo{
  display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:16px;
  background:var(--surface-container-low);
}
.convo:hover{background:var(--surface-container)}
.convo.active{background:var(--secondary-container)}
.convo .body{flex:1;min-width:0}
.convo .t{font-weight:700;font-size:14.5px}
.convo .s{font-size:12.5px;color:var(--on-surface-variant);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.convo .time{font-size:11.5px;color:var(--on-surface-variant);flex:none}
.chat-main{flex:1;min-width:0;display:flex;flex-direction:column;padding-inline-end:22px}
.chat-head{display:flex;align-items:center;gap:12px;padding-bottom:14px}
.chat-head .t{font-weight:700;font-size:17px;flex:1}
.chat-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:14px;padding:18px 4px;min-height:280px}
.msg{max-width:72%;padding:11px 18px;border-radius:20px;font-size:14.5px;line-height:1.65;width:fit-content}
.msg.ai{background:var(--surface-container-high);border-start-start-radius:6px;align-self:flex-start}
.msg.sent{background:var(--bubble-sent);color:var(--on-bubble-sent);border-start-end-radius:6px;align-self:flex-end}
.msg .src{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.msg .src span{font-size:11.5px;font-weight:700;background:var(--surface-container-low);color:var(--on-surface-variant);border:1px solid var(--outline-variant);padding:3px 10px;border-radius:999px}
.chat-suggest{display:flex;gap:8px;flex-wrap:wrap;padding:10px 0}
.chat-inputbar{display:flex;align-items:center;gap:6px;padding-top:10px}
.chat-field{
  flex:1;display:flex;align-items:center;gap:8px;background:var(--surface-container-high);
  border-radius:999px;padding:6px 8px 6px 6px;
}
.chat-field input{flex:1;background:none;border:none;padding:10px 12px;font-size:14.5px;color:var(--on-surface)}
.chat-field input:focus{outline:none}
.send-btn{width:44px;height:44px;border-radius:50%;border:none;background:var(--primary);color:var(--on-primary);display:grid;place-items:center}
.typing{display:inline-flex;gap:5px;padding:6px 2px}
.typing i{width:7px;height:7px;border-radius:50%;background:var(--on-surface-variant);animation:blink 1.2s infinite}
.typing i:nth-child(2){animation-delay:.2s}.typing i:nth-child(3){animation-delay:.4s}
@keyframes blink{0%,80%,100%{opacity:.25}40%{opacity:1}}

/* ---------- Table ---------- */
.table-wrap{overflow-x:auto;border-radius:20px;background:var(--surface-container-low)}
table.mtable{width:100%;border-collapse:collapse;min-width:760px}
.mtable th{
  text-align:start;font-size:13px;color:var(--on-surface-variant);font-weight:700;
  padding:16px 20px;border-bottom:1px solid var(--outline-variant);
}
.mtable td{padding:14px 20px;border-bottom:1px solid var(--outline-variant);font-size:14px;vertical-align:middle}
.mtable tr:last-child td{border-bottom:none}
.mtable tr:hover td{background:var(--hover)}
.student-cell{display:flex;align-items:center;gap:12px;font-weight:700}

/* ---------- Quiz ---------- */
.qcard{background:var(--surface-container-low);border-radius:22px;padding:26px;margin-bottom:18px}
.qcard .qnum{font-size:12.5px;font-weight:700;color:var(--primary);margin-bottom:6px}
.qcard .qtext{font-weight:700;font-size:16.5px;margin-bottom:18px}
.opt{
  display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:14px;
  border:1.5px solid var(--outline-variant);margin-bottom:10px;cursor:pointer;
  transition:background .15s,border-color .15s;font-size:14.5px;
}
.opt:hover{background:var(--hover)}
.opt input{accent-color:var(--primary);width:19px;height:19px;flex:none}
.opt.selected{border-color:var(--primary);background:var(--primary-container);color:var(--on-primary-container);font-weight:600}

/* ---------- Video ---------- */
.player{
  aspect-ratio:16/9;border-radius:24px;background:#171321;position:relative;overflow:hidden;
  display:grid;place-items:center;color:#CFC4E6;
}
.player .play-big{
  width:84px;height:84px;border-radius:50%;background:var(--primary);color:var(--on-primary);
  border:none;display:grid;place-items:center;box-shadow:var(--shadow-lg);
}
.player .play-big .ms{font-size:40px}
.player .vmeta{position:absolute;bottom:18px;inset-inline-start:22px;font-size:13px;color:#CFC4E6}

/* ---------- Upload zone ---------- */
.dropzone{
  border:2px dashed var(--outline-variant);border-radius:20px;padding:36px;
  display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;
  color:var(--on-surface-variant);background:var(--surface-container-low);cursor:pointer;
}
.dropzone:hover{border-color:var(--primary);background:var(--surface-container)}
.dropzone .ms{font-size:38px;color:var(--primary)}

/* ---------- Empty / snackbar ---------- */
.snackbar{
  position:fixed;bottom:26px;inset-inline-start:50%;transform:translateX(50%) translateY(120px);
  background:var(--on-surface);color:var(--surface);padding:13px 24px;border-radius:14px;
  font-size:14px;font-weight:600;box-shadow:var(--shadow-lg);transition:transform .25s;z-index:99;
}
.snackbar.show{transform:translateX(50%) translateY(0)}

/* ---------- Responsive ---------- */
@media (max-width:1180px){
  .grid-3{grid-template-columns:repeat(2,1fr)}
  .tiles{grid-template-columns:repeat(2,1fr)}
  .convo-list{width:270px}
}
@media (max-width:860px){
  .app{flex-direction:column}
  .main{padding:10px;padding-bottom:86px}
  .sheet{border-radius:22px}
  .sidebar{
    position:fixed;bottom:0;top:auto;inset-inline:0;width:100%!important;height:72px;
    flex-direction:row;align-items:center;justify-content:space-around;
    padding:6px 10px;background:var(--surface-container-high);z-index:70;
    box-shadow:0 -2px 14px rgba(20,10,40,.14);
  }
  .sidebar .rail-toggle,.side-footer .profile-item{display:none}
  .sidebar nav{flex-direction:row;flex:1;justify-content:space-around;gap:2px}
  .nav-item{flex-direction:column;gap:3px;padding:7px 12px;font-size:11px;border-radius:16px}
  .side-footer{margin:0}
  .side-footer .nav-item .lbl{display:none}
  .grid-3,.grid-2{grid-template-columns:1fr}
  .convo-list{display:none}
  .chat-main{padding-inline-end:0}
  .msg{max-width:88%}
  .fab-wrap{bottom:92px;inset-inline-end:18px}
  .barlist .brow{grid-template-columns:1fr;gap:6px}
  .barlist .bval{text-align:end;margin-top:-26px}
  .section-head h2{font-size:20px}
  h1.page-title{font-size:23px}
}
@media (max-width:480px){
  .tiles{grid-template-columns:1fr}
  .course-card .row{flex-direction:column;align-items:stretch}
  .thumb{width:100%;height:110px}
}
"""

THEME_BOOT = (
    "(function(){var t=null;try{t=localStorage.getItem('cf-theme')}catch(e){}"
    "if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}"
    "document.documentElement.dataset.theme=t;})();"
)

JS = r"""
var $=function(s,el){return (el||document).querySelector(s)};
var $$=function(s,el){return Array.prototype.slice.call((el||document).querySelectorAll(s))};

/* auto-hide scrollbars when idle */
$$('.page,.chat-scroll,.convo-list').forEach(function(el){
  var t;
  el.addEventListener('scroll',function(){
    el.classList.add('scrolling');
    clearTimeout(t);
    t=setTimeout(function(){el.classList.remove('scrolling')},1000);
  },{passive:true});
});

/* theme */
function syncThemeIcon(){
  var b=$('#themeBtn');if(!b)return;
  b.querySelector('.ms').textContent=document.documentElement.dataset.theme==='dark'?'light_mode':'dark_mode';
}
function setTheme(t){
  document.documentElement.dataset.theme=t;
  try{localStorage.setItem('cf-theme',t)}catch(e){}
  syncThemeIcon();
  $$('.segmented[data-role="theme"] button').forEach(function(x){x.classList.toggle('selected',x.dataset.value===t)});
}
(function(){
  var b=$('#themeBtn');
  if(b)b.addEventListener('click',function(){setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark')});
  syncThemeIcon();
})();

/* sidebar rail */
(function(){
  var sb=$('#sidebar'),tg=$('#railToggle');if(!sb)return;
  try{if(localStorage.getItem('cf-rail')==='1')sb.classList.add('rail')}catch(e){}
  if(tg)tg.addEventListener('click',function(){
    sb.classList.toggle('rail');
    try{localStorage.setItem('cf-rail',sb.classList.contains('rail')?'1':'0')}catch(e){}
  });
})();

/* tabs */
function activateTab(id){
  $$('.tab').forEach(function(t){t.classList.toggle('active',t.dataset.tab===id)});
  $$('.tabpane').forEach(function(p){p.classList.toggle('active',p.id==='pane-'+id)});
}
(function(){
  var tabs=$$('.tab');if(!tabs.length)return;
  tabs.forEach(function(t){t.addEventListener('click',function(){activateTab(t.dataset.tab);history.replaceState(null,'','#'+t.dataset.tab)})});
  var h=location.hash.replace('#','');
  if(h&&$('#pane-'+h))activateTab(h);
})();

/* fab speed dial */
(function(){
  var w=$('#fabWrap');if(!w)return;
  var b=$('.fab',w);
  b.addEventListener('click',function(){
    w.classList.toggle('open');
    b.querySelector('.ms').textContent=w.classList.contains('open')?'close':'smart_toy';
  });
})();

/* dialogs */
$$('[data-open-dialog]').forEach(function(b){
  b.addEventListener('click',function(){var d=document.getElementById(b.dataset.openDialog);if(d)d.showModal()});
});
$$('[data-close-dialog]').forEach(function(b){
  b.addEventListener('click',function(){b.closest('dialog').close()});
});

/* option select highlight */
$$('.opt input').forEach(function(r){
  r.addEventListener('change',function(){
    $$('input[name="'+r.name+'"]').forEach(function(x){x.closest('.opt').classList.toggle('selected',x.checked)});
  });
});

/* snackbar */
function snack(msg){
  var s=$('#snackbar');
  if(!s){s=document.createElement('div');s.id='snackbar';s.className='snackbar';document.body.appendChild(s)}
  s.textContent=msg;s.classList.add('show');
  clearTimeout(s._t);s._t=setTimeout(function(){s.classList.remove('show')},2600);
}
"""

FONT_LINKS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link href="https://fonts.googleapis.com/css2?family=Anton&family=Rubik:wght@400;500;600;700'
    '&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0&display=swap" rel="stylesheet">'
)

NAVS = {
    "student": [
        ("dashboard.html", "home", "الرئيسية"),
        ("courses.html", "menu_book", "دوراتي"),
        ("assistant.html", "smart_toy", "المساعد"),
        ("progress.html", "monitoring", "التقدم"),
    ],
    "teacher": [
        ("teacher-dashboard.html", "home", "الرئيسية"),
        ("teacher-course.html", "menu_book", "إدارة الدورة"),
        ("teacher-students.html", "group", "الطلاب"),
        ("teacher-quizzes.html", "quiz", "الاختبارات"),
    ],
}
PROFILE = {"student": "عبدالله حبسه", "teacher": "أ. محمد عبدالرحمن"}
HOME = {"student": "dashboard.html", "teacher": "teacher-dashboard.html"}


def sidebar_html(role, active):
    items = "".join(
        '<a class="nav-item{a}" href="{h}"><span class="ms{f}">{i}</span><span class="lbl">{l}</span></a>'.format(
            a=" active" if h == active else "", f=" fill" if h == active else "", h=h, i=i, l=l
        )
        for h, i, l in NAVS[role]
    )
    return (
        '<aside class="sidebar" id="sidebar">'
        '<button class="icon-btn rail-toggle" id="railToggle" aria-label="طي القائمة"><span class="ms">menu_open</span></button>'
        "<nav>" + items + "</nav>"
        '<div class="side-footer">'
        '<a class="nav-item profile-item" href="settings.html"><span class="avatar"><span class="ms">person</span></span><span class="lbl">' + PROFILE[role] + "</span></a>"
        '<a class="nav-item logout" href="index.html"><span class="ms">logout</span><span class="lbl">تسجيل الخروج</span></a>'
        "</div></aside>"
    )


def topbar_html(role):
    return (
        '<header class="topbar">'
        '<a class="logo" href="' + HOME[role] + '">COURSEFLIX</a>'
        '<div class="grow"></div>'
        '<button class="icon-btn" id="themeBtn" aria-label="تبديل المظهر"><span class="ms">dark_mode</span></button>'
        '<a class="icon-btn" href="notifications.html" aria-label="الإشعارات"><span class="ms">notifications</span><span class="badge">4</span></a>'
        '<a class="icon-btn" href="settings.html" aria-label="الإعدادات"><span class="ms">settings</span></a>'
        "</header>"
    )


FAB = (
    '<div class="fab-wrap" id="fabWrap">'
    '<div class="dial">'
    '<a href="assistant.html"><span class="ms">forum</span>اسأل المساعد</a>'
    '<a href="assistant.html#summary"><span class="ms">summarize</span>لخص آخر درس</a>'
    '<a href="quiz.html"><span class="ms">quiz</span>اختبار سريع</a>'
    "</div>"
    '<button class="fab" aria-label="المساعد الذكي"><span class="ms">smart_toy</span></button>'
    "</div>"
)


def render(page):
    role = page.get("role", "student")
    bare = role == "bare"
    body = page["body"]
    extra_css = page.get("css", "")
    extra_js = page.get("js", "")
    if bare:
        inner = body
    else:
        inner = (
            '<div class="app">'
            + sidebar_html(role, page.get("active", ""))
            + '<div class="main"><div class="sheet">'
            + topbar_html(role)
            + '<div class="page">' + body + "</div>"
            + "</div></div></div>"
            + (FAB if page.get("fab") else "")
        )
    return (
        "<!DOCTYPE html>\n"
        '<html lang="ar" dir="rtl">\n<head>\n'
        '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        "<title>" + page["title"] + " — CourseFlix</title>\n"
        + FONT_LINKS + "\n"
        "<script>" + THEME_BOOT + "</script>\n"
        "<style>" + CSS + extra_css + "</style>\n"
        '</head>\n<body' + ("" if bare else ' class="shell"') + ">\n" + inner +
        "\n<script>" + JS + extra_js + "</script>\n</body>\n</html>\n"
    )


def main():
    pages = pages_student.PAGES + pages_teacher.PAGES
    for p in pages:
        html = render(p)
        with open(p["file"], "w", encoding="utf-8") as f:
            f.write(html)
        print("built", p["file"], len(html), "bytes")


if __name__ == "__main__":
    main()
