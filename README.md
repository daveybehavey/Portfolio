# Portfolio site

This is a Next.js + Tailwind portfolio website for showcasing projects and attracting small-business clients.

## Run locally

From this folder in a terminal:

```powershell
npm install
npm run dev
```

**Open this exact URL:** [http://127.0.0.1:3010](http://127.0.0.1:3010)

The dev script uses **port 3010** and host **127.0.0.1** on purpose so you are not fighting whatever is already bound to port 3000, and so `localhost` IPv6 quirks are less likely to bite you.

**Windows shortcut:** double-click `dev.bat` in this folder (it runs `npm install` if needed, then `npm run dev`).

## Edit content

- Main page + project cards: `src/app/page.tsx`
- Site metadata (title/description): `src/app/layout.tsx`
- Global styles: `src/app/globals.css`

