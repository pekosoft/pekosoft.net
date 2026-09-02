---
description: "Use when: reviewing Pekosoft in the browser, investigating visual or interaction defects, or reporting product issues."
---

# Browser Review

- Keep the shared browser on the page under review. After each meaningful visible change or interaction, show the rendered page before proceeding.
- Treat Playwright geometry, accessibility snapshots, DOM hit tests, and automation timeouts as diagnostic evidence only. They do not establish a user-facing defect on their own.
- Report a visual or interaction issue only after two independent checks support it. At least one must be visible in the shared browser at the user's current viewport and zoom.
- Use ordinary visible interactions whenever possible. If browser automation behaves differently from the shared page, report the automation limitation and do not call it a site issue.
- State hypotheses as hypotheses. Do not assign severity or propose a repair until the behavior is reproduced and its controlling code path is identified.
- Review one candidate issue at a time. Stop investigating a candidate when its evidence is contradicted; do not expand it into an unrelated audit.
- Separate known browser-instrumentation errors from website errors unless the page itself visibly fails or the application code produces the error.
- Before completing a review, return the shared browser to the affected page for each confirmed finding. If there are no confirmed issues, return it to the last tested official tool and say so.
