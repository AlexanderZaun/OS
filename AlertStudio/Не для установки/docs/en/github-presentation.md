# GitHub project presentation

[Русский](../github-presentation.md) · [English](github-presentation.md) · [Contents](README.md)

The user-facing website is https://alexanderzaun.github.io/OS/ and its English edition is https://alexanderzaun.github.io/OS/en/. It shows the application, real screenshots, features, startup instructions and ZIP download without a source tree. A public repository's Code tab remains GitHub's file browser; README cannot hide it.

Repository-root README.md/README.en.md introduce the application and link to ready releases. Developer instructions remain in Не для установки. About receives a description and website URL; source and application downloads have separate links.

Static site source lives in presentation; tools/build-presentation.mjs generates both languages. tools/capture-presentation.mjs captures the example scene in a separate profile without personal projects/data. tools/test-presentation.mjs checks RU/EN, links and 1440/900/390 px layouts. Screenshots show implemented features.

GitHub Pages uses a separate codex/alertstudio-pages branch containing only the static site and .nojekyll. tools/github-presentation.mjs inspects access, deploys the site and updates About after availability checks. Never replace unrelated Pages configuration or change repository privacy. Site updates accompany explicit publication; no paid services or background jobs are added.

For the next release update package.json, both guides/READMEs/release notes, build the presentation and run checks, then follow the portable procedure with a backup tag. Publish the ready ZIP in Releases before activating the website's new link. Existing assets are not overwritten.
