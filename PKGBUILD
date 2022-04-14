# Maintainer : 

pkgname=cat-printer-git
pkgver=r30.eafaa6e
pkgrel=1
pkgdesc="A project that provides support to some Bluetooth Cat Printer models, on many platforms!"
arch=('any')
url="https://github.com/NaitLee/Cat-Printer"
license=('GPL3' 'MIT')
depends=('python' 'bluez' 'bluez-utils' 'python-bleak')
makedepends=('git')
provides=("cat-printer=${pkgver}")
source=("$pkgname::git+https://github.com/NaitLee/Cat-Printer.git" "i18njs4$pkgname::git+https://github.com/roddeh/i18njs.git")
md5sums=('SKIP' 'SKIP')
sha256sums=('SKIP' 'SKIP')
options=(!strip emptydirs)
pkgver() {
  cd "$pkgname"
  printf "r%s.%s" "$(git rev-list --count HEAD)" "$(git rev-parse --short HEAD)"
}
package() {
    mkdir -p "$pkgdir/usr/bin"
    mkdir -p "$pkgdir/usr/share/cat-printer"
    cp -r "$srcdir/cat-printer-git"/* "$pkgdir/usr/share/cat-printer/"
    cp -r "$srcdir/i18njs4cat-printer-git/dist/i18n.js" "$pkgdir/usr/share/cat-printer/www/i18n.js"
    rm -rf "$pkgdir/usr/share/cat-printer/build-"*
    rm -rf "$pkgdir/usr/share/cat-printer/dev-diary.txt"
    rm -rf "$pkgdir/usr/share/cat-printer/TODO"
    rm -rf "$pkgdir/usr/share/cat-printer/systemd"
    mkdir -p "$pkgdir/usr/lib/systemd/system/"
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
}
