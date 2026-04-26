# Bookkeeper Deployment Workflow

后续修改这个项目，统一按下面流程走，不再临时判断。

## 1. 本地开发

1. 在本地修改代码。
2. 安装依赖：

```bash
npm.cmd ci
```

3. 本地启动：

```bash
npm.cmd run dev
```

4. 本地验证功能无误后再继续。

## 2. 本地构建检查

提交前先跑：

```bash
npm.cmd run build
npm.cmd run lint
```

说明：

- `build` 必须通过。
- `lint` 如果报的是历史遗留问题，要明确区分是不是本次改动引入。
- 如果 Vite 在受限环境里因为 `spawn EPERM` 失败，需要在非沙箱环境下重跑。

## 3. Git 提交

按顺序执行：

```bash
git status --short
git add -A
git commit -m "描述本次改动"
git push origin main
```

推送后先确认：

```bash
git log --oneline -1
```

当前分支默认是 `main`，生产部署也以 `main` 为准。

## 4. Supabase 变更同步

如果本次改动涉及数据库字段，必须在 Supabase SQL Editor 手动执行对应 SQL。

例如这次 `tag` 字段上线时执行的是：

```sql
ALTER TABLE records
ADD COLUMN IF NOT EXISTS tag text DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'records_tag_check'
  ) THEN
    ALTER TABLE records
    ADD CONSTRAINT records_tag_check
    CHECK (tag IN ('', '值得花', '不该花'));
  END IF;
END $$;
```

原则：

- 代码上线前后，数据库结构必须和代码保持一致。
- 如果缺字段，线上页面可能能打开，但保存数据会失败。

## 5. Vercel 自动部署检查

推送到 GitHub 后，不要默认认为线上已经更新，必须检查 Vercel。

项目：
`bookkeeper`

生产地址：
[https://bookkeeper-red.vercel.app](https://bookkeeper-red.vercel.app)

检查方法：

1. 打开 Vercel 项目的 `Deployments` 页面。
2. 看最上面 `Current` 的那条 deployment。
3. 确认它对应的 commit 是刚刚推送的最新 commit。

如果 `Current` 对应的不是最新 commit，说明线上还没切过去。

## 6. 如果 Vercel 没自动更新

这次已经验证过，Vercel 可能出现下面这种情况：

- GitHub 已经收到最新 commit。
- 本地功能正常。
- 但 `bookkeeper-red.vercel.app` 仍然指向旧 deployment。

处理方式：

1. 打开 Vercel 项目。
2. 进入 `Deployments`。
3. 右上角点 `...`。
4. 选择 `Create Deployment`。
5. `Commit or Branch Reference` 选择 `main` 或最新 commit。
6. 确认创建。
7. 等新的 deployment 变成 `Ready`。
8. 确认这条 deployment 带有 `Production` 和 `Current` 标记。

只有看到最新 commit 成为 `Current`，才算真正上线。

## 7. 线上验收

部署完成后，不直接相信浏览器已有页面。

验收顺序：

1. 打开线上地址：
   [https://bookkeeper-red.vercel.app](https://bookkeeper-red.vercel.app)
2. 如果页面看起来还是旧版，先强制刷新：
   `Ctrl + Shift + R`
3. 如果是 PWA 或手机主屏幕入口：
   彻底关闭后重新打开。
4. 再做一轮关键路径验证：
   - 新增记录
   - 编辑记录
   - 统计页关键功能
   - 本次新增功能

## 8. 判断是缓存问题还是部署问题

如果线上没更新，先这样判断：

- 本地 `npm.cmd run dev` 正常，说明代码本身大概率没问题。
- GitHub `main` 已经是最新 commit，说明 push 没问题。
- 如果 Vercel `Current` 还是旧 commit，这是部署问题，不是浏览器缓存。
- 只有当 Vercel `Current` 已经是最新 commit，但浏览器还显示旧页面，才优先怀疑缓存。

## 9. 固定结论

以后每次发版，统一按这个闭环：

1. 本地改代码
2. 本地 `build`
3. `git push origin main`
4. 执行必要的 Supabase SQL
5. 去 Vercel `Deployments` 确认最新 commit 成为 `Current`
6. 强刷线上页面并做关键功能验收

不要跳过第 5 步。
