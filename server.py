
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver, threading, urllib, os, asyncio
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
                        assert content_length == len(data), 'Post data not fully read'
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
        server.serve_forever()
    except KeyboardInterrupt:
        pass
