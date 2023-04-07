'''
Python snippet for reading PF2 font files: http://grub.gibibit.com/New_font_format

No rights reserved.
License CC0-1.0-only: https://directory.fsf.org/wiki/License:CC0

Don't forget to see how it's used in `text_print.py`
'''

import io
from typing import Dict, Tuple

def uint32be(b: bytes):
    'Translate 4 bytes as unsigned big-endian 32-bit int'
    return (
        (b[0] << 24) +
        (b[1] << 16) +
        (b[2] << 8) +
        b[3]
    )

def int32be(b: bytes):
    'Translate 4 bytes as signed big-endian 32-bit int'
    u = uint32be(b)
    return u - ((u >> 31 & 0b1) << 32)

def uint16be(b: bytes):
    'Translate 2 bytes as big-endian unsigned 16-bit int'
    return (b[0] << 8) + b[1]

def int16be(b: bytes):
    'Translate 2 bytes as big-endian signed 16-bit int'
    u = uint16be(b)
    return u - ((u >> 15 & 0b1) << 16)


class Character():
    'A PF2 character'

    width: int
    height: int
    x_offset: int
    y_offset: int
    device_width: int
    bitmap_data: bytes

    def get_bit(self, x, y):
        'Get the bit at (x, y) of this character\'s raster glyph'
        char_byte = (self.width * y + x) // 8
        char_bit = 7 - (self.width * y + x) % 8
        return self.bitmap_data[char_byte] & (0b1 << char_bit)

class PF2():
    'The PF2 class, for serializing a PF2 font file'

    broken: bool = False
    'Sets to True if the font file is bad'

    missing_character_code: int
    in_memory: bool

    font_name: str
    family: str
    weight: str
    slant: str
    point_size: int
    max_width: int
    max_height: int
    ascent: int
    descent: int
    character_index: Dict[int, Tuple[int, int]]
    data_offset: int
    data_io: io.BufferedIOBase = None

    def __init__(self, file: io.BufferedIOBase, *, read_to_mem=True, missing_character: str='?'):
        self.missing_character_code = ord(missing_character)
        self.in_memory = read_to_mem
        if read_to_mem:
            self.data_io = io.BytesIO(file.read())
            file.close()
            file = self.data_io
        self.is_pf2 = (file.read(12) == b'FILE\x00\x00\x00\x04PFF2')
        if not self.is_pf2:
            return
        while True:
            name = file.read(4)
            data_length = int32be(file.read(4))
            if name == b'CHIX':
                self.character_index = {}
                for _ in range(data_length // (4 + 1 + 4)):
                    code_point = int32be(file.read(4))
                    compression = file.read(1)[0]
                    offset = int32be(file.read(4))
                    self.character_index[code_point] = (
                        compression, offset
                    )
                continue
            elif name == b'DATA':
                file.seek(0)
                break
            data = file.read(data_length)
            if name == b'NAME':
                self.font_name = data
            elif name == b'FAMI':
                self.family = data
            elif name == b'WEIG':
                self.weight = data
            elif name == b'SLAN':
                self.slant = data
            elif name == b'PTSZ':
                self.point_size = uint16be(data)
            elif name == b'MAXW':
                self.max_width = uint16be(data)
            elif name == b'MAXH':
                self.max_height = uint16be(data)
            elif name == b'ASCE':
                self.ascent = uint16be(data)
            elif name == b'DESC':
                self.descent = uint16be(data)

    def get_char(self, char: str):
        'Get a character, returning a `Character` instance'
        char_point = ord(char)
        info = self.character_index.get(char_point)
        if info is None:
            info = self.character_index[self.missing_character_code]
        _compression, offset = info
        data = self.data_io
        data.seek(offset)
        char = Character()
        char.width = uint16be(data.read(2))
        char.height = uint16be(data.read(2))
        char.x_offset = int16be(data.read(2))
        char.y_offset = int16be(data.read(2))
        char.device_width = int16be(data.read(2))
        char.bitmap_data = data.read(
            (char.width * char.height + 7) // 8
        )
        return char

    __getitem__ = get_char

    def __del__(self):
        if self.data_io is not None:
            self.data_io.close()


class CharacterS(Character):
    'A "scaled" character'

    scale: int = 1

    def get_bit(self, x, y):
        'Get the bit at (x, y) of this character\'s raster glyph'
        scale = self.scale
        width = self.width // scale
        x //= scale
        y //= scale
        char_byte = (width * y + x) // 8
        char_bit = 7 - (width * y + x) % 8
        return (self.bitmap_data[char_byte] &
                (0b1 << char_bit)) >> char_bit

class PF2S(PF2):
    'PF2 class with glyph scaling support'

    scale: int = 1

    def __init__(self, *args, scale: int=1, **kwargs):
        super().__init__(*args, **kwargs)
        if self.broken:
            return
        self.scale = scale
        self.point_size *= scale
        self.max_width *= scale
        self.max_height *= scale
        self.ascent *= scale
        self.descent *= scale

    def get_char(self, char):
        scale = self.scale
        char = super().get_char(char)
        chars = CharacterS()
        chars.scale = scale
        chars.width = char.width * scale
        chars.height = char.height * scale
        chars.device_width = char.device_width * scale
        chars.x_offset = char.x_offset * scale
        chars.y_offset = char.y_offset * scale
        chars.bitmap_data = char.bitmap_data
        return chars

    __getitem__ = get_char
