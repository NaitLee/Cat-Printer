'Bundle script'

import os
import sys
import datetime
import re
import zipfile

bundle_name = 'cat-printer-%s-%s.zip'
edition = 'pure'
version = 'dev'
bundle_sub_dir = 'cat-printer'

if '-w' in sys.argv:
    edition = 'windows'
elif '-b' in sys.argv:
    edition = 'bare'

if not sys.argv[-1].startswith('-'):
    version = sys.argv[-1]

bundle_name %= (edition, version)

ignore_whitelist = (
    'www/i18n.js',
    'www/main.comp.js'
)

additional_ignore = (
    # prevent recurse
    bundle_name,
    # build helpers
    'build-*',
    '?-*.sh',
    # no need
    '.git',
    '.vscode',
    '.pylintrc',
    '.gitignore',
    'dev-diary.txt',
    'TODO'
    # other
    '.directory',
    'thumbs.db',
    'thumbs.db:encryptable'
)

def wildcard_to_regexp(wildcard):
    'Turn a "wildcard" string to a regular expression string'
    return (
        wildcard
            .replace('/', os.path.sep.replace('\\', '\\\\'))
            .replace('.', r'\.')
            .replace('*', r'.*')
            .replace('?', r'.?')
    )

os.chdir('../')

ignored = []

for i in additional_ignore:
    ignored.append(
        re.compile(
            wildcard_to_regexp(i)
        )
    )

if os.path.isfile('.gitignore'):
    with open('.gitignore', 'r', encoding='utf-8') as file:
        while True:
            line = file.readline()
            if not line:
                break
            line = line.strip()
            if (
                line.startswith('#') or
                line in ignore_whitelist or
                not line
            ):
                continue
            pattern = re.compile(
                wildcard_to_regexp(line)
            )
            ignored.append(pattern)

with zipfile.ZipFile(bundle_name, 'w', zipfile.ZIP_DEFLATED) as bundle:
    for path, dirs, files in os.walk('.'):
        for name in files:
            fullpath = os.path.join(path, name)
            if name == bundle_name:
                continue
            for pattern in ignored:
                if re.search(pattern, fullpath) is not None:
                    break
            else:   # if didn't break
                bundle.write(fullpath, os.path.join(bundle_sub_dir, fullpath))
    os.chdir('build-common')
    if edition != 'bare':
        for path, dirs, files in os.walk('bleak'):
            if path.endswith('__pycache__'):
                continue
            for name in files:
                fullpath = os.path.join(path, name)
                bundle.write(fullpath, os.path.join(bundle_sub_dir, fullpath))
    if edition == 'windows':
        os.chdir('python-win32-amd64-embed')
        for path, dirs, files in os.walk('.'):
            if path.endswith('__pycache__'):
                continue
            for name in files:
                fullpath = os.path.join(path, name)
                bundle.write(fullpath, os.path.join(bundle_sub_dir, fullpath))
        os.chdir('..')
        bundle.write('start.bat')
    bundle.comment = (
        b'Cat Printer "%s" bundle\n%s' % (
            edition.encode('utf-8'),
            str(datetime.datetime.now()).encode('utf-8'),
        )
    )
    bundle.close()
