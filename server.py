
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver, threading, urllib, os, asyncio, tempfile, platform
from printer import PrinterDriver
import bleak

def urlvar(path):
    a = path.split('?')
    d = []
    f = {}
    if len(a) > 1:
        b = a[1].split('&')
        for i in b:
            d.append(i.split('='))
    for i in d:
        if len(i) == 1:
            i.append('1')
        f[i[0]] = i[1]
    return f

mimetypes = {
    'html': 'text/html',
    'txt': 'text/plain',
    'js': 'text/javascript',
    'css': 'text/css'
}
def getmime(path):
    global mimetypes
    ext = path.split('.')[-1]
    return mimetypes.get(ext, 'application/octet-stream')

class PrinterServer(BaseHTTPRequestHandler):
    buffer = 4 * 1024 * 1024
    driver = PrinterDriver()
    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        path = urllib.parse.unquote(self.path)
        # v = urlvar(path)
        path = path.split('?')[0]
        if len(path) >= 2:
            if path[0:2] == '/~':
                action = path[2:]
                if action == 'getdevices':
                    try:
                        devices = asyncio.run(bleak.BleakScanner.discover())
                        self.send_response(200)
                        self.send_header('Content-Type', 'text/plain')
                        self.end_headers()
                        self.wfile.write('\n'.join([('%s,%s' % (x.name, x.address)) for x in devices]).encode('utf-8'))
                    except Exception as e:
                        self.send_response(500)
                        self.send_header('Content-Type', 'text/plain')
                        self.end_headers()
                        self.wfile.write(str(e).encode('utf-8'))
            else:
                # local file
                path = 'www/' + path[1:]
                if os.path.exists(path):
                    self.send_response(200)
                    self.send_header('Content-Type', getmime(path))
                    # self.send_header('Cache-Control', 'public, max-age=86400')
                    self.end_headers()
                    with open(path, 'rb') as f:
                        while True:
                            data = f.read(self.buffer)
                            if data:
                                self.wfile.write(data)
                            else:
                                break
                    return
                else:
                    self.send_response(404)
                    self.send_header('Content-Type', 'text/plain')
                    self.end_headers()
                    self.wfile.write(b'Not Found')
                    return
    def do_POST(self):
        if self.headers.get('Content-Type', '') == 'application/ipp':
            # https://datatracker.ietf.org/doc/html/rfc8010
            self.handle_ipp()
            return
        path = urllib.parse.unquote(self.path)
        v = urlvar(path)
        path = path.split('?')[0]
        if len(path) >= 2:
            if path[0:2] == '/~':
                action = path[2:]
                if action == 'print':
                    if 'mtu' in v:
                        self.driver.mtu = v['mtu']
                    if 'feed_after' in v:
                        self.driver.feed_after = v['feed_after']
                    try:
                        content_length = int(self.headers.get('Content-Length'))
                        data = self.rfile.read(content_length)
                        asyncio.run(self.driver.print_data(data, v['address']))
                        self.send_response(200)
                        self.send_header('Content-Type', 'text/plain')
                        self.end_headers()
                        self.wfile.write(b'OK')
                    except Exception as e:
                        self.send_response(500)
                        self.send_header('Content-Type', 'text/plain')
                        self.end_headers()
                        self.wfile.write(str(e).encode('utf-8'))
            else:
                self.send_response(400)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(b'Bad Request')
    def handle_ipp(self):
        path = urllib.parse.unquote(self.path)
        printer_name = path[1:]
        data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        # len_data = len(data)
        # ipp_version_number = data[0:2]
        # ipp_operation_id = data[2:4]
        # ipp_request_id = data[4:8]
        ipp_operation_attributes_tag = data[8]
        attributes = {}
        data_to_print = b''
        # b'\x01'[0] == int(1)
        if ipp_operation_attributes_tag == b'\x01'[0]:
            pointer = 9
            next_name_length_at = 10
            next_value_length_at = 10
            name = b''
            value = b''
            while data[pointer] != b'\x03'[0]:
                tag = data[pointer:pointer + 1]
                pointer += 1
                if tag[0] < 0x10:   # delimiter-tag
                    continue
                next_name_length_at = pointer + data[pointer] * 0x0100 + data[pointer + 1] + 2
                pointer += 2
                while pointer < next_name_length_at:
                    name = name + data[pointer:pointer + 1]
                    pointer += 1
                next_value_length_at = pointer + data[pointer] * 0x0100 + data[pointer + 1] + 2
                pointer += 2
                while pointer < next_value_length_at:
                    value = value + data[pointer:pointer + 1]
                    pointer += 1
                attributes[name] = (tag, value)
                name = b''
                value = b''
            pointer += 1
            data_to_print = data[pointer:]
        if data_to_print == b'':
            self.send_response(200)
            self.send_header('Content-Type', 'application/ipp')
            self.end_headers()
            self.wfile.write(
                b'\x01\x01\x00\x00\x00\x00\x00\x01\x01\x03'
            )
            return
        try:
            devices = asyncio.run(bleak.BleakScanner.discover())
            target_device = ''
            for i in devices:
                if i.name == printer_name:
                    target_device = i.address
            if target_device != '':
                platform_system = platform.system()
                temp_dir = tempfile.mkdtemp()
                temp_file_ps = os.path.join(temp_dir, 'temp.ps')
                temp_file_pbm = os.path.join(temp_dir, 'temp.pbm')
                f = open(temp_file_ps, 'wb')
                f.write(data_to_print)
                f.close()
                # https://ghostscript.com/doc/9.54.0/Use.htm#Output_device
                ghostscript_exe = 'gs'
                if platform_system == 'Windows':
                    ghostscript_exe = 'gswin32c.exe'
                elif platform_system == 'Linux':
                    ghostscript_exe = 'gs'
                elif platform_system == 'OS/2':
                    ghostscript_exe = 'gsos2'
                return_code = os.system('%s -q -sDEVICE=pbmraw -dNOPAUSE -dBATCH -dSAFER -dFIXEDMEDIA -g384x543 -r46.4441219158x46.4441219158 -dFitPage -sOutputFile="%s" "%s"' % (ghostscript_exe, temp_file_pbm, temp_file_ps))
                if return_code == 0:
                    asyncio.run(self.driver.print_file(temp_file_pbm, target_device))
                else:
                    raise Exception('Error on invoking Ghostscript')
                # print(data_to_print)
            self.send_response(200)
            self.send_header('Content-Type', 'application/ipp')
            self.end_headers()
            self.wfile.write(
                b'\x01\x01\x00\x00\x00\x00\x00\x01\x01\x03'
            )
        except Exception as _:
            self.send_response(500)
            self.send_header('Content-Type', 'application/ipp')
            self.end_headers()
            self.wfile.write(b'')


class ThreadedHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    """ Handle requests in a separate thread. """

if __name__ == '__main__':
    address, port = '', 8095
    server = ThreadedHTTPServer((address, port), PrinterServer)
    try:
        # Start a thread with the server -- that thread will then start one
        # more thread for each request
        server_thread = threading.Thread(target=server.serve_forever)
        # Exit the server thread when the main thread terminates
        server_thread.daemon = True
        server_thread.start()
        print('http://localhost:8095/')
        server.serve_forever()
    except KeyboardInterrupt:
        pass
