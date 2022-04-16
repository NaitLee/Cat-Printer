'Cat Printer - Serve a Web UI'

# if pylint is annoying you, see file .pylintrc

import os
import io
import sys
import json
import platform
from http.server import BaseHTTPRequestHandler

# For now we can't use `ThreadingHTTPServer`
from http.server import HTTPServer

# import `printer` first, to diagnostic some common errors
from printer import PrinterDriver, PrinterError, I18n, info

from bleak.exc import BleakDBusError, BleakError    # pylint: disable=wrong-import-order

from printer_lib.ipp import IPP

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
    'octet-stream': 'application/octet-stream'
}
def mime(url: str):
    'Get pre-defined MIME type of a certain url by extension name'
    return mime_type.get(url.rsplit('.', 1)[-1], mime_type['octet-stream'])

class PrinterServerHandler(BaseHTTPRequestHandler):
    '(Local) server handler for Cat Printer Web interface'

    buffer = 4 * 1024 * 1024

    max_payload = buffer * 16

    settings = DictAsObject({
        'config_path': 'config.json',
        'version': 1,
        'is_android': False,
        'scan_timeout': 5.0,
        'dry_run': False
    })
    _settings_blacklist = (
        'printer', 'is_android'
    )

    printer: PrinterDriver = PrinterDriver()

    ipp: IPP = None

    def log_request(self, _code=200, _size=0):
        pass

    def log_error(self, *_args):
        pass

    def do_GET(self):
        'Called when server get a GET http request'
        path = 'www' + self.path
        if self.path == '/':
            path += 'index.html'
        if '/..' in path:
            return
        if not os.path.isfile(path):
            self.send_response(404)
            self.send_header('Content-Type', mime('txt'))
            self.end_headers()
            return
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
                self.settings = settings
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
        self.printer.scan_timeout = self.settings.scan_timeout
        self.printer.fake = self.settings.fake
        self.printer.dump = self.settings.dump
        self.printer.flip_h = self.settings.flip_h
        self.printer.flip_v = self.settings.flip_v
        if self.settings.printer is not None:
            name, address = self.settings.printer.split(',')
            self.printer.connect(name, address)

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
            } for device in self.printer.scan()]
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
        if api == 'exit':
            self.api_success()
            self.exit()

    def exit(self):
        'Stop correctly & cleanly'
        self.save_config()
        self.printer.unload()
        sys.exit(0)

    def do_POST(self):
        'Called when server get a POST http request'
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

    handler: PrinterServerHandler = None

    def finish_request(self, request, client_address):
        if self.handler is None:
            self.handler = PrinterServerHandler(request, client_address, self)
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
        info(I18n['will-listen-on-all-addresses'])
        listen_all = True
    server = PrinterServer(('' if listen_all else address, port), PrinterServer)
    service_url = f'http://{address}:{port}/'
    if '-s' in sys.argv:
        info(I18n['serving-at-0', service_url])
    else:
        operating_system = platform.uname().system
        if operating_system == 'Windows':
            os.system(f'start {service_url} > NUL')
        elif operating_system == 'Linux':
            os.system(f'xdg-open {service_url} &> /dev/null')
        # TODO: I don't know about macOS
        # elif operating_system == 'macOS':
        else:
            info(I18n['serving-at-0', service_url])
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()

if __name__ == '__main__':
    serve()
