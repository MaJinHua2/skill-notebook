import {marked} from 'marked';
import DOMPurify from 'dompurify';

// Skill documents are untrusted data, including their embedded HTML and URLs.
export function renderMarkdown(body){
 const element=document.createElement('div');element.className='markdown';
 element.innerHTML=DOMPurify.sanitize(marked.parse(String(body||''),{gfm:true,breaks:false}),{
  USE_PROFILES:{html:true},FORBID_TAGS:['img','picture','video','audio','source','iframe','object','embed','form','input','button','style','script','svg','math','link','meta'],
  FORBID_ATTR:['style','src','srcset','id','name'],ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false,SANITIZE_NAMED_PROPS:true
 });
 for(const link of element.querySelectorAll('a')){
  const href=link.getAttribute('href')||'';
  if(/^https?:\/\//i.test(href)){
   try{const url=new URL(href);if(!['http:','https:'].includes(url.protocol))throw new Error();link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';}
   catch{link.removeAttribute('href');}
  }else{link.removeAttribute('href');link.title='包内文档请从下方“关联文档”阅读；其他链接未直接加载';link.classList.add('unavailable-link');}
 }
 for(const table of element.querySelectorAll('table')){const wrapper=document.createElement('div');wrapper.className='table-scroll';wrapper.tabIndex=0;wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label','横向滚动表格');table.before(wrapper);wrapper.append(table);}
 return element;
}
