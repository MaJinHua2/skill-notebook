// Explicit presentation assets only; this does not register catalog sources.
export const GUIDES = [
 {id:'multi-agent-development',name:'多智能体开发全流程',description:'从需求到 Git，查看角色分工、文档交接与各环节的 ECC 技能。',title:'ECC 多智能体软件开发全流程',focusKey:'development-guide',files:['index.html','guide.css','guide.js']},
 {id:'mattpocock-skills',name:'Mattpocock Skills 指南',description:'了解 Matt Pocock 技能的用途、适用场景与协作流程。',title:'Mattpocock Skills 指南',focusKey:'mattpocock-guide',files:['index.html','guide.css','guide.js','source-manifest.json','LICENSE.txt']}
];
export const guideById = id => GUIDES.find(guide=>guide.id===id);
export const GUIDE_MIME = {'index.html':'text/html; charset=utf-8','guide.css':'text/css; charset=utf-8','guide.js':'text/javascript; charset=utf-8','source-manifest.json':'application/json; charset=utf-8','LICENSE.txt':'text/plain; charset=utf-8'};
