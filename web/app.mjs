import './style.css';
import {clearState,normalizeState,selectProvider,toggleTag,filterSkills,inventory,parseRoute,routeFor,WORKFLOWS,workflowStage,toggleStage} from './state.mjs';
import {renderMarkdown} from './markdown.mjs';
import {EMBEDDED_GUIDE} from './embedded-guide.mjs';

const app=document.querySelector('#app');
const STORE='skill-reader.preferences.v1';
let skills=[],sources=[],diagnostics=[],filters=clearState(),expanded={},mobileOpen=false,requestNumber=0,loaded=false;
let saved={};try{saved=JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch{/* Storage may be unavailable or corrupt. */}
function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
function button(text,handler,className='button'){const n=el('button',className,text);n.type='button';n.addEventListener('click',handler);return n;}
function announce(message){document.querySelector('#announce').textContent=message;}
function save(){try{localStorage.setItem(STORE,JSON.stringify({filters,expanded}));}catch{/* Reading still works in private browsing. */}}
function preserveFocus(fn){const key=document.activeElement?.dataset?.focusKey;fn();if(key){for(const n of document.querySelectorAll('[data-focus-key]'))if(n.dataset.focusKey===key){n.focus();break;}}}
function changeFilters(next){filters=next;save();preserveFocus(()=>{renderNavigation();updateList();});}
function goList(){if(location.hash==='#/')showRoute();else location.hash='#/';}
async function api(path){const response=await fetch(path,{headers:{Accept:'application/json'},cache:'no-store'});let result;try{result=await response.json();}catch{throw new Error('服务返回了无法读取的数据，请刷新重试。');}if(!response.ok)throw new Error(result.error||'读取失败，请刷新重试。');return result;}
function shell(){
 app.replaceChildren();
 const header=el('header','header');
 const brand=el('a','brand');brand.href='#/';brand.append(el('span','logo','S'),el('span','brand-title','技能阅读器'));
 const tagline=el('span','header-note','读懂用途，再选择技能');
 const menu=button('技能导航',()=>{mobileOpen=!mobileOpen;updateMobile();},'button mobile-menu');menu.id='mobile-menu';menu.setAttribute('aria-controls','navigation');
 const refresh=button('刷新资料',load,'button refresh');
 header.append(brand,tagline,menu,refresh);
 const layout=el('div','layout');const nav=el('nav','navigation');nav.id='navigation';nav.setAttribute('aria-label','技能模块、分类与学习指南');
 const main=el('main','main');main.id='main';main.tabIndex=-1;
 layout.append(nav,main);app.append(header,layout);renderNavigation();updateMobile();
}
function updateMobile(){document.querySelector('#navigation')?.classList.toggle('mobile-open',mobileOpen);document.querySelector('#mobile-menu')?.setAttribute('aria-expanded',String(mobileOpen));}
function renderNavigation(){
 const nav=document.querySelector('#navigation');if(!nav)return;nav.replaceChildren(el('p','eyebrow','我的技能库'));
 const viewingGuide=parseRoute(location.hash).type==='guides';
 const all=button(`全部技能 · ${skills.length}`,()=>{changeFilters(selectProvider(filters,''));mobileOpen=false;updateMobile();goList();},'nav-item');
 all.dataset.focusKey='all';all.classList.toggle('active',!viewingGuide&&!filters.provider);if(!viewingGuide&&!filters.provider)all.setAttribute('aria-current','page');nav.append(all);
 for(const group of inventory(skills)){
  const section=el('section','nav-group');const row=el('div','module-row');
  const choose=button(`${group.label} 模块 · ${group.count}`,()=>{expanded[group.provider]=true;changeFilters(selectProvider(filters,group.provider));goList();},'nav-item module-name');
  choose.dataset.focusKey=`provider-${group.provider}`;choose.classList.toggle('active',!viewingGuide&&filters.provider===group.provider&&!filters.category);
  const toggle=button(expanded[group.provider]?'▾':'▸',()=>{expanded[group.provider]=!expanded[group.provider];save();preserveFocus(renderNavigation);},'fold');toggle.setAttribute('aria-label',`${expanded[group.provider]?'收起':'展开'} ${group.label} 分类`);toggle.setAttribute('aria-expanded',String(!!expanded[group.provider]));toggle.setAttribute('aria-controls',`categories-${group.provider}`);toggle.dataset.focusKey=`fold-${group.provider}`;
  row.append(choose,toggle);section.append(row);
  const categories=el('div','categories');categories.id=`categories-${group.provider}`;categories.hidden=!expanded[group.provider];
  for(const category of group.categories){const b=button(`${category.name} · ${category.count}`,()=>{changeFilters({...filters,provider:group.provider,category:category.name});mobileOpen=false;updateMobile();goList();},'nav-item subcategory');b.dataset.focusKey=`category-${group.provider}-${category.name}`;b.classList.toggle('active',!viewingGuide&&filters.provider===group.provider&&filters.category===category.name);categories.append(b);}section.append(categories);nav.append(section);
 }
 const guide=el('a','nav-item guide-nav','多智能体开发全流程');guide.href=routeFor('guides','multi-agent-development');guide.dataset.focusKey='development-guide';guide.classList.toggle('active',viewingGuide);if(viewingGuide)guide.setAttribute('aria-current','page');
 guide.addEventListener('click',()=>{mobileOpen=false;updateMobile();});nav.append(el('p','eyebrow guide-nav-heading','学习指南'),guide);
 nav.append(el('p','nav-foot','本地只读 · 原文与中文学习说明分开保存'));
}
function statusNote(skill){
 if(skill.status==='stale')return el('p','notice warning','说明待复核：技能来源已变化，以下中文说明可能过期。');
 if(skill.status==='missing')return el('p','notice','中文说明待整理，可先阅读完整原文。');
 return null;
}
function tagsFor(skill,onClick=true){const wrap=el('div','tags');for(const tag of skill.tags||[]){if(onClick){const b=button(tag,()=>changeFilters(toggleTag(filters,tag)),'tag');b.setAttribute('aria-pressed',String(filters.tags.includes(tag)));b.dataset.focusKey=`card-tag-${skill.id}-${tag}`;wrap.append(b);}else wrap.append(el('span','tag',tag));}return wrap;}
function field(label,content){const section=el('div','field');section.append(el('span','field-label',label));section.append(typeof content==='string'?el('p','',content):content);return section;}
function scenarios(skill){if(!skill.scenariosZh?.length)return el('p','muted','待整理');const ul=el('ul','scenarios');for(const text of skill.scenariosZh)ul.append(el('li','',text));return ul;}
function card(skill){
 const article=el('article','card');article.dataset.skillId=skill.id;
 const top=el('div','top');const title=el('a','skill-link');title.href=routeFor('skills',skill.id);title.append(el('span','skill-icon','◇'),el('h3','',skill.nameZh||'中文名待整理'),el('span','arrow','↗'));top.append(title);
 article.append(top,field('技能调用名',el('code','call-name',skill.callName)),field('技能概括',skill.summaryZh||'中文概括待整理'),field('技能使用场景',scenarios(skill)));
 const footer=el('div','card-footer');footer.append(el('span','source-badge',`${skill.providerLabel} · ${skill.kind==='migrated'?'迁移命令技能':'技能'}`),el('span','muted',skill.category||'未分类'));
 const details=el('a','button primary detail-entry','查看详情与原文');details.href=routeFor('skills',skill.id);
 article.append(tagsFor(skill),details,footer);const note=statusNote(skill);if(note)article.append(note);return article;
}
function renderList(){
 const main=document.querySelector('#main');main.removeAttribute('aria-busy');main.replaceChildren();document.title='技能阅读器 · 从用途理解技能';
 const heading=el('div','section-heading');heading.append(el('h1','','技能'),el('p','muted','查调用名，看中文释义，按场景找到合适的技能。'));main.append(heading);
 const controls=el('div','controls');
 const searchLabel=el('label','search');searchLabel.append(el('span','sr-only','搜索技能'));const search=el('input');search.type='search';search.id='search';search.placeholder='搜索调用名、中文名、用途或使用场景…';search.value=filters.query;search.addEventListener('input',()=>changeFilters({...filters,query:search.value}));searchLabel.append(search);
 const selectLabel=el('label','provider-select');selectLabel.append(el('span','sr-only','技能来源'));const select=el('select');select.id='provider';select.add(new Option('全部来源',''));for(const source of sources)select.add(new Option(`${source.label} · ${source.count}`,source.id));select.value=filters.provider;select.addEventListener('change',()=>{if(select.value)expanded[select.value]=true;changeFilters(selectProvider(filters,select.value));});selectLabel.append(select);
 controls.append(searchLabel,selectLabel);main.append(controls,el('p','muted','搜索中英文技能信息、标签、分类及技能正文；多关键词取交集，按相关度排序，不含关联文档。'));
 const tagDetails=el('details','tag-filter');const summary=el('summary','','按标签筛选（多选取交集）');tagDetails.append(summary,el('div','tags tag-options'));main.append(tagDetails);
 const workflow=el('details','workflow-filter');
 const workflowHeading=el('summary','','按工作流程阶段');workflow.append(workflowHeading,el('p','muted','项目管理与软件开发：阶段内任一标签匹配，与其他筛选取交集。'));
 for(const flow of WORKFLOWS){
  const row=el('div','workflow-row');const title=el('h3','workflow-label',flow.label);title.id=`workflow-${flow.id}`;
  const steps=el('ol','workflow-steps');steps.setAttribute('aria-labelledby',title.id);
  flow.stages.forEach((stage,index)=>{
   const item=el('li','workflow-step');
   const b=button(`${['①','②','③','④','⑤','⑥','⑦','⑧'][index]} ${stage.label}`,()=>changeFilters(toggleStage(filters,stage.id)),'button stage-button');
   b.dataset.stage=stage.id;b.dataset.focusKey=`stage-${stage.id}`;item.append(b);steps.append(item);
  });row.append(title,steps);workflow.append(row);
 }
 const guide=el('section','embedded-guide');const guideTitle=el('h3','workflow-label','嵌入式开发引导');guideTitle.id='embedded-guide-title';
 const guideItems=el('ol','embedded-guide-items');guideItems.setAttribute('aria-labelledby',guideTitle.id);
 const available=new Set(skills.map(skill=>skill.id));
 for(const entry of EMBEDDED_GUIDE){
  const item=el('li','embedded-guide-item');item.dataset.guideId=entry.id;
  item.append(el('h4','embedded-guide-stage',entry.label));
  const link=el(available.has(entry.id)?'a':'span','embedded-guide-link',entry.slug);
  if(available.has(entry.id))link.href=routeFor('skills',entry.id);
  else link.setAttribute('aria-disabled','true');
  item.append(link,el('p','muted',entry.description));
  if(!available.has(entry.id))item.append(el('p','muted guide-unavailable','当前来源未提供该技能'));
  guideItems.append(item);
 }
 guide.append(guideTitle,el('p','muted','点击技能名称直接阅读中文说明与完整原文。'),guideItems);workflow.append(guide);main.append(workflow);
 const resultsHeader=el('div','results-heading');const count=el('h2');count.id='match-count';const reset=button('清除全部筛选',()=>{changeFilters(clearState());document.querySelector('#search').value='';},'button');resultsHeader.append(count,reset);main.append(resultsHeader,el('div','active-filters'),el('div','diagnostics'),el('div','grid'));updateList();
}
function updateList(){
 if(parseRoute(location.hash).type!=='list')return;
 const main=document.querySelector('#main');const count=main?.querySelector('#match-count');if(!count)return;
 const matches=filterSkills(skills,filters);count.textContent=`匹配 ${matches.length} 项 / 库存 ${skills.length} 项`;
 main.querySelector('#provider').value=filters.provider;
 const active=main.querySelector('.active-filters');const parts=[filters.provider&&`${sources.find(s=>s.id===filters.provider)?.label||filters.provider} 模块`,filters.category,filters.query&&`搜索“${filters.query}”`,...filters.tags.map(t=>`标签：${t}`)].filter(Boolean);active.replaceChildren();
 const stage=workflowStage(filters.stage);const flow=WORKFLOWS.find(w=>w.stages.some(s=>s.id===filters.stage));
 if(stage){const cancel=button(`${flow.label} · ${stage.label} ×`,()=>changeFilters({...filters,stage:''}),'button stage-selection');cancel.setAttribute('aria-label','取消阶段筛选');cancel.dataset.focusKey='cancel-stage';active.append(el('span','','当前阶段：'),cancel);}
 active.append(el('span','',parts.length?`当前条件：${parts.join(' · ')}`:stage?'未限制其他条件':'全部技能 · 点击卡片标题阅读全文，点击标签过滤'));
 for(const b of main.querySelectorAll('[data-stage]'))b.setAttribute('aria-pressed',String(b.dataset.stage===filters.stage));
 const options=main.querySelector('.tag-options');options.replaceChildren();for(const tag of [...new Set(skills.flatMap(s=>s.tags||[]))].sort((a,b)=>a.localeCompare(b,'zh-CN'))){const b=button(tag,()=>changeFilters(toggleTag(filters,tag)),'tag');b.setAttribute('aria-pressed',String(filters.tags.includes(tag)));b.dataset.focusKey=`filter-tag-${tag}`;options.append(b);}
 if(!options.children.length)options.append(el('p','muted','暂无已整理标签。'));
 const region=main.querySelector('.grid');region.replaceChildren();if(matches.length)region.append(...matches.map(card));else{const empty=el('div','empty-state');empty.append(el('h3','','没有匹配的技能'),el('p','','可减少关键词、标签或阶段限制，或清除全部筛选。'));if(stage)empty.append(button('取消阶段',()=>changeFilters({...filters,stage:''}),'button'));empty.append(button('清除全部筛选',()=>{changeFilters(clearState());document.querySelector('#search').value='';},'button primary'));region.append(empty);}
 const diagnosticRegion=main.querySelector('.diagnostics');diagnosticRegion.replaceChildren();for(const diagnostic of diagnostics)diagnosticRegion.append(el('p','notice warning',`${diagnostic.source||'来源'}：${diagnostic.message}`));
 announce(`匹配 ${matches.length} 项技能`);
}
async function copyCall(callName,b){try{await navigator.clipboard.writeText(callName);b.textContent='已复制';announce('已复制技能调用名');setTimeout(()=>{if(b.isConnected)b.textContent='复制调用名';},1800);}catch{announce('复制失败，请手动选择调用名复制');b.textContent='请选中调用名手动复制';}}
function errorView(message,retry){const main=document.querySelector('#main');const section=el('section','empty-state');section.setAttribute('role','alert');section.append(el('h1','','暂时无法显示'),el('p','',message),button('返回技能列表',goList));if(retry)section.append(button('重试',retry));main.replaceChildren(section);}
function renderDevelopmentGuide(){
 const main=document.querySelector('#main');main.removeAttribute('aria-busy');main.replaceChildren();
 const heading=el('div','section-heading');heading.append(el('h1','','多智能体开发全流程'),el('p','muted','从需求到 Git，查看角色分工、文档交接与各环节的 ECC 技能。'));main.append(heading);
 const actions=el('div','guide-actions');const back=el('a','button','返回技能列表');back.href='#/';
 const standalone=el('a','button','单独打开指南');standalone.href='/guides/multi-agent-development/index.html';standalone.target='_blank';standalone.rel='noopener noreferrer';actions.append(back,standalone);main.append(actions);
 const frame=el('iframe','development-guide-frame');frame.title='ECC 多智能体软件开发全流程';frame.src=standalone.href;frame.setAttribute('allow','clipboard-write');main.append(frame);
 document.title='多智能体开发全流程 · 技能阅读器';main.focus();window.scrollTo({top:0});
}
async function showRoute(){
 const route=parseRoute(location.hash);const number=++requestNumber;
 renderNavigation();
 if(route.type==='list'){renderList();return;}
 if(route.type==='guides'){renderDevelopmentGuide();return;}
 if(route.type==='invalid'){errorView('链接格式无效，请返回技能列表重新选择。');return;}
 const main=document.querySelector('#main');main.replaceChildren(el('p','notice','正在读取完整文档…'));main.setAttribute('aria-busy','true');
 try{
  const data=await api(`/api/${route.type}/${encodeURIComponent(route.id)}`);if(number!==requestNumber)return;
  main.replaceChildren();const back=el('a','back-link',route.type==='references'?'← 返回前一篇文档':'← 返回技能列表');
  const parent=typeof history.state?.readerFrom==='string'&&['skills','references'].includes(parseRoute(history.state.readerFrom).type)?history.state.readerFrom:null;
  back.href=route.type==='references'&&parent?parent:'#/';
  if(route.type==='references'&&parent)back.addEventListener('click',event=>{event.preventDefault();history.back();});
  main.append(back);
  if(route.type==='skills'){
   main.append(el('h1','detail-title',data.nameZh||'中文名待整理'));
   const meta=el('div','detail-meta');meta.append(el('code','call-name',data.callName),button('复制调用名',e=>copyCall(data.callName,e.currentTarget),'button'));main.append(meta,el('p','muted',`${data.providerLabel} · 版本 ${data.version} · ${data.category||'未分类'}`));
   const note=statusNote(data);if(note)main.append(note);
   const learning=el('section','learning-panel');learning.append(el('h2','','中文学习说明'),field('技能概括',data.summaryZh||'待整理'),field('技能使用场景',scenarios(data)),tagsFor(data,false));main.append(learning,el('h2','original-heading','完整技能原文'));
  }else main.append(el('h1','detail-title',data.title||'关联文档'));
  main.append(renderMarkdown(data.body));
  const refs=el('section','references');refs.append(el('h2','','关联文档'),el('p','muted','包内 Markdown 请从这里阅读；正文中的相对链接未直接加载，远程图片不会加载。'));
  if(data.references?.length){const list=el('ul');for(const reference of data.references){const item=el('li');const a=el('a','',reference.label);a.href=routeFor('references',reference.id);a.addEventListener('click',event=>{if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();history.pushState({readerFrom:location.hash},'',a.href);showRoute();});item.append(a);list.append(item);}refs.append(list);}else refs.append(el('p','muted','暂无可读取的关联文档。'));main.append(refs);
  document.title=`${data.nameZh||data.title||data.callName} · 技能阅读器`;main.focus();window.scrollTo({top:0});
 }catch(error){if(number===requestNumber)errorView(error.message,showRoute);}finally{if(number===requestNumber)main.removeAttribute('aria-busy');}
}
async function load(){
 const refresh=document.querySelector('.refresh');if(refresh)refresh.disabled=true;
 try{const data=await api('/api/skills');skills=data.skills;sources=data.sources;diagnostics=data.diagnostics||[];filters=normalizeState(loaded?filters:saved.filters,skills);loaded=true;const candidate=Object.keys(expanded).length?expanded:saved.expanded;expanded=Object.fromEntries(sources.map(s=>[s.id,!!(candidate&&typeof candidate==='object'&&candidate[s.id]===true)]));save();shell();await showRoute();}
 catch(error){if(!document.querySelector('#main'))shell();errorView(error.message,load);}
 finally{const b=document.querySelector('.refresh');if(b)b.disabled=false;}
}
window.addEventListener('hashchange',showRoute);
document.querySelector('.skip-link')?.addEventListener('click',event=>{event.preventDefault();const main=document.querySelector('#main');main?.focus();main?.scrollIntoView({block:'start'});});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobileOpen){mobileOpen=false;updateMobile();document.querySelector('#mobile-menu')?.focus();}});
load();
