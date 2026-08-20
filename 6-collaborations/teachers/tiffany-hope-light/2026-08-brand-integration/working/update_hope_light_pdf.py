"""Create the 2026-08-20 Hope Light copy-updated PDF.

The incoming PDF is image-only. This script preserves the original, rebuilds only
the six affected pages as full-page images, and copies the other pages unchanged.
"""

from __future__ import annotations

import argparse
import hashlib
from io import BytesIO
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw, ImageFont


SANS_FONT = Path(r"C:\Windows\Fonts\msjh.ttc")
SANS_BOLD_FONT = Path(r"C:\Windows\Fonts\msjhbd.ttc")
SERIF_FONT = Path(r"C:\Windows\Fonts\mingliu.ttc")

DARK = (50, 40, 34)
DARK_BROWN = (91, 76, 65)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    return parser.parse_args()


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def erase_vertical_gradient(
    image: Image.Image,
    box: tuple[int, int, int, int],
    sample_band: int = 5,
) -> None:
    """Remove raster text while preserving the local top-to-bottom gradient."""

    x0, y0, x1, y1 = box
    source = image.copy()
    source_pixels = source.load()
    target_pixels = image.load()
    width, height = image.size
    x0 = max(0, x0)
    y0 = max(sample_band, y0)
    x1 = min(width, x1)
    y1 = min(height - sample_band, y1)
    span = max(1, y1 - y0 - 1)

    for x in range(x0, x1):
        top_samples = [source_pixels[x, y] for y in range(y0 - sample_band, y0)]
        bottom_samples = [source_pixels[x, y] for y in range(y1, y1 + sample_band)]
        top = tuple(sum(pixel[channel] for pixel in top_samples) / sample_band for channel in range(3))
        bottom = tuple(
            sum(pixel[channel] for pixel in bottom_samples) / sample_band for channel in range(3)
        )

        for y in range(y0, y1):
            ratio = (y - y0) / span
            target_pixels[x, y] = tuple(
                round(top[channel] * (1 - ratio) + bottom[channel] * ratio)
                for channel in range(3)
            )


def erase_horizontal_gradient(
    image: Image.Image,
    box: tuple[int, int, int, int],
    sample_band: int = 6,
) -> None:
    """Remove raster text while preserving the local left-to-right gradient."""

    x0, y0, x1, y1 = box
    source = image.copy()
    source_pixels = source.load()
    target_pixels = image.load()
    width, height = image.size
    x0 = max(sample_band, x0)
    y0 = max(0, y0)
    x1 = min(width - sample_band, x1)
    y1 = min(height, y1)
    span = max(1, x1 - x0 - 1)

    for y in range(y0, y1):
        left_samples = [source_pixels[x, y] for x in range(x0 - sample_band, x0)]
        right_samples = [source_pixels[x, y] for x in range(x1, x1 + sample_band)]
        left = tuple(sum(pixel[channel] for pixel in left_samples) / sample_band for channel in range(3))
        right = tuple(
            sum(pixel[channel] for pixel in right_samples) / sample_band for channel in range(3)
        )

        for x in range(x0, x1):
            ratio = (x - x0) / span
            target_pixels[x, y] = tuple(
                round(left[channel] * (1 - ratio) + right[channel] * ratio)
                for channel in range(3)
            )


def center_line(
    draw: ImageDraw.ImageDraw,
    center_x: int,
    top: int,
    text: str,
    text_font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int] = DARK,
) -> None:
    draw.text((center_x, top), text, font=text_font, fill=fill, anchor="mt")


def paste_dark_logo(image: Image.Image, logo: Image.Image, position: tuple[int, int]) -> None:
    grayscale = logo.convert("L")
    mask = grayscale.point(lambda value: 0 if value > 215 else min(255, (215 - value) * 4))
    image.paste(logo, position, mask)


def fill_polygon_vertical_gradient(
    image: Image.Image,
    polygon: list[tuple[int, int]],
    top_color: tuple[int, int, int],
    bottom_color: tuple[int, int, int],
    outline: tuple[int, int, int] | None = None,
) -> None:
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    gradient = Image.new("RGB", image.size)
    gradient_draw = ImageDraw.Draw(gradient)
    y0 = min(point[1] for point in polygon)
    y1 = max(point[1] for point in polygon)
    span = max(1, y1 - y0)
    for y in range(y0, y1 + 1):
        ratio = (y - y0) / span
        color = tuple(
            round(top_color[channel] * (1 - ratio) + bottom_color[channel] * ratio)
            for channel in range(3)
        )
        gradient_draw.line((0, y, image.width, y), fill=color)
    image.paste(gradient, mask=mask)
    if outline is not None:
        ImageDraw.Draw(image).line(polygon + [polygon[0]], fill=outline, width=1)


