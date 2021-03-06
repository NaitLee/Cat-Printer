'Printer model specifications. License CC0-1.0-only'

class Model():
    ''' A printer model
        Note: these currently make no obvious sense
    '''
    paper_width: int
    is_new_kind: bool
    def __init__(self, width, is_new):
        self.paper_width = width
        self.is_new_kind = is_new

Models = {
    'YT01': Model(384, False),
    'GB01': Model(384, False),
    'GB02': Model(384, False),
    'GB03': Model(384, True),
    'GT01': Model(384, False),
}
