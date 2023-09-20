
import sys
from .driver import CatPrinter, DumpPrinter
from .magick import magick_image, magick_text
from .image import read_pbm

def cli():
    printer = CatPrinter()
    # printer = DumpPrinter()
    devices = printer.scan(5.0)
    if devices != []:
        print(devices)
        printer.connect(devices[0])
    else:
        print('No cat printers found')
        return
    printer.prepare(32, 0x3000)
    path = sys.argv[1]
    with open(path, 'rb') as file:
        pbm = magick_image(file, 384, 'FloydSteinberg')
        for line in read_pbm(pbm):
            if line.count(b'\0') == len(line):
                printer.feed(1)
            else:
                printer.draw(line)
    printer.finish(128)
    printer.disconnect()
