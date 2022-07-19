English | [Deutsch](./readme.i18n/README.de_DE.md) | [简体中文](./readme.i18n/README.zh_CN.md)

# Cat-Printer

🐱🖨 A project that provides support to some Bluetooth "Cat Printer" models, on *many* platforms!

[![cat-printer-poster](https://repository-images.githubusercontent.com/403563361/93e32942-856c-4552-a8b0-b03c0976a3a7)](https://repository-images.githubusercontent.com/403563361/93e32942-856c-4552-a8b0-b03c0976a3a7)

## Models

Known to support: `GB0X, GT01, YT01` (`X` represents any digit)

You can test other models with the Web UI, in `Settings -> Test Unknown Device`  
It may work!

## Features

*Currently it's in development. More will be here soon!*

- Simple!
  - Operate via Web UI just in browser,
  - or get the Android release!
  - Even no problem with command line hackers!

- Friendly!
  - Language support! You can participate in translation!
  - Good user interface, adaptive to PC/mobile and light/dark theme!
  - Accessibility features, everyone is considered!

- Feature-rich!
  - Web UI, for most people!
    - Take full control of printer config
    - Print picture, or just test if it works
  - Command line, for geeks & hackers!
    - Control printer with a few parameters
    - Simplified image/text printing
    - Make use of every part of the program
  - Some other goodies!
    - Server program is also CUPS/IPP capable

- Cross platform!
  - Newer Windows 10 and above
  - GNU/Linux
  - MacOS
  - and also Android!

- Free, as in [freedom](https://www.gnu.org/philosophy/free-sw.html)!
  - Unlike those proprietary "apps" around,  
    this project is for everyone that concerns *open-mind and freedom*!

- and Fun!
  - Do whatever you like!

## Get Started

### Android

Get the newest apk release and install, then well done!

It may ask for background location permission, you can deny it safely.  
(Foreground) Location permission is required for scanning Bluetooth devices in newer Android system.

Recommend to set scan time to 1 second.

### Windows

Get the newest release archive with "windows" in the file name,  
extract to somewhere and run `start.bat`

Windows typically needs longer scan time. Defaults to 4 seconds, try to find your case.

### GNU/Linux

You can get the "pure" release, extract it, fire a terminal inside and run:  
```bash
python3 server.py
```

Recommend to set scan time to 2 seconds.

On Arch Linux based distros you may first install `bluez`, as it's often missing  
```bash
sudo pacman -S bluez bluez-utils
```

*Packaging is also on the way!*

### MacOS

For MacOS please install [Python 3](https://www.python.org/),  
then install `pyobjc` and `bleak` via `pip` in terminal:  
```bash
pip3 install pyobjc bleak
```

After that, fetch & use a "bare" release:  
```bash
python3 server.py
```

Currently in Mac the browser will not pop up automatically. Please run manually and go to `http://127.0.0.1:8095`, or just click [here](http://127.0.0.1:8095).

### Worth to Note

For all supported platforms,  
You can also use "pure" edition once you have [Python 3](https://www.python.org/) installed,  
or "bare" edition if you also managed to install `bleak` via `pip`.

If you like command-line, installing [ImageMagick](https://imagemagick.org/) and [Ghostscript](https://ghostscript.com/) could be very helpful.

See the [releases](https://github.com/NaitLee/Cat-Printer/releases) now!

## Problems?

Please use Issue or Discussion if there's something in your mind!

Of course Pull Requests are welcome if you can handle them!

## License

Copyright © 2021-2022 NaitLee Soft. Some rights reserved.

```
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
```

See file `LICENSE`, and detail of used JavaScript in file `www/jslicense.html`

Particularly, `printer.py`, `server.py` and `main.js` are released under GNU GPL 3 (`GPL-3.0-or-later`).  
All other parts, except which have special statements, are in Public Domain (`CC0-1.0-only`).

--------

## Contribution

You may interested in language support, anyway. There are translation files in directory `www/lang` and `readme.i18n/`!

You can correct mistakes here/there, if there are any. Also feel free to make it (truly) better!

Also interested in code development? See [CONTRIBUTING.md](CONTRIBUTING.md) and [development.md](development.md)!

After that, give yourself a credit in `www/about.html`, if you prefer.

### Credits

- Of course, Python & the Web!
- [Bleak](https://bleak.readthedocs.io/en/latest/) Bluetooth-Low-Energy library! The overall Hero!
- [roddeh-i18n](https://github.com/roddeh/i18njs), the current built-in i18n is inspired by this
- [PF2 font](http://grub.gibibit.com/New_font_format), great minimal raster font idea
- ImageMagick & Ghostscript, never mention other if something useful is already in one's system
- [python-for-android](https://python-for-android.readthedocs.io/en/latest/), though there are some painful troubles
- [AdvancedWebView](https://github.com/delight-im/Android-AdvancedWebView) for saving my life from Java
- Stack Overflow & the whole Internet, you let me know Android `Activity` all from beginning
  ... and many other helpful ideas as well
- Everyone that contributed through Issue/Pull Request/Discussion
- Everyone that is using this & caring about software freedom
- ... Everyone is Awesome!
