'''
Provide *very* basic CUPS/IPP support

No rights reserved.
License CC0-1.0-only: https://directory.fsf.org/wiki/License:CC0
'''

import io
import platform
import subprocess

from .pf2 import int16be, int32be

def int8(b: bytes):
    'Translate 1 byte as signed 8-bit int'
    u = b[0]
    return u - ((u >> 7 & 0b1) << 8)

class IPP():
    'https://datatracker.ietf.org/doc/html/rfc8010'
    server = None
    def __init__(self, server):
        self.server = server
    def handle_ipp(self):
        'Handle an IPP protocol request'
        server = self.server
        content_length = int(server.headers.get('Content-Length'))
        buffer = io.BytesIO(server.rfile.read(content_length))
        _ipp_version = (int8(buffer.read(1)), int8(buffer.read(1)))
        _ipp_operation_id = int16be(buffer.read(2))
        _ipp_request_id = int32be(buffer.read(4))
        ipp_operation_attributes_tag = int8(buffer.read(1))
        attributes = {}
        data = b''
        if ipp_operation_attributes_tag == 0x01:
            while int8(buffer.read(1)) != 0x03:
                buffer.seek(-1, 1)
                tag = int8(buffer.read(1))
                if tag < 0x10:   # delimiter-tag
                    continue
                name = buffer.read(int16be(buffer.read(2)))
                value = buffer.read(int16be(buffer.read(2)))
                attributes[name] = (tag, value)
            data = buffer.read()
        # there are hard coded minimal response. this "just works" on cups
        if data == b'':
            try:
                server.send_response(200)
                server.send_header('Content-Type', 'application/ipp')
                server.end_headers()
                server.wfile.write(
                    b'\x01\x01\x00\x00\x00\x00\x00\x01\x01\x03'
                )
            except BrokenPipeError:
                pass
            return
        if data.startswith(b'%!PS-Adobe'):
            self.handle_postscript(data)
        else:
            identifier = server.path[1:]
            server.printer.print(io.BytesIO(data), mode='text', identifier=identifier)
    def handle_postscript(self, data):
        'Print PostScript data to printer, converting to PBM first with GhostScript `gs`'
        server = self.server
        platform_system = platform.system()
        # https://ghostscript.com/doc/9.54.0/Use.htm#Output_device
        if platform_system == 'Windows':
            gsexe = 'gswin32c.exe'
        elif platform_system == 'OS/2':
            gsexe = 'gsos2'
        else:
            gsexe = 'gs'
        gsproc = subprocess.Popen([
            gsexe,
            '-q', '-sDEVICE=pbmraw', '-dNOPAUSE', '-dBATCH', '-dSAFER',
            '-dFIXEDMEDIA', '-g384x543', '-r46.4441219158x46.4441219158',
            '-dFitPage', '-dFitPage',
            '-sOutputFile=-', '-'
        ], executable=gsexe, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
        pbm_data, _ = gsproc.communicate(data)
        try:
            if gsproc.wait() == 0:
                identifier = server.path[1:]
                # TODO: Make IPP can report some errors
                server.printer.print(io.BytesIO(pbm_data), mode='pbm', identifier=identifier)
            else:
                raise Exception('Error on invoking Ghostscript')
            server.send_response(200)
            server.send_header('Content-Type', 'application/ipp')
            server.end_headers()
            server.wfile.write(
                b'\x01\x01\x00\x00\x00\x00\x00\x01\x01\x03'
            )
        except Exception as _:
            server.send_response(500)
            server.send_header('Content-Type', 'application/ipp')
            server.end_headers()
