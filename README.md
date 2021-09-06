English | [简体中文](README.zh-CN.md)

# Cat-Printer

*A friendly cat printer App/driver for everyone (GB01,GB02,GT01)*

## Features

- Print jpg/png images directly to cat printer from a web interface
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

This application uses server/client module, and have fewest possible dependencies.

All you need is Python3 (with or without pip) and a browser.

Support for both Windows and GNU/Linux are included. And Windows release package will contain all needed things for a **normal** user to play with.

Plans:

- Support direct print of text (and/or richtext), use HTML canvas
- Make remote-print by web interface more standard/compatible/secure

Possible features:

- Support rich edit features as the official app for cat printers (iPrint & 精准学习)
- Remote print with printer protocols

Routine of image data when printing:

`Image.png -> paint to canvas rawdata -> monochrome filter -> collect canvas rawdata to pbm format -> send to server -> extract information -> compile to raw data for printer -> bluetooth communication to printer`

Note: PBM is a easy monochrome image format:

```
P4
# {comment}
{width} {height}
{raw bytes, one byte for 8 bits of 0 or 1, these consists the image visually}
```

## Files

- `index.html`: The frontend entry page for printer interfaces
- `server.py`: Contains a BaseHTTP server that hooks user actions and printer driver
- `printer.py`: Contains the driver of bluetooth cat printer, which depends on bleak. You can also run this file in commandline.
