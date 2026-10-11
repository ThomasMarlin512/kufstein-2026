import {fillTripDaySelect,tripDays,validateActivitySchedule} from '/geiladachtzger/activity-schedule.js?v=activity-fields-20261011-1';

const safeLink=value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}};
export function createActivityEditor({client,items,onChange,canEdit}){
 const records=new Map();
 let trip={id:'kufstein-2026',start_date:'2026-11-28',end_date:'2026-11-29'},active=null,busy=false,loading=null;
 const dialog=document.createElement('dialog');dialog.className='text-edit-dialog activity-edit-dialog';dialog.setAttribute('aria-labelledby','activity-edit-heading');
 dialog.innerHTML=`<form><h2 id="activity-edit-heading">Aktivität bearbeiten</h2>
 <label for="activity-title">Titel</label><input id="activity-title" minlength="2" maxlength="100" required>
 <label for="activity-day">Tag</label><select id="activity-day" aria-describedby="activity-day-hint"></select><p id="activity-day-hint" class="muted"></p>
 <div class="activity-time-fields"><div><label for="activity-start">Von</label><input id="activity-start" type="time"></div><div><label for="activity-end">Bis</label><input id="activity-end" type="time"></div></div>
 <label class="activity-next-day"><input id="activity-next-day" type="checkbox"> Ende am nächsten Tag</label>
 <label for="activity-url">Link</label><input id="activity-url" type="url" maxlength="2048" placeholder="https://" pattern="https://.*">
 <label for="activity-description">Beschreibung</label><textarea id="activity-description" maxlength="1500" rows="4"></textarea>
 <label for="activity-hint">Zeit / Hinweis (optional)</label><input id="activity-hint" maxlength="1000" placeholder="z. B. Alternative oder Treffpunkt">
 <p role="alert"></p><div class="edit-actions"><button type="submit">Speichern</button><button type="button" data-cancel class="secondary">Abbrechen</button></div></form>`;
 document.body.append(dialog);
 const field=name=>dialog.querySelector('#activity-'+name),error=dialog.querySelector('[role=alert]'),status=document.getElementById('text-editor-status');
 function ownsField(key){return [...records.keys()].some(id=>key==='activity-'+id+'-time'||key==='activity-'+id+'-description');}
 function label(row){
  const day=tripDays(trip).days.find(d=>d.value===row.day_number)?.label;
  const start=row.start_time?.slice(0,5),end=row.end_time?.slice(0,5);
  const time=start?(end?start+'–'+end:'ab '+start)+' Uhr'+(row.ends_next_day?' (+1 Tag)':''):'';
  return [day,time,row.time_label].filter(Boolean).join(' · ')||'Tag und Uhrzeit noch offen';
 }
 function apply(row){
  const item=items.find(item=>item.id===row.activity_id);if(!item)return;
  item.title=row.title;item.desc=row.description;item.url=safeLink(row.website_url);item.time=label(row);
 }
 function refresh(){
  const allowed=canEdit()&&document.body.classList.contains('is-editing');
  document.querySelectorAll('[data-activity-id]').forEach(card=>{
   const id=card.dataset.activityId,row=records.get(id);card.querySelectorAll('[data-activity-edit]').forEach(b=>b.remove());
   if(!row||!allowed)return;
   const button=document.createElement('button');button.type='button';button.className='activity-edit';button.dataset.activityEdit=id;
   button.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15l-1 6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Aktivität bearbeiten</span>';
   button.setAttribute('aria-label','Aktivität bearbeiten: '+row.title);button.addEventListener('click',()=>open(id));
   card.querySelector('.card-content')?.prepend(button);
  });
  if(!canEdit()&&dialog.open&&!busy)dialog.close();
 }
 async function load(){
  if(loading)return loading;
  loading=(async()=>{
   try{
    const [details,dates]=await Promise.all([client.from('trip_activity_details').select('*').eq('site_id','kufstein-2026'),client.from('group_events').select('id,start_date,end_date').eq('id','kufstein-2026').maybeSingle()]);
    if(details.error)throw details.error;
    if(!dates.error&&dates.data?.start_date&&dates.data?.end_date)trip=dates.data;
    records.clear();for(const row of details.data||[]){records.set(row.activity_id,row);apply(row);}onChange();
   }catch(e){if(status)status.textContent='Aktivitätsfelder konnten nicht geladen werden. Bitte die Seite neu laden.';}
   finally{loading=null;}
  })();return loading;
 }
 function open(id){
  if(busy||!canEdit()||!document.body.classList.contains('is-editing')||!records.has(id))return;
  active={...records.get(id)};error.textContent='';
  field('title').value=active.title;field('url').value=active.website_url;field('description').value=active.description;field('hint').value=active.time_label;
  field('day-hint').textContent=fillTripDaySelect(field('day'),trip,[],active.day_number);
  field('start').value=active.start_time?.slice(0,5)||'';field('end').value=active.end_time?.slice(0,5)||'';field('next-day').checked=active.ends_next_day;
  dialog.showModal();field('title').focus();
 }
 dialog.querySelector('form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!active||!canEdit())return;
  busy=true;error.textContent='';dialog.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=true);
  try{
   const title=field('title').value.trim(),rawUrl=field('url').value.trim(),website_url=safeLink(rawUrl);
   if(title.length<2||title.length>100)throw Error('Der Titel muss 2 bis 100 Zeichen lang sein.');
   if(rawUrl&&!website_url)throw Error('Bitte einen gültigen HTTPS-Link ohne Zugangsdaten eingeben.');
   const schedule=validateActivitySchedule({day_number:field('day').value,start_time:field('start').value,end_time:field('end').value,ends_next_day:field('next-day').checked},trip);
   const patch={title,website_url,description:field('description').value.trim(),time_label:field('hint').value.trim(),...schedule};
   const result=await client.rpc('save_kufstein_activity',{p_activity_id:active.activity_id,p_patch:patch,p_revision:active.revision});
   if(result.error)throw result.error;
   records.set(active.activity_id,result.data);apply(result.data);onChange();dialog.close();if(status)status.textContent='Aktivität gespeichert – für alle sichtbar.';
  }catch(e){error.textContent='Nicht gespeichert: '+(e.message||String(e));}
  finally{busy=false;dialog.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=false);}
 });
 dialog.querySelector('[data-cancel]').addEventListener('click',()=>{if(!busy)dialog.close();});
 dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
 dialog.addEventListener('close',()=>{document.querySelector('[data-activity-edit="'+active?.activity_id+'"]')?.focus();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!dialog.open)load();});
 return {load,refresh,ownsField,isBusy:()=>busy,isOpen:()=>dialog.open};
}
