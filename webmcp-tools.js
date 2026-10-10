import {choiceSchema,idSchema,schema,fail,rows,requireMember,installTools,savedResult} from './webmcp-core.js';

// The existing classic page script owns the client, session and displayed data.
async function member() {return requireMember(sb,authUser?.id,groupJoined);}
let writeBusy=false;
async function write(action) {
 if(writeBusy || taskBusy || (typeof attendanceBusy!=='undefined'&&attendanceBusy))fail('BUSY','Auf der Website läuft bereits eine Änderung.');
 writeBusy=true;
 try {return await action(await member());}
 finally {writeBusy=false;}
}
function mainUrl(hash='') {return new URL('index.html'+hash,location.href).href;}
function assertActivity(id) {if(!events.some(e=>e.id===id))fail('NOT_FOUND','Aktivität nicht gefunden.');}
async function loadVotes(current) {
 const [votes,people]=await Promise.all([
  rows(sb.from('votes').select('user_id,activity_id,choice')),
  rows(sb.from('group_members').select('user_id,display_name'))
 ]);
 members=Object.fromEntries(people.map(p=>[p.user_id,p.display_name]));namedVotes={};liveCounts={};
 for(const event of events)delete state[event.id];
 for(const vote of votes) {
  const counts=liveCounts[vote.activity_id]||(liveCounts[vote.activity_id]={yes:0,maybe:0,no:0});
  if(Object.hasOwn(counts,vote.choice))counts[vote.choice]++;
  (namedVotes[vote.activity_id]||(namedVotes[vote.activity_id]=[])).push({name:members[vote.user_id]||'Gruppenmitglied',choice:vote.choice});
  if(vote.user_id===current.id)state[vote.activity_id]=vote.choice;
 }
 render();
 try {save();}catch {/* Live data remains valid when local storage is unavailable. */}
 return events.map(e=>({id:e.id,title:e.title,time:e.time,cost:e.cost,description:e.desc,url:e.url,
  my_vote:state[e.id]||null,counts:liveCounts[e.id]||{yes:0,maybe:0,no:0},votes:namedVotes[e.id]||[]}));
}
async function loadParticipants(current) {
 const [people,attendance,roster]=await Promise.all([
  rows(sb.from('group_members').select('user_id,display_name')),
  rows(sb.from('trip_attendance').select('user_id,status,roster_key')),
  rows(sb.from('group_people').select('member_key,full_name'))
 ]);
 const used=new Set();
 function participant(name,person) {
  const entry=attendance.find(a=>a.user_id===person?.user_id);
  if(person)used.add(person.user_id);
  return {name,nickname:person?.display_name||null,status:entry?.status||'yes',source:entry?'recorded':'default',is_me:person?.user_id===current.id};
 }
 const participants=roster.map(p=>{
  const account=attendance.find(a=>a.roster_key===p.member_key);
  return participant(p.full_name,people.find(m=>m.user_id===account?.user_id));
 });
 for(const person of people)if(!used.has(person.user_id))participants.push(participant(person.display_name,person));
 if(typeof renderParticipantList==='function') {
  tripRoster=roster.map(p=>({user_id:p.member_key,full_name:p.full_name}));
  renderParticipantList(people,attendance);
 }
 return participants.sort((a,b)=>a.name.localeCompare(b.name,'de'));
}
async function loadTasks() {
 taskRows=await rows(sb.from('organization_tasks').select('id,label,completed,completed_by_name,updated_at').order('position'));
 renderTasks();return taskRows.map(t=>({id:t.id,label:t.label,completed:t.completed,completed_by:t.completed_by_name,updated_at:t.updated_at}));
}
const tools=[
 {name:'kufstein_get_activities',title:'Aktivitäten und Abstimmungen lesen',description:'Liest aktuelle Aktivitäten, Preise laut Reiseplanung, eigene Stimmen und namentliche Gruppenabstimmungen. Keine neuen externen Preisabfragen.',inputSchema:schema(),
  async run(){const current=await member();return {activities:await loadVotes(current)};}},
 {name:'kufstein_get_participants',title:'Reiseteilnahme lesen',description:'Liest die Reisegruppe und Teilnahmestatus. source=default ist eine Voreinstellung, keine persönliche Zusage. source=recorded bedeutet gespeicherter Stand.',inputSchema:schema(),
  async run(){const current=await member();return {participants:await loadParticipants(current)};}},
 {name:'kufstein_vote_activity',title:'Eigene Aktivitätsstimme speichern',description:'Speichert die eigene Stimme des angemeldeten Mitglieds für eine Kufstein-Aktivität. yes, maybe oder no. Überschreibt eine vorhandene eigene Stimme.',write:true,inputSchema:schema({activity_id:idSchema,choice:choiceSchema},['activity_id','choice']),
  run({activity_id,choice}) {assertActivity(activity_id);return write(async current=>{
   const saved=await rows(sb.from('votes').upsert({user_id:current.id,activity_id,choice,updated_at:new Date().toISOString()},{onConflict:'user_id,activity_id'}).select('choice').single());
   if(saved?.choice!==choice)fail('SAVE_NOT_CONFIRMED','Speicherung nicht bestätigt. Bitte den aktuellen Stand prüfen.');
   return savedResult({activity_id,choice},()=>loadVotes(current));
  });}},
 {name:'kufstein_set_my_attendance',title:'Eigene Reiseteilnahme speichern',description:'Speichert ausschließlich die eigene Teilnahme an Kufstein 2026: yes = dabei, maybe = unsicher, no = nicht dabei.',write:true,inputSchema:schema({status:choiceSchema},['status']),
  run({status}) {return write(async current=>{
   const saved=await rows(sb.from('trip_attendance').update({status}).eq('user_id',current.id).select('status').single());
   if(saved?.status!==status)fail('SAVE_NOT_CONFIRMED','Speicherung nicht bestätigt. Bitte den aktuellen Stand prüfen.');
   return savedResult({attendance:status},()=>loadParticipants(current));
  });}}
];
// Only expose the full programme and organisation actions where their UI is present.
if(document.getElementById('programm')) tools.push({
 name:'kufstein_get_trip_plan',title:'Reiseprogramm lesen',description:'Liest das bestehende Reiseprogramm, Hotel, Anreise und Reservierungsstand aus der angezeigten Reiseplanung. Prüft keine externen Buchungen oder Fahrpläne.',inputSchema:schema(),
 async run() {
  await member();
  const sections={};
  for(const id of ['programm','hotel','anreise','restaurantstatus','hotelwege']) {
   const section=document.getElementById(id);
   if(section)sections[id]=Array.from(section.querySelectorAll('h2,h3,p,small')).map(p=>p.textContent.trim()).filter(Boolean);
  }
  return {title:'Kufstein 2026',start_date:'2026-11-28',end_date:'2026-11-29',timezone:'Europe/Vienna',sections,
   links:{home:mainUrl(),votes:new URL('abstimmung.html',location.href).href,photos:new URL('fotos.html',location.href).href}};
 }
});
if(document.getElementById('task-list')) tools.push(
 {name:'kufstein_get_tasks',title:'Organisationsaufgaben lesen',description:'Liest die gemeinsamen Organisationsaufgaben und ihren aktuellen Erledigungsstand.',inputSchema:schema(),
  async run(){await member();return {tasks:await loadTasks()};}},
 {name:'kufstein_set_task_completed',title:'Gemeinsamen Aufgabenstatus speichern',description:'Markiert eine vorhandene gemeinsame Organisationsaufgabe als erledigt oder offen. Verändert den Gruppenstand, keine Buchung und keine Nachricht.',write:true,inputSchema:schema({task_id:idSchema,completed:{type:'boolean'}},['task_id','completed']),
  run({task_id,completed}) {return write(async()=>{
   const task=await rows(sb.from('organization_tasks').select('id').eq('id',task_id).maybeSingle());
   if(!task)fail('NOT_FOUND','Aufgabe nicht gefunden.');
   await rows(sb.rpc('set_organization_task',{p_id:task_id,p_completed:completed}));
   const saved=await rows(sb.from('organization_tasks').select('completed').eq('id',task_id).single());
   if(saved?.completed!==completed)fail('SAVE_NOT_CONFIRMED','Speicherung nicht bestätigt. Bitte den aktuellen Stand prüfen.');
   return savedResult({task_id,completed},loadTasks);
  });}}
);
installTools(tools);
