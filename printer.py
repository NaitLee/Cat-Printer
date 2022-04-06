'Cat-Printer'

import io
import sys
import argparse
import asyncio
from bleak import BleakClient, BleakScanner
from bleak.exc import BleakError, BleakDBusError

class PrinterError(Exception):
    'Error of Printer driver'

models = ('GB01', 'GB02', 'GT01')

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


def crc8(data):
    'crc8 hash'
    crc = 0
    for byte in data:
        crc = crc8_table[(crc ^ byte) & 0xFF]
    return crc & 0xFF


def set_attr_if_not_none(obj, attrs):
    ''' set the attribute of `obj` if the value is not `None`
        `attrs` is `dict` of attr-value pair
    '''
    for name in attrs:
        value = attrs[name]
        if value is not None:
            setattr(obj, name, value)


def reverse_binary(value):
    'Get the binary value of `value` and return the binary-reversed form of it as an `int`'
    return int(f"{bin(value)[2:]:0>8}"[::-1], 2)


def make_command(command, payload):
    'Make a `bytes` with command data, which can be sent to printer directly to operate'
    if len(payload) > 0x100:
        raise Exception('Too large payload')
    message = bytearray([0x51, 0x78, command, 0x00, len(payload), 0x00])
    message += payload
    message.append(crc8(payload))
    message.append(0xFF)
    return bytes(message)


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

    def __init__(self, width: int, height: int, data: bytes, args: dict = None):
        self.width = width
        self.height = height
        self.data = data
        self.args = {
            PrinterCommands.DrawingMode: b'\x00',
            PrinterCommands.SetEnergy: b'\xE0\x2E',
            PrinterCommands.SetQuality: b'\x05'
        }
        if args:
            for arg in args:
                self.args[arg] = args[arg]


class PrinterDriver():
    'Manipulator of the printer'

    frequency = 0.8
    ''' Time to wait between communication to printer, in seconds,
        too low value will cause gaps/tearing of printed content,
        while too high value will make printer slow/clumsy
    '''
    feed_after = 128
    'Extra paper to feed at the end of printing, by pixel'

    dry_run = False
    'Is dry run (emulate print process but print nothing)'

    standard_width = 384
    'It\'s a constant for the printer'

    pbm_data_per_line = int(standard_width / 8)  # 48
    'Constant, determined by standard width & PBM data format'

    characteristic = '0000ae01-0000-1000-8000-00805f9b34fb'
    'The BLE characteristic, a constant of the printer'

    mtu = 200

    def __init__(self):
        pass

    def _read_pbm(self, path: str = None, data: bytes = None):
        if path is not None and path != '-':
            file = open(path, 'rb')
        elif data is not None:
            file = io.BytesIO(data)
        else:
            file = sys.stdin.buffer
        signature = file.readline()
        if signature != b'P4\n':
            raise Exception('Specified file is not a PBM image')
        width, height = self.standard_width, 0
        while True:
            # There can be comments. Skip them
            line = file.readline()[0:-1]
            if line[0:1] != b'#':
                break
        width, height = [int(x) for x in line.split(b' ')[0:2]]
        if width != self.standard_width:
            raise Exception('PBM image width is not 384px')
        expected_data_size = self.pbm_data_per_line * height
        data = file.read()
        if path is not None and path != '-':
            file.close()
        data_size = len(data)
        if data_size != expected_data_size:
            raise Exception('Broken PBM file data')
        if self.dry_run:
            # Dry run: put blank data
            data = b'\x00' * expected_data_size
        return PBMData(width, height, data)

    def _pbm_data_to_raw(self, data: PBMData):
        buffer = bytearray()
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
                #     bytes([0x00])
                # )
            buffer += make_command(
                PrinterCommands.DrawBitmap,
                bytes([reverse_binary(x) for x in data_for_a_line])
            )
        buffer += make_command(
            PrinterCommands.LatticeControl,
            bytearray([0xAA, 0x55, 0x17, 0x00, 0x00,
                      0x00, 0x00, 0x00, 0x00, 0x00, 0x17])
        )
        if self.feed_after > 0:
            buffer += make_command(
                PrinterCommands.FeedPaper,
                bytes([self.feed_after % 256, self.feed_after // 256])
            )
        return buffer

    async def send_buffer(self, buffer: bytearray, address: str):
        'Send manipulation data (buffer) to the printer via bluetooth'
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

    async def search_all_printers(self, timeout):
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
    async def search_printer(self, timeout):
        'Search for a printer, returns `None` if not found'
        timeout = timeout or 3
        devices = await self.search_all_printers(timeout)
        if len(devices) != 0:
            return devices[0]
        return None

    async def print_file(self, path: str, address: str):
        'Method to print the specified PBM image at `path` with printer at specified MAC `address`'
        pbm_data = self._read_pbm(path)
        buffer = self._pbm_data_to_raw(pbm_data)
        await self.send_buffer(buffer, address)

    async def print_data(self, data: bytes, address: str):
        'Method to print the specified PBM image `data` with printer at specified MAC `address`'
        pbm_data = self._read_pbm(None, data)
        buffer = self._pbm_data_to_raw(pbm_data)
        await self.send_buffer(buffer, address)


async def _main():
    'Main routine for direct command line execution'
    parser = argparse.ArgumentParser(
        description='''Print an PBM image to a Cat/Kitty Printer, of model GB01, GB02 or GT01.'''
    )
    parser.add_argument('file', default='-', metavar='FILE', type=str,
                        help='PBM image file to print, use \'-\' to read from stdin')
    exgr = parser.add_mutually_exclusive_group()
    exgr.add_argument('-s', '--scan', metavar='DELAY', default=3.0, required=False, type=float,
                      help='Scan for a printer for specified seconds')
    exgr.add_argument('-a', '--address', metavar='xx:xx:xx:xx:xx:xx', required=False, type=str,
                      help='The printer\'s bluetooth MAC address')
    parser.add_argument('-p', '--feed', required=False, type=int,
                        help='Extra paper to feed after printing')
    parser.add_argument('-f', '--freq', required=False, type=float,
                        help='Communication frequency, in seconds. ' +
                        'set a bit higher (eg. 1 or 1.2) if printed content is teared/have gaps')
    parser.add_argument('-d', '--dry', required=False, action='store_true',
                        help='Emulate the printing process, but actually print nothing ("dry run")')
    parser.add_argument('-m', '--mtu', required=False, type=int,
                        help='MTU of bluetooth packet (Advanced)')
    cmdargs = parser.parse_args()
    addr = cmdargs.address
    printer = PrinterDriver()
    if not addr:
        print('Cat Printer :3')
        print(f' * Finding printer devices via bluetooth in {cmdargs.scan} seconds')
        device = await printer.search_printer(cmdargs.scan)
        if device is not None:
            print(f' * Will print through {device.name} {device.address}')
        else:
            print(' ! No device found. Please check if the printer is powered on.')
            print(' ! Or try to scan longer with \'-s 6.0\'')
            sys.exit(1)
    if cmdargs.dry:
        print(' * DRY RUN')
    set_attr_if_not_none(printer, {
        'feed_after': cmdargs.feed,
        'frequency': cmdargs.freq,
        'mtu': cmdargs.mtu,
        'dry': cmdargs.dry
    })
    await printer.print_file(cmdargs.file, addr)

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
            print(' ! Please enable bluetooth on this machine :3')
            sys.exit(1)
        else:
            raise

if __name__ == '__main__':
    asyncio.run(main())
