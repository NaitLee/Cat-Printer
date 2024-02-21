'''
Cat-Printer Commander(s), binary interface(s) to communicate with cat printers

No rights reserved.
License CC0-1.0-only: https://directory.fsf.org/wiki/License:CC0
'''

from abc import ABCMeta, abstractmethod

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
    'crc8 checksum'
    crc = 0
    for byte in data:
        crc = crc8_table[(crc ^ byte) & 0xff]
    return crc & 0xff

def reverse_bits(i: int):
    'Reverse the bits of this byte (as `int`)'
    i = ((i & 0b10101010) >> 1) | ((i & 0b01010101) << 1)
    i = ((i & 0b11001100) >> 2) | ((i & 0b00110011) << 2)
    return ((i & 0b11110000) >> 4) | ((i & 0b00001111) << 4)

def int_to_bytes(i: int, length=1, big_endian=False) -> bytes:
    max_value = (1 << (length * 8)) - 1
    if type(i) is not int:
        raise f'int_to_bytes: not int: {i}'
    if i < 0:
        raise f'int_to_bytes: {i} < 0'
    if i > max_value:
        raise f'int_to_bytes: {i} > {max_value}'
    b = bytearray(length)
    p = 0
    while i != 0:
        b[p] = i & 0xff
        i >>= 8
        p += 1
    if big_endian:
        b = reversed(b)
    return bytes(b)

class Commander(metaclass=ABCMeta):
    ''' Semi-abstract class, to be inherited by `PrinterDriver`
        Contains binary data communication interface for individual functions
        "Commander" of kind of printers like GB0X, GT01
        Class structure is not guaranteed to be stable
    '''

    dry_run: bool = False

    data_flow_pause = b'\x51\x78\xae\x01\x01\x00\x10\x70\xff'
    data_flow_resume = b'\x51\x78\xae\x01\x01\x00\x00\x00\xff'

    def make_command(self, command_bit, payload: bytearray, *,
                     prefix=bytearray(), suffix=bytearray()):
        'Make bytes that to be used to control printer'
        payload_size = len(payload)
        if payload_size > 0xff:
            raise ValueError(f'Command payload too big ({payload_size} > 255)')
        return prefix + bytearray(
            [ 0x51, 0x78, command_bit, 0x00, payload_size, 0x00 ]
        ) + payload + bytearray( [ crc8(payload), 0xff ] ) + suffix

    def start_printing(self):
        'Start printing'
        self.send( bytearray([0x51, 0x78, 0xa3, 0x00, 0x01, 0x00, 0x00, 0x00, 0xff]) )

    def start_printing_new(self):
        'Start printing on newer printers'
        self.send( bytearray([0x12, 0x51, 0x78, 0xa3, 0x00, 0x01, 0x00, 0x00, 0x00, 0xff]) )

    def apply_energy(self):
        ''' Apply previously set energy to printer
        '''
        self.send( self.make_command(0xbe, int_to_bytes(0x01)) )

    def get_device_state(self):
        '(unknown). seems it could refresh device state & apply config'
        self.send( self.make_command(0xa3, int_to_bytes(0x00)) )

    def get_device_info(self):
        '(unknown). seems it could refresh device state & apply config'
        self.send( self.make_command(0xa8, int_to_bytes(0x00)) )

    def update_device(self):
        '(unknown). seems it could refresh device state & apply config'
        self.send( self.make_command(0xa9, int_to_bytes(0x00)) )

    def set_dpi_as_200(self):
        '(unknown)'
        self.send( self.make_command(0xa4, int_to_bytes(50)) )

    def start_lattice(self):
        'Mark the start of printing'
        self.send( self.make_command(0xa6, bytearray(
            [0xaa, 0x55, 0x17, 0x38, 0x44, 0x5f, 0x5f, 0x5f, 0x44, 0x38, 0x2c]
        )) )

    def end_lattice(self):
        'Mark the end of printing'
        self.send( self.make_command(0xa6, bytearray(
            [ 0xaa, 0x55, 0x17, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x17 ]
        )) )

    def retract_paper(self, pixels: int):
        'Retract the paper for some pixels'
        self.send( self.make_command(0xa0, int_to_bytes(pixels, length=2)) )

    def feed_paper(self, pixels: int):
        'Feed the paper for some pixels'
        self.send( self.make_command(0xa1, int_to_bytes(pixels, length=2)) )

    def set_speed(self, value: int):
        ''' Set how quick to feed/retract paper. **The lower, the quicker.**
            My printer with value < 4 set would make it unable to feed/retract,
            maybe it's way too quick.
            Speed also affects the quality, for heat time/stability reasons.
        '''
        self.send( self.make_command(0xbd, int_to_bytes(value)) )

    def set_energy(self, amount: int):
        ''' Set thermal energy, max to `0xffff`
            By default, it's seems around `0x3000` (1 / 5)
        '''
        self.send( self.make_command(0xaf, int_to_bytes(amount, length=2)) )

    def draw_bitmap(self, bitmap_data: bytearray):
        'Print `bitmap_data`. Also does the bit-reversing job.'
        data = bytearray( map(reverse_bits, bitmap_data) )
        self.send( self.make_command(0xa2, data) )

    def draw_compressed_bitmap(self, bitmap_data: bytearray):
        'TODO. Print `bitmap_data`, compress if worthy so'
        self.draw_bitmap(bitmap_data)

    @abstractmethod
    def send(self, data):
        'Send data to device, or whatever'
        ...
