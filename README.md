English | [Deutsch](./readme.i18n/README.de_DE.md) | [简体中文](./readme.i18n/README.zh_CN.md)

# Cat-Printer

🐱🖨 A project that provides support to some Bluetooth "Cat Printer" models, on *many* platforms!

[![cat-printer-poster](https://repository-images.githubusercontent.com/403563361/ad018f6e-3a6e-4028-84b2-205f7d35c22b)](https://repository-images.githubusercontent.com/403563361/ad018f6e-3a6e-4028-84b2-205f7d35c22b)

## Models

Currently:

|    |    |
|----|----|
| Supported | GB01, GB02, GT01, GB03  |
<!-- | Maybe     | N/A | -->
<!-- | Planned   | N/A | -->

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
    - Simplified text printing
    - Make use of every part of the program
  - Some other goodies!
    - Server program is also CUPS/IPP capable

- Cross platform!
  - Newer Windows 10 and above
  - GNU/Linux
  - MacOS *(Needs testing)*
  - and a lot of extra efforts for Android!

- Free, as in [freedom](https://www.gnu.org/philosophy/free-sw.html)!
  - Unlike the "original" proprietary app,  
    this project is for everyone that concerns *open-mind and freedom*!

- and Fun!
  - Do whatever you like!

## Get Started

### Android

Get the newest apk release and install, then well done!

It may ask for background location permission, you can deny it safely.  
(Foreground) Location permission is required for scanning Bluetooth devices in newer Android system.

### Windows

Get the newest release archive with "windows" in the file name,  
extract to somewhere and run `start.bat`

### GNU/Linux

You can get the "pure" release, extract it, fire a terminal inside and run:  
```bash
python3 server.py
```

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

After that, fetch a "bare" release and do the same in a shell:  
```bash
python3 server.py
```

Currently in Mac the browser will not pop up automatically. Please run manually and go to `http://127.0.0.1:8095`, or just click [here](http://127.0.0.1:8095).

### Worth to Note

For all supported platforms,  
You can also use "pure" edition once you have [Python 3](https://www.python.org/) installed,  
or "bare" edition if you also managed to install `bleak` via `pip`.

See the [releases](https://github.com/NaitLee/Cat-Printer/releases) now!

## Problems?

Please talk in Discussion if there's something in your mind!

Of course Pull Requests are welcome if you can handle them!

## License

Copyright © 2021-2022 NaitLee Soft. Some rights reserved.

See file `COPYING`, `LICENSE`, and detail of used JavaScript in file `www/jslicense.html`

--------

## Development

You may interested in language support, anyway. See the translation files in directory `www/lang` and `readme.i18n`!
Note: you can correct some mistakes in them, if there are any. Also feel free to make it (truly) better!

Also interested in code development? See [development.md](development.md)!

### Credits

- Of course, Python & the Web!
- [Bleak](https://bleak.readthedocs.io/en/latest/) BLE lib! The overall Hero!
- [roddeh-i18n](https://github.com/roddeh/i18njs), the current built-in i18n is inspired by this
- [python-for-android](https://python-for-android.readthedocs.io/en/latest/), though there are some painful troubles
- [AdvancedWebView](https://github.com/delight-im/Android-AdvancedWebView) for saving my life from Java
- Stack Overflow & the whole Internet, you let me know Android `Activity` all from beginning
- ... Everyone is Awesome!
