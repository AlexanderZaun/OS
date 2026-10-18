# History, backups and GitHub

[Русский](<../backups.md>) · [English](<backups.md>) · [Contents](<README.md>)

Four mechanisms are distinct: action history gives up to 100 session undo steps; project.previous.json is a validated previous file-revision index; Recovery is a separate draft; a Git backup tag checkpoints source. None replaces backups of personal Data.

main stores published source. Version v0.2.1 combines the portable application, new folder layout, bilingual documentation and public website. Its checkpoint is backup/2026-10-18-presentation-v0.2.1. Previous v0.2.0/9dc7d2d remains intact. Download the runnable application from [Releases](https://github.com/AlexanderZaun/OS/releases/latest), not source ZIPs.

Checkpoints: backup/2026-10-17-before-application-menu (89320d4), backup/2026-10-17-application-menu (46e54bf), backup/2026-10-18-portable-v0.2.0 (9dc7d2d). These contain source, not a ready installation. Tags → Code/Download ZIP requires a developer build; older checkout paths may differ.

Every authorized publication creates an annotated backup tag for the new commit; preserve the previous remote tip too if no backup tag already covers it. Names are unique and dated in Europe/Minsk, with a suffix/time for repeated releases. Never move/delete published tags or rewrite history. Atomically push the branch and explicitly named new tags, then verify remote SHAs. This does not authorize automatic publication.

Personal projects, backups, settings and Recovery are excluded from the runnable ZIP. Back up your Data with the app closed and transfer external project folders separately.
