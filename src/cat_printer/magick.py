
import os
import io
import subprocess

def fallback_program(*programs):
    'Return first specified program that exists in PATH'
    for i in os.environ['PATH'].split(os.pathsep):
        for j in programs:
            if os.path.isfile(os.path.join(i, j)):
                return j
    return None

_MagickExe = fallback_program('magick', 'magick.exe', 'convert', 'convert.exe')

def magick_text(stdin, image_width: int, font_size: int, font_family: str):
    'Pipe an io to ImageMagick for processing text to image, return output io'
    if _MagickExe is None:
        return None

    read_fd, write_fd = os.pipe()
    subprocess.Popen([_MagickExe, '-background', 'white', '-fill', 'black',
            '-size', f'{image_width}x', '-font', font_family, '-pointsize',
            str(font_size), 'caption:@-', 'pbm:-'],
            stdin=stdin, stdout=io.FileIO(write_fd, 'w'))
    return io.FileIO(read_fd, 'r')

def magick_image(stdin, image_width: int, dither: str):
    'Pipe an io to ImageMagick for processing "usual" image to pbm, return output io'
    if _MagickExe is None:
        return None

    read_fd, write_fd = os.pipe()
    subprocess.Popen([_MagickExe, '-', '-fill', 'white', '-opaque', 'transparent',
            '-resize', f'{image_width}x', '-dither', dither, '-monochrome', 'pbm:-'],
            stdin=stdin, stdout=io.FileIO(write_fd, 'w'))
    return io.FileIO(read_fd, 'r')
