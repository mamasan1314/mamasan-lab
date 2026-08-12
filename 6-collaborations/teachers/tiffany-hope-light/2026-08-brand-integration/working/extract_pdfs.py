from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "vendor"))

from pypdf import PdfReader


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    report: list[dict[str, object]] = []

    for pdf_path in sorted(args.source_dir.glob("*.pdf")):
        try:
            reader = PdfReader(str(pdf_path))
            chunks: list[str] = []
            page_lengths: list[int] = []
            for index, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                chunks.append(f"\n\n===== PAGE {index} =====\n\n{text}")
                page_lengths.append(len(text.strip()))
            output_path = args.output_dir / f"{pdf_path.stem}.txt"
            output_path.write_text("".join(chunks).strip() + "\n", encoding="utf-8")
            report.append(
                {
                    "file": pdf_path.name,
                    "pages": len(reader.pages),
                    "characters": sum(page_lengths),
                    "pages_with_text": sum(length > 0 for length in page_lengths),
                    "output": str(output_path),
                }
            )
        except Exception as exc:  # extraction audit must continue per file
            report.append({"file": pdf_path.name, "error": str(exc)})

    report_path = args.output_dir / "_pdf_report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
