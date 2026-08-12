from __future__ import annotations

import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "vendor"))
sys.path.insert(0, str(HERE))

from build_deliverables import WorkbookBuilder


GROUPS = {
    "a_strategy": ["build_guide", "build_roadmap", "build_products", "build_product_copy", "build_decisions", "build_audit"],
    "b_dashboard": ["build_guide", "build_dashboard"],
    "c_inventory": ["build_products", "build_inventory", "build_stock", "build_sales"],
    "d_customer": ["build_products", "build_sales", "build_crm", "build_service", "build_followup"],
    "e_content": ["build_products", "build_content", "build_content_metrics", "build_stories", "build_leads", "build_line_sop"],
    "f_share": ["build_products", "build_sales", "build_profit_share"],
}


def main() -> None:
    out = HERE / "diagnostic_workbooks"
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    for name, methods in GROUPS.items():
        path = out / f"{name}.xlsx"
        builder = WorkbookBuilder(path)
        for method_name in methods:
            getattr(builder, method_name)()
        builder.build_lists()
        builder.close()
        print(path)


if __name__ == "__main__":
    main()
