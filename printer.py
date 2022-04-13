'Cat-Printer'

import io
import sys
import argparse
import asyncio
from typing import List, Union, Any, Mapping
from bleak import BleakClient, BleakScanner
from bleak.exc import BleakError, BleakDBusError

try:
    from additional.i18n import I18n
except ImportError:
    class I18n():
        'Dummy i18n in case "full" version is missing'

        def __init__(self, _search_path=None, _lang=None, _fallback=None):
            pass

        def __getitem__(self, keys):
            if not isinstance(keys, tuple):
                keys = (keys, )
            return '  '.join([str(x) for x in keys])

i18n = I18n('www/lang')


class PrinterError(Exception):
    'Error of Printer driver'


models = ('GT01', 'GB01', 'GB02', 'GB03')

crc8_table = [
    0x00, 0x07, 0x0e, 0x09, 0x1c, 0x1b, 0x12, 0x15, 0x38, 0x3f, 0x36, 0x31,
    0x24, 0x23, 0x2a, 0x2d, 0x70, 0x77, 0x7e, 0x79, 0x6c, 0x6b, 0x62, 0x65,
    0x48, 0x4f, 0x46, 0x41, 0x54, 0x53, 0x5a, 0x5d, 0xe0, 0xe7, 0xee, 0xe9,
    0xfc, 0xfb, 0xf2, 0xf5, 0xd8, 0xdf, 0xd6, 0xd1, 0xc4, 0xc3, 0xca, 0xcd,
    0x90, 0x97, 0x9e, 0x99, 0x8c, 0x8b, 0x82, 0x85, 0xa8, 0xaf, 0xa6, 0xa1,
    0xb4, 0xb3, 0xba, 0xbd, 0xc7, 0xc0, 0xc9, 0xce, 0xdb, 0xdc, 0xd5, 0xd2,
    0xff, 0xf8, 0xf1, 0xf6, 0xe3, 0xe4, 0xed, 0xea, 0xb7, 0xb0, 0xb9, 0xbe,
    0xab, 0xac, 0xa5, 0xa2, 0x8f, 0x88, 0x81, 0x86, 0x93, 0x94, 0x9d, 0x9a,
    0x27, 0x20, 0x29, 0x2e, 0x3b, 0x3c, 0x35, 0x32, 0x1f, 0x18, 0x11, 0x16,
    0x03, 0x04, 0x0d, 0x0a, 0x57, 0x50, 0x59, 0x5e, 0x4b, 0x4c, 0x45, 0x42,
    0x6f, 0x68, 0x61, 0x66, 0x73, 0x74, 0x7d, 0x7a, 0x89, 0x8e, 0x87, 0x80,
    0x95, 0x92, 0x9b, 0x9c, 0xb1, 0xb6, 0xbf, 0xb8, 0xad, 0xaa, 0xa3, 0xa4,
    0xf9, 0xfe, 0xf7, 0xf0, 0xe5, 0xe2, 0xeb, 0xec, 0xc1, 0xc6, 0xcf, 0xc8,
    0xdd, 0xda, 0xd3, 0xd4, 0x69, 0x6e, 0x67, 0x60, 0x75, 0x72, 0x7b, 0x7c,
    0x51, 0x56, 0x5f, 0x58, 0x4d, 0x4a, 0x43, 0x44, 0x19, 0x1e, 0x17, 0x10,
    0x05, 0x02, 0x0b, 0x0c, 0x21, 0x26, 0x2f, 0x28, 0x3d, 0x3a, 0x33, 0x34,
    0x4e, 0x49, 0x40, 0x47, 0x52, 0x55, 0x5c, 0x5b, 0x76, 0x71, 0x78, 0x7f,
    0x6a, 0x6d, 0x64, 0x63, 0x3e, 0x39, 0x30, 0x37, 0x22, 0x25, 0x2c, 0x2b,
    0x06, 0x01, 0x08, 0x0f, 0x1a, 0x1d, 0x14, 0x13, 0xae, 0xa9, 0xa0, 0xa7,
    0xb2, 0xb5, 0xbc, 0xbb, 0x96, 0x91, 0x98, 0x9f, 0x8a, 0x8d, 0x84, 0x83,
    0xde, 0xd9, 0xd0, 0xd7, 0xc2, 0xc5, 0xcc, 0xcb, 0xe6, 0xe1, 0xe8, 0xef,
    0xfa, 0xfd, 0xf4, 0xf3
]


def crc8(data: Union[bytes, bytearray]):
    'crc8 hash'
    crc = 0
    for byte in data:
        crc = crc8_table[(crc ^ byte) & 0xFF]
    return crc & 0xFF


