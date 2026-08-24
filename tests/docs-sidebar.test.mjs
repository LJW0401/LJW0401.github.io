import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildArchiveGroups,
  buildCategoryGroups,
  resolveDocsState,
} from '../static/js/docs-sidebar.mjs';

const docs = [
  {
    slug: 'ubuntu-24-04-initial-setup',
    title: '从零开始 Ubuntu 24',
    date: '2026-08-18',
    tags: ['Ubuntu', 'Zsh'],
  },
  {
    slug: 'install-ubuntu-24-04-lts',
    title: '安装 Ubuntu 24.04 LTS',
    date: '2026-07-10',
    tags: ['Ubuntu', '系统'],
  },
  {
    slug: 'simple-made-easy',
    title: 'Simple Made Easy',
    date: '2026-04-25',
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
