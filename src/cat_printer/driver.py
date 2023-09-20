
import io
from typing import Coroutine
from asyncio import new_event_loop, sleep, AbstractEventLoop
from bleak import BleakScanner, BleakClient, BLEDevice
from .protocol import CatProtocol, State

class ABCPrinter(CatProtocol):

    def flush(self):
        super().flush()

    def scan(self, _timeout):
        ...

    def connect(self, _device):
        ...

    def disconnect(self):
        ...


class CatPrinter(ABCPrinter):

    advertised_service = 'af30'
    print_service = '0000ae30-0000-1000-8000-00805f9b34fb'
    tx_characteristic = '0000ae01-0000-1000-8000-00805f9b34fb'
    rx_characteristic = '0000ae02-0000-1000-8000-00805f9b34fb'

    dry_run = False
    _event_loop: AbstractEventLoop = None
    _running_coroutine: Coroutine = None
    client: BleakClient = None

    def __init__(self):
        super().__init__()
        self._event_loop = new_event_loop()

    def loop(self, coroutine: Coroutine):
        self._running_coroutine = coroutine
        result = self._event_loop.run_until_complete(coroutine)
        self._running_coroutine = None
        return result

    def flush(self):
        while self.state & State.Pause:
            self.loop(sleep(0.1))
        if self.buffer_size == 0:
            return
        self.write(self.drain())
        self.loop(sleep(0.02))
        return

    def draw(self, line: bytes):
        if self.dry_run:
            super().draw(b'\0' * len(line))
        else:
            super().draw(line)

    def scan(self, timeout=5.0, also_connect=False, detection_callback=None):
        devices = self.loop(BleakScanner.discover(timeout, detection_callback=detection_callback, service_uuids=[self.advertised_service]))
        if devices != [] and also_connect:
            self.connect(devices[0])
        return devices

    def connect(self, device: BLEDevice):
        self.client = BleakClient(device.address)
        self.loop(self.client.connect())
        self.use_model(device.name)

    def write(self, data: bytes):
        if self.client is None:
            print('cannot write; not connected to a printer yet')
            return
        self.loop(self.client.write_gatt_char(self.tx_characteristic, data, False))

    def disconnect(self):
        if self.client is not None:
            self.loop(self.client.disconnect())
            self.client = None

    def __del__(self):
        self.disconnect()
        if self._event_loop is not None:
            if self._event_loop.is_running():
                self._running_coroutine.cancel()
            self._event_loop.close()
            self._event_loop = None

class DumpPrinter(ABCPrinter):

    dumpfile: io.FileIO

    def flush(self):
        ...

    def scan(self, _timeout):
        return [BLEDevice('00:00:00:00:00:00', self.model or 'ZZ99', None, -40)]

    def connect(self, device):
        self.dumpfile = open(f'{device.name}.dump.bin', 'wb')

    def disconnect(self):
        self.dumpfile.close()

    def flush(self):
        buffer = self.drain()
        self.dumpfile.write(bytes([len(buffer)]))
        self.dumpfile.write(buffer)
