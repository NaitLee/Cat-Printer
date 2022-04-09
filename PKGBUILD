# Maintainer : 

pkgname=cat-printer-git
pkgver=r30.eafaa6e
pkgrel=1
pkgdesc="A project that provides support to some Bluetooth Cat Printer models, on many platforms!"
arch=('any')
url="https://github.com/NaitLee/Cat-Printer"
license=('GPL')
depends=('python' 'bluez' 'bluez-utils')
makedepends=('git')
provides=("cat-printer=${pkgver}")
source=("$pkgname::git+https://github.com/NaitLee/Cat-Printer.git")
md5sums=('SKIP')
sha256sums=('SKIP')
options=(!strip emptydirs)
pkgver() {
  cd "$pkgname"
  printf "r%s.%s" "$(git rev-list --count HEAD)" "$(git rev-parse --short HEAD)"
}
package() {
    mkdir -p "$pkgdir/usr/bin"
    mkdir -p "$pkgdir/usr/share/cat-printer"
}
