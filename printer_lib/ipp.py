'''
Provide *very* basic CUPS/IPP support

No rights reserved.
License CC0-1.0-only: https://directory.fsf.org/wiki/License:CC0
'''

import io
import platform
import subprocess
from enum import IntEnum

from .pf2 import int16be, int32be

def int8(b: bytes):
    'Translate 1 byte as signed 8-bit int'
    u = b[0]
    return u - ((u >> 7 & 0b1) << 8)

class IppAttributeGroups(IntEnum):
    '''
    Refer to RFC 8010, section 3.5.1 "delimiter-tag" values:
    These tags are used to group attributes.
    '''
    OPERATION = 0x01   # operation-attributes-tag
    JOB = 0x02         # job-attributes-tag
    END = 0x03         # end-of-attributes-tag
    PRINTER = 0x04     # printer-attributes-tag
    UNSUPPORTED = 0x05 # unsupported-attributes-tag

class IppMessage:
    '''
    IPP Request or Response as described in section "3.1.1 Request and Response"
    of RFC 8010. Don't use this directly, use IppRequest or IppResponse instead.
    '''
    def __init__(self, version, request_id, attributes):
        self.version = version  # (major, minor)
        self.request_id = request_id
        self.attributes = attributes
        self.data = None

    @classmethod
    def from_bytesio(cls, buffer, is_request: bool):
        version, code, request_id, attributes = cls.parse_header(buffer)
        message = None
        if is_request:
            message = IppRequest(version, code, request_id, attributes)
        else:
            message = IppResponse(version, code, request_id, attributes)
        message.data = buffer.read()
        return message

    @classmethod
    def parse_header(cls, buffer):
        version = (int8(buffer.read(1)), int8(buffer.read(1)))
        code = int16be(buffer.read(2))
        request_id = int32be(buffer.read(4))

        attributes = cls.parse_attributes(buffer)
        return version, code, request_id, attributes

    @classmethod
    def parse_attributes(cls, buffer):
        attribute_groups = {}
        current_group = None
        while int8(buffer.read(1)) != 0x03:
            buffer.seek(-1, 1)
            tag = int8(buffer.read(1))
            if tag < 0x10:   # delimiter-tag
                try:
                    current_group = IppAttributeGroups(tag)
                    attribute_groups[current_group] = {}
                except ValueError:
                    # Unknown IPP attribute group tag: Ignore group.
                    current_group = None
                continue
            # tag is a value-tag
            name_length = int16be(buffer.read(2))
            if name_length > 0:
                # RFC 8010, section 3.1.4 Attribute-with-one-value
                # Despite the name there can be more than one value for each group,
                # see else-branch "additional-value".
                # Therefore, store all values in lists.
                name = buffer.read(name_length)
                attribute_groups[current_group][name] = []
            else:
                # RFC 8010, section 3.1.5 Additional-value
                # use the name from most recent "attribute-with-one-value"
                # and append the value to that list
                pass
            value = buffer.read(int16be(buffer.read(2)))
            if not current_group:
                continue
            attribute_groups[current_group][name].append((tag, value))
        return attribute_groups

class IppRequest(IppMessage):
    '''
    IPP Request as described in section "3.1.1 Request and Response" of RFC 8010.
    '''
    def __init__(self, version, opid, request_id, attributes):
        super().__init__(version, request_id, attributes)
        self.opid = opid

    def __str__(self):
        data_info = f"{len(self.data)} bytes" if self.data else "no data"
        return (
            f'IppRequest(version={self.version}, '
            f'opid={self.opid:04x}, '
            f'request_id={self.request_id}, '
            f'attributes={self.attributes}), '
            f'data={data_info}'
        )

class IppResponse(IppMessage):
    '''
    IPP Response as described in section "3.1.1 Request and Response" of RFC 8010.
    '''
    def __init__(self, version, status, request_id, attributes):
        super().__init__(version, request_id, attributes)
        self.status = status

    def __str__(self):
        data_info = f"{len(self.data)} bytes" if self.data else "no data"
        return (
            f'IppResponse(version={self.version}, '
            f'opid=0x{self.status:04x}, '
            f'request_id={self.request_id}, '
            f'attributes={self.attributes}), '
            f'data={data_info}'
        )

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
        request = IppMessage.from_bytesio(buffer, is_request=True)
        # there are hard coded minimal response. this "just works" on cups
        if not request.data:
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
        if request.data.startswith(b'%!PS-Adobe'):
            self.handle_postscript(request.data)
        else:
            identifier = server.path[1:]
            server.printer.print(io.BytesIO(request.data), mode='text', identifier=identifier)

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
