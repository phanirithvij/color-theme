def rgb2hex(rgb: tuple) -> str:
    """
    rgb2hex from
    https://github.com/cokelaer/colormap/blob/master/src/colormap/colors.py#L127
    """
    return '#%02X%02X%02X' % rgb

def hex2rgb(hex_: str) -> tuple:
    """
    hex2rgb from
    https://stackoverflow.com/a/29643643/8608146
    """
    hex_ = hex_.lstrip('#')
    return tuple(int(hex_[i:i + 2], 16) for i in (0, 2, 4))
