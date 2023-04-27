from myquant import utils
from functools import partial
import dataframe_image as dfi
import df2img
import numpy as np
import pandas as pd
import pathlib
from pandas.io.formats.style import Styler


def toImg(img: str, use_plotly: bool):
    if use_plotly:
        fig = utils.get_force_redeem(repo, use_plotly)
        df2img.save_dataframe(fig=fig, filename=img)
    else:
        styler = utils.get_force_redeem(repo, use_plotly)
        from mplfonts import use_font
        use_font('Noto Serif CJK SC')
        # 'matplotlib' produce no color in png
        # selenium requires firefox and firefox-geckodriver
        dfi.export(styler, img, table_conversion='chrome')


try:
    repo = pathlib.Path('/wechaty/quant')
    img = '/tmp/tmp.png'

    toImg(img, True)
    utils.notify_image_wechat(img)
    print(img, end='')
except Exception as e:
    utils.notify_text_wechat(str(e))

