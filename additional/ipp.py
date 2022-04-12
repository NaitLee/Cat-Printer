''' Provide *very* basic CUPS/IPP support
    Extracted from version 0.0.2, do more cleaning later...
'''

import platform
import subprocess

class IPP():
    'https://datatracker.ietf.org/doc/html/rfc8010'
    server = None
    printer = None
    def __init__(self, server, printer):
        self.server = server
        self.printer = printer
    async def handle_ipp(self, data):
        'Handle an IPP protocol request'
        server = self.server
        # len_data = len(data)
        # ipp_version_number = data[0:2]
        # ipp_operation_id = data[2:4]
        # ipp_request_id = data[4:8]
        ipp_operation_attributes_tag = data[8]
        attributes = {}
        data_to_print = b''
        # this is silly. i want to use io.BytesIO
        if ipp_operation_attributes_tag == 0x01:
            pointer = 9
            next_name_length_at = 10
            next_value_length_at = 10
            name = b''
            value = b''
            while data[pointer] != 0x03:
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
        # there are hard coded minimal response. this "just works" on cups
        if data_to_print == b'':
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
        pbm_data, _ = gsproc.communicate(data_to_print)
        try:
            if gsproc.wait() == 0:
                info = server.path[1:]
                is_found = await server.printer.filter_device(info, server.settings.scan_time)
                if not is_found:
                    ... # TODO: Make IPP can report some errors
                    raise Exception(f'No printer found with info: {info}')
                await server.printer.print_data(pbm_data)
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
            server.wfile.write(b'')
