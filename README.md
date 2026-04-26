# Bookkeeper

轻量记账 PWA，支持双币种（`VND` / `RMB`）、账单识别、统计分析。

当前线上地址：
[https://bookkeeper-red.vercel.app](https://bookkeeper-red.vercel.app)

代码仓库：
[https://github.com/panpeng1225-lang/bookkeeper](https://github.com/panpeng1225-lang/bookkeeper)

## 常用命令

```bash
npm.cmd ci
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
```

## 部署流程

完整流程见：
[DEPLOYMENT_WORKFLOW.md](/C:/Users/41434/Desktop/spending_record_App/bookkeeper/DEPLOYMENT_WORKFLOW.md)

这份文档记录了：

- 本地修改后的标准验证顺序
- `git push origin main` 后如何确认 Vercel 是否真的切到最新部署
- 如果线上域名没有更新，如何在 Vercel 手动 `Create Deployment`
- Supabase schema 变更需要同步执行的 SQL
