
# Cat-Printer

🐱🖨 Ein Projekt, das Unterstützung für einige Bluetooth-"Cat Printer"-Modelle auf *vielen* Plattformen bietet!

[![cat-printer-poster](https://repository-images.githubusercontent.com/403563361/ad018f6e-3a6e-4028-84b2-205f7d35c22b)](https://repository-images.githubusercontent.com/403563361/ad018f6e-3a6e-4028-84b2-205f7d35c22b)

## Unterstützte Geräte


|    |    |
|----|----|
| Untersützt | GB01, GB02, GT01, GB03  |
<!-- | Maybe     | N/A | -->
<!-- | Planned   | N/A | -->

## Funktionen

*Derzeit befindet sich die Software im Alpha-Stadium. Mehr wird es bald geben!*

- Simple!
  - Bedienung über eine Web-UI direkt im Browser,
  - oder oder über die Android-App!

- Friendly!
  - Sprachunterstützung! Sie können sich an der Übersetzung beteiligen!
  - Gute Benutzeroberfläche, mit PC-/Mobil-/Tag-/Nachtmodus-Varianten!

- Plattformübergreifend!
  - Windows 10 oder höher
  - GNU/Linux
  - MacOS
  - und eine Menge zusätzlicher Anstrengungen für Android!

- Frei, wie in [Freiheit](https://www.gnu.org/philosophy/free-sw.de.html)!
  - Anders als die "offizielle" proprietäre App, ist dieses Projekt für alle, denen *offener Geist und Freiheit* wichtig sind!

- und Fun!
  - Mach, was du willst!

## Get Started

### Android

Installieren Sie sich einfach die neueste APK-Version und Sie können direkt loslegen. 

Es kann sein, dass die App um Erlaubnis bittet, den Standort im Hintergrund zu abzufragen.  
Dies ist Teil der Bluetooth Bibliothek und kann ohne Probleme abgelehnt werden.

### Windows

Holen Sie sich die neueste Version des Archivs mit "windows" im Dateinamen, entpacken Sie es an einen beliebigen Ort und führen Sie "start.bat" aus.

### GNU/Linux

Sie können sich die "reine(pure)" Version besorgen, sie extrahieren, ein Terminal starten und dies ausführen:  
```bash
python3 server.py
```

Auf Arch Linux basierten Distributionen sollten Sie zuerst `bluez` installieren, da es oft nicht standardmäßig installiert ist
```bash
sudo pacman -S bluez bluez-utils
```

### MacOS

Für MacOS installieren Sie bitte [Python 3](https://www.python.org/).

Holen Sie eine "reine(pure)" Version und tun Sie dasselbe in einer Shell wie bei Linux:  
```bash
python3 server.py
```

Auf dem Mac öffnet sich der Browser derzeit nicht automatisch. Bitte starten Sie einen Browser manuell und navigieren Sie zu `http://127.0.0.1:8095`. 

Alternativ können Sie auch folgenden Link verwenden: [Link](http://127.0.0.1:8095)


### Anmerkung

Für alle unterstützten Plattformen können Sie auch die "pure" Edition verwenden, wenn Sie [Python 3](https://www.python.org/) installiert haben oder die "bare" Edition, wenn Sie schon `bleak` via `pip` installiert haben.

Besuchen Sie die [Releases](https://github.com/NaitLee/Cat-Printer/releases)!

## Probleme?

Bitte öffnen Sie ein Issue, wenn Ihnen etwas auf dem Herzen liegt!

Natürlich sind PRs willkommen!

## Lizenz

Copyright © 2021-2022 NaitLee Soft. Einige Rechte sind vorbehalten.

```
Dieses Programm ist Freie Software: Sie können es unter den Bedingungen der GNU General Public License, wie von der Free Software Foundation, Version 3 der Lizenz oder (nach Ihrer Wahl) jeder neueren veröffentlichten Version, weiter verteilen und/oder modifizieren.

Dieses Programm wird in der Hoffnung bereitgestellt, dass es nützlich sein wird, jedoch OHNE JEDE GEWÄHR,; sogar ohne die implizite Gewähr der MARKTFÄHIGKEIT oder EIGNUNG FÜR EINEN BESTIMMTEN ZWECK. Siehe die GNU General Public License für weitere Einzelheiten.

Sie sollten eine Kopie der GNU General Public License zusammen mit diesem Programm erhalten haben. Wenn nicht, siehe <https://www.gnu.org/licenses/>.
```

Siehe Datei `LICENSE` und Details zum verwendeten JavaScript in der Datei `www/jslicense.html`.

--------

## Development

Falls Sie an der Übersetzung in andere Sprachen interessiert sind, schauen Sie sich die Übersetzungsdateien in den Verzeichnissen `www/lang` und `readme.i18n` an!

Interessieren Sie sich auch für Programmierung? Dann schauen Sie in [development.md](development.md) nach!

### Credits

- Natürlich Python und das Web!
- [Bleak](https://bleak.readthedocs.io/en/latest/) Steuerung des Bluetooth Low Energy Protokolls! Der totale Retter!
- [roddeh-i18n](https://github.com/roddeh/i18njs), die Inspiration für das Verwendete i18n Lokalisierungssystem!
- [PF2 font](http://grub.gibibit.com/New_font_format), eine gute minimalistische Rasterschriftart
- ImageMagick & Ghostscript, sehr gute Bild- und Dokumentverarbeitungstools
- [python-for-android](https://python-for-android.readthedocs.io/en/latest/), obwohl es anfangs etwas schwierig war, es zum Laufen zu bringen
- [AdvancedWebView](https://github.com/delight-im/Android-AdvancedWebView), welches mich vor Java gerettet hat
- Stack Overflow & das Internet, Ihr habt mir alles beigebracht, was ich über Android's `Activity` wissen musste.
  ... und mir etliche hilfreiche Ideen gegeben
- Jeder, der über eine Issue, Pull Request oder Diskussion bei diesem Projekt mitgewirkt hat
- Jeder, der freie Software zu schätzen weiß
- ... Ihr seid alle Fanstastisch!