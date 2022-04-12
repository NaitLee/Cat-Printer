
# Cat-Printer

🐱🖨 猫咪打印机：此应用*跨平台地*对一些蓝牙“喵喵机”提供支持！

![CatPrinter](photo/Pic1.jpg?raw=true "CatPrinter")

## 型号

目前有：

|           |                   |
|-----------|-------------------|
| 支持      | GB01, GB02, GT01  |
| 可能支持  | GB03              |
| 计划      | 暂无              |

## 特性

- 简易！
  - 在网页界面进行操作，
  - 或者获取安卓应用！
- ~~功能丰富~~
  - 当前仍在继续开发。以后会有更多！
- 友好！
  - 语言支持！您可参与翻译！
  - 良好的用户界面，可适应桌面/移动端/明暗主题！
- 跨平台！
  - 较新的 Windows 10 及以上
  - GNU/Linux
  - MacOS *（需要测试）*
  - 在安卓上也花了些功夫呢！
- 是[自由软件](https://www.gnu.org/philosophy/free-sw.html)！
  - 不像“原版”专有应用，此作品为在乎*开放思想与计算自由*的人而生！
- 有意思！
  - 做什么都可以！

## 现在开始

### 安卓

获取并安装最新版安卓 apk 包，完成！

应用可能请求“后台位置”权限，您可以拒绝它。  
（前台）位置权限是较新版安卓系统扫描蓝牙设备所需要的。

### Windows

获取名称中有 "windows" 的版本，  
解压并运行 `start.bat`

### GNU/Linux

您可以获取“纯净(pure)”版，解压、在其中打开终端并输入：  
```bash
python3 server.py
```

在 Arch Linux 等发行版您可能需要首先安装 `bluez`  
```bash
sudo pacman -S bluez bluez-utils
```

### MacOS

MacOS 用户请首先安装 [Python 3](https://www.python.org/)。

然后获取“纯净(pure)”版，并做同样的事情：  
```bash
python3 server.py
```

当前在 MacOS 浏览器不会自动打开。您可以手动访问 `http://127.0.0.1:8095`，或点击[这里](http://127.0.0.1:8095)


### 值得注意

对于所有支持的平台，  
当已安装 [Python 3](https://www.python.org/) 时，您可以直接获取“纯净(pure)”版，  
或在已使用 `pip` 安装 `bleak` 时使用“单一(bare)”版。

命令行高手？直接用 `printer.py`！

查看所有[发布版本](https://github.com/NaitLee/Cat-Printer/releases)！

## 有问题？

有想法？开个 issue！

如果能行，PR 也可以！

## 许可证

Copyright © 2022 NaitLee Soft. 保留一些权利。

敬请查看文件 `COPYING`，`LICENSE`，以及在 `www/jslicense.html` 中有关 JavaScript 许可的详细内容。

--------

## 开发

您可能对翻译工作感兴趣。可于目录 `www/lang` 中查看翻译文件！  
注：
1. 通常英语与简体中文同时更新。请考虑其他，如繁体中文（需注意在繁体中与简体的用字、技术术语差别）。  
2. 如果您有（真的）能力，您也可以纠正/改善某些翻译！

还想写代码？看看 [development.md](development.md)！（英文）

### 鸣谢

- 当然不能没有 Python 和 Web 技术！
- [Bleak](https://bleak.readthedocs.io/en/latest/) 蓝牙低功耗库，牛！
- [roddeh-i18n](https://github.com/roddeh/i18njs)，好活！
- [python-for-android](https://python-for-android.readthedocs.io/en/latest/)，虽然有些麻烦的地方
- [AdvancedWebView](https://github.com/delight-im/Android-AdvancedWebView) 从 Java 拯救了我的生命
- Stack Overflow 和互联网，你们让我无中生有地了解了安卓“活动” `Activity`
- ……每个人都是好样的！
