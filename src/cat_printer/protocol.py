
NEW_MODELS = ('GB03',)
NEW_MODEL_PREFIXES = ('MX',)

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

def crc8(data: bytes) -> int:
    crc = 0
    for b in data:
        crc = crc8_table[(crc ^ b) & 0xff]
    return crc & 0xff

def int_to_bytes(i: int, length=1, big_endian=False) -> bytes:
    b = bytearray(length)
    p = 0
    while i != 0:
        b[p] = i & 0xff
        i >>= 8
        p += 1
    if big_endian:
        b = reversed(b)
    return bytes(b)

class Command:
    ApplyEnergy = 0xbe
    GetDeviceState = 0xa3
    GetDeviceInfo = 0xa8
    UpdateDevice = 0xa9
    SetDpi = 0xa4
    Lattice = 0xa6
    Retract = 0xa0
    Feed = 0xa1
    Speed = 0xbd
    Energy = 0xaf
    Bitmap = 0xa2

class CommandType:
    Transfer = 0
    Response = 1

class State:
    OutOfPaper = 1 << 0
    Cover = 1 << 1
    Overheat = 1 << 2
    LowPower = 1 << 3
    Pause = 1 << 4
    Busy = 0x80

class CatProtocol():

    model = 'ZZ99'
    mtu = 200
    buffer = bytearray(mtu)
    buffer_size = 0
    state = 0
    is_new_model = False

    def __init__(self):
        pass

    def use_model(self, model: str):
        self.model = model
        if model in NEW_MODELS:
            self.is_new_model = True
        for prefix in NEW_MODEL_PREFIXES:
            if model.startswith(prefix):
                self.is_new_model = True

    def notify(self, message: bytes):
        self.state = message[6]

    def compress_ok(self):
        return self.is_new_model

    def make(self, command: int, payload: bytes, type=CommandType.Transfer):
        return bytes([
            0x51, 0x78, command, type, len(payload) & 0xff, len(payload) >> 8
        ]) + payload + bytes([crc8(payload), 0xff])

    def pend(self, data: bytes):
        size = self.buffer_size
        for b in data:
            self.buffer[size] = b
            size += 1
        self.buffer_size = size

    def flush(self):
        raise NotImplementedError('Please implement CatProtocol.flush by inheriting the class and overriding the method, that calls CatProtocol.drain to gather buffer')

    def drain(self):
        buffer = self.buffer[0:self.buffer_size]
        self.buffer_size = 0
        return buffer

    def send(self, data: bytes):
        if self.buffer_size + len(data) > self.mtu:
            self.flush()
        self.pend(data)
        return

    def sendmake(self, command: int, payload: bytes):
        self.send(self.make(command, payload))

    def draw(self, line: bytes):
        # TODO: if self.compress_ok
        self.sendmake(Command.Bitmap, line)

    def apply_energy(self):
        self.sendmake(Command.ApplyEnergy, bytes([0x01]))

    def get_device_state(self):
        self.sendmake(Command.GetDeviceState, bytes([0x00]))

    def get_device_info(self):
        self.sendmake(Command.GetDeviceInfo, bytes([0x00]))

    def update_device(self):
        self.sendmake(Command.UpdateDevice, bytes([0x00]))

    def set_dpi(self, _value=200):
        self.sendmake(Command.SetDpi, bytes([50]))

    def start_lattice(self):
        self.sendmake(Command.Lattice, bytes([0xaa, 0x55, 0x17, 0x38, 0x44, 0x5f, 0x5f, 0x5f, 0x44, 0x38, 0x2c]))

    def end_lattice(self):
        self.sendmake(Command.Lattice, bytes([0xaa, 0x55, 0x17, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x17]))

    def retract(self, points: int):
        self.sendmake(Command.Retract, int_to_bytes(points, 2))

    def feed(self, points: int):
        self.sendmake(Command.Feed, int_to_bytes(points, 2))

    def set_speed(self, value: int):
        self.sendmake(Command.Speed, int_to_bytes(value))

    def set_energy(self, value: int):
        self.sendmake(Command.Energy, int_to_bytes(value, 2))

    def prepare(self, speed: int, energy: int):
        self.flush()
        self.get_device_state()
        self.set_dpi()
        self.set_speed(speed)
        self.set_energy(energy)
        self.apply_energy()
        self.update_device()
        self.start_lattice()
        self.flush()

    def finish(self, extra_feed: int):
        self.flush()
        self.end_lattice()
        self.set_speed(8)
        self.feed(extra_feed)
        self.get_device_state()
        self.flush()
