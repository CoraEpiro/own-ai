# Stitch Reference Folder

Place exported Google Stitch screenshots and mockups here so Codex can use them while implementing the frontend.

Recommended structure:

```text
.ai/stitch/
  auth/
    desktop.png
    mobile.png
    notes.md
  landing/
    desktop.png
    mobile.png
  chat/
    desktop.png
    tablet.png
    mobile.png
  dashboard/
    desktop.png
```

Recommended naming:

- `desktop.png`
- `tablet.png`
- `mobile.png`
- `loading.png`
- `empty.png`
- `modal.png`

If you have multiple iterations, use suffixes like:

- `desktop-v1.png`
- `desktop-v2.png`

Helpful extra context in `notes.md`:

- Which screenshot is the latest
- Which parts are strict vs flexible
- Which interactions are missing from the static design
- Any platform-specific intent for web, desktop, or mobile

Best practice:

- Export both full-screen and cropped detail shots for dense areas
- Include separate captures for hover, active, loading, and empty states when possible
- Keep the screenshots organized by feature so each spec can point to a small set