def fill_radial_region(
    image: Image.Image,
    box: tuple[int, int, int, int],
    center: tuple[int, int],
    base_color: tuple[int, int, int],
    glow_color: tuple[int, int, int],
    sigma_x: float,
    sigma_y: float,
) -> None:
    x0, y0, x1, y1 = box
    pixels = image.load()
    center_x, center_y = center
    for y in range(y0, y1):
        for x in range(x0, x1):
            distance = ((x - center_x) / sigma_x) ** 2 + ((y - center_y) / sigma_y) ** 2
            intensity = pow(2.718281828, -0.5 * distance)
            pixels[x, y] = tuple(
                round(base_color[channel] * (1 - intensity) + glow_color[channel] * intensity)
                for channel in range(3)
            )


def edit_page_3(image: Image.Image) -> None:
    draw = ImageDraw.Draw(image)
    draw.ellipse((472, 249, 594, 371), fill=(216, 217, 212), outline=(132, 131, 126), width=1)
    center_line(draw, 533, 281, "腦波數據", font(SANS_FONT, 19))
    center_line(draw, 533, 310, "分析", font(SANS_FONT, 19))


def edit_page_4(image: Image.Image) -> None:
    erase_vertical_gradient(image, (58, 148, 965, 231))
    erase_vertical_gradient(image, (300, 411, 548, 492))
    draw = ImageDraw.Draw(image)
    body_font = font(SANS_FONT, 21)
    draw.text(
        (70, 160),
        "Hope Light 不只提供數據，更重視數據背後的人生脈絡。",
        font=body_font,
        fill=DARK,
    )
    draw.text(
        (70, 198),
        "將客觀狀態數據轉譯為具體的『生涯軌跡藍圖』。",
        font=body_font,
        fill=DARK,
    )
    center_line(draw, 424, 426, "狀態數據", font(SANS_FONT, 23))
    center_line(draw, 424, 460, "（客觀、理性、潛意識軌跡）", font(SANS_FONT, 15))


def edit_page_7(image: Image.Image) -> None:
    logo = image.crop((1160, 685, 1280, 720))
    background = Image.new("RGB", image.size, (250, 249, 245))
    fill_radial_region(
        background,
        (0, 0, 1280, 720),
        center=(640, 425),
        base_color=(250, 249, 245),
        glow_color=(250, 221, 174),
        sigma_x=390,
        sigma_y=310,
    )
    image.paste(background)
    paste_dark_logo(image, logo, (1160, 685))
    draw = ImageDraw.Draw(image)

    title_left = "從覺察到陪伴："
    title_right = "Hope Light 產品金字塔"
    title_font = font(SANS_BOLD_FONT, 38)
    draw.text((70, 55), title_left, font=title_font, fill=DARK_BROWN)
    title_right_x = 70 + round(draw.textlength(title_left, font=title_font))
    draw.text((title_right_x, 55), title_right, font=title_font, fill=(35, 25, 20))

    apex_y = 155
    bottom_y = 665
    left_base = 335
    right_base = 945

    def edge_x(y: int) -> tuple[int, int]:
        ratio = (y - apex_y) / (bottom_y - apex_y)
        return (
            round(640 + (left_base - 640) * ratio),
            round(640 + (right_base - 640) * ratio),
        )

    boundaries = [apex_y, 300, 425, 540, bottom_y]
    colors = [
        ((239, 180, 91), (220, 137, 31)),
        ((250, 202, 132), (243, 169, 72)),
        ((252, 222, 176), (247, 192, 111)),
        ((253, 237, 209), (249, 213, 159)),
    ]

    for layer_index in range(4):
        top_y = boundaries[layer_index]
        layer_bottom_y = boundaries[layer_index + 1]
        if layer_index == 0:
            polygon = [(640, top_y), (*edge_x(layer_bottom_y), layer_bottom_y)]
            polygon = [polygon[0], (polygon[1][0], layer_bottom_y), (polygon[1][1], layer_bottom_y)]
        else:
            top_left, top_right = edge_x(top_y)
            bottom_left, bottom_right = edge_x(layer_bottom_y)
            polygon = [
                (top_left, top_y),
                (top_right, top_y),
                (bottom_right, layer_bottom_y),
                (bottom_left, layer_bottom_y),
            ]
        fill_polygon_vertical_gradient(
            image,
            polygon,
            colors[layer_index][0],
            colors[layer_index][1],
            outline=(184, 129, 66),
        )

    draw = ImageDraw.Draw(image)
    center_line(draw, 640, 178, "延續陪伴", font(SANS_FONT, 19))
    center_line(draw, 640, 210, "日常陪伴　頻率工具", font(SANS_FONT, 18))
    center_line(draw, 640, 244, "$139 至 $24,900", font(SANS_FONT, 18))
    draw.text((760, 205), "頻率蠟燭、大小貴人等日常陪伴", font=font(SANS_FONT, 20), fill=DARK)

    center_line(draw, 640, 315, "核心變現｜", font(SANS_FONT, 21))
    center_line(draw, 640, 348, "生涯梳理深度課程", font(SANS_BOLD_FONT, 22))
    center_line(draw, 640, 385, "$19,800 起", font(SANS_FONT, 21))
    draw.text((800, 348), "徹底重建生涯策略", font=font(SANS_FONT, 21), fill=DARK)

    center_line(draw, 640, 442, "建立信任｜創賦密碼", font(SANS_FONT, 21))
    center_line(draw, 640, 473, "／人生軌跡諮詢", font(SANS_FONT, 20))
    center_line(draw, 640, 505, "$1,980", font(SANS_FONT, 21))
    draw.text((830, 473), "找到天賦特質與下一步", font=font(SANS_FONT, 21), fill=DARK)

    center_line(draw, 640, 570, "入口探索｜狀態數據解析", font(SANS_FONT, 20))
    center_line(draw, 640, 607, "原價 $3,600｜轉介紹價 $2,980", font(SANS_FONT, 17))
    draw.text((950, 585), "看見目前的人生卡點", font=font(SANS_FONT, 20), fill=DARK)


