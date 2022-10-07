'''
Cat-Printer: Web Interface Server

Copyright © 2021-2022 NaitLee Soft. All rights reserved.

License GPL-3.0-or-later: https://www.gnu.org/licenses/gpl-3.0.html
'''

# if pylint is annoying you, see file .pylintrc

import os
import io
import sys
import json
import platform
import warnings

# For now we can't use `ThreadingHTTPServer`
from http.server import HTTPServer, BaseHTTPRequestHandler

# import `printer` first, to diagnostic some common errors
from printer import PrinterDriver, PrinterError, i18n, info

from bleak.exc import BleakDBusError, BleakError    # pylint: disable=wrong-import-order

from printer_lib.ipp import IPP

# Supress non-sense asyncio warnings
warnings.simplefilter('ignore', RuntimeWarning, 0, True)

IsAndroid = (os.environ.get("P4A_BOOTSTRAP") is not None)

class DictAsObject(dict):
    """ Let you use a dict like an object in JavaScript.
    """
    def __getattr__(self, key):
        return self.get(key, None)
    def __setattr__(self, key, value):
        self[key] = value

class PrinterServerError(PrinterError):
    'Error of PrinterServer'

mime_type = {
    'html': 'text/html;charset=utf-8',
    'css': 'text/css;charset=utf-8',
    'js': 'text/javascript;charset=utf-8',
    'txt': 'text/plain;charset=utf-8',
    'json': 'application/json;charset=utf-8',
    'png': 'image/png',
    'svg': 'image/svg+xml;charset=utf-8',
    'wasm': 'application/wasm',
    'octet-stream': 'application/octet-stream'
}
def mime(url: str):
    'Get pre-defined MIME type of a certain url by extension name'
    return mime_type.get(url.rsplit('.', 1)[-1], mime_type['octet-stream'])

def concat_files(*paths, prefix_format='', buffer=4 * 1024 * 1024) -> bytes:
    'Generator, that yields buffered file content, with optional prefix'
    for path in paths:
        yield prefix_format.format(path).encode('utf-8')
        with open(path, 'rb') as file:
            while data := file.read(buffer):
                yield data

