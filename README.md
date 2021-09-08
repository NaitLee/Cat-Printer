English | [简体中文](README.zh-CN.md)

# Cat-Printer

*A friendly cat printer App/driver for everyone (GB01,GB02,GT01)*

![Poster](https://repository-images.githubusercontent.com/403563361/0a315f6a-7cae-48d7-bfd4-d6fac5415d7c)

(According to [official website](http://office.frogtosea.com/jjfa), maybe there are also normal-, piggy- and frog-shaped printers with these models)

## Features

- Print jpg/png images directly to cat printer from a web interface
- Print a document (.doc, .docx, .odt etc) by copy-paste
- Custom print content, put text, image, QRcode on a canvas
- (more will be here...)

## How to use

On Windows:

- Get a release, extract, open `start.bat`.
- Make sure bluetooth of your computer is opened and cat printer is launched.

On GNU/Linux:

- You can also use a Windows release, or prepare dependencies according to developer note.
- Open `server.py` in `printer` folder with `python3`.

## Why?

These bluetooth cat printers, with model name GB01, GB02 and GT01, have poor support at applications.

Official apps are, proprietary, also have only mobile version.

I hate both proprietary and platform-binding things. So I decided to make this.

Thankfully, people here are really warm-hearted, logged their experiences online in a [central repo](https://github.com/JJJollyjim/catprinter), and I am able to walk further 😃

## Developer Note

This application uses server/client model, and have fewest possible dependencies on server side.

### Prepare

- Python3 & Browser
- [fabric.min.js](https://github.com/fabricjs/fabric.js/tree/master/dist)
- [html2canvas.min.js](https://html2canvas.hertzen.com/)
- [qrcode.min.js](https://davidshimjs.github.io/qrcodejs/)
- (Optional) Any css for plain webpage, e.g. [minicss](https://minicss.org/), rename to `skin.css`

Put any web-related files to folder `www`.

### Supported Platforms

Support for both Windows and GNU/Linux are included. And Windows release package will contain all needed things for a **normal** user to play with.

### Plans

- Smoother mono-color converting
- Make remote-print by web interface more standard/compatible/secure

Possible features:

- Remote print with printer protocols

### Files

- `server.py`: Contains a BaseHTTP server that hooks user actions and printer driver
- `printer.py`: Contains the driver of bluetooth cat printer, which depends on bleak. You can also run this file in commandline.
