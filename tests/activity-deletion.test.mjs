import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
for(const name of ['index.html','app.js']){
 const source=fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
 const action=source.slice(source.indexOf('function activityDeleteDialog('),source.indexOf('async function vote('));
 const render=source.slice(source.indexOf('function render(){'),source.indexOf('function showJoin('));
 function setup({allowed=true,error=null}={}){
  const nodes={cards:{innerHTML:'',querySelectorAll(){return[];}},'activity-status':{textContent:''},'activity-delete-heading':{textContent:''},'activity-delete-error':{textContent:''},'cancel-activity-delete':{disabled:false,focus(){this.focused=true;}},submit:{disabled:false},'activity-delete-dialog':{open:false,showModal(){this.open=true;},close(){this.open=false;}},'activity-delete-form':{querySelectorAll(){return[nodes['cancel-activity-delete'],nodes.submit];}}},calls=[];
  const chain={insert(row){calls.push(row);return this;},select(){return this;},async single(){return error?{error}:{data:{activity_id:'festung'}};}};
  const context={events:[{id:'festung',title:'Fixture <activity>',photo:'https://example.invalid/a.jpg',photoAlt:'Test',photoCredit:'Test',photoSource:'https://example.invalid',time:'',cost:'',desc:'',url:'https://example.invalid'}],state:{},removedActivityIds:new Set(),canDeleteActivities:allowed,kufDeleteBusy:false,pendingActivityDelete:null,authUser:{id:'admin-fixture'},groupJoined:true,sb:{from(table){assert.equal(table,'trip_activity_removals');return chain;}},save(){},document:{getElementById:id=>nodes[id]},window:{},liveCounts:{},voteOverview:()=>''};
  vm.createContext(context);vm.runInContext(render+action,context);return{context,nodes,calls};
 }
 const event={preventDefault(){}};
 let t=setup({allowed:false});t.context.render();assert(!t.nodes.cards.innerHTML.includes('activity-delete'));t.context.deleteActivity('festung');assert.equal(t.nodes['activity-delete-dialog'].open,false);assert.equal(t.calls.length,0);
 t=setup();t.context.deleteActivity('festung');assert.equal(t.nodes['activity-delete-dialog'].open,true);assert.equal(t.nodes['cancel-activity-delete'].focused,true);assert.equal(t.nodes['activity-delete-heading'].textContent,'„Fixture <activity>“ entfernen?');assert.equal(t.calls.length,0,'Opening modal must not remove data');
 t.nodes['activity-delete-dialog'].close();assert.equal(t.context.removedActivityIds.size,0,'Cancel preserves activity');
 t.context.deleteActivity('festung');await t.context.confirmActivityDeletion(event);assert.equal(t.nodes['activity-delete-dialog'].open,false);assert(t.context.removedActivityIds.has('festung'));assert(t.nodes.cards.innerHTML.includes('Keine Aktivitäten'));assert(t.nodes['activity-status'].textContent.includes('entfernt'));assert.equal(t.calls[0].site_id,'kufstein-2026');assert.equal(t.calls[0].activity_id,'festung');assert.equal(t.context.kufDeleteBusy,false);
 t=setup({error:{message:'denied'}});t.context.deleteActivity('festung');await t.context.confirmActivityDeletion(event);assert.equal(t.context.removedActivityIds.size,0);assert(t.nodes['activity-delete-dialog'].open);assert(t.nodes['activity-delete-error'].textContent.includes('denied'));assert.equal(t.nodes.submit.disabled,false);
 t=setup();t.context.deleteActivity('festung');t.context.canDeleteActivities=false;await t.context.confirmActivityDeletion(event);assert.equal(t.calls.length,0,'Recheck permission on confirmation');
 t=setup({error:{code:'23505',message:'already removed'}});t.context.deleteActivity('festung');await t.context.confirmActivityDeletion(event);assert(t.context.removedActivityIds.has('festung'),'Concurrent removal converges');
 assert(!action.includes('confirm('),'Use in-page modal, not native browser confirm');
 assert(render.includes('data-delete-activity')&&render.includes("addEventListener('click'"),'Buttons use bound handlers');
}
console.log('PASS: in-page confirmation, cancel, permission checks, scoped removal, visible errors, double-removal and success feedback');
