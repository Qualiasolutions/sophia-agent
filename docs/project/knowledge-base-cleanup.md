# Knowledge Base Change Log (Manual Split)

The repository currently has a large set of Knowledge Base edits checked into the working tree (see `Knowledge Base/**`). To keep future refactors focused and reviewable, lift these content edits into their own branch/commit before shipping code changes.

## Suggested Process
1. Run `git status -- Knowledge\ Base` to confirm the files.
2. Create a dedicated branch (for example `docs/knowledge-base-sync`) and commit the Knowledge Base edits there.
3. Rebase/merge that branch separately so engineering PRs stay narrowly scoped.
4. Update this log with the date/branch once the cleanup lands.

## Pending Snapshot

```
$(git status --short -- "Knowledge Base" || echo "(status unavailable in CI)")
```

> Keep this file until the Knowledge Base tree is clean; delete after the backlogged changes are merged.
