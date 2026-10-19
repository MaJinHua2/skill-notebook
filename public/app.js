'use strict';

const $ = (id) => document.getElementById(id);
const state = { catalog: null, category: '', query: '', provider: '' };
const categoryIcons = { '技能选择与发现': 'compass', '项目理解与开发文档': 'book', '源码注释与规范': 'code', '需求进度与验证': 'check' };
let toastTimer;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(svg.namespaceURI, 'use');
  use.setAttribute('href', `#icon-${name}`);
  svg.append(use);
  return svg;
}

function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2800);
}

async function copyText(text) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Use HTTP fallback');
    await navigator.clipboard.writeText(text);
    toast('调用名已复制，可以粘贴到 Codex 中使用');
    return;
  } catch (_) {
    // LAN HTTP is not a secure context; selection-based copy works there too.
    const area = element('textarea', 'sr-only');
    area.value = text;
    const active = document.activeElement;
    ($('info-dialog').open ? $('dialog-content') : document.body).append(area);
    area.focus();
    area.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) { /* Offer manual selection below. */ }
    area.remove();
    active?.focus();
    if (copied) {
      toast('已复制');
    } else {
      openDialog('手动复制', 'COPY', (content) => {
        content.append(element('p', 'detail-text', '浏览器限制了自动复制。请选择下方文本复制。'));
        const manual = element('textarea', 'manual-copy');
        manual.value = text;
        manual.readOnly = true;
        manual.setAttribute('aria-label', '待复制内容');
        content.append(manual);
        setTimeout(() => { manual.focus(); manual.select(); }, 0);
      });
    }
  }
}

function openDialog(title, eyebrow, render) {
  $('dialog-title').textContent = title;
  $('dialog-eyebrow').textContent = eyebrow;
  $('dialog-content').replaceChildren();
  render($('dialog-content'));
  if (!$('info-dialog').open) $('info-dialog').showModal();
}

function detailSection(content, label, text, tag = 'p', className = 'detail-text') {
  content.append(element('h3', 'detail-label', label), element(tag, className, text));
}

function showSkill(skill) {
  openDialog(skill.chinese_name, 'SKILL REFERENCE', (content) => {
    detailSection(content, '技能调用名', skill.invocation, 'code', 'detail-code');
    const copy = element('button', 'button dialog-action', '复制调用名');
    copy.addEventListener('click', () => copyText(skill.invocation));
    content.append(copy);
    detailSection(content, '技能概括', skill.summary);
    detailSection(content, '技能使用场景', skill.scenarios.join('；'));
    if (skill.notes) detailSection(content, '使用边界与补充', skill.notes);
    if (skill.aliases.length) detailSection(content, '相关源命令 / 别名', skill.aliases.join('、'));
    detailSection(content, '资料核对', `${skill.provider} · ${skill.verification}。中文名为便于理解的整理译名。`);
    detailSection(content, '关于这份笔记', '仅展示整理后的技能用途。原始对话、来源标识和私人路径不包含在公开资料中。');
  });
}

function renderNavigation() {
  const counts = new Map();
  state.catalog.skills.forEach((skill) => skill.categories.forEach((category) => counts.set(category, (counts.get(category) || 0) + 1)));
  $('categories').replaceChildren();
  const ordered = [...Object.keys(categoryIcons).filter((category) => counts.has(category)), ...[...counts.keys()].filter((category) => !(category in categoryIcons))];
  const entries = [['', '全部技能', state.catalog.skills.length], ...ordered.map((label) => [label, label, counts.get(label)])];
  entries.forEach(([id, label, count], index) => {
    const button = element('button', `nav-button${state.category === id ? ' active' : ''}`);
    button.setAttribute('aria-pressed', String(state.category === id));
    button.append(icon(index === 0 ? 'grid' : categoryIcons[label] || 'compass'), element('span', '', label), element('span', 'nav-count', String(count)));
    button.addEventListener('click', () => {
      state.category = id;
      document.querySelector('.sidebar').classList.remove('expanded');
      $('category-toggle').setAttribute('aria-expanded', 'false');
      renderNavigation();
      renderRows();
    });
    $('categories').append(button);
  });
  $('skill-count').textContent = state.catalog.skills.length;
  $('category-count').textContent = counts.size;
  $('provider-count').textContent = new Set(state.catalog.skills.map((skill) => skill.provider)).size;
}

function renderRows() {
  const tokens = state.query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const skills = state.catalog.skills.filter((skill) => {
    const searchable = [skill.invocation, skill.chinese_name, skill.summary, ...skill.scenarios, ...skill.aliases, ...skill.categories, skill.provider].join(' ').toLocaleLowerCase();
    return (!state.category || skill.categories.includes(state.category)) && (!state.provider || skill.provider === state.provider) && tokens.every((token) => searchable.includes(token));
  });
  $('skill-rows').replaceChildren();
  for (const skill of skills) {
    const row = element('tr');
    const invocation = element('td');
    const copy = element('button', 'invocation-button');
    copy.title = `复制 ${skill.invocation}`;
    copy.setAttribute('aria-label', `复制调用名 ${skill.invocation}`);
    copy.append(element('code', '', skill.invocation), icon('copy'));
    copy.addEventListener('click', () => copyText(skill.invocation));
    const meta = element('div', 'meta-line');
    meta.append(element('span', `provider-badge${skill.provider === 'ECC' ? '' : ' independent'}`, skill.provider), element('span', '', skill.categories.join(' · ')));
    invocation.append(copy, meta);
    const nameCell = element('td');
    const name = element('button', 'name-button', skill.chinese_name);
    name.title = '查看使用边界与来源';
    name.addEventListener('click', () => showSkill(skill));
    nameCell.append(name);
    const scenesCell = element('td');
    const scenes = element('ul', 'scenarios');
    skill.scenarios.forEach((scene) => scenes.append(element('li', '', scene)));
    scenesCell.append(scenes);
    row.append(invocation, nameCell, element('td', 'summary', skill.summary), scenesCell);
    $('skill-rows').append(row);
  }
  const heading = $('list-title');
  heading.firstChild.textContent = `${state.category || '全部技能'} `;
  $('result-count').textContent = skills.length;
  $('category-description').textContent = state.query || state.provider ? `找到 ${skills.length} 个匹配技能，可清除筛选查看其他内容。` : '从一个具体任务，找到一个合适的技能。';
  $('empty-state').hidden = skills.length > 0;
  document.querySelector('thead').hidden = skills.length === 0;
}

