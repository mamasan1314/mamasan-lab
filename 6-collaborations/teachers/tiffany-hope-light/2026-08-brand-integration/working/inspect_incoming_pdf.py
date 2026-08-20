"""Inspect the incoming Hope Light PDF without modifying it."""

from __future__ import annotations

import sys
from pathlib import Path

import pymupdf


def main() -> int:
    if len(sys.argv) not in {2, 3}:
        print(
            "Usage: inspect_incoming_pdf.py INPUT.pdf [PREVIEW_DIR]",
            file=sys.stderr,
        )
        return 2

    source = Path(sys.argv[1]).resolve()
    preview_dir = Path(sys.argv[2]).resolve() if len(sys.argv) == 3 else None
    document = pymupdf.open(source)
    print(f"file={source}")
    print(f"pages={document.page_count}")
    print(f"metadata={document.metadata}")

    for index, page in enumerate(document):
        print(
            f"--- PAGE {index + 1} "
            f"size={page.rect.width}x{page.rect.height} "
            f"images={len(page.get_images(full=True))} "
            f"words={len(page.get_text('words'))} ---"
        )
        print(page.get_text("text"))

    if preview_dir is not None:
        preview_dir.mkdir(parents=True, exist_ok=True)
        contact_document = pymupdf.open()
        contact_page = contact_document.new_page(width=1280, height=1620)
        columns = 2
        rows = 6
        margin = 24
        label_height = 30
        cell_width = (contact_page.rect.width - margin * (columns + 1)) / columns
        cell_height = (contact_page.rect.height - margin * (rows + 1)) / rows

        for index in range(document.page_count):
            row, column = divmod(index, columns)
            left = margin + column * (cell_width + margin)
            top = margin + row * (cell_height + margin)
            rect = pymupdf.Rect(
                left,
                top + label_height,
                left + cell_width,
                top + cell_height,
            )
            contact_page.insert_text(
                (left, top + 22),
                f"PDF page {index + 1}",
                fontsize=18,
                color=(0.1, 0.1, 0.1),
            )
            contact_page.show_pdf_page(rect, document, index, keep_proportion=True)

        contact_path = preview_dir / "contact-sheet.png"
        contact_page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5)).save(contact_path)
        contact_document.close()

        for index in range(document.page_count):
            page_path = preview_dir / f"page-{index + 1:02d}.png"
            document[index].get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5)).save(page_path)

        print(f"previews={preview_dir}")

    document.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
