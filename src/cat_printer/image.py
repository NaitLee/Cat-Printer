
import io
import math

def reverse_bits(i: int) -> int:
    i = ((i & 0b10101010) >> 1) | ((i & 0b01010101) << 1)
    i = ((i & 0b11001100) >> 2) | ((i & 0b00110011) << 2)
    return ((i & 0b11110000) >> 4) | ((i & 0b00001111) << 4)

def read_pbm(file: io.BytesIO):
    header = file.readline()
    if header != b'P4\n':
        return
    while True:
        line = file.readline()
        if line.startswith(b'#'):
            continue
        break
    _w, _h = line.split(b' ')
    w, h = int(_w), int(_h)
    p = math.ceil(w / 8)
    while chunk := file.read(p):
        if len(chunk) == p:
            yield bytes(map(lambda b: reverse_bits(b), chunk))
        else:
            print('Warning: improper PBM data length')
            yield b'\0' * p
    return
