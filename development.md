
# Development

## Overview

This application have a Client/Server module, but just locally.

The backend is in Python 3, aiming to have fewest possible dependencies, and currently have just `bleak`.  
This can keep the core part simple, maximize reusability.

The Web frontend uses no “framework”. It shouldn’t, in my opinion.

The command-line interface (CLI) could invoke other commands to extend functionality.  
At the moment it may invoke `magick` and `gs`, for ImageMagick and Ghostscript respectively.

The Android version is built with [python-for-android](https://python-for-android.readthedocs.io/en/latest/).  
See [Android Readme](./build-android/README.md) to get started, but don’t forget to finish this document.

By the way, feel free to look at `dev-diary.txt`.

My workspace stack is Linux/GNU/Artix/KDE/VSCodium, if you’re interested.

## Get Dependencies

### Basic

0. Clone this repository
1. Install python3
2. Get Bleak BLE library:  
  `pip3 install bleak`

Alright, you are well done for basic development & debugging. See [files](#files) section for what all the files do.

For more stuffs, read on...

### Optional

Sorry, I’m not a dev package manager enthusiast.

If something better can be done to organize these, feel free to discuss.

- Install [ImageMagick](https://imagemagick.org/) and [Ghostscript](https://ghostscript.com/)
  - They have big chance to be pre-installed
  - With these you can enjoy more command line features
<!-- TODO make Node.js dep optional, let’s use Deno or Bun instead. -->
- Install TypeScript:  
  - It’s adviced to separate [Node.js/npm](https://nodejs.org/) executables from package manager, to avoid system inconsistency  
  - After setting up it, do `npm install --global typescript`. You may need root privilege on \*nix systems (prefix `sudo`)  
  - Now the `0-transpile.sh` will work, you’re ready to deal with compatibility
- Gather Bleak:
  - Get [Bleak package](https://pypi.org/project/bleak/#files), the `.whl` file in “Built Distribution”
  - `.whl` is a zip file. Unzip it as usual, put `bleak` to the folder `build-common/`
  - Now that you can bundle a “pure” release
  - Get [Bleak winrt](https://pypi.org/project/bleak-winrt/#files), pay special attention to version, e.g.:
    - `bleak_winrt-1.1.1-cp310-cp310-win32.whl` means to be used with CPython 3.10 under 32-bit Windows (or WoW64)
  - Unzip it, put `bleak_winrt` to the folder `build-common/`
  - Now that you can also bundle a “windows” release
  - Also see [Files](#files) section about `bundle.py`
- Get an Windows embeddable Python, extract to `build-common/python-w32`
  - You may remove some “bloats”, notably `libssl`, `libcrypto`, `sqlite3` and `pydoc`, of both `dll`/`pyd` files and inside `python<version>.zip`, if there are any
  - Now you’re able to bundle a “windows” edition, via `python3 bundle.py -w`
- Get a [vConsole](https://www.npmjs.com/package/vconsole) script, put to `www` as `vconsole.js`  
  Now you’re ready to debug in browsers without a dev panel, by double-tapping status message

## Files

- `server.py` - A Web server that:
  - Is single threaded & with static handler, for some reasons
  - Serves static Web files, that are in folder `www`
  - Tries to open a Web browser once launched, unless specify `-s`
  - Only listens to localhost, unless specify `-a`
  - Handles API requests via `POST` requests
  - Handles frontend configuration
  - Very basic CUPS/IPP feature included
  - Interacts with `printer.py`, for the printer driver
- `printer.py` - The core printer driver:
  - Have the `PrinterDriver` class, to be reused
  - Have a command-line interface. Can be invoked in a shell, to do things directly
- `printer_lib/*` - Some helpers:
  - These are also intended to be reused, and are in Public Domain under CC0 license
  - Especially `commander.py`, which contains the printers’ BLE protocol
- `.pylintrc` - Pylint RC file:
  - Include it for better experience browsing the code

- `www/main.js` - Main frontend script:
  - The script for direct modification in development
  - No need to care “compatibility”. Transpile the scripts when release
- `www/image.js` - Image manipulation functions:
  - Now is transpiled from `wasm/image.ts`, which is intended for WebAssembly implementation, but unfortunately slower with it
  - Have some grayscale/monochrome filters for HTML `<canvas>` `ImageData`
  - And PBM image file format, a very simple mono bitmap format, helpful to be read & used
- `www/main.comp.js` - Compatibility script:
  - Transpiled from other scripts around for falling back on old browsers
  - Bundled all required scripts, see file `0-transpile.sh`
  - Isn’t there unless you transpile
- `www/i18n*` - Scripts about I18n:
  - See [i18n.md](i18n.i18n/i18n.md)
- `www/*.js` - Other scripts:
  - Small but useful, just look at them directly
  - Most are in Public Domain under CC0 license
- `www/jslicense.html` - Dedicated JavaScript License Information, useful for user reference & LibreJS indentification
- `www/lang/*.json` - Language files for both front- & back-end

- `version` - The version tag, as a file
  - Modify it to determine the version used in build scripts
  - Don’t leave a trailing new line
- `N-*.sh` - Shell files:
  - Helpers for development convenience
  - Quickly invoke with `./N<tab><enter>`
- `build-common/bundle.py` - Bundler for “windows”, “pure” and “bare” editions
  - You can define what to include or not in this script, just modify directly, while trying to not alter other
  - Adviced to transpile scripts before bundling
  - To do the builds you should be in the build dir: `cd build-common`
  - With `bleak` there you’re able to bundle a “pure” edition via just `python3 bundle.py`
  - In any case you’re able to bundle a “bare” edition, via `python3 bundle.py -b`
  - Bundle a “windows” edition with `-w` switch in place of `-b`
  - You may put version tag as last parameter
  - Resulting zip files will be in repo’s root directory
- `build-common/0-bundle-all.sh` - Bundle all editions at once

<!-- TODO: split to Android docs -->
- `build-android/0-build-android.sh` - The dev build script:
  - Invokes `python-for-android`
  - Defines many things
  - Just builds using the current repo state
  - **Doesn’t** work out-of-the-box. Again, please wait for me to summarize the hacks...
- `build-android/3-formal-build.sh` - The “formal” build script:
  - Unlike the dev version, this takes files from a “bare” edition zip
  - Also unlike dev, this doesn’t enforce the custom blacklist, since “bare” is already minimal
  - Now it builds a “release” version. In order to be installed on Android, you need to sign it. Know more on Internet

### Be aware that...

If there are development files that are not meant to be in this public repo, please add to `.gitignore`.

And don’t put big binary files, because not everyone have good connection to GitHub.

Same applies to most feature-bloated 3rd-party libraries. Try your best to avoid introducing more dependencies.  
Though, it’s reasonable to invoke a tool that is already on the system, or always accepted by users / very easy to install
