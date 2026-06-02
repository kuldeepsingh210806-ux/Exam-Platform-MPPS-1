---
name: PDF Generation Approach
description: How PDFs are generated in the MPPS MCQ Tester app
---

PDF generation uses a pure browser approach: `printPrincipalReport()` and `printStudentResultPDF()` in `src/lib/pdf-utils.ts` open a new window with styled HTML and call `window.print()`. This requires zero external dependencies, works cross-browser, and produces professional output.

**Why:** jsPDF was considered but rejected to keep the bundle lean and avoid pnpm catalog changes. The HTML print approach is equally professional when styled with inline CSS.

**How to apply:** Any new PDF feature should follow the same pattern in `pdf-utils.ts` — build an HTML string with inline `<style>`, open with `window.open()`, write the HTML, then a `<script>window.onload = () => window.print()</script>` closes the loop.
