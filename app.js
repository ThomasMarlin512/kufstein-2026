const events=[{id:'festung',photo:"https://presse.kufstein.com/media/zoombilder/weihnachtszauber-festung-kufstein-festungsarena.jpg",photoAlt:"Weihnachtszauber in der Festungsarena Kufstein",photoCredit:"Kufsteinerland",photoSource:"https://presse.kufstein.com/de/winter-im-kufsteinerland-staedtetrip-meets-skiurlaub.html",icon:'🏰',title:'Weihnachtszauber Festung',time:'Sa 13:00–15:30',cost:'6,50 € p. P. ab 10 Personen',desc:'Adventmarkt, historisches Handwerk und Glühwein. Geöffnet 11–19 Uhr; letzter Einlass 18 Uhr.',url:'https://www.festung.kufstein.at/de/weihnachtszauber-auf-der-festung-kufstein-2-1-1-1.html'},{id:'stadtpark',photo:"https://kultur.kufstein.at/feratel/event/large/kufstein-weihnachtsmarkt-im-stadtpark-kufstein-weihnachtsmarkt-stadtpark-2.jpg",photoAlt:"Weihnachtsmarkt im Stadtpark Kufstein",photoCredit:"Kultur Kufstein",photoSource:"https://kultur.kufstein.at/de/kufstein/events/weihnachtsmarkt-im-stadtpark-kufstein.html",icon:'🎄',title:'Weihnachtsmarkt Stadtpark',time:'Sa 16:00–17:30',cost:'Eintritt frei',desc:'Glühwein, Essen, Live-Musik. Samstag 13–20 Uhr.',url:'https://www.kufstein.com/de/kultur/events-tirol/advent-im-kufsteinerland.html'},{id:'auracher',photo:"https://www.kufstein.at/feratel/info/large/kufstein-wirts-und-weinhaus-auracher-loechl-auracher-loechl-restaurant-kaminstube.jpg",photoAlt:"Kaminstube im Restaurant Auracher Löchl",photoCredit:"Kufstein Tourismus",photoSource:"https://www.kufstein.at/de/kufstein/info/wirts-und-weinhaus-auracher-loechl.html",icon:'🍽️',title:'Abendessen Auracher Löchl',time:'Sa 18:30 · Alternative',cost:'Nach Karte, nicht bestätigt',desc:'Tiroler Wirtshaus in der Römerhofgasse. Samstag 12–23 Uhr; Gruppentisch anfragen.',url:'https://www.auracher-loechl.at/'},{id:'braeu',photo:"https://api.braeustueberl-kufstein.at/fileadmin/_processed_/e/e/csm_braeustueberlsaal-8-kufstein-tirol-austria_b1b34962bb.jpg",photoAlt:"Bräustüberl-Saal in Kufstein",photoCredit:"Bräustüberl Kufstein",photoSource:"https://www.braeustueberl-kufstein.at/braeustueberl-saal",icon:'🍺',title:'Abendessen Bräustüberl',time:'Sa 18:30 · Alternative',cost:'Nach Karte, nicht bestätigt',desc:'Gemütliche Alternative fürs gemeinsame Abendessen. Verfügbarkeit für 13 Personen anfragen.',url:'https://www.google.com/maps/search/?api=1&query=Br%C3%A4ust%C3%BCberl+Kufstein'},{id:'stollen',photo:"https://www.kufstein.com/feratel/info/large/kufstein-stollen-1930-gin-bar-stollen-1930-gin-bar-kufstein-innen.jpg",photoAlt:"Innenansicht der Gin-Bar Stollen 1930 in Kufstein",photoCredit:"Kufsteinerland",photoSource:"https://www.kufstein.com/en/kufstein/info/stollen-1930-gin-bar.html",icon:'🍸',title:'Stollen 1930 – Gin-Bar',time:'Sa ab 21:00',cost:'Getränke nach Karte',desc:'Speakeasy-Bar im Festungsberg, täglich 18–02 Uhr, Eintritt ab 21 Jahren. Gruppenbereich anfragen.',url:'https://www.auracher-loechl.at/stollen1930'},{id:'pure',photo:"https://static.wixstatic.com/media/31cd5a_9831a5e1d07f4537908827bcaef247db~mv2.jpg/v1/fill/w_640%2Ch_660%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/31cd5a_9831a5e1d07f4537908827bcaef247db~mv2.jpg",photoAlt:"Barbereich der PURE Lounge in Kufstein",photoCredit:"PURE Lounge",photoSource:"https://www.purelounge-club.at/",icon:'🎉',title:'PURE Lounge',time:'Sa ab 21:00 · Alternative',cost:'Eintritt / Mindestumsatz erfragen',desc:'Cocktails und Party; Samstagsöffnung laut Eintrag bis 02 Uhr. Programm am 28.11. noch nicht bestätigt.',url:'https://www.purelounge-club.at/'},{id:'walk',photo:"https://blog.kufstein.com/media/titelbilder/hd-roemerhofgasse-altstadt-kufstein.jpg",photoAlt:"Römerhofgasse in der Kufsteiner Altstadt",photoCredit:"Kufsteinerland",photoSource:"https://blog.kufstein.com/de/shoppingtour-mit-der-extraportion-erlebnis.html",icon:'☕',title:'Sonntag Altstadt & Kaffee',time:'So 11:00–12:30',cost:'Individuell',desc:'Gemütlicher Ausklang vor der Heimfahrt.',url:'https://www.kufstein.com/'}];const key='kufstein_votes_v3';let state=JSON.parse(localStorage.getItem(key)||'{}');document.getElementById('person').value=state.name||'';document.getElementById('person').addEventListener('input',e=>{state.name=e.target.value;save()});function save(){localStorage.setItem(key,JSON.stringify(state))}const SUPABASE_URL='https://rzzipqdozabuxrmoxhlw.supabase.co';
const SUPABASE_KEY='sb_publishable_4MsQNsSWj2VXmONSNim-zg__T2QeLV0';
let sb=null, authUser=null, liveCounts={}, liveError='', namedVotes={}, members={}, groupJoined=false;
async function initLive(){
 try{
  if(!window.supabase?.createClient) throw Error('Supabase-Bibliothek nicht geladen');
  sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  let {data:{session},error:se}=await sb.auth.getSession();if(se)throw se;
  if(!session){let result=await sb.auth.signInAnonymously();if(result.error)throw result.error;session=result.data.session}
  authUser=session?.user;if(!authUser)throw Error('Anmeldung nicht möglich');
  const membership=await sb.from('group_members').select('display_name').eq('user_id',authUser.id).maybeSingle();
  if(membership.error)throw membership.error;
  groupJoined=!!membership.data;
  if(!groupJoined){showJoin();return}
  document.body.classList.add('member-ready');
  document.getElementById('person').value=membership.data.display_name;
  state.name=membership.data.display_name;save();
  const own=await sb.from('votes').select('activity_id,choice').eq('user_id',authUser.id);
  if(own.error)throw own.error;
  for(const x of own.data||[])state[x.activity_id]=x.choice;
  save();await refreshVotes();
  setInterval(refreshVotes,15000);
 }catch(e){liveError=e.message||String(e);console.error('Kufstein Live Voting:',e);showLiveError(liveError);render()}
}
function showLiveError(message){
 let el=document.getElementById('live-error');
 if(!el){el=document.createElement('section');el.id='live-error';el.className='card';el.style='max-width:900px;margin:20px auto;padding:20px;border:2px solid #f59e0b';document.body.prepend(el)}
 el.innerHTML='<h2>⚠️ Live-Verbindung fehlgeschlagen</h2><p id="live-error-detail"></p><button onclick="location.reload()">Erneut verbinden</button>';
 document.getElementById('live-error-detail').textContent=message;
}
async function refreshVotes(){
 if(!sb||!authUser)return;
 if(!groupJoined)return;
 const [r,people]=await Promise.all([sb.from('votes').select('user_id,activity_id,choice'),sb.from('group_members').select('user_id,display_name')]);
 if(people.error){liveError=people.error.message;showLiveError(liveError);render();return}
 members=Object.fromEntries((people.data||[]).map(x=>[x.user_id,x.display_name]));namedVotes={};
 if(r.error){liveError=r.error.message;showLiveError(liveError);render();return}
 liveError='';liveCounts={};
 for(const x of r.data||[]){let c=liveCounts[x.activity_id]||(liveCounts[x.activity_id]={yes:0,maybe:0,no:0});if(c[x.choice]!==undefined)c[x.choice]++;(namedVotes[x.activity_id]||(namedVotes[x.activity_id]=[])).push({name:members[x.user_id]||'Unbekannt',choice:x.choice})}
 render();await refreshTasks();
}
async function vote(id,v){
 if(!sb||!authUser||!groupJoined){alert('Live-Verbindung noch nicht bereit. Bitte kurz warten oder Seite neu laden. '+liveError);return}
 const result=await sb.from('votes').upsert({user_id:authUser.id,activity_id:id,choice:v,updated_at:new Date().toISOString()},{onConflict:'user_id,activity_id'});
 if(result.error){alert('Stimme nicht gespeichert: '+result.error.message);return}
 state[id]=v;save();await refreshVotes();
}function voteOverview(e){const rows=namedVotes[e.id]||[];const groups=[['yes','👍 Ja'],['maybe','🤔 Vielleicht'],['no','👎 Nein']];return '<div class="vote-overview">'+groups.map(([v,label])=>{const names=rows.filter(x=>x.choice===v).map(x=>escapeText(x.name));const pct=rows.length?Math.round(names.length/rows.length*100):0;return '<div class="vote-group '+v+'"><b>'+label+' <span>'+names.length+' · '+pct+'%</span></b><div class="vote-track"><div class="vote-fill" style="width:'+pct+'%"></div></div><div class="vote-names">'+(names.length?names.map(n=>'<span class="vote-name">'+n+'</span>').join(''):'<span class="vote-empty">Noch niemand</span>')+'</div></div>'}).join('')+'</div>'}
function render(){document.getElementById('cards').innerHTML=events.map(e=>`<article class="card"><img class="photo" src="${e.photo}" alt="${escapeText(e.photoAlt)}" loading="lazy"><div class="card-content"><span class="pill">${e.time}</span><h3>${e.icon} ${e.title}</h3><p class="price">${e.cost}</p><p>${e.desc}</p><a href="${e.url}" target="_blank" rel="noopener">Weitere Infos ↗</a><div class="vote">${[['yes','👍 Ja'],['maybe','🤔 Vielleicht'],['no','👎 Nein']].map(([v,label])=>`<button class="${state[e.id]===v?'selected':''}" onclick="vote('${e.id}','${v}')">${label}</button>`).join('')}</div><small>${state[e.id]?'Deine Stimme: '+({yes:'Ja',maybe:'Vielleicht',no:'Nein'}[state[e.id]]):'Noch nicht abgestimmt'} · Live: 👍 ${(liveCounts[e.id]||{}).yes||0} · 🤔 ${(liveCounts[e.id]||{}).maybe||0} · 👎 ${(liveCounts[e.id]||{}).no||0}</small><details class="vote-details"><summary>📊 Abstimmung ansehen</summary>${voteOverview(e)}</details><div class="photo-caption">Foto: <a href="${escapeText(e.photoSource)}" target="_blank" rel="noopener noreferrer">${escapeText(e.photoCredit)}</a></div></div></article>`).join('')}function escapeText(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function showJoin(){
 let el=document.getElementById('group-join');if(!el){
 el=document.createElement('section');el.id='group-join';el.className='card';
 el.style='position:fixed;inset:0;z-index:99999;max-width:none;margin:0;padding:24px;background:rgba(2,13,27,.97);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;overflow:auto';
 document.body.append(el)}
 el.innerHTML='<h2>🔐 Gruppenbeitritt</h2><p>Für namentliche Abstimmungen: Namen und Gruppencode eingeben. Dein Name wird den anderen Gruppenmitgliedern angezeigt.</p><input id="join-name" maxlength="50" placeholder="Dein Name" value="'+escapeText(state.name||'')+'"><input id="join-code" type="password" placeholder="Gruppencode" style="margin:8px"><button id="join-button">Gruppe beitreten</button><p id="join-status"></p>';
 document.getElementById('join-button').onclick=joinGroup;
}
async function joinGroup(){
 const name=document.getElementById('join-name').value.trim(),code=document.getElementById('join-code').value;
 const b=document.getElementById('join-button');b.disabled=true;
 const r=await sb.rpc('join_kufstein_group',{p_code:code,p_name:name});
 b.disabled=false;
 if(r.error){document.getElementById('join-status').textContent=r.error.message;return}
 groupJoined=true;document.body.classList.add('member-ready');state.name=name;save();document.getElementById('person').value=name;
 document.getElementById('group-join').remove();
 await refreshVotes();
 const own=await sb.from('votes').select('activity_id,choice').eq('user_id',authUser.id);
 if(!own.error){for(const x of own.data||[])state[x.activity_id]=x.choice;save();render()}
 setInterval(refreshVotes,15000);
}
function summary(){return 'Kufstein 28.–29.11.2026 – Abstimmung von '+(state.name||'Unbekannt')+'\n'+events.map(e=>e.title+': '+({yes:'Ja',maybe:'Vielleicht',no:'Nein'}[state[e.id]]||'Offen')).join('\n')}async function exportVote(){const t=summary();try{await navigator.clipboard.writeText(t);document.getElementById('status').textContent='Abstimmung kopiert!'}catch{prompt('Text kopieren:',t)}}function sharePage(){const u=location.protocol==='file:'?'':location.href;if(!u){alert('Bitte die Webseite zuerst online veröffentlichen, damit du einen Link teilen kannst.');return}if(navigator.share){navigator.share({title:'Kufstein 2026',url:u}).catch(()=>{})}else{navigator.clipboard.writeText(u).then(()=>alert('Link kopiert')).catch(()=>prompt('Link:',u))}}function shareCarpool(){window.open('https://wa.me/?text='+encodeURIComponent('Kufstein 28.11.: Wann fahren wir los und wo treffen sich unsere Fahrgemeinschaften?'),'_blank')}function addIdea(){let x=document.getElementById('idea').value.trim();if(!x)return;let a=JSON.parse(localStorage.getItem('kufstein_ideas_v3')||'[]');a.push(x);localStorage.setItem('kufstein_ideas_v3',JSON.stringify(a));document.getElementById('idea').value='';renderIdeas()}function renderIdeas(){if(!document.getElementById('ideas'))return;document.getElementById('ideas').innerHTML=JSON.parse(localStorage.getItem('kufstein_ideas_v3')||'[]').map(x=>'<li>'+x.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"\'":'&#39;'}[c]||c))+'</li>').join('')}function shareIdea(){let x=document.getElementById('idea').value.trim();if(x)window.open('https://wa.me/?text='+encodeURIComponent('Kufstein 2026 – Idee: '+x),'_blank')}function shareWhatsApp(){window.open('https://wa.me/?text='+encodeURIComponent(summary()),'_blank')}
let taskRows=[],taskBusy=false;
async function refreshTasks(){
 const list=document.getElementById('task-list');
 if(!list||!sb||!authUser||!groupJoined)return;
 try{
  const r=await sb.from('organization_tasks').select('id,label,completed,completed_by_name,updated_at').order('position');
  if(r.error)throw r.error;
  taskRows=r.data||[];renderTasks();
  document.getElementById('task-status').textContent='';
 }catch(e){document.getElementById('task-status').textContent='Aufgaben konnten nicht geladen werden: '+(e.message||String(e));}
}
function renderTasks(){
 const list=document.getElementById('task-list');if(!list)return;
 list.innerHTML=taskRows.map((t,i)=>'<label class="task-row"><input type="checkbox" data-task-index="'+i+'" '+(t.completed?'checked ':'')+(taskBusy?'disabled ':'')+'><span><span class="task-label">'+escapeText(t.label)+'</span><small>'+(t.completed?'✓ Erledigt von '+escapeText(t.completed_by_name||'Gruppenmitglied'):'Noch offen')+'</small></span></label>').join('');
 for(const input of list.querySelectorAll('input'))input.addEventListener('change',()=>setTask(Number(input.dataset.taskIndex),input.checked));
}
async function setTask(index,completed){
 if(taskBusy||!sb||!authUser||!groupJoined){renderTasks();return;}
 const task=taskRows[index];if(!task){renderTasks();return;}
 taskBusy=true;renderTasks();document.getElementById('task-status').textContent='Wird gespeichert …';
 try{
  const r=await sb.rpc('set_organization_task',{p_id:task.id,p_completed:completed});
  if(r.error)throw r.error;
  taskBusy=false;await refreshTasks();
 }catch(e){taskBusy=false;renderTasks();document.getElementById('task-status').textContent='Nicht gespeichert: '+(e.message||String(e));}
}

render();renderIdeas();initLive();