async function loadCatalog(refresh = false) {
  $('refresh').disabled = true;
  try {
    const response = await fetch('/catalog.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = await response.json();
    if (catalog.schema_version !== 2 || !Array.isArray(catalog.skills)) throw new Error('资料格式不正确');
    state.catalog = catalog;
    const categories = new Set(catalog.skills.flatMap((skill) => skill.categories));
    if (!categories.has(state.category)) state.category = '';
    const providers = [...new Set(catalog.skills.map((skill) => skill.provider))];
    if (!providers.includes(state.provider)) state.provider = '';
    $('provider').replaceChildren(new Option('全部插件', ''), ...providers.map((provider) => new Option(provider, provider)));
    $('provider').value = state.provider;
    renderNavigation();
    renderRows();
    const updated = new Date(`${catalog.updated_at.slice(0, 10)}T00:00:00`);
    $('updated-at').textContent = `最近收录 ${Number.isNaN(updated.getTime()) ? '未知' : new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(updated)}`;
    $('load-error').hidden = true;
    if (refresh) toast('已读取最新资料');
  } catch (error) {
    $('load-error').textContent = `资料暂时无法加载（${error.message}）。请点击“刷新资料”重试。${state.catalog ? '下方保留上次成功加载的内容。' : ''}`;
    $('load-error').hidden = false;
  } finally {
    $('loading').hidden = true;
    $('refresh').disabled = false;
  }
}

$('search').addEventListener('input', (event) => { state.query = event.target.value; if (state.catalog) renderRows(); });
$('provider').addEventListener('change', (event) => { state.provider = event.target.value; if (state.catalog) renderRows(); });
$('refresh').addEventListener('click', () => loadCatalog(true));
$('reset-filters').addEventListener('click', () => {
  state.category = state.query = state.provider = '';
  $('search').value = $('provider').value = '';
  renderNavigation();
  renderRows();
});
$('category-toggle').addEventListener('click', () => {
  const expanded = document.querySelector('.sidebar').classList.toggle('expanded');
  $('category-toggle').setAttribute('aria-expanded', String(expanded));
});
$('close-dialog').addEventListener('click', () => $('info-dialog').close());
$('info-dialog').addEventListener('click', (event) => { if (event.target === $('info-dialog') && (event.offsetX < 0 || event.offsetX > event.target.clientWidth || event.offsetY < 0 || event.offsetY > event.target.clientHeight)) $('info-dialog').close(); });
$('show-sources').addEventListener('click', () => {
  openDialog('把技能，整理成用得上的笔记', 'ABOUT THE NOTES', (content) => {
    content.append(element('p', 'detail-text', '这是一份公开学习笔记，以调用名、中文名、技能概括和使用场景为核心。'));
    detailSection(content, '整理方式', '按需收录、按场景分类；中文名是便于理解的整理译名，使用边界仍需参考技能实际定义。');
    detailSection(content, '隐私边界', '网页和公开仓库不包含私人对话标题、链接或标识，也不包含个人路径、设备地址与凭据。原始来源仅保留在本机私有目录。');
  });
});
$('show-help').addEventListener('click', () => {
  openDialog('遇到新技能，主动收录一下', 'GROW YOUR LIBRARY', (content) => {
    content.append(element('p', 'detail-text', '在 Codex 对话里调用“技能拾记收录”技能，把介绍过的技能整理到这里。'));
    const prompt = '使用 $collect-skill-notes，收录这次对话介绍的新技能，按调用名、中文名、概括和使用场景整理。';
    detailSection(content, '收录当前对话', prompt, 'code', 'detail-code');
    const copy = element('button', 'button dialog-action', '复制收录指令');
    copy.addEventListener('click', () => copyText(prompt));
    content.append(copy);
    detailSection(content, '收录其他对话', '使用 $collect-skill-notes，收录 codex://threads/你的对话ID 中介绍的技能。', 'code', 'detail-code');
    content.append(element('p', 'help-footnote', '收录完成后，点击网页的“刷新资料”即可看到新增内容。同一技能重复出现会合并整理，无需担心重复收录。'));
  });
});
document.addEventListener('keydown', (event) => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
  if (event.key === '/' && !typing && !$('info-dialog').open) { event.preventDefault(); $('search').focus(); }
  if (event.key === 'Escape' && !$('info-dialog').open && document.activeElement === $('search')) {
    $('search').value = state.query = '';
    if (state.catalog) renderRows();
  }
});
loadCatalog();
