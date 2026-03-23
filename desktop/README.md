# Own AI Desktop

Electron wrapper for the existing frontend, packaged for macOS and Windows.

## Local desktop dev

```bash
cd desktop
npm install
npm run dev
```

## Build unpacked app

```bash
npm run build
```

## Build installers

```bash
# macOS (.dmg + .zip)
npm run dist:mac

# Windows (.exe NSIS + portable)
npm run dist:win
```

Output is generated in `desktop/dist/`.

## Notes

- This wrapper serves the existing web UI from `frontend/dist`.
- Set production backend URL in `frontend/.env` (`VITE_BACKEND_URL`) before packaging.
- For public distribution on macOS/Windows, add code signing and notarization credentials in CI.
