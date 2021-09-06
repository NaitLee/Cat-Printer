import asyncio
from bleak import BleakClient
import sys, os, io

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
    crc = 0
    for byte in data:
        crc = crc8_table[(crc ^ byte) & 0xFF]
    return crc & 0xFF

class PrinterCommands():
    RetractPaper = 0xA0     # Data: Number of steps to go back
    FeedPaper = 0xA1        # Data: Number of steps to go forward
    DrawBitmap = 0xA2       # Data: Line to draw. 0 bit -> don't draw pixel, 1 bit -> draw pixel
    DrawingMode = 0xBE      # Data: 1 for Text, 0 for Images
    SetEnergy = 0xAF        # Data: 1 - 0xFFFF
    SetQuality = 0xA4       # Data: 1 - 5
    UpdateDevice = 0xA9     # Data: 0x00
    LatticeControl = 0xA6

class PBMData():
    width: int
    height: int
    data: bytes
    args: dict
    def __init__(self, width=384, height=0, data=b'', args={}):
        self.width = width
        self.height = height
        self.data = data
        self.args = {
            PrinterCommands.DrawingMode: b'\x00',
            PrinterCommands.SetEnergy: b'\xE0\x2E',
            PrinterCommands.SetQuality: b'\x05'
        }
        for i in args:
            self.args[i] = args[i]

class PrinterDriver():

    mtu: int

    feed_after: int

    standard_width = 384

    standard_pbm_data_length_per_line = int(standard_width / 8)  # 48
    
    characteristic = '0000ae01-0000-1000-8000-00805f9b34fb'
    
    def __init__(self, mtu=200, feed_after=128):
        self.mtu = mtu
        self.feed_after = feed_after

    def _reverse_binary(self, value):
        return int(f"{bin(value)[2:]:0>8}"[::-1], 2)

    def _make_command(self, command, payload):
        if len(payload) > 0x100:
            raise Exception('Too large payload')
        message = bytearray([0x51, 0x78, command, 0x00, len(payload), 0x00])
        message += payload
        message.append(crc8(payload))
        message.append(0xFF)
        return bytes(message)

    def _read_pbm(self, path='', data=b''):
        if path != '':
            f = open(path, 'rb')
        elif data != b'':
            f = io.BytesIO(data)
        else:
            f = sys.stdin.buffer
        signature = f.readline()
        if signature != b'P4\n':
            raise Exception('Specified file is not a PBM image')
        width, height = self.standard_width, 0
        args = {}
        while True:
            l = f.readline()[0:-1]
            if l[0:1] == b'#':
                if l[1:2] == b'!':
                    inline_args = l[2:].split(b',')
                    args[PrinterCommands.DrawingMode] = bytes([int(inline_args[0], 16)])
                    args[PrinterCommands.SetEnergy] = bytes([int(inline_args[1], 16)])
                    args[PrinterCommands.SetQuality] = bytes([int(inline_args[2], 16)])
                continue
            width, height = [int(x) for x in l.split(b' ')[0:2]]
            if width != self.standard_width:
                raise Exception('PBM image width is not 384px')
            break
        data = f.read()
        len_data = len(data)
        if len_data != height * self.standard_pbm_data_length_per_line:
            raise Exception('Broken PBM file data')
        return PBMData(width, height, data, args)
    
    def _pbm_data_to_raw(self, data: PBMData):
        buffer = bytearray()
        for i in data.args:
            buffer += self._make_command(i, data.args[i])
        buffer += self._make_command(
            PrinterCommands.LatticeControl,
            bytearray([0xAA, 0x55, 0x17, 0x38, 0x44, 0x5F, 0x5F, 0x5F, 0x44, 0x38, 0x2C])
        )
        for i in range(data.height):
            data_for_a_line = data.data[
                i * self.standard_pbm_data_length_per_line : 
                (i + 1) * self.standard_pbm_data_length_per_line
            ]
            if i % 200 == 0:
                buffer += self._make_command(
                    PrinterCommands.LatticeControl,
                    bytearray([0xAA, 0x55, 0x17, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x17])
                )
                # buffer += self._make_command(
                #     PrinterCommands.UpdateDevice,
                #     bytes([0x00])
                # )
            buffer += self._make_command(
                PrinterCommands.DrawBitmap,
                bytes([self._reverse_binary(x) for x in data_for_a_line])
            )
        buffer += self._make_command(
            PrinterCommands.LatticeControl,
            bytearray([0xAA, 0x55, 0x17, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x17])
        )
        if self.feed_after > 0:
            buffer += self._make_command(
                PrinterCommands.FeedPaper,
                bytes([self.feed_after % 256, self.feed_after // 256])
            )
        return buffer
    
    async def _send_buffer(self, buffer: bytearray, address: str):
        client = BleakClient(address)
        await client.connect()
        # await client.write_gatt_char(self.characteristic, self._make_command(PrinterCommands.FeedPaper, bytearray([0, 0])))
        count = 0
        total = len(buffer) // self.mtu
        while True:
            start = count * self.mtu
            end = count * self.mtu + self.mtu
            if count < total:
                await client.write_gatt_char(self.characteristic, buffer[start:end])
                if count % 16 == 0:
                    await asyncio.sleep(0.5)
                count += 1
            else:
                await client.write_gatt_char(self.characteristic, buffer[start:])
                break
        await client.disconnect()
    
    async def print_file(self, path: str, address: str):
        pbm_data = self._read_pbm(path)
        buffer = self._pbm_data_to_raw(pbm_data)
        await self._send_buffer(buffer, address)

    async def print_data(self, data: bytes, address: str):
        pbm_data = self._read_pbm('', data)
        buffer = self._pbm_data_to_raw(pbm_data)
        await self._send_buffer(buffer, address)

if __name__ == '__main__':
    len_argv = len(sys.argv)
    printer = PrinterDriver()
    loop = asyncio.get_event_loop()
    if len_argv == 1:
        print(
            'Usage: %s <xx:xx:xx:xx:xx:xx> [PBM files to print...]\n' % os.path.basename(__file__) +
            '\tPrint PBM files to a Cat Printer\n' +
            '\tInput MAC address and file paths\n' +
            '\tInputing file to stdin is also supported'
        )
    else:
        if len_argv == 2:
            loop.run_until_complete(printer.print_file('', sys.argv[1]))
        elif len_argv >= 3:
            for i in sys.argv[2:]:
                loop.run_until_complete(printer.print_file(i, sys.argv[1]))