def edit_page_8(image: Image.Image) -> None:
    erase_horizontal_gradient(image, (292, 498, 558, 660))
    draw = ImageDraw.Draw(image)
    final_background = image.getpixel((1220, 510))
    draw.rectangle((955, 405, 1245, 510), fill=final_background)
    center_line(draw, 426, 508, "預約狀態數據解析", font(SANS_FONT, 17))
    center_line(draw, 426, 537, "原價 $3,600", font(SANS_FONT, 16))
    center_line(draw, 426, 564, "轉介紹價 $2,980", font(SANS_FONT, 16))
    center_line(draw, 426, 594, "從數據看見自己的", font(SANS_FONT, 17))
    center_line(draw, 426, 622, "運作軌跡。", font(SANS_FONT, 17))
    center_line(draw, 1094, 426, "魔法蠟燭、大小貴人", font(SANS_FONT, 18))
    center_line(draw, 1094, 460, "延續日常陪伴。", font(SANS_FONT, 18))


def edit_page_9(image: Image.Image) -> None:
    erase_vertical_gradient(image, (198, 56, 1085, 176))
    erase_vertical_gradient(image, (163, 247, 412, 465))
    erase_vertical_gradient(image, (512, 247, 779, 465))
    erase_vertical_gradient(image, (861, 247, 1128, 465))
    draw = ImageDraw.Draw(image)

    center_line(draw, 640, 61, "將一次對話延續到日常", font(SANS_BOLD_FONT, 31), DARK_BROWN)
    center_line(
        draw,
        640,
        108,
        "透過生活中的實體錨點，建立持續陪伴。",
        font(SANS_FONT, 23),
        DARK,
    )

    center_line(draw, 288, 265, "微小儀式", font(SANS_BOLD_FONT, 27), DARK_BROWN)
    center_line(draw, 288, 330, "1–10號魔法蠟燭／", font(SANS_FONT, 18))
    center_line(draw, 288, 358, "21天陪伴組", font(SANS_FONT, 18))
    center_line(draw, 288, 402, "每天5分鐘，", font(SANS_FONT, 17))
    center_line(draw, 288, 429, "留一段時間與自己對話。", font(SANS_FONT, 16))

    center_line(draw, 645, 265, "日常陪伴", font(SANS_BOLD_FONT, 27), DARK_BROWN)
    center_line(draw, 645, 337, "大小貴人將日常提醒", font(SANS_FONT, 17))
    center_line(draw, 645, 368, "與陪伴融入生活節奏。", font(SANS_FONT, 17))

    center_line(draw, 994, 265, "進階探索", font(SANS_BOLD_FONT, 27), DARK_BROWN)
    center_line(draw, 994, 325, "狀態數據與日常練習工具", font(SANS_FONT, 16))
    center_line(draw, 994, 358, "從不同角度持續認識", font(SANS_FONT, 17))
    center_line(draw, 994, 389, "自己的狀態。", font(SANS_FONT, 17))


