'''
Printer model specifications.

No rights reserved.
License CC0-1.0-only: https://directory.fsf.org/wiki/License:CC0
'''

class Model():
    ''' A printer model
        `paper_width`: pixels per line for the model/paper
        `is_new`: some models can use compressed data. the algorithm isn't implemented in Cat-Printer yet, but should be no harm.
    '''
    paper_width: int
    is_new_kind: bool
    def __init__(self, width, is_new):
        self.paper_width = width
        self.is_new_kind = is_new

Models = {
    'YT01': Model(384, False),
    'MX05': Model(384, False),
    'MX06': Model(384, False),
    'GB01': Model(384, False),
    'GB02': Model(384, False),
    'GB03': Model(384, True),
    'GT01': Model(384, False),
}
