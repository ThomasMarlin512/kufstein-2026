import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
for(const name of ['index.html','app.js']){
 const s=fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
 const action=s.slice(s.indexOf('async function deleteActivity('),s.indexOf('async function vote('));
 const render=s.slice(s.indexOf('function render(){'),s.indexOf('function showJoin('));
 function setup({allowed=true,confirmed=true,error=null}={}){
  const nodes={cards:{innerHTML:'',querySelectorAll(){return[];}},status:{textContent:''}},calls=[];
  const chain={insert(row){calls.push(row);return this;},select(){return this;},async single(){return error?{error}:{data:{activity_id:'festung'}};}};
  const context={events:[{id:'festung',title:'Fixture <activity>',photo:'https://example.invalid/a.jpg',photoAlt:'Test',photoCredit:'Test',photoSource:'https://example.invalid',time:'',cost:'',desc:'',url:'https://example.invalid'}],state:{},removedActivityIds:new Set(),canDeleteActivities:allowed,kufDeleteBusy:false,authUser:{id:'admin-fixture'},groupJoined:true,sb:{from(table){assert.equal(table,'trip_activity_removals');return chain;}},confirm(){return confirmed;},save(){},document:{getElementById:id=>nodes[id]},window:{},liveCounts:{},voteOverview:()=>''};
  vm.createContext(context);vm.runInContext(render+action,context);return {context,nodes,calls};
 }
 let t=setup({allowed:false});t.context.render();assert(!t.nodes.cards.innerHTML.includes('activity-delete'));await t.context.deleteActivity('festung');assert.equal(t.calls.length,0);
 t=setup({confirmed:false});await t.context.deleteActivity('festung');assert.equal(t.calls.length,0);assert.equal(t.context.removedActivityIds.size,0);
 t=setup();t.context.render();assert(t.nodes.cards.innerHTML.includes('activity-delete'));assert(t.nodes.cards.innerHTML.includes('Aktivität löschen: Fixture &lt;activity&gt;'));await t.context.deleteActivity('festung');assert(t.context.removedActivityIds.has('festung'));assert(t.nodes.cards.innerHTML.includes('Keine Aktivitäten'));assert.equal(t.calls[0].site_id,'kufstein-2026');assert.equal(t.calls[0].activity_id,'festung');assert.equal(t.context.kufDeleteBusy,false);
 t=setup({error:{message:'denied'}});await t.context.deleteActivity('festung');assert.equal(t.context.removedActivityIds.size,0);assert(t.nodes.cards.innerHTML.includes('activity-delete'));assert(t.nodes.status.textContent.includes('denied'));
}
console.log('PASS: Kufstein deletion is admin-only, requires confirmation, persists removal, keeps cards on failure and handles empty list');
