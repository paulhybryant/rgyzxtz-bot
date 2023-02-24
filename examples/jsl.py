from myquant import utils
import pathlib
import pandas as pd

def toImg(df: pd.DataFrame, img: str):
    # from mplfonts import use_font
    # use_font()
    # dfi.export(df, img, table_conversion='matplotlib')
    # styled dataframe not working for matplotlib
    # need to install google-chrome for the following to work
    import dataframe_image as dfi
    dfi.export(df, img, table_conversion='chrome')
    utils.notify_image_wechat(img)

try:
    repo = pathlib.Path('/home/paulhybryant/gitrepo/quant')
    df, cb_index = utils.get_force_redeem(repo, 8)

    img = '/tmp/tmp.png'
    toImg(cb_index, img)
    toImg(df, img)
    print(img, end='')
except Exception as e:
    utils.notify_text_wechat(str(e))

