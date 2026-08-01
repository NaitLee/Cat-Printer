'''
Provide *very* basic CUPS/IPP support

No rights reserved.
License CC0-1.0-only: https://directory.fsf.org/wiki/License:CC0
'''

import io
import platform
import subprocess
from enum import IntEnum

from .pf2 import int16be, int32be, int16_to_be_bytes, int32_to_be_bytes

def int8(b: bytes):
    'Translate 1 byte as signed 8-bit int'
    u = b[0]
    return u - ((u >> 7 & 0b1) << 8)

def int8_to_be_bytes(value: int) -> bytes:
    'Convert signed 8-bit int to 1 byte'
    return bytes([value & 0xFF])

class IppOperations(IntEnum):
    '''
    From RFC 8011, Table 19
    '''
    PRINT_JOB = 0x0002
    PRINT_URI = 0x0003
    VALIDATE_JOB = 0x0004
    CREATE_JOB = 0x0005
    SEND_DOCUMENT = 0x0006
    SEND_URI = 0x0007
    CANCEL_JOB = 0x0008
    GET_JOB_ATTRIBUTES = 0x0009
    GET_JOBS = 0x000a
    GET_PRINTER_ATTRIBUTES = 0x000b
    HOLD_JOB = 0x000c
    RELEASE_JOB = 0x000d
    RESTART_JOB = 0x000e
    PAUSE_PRINTER = 0x0010
    RESUME_PRINTER = 0x0011
    PURGE_JOBS = 0x0012

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
            # Convert code to IppOperations if possible
            try:
                opid = IppOperations(code)
            except ValueError:
                # Unknown IPP operation ID: Keep as integer
                opid = code
            message = IppRequest(version, opid, request_id, attributes)
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
        if isinstance(self.opid, IppOperations):
            opid_str = f"{self.opid.name}(0x{self.opid.value:04x})"
        else:
            opid_str = f"0x{self.opid:04x}"
        return (
            f'IppRequest(version={self.version}, '
            f'opid={opid_str}, '
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
            f'status=0x{self.status:04x}, '
            f'request_id={self.request_id}, '
            f'attributes={self.attributes}), '
            f'data={data_info}'
        )

    def tobytes(self) -> bytes:
        'Convert IppResponse to bytes according to RFC 8010'
        message = []

        # Header: version (2 bytes), status (2 bytes), request_id (4 bytes)
        major, minor = self.version
        message.append(int8_to_be_bytes(major))
        message.append(int8_to_be_bytes(minor))
        message.append(int16_to_be_bytes(self.status))
        message.append(int32_to_be_bytes(self.request_id))

        # attribute-group, RFC 8010, section 3.1.2 - 3.1.5
        # TODO: section 3.1.6 and 3.1.7
        for group_tag, group_attrs in self.attributes.items():
            # begin-attribute-group-tag / delimiter-tag
            message.append(int8_to_be_bytes(group_tag.value))

            # all attributes in this group
            for name, values in group_attrs.items():
                message.append(int16_to_be_bytes(len(name)))
                message.append(name)

                first_value = True
                for (tag, value) in values:
                    # value-tag
                    message.append(int8_to_be_bytes(tag))

                    # name-length 0 for additional values
                    if first_value:
                        first_value = False
                    else:
                        message.append(int16_to_be_bytes(0))

                    value_length = len(value)
                    message.append(int16_to_be_bytes(value_length))
                    message.append(value)

        # End-of-attributes-tag
        message.append(int8_to_be_bytes(IppAttributeGroups.END.value))

        # Optional data
        if self.data:
            message.append(self.data)

        return b''.join(message)

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
                response = IppResponse((1,1), 0, request.request_id, {})
                server.wfile.write(
                    response.tobytes()
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
            response = IppResponse((1,1), 0, request.request_id, {})
            server.wfile.write(
                response.tobytes()
            )
        except Exception as _:
            server.send_response(500)
            server.send_header('Content-Type', 'application/ipp')
            server.end_headers()
