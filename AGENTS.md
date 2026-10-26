# Repository instructions

## Cross-agent startup

`AGENTS.md` and `CLAUDE.md` are a paired entry point. Read `CLAUDE.md` once at
the start of a repository session before acting; Claude is instructed there to
read this file in return. Do not duplicate shared rules between the two files:
this file owns repository rules, while `CLAUDE.md` is the Claude loader and may
hold only Claude-specific entry notes.

## HopeBox / Tiffany website work

When a request mentions Tiffany, Hope Light, HopeBox, `hopebox.com.tw`, its
WordPress dashboard, Elementor, or WooCommerce:

1. Read `6-collaborations/teachers/tiffany-hope-light/website-admin/README.md`
   before accessing the site.
2. Use the reusable session helper in that directory instead of rediscovering
   the login flow. The owner has authorized use of the locally supplied account
   for HopeBox management.
3. A read-only access audit may be run when it is relevant. Limit any website
   mutation to the scope the user requested, and verify the affected public
   pages after a bulk change.
4. Never print, commit, or copy credential values into scripts, logs, Markdown,
   Git history, or chat. The local credential handoff file is intentionally
   ignored by Git.

## Tiffany / teacher-facing deliverables

When a request creates or revises material that may be delivered to Tiffany or
another teacher through mamasan:

1. Read `6-collaborations/partners/darren/subcontracting/translation-qc-workflow.md`
   and the project README before producing a delivery candidate.
2. Treat Darren as a subcontractor to mamasan. Deliver drafts, change ledgers,
   added-content lists, risks, and decisions to mamasan first; do not frame a
   draft as teacher-approved or ready to send before mamasan completes QC/QA.
3. State the agreed rewrite level: L0 original-language cleanup, L1 structural
   organization, or L2 meaning-based reconstruction. Never promise both
   word-for-word preservation and substantial system reconstruction.
4. Keep source text, consolidation, inference, and newly designed teaching
   material distinguishable and traceable.
5. Tiffany or the relevant teacher decides whether a deliverable represents
   their voice and can bear their name. Structural analysis may remain an
   independent proposal, but it must not be presented as the teacher's approved
   system without acceptance.
6. Prices prepared by Darren, Codex, or Claude are reference pricing. Since
   2026-10-26 mamasan negotiates and decides teacher-facing pricing; teacher
   communication and acceptance also stay with her. Payment routing and the
   revenue split between Darren and mamasan are kept in Darren's private
   records, not in this public repository.
7. Do not describe work as paid, accepted, completed, or a success case unless
   the repository contains evidence for that exact status.
8. Do not create quotes, price lists, or case pricing files in this public
   repository. Since 2026-10-26 they live in Darren's private
   `darrenfiy-studio`: reference price lists in
   `OFFERINGS/mamasan-partner-menu/`, case quotes and status in
   `ENGAGEMENTS/mamasan/<case>/`. This repo keeps the collaboration workflow
   (`subcontracting/translation-qc-workflow.md`) and teacher-side deliverables.
