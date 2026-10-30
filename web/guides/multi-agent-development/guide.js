(function(){
  const steps=Array.from(document.querySelectorAll('.step'));
  const input=document.getElementById('search');
  const count=document.getElementById('result-count');
  const empty=document.getElementById('empty');
  const buttons=Array.from(document.querySelectorAll('[data-filter]'));
  let group='all';
  function update(){
    const term=input.value.trim().toLocaleLowerCase();
    let visible=0;
    for(const step of steps){
      const matchesGroup=group==='all'||step.dataset.group===group;
      const matchesText=!term||step.dataset.search.includes(term);
      step.hidden=!(matchesGroup&&matchesText);
      if(!step.hidden) visible++;
    }
    count.textContent='显示 '+visible+' / '+steps.length+' 项（含可选重构路径）';
    empty.hidden=visible!==0;
  }
  buttons.forEach(function(button){button.addEventListener('click',function(){
    group=button.dataset.filter;
    buttons.forEach(function(item){item.setAttribute('aria-pressed',String(item===button));});
    update();
  });});
  input.addEventListener('input',update);

  const copyStatus=document.getElementById('copy-status');
  let copyStatusTimer;
  async function copySkill(button){
    const value=button.dataset.skillCopy;
    let copied=false;
    try{
      if(navigator.clipboard && typeof navigator.clipboard.writeText==='function'){
        await navigator.clipboard.writeText(value);
        copied=true;
      }
    }catch(error){ /* Fall back to the browser's synchronous copy command. */ }
    if(!copied){
      const field=document.createElement('textarea');
      field.value=value;
      field.setAttribute('readonly','');
      field.style.position='fixed';
      field.style.left='-9999px';
      document.body.appendChild(field);
      field.focus();
      field.select();
      try{ copied=document.execCommand('copy'); }catch(error){ copied=false; }
      field.remove();
      button.focus();
    }
    clearTimeout(copyStatusTimer);
    copyStatus.textContent=copied ? '已复制技能：'+button.dataset.skillName : '复制失败，请检查浏览器的剪贴板权限';
    copyStatus.hidden=false;
    if(copied){ copyStatusTimer=setTimeout(function(){copyStatus.hidden=true;},2600); }
  }
  document.querySelectorAll('[data-skill-copy]').forEach(function(button){
    button.addEventListener('click',function(){return copySkill(button);});
  });
  update();
})();