def set_attr_if_not_none(obj: Any, attrs: Mapping[str, str]):
    ''' set the attribute of `obj` if the value is not `None`
        `attrs` is `dict` of attr-value pair
    '''
    for name in attrs:
        value = attrs[name]
        if value is not None:
            setattr(obj, name, value)


def reverse_binary(value: int):
    'Get the binary value of `value` and return the binary-reversed form of it as an `int`'
    return int(f"{bin(value)[2:]:0>8}"[::-1], 2)


def make_command(
    command: int, payload: Union[bytes, bytearray], *,
    prefix: List[int] = None
) -> bytearray:
    'Make a `bytearray` with command data, which can be sent to printer directly to operate'
    if len(payload) > 0x100:
        raise Exception('Too large payload')
    message = bytearray()
    if prefix is not None:
        message += prefix
    message += bytearray([
        0x51, 0x78,
        command, 0x00,
        len(payload), 0x00,
        *payload, crc8(payload),
        0xFF
    ])
    return message


class PrinterCommands():
    'Constants of command flags used by the printer'
    RetractPaper = 0xA0     # Data: Number of steps to go back
    FeedPaper = 0xA1        # Data: Number of steps to go forward
    # Data: Line to draw. 0 bit -> don't draw pixel, 1 bit -> draw pixel
    DrawBitmap = 0xA2
    DrawingMode = 0xBE      # Data: 1 for Text, 0 for Images
    SetEnergy = 0xAF        # Data: 1 - 0xFFFF
    SetQuality = 0xA4       # Data: 1 - 5
    UpdateDevice = 0xA9     # Data: 0x00
    LatticeControl = 0xA6


class PBMData():
    'Extract/Serialize PBM data'
    width: int
    height: int
    data: bytes
    args: dict
    'Note: going to put this in `PrinterDriver` in the future'

    def __init__(self, width: int, height: int, data: bytes, args: dict = None):
        self.width = width
        self.height = height
        self.data = data
        self.args = {
            # setting to \x01 may make it faster. but don't know if there are drawbacks
            PrinterCommands.DrawingMode: b'\x00',
            PrinterCommands.SetEnergy: b'\xE0\x2E',
            PrinterCommands.SetQuality: b'\x05'
        }
        if args:
            for arg in args:
                self.args[arg] = args[arg]

