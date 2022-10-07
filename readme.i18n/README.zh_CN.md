
# Cat-Printer

🐱🖨 猫咪打印机：此应用*跨平台地*对一些蓝牙“喵喵机”提供支持！

[![cat-printer-poster](https://repository-images.githubusercontent.com/403563361/93e32942-856c-4552-a8b0-b03c0976a3a7)](https://repository-images.githubusercontent.com/403563361/93e32942-856c-4552-a8b0-b03c0976a3a7)

## 型号

已知支持：`GB0X, GT01, YT01` （`X` 表示任意数字）

可在 Web 界面测试未列出的型号。在 `设置 -> 测试未知设备`  
有概率成功！

## 特性

*当前仍在继续开发。以后会有更多！*

- 简易！
  - 在网页界面进行操作，
  - 或者获取安卓应用！

- 友好！
  - 语言支持！您可参与翻译！
  - 良好的用户界面，可适应桌面/移动端/明暗主题！
  - 无障碍功能，考虑到每一个人！

- 功能丰富！
  - 网页界面，所有人都可以用！
    - 控制打印机配置
    - 打印照片，或单纯地进行测试
  - 命令行，技术爱好者必备！
    - 使用一些参数控制打印机
    - 简易、简化的图片或文字打印
    - 让程序的每一部分发挥作用
  - 其他一些好东西！
    - 服务器也具有 CUPS/IPP 能力

- 跨平台！
  - 较新的 Windows 10 及以上
  - GNU/Linux
  - MacOS
  - 还有安卓！

- 是[自由软件](https://www.gnu.org/philosophy/free-sw.html)！
  - 不像那些专有应用，此作品为在乎*开放思想与计算自由*的人而生！

- 有意思！
  - 做什么都可以！

## 现在开始

### 安卓

获取并安装最新版安卓 apk 包，完成！

应用可能请求“后台位置”权限，您可以拒绝它。  
（前台）位置权限是较新版安卓系统扫描蓝牙设备所需要的。

建议将扫描时间设为 1 秒。

### Windows

获取名称中有 "windows" 的版本，  
解压并运行 `start.bat`

Windows 通常需要较长的扫描时间。默认为 4 秒，可按需调整。

### GNU/Linux

您可以获取“纯净(pure)”版，解压、在其中打开终端并输入：  
```bash
python3 server.py
```

建议将扫描时间设为 2 秒。

在 Arch Linux 等发行版您可能需要首先安装 `bluez`  
```bash
sudo pacman -S bluez bluez-utils
```

*以后将有软件包！*

### MacOS

MacOS 用户请首先安装 [Python 3](https://www.python.org/)，  
然后在终端使用 `pip` 安装 `pyobjc` 和 `bleak`：
```bash
pip3 install pyobjc bleak
```

然后获取并使用“单一(bare)”版：  
```bash
python3 server.py
```

### 值得注意

对于所有支持的平台，  
当已安装 [Python 3](https://www.python.org/) 时，您可以直接获取“纯净(pure)”版，  
或在已使用 `pip` 安装 `bleak` 时使用“单一(bare)”版。

如果您喜欢命令行，安装 [ImageMagick](https://imagemagick.org/) 和 [Ghostscript](https://ghostscript.com/) 会很有帮助。

查看所有[发布版本](https://github.com/NaitLee/Cat-Printer/releases)！

## 有问题？

有想法？用 Issue 或去 Discussion 讨论！

如果能行，Pull Request 也可以！

## 许可证

Copyright © 2021-2022 NaitLee Soft. 保留一些权利。

```
本程序是自由软件：你可以再分发之和/或依照由自由软件基金会发布的 GNU 通用公共许可证修改之，无论是版本 3 许可证，还是（按你的决定）任何以后版都可以。
发布该程序是希望它能有用，但是并无保障；甚至连可销售和符合某个特定的目的都不保证。请参看 GNU 通用公共许可证，了解详情。
你应该随程序获得一份 GNU 通用公共许可证的复本。如果没有，请看 <https://www.gnu.org/licenses/>。 
```

敬请查看文件 `LICENSE`，以及在 `www/jslicense.html` 中有关 JavaScript 许可的详细内容。

具体地，`printer.py`，`server.py` 和 `main.js` 以 GNU GPL 3 发布（`GPL-3.0-or-later`）。  
其余所有部分，若无特殊声明，均在公有领域（`CC0-1.0-only`）。

--------

## 开发

您可能对翻译工作感兴趣。可于目录 `www/lang` 和 `readme.i18n/` 中查看翻译文件！

注：
1. 通常英语与简体中文同时更新。请考虑其他，如繁体中文（需注意在繁体中与简体的用字、技术术语差别）。
2. 目前使用 [OpenCC](https://github.com/BYVoid/OpenCC) 转换简体到繁体（臺灣正體）。若有不当之处，请指出。  
  当前仅转换程序界面语言、暂不转换文档。
3. 如果（真的）有能力，您也可以纠正/改善某些翻译！

还想写代码？看看 [development.md](development.md)！（英文）

那之后，可以将您的贡献概括添加至 `www/about.html`

### 鸣谢

- 当然不能没有 Python 和 Web 技术！
- [Bleak](https://bleak.readthedocs.io/en/latest/) 跨平台蓝牙低功耗库，牛！
- [roddeh-i18n](https://github.com/roddeh/i18njs)，当前内置的国际化功能受此启发
- [PF2 font](http://grub.gibibit.com/New_font_format)，很好的简易像素字体格式
- ImageMagick 和 Ghostscript，有用的东西已经在系统里，就当然不用考虑别的了
- [python-for-android](https://python-for-android.readthedocs.io/en/latest/)，虽然有些麻烦的地方
- [AdvancedWebView](https://github.com/delight-im/Android-AdvancedWebView) 从 Java 拯救了我的生命
- Stack Overflow 和整个互联网，你们让我从零开始了解了安卓“活动” `Activity`
  ……当然还有其他方面的帮助
- 每一位贡献于 Issue/Pull Request/Discussion 的人
- 每一位使用此作品并关心软件自由的人
- ……每个人都是好样的！
