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
export function filterSkills(skills,state={}){
 const query=(state.query||'').trim().toLocaleLowerCase();
 return skills.filter(s=>(!state.provider||s.provider===state.provider)&&(!state.category||s.category===state.category)&&(state.tags||[]).every(t=>(s.tags||[]).includes(t))&&(!query||[s.callName,s.nameZh,s.slug,s.summaryZh,s.description,...(s.scenariosZh||[])].filter(Boolean).join(' ').toLocaleLowerCase().includes(query)));
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
