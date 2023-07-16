
# Cat-Printer

🐱🖨 Ein Projekt, das Unterstützung für einige Bluetooth-"Cat Printer"-Modelle auf *vielen* Plattformen bietet!

[![cat-printer-poster](https://repository-images.githubusercontent.com/403563361/93e32942-856c-4552-a8b0-b03c0976a3a7)](https://repository-images.githubusercontent.com/403563361/93e32942-856c-4552-a8b0-b03c0976a3a7)

## Unterstützte Geräte

Untersützt: `GB01, GB02, GB03, GT01, YT01, MX05, MX06, MX08`

## Funktionen

*Derzeit befindet sich die Software im Alpha-Stadium. Demnächst mehr!

- Simple!
  - Bedienung über eine Web-UI direkt im Browser
   
   oder 
  - über die Android-App!

- Friendly!
  - Sprachunterstützung - beteiligen Sie sich an der Übersetzung!
  - Benutzerfreundliche Oberfläche, für PC und Mobilgeräte mit Tag- und Nachtmodus

- Plattformübergreifend!
  - Windows 10 oder höher
  - GNU/Linux
  - MacOS
  - auch unter Android verfügbar!

- Frei, wie in [Freiheit](https://www.gnu.org/philosophy/free-sw.de.html)!
  - Anders als die "offizielle" proprietäre App, ist dieses Projekt für alle, denen *offener Geist und Freiheit* wichtig sind!

- und Fun!
  - Mach, was du willst!

## Get Started

### Android

Installieren Sie die neueste APK-Version und legen Sie direkt los. 

Es kann sein, dass die App um Erlaubnis bittet, den Standort im Hintergrund zu abzufragen.  
Dies ist Teil der Bluetooth Bibliothek und kann ohne Probleme abgelehnt werden.

### Windows

Holen Sie sich die neueste Version des Archivs mit "windows" im Dateinamen, entpacken Sie es an einen beliebigen Ort und führen Sie "start.bat" aus.

### GNU/Linux

Holen Sie sich die neueste Version des Archivs mit "pure" im Dateinamen, entpacken Sie es an einen beliebigen Ort und führen Sie den folgenden Befehl aus:
```bash
python3 server.py
```

Auf Arch Linux basierten Distributionen sollten Sie zuerst `bluez` installieren, da es oft nicht standardmäßig installiert ist.
```bash
sudo pacman -S bluez bluez-utils
```

### MacOS

Für MacOS installieren Sie bitte [Python 3](https://www.python.org/).

Laden Sie sich die "reine (pure)" Version herunter und führen Sie dieselben Schritte aus wie unter Linux:  
```bash
python3 server.py
```



### Anmerkung

Für alle unterstützten Plattformen können Sie auch die "pure" Edition verwenden, wenn Sie [Python 3](https://www.python.org/) installiert haben oder die "bare" Edition, wenn Sie schon `bleak` via `pip` installiert haben.

Die aktuellste Version finden Sie unter [Releases](https://github.com/NaitLee/Cat-Printer/releases)!

## Probleme?

Bitte [erstellen Sie eine Issue](https://github.com/NaitLee/Cat-Printer/issues), wenn Ihnen etwas auf dem Herzen liegt!

PRs natürlich sind willkommen!

## Lizenz

Copyright © 2021-2023 NaitLee Soft. Einige Rechte sind vorbehalten.

```
Dieses Programm ist Freie Software: Sie können es unter den Bedingungen der GNU General Public License, wie von der Free Software Foundation, Version 3 der Lizenz oder (nach Ihrer Wahl) jeder neueren veröffentlichten Version, weiter verteilen und/oder modifizieren.

Dieses Programm wird in der Hoffnung bereitgestellt, dass es nützlich sein wird, jedoch OHNE JEDE GEWÄHR,; sogar ohne die implizite Gewähr der MARKTFÄHIGKEIT oder EIGNUNG FÜR EINEN BESTIMMTEN ZWECK. Siehe die GNU General Public License für weitere Einzelheiten.

Sie sollten eine Kopie der GNU General Public License zusammen mit diesem Programm erhalten haben. Wenn nicht, siehe <https://www.gnu.org/licenses/>.
```

Siehe Datei `LICENSE` und Details zum verwendeten JavaScript in der Datei `www/jslicense.html`.

--------

## Weiterentwicklung

Falls Sie an der Übersetzung in andere Sprachen interessiert sind, schauen Sie sich die Übersetzungsdateien in den Verzeichnissen `www/lang` und `readme.i18n` an!

Interessieren Sie sich auch für Programmierung? 

Dann schauen Sie in [development.md](development.md) nach!

### Mitwirkende

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
- ... Ihr seid alle fanstastisch!
