# Contributing to Glowshot

Thanks for being here! 💜 Glowshot is built in the open and every contribution — big or small — is welcome.

## Ways to help

- ⭐ **Star the repo** — the single easiest way to help it grow.
- 🐛 **Report bugs** — [open an issue](https://github.com/your-username/glowshot/issues) with steps to reproduce.
- 💡 **Suggest features** — got an idea? We'd love to hear it.
- 🎨 **Add presets** — new gradients, mesh backgrounds, or shadow styles are a great first contribution (see `src/lib/presets.ts`).
- 🧑‍💻 **Fix or build** — grab anything from the [roadmap](./README.md#-roadmap).

## Development setup

```bash
git clone https://github.com/your-username/glowshot.git
cd glowshot
npm install
npm run dev
```

The app is a client-side Next.js App Router project. Key places:

| Path | What lives there |
|------|------------------|
| `src/components/` | UI — `Editor`, `Canvas`, `Sidebar`, `WindowFrame`, `CodeBlock` |
| `src/lib/presets.ts` | Backgrounds, shadows, aspect ratios, code themes |
| `src/lib/store.ts` | Global editor state (Zustand) |
| `src/lib/export.ts` | PNG export (copy / download) |

## Pull request checklist

1. Fork and create a branch: `git checkout -b feat/my-thing`.
2. Make your change. Keep it focused and match the surrounding style.
3. Run `npm run build` and `npm run lint` — both must pass.
4. Open a PR with a clear description (before/after screenshots for visual changes are 🔥).

## Adding a new gradient (2-minute first PR)

Open `src/lib/presets.ts` and add an entry to `GRADIENTS`:

```ts
{ id: "my-gradient", name: "My Gradient", type: "gradient",
  css: "linear-gradient(135deg, #ff8a00 0%, #e52e71 100%)" },
```

That's it — it shows up in the picker automatically. 🎉

## Code of conduct

Be kind. Assume good intent. We're all here to build something delightful.
