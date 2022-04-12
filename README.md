English | [Deutsch](./readme.i18n/README.de_DE.md) | [简体中文](./readme.i18n/README.zh_CN.md)

# Cat-Printer

🐱🖨 A project that provides support to some Bluetooth "Cat Printer" models, on *many* platforms!

## Models

Currently:

|             |                   |
|-------------|-------------------|
| Supported   | GB01, GB02, GT01  |
| Maybe       | GB03              |
| Planned     | N/A               |

## Features

*Currently it's in development. More will be here soon!*

| Available       | Partial   | Planned       |
|-----------------|-----------|---------------|
| Web Interface   | CUPS/IPP* | Visual Editor |
| Print a Picture |           | Help/Manual   |
| Command-line    |           | Text Printing |

<!-- May comment the line below if there are no * -->
\* In development code. Will be released in a short period.

*Along with...*

- Simple!
  - Operate via a Web UI just in browser,
  - or get the Android release!

- Friendly!
  - Language support! You can participate in translation!
  - Good user interface, adaptive to PC/mobile and light/dark theme!

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

### MacOS

For MacOS please install [Python 3](https://www.python.org/).

Fetch a "pure" release and do the same in a shell:  
```bash
python3 server.py
```

Currently in Mac the browser will not pop up automatically. Please run manually and go to `http://127.0.0.1:8095`, or just click [here](http://127.0.0.1:8095).


### Worth to Note

For all supported platforms,  
You can also use "pure" edition once you have [Python 3](https://www.python.org/) installed,  
or "bare" edition if you also managed to install `bleak` via `pip`.

Command line hackers? Just use `printer.py`!

See the [releases](https://github.com/NaitLee/Cat-Printer/releases) now!

## Problems?

Please open an issue if there's something in your mind!

Of course PRs are welcome if you can handle them!

## License

Copyright © 2022 NaitLee Soft. Some rights reserved.

See file `COPYING`, `LICENSE`, and detail of used JavaScript in file `www/jslicense.html`

--------

## Development

You may interested in language support, anyway. See the translation files in directory `www/lang` and `readme.i18n`!
Note: you can correct some mistakes in them, if there are any. Also feel free to make it (truly) better!

Also interested in code development? See [development.md](development.md)!

### Credits

- Of course, Python & the Web!
- [Bleak](https://bleak.readthedocs.io/en/latest/) BLE lib! The overall Hero!
- [roddeh-i18n](https://github.com/roddeh/i18njs), good work!
- [python-for-android](https://python-for-android.readthedocs.io/en/latest/), though there are some painful troubles
- [AdvancedWebView](https://github.com/delight-im/Android-AdvancedWebView) for saving my life from Java
- Stack Overflow & the whole Internet, you let me know Android `Activity` all from beginning
- ... Everyone is Awesome!
