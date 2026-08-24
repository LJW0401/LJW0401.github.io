const CATEGORY_ORDER = ['AI协作', 'Linux', '嵌入式', '工程笔记', '读后感', '随笔'];

const VIEW_LABELS = {
  list: '全部',
  category: '目录',
  tag: '标签',
  archive: '归档',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function resolveDocsState(search, docs) {
  const params = new URLSearchParams(search);
  const requestedView = params.get('view');
  const view = ['category', 'tag', 'archive'].includes(requestedView)
    ? requestedView
    : 'list';
  const tag = params.get('tag');
  const year = params.get('year');
  const filteredDocs = docs.filter((doc) => {
    const tagMatches = !tag || doc.tags.includes(tag);
    const yearMatches = !year || doc.date.startsWith(`${year}-`);
    return tagMatches && yearMatches;
  });

  let label = VIEW_LABELS[view];
  if (tag) label = `标签：${tag}`;
  else if (year) label = `年份：${year}`;

  return { view, label, docs: filteredDocs };
}

export function buildCategoryGroups(docs) {
  const grouped = new Map();
  for (const doc of docs) {
    const category = doc.category || '未分类';
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(doc);
  }

  const categories = [
    ...CATEGORY_ORDER.filter((name) => grouped.has(name)),
    ...grouped.keys().filter((name) => !CATEGORY_ORDER.includes(name)),
  ];
  return categories
    .map((name) => ({ name, docs: grouped.get(name) }));
}

export function buildArchiveGroups(docs) {
  const years = new Map();
  for (const doc of docs) {
    const [year, monthText] = doc.date.split('-');
    const month = Number(monthText);
    if (!years.has(year)) years.set(year, new Map());
    const months = years.get(year);
    if (!months.has(month)) months.set(month, []);
    months.get(month).push(doc);
  }

  return [...years.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort(([a], [b]) => b - a)
        .map(([month, monthDocs]) => ({ month, docs: monthDocs })),
    }));
}

function renderTreeDoc(doc) {
  return `
    <a class="tree-doc" href="/docs/${encodeURIComponent(doc.slug)}">
      <span class="tree-doc-title">${escapeHtml(doc.title)}</span>
      <span class="tree-doc-date">${escapeHtml(doc.date)}</span>
    </a>`;
}

function renderCategoryView(docs) {
  const groups = buildCategoryGroups(docs);
  return `<div class="tree-view">${groups.map((group) => `
    <details class="tree-node">
      <summary><span class="tree-name">${escapeHtml(group.name)}</span><span class="tree-count">${group.docs.length} 篇</span></summary>
      <div class="tree-body">${group.docs.map(renderTreeDoc).join('')}</div>
    </details>`).join('')}
  </div>`;
}