class PrinterServerHandler(BaseHTTPRequestHandler):
    '(Local) server handler for Cat Printer Web interface'

    buffer = 4 * 1024 * 1024

    max_payload = buffer * 16

    settings = DictAsObject({
        'config_path': 'config.json',
        'version': 3,
        'first_run': True,
        'is_android': False,
        'scan_time': 4.0,
        'dry_run': False,
        'energy': 64,
        'quality': 32
    })
    _settings_blacklist = (
        'printer', 'is_android'
    )
    all_js: list = []

    printer: PrinterDriver = PrinterDriver()

    ipp: IPP = None

    def log_request(self, _code=200, _size=0):
        pass

    def log_error(self, *_args):
        pass

    def handle_one_request(self):
        try:
            # this handler would have only one instance
            # broken pipe could make it die. ignore
            super().handle_one_request()
        except BrokenPipeError:
            pass

    def do_GET(self):
        'Called when server got a GET http request'
        # prepare
        path, _, _args = self.path.partition('?')
        if '/..' in path or '../' in path:
            return
        if path == '/':
            path += 'index.html'
        # special
        if path.startswith('/~'):
            action = path[2:]
            if action == 'every.js':
                self.send_response(200)
                self.send_header('Content-Type', mime(path))
                self.end_headers()
                for data in concat_files(*(self.all_js), prefix_format='\n// {0}\n'):
                    self.wfile.write(data)
                return
        path = 'www' + path
        # not found
        if not os.path.isfile(path):
            self.send_response(404)
            self.send_header('Content-Type', mime('txt'))
            self.end_headers()
            return
        # static
        self.send_response(200)
        self.send_header('Content-Type', mime(path))
        # self.send_header('Content-Size', str(os.stat(path).st_size))
        self.end_headers()
        with open(path, 'rb') as file:
            while True:
                chunk = file.read(self.buffer)
                if not self.wfile.write(chunk):
                    break
        return

    def api_success(self, body_json=None):
        'Called when an API call is being considered successful'
        self.send_response(200)
        self.send_header('Content-Type', mime('json'))
        self.end_headers()
        if body_json is None:
            self.wfile.write(b'{}')
        else:
            self.wfile.write(json.dumps(body_json).encode('utf-8'))

    def api_fail(self, error_json):
        'Called when an API call is failed'
        self.send_response(500)
        self.send_header('Content-Type', mime('json'))
        self.end_headers()
        self.wfile.write(json.dumps(error_json).encode('utf-8'))
        self.wfile.flush()

    def load_config(self):
        'Load config file, or if not exist, create one with default'
        if IsAndroid:
            self.settings['is_android'] = True
            from android.storage import app_storage_path    # pylint: disable=import-error
            settings_path = app_storage_path()
            os.makedirs(settings_path, exist_ok=True)
            self.settings['config_path'] = os.path.join(
                settings_path, 'config.json'
            )
        if os.path.exists(self.settings.config_path):
            with open(self.settings.config_path, 'r', encoding='utf-8') as file:
                settings = DictAsObject(json.load(file))
                if (settings.version is None or
                    settings.version < self.settings.version):
                    # Version too old, start over
                    # TODO: selective?
                    self.save_config()
                    return
                for key in settings:
                    self.settings[key] = settings[key]
        else:
            self.save_config()

    def save_config(self):
        'Save config file'
        with open(self.settings.config_path, 'w', encoding='utf-8') as file:
            settings = {}
            for i in self.settings:
                if i not in self._settings_blacklist:
                    settings[i] = self.settings[i]
            json.dump(settings, file, indent=4)

    def update_printer(self):
        'Update `PrinterDriver` state/config'
        self.printer.dry_run = self.settings.dry_run
        self.printer.scan_time = self.settings.scan_time
        self.printer.fake = self.settings.fake
        self.printer.dump = self.settings.dump
        if self.settings.energy is not None:
            self.printer.energy = int(self.settings.energy) * 0x100
        if self.settings.quality is not None:
            self.printer.speed = int(self.settings.quality)
        self.printer.flip_h = self.settings.flip_h or self.settings.flip
        self.printer.flip_v = self.settings.flip_v or self.settings.flip
        self.printer.rtl = self.settings.force_rtl

    def handle_api(self):
        'Handle API request from POST'
        content_length = int(self.headers.get('Content-Length'))
        body = self.rfile.read(content_length)
        api = self.path[1:]
        if api == 'print':
            self.update_printer()
            self.printer.print(io.BytesIO(body))
            self.api_success()
            return
        data = DictAsObject(json.loads(body))
        if api == 'devices':
            self.printer.connect(None)
            devices_list = [{
                'name': device.name,
                'address': device.address
            } for device in self.printer.scan(everything=data.get('everything'))]
            self.api_success({
                'devices': devices_list
            })
            return
        if api == 'query':
            self.load_config()
            self.api_success(self.settings)
            return
        if api == 'set':
            for key in data:
                self.settings[key] = data[key]
            self.save_config()
            self.update_printer()
            self.api_success()
            return
        if api == 'connect':
            name, address = data['device'].split(',')
            self.printer.connect(name, address)
            self.api_success()
        if api == 'exit':
            self.api_success()
            self.exit()

    def exit(self):
        'Stop correctly & cleanly'
        self.save_config()
        self.printer.unload()
        sys.exit(0)

    def do_POST(self):
        'Called when server got a POST http request'
        content_length = int(self.headers.get('Content-Length', -1))
        if (content_length < -1 or
            content_length > self.max_payload
        ):
            return
        if self.headers.get('Content-Type') == 'application/ipp':
            if self.ipp is None:
                self.ipp = IPP(self)
            self.ipp.handle_ipp()
            return
        try:
            self.handle_api()
            return
        except BleakDBusError as e:
            # TODO: better error reporting
            self.api_fail({
                'name': e.dbus_error,
                'details': e.dbus_error_details
            })
        except BleakError as e:
            self.api_fail({
                'name': 'BleakError',
                'details': str(e)
            })
        except EOFError as e:
            # mostly, device disconnected but not by this program
            self.api_fail({
                'name': 'EOFError',
                'details': ''
            })
        except RuntimeError as e:
            self.api_fail({
                'name': 'RuntimeError',
                'details': str(e)
            })
        except PrinterError as e:
            self.api_fail({
                'name': e.message,
                'details': e.message_localized
            })
        except Exception as e:
            self.api_fail({
                'name': 'Exception',
                'details': str(e)
            })
            raise

class PrinterServer(HTTPServer):
    ''' (local) server for Cat Printer Web Interface
        The reason to override is to only init the handler once,
        avoiding confliction, and stop cleanly
    '''

    handler_class = None
    handler: PrinterServerHandler = None

    def __init__(self, server_address, RequestHandlerClass):
        self.handler_class = RequestHandlerClass
        super().__init__(server_address, RequestHandlerClass)

    def finish_request(self, request, client_address):
        if self.handler is None:
            self.handler = self.handler_class(request, client_address, self)
            self.handler.load_config()
            with open(os.path.join('www', 'all_js.txt'), 'r', encoding='utf-8') as file:
                for path in file.read().split('\n'):
                    if path != '':
                        self.handler.all_js.append(os.path.join('www', path))
            return
        self.handler.__init__(request, client_address, self)

    def server_close(self):
        if self.handler is not None:
            self.handler.exit()
        super().server_close()


def serve():
    'Start server'
    address, port = '127.0.0.1', 8095
    listen_all = False
    if '-a' in sys.argv:
        info(i18n('will-listen-on-all-addresses'))
        listen_all = True
    server = PrinterServer(('' if listen_all else address, port), PrinterServerHandler)
    service_url = f'http://{address}:{port}/'
    if '-s' in sys.argv:
        info(i18n('serving-at-0', service_url))
    else:
        operating_system = platform.uname().system
        if operating_system == 'Windows':
            os.system(f'start {service_url} > NUL')
        elif operating_system == 'Linux':
            os.system(f'xdg-open {service_url} &> /dev/null')
        # TODO: I don't know about macOS
        # elif operating_system == 'macOS':
        else:
            info(i18n('serving-at-0', service_url))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()

if __name__ == '__main__':
    serve()
