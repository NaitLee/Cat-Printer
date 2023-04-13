
# Cat-Printer

🐱🖨 貓咪印表機：此應用*跨平臺地*對一些藍芽「喵喵機」提供支援！

[![cat-printer-poster](https://repository-images.githubusercontent.com/403563361/93e32942-856c-4552-a8b0-b03c0976a3a7)](https://repository-images.githubusercontent.com/403563361/93e32942-856c-4552-a8b0-b03c0976a3a7)

## 型號

已知支援：`GB0X, GT01, YT01` （`X` 表示任意數字）

可在 Web 介面測試未列出的型號。在 `設定 -> 測試未知裝置`  
有概率成功！

## 特性

[跳到安裝嚮導](#現在開始)

*當前仍在繼續開發。以後會有更多！*

- 簡易！
  - 在網頁介面進行操作，
  - 或者獲取安卓應用！

- 友好！
  - 語言支援！您可參與翻譯！
  - 良好的用家介面，可適應桌面/移動端/明暗主題！
  - 無障礙功能，考慮到每一個人！

- 功能豐富！
  - 網頁介面，所有人都可以用！
    - 控制印表機配置
    - 列印照片，或單純地進行測試
  - 命令列，技術愛好者必備！
    - 使用一些引數控制印表機
    - 簡易、簡化的圖片或文字列印
    - 讓程式的每一部分發揮作用
  - 其他一些好東西！
    - 伺服器也具有 CUPS/IPP 能力

- 跨平臺！
  - 較新的 Windows 10 及以上
  - GNU/Linux
  - MacOS
  - 還有安卓！

- 是[自由軟體](https://www.gnu.org/philosophy/free-sw.html)！
  - 不像那些專有應用，此作品為在乎*開放思想與計算自由*的人而生！

- 有意思！
  - 做什麼都可以！

## 現在開始

### 安卓

獲取並安裝最新版安卓 apk 包，完成！

應用可能請求「後臺位置」許可權，您可以拒絕它。  
（前臺）位置許可權是較新版安卓系統掃描藍芽裝置所需要的。

建議將掃描時間設為 1 秒。

### Windows

獲取名稱中有 "windows" 的版本，  
解壓並執行 `start.bat`

Windows 通常需要較長的掃描時間。預設為 4 秒，可按需調整。

### GNU/Linux

您可以獲取「純淨(pure)」版，解壓、在其中開啟終端並輸入：  
```bash
python3 server.py
```

建議將掃描時間設為 2 秒。

在 Arch Linux 等發行版您可能需要首先安裝 `bluez`  
```bash
sudo pacman -S bluez bluez-utils
```

*以後將有軟體包！*

### MacOS

MacOS 用家請首先安裝 [Python 3](https://www.python.org/)，  
然後在終端使用 `pip` 安裝 `pyobjc` 和 `bleak`：
```bash
pip3 install pyobjc bleak
```

然後獲取並使用「單一(bare)」版：  
```bash
python3 server.py
```

### 值得注意

對於所有支援的平臺，  
當已安裝 [Python 3](https://www.python.org/) 時，您可以直接獲取「純淨(pure)」版，  
或在已使用 `pip` 安裝 `bleak` 時使用「單一(bare)」版。

如果您喜歡命令列，安裝 [ImageMagick](https://imagemagick.org/) 和 [Ghostscript](https://ghostscript.com/) 會很有幫助。

檢視所有[釋出版本](https://github.com/NaitLee/Cat-Printer/releases)！

## 有問題？

有想法？用 Issue 或去 Discussion 討論！

如果能行，Pull Request 也可以！

## 許可證

Copyright © 2021-2022 NaitLee Soft. 保留一些權利。

```
本程式是自由軟體：你可以再分發之和/或依照由自由軟體基金會發布的 GNU 通用公共許可證修改之，無論是版本 3 許可證，還是（按你的決定）任何以後版都可以。
釋出該程式是希望它能有用，但是並無保障；甚至連可銷售和符合某個特定的目的都不保證。請參看 GNU 通用公共許可證，瞭解詳情。
你應該隨程式獲得一份 GNU 通用公共許可證的複本。如果沒有，請看 <https://www.gnu.org/licenses/>。 
```

敬請檢視檔案 `LICENSE`，以及在 `www/jslicense.html` 中有關 JavaScript 許可的詳細內容。

具體地，`printer.py`，`server.py` 和 `main.js` 以 GNU GPL 3 釋出（`GPL-3.0-or-later`）。  
其餘所有部分，若無特殊宣告，均在公有領域（`CC0-1.0-only`）。

--------

## 開發

您可能對翻譯工作感興趣。可於目錄 `www/lang` 和 `readme.i18n/` 中檢視翻譯檔案！

注：
1. 通常英語與中文同時更新。請考慮其他。
2. 目前使用 [OpenCC](https://github.com/BYVoid/OpenCC) 從傳統字轉換到簡體、正體、香港字。若有不當之處，請指出。  
3. 如果（真的）有能力，您也可以糾正/改善某些翻譯！

還想寫程式碼？看看 [development.md](development.md)！（英文）

那之後，可以將您的貢獻概括新增至 `www/about.html`

### 鳴謝

- 當然不能沒有 Python 和 Web 技術！
- [Bleak](https://bleak.readthedocs.io/en/latest/) 跨平臺藍芽低功耗庫，牛！
- [roddeh-i18n](https://github.com/roddeh/i18njs)，當前內建的國際化功能受此啟發
- [PF2 font](http://grub.gibibit.com/New_font_format)，很好的簡易畫素字型格式
- ImageMagick 和 Ghostscript，有用的東西已經在系統裡，就當然不用考慮別的了
- [python-for-android](https://python-for-android.readthedocs.io/en/latest/)，雖然有些麻煩的地方
- [AdvancedWebView](https://github.com/delight-im/Android-AdvancedWebView) 從 Java 拯救了我的生命
- Stack Overflow 和整個網際網路，你們讓我從零開始瞭解了安卓「活動」 `Activity`
  ……當然還有其他方面的幫助
- 每一位貢獻於 Issue/Pull Request/Discussion 的人
- 每一位使用此作品並關心軟體自由的人
- ……每個人都是好樣的！
