[English](README.md) | 简体中文

# 猫咪打印机 Cat-Printer

*一个友好的猫咪打印机 App/驱动，为用户而生 (GB01,GB02,GT01)*

![Poster](https://repository-images.githubusercontent.com/403563361/0a315f6a-7cae-48d7-bfd4-d6fac5415d7c)

## 功能

- 直接从网页界面打印 jpg/png 图像到猫咪打印机
- 复制粘贴文档内容（.doc, .docx, .odt 等）以打印
- （会有更多……）

## 如何使用

TODO

当前，使用 Python3 和 Bleak，打开 `server.py`，在浏览器访问 `http://localhost:8095`，开启猫咪打印机和电脑蓝牙，然后做自己想要的。

## 为什么？

这些蓝牙猫咪打印机，型号为 GB01, GB02 和 GT01，没有足够的应用支持。

官方应用是专有的，且只有手机版本。

我讨厌专有软件和平台绑架。所以我做了这个。

幸运的是，这里的热心肠网友将他们的经验记录到了一个[中心仓库](https://github.com/JJJollyjim/catprinter)，因此我可以走得更远 😃

## 开发者注记

此 App 使用服务器/客户端模型，且拥有尽可能少的服务端依赖。

### 准备

- Python3 与浏览器
- [fabric.min.js](https://github.com/fabricjs/fabric.js/tree/master/dist)
- [html2canvas.min.js](https://html2canvas.hertzen.com/)
- [qrcode.min.js](https://davidshimjs.github.io/qrcodejs/)
- （可选）任何纯网页可用的 css，如 [minicss](https://minicss.org/)，重命名为 `skin.css`

将 web 相关的文件放在 `www` 文件夹中。

### 支持的平台

它同时包含对 Windows 和 GNU/Linux 的支持。Windows 发行包将包含一个**普通**用户所需要的所有。

### 计划

- 更好的双色转换
- 使 web 界面的远程打印标准化/兼容/安全

可能的功能：

- 使用打印协议的远程打印

## 文件

- `server.py`: 包含一个 BaseHTTP 服务器，关联用户操作与打印机驱动
- `printer.py`: 包含蓝牙猫咪打印机的驱动，依赖 bleak。您也可以在命令行中运行此文件。
