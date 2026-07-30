# Budge

A modern, installable rewrite of Nat Pryce's 1994 Tcl/Tk arcade puzzle.
It uses one dependency-free web codebase for desktop browsers, the web,
Android, and iOS, with keyboard, touch buttons, and swipe controls.

Play at https://emosenkis.github.io/budge/.

## Run

```sh
npm test
npx serve .
```

Open the shown URL. Use **F1** to play, arrow keys to move, **F2** to pause,
**F3** to lose a life, and **F8** to end the game. On mobile, use the
direction pad or swipe on the board. Install it from the browser's
"Add to Home Screen" or "Install app" action for a standalone offline app.

The [original Tcl game](https://github.com/npryce/budge) is the behavioral
specification. Game code is licensed under GPLv3; see [COPYRIGHT](COPYRIGHT)
and [GPLv3.txt](GPLv3.txt). Original images and level data are additionally
available under CC BY-SA 4.0, as stated in `COPYRIGHT`.
