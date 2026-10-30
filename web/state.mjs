export const WORKFLOWS = [
 {id:'management',label:'项目管理',stages:[
  {id:'management-needs',label:'需求定义',tags:['需求分析']},
  {id:'management-plan',label:'调研规划',tags:['研究检索','架构设计']},
  {id:'management-collaborate',label:'组织协作',tags:['协作','多Agent']},
  {id:'management-accept',label:'检查验收',tags:['测试','审查']},
  {id:'management-deliver',label:'交付归档',tags:['发布部署','版本管理','文档']},
  {id:'management-improve',label:'复盘改进',tags:['审查','数据分析']}
 ]},
 {id:'development',label:'软件开发',stages:[
  {id:'development-needs',label:'需求分析',tags:['需求分析']},
  {id:'development-research',label:'技术调研',tags:['研究检索']},
  {id:'development-design',label:'架构设计',tags:['架构设计']},
  {id:'development-build',label:'开发实现',tags:['开发实现']},
  {id:'development-test',label:'测试验证',tags:['测试']},
  {id:'development-review',label:'代码审查',tags:['审查','安全']},
  {id:'development-release',label:'发布部署',tags:['发布部署','版本管理']},
  {id:'development-operate',label:'运行优化',tags:['网络运维','性能','基础设施']}
 ]}
];
export function workflowStage(id){return WORKFLOWS.flatMap(w=>w.stages).find(s=>s.id===id);}
export function toggleStage(state,id){return {...state,stage:state.stage===id?'':workflowStage(id)?.id||''};}
export const clearState = () => ({provider:'',category:'',query:'',tags:[],stage:''});
export function selectProvider(state,provider){return {...clearState(),...state,provider,category:''};}
export function toggleTag(state,tag){const tags=state.tags||[];return {...state,tags:tags.includes(tag)?tags.filter(t=>t!==tag):[...tags,tag]};}
export function normalizeState(value,skills){
 const input=value&&typeof value==='object'?value:{};
 const provider=typeof input.provider==='string'&&skills.some(s=>s.provider===input.provider)?input.provider:'';
 const category=provider&&skills.some(s=>s.provider===provider&&s.category===input.category)?input.category:'';
 const known=new Set(skills.flatMap(s=>s.tags||[]));
 return {provider,category,stage:workflowStage(input.stage)?.id||'',query:typeof input.query==='string'?input.query.slice(0,2000):'',tags:Array.isArray(input.tags)?[...new Set(input.tags.filter(t=>typeof t==='string'&&known.has(t)))]:[]};
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
 const stage=workflowStage(state.stage);
 for(const skill of skills){
  if(stage&&!stage.tags.some(tag=>(skill.tags||[]).includes(tag)))continue;
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
 if(hash==='#/guides/multi-agent-development')return {type:'guides',id:'multi-agent-development'};
 const match=/^#\/(skills|references)\/([^/]+)$/.exec(hash);
 if(!match)return {type:'invalid'};
 try{return {type:match[1],id:decodeURIComponent(match[2])};}catch{return {type:'invalid'};}
}