def edit_page_11(image: Image.Image) -> None:
    logo = image.crop((1160, 685, 1280, 720))
    background = Image.new("RGB", image.size, (250, 249, 245))
    fill_radial_region(
        background,
        (0, 0, 1280, 720),
        center=(640, 360),
        base_color=(250, 249, 245),
        glow_color=(247, 187, 91),
        sigma_x=270,
        sigma_y=235,
    )
    image.paste(background)
    paste_dark_logo(image, logo, (1160, 685))
    draw = ImageDraw.Draw(image)
    center_line(draw, 640, 155, "點亮光芒，梳理人生", font(SERIF_FONT, 55), DARK_BROWN)
    center_line(draw, 640, 324, "我們不只提供客觀的腦波數據，", font(SERIF_FONT, 31), (20, 16, 13))
    center_line(
        draw,
        640,
        382,
        "更陪伴妳讀懂數據背後的人生軌跡。",
        font(SERIF_FONT, 31),
        (20, 16, 13),
    )
    center_line(draw, 640, 646, "hopebox.com.tw | @HopeLight.ig", font(SANS_FONT, 18), DARK_BROWN)
    center_line(draw, 640, 448, "Hope Light 已經準備好，", font(SERIF_FONT, 36), (20, 16, 13))
    center_line(
        draw,
        640,
        510,
        "為每一位迷惘的女性，點亮專屬的日常微光。",
        font(SERIF_FONT, 33),
        (20, 16, 13),
    )


EDITORS = {
    2: edit_page_3,
    3: edit_page_4,
    6: edit_page_7,
    7: edit_page_8,
    8: edit_page_9,
    10: edit_page_11,
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    args = parse_args()
    source_path = args.source.resolve()
    output_path = args.output.resolve()

    if not source_path.is_file():
        raise FileNotFoundError(source_path)
    if output_path.exists():
        raise FileExistsError(f"Refusing to overwrite existing output: {output_path}")
    if not SANS_FONT.is_file() or not SANS_BOLD_FONT.is_file() or not SERIF_FONT.is_file():
        raise FileNotFoundError("Required Noto TC fonts are not installed")

    source = pymupdf.open(source_path)
    if source.page_count != 11:
        raise ValueError(f"Expected 11 pages, found {source.page_count}")

    output = pymupdf.open()
    for index, source_page in enumerate(source):
        if index not in EDITORS:
            output.insert_pdf(source, from_page=index, to_page=index)
            continue

        pixmap = source_page.get_pixmap(matrix=pymupdf.Matrix(1, 1), alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        EDITORS[index](image)

        image_bytes = BytesIO()
        image.save(
            image_bytes,
            format="JPEG",
            quality=96,
            subsampling=0,
            optimize=True,
        )
        output_page = output.new_page(width=source_page.rect.width, height=source_page.rect.height)
        output_page.insert_image(output_page.rect, stream=image_bytes.getvalue())

    metadata = dict(source.metadata)
    metadata["title"] = "Hope Light 品牌策略藍圖｜文案更新版"
    metadata["subject"] = "2026-08-20 更新第 3、4、7、8、9 與最後一頁文案"
    metadata["creator"] = "mamasan-lab"
    output.set_metadata(metadata)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path, garbage=4, deflate=True)
    output.close()
    source.close()

    verified = pymupdf.open(output_path)
    if verified.page_count != 11:
        raise ValueError(f"Output page count changed: {verified.page_count}")
    for index, page in enumerate(verified):
        if page.rect.width != 1280 or page.rect.height != 720:
            raise ValueError(f"Unexpected page size on page {index + 1}: {page.rect}")
    verified.close()

    print(f"source={source_path}")
    print(f"source_sha256={sha256(source_path)}")
    print(f"output={output_path}")
    print(f"output_sha256={sha256(output_path)}")
    print("pages=11")
    print("updated_pages=3,4,7,8,9,11 (A's final-page reference was page 12)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
