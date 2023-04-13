'''
Minimal internationalization

No rights reserved.
License CC0-1.0-only: https://directory.fsf.org/wiki/License:CC0
'''

import os
import json
import locale

class I18nLib():
    ''' Minimal implementation of current frontend i18n in Python.
        Yet incomplete.
    '''

    lang: str
    fallback: str
    data: dict = {}

    def __init__(self, search_path='lang', lang=None, fallback=None):
        self.fallback = fallback or 'en-US'
        self.lang = lang or (locale.getdefaultlocale()[0] or self.fallback).replace('_', '-')
        with open(os.path.join(search_path, self.fallback + '.json'),
                  'r', encoding='utf-8') as file:
            self.data = json.load(file)
        path = self.lang + '.json'
        if path in os.listdir(search_path):
            with open(os.path.join(search_path, path), 'r', encoding='utf-8') as file:
                data = json.load(file)
                for key in data:
                    self.data[key] = data[key]

    def translate(self, *keys):
        'Translate something'
        string = self.data.get(keys[0], keys[0])
        if len(keys) > 1:
            if isinstance(keys[-1], dict):
                string = string.format(*keys[1:-1], **keys[-1])
            else:
                string = string.format(*keys[1:])
        return string

    def __getitem__(self, keys):
        if isinstance(keys, tuple):
            return self.translate(*keys)
        else:
            return self.translate(keys)
