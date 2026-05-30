Put the ordered step images in this folder when they are ready.

Then update `STEP_IMAGE_MAP` in `src/App.jsx` so each key points to the
matching image path, for example:

```js
"live-01": `${import.meta.env.BASE_URL}step-images/live-01.png`,
```

Keep the numbering aligned with the app sequence:

- `live-01` to `live-04`
- `retry-01`
- `buy-01` to `buy-06`
- `sell-01` to `sell-06`
- `after-session-01` to `after-session-19`
