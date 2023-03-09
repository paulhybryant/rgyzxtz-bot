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


def toImg2(df: pd.DataFrame, img: str, fill_colors = None):
    fig = df2img.plot_dataframe(df, fig_size=(1920, 800), tbl_cells=dict(fill_color=fill_colors), show_fig=False)
    df2img.save_dataframe(fig=fig, filename=img)


try:
    repo = pathlib.Path('/home/paulhybryant/gitrepo/quant')
    df = utils.get_force_redeem(repo)
    df.to_csv('/tmp/forceRedeem.csv')
    n = len(df)

    img = '/tmp/tmp.png'
    column_fill_colors = []
    color_generator = {
        '强赎计数': lambda v: 'yellow' if v <= 5 else 'green',
        '强赎触发价差': lambda v: 'pink' if v > 0 else 'white',
        '涨跌幅': lambda v: 'red' if v > 0 else 'green',
        '正股涨跌': lambda v: 'red' if v > 0 else 'green',
        }
    for col in df.reset_index().columns:
        if col in color_generator:
            column_fill_colors.append(utils.highlight_column(False, df[col], color_generator.get(col)))
        else:
            column_fill_colors.append(['white'] * n)

    df['转股溢价率'] = df['转股溢价率'].apply(lambda v: f'{v}%')
    df['涨跌幅'] = df['涨跌幅'].apply(lambda v: f'{v}%')
    df['正股涨跌'] = df['正股涨跌'].apply(lambda v: f'{v}%')
    df['强赎触发价差'] = df['强赎触发价差'].apply(lambda v: f'{v:.2%}')
    toImg2(df, img, column_fill_colors)
    utils.notify_image_wechat(img)
    print(img, end='')
except Exception as e:
    utils.notify_text_wechat(str(e))

