# Maintainer : 

pkgname=cat-printer-git
pkgver=r153.85cb5a8
pkgrel=1
pkgdesc="A project that provides support to some Bluetooth Cat Printer models, on many platforms!"
arch=('any')
url="https://github.com/NaitLee/Cat-Printer"
license=('GPL3')
depends=('python' 'bluez' 'python-bleak')
optdepends=('bluez-utils' 'ghostscript' 'imagemagick')
makedepends=('git' 'unzip')
provides=("cat-printer=${pkgver}")
source=("$pkgname::git+https://github.com/NaitLee/Cat-Printer.git")
md5sums=('SKIP')
sha256sums=('SKIP')
options=(!strip emptydirs)
pkgver() {
  cd "$pkgname"
  printf "r%s.%s" "$(git rev-list --count HEAD)" "$(git rev-parse --short HEAD)"
}
build() {
  cd "$pkgname/build-common"
  for i in $(find | grep -E '.*\.pyc'); do rm $i; done
  python3 bundle.py -b "$pkgver"
}
package() {
    mkdir -p "$pkgdir/usr/bin"
    mkdir -p "$pkgdir/usr/share/"
    mkdir -p "$pkgdir/usr/lib/systemd/system/"
    unzip "$srcdir/cat-printer-git/cat-printer-bare-$pkgver.zip" -d "$pkgdir/usr/share/"
    ln -s /usr/share/grub/unicode.pf2 "$pkgdir/usr/share/cat-printer/font.pf2"
    install -m644 "$srcdir/cat-printer-git/systemd/cat-printer.service" "$pkgdir/usr/lib/systemd/system/"
    cat <<EOF > "$pkgdir/usr/bin/cat-printer"
#!/bin/sh
cd /usr/share/cat-printer
python3 printer.py "\$@"
EOF
    chmod +x "$pkgdir/usr/bin/cat-printer"
    cat <<EOF > "$pkgdir/usr/bin/cat-printer-server"
#!/bin/sh
cd /usr/share/cat-printer
python3 server.py "\$@"
EOF
    chmod +x "$pkgdir/usr/bin/cat-printer-server"
    chmod +x "$pkgdir/usr/bin/cat-printer"
}
