import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildArchiveGroups,
  buildCategoryGroups,
  buildSidebarCounts,
  buildTagCounts,
  resolveDocsState,
  toggleTagSearch,
} from '../static/js/docs-sidebar.mjs';

const docs = [
  {
    slug: 'ubuntu-24-04-initial-setup',
    title: '从零开始 Ubuntu 24',
    date: '2026-08-18',
    category: 'Linux',
    tags: ['Ubuntu', 'Zsh'],
  },
  {
    slug: 'install-ubuntu-24-04-lts',
    title: '安装 Ubuntu 24.04 LTS',
    date: '2026-07-10',
    category: 'Linux',
    tags: ['Ubuntu', '系统'],
  },
  {
    slug: 'simple-made-easy',
    title: 'Simple Made Easy',
    date: '2026-04-25',
    category: '读后感',
    tags: ['开发', '思考'],
  },
];

test('侧边栏查询参数会切换视图并筛选文档', () => {
  assert.deepEqual(resolveDocsState('?view=category', docs), {
    view: 'category',
    label: '目录',
    docs,
  });

  const tagged = resolveDocsState('?tag=Ubuntu', docs);
  assert.equal(tagged.view, 'list');
  assert.equal(tagged.label, '标签：Ubuntu');
  assert.deepEqual(tagged.docs.map((doc) => doc.slug), [
    'ubuntu-24-04-initial-setup',
    'install-ubuntu-24-04-lts',
  ]);

  const archived = resolveDocsState('?year=2026', docs);
  assert.equal(archived.label, '年份：2026');
  assert.equal(archived.docs.length, 3);
});

test('目录和归档按线上页面的折叠层级分组', () => {
  const categories = buildCategoryGroups(docs);
  assert.deepEqual(categories.map((group) => [group.name, group.docs.length]), [
    ['Linux', 2],
    ['读后感', 1],
  ]);

  const archive = buildArchiveGroups(docs);
  assert.equal(archive[0].year, '2026');
  assert.deepEqual(archive[0].months.map((month) => [month.month, month.docs.length]), [
    [8, 1],
    [7, 1],
    [4, 1],
  ]);
});

test('文档首页加载侧边栏交互模块', async () => {
  const html = await readFile(new URL('../docs/index.html', import.meta.url), 'utf8');
  assert.match(html, /<script type="module" src="\/static\/js\/docs-sidebar\.mjs"><\/script>/);
});

test('侧边栏总数和每个标签数量由实际文章计算', () => {
  assert.deepEqual(buildSidebarCounts(docs), {
    docs: 3,
    categories: 2,
    tags: 5,
    archives: 1,
  });
  assert.deepEqual([...buildTagCounts(docs)], [
    ['Ubuntu', 2],
    ['Zsh', 1],
    ['系统', 1],
    ['开发', 1],
    ['思考', 1],
  ]);
});

test('边界：空文章列表计数为零，缺少分类时进入未分类', () => {
  assert.deepEqual(buildSidebarCounts([]), {
    docs: 0,
    categories: 0,
    tags: 0,
    archives: 0,
  });
  assert.equal(buildCategoryGroups([{ ...docs[0], category: '' }])[0].name, '未分类');
});

test('多个标签使用交集筛选并完整显示已选条件', () => {
  const state = resolveDocsState('?tag=Ubuntu&tag=Zsh&view=tag', docs);
  assert.equal(state.view, 'tag');
  assert.equal(state.label, '标签：Ubuntu + Zsh');
  assert.deepEqual(state.docs.map((doc) => doc.slug), ['ubuntu-24-04-initial-setup']);
});

test('标签切换保留当前视图并支持再次点击取消', () => {
  const added = new URLSearchParams(toggleTagSearch('?tag=Ubuntu&view=tag', 'Zsh'));
  assert.deepEqual(added.getAll('tag'), ['Ubuntu', 'Zsh']);
  assert.equal(added.get('view'), 'tag');

  const removed = new URLSearchParams(toggleTagSearch(added.toString(), 'Ubuntu'));
  assert.deepEqual(removed.getAll('tag'), ['Zsh']);
  assert.equal(removed.get('view'), 'tag');
});
