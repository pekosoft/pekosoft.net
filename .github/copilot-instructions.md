# Project instructions

## Commit titles

Always write Git commit titles in the past tense, both when suggesting titles and when creating commits. Use "Fixed", "Added" or "Updated", not "Fix", "Add" or "Update".

**Strict rule: never end a commit title with a period.** Apply this to suggested titles and actual Git commit subjects.

## Mandatory session startup

Before any other task in every session:

1. Start or verify `http://localhost:8000` using a PHP rewrite router that mirrors the routes and redirects in [`.htaccess`](../.htaccess). Keep localhost on HTTP and do not replace an existing listener without checking it.
2. Validate clean tool and root-page URLs, canonical links, implementation-URL redirects, query-string preservation, static resources and missing-page responses.
3. Reset the shared browser to 100% zoom before reviewing the site. Verify browser zoom where the available tools permit it; page scale or device pixel ratio alone is not proof of browser zoom.
4. Show the rendered page and report startup pass/fail, explicitly identifying any checks that could not be verified. Keep the local server running for subsequent work.

## Production deployment

Keep tests, local tooling, editor and agent configuration, and development documentation in GitHub, not on Host1. Deploy only files needed to run the website.

When adding repository-only files, keep the workflow's push path filters, incremental deployment exclusions, full-sync exclusions in [deploy.yml](workflows/deploy.yml), and [`.ftpignore`](../.ftpignore) consistent. Do not exclude assets or content needed by the running website.

Before creating or changing code, read and follow the mandatory [Code naming convention](../pekosoft.md#code-naming-convention).
Apply it to every new or renamed identifier, including internal registration names.

Before creating or changing user-facing text, read and follow the mandatory [User-facing writing convention](../pekosoft.md#user-facing-writing-convention).
Describe function and behavior, not interface colors, pixel sizes, line thicknesses, font names or decorative styling. Apply this across the entire site, including Help, tooltips, accessibility descriptions, About and History.
