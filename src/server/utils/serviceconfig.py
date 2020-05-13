WIDTH = 128
HEIGHT = 128
CLUSTERS = 10

class BaseColorExtractorException(Exception):
    pass


class ValidationError(BaseColorExtractorException):
    pass


class FetchImageUrlException(BaseColorExtractorException):
    pass
