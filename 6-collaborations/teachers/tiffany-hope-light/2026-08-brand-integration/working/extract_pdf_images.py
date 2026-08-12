from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "vendor"))

from PIL import Image, ImageDraw
from pypdf import PdfReader


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    for pdf_path in sorted(args.source_dir.glob("*Blueprint.pdf")):
        if pdf_path.name.startswith("._"):
            continue
        reader = PdfReader(str(pdf_path))
        book_dir = args.output_dir / pdf_path.stem
        book_dir.mkdir(parents=True, exist_ok=True)
        thumbnails: list[Image.Image] = []

        for page_number, page in enumerate(reader.pages, start=1):
            if not page.images:
                continue
            image_file = page.images[0]
            image = Image.open(io.BytesIO(image_file.data)).convert("RGB")
            page_path = book_dir / f"page-{page_number:02d}.jpg"
            image.save(page_path, quality=92)
            thumb = image.copy()
            thumb.thumbnail((360, 220))
            tile = Image.new("RGB", (380, 260), "white")
            tile.paste(thumb, ((380 - thumb.width) // 2, 25))
            ImageDraw.Draw(tile).text((12, 8), f"Page {page_number}", fill="black")
            thumbnails.append(tile)

        if thumbnails:
            columns = 3
            rows = (len(thumbnails) + columns - 1) // columns
            contact = Image.new("RGB", (columns * 380, rows * 260), "#dddddd")
            for index, thumb in enumerate(thumbnails):
                contact.paste(thumb, ((index % columns) * 380, (index // columns) * 260))
            contact.save(args.output_dir / f"{pdf_path.stem}_contact.jpg", quality=92)
            print(f"{pdf_path.name}: {len(thumbnails)} pages")


if __name__ == "__main__":
    main()
