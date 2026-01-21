# Task: Switch to WebM for Cross-Browser Compatibility

## Status
- [ ] Update README.md to use `demo.webm`
- [ ] Ensure formatting supports maximum browser compatibility (using GitHub raw URLs)
- [ ] Verify file presence and push

## Details
User requested to switch to `demo.webm` and explicitly asked for "every browser" compatibility. WebM is a modern format, and serving it via GitHub raw headers is the most reliable way to bypass browser cross-origin locks on local relative path rendering in some contexts.
