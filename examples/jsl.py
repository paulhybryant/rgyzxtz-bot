from myquant import utils
from functools import partial
import dataframe_image as dfi
import df2img
import numpy as np
import pandas as pd
import pathlib
from pandas.io.formats.style import Styler


def toImg(df: Styler, img: str):
    from mplfonts import use_font
    use_font('Noto Serif CJK SC')
    # cannot use 'chrome' after upgrading chrome, 'matplotlib' produce no color in png
    # selenuum requires firefox and firefox-geckodriver
    dfi.export(df, img, table_conversion='selenium')


try:
    repo = pathlib.Path('/home/paulhybryant/gitrepo/quant')
    img = '/tmp/tmp.png'

    # fig = utils.get_force_redeem(repo, use_plotly=True)
    # df2img.save_dataframe(fig=fig, filename=img)

    styler = utils.get_force_redeem(repo, use_plotly=False)
    toImg(styler, img)
    utils.notify_image_wechat(img)
    print(img, end='')
except Exception as e:
    utils.notify_text_wechat(str(e))

