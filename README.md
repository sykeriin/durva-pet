# Durva Pet

A pixel-art Durva who lives in your browser or on your desktop. Poke him, flirt back, study with him, dress him up.

- **Chrome extension** (`extension/`): he wanders along the bottom of every page.
- **Desktop pet** (`desktop/`): Electron, transparent click-through window, tray menu.
- **Shared engine** (`core/pet.js`) and **sprites** (`assets/sprites`, 84 poses, each with a cat-boy version).

## What he does

- Poke, double-click (dance), right-click for the menu, drag him around, hover to be loved.
- Sip and snack: chai, coffee, hot chocolate, water, cookie, pizza (at a table, on a chair).
- Brain mode: lock in and study, laptop, reading, headphones, "busy, ignore me" (poke him five times and he snaps), 20-20-20 look-away reminder.
- Chaos: flirt, steal a line, Spidey mode (wall, ceiling), hang around, step off screen and come back.
- Focus: pomodoro 25/5, 45 minutes, stopwatch, custom timer. He studies or drinks while you do.
- Outfits: eight presets plus your own (top, pants, shoes, hair). Cat boy mode. Optional gentle nudges.

## Install

Extension: `chrome://extensions` → Developer mode → Load unpacked → pick `extension/`.

Desktop:

```bash
cd desktop
npm install
npm start
```

## Develop

Sprites are generated, not drawn by hand:

```bash
node scripts/gen-sprites.mjs   # writes assets/sprites/*.png
node scripts/sync.mjs          # copies the engine + inlined sprites into extension/ and desktop/app/
```

Edit `core/pet.js`, then run `sync` again. `extension/demo.html` runs the pet in a plain page.
