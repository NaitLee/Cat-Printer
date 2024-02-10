English | [Deutsch](./readme.i18n/README.de-DE.md) | [中文（简体字）](./readme.i18n/README.zh-CN.md) | [中文（正體字）](./readme.i18n/README.zh-TW.md) | [中文（香港字）](./readme.i18n/README.zh-HK.md)

# Cat-Printer

🐱🖨 A project that provides support to some Bluetooth “Cat Printer” models, on *many* platforms!

[![cat-printer-poster](https://repository-images.githubusercontent.com/403563361/93e32942-856c-4552-a8b0-b03c0976a3a7)](https://repository-images.githubusercontent.com/403563361/93e32942-856c-4552-a8b0-b03c0976a3a7)

## Models

Known to support: `GB01, GB02, GB03, GT01, YT01, MX05, MX06, MX08, MX10`

You can test other models with the Web UI, in `Settings -> Test Unknown Device`  
It may work!

## Features

*This project is still in development. More features may be added in the future!*

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
  - Unlike those proprietary “apps” around,  
    this project is for everyone that concerns *open-mind and freedom*!

- and Fun!
  - Do whatever you like!

***Didn’t find your feature? Or can’t set it up? Try the simple Web-app, [kitty-printer](https://print.unseen-site.fun/).***

## Get Started

### Android

Get the newest apk release and install, then well done!

It may ask for background location permission, you can deny it safely.  
(Foreground) Location permission is required for scanning Bluetooth devices in newer Android system.

It is recommended to set scan time to 1 second.

The 3rd-party F-Droid repository [IzzyOnDroid](https://android.izzysoft.de/repo) is known to include Cat-Printer.

### Windows

1. Download [source code](https://github.com/NaitLee/Cat-Printer/archive/refs/heads/main.zip) of this repository and install newest version of [Python](https://www.python.org/).
2. Extract the source code archive, run `install.bat`, wait for it to complete
3. After that, you will get `server.bat` for opening the Web interface. Run it and enjoy

<!-- Build system broken -->
<!-- Get the newest release archive with “windows” in the file name,  
extract to somewhere and run `start.bat` -->

Windows typically needs longer scan time. Defaults to 4 seconds, try to find your case.

For those who know Python development — see `requirements.txt` to find your way, it’s very simple.

### GNU/Linux

Get source code and run `./install.sh` to set the environment up.

After that, you can always use Cat-Printer inside the given virtual environment:

```
(venv) $ python3 server.py
```

It is recommended to set the scan time to 2 seconds.

On Arch Linux based distros you may install `bluez` first, as it may not be installed by default
```bash
sudo pacman -S bluez bluez-utils
```
  
<details>
<summary>Further steps</summary>

You may want to use the command line interface for hackiness:

```
$ python printer.py --help
```

You may or may not need to install ImageMagick and Ghostscript, depending on your distro.

```bash
sudo apt install imagemagick ghostscript
```
or use your distro's package manager.  

Extra configuration is required for ImageMagick to work. Because IM is made for external webserver, a strict security policy is applied. You need to add the following line to `/etc/ImageMagick-6/policy.xml` before `</policymap>`:
```xml
 <policy domain="coder" rights="read | write" pattern="PDM" />
```

Because this script is only accesible by localhost, or at most your local network, this is safe.
</details>

*Packaging is also on the way!*

### MacOS

For MacOS please install [Python 3](https://www.python.org/),  
then install `pyobjc` and `bleak` via `pip` in terminal:  
```bash
pip3 install pyobjc bleak
```

After that, get the source code and run:  
```bash
python3 server.py
```

### Worth to Note

For all supported platforms,  
You can also use “pure” edition once you have [Python 3](https://www.python.org/) installed,  
or “bare” edition if you also managed to install `bleak` via `pip`.

If you like command-line, installing [ImageMagick](https://imagemagick.org/) and [Ghostscript](https://ghostscript.com/) could be very helpful.

See the [releases](https://github.com/NaitLee/Cat-Printer/releases) now!

## Problems?

Please use Issue or Discussion if there’s something in your mind!

Of course Pull Requests are welcome if you can handle them!

## Licensefdroidhowtomarkets


Copyright © 2021-2024 NaitLee Soft. Some rights reserved.

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
- ImageMagick & Ghostscript, never mention other if something useful is already in one’s system
- [python-for-android](https://python-for-android.readthedocs.io/en/latest/), though there are some painful troubles
- [AdvancedWebView](https://github.com/delight-im/Android-AdvancedWebView) for saving my life from Java
- Stack Overflow & the whole Internet, you let me know Android `Activity` all from beginning
  ... and many other helpful ideas as well
- Everyone that contributed through Issue/Pull Request/Discussion
- Everyone that is using this & caring about software freedom
- ... Everyone is Awesome!
