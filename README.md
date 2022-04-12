English | [Deutsch](./README.de_DE.md)

# Cat-Printer

A project that provides support to some Bluetooth "Cat Printer" models, on *many* platforms!

![CatPrinter](photo/Pic1.jpg?raw=true "CatPrinter")

## Models

Currently:  
  GB01, GB02, and GT01  
  maybe GB03 in the current repo state

## Features

- Simple!
  - Operate via a Web UI just in browser,
  - or get the Android release!
- ~~Feature-rich~~
  - Currently it is in Alpha stage. More will be there soon!
  - You can still use the legacy version (0.0.2), with some more editing features
- Friendly!
  - Language support! You can participate in translation!
  - Good user interface, with PC/mobile/light/dark mode variants! (system config adaptive)
- Cross platform!
  - Newer Windows 10 and above
  - GNU/Linux
  - MacOS *(Needs testing)*
  - and a lot of extra efforts for Android!
- Free, as in [freedom](https://www.gnu.org/philosophy/free-sw.html)!
  - Unlike the "official" proprietary app,  
    this project is for everyone that concerns *open-mind and freedom*!
- and Fun!
  - Do whatever you like!

## Get Started

### Android

Get the newest apk release and install, then well done!

It may ask for background location permission, which is mysterious to me.  
You can deny it safely.

### Windows:

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

Currently in Mac the browser will not pop up automatically. Please run manually and go to `http://127.0.0.1:8095`


### Note

For all supported platforms,  
You can also use "pure" edition once you have [Python 3](https://www.python.org/) installed,  
or "bare" edition if you also managed to install `bleak` via `pip`.

See the [releases](https://github.com/NaitLee/Cat-Printer/releases) now!

## Problems?

Please open an issue if there's something in your mind!

Of course PRs are welcome if you can handle them!

## License

Copyright © 2022 NaitLee Soft. Some rights reserved.

See file `COPYING`, `LICENSE`, and detail of used JavaScript in file `www/jslicense.html`

--------

## Development

You may interested in language support, anyway. See the translation files in directory `www/lang`!

Also interested in code development? See [development.md](development.md)!

### Credits

- Of course, Python & the Web!
- [Bleak](https://bleak.readthedocs.io/en/latest/) BLE lib! The overall Hero!
- [roddeh-i18n](https://github.com/roddeh/i18njs), good work!
- [python-for-android](https://python-for-android.readthedocs.io/en/latest/), though there are some painful troubles
- [AdvancedWebView](https://github.com/delight-im/Android-AdvancedWebView) for saving my life from Java
- Stack Overflow & the whole Internet, you let me know Android `Activity` all from empty
- ... Everyone is Awesome!
