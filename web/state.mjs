export const clearState = () => ({provider:'',category:'',query:'',tags:[]});
export function selectProvider(state,provider){return {...clearState(),...state,provider,category:''};}
export function toggleTag(state,tag){const tags=state.tags||[];return {...state,tags:tags.includes(tag)?tags.filter(t=>t!==tag):[...tags,tag]};}
export function normalizeState(value,skills){
 const input=value&&typeof value==='object'?value:{};
 const provider=typeof input.provider==='string'&&skills.some(s=>s.provider===input.provider)?input.provider:'';
 const category=provider&&skills.some(s=>s.provider===provider&&s.category===input.category)?input.category:'';
 const known=new Set(skills.flatMap(s=>s.tags||[]));
 return {provider,category,query:typeof input.query==='string'?input.query.slice(0,2000):'',tags:Array.isArray(input.tags)?[...new Set(input.tags.filter(t=>typeof t==='string'&&known.has(t)))]:[]};
}
const normalizeText=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/\s+/gu,' ').trim();
const orchestrationForms=new Set(['orchestration','orchestrate','orchestrates','orchestrated','orchestrating','orchestrator','orchestrators']);
const orchestrationWord=/\borchestrat(?:ion|e|es|ed|ing|or|ors)\b/u;
const searchCache=new WeakMap();
// Catalog refreshes replace skill objects, so old snapshot indexes can be collected.
function searchFields(skill){
 if(!searchCache.has(skill)){
  const groups=[
   [100,[skill.callName,skill.slug,skill.nameZh]],
   [60,[...(skill.tags||[]),skill.category]],
   [30,[skill.summaryZh,skill.description,...(skill.scenariosZh||[])]],
   [10,[skill.searchText]]
  ];
  searchCache.set(skill,groups.map(([weight,values])=>{const text=normalizeText(values.filter(Boolean).join(' '));return {weight,text,orchestration:orchestrationWord.test(text)};}));
 }
 return searchCache.get(skill);
}
export function filterSkills(skills,state={}){
 const terms=[...new Set(normalizeText(state.query).split(' ').filter(Boolean))];
 const rows=[];
 for(const skill of skills){
  if((state.provider&&skill.provider!==state.provider)||(state.category&&skill.category!==state.category)||!(state.tags||[]).every(tag=>(skill.tags||[]).includes(tag)))continue;
  let score=0,matched=true;
  for(const term of terms){
   const group=searchFields(skill).find(field=>field.text.includes(term)||(orchestrationForms.has(term)&&field.orchestration));
   if(!group){matched=false;break;}score+=group.weight;
  }
  if(matched)rows.push({skill,score});
 }
 if(terms.length)rows.sort((a,b)=>b.score-a.score);
 return rows.map(row=>row.skill);
}
export function inventory(skills){
 const providers=[...new Set(skills.map(s=>s.provider))];
 return providers.map(provider=>{const rows=skills.filter(s=>s.provider===provider);return {provider,label:rows[0]?.providerLabel||provider,count:rows.length,categories:[...new Set(rows.map(s=>s.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'zh-CN')).map(name=>({name,count:rows.filter(s=>s.category===name).length}))};});
}
export function routeFor(type,id){return `#/${type}/${encodeURIComponent(id)}`;}
export function parseRoute(hash){
 if(!hash||hash==='#'||hash==='#/')return {type:'list'};
 const match=/^#\/(skills|references)\/([^/]+)$/.exec(hash);
 if(!match)return {type:'invalid'};
 try{return {type:match[1],id:decodeURIComponent(match[2])};}catch{return {type:'invalid'};}
}
