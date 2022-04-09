'Minimal internationalization lib'

import os
import math
import json
import locale

class I18n():
    ''' Minimal implementation of current frontend i18n in Python
        Not Complete (yet)!
    '''

    lang: str
    fallback: str
    data: dict = {
        'values': {},
        'contexts': []
    }

    def __init__(self, search_path='lang', lang=None, fallback=None):
        self.lang = lang or locale.getdefaultlocale()[0]
        self.fallback = fallback or 'en_US'
        self.load_file(os.path.join(search_path, self.fallback.replace('_', '-') + '.json'))
        for name in os.listdir(search_path):
            if name == self.lang.replace('_', '-') + '.json':
                self.load_file(os.path.join(search_path, name))

    def load_file(self, name):
        with open(name, 'r', encoding='utf-8') as file:
            self.load_data(file.read())

    def load_data(self, raw_json):
        data = json.loads(raw_json)
        for key in data['values']:
            self.data['values'][key] = data['values'][key]
        if data.get('contexts') is not None:
            self.data['contexts'] = data['contexts']

    def __getitem__(self, keys):
        if not isinstance(keys, tuple):
            keys = (keys, )
        data = self.data['values'].get(keys[0], keys[0])
        string = data[0][2] if isinstance(data, list) else data
        for i in keys:
            if isinstance(i, (int, float)):
                if string is None:
                    string = data
                if isinstance(data, list):
                    for j in data:
                        if j[0] is None:
                            j[0] = -math.inf
                        if j[1] is None:
                            j[1] = math.inf
                        if j[0] < i < j[1]:
                            template = j[2]
                            break
                string = template.replace('%%n', i).replace('-%%n', -i)
            elif isinstance(i, dict):
                # not verified if would work
                if string is None:
                    string = data
                for j in i:
                    string = string.replace('%%{%s}' % j, i[j])
        return string
