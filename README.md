# Leon Ops Dashboard

A modern task dashboard (shadcn/ui + Tailwind v4) that reads tasks from GitHub issues on `codesidh/leon-ai-assistant`.

## Local dev

```bash
cd dashboard
npm i
npm run dev
```

### Environment

Create `dashboard/.env.local` (do **not** commit):

```bash
GITHUB_OWNER=codesidh
GITHUB_REPO=leon-ai-assistant
GITHUB_TOKEN=github_pat_...  # repo-scoped token that can read issues
```

Then open http://localhost:3000

## Task workflow

Create a GitHub issue and apply exactly one status label:
- `status:not-started`
- `status:in-progress`
- `status:completed`
- `status:archived`

The dashboard groups issues by these labels.

## Notes

- GitHub Projects v2 integration is desirable, but creating/managing Projects may require additional GitHub token permissions.
