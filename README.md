English | [简体中文](README.zh-CN.md)

# Cat-Printer

*A friendly cat printer App/driver for everyone (GB01,GB02,GT01)*

![Poster](https://repository-images.githubusercontent.com/403563361/0a315f6a-7cae-48d7-bfd4-d6fac5415d7c)

## Features

- Print jpg/png images directly to cat printer from a web interface
- Print a document (.doc, .docx, .odt etc) by copy-paste
- (more will be here...)

## How to use

TODO

Currently, with Python3 and Bleak, open `server.py` and go to `http://localhost:8095` in browser, open cat printer and bluetooth of your computer, then do the works.

## Why?

These bluetooth cat printers, with module name GB01, GB02 and GT01, have poor support at applications.

Official apps are, proprietary, also have only mobile version.

I hate both proprietary and platform-binding things. So I decided to make this.

Thankfully, people here are really warm-hearted, logged their experiences online in a [central repo](https://github.com/JJJollyjim/catprinter), and I am able to walk further 😃

## Developer Note

This application uses server/client module, and have fewest possible dependencies on server side.

### Prepare

- Python3 & Browser
- [fabric.min.js](https://github.com/fabricjs/fabric.js/tree/master/dist)
- [html2canvas.min.js](https://html2canvas.hertzen.com/)

### Supported Platforms

Support for both Windows and GNU/Linux are included. And Windows release package will contain all needed things for a **normal** user to play with.

### Plans

- Support rich edit features as the official app for cat printers (iPrint & 精准学习)
- Make remote-print by web interface more standard/compatible/secure

Possible features:

- Remote print with printer protocols

### Files

- `server.py`: Contains a BaseHTTP server that hooks user actions and printer driver
- `printer.py`: Contains the driver of bluetooth cat printer, which depends on bleak. You can also run this file in commandline.
