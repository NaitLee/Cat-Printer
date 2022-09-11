
# Contributing

Thank you for looking into this project.

Let’s keep short & be positive:

## Communication

1. Use Issue for a potential bug and Discussion for feature request.  
  But do whichever you feel better. This is just a hint.

2. Consider you’re interacting with the world. Use English.  
  But you may also use another if you’re confident enough that someone in community could understand it & help you.

## Sharing

Let’s just call it “sharing”. You can of course share your experience of this project with your friends, online or offline.

This is also one step toward Software Freedom.

But note that, if necessary, disclaim that you have no relationship with any of the printer vendors. Neither the author(s) here.

Also for avoiding potential hassle, don’t mention the “original” or “official” app(s).

## Translating

See [i18n.md](./i18n.i18n/i18n.md) for what to do.

As a special note, try to correctly use marks & symbols:

- Use `“”‘’` in place of `"'`, except when in a terminal
- Localize marks right, e.g. `“”` in English shall correspond to `„“` in German or `»«` in French, etc.
- Keep spaces consistent, e.g. `“”` will be rendered full-width in CJK font, so leave no space around them in CJK context

Hint: a Keyboard Layout other than default maybe helpful, especially those with AltGr/Level 3 Shift keys.

You can seek for help here, to do grammar extensions & leftovers.

## Coding

1. Any contribution welcome.

2. See file `TODO` for what’s next. But don’t limit imagination, do whatever you think is useful.

3. Keep the existing “way”. Here are details:

- Think about the Unix Philosophy before doing. Try to suck less.
- Follow coding style & naming convention.
- Think about the use cases: Web UI and/or command-line backend, average and/or advanced users
- Test the code well. Document if necessary.
- Don’t forget internationalization & necessary accessibility features.

4. Finally, “rules”. Just skim these, don’t feel pressure as I trust you won’t mistake:

- Don’t leak development/test cache/junk to the repo. Please.  
  And never put pictures/executable/any big binary to this repo. Try uploading in an issue/discussion instead.
- No more 3rd-party blackbox dependencies/assets, without explaining & using its most functionality.  
  Consider using existing system programs, or implementing enough from scratch.  
  If that really happened, make it optional (i.e. don’t fail the load just for its non-existence),  
  And don’t push the dependency source code.  
  For big dependencies, if you really love it, it’s suggested to fork this repo & develop in your own way.  
- Don’t connect to an online service to fetch resource.  
  If necessary, ask the user first. Again, such functionality shall be elsewhere.
- Don’t make anti-features. Don’t be someone yourself dislike most.  
  Examples:
  - You can do: simple borders & stickers, scribbling, simple PostScript interpreter, another common printing protocol
  - Considering previous rule, discuss first: Bar/QR Code, formula, Native (non-Web) UI
  - You shouldn’t do: Way too fancy UI/editor, Cloud storage, camera integration & OCR
  - Never consider: online account, non-free service integration, analysis/telemetry
- Please don’t violate the license (GNU General Public License version 3)  
  Modification to existing files are released under its existing license,  
  mostly GPL3 or CC0, according to statement in readme.
- If you want to preserve your copyright & use other license, create new file(s) for your work.  
  But, never release your code under any non-free license.

5. You can take any part of this project to do something else. It’s also contribution! Let the ideas spread!

## Footnote

Nothing could go wrong. Trust yourself & try your best.

Let’s together build it better. Thank you.
