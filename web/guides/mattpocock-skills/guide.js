(() => {
  'use strict';
  // Reading navigation for the existing fixed 27-card guide only.
  // These card IDs are not runtime catalog IDs and do not register skills.
  const readingGroups = [
    {
      "id": "feature",
      "label": "新需求开发",
      "goal": "把新想法变成范围清楚、可以验证和交付的功能。",
      "input": "任务目标、使用场景、已有约束与用户决定。",
      "output": "确认后的方案、授权内变更及分层验证记录。",
      "stages": [
        {
          "id": "feature-clarify",
          "label": "需求澄清",
          "goal": "说清要解决什么问题，以及什么结果算满足需求。",
          "input": "目标、使用场景、预期行为和限制。",
          "output": "需求范围、验收条件及待确认问题。"
        },
        {
          "id": "feature-impact",
          "label": "现状与影响分析",
          "goal": "查清已有能力，以及改动会影响哪里。",
          "input": "目标仓库、现有接口、数据及需求范围。",
          "output": "当前行为依据、依赖、影响范围和未知项。"
        },
        {
          "id": "feature-design",
          "label": "方案论证",
          "goal": "比较可行办法，说明各自代价和风险。",
          "input": "需求、现状证据、技术约束和备选办法。",
          "output": "方案比较、风险和需要用户决定的事项。"
        },
        {
          "id": "feature-plan",
          "label": "计划与确认",
          "goal": "把选定方案拆成可执行步骤，并核对授权。",
          "input": "已确认方案、范围、依赖及验证要求。",
          "output": "实施步骤、退出条件和用户确认状态。"
        },
        {
          "id": "feature-implement",
          "label": "开发实现",
          "goal": "在授权范围内实现功能，并保留必要测试。",
          "input": "已确认计划、源码和实施授权。",
          "output": "实际变更、必要测试及偏离计划的说明。"
        },
        {
          "id": "feature-verify",
          "label": "独立审查与测试验证",
          "goal": "分别检查实现、测试及尚未验证的风险。",
          "input": "最终变更、需求、测试环境与证据。",
          "output": "独立审查结论、测试记录及未完成验证。"
        },
        {
          "id": "feature-deliver",
          "label": "验收与交付",
          "goal": "核对验收条件，说明交付内容和使用限制。",
          "input": "验收条件、验证记录与交付范围。",
          "output": "验收证据、交付说明及遗留事项。"
        }
      ]
    },
    {
      "id": "maintenance",
      "label": "故障维护",
      "goal": "用证据定位故障，在确认范围内修复并保护相关行为。",
      "input": "环境、复现操作、预期与实际结果及已有日志。",
      "output": "故障证据、授权内修复、回归结果和关闭条件。",
      "stages": [
        {
          "id": "maintenance-collect",
          "label": "现象收集",
          "goal": "准确记录发生了什么，避免把猜测当原因。",
          "input": "环境、版本、操作、预期与实际结果。",
          "output": "问题记录、现有证据及待补信息。"
        },
        {
          "id": "maintenance-diagnose",
          "label": "复现与定位",
          "goal": "用复现、日志和最小实验检验原因。",
          "input": "问题记录、源码、日志及获准使用的环境。",
          "output": "复现证据、已确认原因或仍待验证的假设。"
        },
        {
          "id": "maintenance-solution",
          "label": "修复方案",
          "goal": "说明如何修复，以及会影响哪些既有行为。",
          "input": "故障证据、影响范围、限制和修复选项。",
          "output": "修复选项、兼容风险及待用户决定事项。"
        },
        {
          "id": "maintenance-plan",
          "label": "计划与确认",
          "goal": "明确修复步骤、验证安排和实施授权。",
          "input": "选定修复方案、回归范围及用户决定。",
          "output": "修复计划、回退条件和确认状态。"
        },
        {
          "id": "maintenance-implement",
          "label": "修复实现",
          "goal": "只修复获准内容，并保留故障回归保护。",
          "input": "已确认计划、实施授权及故障用例。",
          "output": "实际修复、必要测试和范围变化说明。"
        },
        {
          "id": "maintenance-verify",
          "label": "原故障验证、回归与独立审查",
          "goal": "重验原失败场景，检查相关功能是否退化。",
          "input": "修复差异、原失败步骤及回归要求。",
          "output": "原故障和回归记录、独立审查及验证限制。"
        },
        {
          "id": "maintenance-close",
          "label": "修复验收与关闭",
          "goal": "核对修复是否满足关闭条件并登记遗留项。",
          "input": "关闭条件、修复和验证证据。",
          "output": "验收结论、关闭建议及尚未完成事项。"
        }
      ]
    },
    {
      "id": "support",
      "label": "通用支持",
      "goal": "按需了解项目、环境工具及文档协作，不要求顺序执行。",
      "input": "具体问题、当前环境和已有资料。",
      "output": "相关阅读入口、用途说明和需要进一步确认的事项。",
      "stages": [
        {
          "id": "project-context",
          "label": "项目理解",
          "goal": "了解项目结构、业务术语和已有决定。",
          "input": "项目入口、已有文档和需要理解的问题。",
          "output": "有依据的项目说明、术语及未知项。"
        },
        {
          "id": "environment-tools",
          "label": "环境与工具",
          "goal": "了解工具用途、环境依赖及操作边界。",
          "input": "当前环境、工具配置和具体使用问题。",
          "output": "环境说明、可行操作及需要授权的事项。"
        },
        {
          "id": "docs-collaboration",
          "label": "文档与协作",
          "goal": "整理信息和交接材料，明确事实与责任。",
          "input": "已有文档、任务范围和协作目标。",
          "output": "清楚的说明、交接材料及待确认事项。"
        }
      ]
    }
  ];
  // Explicit membership, reviewed against the fixed source-manifest.json.
  // Full source evidence and the limits of each assignment live in the ledger.
  const readingMembership = {
    'skill-ask-matt':['project-context'],
    'skill-grill-with-docs':['feature-clarify','feature-design','maintenance-solution','docs-collaboration'],
    'skill-triage':['feature-clarify','maintenance-collect','maintenance-diagnose','docs-collaboration'],
    'skill-improve-codebase-architecture':['feature-impact','feature-design','maintenance-solution'],
    'skill-setup-matt-pocock-skills':['environment-tools'],
    'skill-to-spec':['feature-plan'],
    'skill-to-tickets':['feature-plan','maintenance-plan'],
    'skill-implement':['feature-implement','maintenance-implement'],
    'skill-implement-spec':['feature-implement'],
    'skill-wayfinder':['feature-clarify','feature-design','feature-plan'],
    'skill-retro':['environment-tools','docs-collaboration'],
    'skill-prototype':['feature-design','maintenance-solution'],
    'skill-diagnosing-bugs':['maintenance-collect','maintenance-diagnose','maintenance-solution','maintenance-implement','maintenance-verify'],
    'skill-research':['feature-impact','project-context'],
    'skill-tdd':['feature-plan','feature-implement','maintenance-plan','maintenance-implement'],
    'skill-domain-modeling':['feature-clarify','feature-design','project-context'],
    'skill-codebase-design':['feature-design','maintenance-solution','project-context'],
    'skill-code-review':['feature-verify','maintenance-verify'],
    'skill-pr':['feature-deliver','maintenance-close','docs-collaboration'],
    'skill-wizard':['environment-tools'],
    'skill-grill-me':['feature-clarify','feature-design','maintenance-solution'],
    'skill-grilling':['feature-clarify','feature-design','maintenance-solution'],
    'skill-handoff':['docs-collaboration'],
    'skill-teach':['project-context'],
    'skill-to-questionnaire':['docs-collaboration'],
    'skill-wait-what':['docs-collaboration'],
    'skill-writing-for-agents':['docs-collaboration']
  };
  const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/\s+/gu, ' ').trim();
  function readingScope(workflow, stageId) {
    const groups = workflow === 'all' ? readingGroups : readingGroups.filter(group => group.id === workflow);
    const stages = groups.flatMap(group => group.stages);
    return new Set(stageId === 'all' ? stages.map(item => item.id) : stages.filter(item => item.id === stageId).map(item => item.id));
  }
  function matchesReadingScope(cardId, workflow, stageId) {
    if (workflow === 'all' && stageId === 'all') return true;
    const allowed = readingScope(workflow, stageId);
    return (readingMembership[cardId] || []).some(id => allowed.has(id));
  }
  const cards = [...document.querySelectorAll('.skill-card')];
  const search = document.querySelector('#skill-search');
  const stage = document.querySelector('#stage-filter');
  const count = document.querySelector('#result-count');
  const empty = document.querySelector('#empty-state');
  const searchable = cards.map(card => normalize(card.textContent));
  let workflow = 'all';
  const workTypes = document.createElement('div');
  workTypes.id = 'work-type-filter';
  workTypes.className = 'controls work-type-filter';
  workTypes.setAttribute('role', 'group');
  workTypes.setAttribute('aria-label', '按工作类型筛选阅读资料');
  const buttons = [{id:'all',label:'全部'}, ...readingGroups].map(group => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.workflow = group.id;
    button.textContent = group.label;
    button.addEventListener('click', () => selectReadingWorkflow(group.id));
    workTypes.append(button);
    return button;
  });
  const stageLabel = stage.closest('label');
  (stageLabel || stage).before(workTypes);
  if (stageLabel?.firstChild?.nodeType === 3) stageLabel.firstChild.textContent = '流程阶段';
  const context = document.createElement('section');
  context.id = 'guide-stage-context';
  context.setAttribute('aria-label', '当前阅读阶段说明');
  context.setAttribute('aria-live', 'polite');
  count.before(context);
  const boundary = document.createElement('p');
  boundary.className = 'muted';
  boundary.textContent = '仅筛选本指南的固定版本阅读卡片，可跨阶段查阅；阶段目标可能需要多项技能或人工完成，不代表已授权操作、测试通过或验收完成。';
  count.before(boundary);
  cards.forEach(card => {
    card.dataset.workflowStages = (readingMembership[card.id] || []).join(' ');
  });
  function selectReadingWorkflow(id) {
    workflow = id === 'all' || readingGroups.some(group => group.id === id) ? id : 'all';
    stage.replaceChildren(new Option('全部阶段', 'all'));
    for (const group of readingGroups.filter(group => workflow === 'all' || group.id === workflow)) {
      const parent = workflow === 'all' ? document.createElement('optgroup') : stage;
      if (parent !== stage) parent.label = group.label;
      for (const item of group.stages) parent.append(new Option(item.label, item.id));
      if (parent !== stage) stage.append(parent);
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.workflow === workflow));
    filter();
  }
  function renderReadingContext() {
    const selectedStage = readingGroups.flatMap(group => group.stages).find(item => item.id === stage.value);
    const current = selectedStage || readingGroups.find(group => group.id === workflow) || {
      label:'全部阅读资料',goal:'按当前任务选择阅读入口，了解何时使用及能力边界。',
      input:'当前任务、已有资料和希望解决的问题。',output:'适用卡片、原文入口及仍需确认的事项。'
    };
    const heading = document.createElement('h3');
    heading.textContent = current.label;
    const fields = document.createElement('dl');
    for (const [label, key] of [['目标','goal'], ['需要准备','input'], ['应得到什么','output']]) {
      const term = document.createElement('dt');
      term.textContent = label;
      const text = document.createElement('dd');
      text.textContent = current[key];
      fields.append(term, text);
    }
    context.replaceChildren(heading, fields);
  }
  function filter() {
    const terms = normalize(search.value).split(' ').filter(Boolean);
    let visible = 0;
    cards.forEach((card, index) => {
      const matchesStage = matchesReadingScope(card.id, workflow, stage.value);
      card.hidden = !(matchesStage && terms.every(term => searchable[index].includes(term)));
      if (!card.hidden) visible += 1;
    });
    count.textContent = `显示 ${visible} / ${cards.length} 项技能`;
    empty.hidden = visible !== 0;
    renderReadingContext();
  }
  search.addEventListener('input', filter);
  stage.addEventListener('change', filter);
  document.querySelector('#reset-filters').addEventListener('click', () => {
    search.value = '';
    selectReadingWorkflow('all');
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
  selectReadingWorkflow('all');
})();
