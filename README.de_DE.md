
# Cat-Printer

Ein Projekt, das Unterstützung für einige Bluetooth-"Cat Printer"-Modelle auf *vielen* Plattformen bietet!

![CatPrinter](photo/Pic1.jpg?raw=true "CatPrinter")

## unterstützte Geräte

Gegenwärtig:
- GB01
- GB02
- GT01

## Funktionen

- Simple!
  - Bedienung über eine Web-UI direkt im Browser,
  - oder besorgen Sie sich die Android-Version!
- ~~Umfangreiche Funktionen~~
  - Derzeit befindet sich die Software im Alpha-Stadium. Mehr wird es bald geben!
  - Sie können immer noch die Vorgängerversion (0.0.2) verwenden, die einige weitere Bearbeitungsfunktionen bietet
- Friendly!
  - Sprachunterstützung! Sie können sich an der Übersetzung beteiligen!
  - Gute Benutzeroberfläche, mit PC-/Mobil-/Licht-/Dunkelmodus-Varianten! (Systemkonfiguration adaptiv)
- Plattformübergreifend!
  - Neuere Windows 10 und darüber
  - GNU/Linux
  - MacOS *(muss getestet werden*
  - und eine Menge zusätzlicher Anstrengungen für Android!
- Frei, wie in [freedom](https://www.gnu.org/philosophy/free-sw.html)!
  - Anders als die "offizielle" proprietäre App, ist dieses Projekt für alle, denen *offener Geist und Freiheit* wichtig sind!
- und Fun!
  - Mach, was du willst!

## Get Started

### Android

Holen Sie sich die neueste apk-Version und installieren Sie sie. 

Es kann sein, dass es um die Erlaubnis bittet, den Standort im Hintergrund zu finden, was mir ein Rätsel ist.  
Sie können es sicher verweigern.

### Windows:

Holen Sie sich die neueste Version des Archivs mit "windows" im Dateinamen, entpacken Sie es an einen beliebigen Ort und führen Sie "start.bat" aus.

### GNU/Linux

Sie können sich die "reine" Version besorgen, sie extrahieren, ein Terminal starten und dies ausführen:  
```bash
python3 server.py
```

Auf Arch Linux basierten Distributionen sollten Sie zuerst `bluez` installieren, da es oft fehlt  
```bash
sudo pacman -S bluez bluez-utils
```

### MacOS

Für MacOS installieren Sie bitte [Python 3](https://www.python.org/).

Holen Sie eine "reine" Version und tun Sie dasselbe in einer Shell wie bei Linux:  
```bash
python3 server.py
```

Auf dem Mac öffnet sich der Browser derzeit nicht automatisch. Bitte starten Sie einen Browser manuell und gehen Sie zu `http://127.0.0.1:8095`. Dieser Link sollte auch funktionieren: [der Link](http://127.0.0.1:8095)


### Anmerkung

Für alle unterstützten Plattformen können Sie auch die "pure" Edition verwenden, wenn Sie [Python 3](https://www.python.org/) installiert haben oder die "bare" Edition, wenn Sie es geschafft haben, auch `bleak` über `pip` zu installieren.

Besuchen Sie die [releases](https://github.com/NaitLee/Cat-Printer/releases)!

## Probleme?

Bitte öffnen Sie ein Issue, wenn Ihnen etwas auf dem Herzen liegt!

Natürlich sind PRs willkommen, wenn Sie sie meistern können!

## Lizenz

Copyright © 2022 NaitLee Soft. Einige Rechte sind vorbehalten.

Siehe Datei `COPYING`, `LICENSE` und Details zum verwendeten JavaScript in der Datei `www/jslicense.html`.

--------

## Development

Vielleicht sind Sie ohnehin an der Sprachunterstützung interessiert. Siehe die Übersetzungsdateien im Verzeichnis `www/lang`!

Interessieren Sie sich auch für Code-Entwicklung? Siehe [development.md](development.md)!

### Credits

- Natürlich Python und das Web!
- [Bleak](https://bleak.readthedocs.io/en/latest/) Bluetooth Low Energy lib! Der totale Retter!
- [roddeh-i18n](https://github.com/roddeh/i18njs), gute Arbeit!
- [python-for-android](https://python-for-android.readthedocs.io/en/latest/), obwohl es einige schmerzhafte Schwierigkeiten gibt
- [AdvancedWebView](https://github.com/delight-im/Android-AdvancedWebView) für den Schutz meines Lebens vor Java
- Stack Overflow & das ganze Internet, ließ mich alles über Android `Activity` von Beginn an lernen
- … Alle sind großartig!
