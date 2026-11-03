(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.skill-card')];
  const search = document.querySelector('#skill-search');
  const stage = document.querySelector('#stage-filter');
  const count = document.querySelector('#result-count');
  const empty = document.querySelector('#empty-state');
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/gu, ' ').trim();
  const searchable = cards.map(card => normalize(card.textContent));
  function filter() {
    const terms = normalize(search.value).split(' ').filter(Boolean);
    let visible = 0;
    cards.forEach((card, index) => {
      const matchesStage = stage.value === 'all' || card.dataset.stage === stage.value;
      card.hidden = !(matchesStage && terms.every(term => searchable[index].includes(term)));
      if (!card.hidden) visible += 1;
    });
    count.textContent = `显示 ${visible} / ${cards.length} 项技能`;
    empty.hidden = visible !== 0;
  }
  search.addEventListener('input', filter);
  stage.addEventListener('change', filter);
  document.querySelector('#reset-filters').addEventListener('click', () => {
    search.value = '';
    stage.value = 'all';
    filter();
    search.focus();
  });
  document.querySelectorAll('[data-copy-target]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const target = document.getElementById(button.dataset.copyTarget);
      const status = document.querySelector('#copy-status');
      try {
        if (!target || !navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(target.textContent);
        status.textContent = '已复制示例。请在目标宿主中核对技能与授权后使用。';
      } catch {
        status.textContent = '复制失败：浏览器未允许剪贴板访问，请手动选择示例文本复制。';
      }
    });
  });
  document.querySelector('#skill-toolbar').hidden = false;
  filter();
})();