class TextCanvas():
    'Canvas for text printing, requires PF2 lib'
    width: int
    height: int
    canvas: bytearray = None
    pf2 = None
    def __init__(self, width):
        if self.pf2 is None:
            from additional.pf2 import PF2
            self.pf2 = PF2()
        self.width = width
        self.height = self.pf2.max_height + self.pf2.descent
        self.flush_canvas()
    def flush_canvas(self):
        'Flush the canvas, returning the canvas data'
        if self.canvas is None:
            pbm_data = None
        else:
            pbm_data = bytearray(self.canvas)
        self.canvas = bytearray(self.width * self.height // 8)
        return pbm_data
    def puttext(self, text):
        'Put the specified text to canvas'
        current_width = 0
        canvas_length = len(self.canvas)
        pf2 = self.pf2
        for i in text:
            char = pf2[i]
            if (
                current_width + char.width + char.x_offset > self.width or
                i == '\n'
            ):
                yield self.flush_canvas()
                current_width = 0
            if i in '\n':   # glyphs that should not be printed out
                continue
            for x in range(char.width):
                for y in range(char.height):
                    target_x = x + char.x_offset
                    target_y = pf2.ascent + (y - char.height) - char.y_offset
                    canvas_byte = (self.width * target_y + current_width + target_x) // 8
                    canvas_bit = 7 - (self.width * target_y + current_width + target_x) % 8
                    if canvas_byte < 0 or canvas_byte >= canvas_length:
                        continue
                    char_byte = (char.width * y + x) // 8
                    char_bit = 7 - (char.width * y + x) % 8
                    self.canvas[canvas_byte] |= (
                        char.bitmap_data[char_byte] & (0b1 << char_bit)
                    ) >> char_bit << canvas_bit
            current_width += char.device_width
        return

class PrinterDriver():
    'Manipulator of the printer'

    name: str = None
    'The Bluetooth name of the printer'

    address: str = None
    'The Bluetooth MAC address of the printer'

    frequency = 0.8
    ''' Time to wait between communication to printer, in seconds,
        too low value will cause gaps/tearing of printed content,
        while too high value will make printer slow/clumsy
    '''
    feed_after = 128
    'Extra paper to feed at the end of printing, by pixel'

    dry_run = None
    'Is dry run (emulate print process but print nothing)'

    dump = None
    'Dump the traffic (and PBM image when text printing)?'

    paper_width = 384
    'It\'s a constant for the printer'

    pbm_data_per_line = int(paper_width / 8)  # 48
    'Determined by paper width & PBM data format'

    characteristic = '0000ae01-0000-1000-8000-00805f9b34fb'
    'The BLE characteristic, a constant of the printer'

    mtu = 200

    text_canvas: TextCanvas = None
    'A `TextCanvas` instance'

    def __init__(self):
        pass

    def _read_pbm(self, path: str = None, data: bytes = None):
        if path is not None and path != '-':
            file = open(path, 'rb')
            data = file.read()
            file.close()
        elif data is not None:
            pass
        else:
            data = sys.stdin.buffer.read()
        if data[0:3] != b'P4\n':
            raise Exception('Specified file is not a PBM image')
        # there can be several "chunks", by e.g. cat-ing several files, or ghostscript output
        chunks = data.split(b'P4\n')[1:]
        result = b''
        total_height = 0
        for chunk in chunks:
            page = io.BytesIO(chunk)
            while True:
                # There can be comments. Skip them
                line = page.readline()[0:-1]
                if line[0:1] != b'#':
                    break
            width, height = [int(x) for x in line.split(b' ')[0:2]]
            if width != self.paper_width:
                raise Exception('PBM image width is not 384px')
            total_height += height
            expected_data_size = self.pbm_data_per_line * height
            raw_data = page.read()
            data_size = len(raw_data)
            if data_size != expected_data_size:
                raise Exception('Broken PBM file data')
            if self.dry_run:
                # Dry run: put blank data
                result += b'\x00' * expected_data_size
            else:
                result += raw_data
        return PBMData(self.paper_width, total_height, result)

    def _pbm_data_to_raw(self, data: PBMData):
        buffer = bytearray()
        # new/old print command
        if self.name == 'GB03':
            buffer.append(0x12)
        buffer += bytearray([0x51, 0x78, 0xa3, 0x00,
                            0x01, 0x00, 0x00, 0x00, 0xff])
        for key in data.args:
            buffer += make_command(key, data.args[key])
        buffer += make_command(
            PrinterCommands.LatticeControl,
            bytearray([0xAA, 0x55, 0x17, 0x38, 0x44,
                      0x5F, 0x5F, 0x5F, 0x44, 0x38, 0x2C])
        )
        for i in range(data.height):
            data_for_a_line = data.data[
                i * self.pbm_data_per_line:
                (i + 1) * self.pbm_data_per_line
            ]
            if i % 200 == 0:
                buffer += make_command(
                    PrinterCommands.LatticeControl,
                    bytearray([0xAA, 0x55, 0x17, 0x00, 0x00,
                              0x00, 0x00, 0x00, 0x00, 0x00, 0x17])
                )
                # buffer += make_command(
                #     PrinterCommands.UpdateDevice,
                #     bytearray([0x00])
                # )
            buffer += make_command(
                PrinterCommands.DrawBitmap,
                bytearray([reverse_binary(x) for x in data_for_a_line])
            )
        buffer += make_command(
            PrinterCommands.LatticeControl,
            bytearray([0xAA, 0x55, 0x17, 0x00, 0x00,
                      0x00, 0x00, 0x00, 0x00, 0x00, 0x17])
        )
        if self.feed_after > 0:
            buffer += make_command(
                PrinterCommands.FeedPaper,
                bytearray([self.feed_after % 256, self.feed_after // 256])
            )
        return buffer

    async def send_buffer(self, buffer: bytearray, address: str = None):
        'Send manipulation data (buffer) to the printer via bluetooth'
        if self.dump:
            with open('traffic.dump', 'wb') as file:
                file.write(buffer)
        address = address or self.address
        client = BleakClient(address, timeout=5.0)
        await client.connect()
        count = 0
        total = len(buffer) // self.mtu
        while True:
            start = count * self.mtu
            end = count * self.mtu + self.mtu
            if count < total:
                await client.write_gatt_char(self.characteristic, buffer[start:end])
                if count % 16 == 0:
                    await asyncio.sleep(self.frequency)
                count += 1
            else:
                await client.write_gatt_char(self.characteristic, buffer[start:])
                break
        await client.disconnect()

    async def search_all_printers(self, timeout: int):
        ''' Search for all printers around with bluetooth.
            Only known-working models will show up.
        '''
        timeout = timeout or 3
        devices = await BleakScanner.discover(timeout)
        result = []
        for device in devices:
            if device.name in models:
                result.append(device)
        return result

    async def search_printer(self, timeout: int):
        'Search for a printer, returns `None` if not found'
        timeout = timeout or 3
        devices = await self.search_all_printers(timeout)
        if len(devices) != 0:
            return devices[0]
        return None

    async def print_file(self, path: str, address: str = None):
        'Method to print the specified PBM image at `path` with printer at specified MAC `address`'
        address = address or self.address
        pbm_data = self._read_pbm(path)
        buffer = self._pbm_data_to_raw(pbm_data)
        await self.send_buffer(buffer, address)

    async def print_data(self, data: bytes, address: str = None):
        'Method to print the specified PBM image `data` with printer at specified MAC `address`'
        address = address or self.address
        pbm_data = self._read_pbm(None, data)
        buffer = self._pbm_data_to_raw(pbm_data)
        await self.send_buffer(buffer, address)

    async def filter_device(self, info: str, timeout: float = 5.0) -> bool:
        'Find a suitable device with `info`: Bluetooth name or MAC address, or empty string'
        devices = await self.search_all_printers(timeout)
        if len(devices) == 0:
            return False
        if info in models:
            for device in devices:
                if device.name == info:
                    self.name, self.address = device.name, device.address
                    break
        elif info[2::3] == ':::::' or len(info.replace('-', '')) == 32:
            for device in devices:
                if device.address.lower() == info.lower():
                    self.name, self.address = device.name, device.address
                    break
        else:
            device = devices[0]
            self.name, self.address = device.name, device.address
        return True

    async def print_text(self, file_io: io.IOBase):
        'Print some text from `file_io`'
        if self.text_canvas is None:
            self.text_canvas = TextCanvas(self.paper_width)
        canvas = self.text_canvas
        header = b'P4\n%i %i\n'
        dump = bytearray()
        current_height = 0
        while True:
            text = file_io.readline()
            if not text:
                break
            for data in canvas.puttext(text):
                if self.dump:
                    dump += data
                    current_height += canvas.height
                    with open('dump.pbm', 'wb') as file:
                        file.write(header % (canvas.width, current_height))
                        file.write(dump)
                await self.print_data(bytearray(header % (canvas.width, canvas.height)) + data)


async def _main():
    'Main routine for direct command line execution'
    parser = argparse.ArgumentParser(
        description='  '.join([
            i18n['print-pbm-image-to-cat-printer'],
            i18n['supported-models-'],
            str(models)
        ])
    )
    parser.add_argument('file', default='-', metavar='FILE', type=str,
                        help=i18n['path-to-pbm-file-dash-for-stdin'])
    exgr = parser.add_mutually_exclusive_group()
    exgr.add_argument('-s', '--scan', metavar='TIME', default=3.0, required=False, type=float,
                      help=i18n['scan-for-specified-seconds'])
    exgr.add_argument('-a', '--address', metavar='xx:xx:xx:xx:xx:xx', required=False, type=str,
                      help=i18n['specify-printer-mac-address'])
    parser.add_argument('-f', '--freq', metavar='FREQ', required=False, type=float,
                        help=i18n['communication-frequency-0.8-or-1-recommended'])
    parser.add_argument('-d', '--dry', required=False, action='store_true',
                        help=i18n['dry-run-test-print-process-only'])
    parser.add_argument('-m', '--dump', required=False, action='store_true',
                        help=i18n['dump-the-traffic-to-printer-and-pbm-image-when-text-printing'])
    parser.add_argument('-t', '--text', required=False, action='store_true',
                        help=i18n['text-printing-mode-input-text-from-stdin'])
    cmdargs = parser.parse_args()
    addr = cmdargs.address
    printer = PrinterDriver()
    if not addr:
        print(i18n['cat-printer'])
        print(i18n['scanning-for-devices'])
        device = await printer.search_printer(cmdargs.scan)
        if device is not None:
            print(i18n['printing'])
        else:
            print(i18n['no-available-devices-found'])
            print(i18n['please-check-if-the-printer-is-down'])
            print(i18n['or-try-to-scan-longer'])
            sys.exit(1)
    if cmdargs.dry:
        print(i18n['dry-run'])
    set_attr_if_not_none(printer, {
        'name': device.name,
        'address': device.address,
        'frequency': cmdargs.freq,
        'dry_run': cmdargs.dry,
        'dump': cmdargs.dump
    })
    if cmdargs.text:
        if cmdargs.file == '-':
            file = sys.stdin
        else:
            file = open(cmdargs.file, 'r', encoding='utf-8')
        await printer.print_text(file)
        if cmdargs.file != '-':
            file.close()
    else:
        await printer.print_file(cmdargs.file)
    print(i18n['finished'])


async def main():
    'Run the `_main` routine while catching exceptions'
    try:
        await _main()
    except BleakError as e:
        error_message = str(e)
        if (
            'not turned on' in error_message or
            (isinstance(e, BleakDBusError) and
             getattr(e, 'dbus_error') == 'org.bluez.Error.NotReady')
        ):
            print(i18n['please-enable-bluetooth'])
            sys.exit(1)
        else:
            raise

if __name__ == '__main__':
    asyncio.run(main())
