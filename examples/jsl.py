from myquant import utils
from functools import partial
import dataframe_image as dfi
import df2img
import numpy as np
import pandas as pd
import pathlib


def toImg(df: pd.DataFrame, img: str):
    # from mplfonts import use_font
    # use_font()
    # dfi.export(df, img, table_conversion='matplotlib')
    # styled dataframe not working for matplotlib
    # need to install google-chrome for the following to work
    dfi.export(df, img, table_conversion='chrome')
    utils.notify_image_wechat(img)


def toImg2(df: pd.DataFrame, img: str, fill_colors = None):
    fig = df2img.plot_dataframe(df, fig_size=(1920, 800), tbl_cells=dict(fill_color=fill_colors))
    df2img.save_dataframe(fig=fig, filename=img)


try:
    repo = pathlib.Path('/home/paulhybryant/gitrepo/quant')
    df = utils.get_force_redeem(repo)
    df.to_csv('/tmp/forceRedeem.csv')
    n = len(df)

    img = '/tmp/tmp.png'
    column_fill_colors = []
    color_generator = {
        '强赎计数': partial(utils.highlight_qs_count, 5, False),
        '强赎触发价差': partial(utils.highlight_qs_price, False),
    }
    for col in df.columns:
        if col in color_generator:
            column_fill_colors.append(color_generator.get(col)(df[col]))
        else:
            column_fill_colors.append(['white'] * n)

    toImg2(df, img, column_fill_colors)
    print(img, end='')
except Exception as e:
    utils.notify_text_wechat(str(e))