export function buildTagCounts(docs) {
  const counts = new Map();
  for (const doc of docs) {
    for (const tag of doc.tags) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return counts;
}

export function buildSidebarCounts(docs) {
  return {
    docs: docs.length,
    categories: buildCategoryGroups(docs).length,
    tags: buildTagCounts(docs).size,
    archives: buildArchiveGroups(docs).length,
  };
}

function renderTagCatalog(allDocs, selectedTag, tagOrder) {
  const counts = buildTagCounts(allDocs);
  const tags = [...tagOrder, ...counts.keys()].filter((tag, index, list) => (
    counts.has(tag) && list.indexOf(tag) === index
  ));
  return `<div class="tag-catalog">${tags.map((tag) => {
    const active = tag === selectedTag;
    const href = active ? '/docs?view=tag' : `/docs?tag=${encodeURIComponent(tag)}&view=tag`;
    return `
    <a class="tag-card${active ? ' active' : ''}" href="${href}">
      <span class="tag-card-name">${escapeHtml(tag)}</span>
      <span class="tag-card-count">${counts.get(tag)} 篇</span>
    </a>`;
  }).join('')}
  </div>`;
}

function renderArchiveView(docs) {
  return `<div class="archive-view">${buildArchiveGroups(docs).map((year) => {
    const yearCount = year.months.reduce((total, month) => total + month.docs.length, 0);
    return `
    <details class="archive-year">
      <summary><span class="archive-key">${year.year}</span><span class="tree-count">${yearCount} 篇</span></summary>
      <div class="archive-months">${year.months.map((month) => `
        <details class="archive-month">
          <summary><span class="archive-key">${month.month}月</span><span class="tree-count">${month.docs.length} 篇</span></summary>
          <div class="archive-docs">${month.docs.map(renderTreeDoc).join('')}</div>
        </details>`).join('')}
      </div>
    </details>`;
  }).join('')}
  </div>`;
}

function renderDocList(docs) {
  return `<div class="doc-list">${docs.map((doc) => doc.html).join('')}</div>`;
}

function readDocs(document) {
  return [...document.querySelectorAll('.doc-list .doc-row')].map((row) => {
    const href = row.getAttribute('href') || '';
    const metaParts = [...row.querySelectorAll('.meta > span')].map((span) => span.textContent.trim());
    return {
      slug: href.split('/').filter(Boolean).at(-1),
      title: row.querySelector('.title')?.textContent.trim() || '',
      date: metaParts.find((text) => /^\d{4}-\d{2}-\d{2}$/.test(text)) || '',
      category: row.dataset.category || '未分类',
      tags: [...row.querySelectorAll('.tag-mini')].map((tag) => tag.textContent.trim()),
      html: row.outerHTML,
    };
  });
}

function renderSidebarData(document, docs, tagOrder) {
  const totals = buildSidebarCounts(docs);
  const navCounts = {
    '/docs': totals.docs,
    '/docs?view=category': totals.categories,
    '/docs?view=tag': totals.tags,
    '/docs?view=archive': totals.archives,
  };
  for (const link of document.querySelectorAll('.side-nav a')) {
    const count = link.querySelector('.count');
    if (count && Object.hasOwn(navCounts, link.getAttribute('href'))) {
      count.textContent = navCounts[link.getAttribute('href')];
    }
  }

  const counts = buildTagCounts(docs);
  const tags = [...tagOrder, ...counts.keys()].filter((tag, index, list) => (
    counts.has(tag) && list.indexOf(tag) === index
  ));
  const tagList = document.querySelector('.tag-list');
  if (tagList) {
    tagList.innerHTML = tags.map((tag) => `
      <a class="tag" href="/docs?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}<span class="num">${counts.get(tag)}</span></a>`).join('');
  }

  const archiveList = document.querySelector('.archive-list');
  if (archiveList) {
    archiveList.innerHTML = buildArchiveGroups(docs).map((year) => {
      const count = year.months.reduce((total, month) => total + month.docs.length, 0);
      return `<li><a href="?year=${encodeURIComponent(year.year)}">${escapeHtml(year.year)}<span class="ar-count">${count}</span></a></li>`;
    }).join('');
  }
}

function setSidebarState(document, params, view) {
  for (const link of document.querySelectorAll('.side-nav a')) link.classList.remove('active');
  const viewHref = view === 'list' ? '/docs' : `/docs?view=${view}`;
  document.querySelector(`.side-nav a[href="${viewHref}"]`)?.classList.add('active');

  const selectedTag = params.get('tag');
  for (const link of document.querySelectorAll('.tag-list .tag')) {
    const tag = new URL(link.href).searchParams.get('tag');
    link.classList.toggle('active', tag === selectedTag);
  }

  const selectedYear = params.get('year');
  for (const link of document.querySelectorAll('.archive-list a')) {
    const year = new URL(link.href).searchParams.get('year');
    link.classList.toggle('active', year === selectedYear);
  }
}

export function initDocsSidebar(document, location) {
  const allDocs = readDocs(document);
  const toolbar = document.querySelector('.shell > .main > .toolbar');
  if (!toolbar) return;

  const contentRoot = document.createElement('div');
  contentRoot.id = 'docs-content';
  toolbar.before(contentRoot);
  let contentNode = toolbar;
  while (contentNode) {
    const nextNode = contentNode.nextSibling;
    contentRoot.append(contentNode);
    contentNode = nextNode;
  }

  const params = new URLSearchParams(location.search);
  const state = resolveDocsState(location.search, allDocs);
  const tagOrder = [...document.querySelectorAll('.tag-list .tag')]
    .map((link) => new URL(link.href).searchParams.get('tag'))
    .filter(Boolean);
  renderSidebarData(document, allDocs, tagOrder);

  let body;
  if (state.view === 'category') body = renderCategoryView(state.docs);
  else if (state.view === 'archive') body = renderArchiveView(state.docs);
  else if (state.view === 'tag') {
    body = renderTagCatalog(allDocs, params.get('tag'), tagOrder);
    if (params.has('tag')) body += renderDocList(state.docs);
  } else body = renderDocList(state.docs);

  contentRoot.innerHTML = `
    <div class="toolbar">
      <div class="left">共 <strong>${state.docs.length}</strong> 篇 · 当前：<strong>${escapeHtml(state.label)}</strong></div>
    </div>
    ${body}`;
  setSidebarState(document, params, state.view);
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  initDocsSidebar(document, window.location);
}
