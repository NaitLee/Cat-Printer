'Cat Printer - Serve a Web UI'

# if pylint is annoying you, see file .pylint-rc

import os
import sys
import json
import asyncio
import platform
# Don't use ThreadingHTTPServer if you're going to use pyjnius!
from http.server import BaseHTTPRequestHandler, HTTPServer #, ThreadingHTTPServer
from bleak.exc import BleakDBusError, BleakError
from printer import PrinterDriver

class DictAsObject(dict):
    """ Let you use a dict like an object in JavaScript.
    """
    def __getattr__(self, key):
        return self.get(key, None)
    def __setattr__(self, key, value):
        self[key] = value

class PrinterServerError(Exception):
    'Error of PrinterServer'
    code: int
    name: str
    details: str
    def __init__(self, *args, code=1):
        super().__init__(*args)
        len_args = len(args)
        self.code = code
        if len_args > 0:
            self.name = args[0]
        if len_args > 1:
            self.details = args[1]

Printer = PrinterDriver()
server = None

def log(message):
    'For logging a message'
    print(message)

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

class PrinterServer(BaseHTTPRequestHandler):
    '(Local) server for Cat Printer Web interface'
    buffer = 4 * 1024 * 1024
    max_payload = buffer * 16
    printer_address: str = None
    settings = DictAsObject({
        'config_path': 'config.json',
        'is_android': False,
        'printer_address': None,
        'scan_time': 3,
        'frequency': 0.8,
        'dry_run': False
    })
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
    def api_success(self):
        'Called when a simple API call is being considered successful'
        self.send_response(200)
        self.send_header('Content-Type', mime('json'))
        self.end_headers()
        self.wfile.write(b'{}')
    def api_fail(self, error_json, error=None):
        'Called when an API call is failed'
        self.send_response(500)
        self.send_header('Content-Type', mime('json'))
        self.end_headers()
        self.wfile.write(json.dumps(error_json).encode('utf-8'))
        self.wfile.flush()
        if isinstance(error, Exception):
            raise error
    def load_config(self):
        'Load config file, or if not exist, create one with default'
        if os.environ.get("P4A_BOOTSTRAP") is not None:
            self.settings['is_android'] = True
            from android.storage import app_storage_path    # pylint: disable=import-error
            settings_path = app_storage_path()
            os.makedirs(settings_path, exist_ok=True)
            self.settings['config_path'] = os.path.join(
                settings_path, 'config.json'
            )
        if os.path.exists(self.settings.config_path):
            with open(self.settings.config_path, 'r', encoding='utf-8') as file:
                self.settings = DictAsObject(json.load(file))
        else:
            self.save_config()
    def save_config(self):
        'Save config file'
        with open(self.settings.config_path, 'w', encoding='utf-8') as file:
            json.dump(self.settings, file, indent=4)
    def handle_api(self):
        'Handle API request from POST'
        content_length = int(self.headers.get('Content-Length'))
        body = self.rfile.read(content_length)
        api = self.path[1:]
        if api == 'print':
            if self.settings.printer_address is None:
                # usually can't encounter, though
                raise PrinterServerError('No printer address specified')
            Printer.dry_run = self.settings.dry_run
            Printer.frequency = float(self.settings.frequency)
            loop = asyncio.new_event_loop()
            try:
                devices = loop.run_until_complete(
                    Printer.print_data(body, self.settings.printer_address)
                )
                self.api_success()
            finally:
                loop.close()
            return
        data = DictAsObject(json.loads(body))
        if api == 'devices':
            loop = asyncio.new_event_loop()
            try:
                devices = loop.run_until_complete(
                    Printer.search_all_printers(float(self.settings.scan_time))
                )
            finally:
                loop.close()
            devices_list = [{
                'name': device.name,
                'address': device.address
            } for device in devices]
            self.send_response(200)
            self.send_header('Content-Type', mime('json'))
            self.end_headers()
            self.wfile.write(json.dumps({
                'devices': devices_list
            }).encode('utf-8'))
            return
        if api == 'query':
            self.load_config()
            self.send_response(200)
            self.send_header('Content-Type', mime('json'))
            self.end_headers()
            self.wfile.write(json.dumps(self.settings).encode('utf-8'))
            return
        if api == 'set':
            for key in data:
                self.settings[key] = data[key]
            self.save_config()
            self.api_success()
            return
        if api == 'exit':
            self.api_success()
            self.save_config()
            # Only usable when using ThreadingHTTPServer
            # server.shutdown()
            sys.exit(0)
    def do_POST(self):
        'Called when server get a POST http request'
        content_length = int(self.headers.get('Content-Length', -1))
        if (content_length == -1 or
            content_length > self.max_payload
        ):
            self.send_response(400)
            self.send_header('Content-Type', mime('txt'))
            self.end_headers()
            return
        try:
            self.handle_api()
            return
        except BleakDBusError as e:
            self.api_fail({
                'code': -2,
                'name': e.dbus_error,
                'details': e.dbus_error_details
            })
        except BleakError as e:
            self.api_fail({
                'code': -3,
                'name': 'BleakError',
                'details': str(e)
            })
        except PrinterServerError as e:
            self.api_fail({
                'code': e.code,
                'name': e.name,
                'details': e.details
            })
        except Exception as e:
            self.api_fail({
                'code': -1,
                'name': 'Exception',
                'details': str(e)
            }, e)

def serve():
    'Start server'
    address, port = '127.0.0.1', 8095
    listen_all = False
    if '-a' in sys.argv:
        print('Will listen on ALL addresses')
        listen_all = True
    global server
    # Again, Don't use ThreadingHTTPServer if you're going to use pyjnius!
    server = HTTPServer(('' if listen_all else address, port), PrinterServer)
    service_url = f'http://{address}:{port}/'
    if '-s' in sys.argv:
        print(service_url)
    else:
        operating_system = platform.uname().system
        if operating_system == 'Windows':
            os.system(f'start {service_url} > NUL')
        elif operating_system == 'Linux':
            os.system(f'xdg-open {service_url} &> /dev/null')
        # TODO: I don't know about macOS
        # elif operating_system == 'macOS':
        else:
            print(f'Will serve application at: {service_url}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    serve()
