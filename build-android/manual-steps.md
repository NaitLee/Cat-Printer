
# Android Build Env Manual Setup

Expecting to cost about half a day.

Worthy to work on! This gives possibility to everything about Android in your mind!

See [#Troubleshooting](#troubleshooting) for some problems you may meet.

Note: not being confirmed to 100% work yet. Be the first bird to try! Or bookmark this, arrange your time & come back later.

## Prepare

First, think about what will be your build environment. I choose to use a Docker container with a newer GNU/Linux distribution.

<details>

<summary>Expand Notes</summary>

Notes:

1. In theory you can just use your existing system, if you don’t afraid of messing it up.
2. Rolling distribution have newer packages offered.  
  It may give great experience in daily use, but will heavily bloat the update if many development packages are installed alltogether.  
3. By operating in an isolated environment, a mess taking place inside won’t affect the host.
4. Good candidates are: Arch, Artix, OpenSUSE Leap, and their neighbors.
5. Some say Docker isn’t intended to be “stateful”. But nothing is better in my mere knowledge.

</details>

Before creating the build environment, let’s prepare requirements of the outside.

### Space

Leave enough space for the isolated environment.  
For Docker, maybe keep 3 GiB free in root directory.

Locate somewhere with at least 8 GiB free space,  
Make 3 folders inside:

- `git-repo`, for git clones
- `android`, for Android SDK
- `p4a`, for manipulating python-for-android intermediate data

### Git Repositories

```bash
# Define your build directories
DIR_BUILD="/mnt/data/@"
DIR_GIT="$DIR_BUILD/git-repo/"

# Make sure both directories exist
mkdir -p $DIR_BUILD
mkdir -p $DIR_GIT

cd $DIR_GIT

# Cat-Printer
git clone https://github.com/NaitLee/Cat-Printer.git
# Bleak, we need some Java code from its source
# git clone https://github.com/hbldh/bleak.git
# Use an older version for being compatible with p4a recipes (setup.py)
wget https://files.pythonhosted.org/packages/e6/b4/e63829826a157d180831a1c5d3720e75d613c1290cb239510d148b906836/bleak-0.19.5.tar.gz
tar -xzf bleak-0.19.5.tar.gz && rm bleak-0.19.5.tar.gz
mv bleak-0.19.5 bleak
# AdvancedWebView, in order to give Android WebView capability to use <input type="file" />
git clone https://github.com/delight-im/Android-AdvancedWebView.git

# Let AdvancedWebView source code be in Cat-Printer building directory
ln -s ../../Android-AdvancedWebView/Source/library/src/main/java Cat-Printer/build-android/advancedwebview
```

### Android SDK

For most cases, following [python-for-android guide](https://python-for-android.readthedocs.io/en/latest/quickstart/#basic-sdk-install) will just work.  
But Note: required by newer Gradle, use Android **platform 30** (or above) rather than 27.

After that, continue to [Fix the NDK](#fix-the-ndk).

----

If Google isn’t available there, or you prefer manual setup:

- Pick a working mirror. Currently there’s [Tencent Cloud](https://mirrors.cloud.tencent.com/AndroidSDK/).

- Pay attention to [required version of Android NDK](https://python-for-android.readthedocs.io/en/latest/quickstart/#basic-sdk-install), this will increase by time. It’s currently r25b, but let’s use r25c.

- Fetch & extract some archives, as shown in this table:

| Archive file                        | Top-level dir inside    | Target directory                    |
| ----------------------------------- | ----------------------- | ----------------------------------- |
| `android-ndk-r25c-linux.zip`        | `android-ndk-r25c`      | `android/android-ndk-r25c`          |
| `build-tools_r33-linux.zip`         | `android-13`            | `android/build-tools/33.0.0`        |
| `commandlinetools-linux-8512546_latest.zip` | `cmdline-tools` | `android/cmdline-tools/latest`      |
| `platform-30_r03.zip`               | `android-11`            | `android/platforms/android-30`      |
| `platform-tools_r33.0.3-linux.zip`  | `platform-tools`        | `android/platform-tools`            |

For example, you get `build-tools_r33-linux.zip`, see a folder `android-13` inside;  
then you create `build-tools/` in `android/`, extract `android-13` there and rename it as `33.0.0`

So after that you will get:

```
android
  ├── android-ndk-r25c
  ├── build-tools
  │   └── 33.0.0
  ├── cmdline-tools
  │   └── latest
  ├── platforms
  │   └── android-30
  └── platform-tools
```

### Fix the NDK

The NDK (particularly, the llvm/clang binary directory) have some files that contain a path to other executable as their data.

System doesn’t understand it. Let’s replace them as symlinks:

```bash
# you may already have these from p4a guide
ANDROIDSDK="$DIR_BUILD/android"
ANDROIDNDK="$DIR_BUILD/android/android-ndk-r25c"
# feel free to check this script
python3 $DIR_GIT/Cat-Printer/build-android/fix-ndk-execs.py $ANDROIDNDK
```

## Setup

### Environment

```bash
# Install Docker Engine. This is for Arch-based OS
sudo pacman -Syu docker
# (I didn’t try Docker Desktop)
```

For China Mainland users, configuring a mirror may be helpful. See https://mirrors.sjtug.sjtu.edu.cn/docs/docker-registry  
after that, restart docker service, or reboot.

----

```bash
# let’s create the container by first pulling the image
docker pull archlinux:latest
# please, pass previously mentioned directories (or their parent) via -v parameter, we will access them here
# example: `-v /source1/android:/target1/android -v /source2/git-repo:/target2/git-repo`
docker create --name catbuild -v /mnt/data:/mnt/data --tty -i archlinux

# From now on, start the container like this
docker start -i catbuild
```

----

OK, we are now inside the container shell. Set it up:

```bash
# (Optional) use a repository mirror:
# cd /etc/pacman.d; mv mirrorlist mirrorlist.bak; echo 'Server = https://mirrors.ustc.edu.cn/archlinux/$repo/os/$arch' >mirrorlist
pacman -Syuu jdk-openjdk python3 python-pip git cython zip nano vim tar wget unzip base-devel clang lld libffi
# find python-for-android dependencies here:
#   https://python-for-android.readthedocs.io/en/latest/quickstart/#installing-dependencies
# there should be command for Arch/Ubuntu that you can directly run
# (Optional) use a pypi mirror:
# pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
pip install python-for-android cython bleak
```

### Source Code

The most tricky fact is that none of these things work out-of-the-box.

We should glue them up by hand.

```bash
# append target paths and environment variables required by python-for-android (adjust if necessary)
echo '
export DIR_BUILD="/mnt/data/@"
export ANDROIDSDK="$DIR_BUILD/android"
export ANDROIDNDK="$DIR_BUILD/android/android-ndk-r25c"
export ANDROIDAPI="30"
export NDKAPI="21"' >> .bashrc

# reload environment variables
source ~/.bashrc
```

----

```bash
# define shortcut(s). use your target paths!
DIR_GIT="$DIR_BUILD/git-repo/"
# note this involves python version, change as needed
DIR_P4A="/usr/local/lib/python3.10/dist-packages/pythonforandroid/"

# p4a will generate some intermediate data. “expose” this to the host for convenient manipulation.
mkdir -p ~/.local/share/
ln -s $DIR_BUILD/p4a/ ~/.local/share/python-for-android

# give p4a the bleak recipe. fortunately, p4a will resolve this symlink
ln -s $DIR_GIT/bleak/bleak/backends/p4android/recipes/bleak $DIR_P4A/recipes/bleak
```

----

At this point, do some code patch.

AdvancedWebView have a deprecated function override that fails the compile. Remove it.

```bash
cd $DIR_GIT/Android-AdvancedWebView/Source/library/src/main/java/im/delight/android/webview/
# any editor is okay. you can do it at host side with graphical editor.
nano AdvancedWebView.java
# search for `public void onUnhandledInputEvent`, remove (or comment out) the *entire function body*
```

Modify p4a webview bootstrap to use AdvancedWebView instead

```bash
# copy source file to somewhere easy to access
cd $DIR_GIT
cp $DIR_P4A/bootstraps/webview/build/src/main/java/org/kivy/android/PythonActivity.java ./
# some sed script doing the dirty work
sed -i 's/import android.webkit.WebView;/import im.delight.android.webview.AdvancedWebView;/' PythonActivity.java
sed -i -r 's/\bWebView\b/AdvancedWebView/g' PythonActivity.java
```

Not the end yet —  
You really want to use a graphical editor now, except if you enjoy vim or emacs...

- (At host side) Open the file with an editor

- Search & remove these two `@Override` decorators:

```java
//@Override
public boolean shouldOverrideUrlLoading

//@Override
public void onPageFinished
```

- Add this after the line `protected void onActivityResult`:

```java
// pass this activity to AdvancedWebView instance, to get <input type="file" /> really work
if ( requestCode == 51426 ) {
    mWebView.onActivityResult(requestCode, resultCode, intent);
    return;
}
```

- (Optional) Remove the problematic “Tap again to close the app” behavior:  
  Find function `public boolean onKeyDown`, remove everything inside except the `return` clause.

----

```bash
# save the modification, overwrite the original
# (you can make a backup if you feel it right)
cp $DIR_GIT/PythonActivity.java $DIR_P4A/bootstraps/webview/build/src/main/java/org/kivy/android/PythonActivity.java

# customize the loading page with Cat-Printer assets
cp $DIR_GIT/Cat-Printer/www/_load.html $DIR_GIT/Cat-Printer/www/icon.svg $DIR_P4A/bootstraps/webview/build/webview_includes/
```

## Build

### Debug Build

*\*Phew\**, it should be ready. Now try to build a debug version:

```bash
# always cd here
cd $DIR_GIT/Cat-Printer/build-android/
# <dot><slash><0><tab>
./0-build-android.sh
# again, feel free to check this file
```

The initial build will cost some time.

p4a will do:
- Download some source code from Internet, notably `python3` and some essential packages like `pyjnius`, `pyffi`, etc.
- Build all of them
- Build Cat-Printer code to Cython, gather everything together
- Download a Gradle package, give those assets to Gradle to complete the build.

TODO: find a way to get Gradle in China Mainland ~~without any circumvention~~

----

It worked? Congratulations! Now test your built package with an Android phone.  
(Note that if you’ve previously installed my distribution, uninstall it first, to solve signature conflict.)

It didn’t? **Don’t panic!** Check the message to see what’s wrong, try to fix it.  
Get a problem? **Say what’s up in Issue/Discussion.**

Build process messed up? Changes not applied? Execute `./2-clean-up-build.sh` to clean up, then redo the build.

Other scripts inside `build-android/` may be helpful too.

### Release Build

It’s best to publish a release build. In contrast to debug build, release build have smaller size, optimized, and signed for authority.

Before start, read [development.md](../development.md) to setup for a “pure” bundle, and build one.

Okay, now let’s generate your key, to be used to sign the apk:

```bash
# keytool is of Java. use from your build environment.
# keep this file secret! put outside of git directory, don’t lose it.
keytool -genkey -v -keystore mykeyfile.key -keyalg RSA -keysize 2048 -validity 18250 -alias mykey
```

```bash
# always cd here
cd $DIR_GIT/Cat-Printer/build-android/
# <dot><slash><3><tab>
# pass the path to keyfile as parameter
./3-formal-build.sh mykeyfile.key # On later versions of python-for-android, the keystore needs to be specified via "--keystore mykeyfile.key --signkey mykey"
# again, feel free to check this file
```

This will cost a bit more time than debug build.

Note: I’m unsure if (another or the first) Gradle is being downloaded in this step.

If it also worked, congrats again!
(On Android, the debug build conflicts with a signed release build. Uninstall one to install the other.)

Try the ultimate helper `1-build.sh`, if you also have everything in [development.md](../development.md) done.

## Troubleshooting

### Common

| Error message | Fix |
|-|-|
| path may not be null or empty string. path='null' | Keystore needs to be specified via `--keystore <keyfile>` |
| `/usr/bin/javac` is missing | JDK needs to be installed and selected as active java installation. |
| setuptools could not be imported | Fixed by specifying a different python version by adding `--requirements=pip,setuptools,wheel,hostpython3==3.9.16,python3==3.9.16,$(cat build-deps.txt)` |
| No such file or directory `bleak/setup.py` | Run `2-clean-up-build.sh` or [download the bleak source code from PyPi](https://pypi.org/project/bleak/#files) |
| No such file or directory `build-android/dist` | Create a bare bundle before creating an APK |
| JAVA_HOME is not set and no 'java' command could be found in your PATH. | Install a JDK (e.g. `openjdk-19-jdk`) |

### Special

Something like these:
(pardon me for not memorizing the log well)

```
… platform is . …
  is unsupported, assuming android-19 …
……
……
……
crtbegin… … not found
…
crtend… … not found
```

Change `$ANDROIDNDK/build/gmsl/__gmsl` line 512:
```
int_encode = $(__gmsl_tr1)$(wordlist 1,$1,$(__gmsl_input_int))
```
to this:
```
int_encode = $(__gmsl_tr1)$(wordlist 1,$(if $1, $1,0),$(__gmsl_input_int))
```

(Thanks to a comment around [here](https://stackoverflow.com/questions/10285242/openssl-using-androids-ndk-problems#answer-14369078))

## The End

You made it! You now have ability to contribute much more, outside of Cat-Printer. Try to bring an app in your mind to reality, with just Python, Web, and this build environment.
