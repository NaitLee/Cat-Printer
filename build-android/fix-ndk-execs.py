''' Some casual code to fix those alias files
    in Android NDK llvm bin to symlinks instead
'''

import os
import sys

MAX_LENGTH = 256

ndk_path = sys.argv[1] if len(sys.argv) > 1 else input('Android NDK path: ')

bin_path = os.path.join(ndk_path, 'toolchains/llvm/prebuilt/linux-x86_64/bin/')

workdir = os.getcwd()

os.chdir(bin_path)

try:
    for path in os.listdir():
        # with this encoding it won't error when reading binary
        file = open(path, 'r', encoding='iso8859-1')
        data = file.read(MAX_LENGTH).strip()
        file.close()
        # inside the alias file is the filename that should be executed
        # let's see if there is one
        if os.path.isfile(data):
            print('Will fix %s -> %s' % (path, data))
            #os.remove(path)
            os.rename(path, path + '.alias')
            os.symlink(data, path)
finally:
    os.chdir(workdir)
