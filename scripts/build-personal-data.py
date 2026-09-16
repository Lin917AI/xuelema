#!/usr/bin/env python3
"""Build a local-only investment data import. Never publish the generated JSON.

Install requirements-personal-data.txt, then run this file locally. The default
destination is the project's 个人数据 directory, outside the website. This script
does not upload data, change Git files, create schedules, or deploy anything.
"""

from __future__ import annotations

import argparse
import calendar
import concurrent.futures
import csv
import datetime as dt
from html.parser import HTMLParser
import io
import json
import math
import os
from pathlib import Path
import re
import sys
from tempfile import NamedTemporaryFile
import time
import urllib.error
import urllib.parse
import urllib.request
from zoneinfo import ZoneInfo


SCRIPT_PATH = Path(__file__).resolve()
PROJECT_ROOT = SCRIPT_PATH.parent.parent.parent
WEBSITE_ROOT = PROJECT_ROOT / "网站文件"
PRIVATE_ROOT = PROJECT_ROOT / "个人数据"
DEFAULT_OUTPUT = PRIVATE_ROOT / "投资时光机-个人数据.json"
START_MONTH = "1999-12"
FUND_CODES = ("270042", "006479", "050025", "006075", "007721", "007722")
SHILLER_PAGE = "https://shillerdata.com/"
WORLD_BANK_PAGE = "https://www.worldbank.org/en/research/commodity-markets"
WORLD_BANK_FALLBACK = (
    "https://thedocs.worldbank.org/en/doc/"
    "74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/"
    "CMO-Historical-Data-Monthly.xlsx"
)
SHANGHAI = ZoneInfo("Asia/Shanghai")
METHOD = "四类资产/汇率均月均；前月均价买入本月均价估值教学近似"


class DataError(RuntimeError):
    pass


def validate_structure(script_path: Path | None = None) -> None:
    script = (script_path or SCRIPT_PATH).resolve()
    if script.parent.name != "scripts" or script.parent.parent.name != "网站文件":
        raise DataError(
            "目录结构不符，未请求网络或写入文件。请按本地结构放置："
            "项目目录/网站文件/scripts/build-personal-data.py；"
            "从 GitHub 克隆时请将仓库放入项目目录下的“网站文件”目录。"
        )


def iso_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def positive(value: object, label: str) -> float:
    try:
        number = float(value)
    except (ValueError, TypeError) as exc:
        raise DataError(f"{label}: 无效数值 {value!r}") from exc
    if not math.isfinite(number) or number <= 0:
        raise DataError(f"{label}: 必须为正有限数值，得到 {value!r}")
    return number


def nonnegative(value: str | None) -> float | None:
    if value is None:
        return None
    try:
        number = float(value)
    except (ValueError, TypeError):
        return None
    return number if math.isfinite(number) and number >= 0 else None


def month_range(first: str, last: str) -> list[str]:
    y, m = map(int, first.split("-"))
    result = []
    while f"{y:04d}-{m:02d}" <= last:
        result.append(f"{y:04d}-{m:02d}")
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    return result


def validate_month(value: str) -> str:
    if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", value):
        raise DataError(f"无效月份：{value}")
    return value


def last_complete_month() -> str:
    today = dt.datetime.now(SHANGHAI).date()
    return (today.replace(day=1) - dt.timedelta(days=1)).strftime("%Y-%m")


def fetch(url: str, timeout: int) -> bytes:
    """Small public requests only; never solve challenges or evade refusals."""
    if not url.startswith("https://"):
        raise DataError(f"拒绝非 HTTPS 数据源：{url}")
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; XuelemaPersonalData/1.0; local research)"},
    )
    for attempt in range(2):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                data = response.read(12_000_001)
                if len(data) > 12_000_000:
                    raise DataError(f"数据源响应异常过大：{url}")
                if b"verify your browser" in data[:5000].lower():
                    raise DataError(f"数据源要求浏览器验证，已停止：{url}")
                return data
        except urllib.error.HTTPError as exc:
            # 401/403/429 are explicit refusals/rate limits, not retry candidates.
            raise DataError(f"HTTP {exc.code}，未尝试绕过：{url}") from exc
        except (TimeoutError, urllib.error.URLError) as exc:
            if attempt == 1:
                raise DataError(f"连接失败，已有本地数据不会被覆盖：{url}: {exc}") from exc
            time.sleep(1)
    raise DataError(f"无法读取：{url}")


def text_response(url: str, timeout: int) -> str:
    return fetch(url, timeout).decode("utf-8-sig", errors="strict")


def insert_point(points: dict[str, float], month: str, value: object, label: str) -> None:
    validate_month(month)
    if month in points:
        raise DataError(f"{label}: 重复月份 {month}")
    points[month] = positive(value, f"{label} {month}")


def fred_series(series: str, end_month: str, timeout: int) -> tuple[dict[str, float], dict]:
    y, m = map(int, end_month.split("-"))
    params = {
        "id": series,
        "cosd": f"{START_MONTH}-01",
        "coed": f"{end_month}-{calendar.monthrange(y, m)[1]:02d}",
    }
    if series == "NASDAQ100":
        params.update({"fq": "Monthly", "fam": "avg"})
    url = "https://fred.stlouisfed.org/graph/fredgraph.csv?" + urllib.parse.urlencode(params)
    reader = csv.DictReader(io.StringIO(text_response(url, timeout)))
    date_key = next((x for x in ("observation_date", "DATE", "date") if x in (reader.fieldnames or [])), None)
    if date_key is None or series not in (reader.fieldnames or []):
        raise DataError(f"FRED {series}: CSV 表头不符合预期 {reader.fieldnames}")
    points: dict[str, float] = {}
    for row in reader:
        try:
            date = dt.date.fromisoformat(row[date_key])
        except (ValueError, TypeError) as exc:
            raise DataError(f"FRED {series}: 非法日期") from exc
        if date.day != 1:
            raise DataError(f"FRED {series}: 未返回月频数据，不能混入日数据")
        month = date.strftime("%Y-%m")
        if START_MONTH <= month <= end_month:
            insert_point(points, month, row[series], f"FRED {series}")
    if not points:
        raise DataError(f"FRED {series}: 未返回所需数据")
    if series == "NASDAQ100":
        note = (
            "Nasdaq, Inc. 经 FRED 提供；日收盘指数的月均值，不含股息。"
            "Copyright © 2016, NASDAQ OMX Group, Inc.; FRED 标记 Copyrighted: Pre-Approval Required。"
            "仅供个人本机研究，不得随公开网站或 Git 仓库分发。"
        )
        label = "纳斯达克100：Nasdaq / FRED NASDAQ100"
    else:
        note = (
            "Federal Reserve Board / FRED EXCHUS，人民币元/1美元，纽约午间汇率的日值月均。"
            "Public Domain: Citation Requested。不是银行实际结售汇成交价。"
        )
        label = "人民币兑美元：Federal Reserve / FRED EXCHUS"
    return points, {"label": label, "url": url, "note": note}


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href")
            if href:
                self.links.append(href)


def source_link(page: str, marker: str, timeout: int) -> str:
    parser = LinkParser()
    parser.feed(text_response(page, timeout))
    candidates = [urllib.parse.urljoin(page, x) for x in parser.links if marker.lower() in x.lower()]
    candidates = list(dict.fromkeys(candidates))
    if len(candidates) != 1:
        raise DataError(f"{page}: 无法唯一定位 {marker} 下载链接，需人工核实")
    return candidates[0]


def shiller_series(end_month: str, timeout: int) -> tuple[dict[str, float], dict]:
    try:
        import xlrd
    except ImportError as exc:
        raise DataError("缺少 xlrd，请安装 requirements-personal-data.txt") from exc
    url = source_link(SHILLER_PAGE, "ie_data.xls", timeout)
    if urllib.parse.urlparse(url).hostname not in {"img1.wsimg.com", "shillerdata.com", "www.shillerdata.com"}:
        raise DataError("Shiller 下载域名发生变化，需要人工核实来源")
    book = xlrd.open_workbook(file_contents=fetch(url, timeout))
    sheet = book.sheet_by_name("Data")
    header = next((i for i in range(min(sheet.nrows, 30))
                   if sheet.cell_value(i, 0) == "Date" and sheet.cell_value(i, 1) == "P"), None)
    if header is None:
        raise DataError("Shiller 的 Date/P 表头发生变化")
    points: dict[str, float] = {}
    for i in range(header + 1, sheet.nrows):
        value = sheet.cell_value(i, 0)
        if not isinstance(value, (int, float)) or not 1871 <= value < 2100:
            continue
        # Excel uses YYYY.MM; decimal 2000.1 means October, not January.
        stamp = f"{value:.2f}"
        year, month = stamp.split(".")
        key = validate_month(f"{year}-{month}")
        if START_MONTH <= key <= end_month:
            insert_point(points, key, sheet.cell_value(i, 1), "Shiller S&P500")
    if not points:
        raise DataError("Shiller 未返回所需数据")
    disclaimer = ""
    if "Disclaimer" in book.sheet_names():
        disclaim = book.sheet_by_name("Disclaimer")
        disclaimer = " ".join(str(disclaim.cell_value(r, c)) for r in range(disclaim.nrows)
                              for c in range(disclaim.ncols) if disclaim.cell_value(r, c))
    note = (
        "Robert J. Shiller，Data!P 为每日收盘价的月均，未通胀调整、不含股息。"
        "公开下载不等于公开再分发授权；仅供个人本机研究。来源页：" + SHILLER_PAGE
        + (" 原表 Disclaimer: " + disclaimer if disclaimer else "")
    )
    return points, {"label": "标普500：Robert J. Shiller", "url": url, "note": note}


def gold_series(end_month: str, timeout: int) -> tuple[dict[str, float], dict]:
    try:
        import openpyxl
    except ImportError as exc:
        raise DataError("缺少 openpyxl，请安装 requirements-personal-data.txt") from exc
    # This canonical attachment is linked on the World Bank commodity page.
    # Keep this URL explicit; a source replacement requires a deliberate update.
    url = WORLD_BANK_FALLBACK
    book = openpyxl.load_workbook(io.BytesIO(fetch(url, timeout)), data_only=True, read_only=True)
    try:
        sheet = book["Monthly Prices"]
        column = None
        points: dict[str, float] = {}
        updated = ""
        for row in sheet.iter_rows(values_only=True):
            if row and isinstance(row[0], str) and row[0].startswith("Updated on"):
                updated = row[0]
            if column is None:
                normalized = [x.strip() if isinstance(x, str) else x for x in row]
                if "Gold" in normalized:
                    column = normalized.index("Gold")
                continue
            if not row or not isinstance(row[0], str) or not re.fullmatch(r"\d{4}M\d{2}", row[0]):
                continue
            key = row[0].replace("M", "-")
            if START_MONTH <= key <= end_month:
                insert_point(points, key, row[column], "World Bank Gold")
        if not points:
            raise DataError("World Bank Gold 未返回所需数据")
    finally:
        book.close()
    return points, {
        "label": "黄金：World Bank Pink Sheet",
        "url": url,
        "note": (
            "Gold，名义美元/金衡盎司，月均价，不是月末价格。" + updated
            + "。World Bank 数据默认 CC BY 4.0（如元数据另有第三方条款须遵守）；"
            "来源和使用条款：https://www.worldbank.org/en/research/commodity-markets ; "
            "https://data.worldbank.org/summary-terms-of-use"
        ),
    }


class FundHTML(HTMLParser):
    """Extract plain text and table cells without running any remote JavaScript."""
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.parts: list[str] = []
        self.cell: list[str] | None = None
        self.cells: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style"}:
            self.skip += 1
        if tag in {"td", "th"} and self.skip == 0:
            self.cell = []

    def handle_endtag(self, tag):
        if tag in {"script", "style"} and self.skip:
            self.skip -= 1
        if tag in {"td", "th"} and self.cell is not None:
            self.cells.append(" ".join(" ".join(self.cell).split()))
            self.cell = None

    def handle_data(self, data):
        if self.skip == 0 and data.strip():
            self.parts.append(data.strip())
            if self.cell is not None:
                self.cell.append(data.strip())

    def field(self, label: str) -> str | None:
        for i, value in enumerate(self.cells[:-1]):
            if value == label:
                return self.cells[i + 1]
        return None


def js_string(script: str, variable: str) -> str | None:
    match = re.search(r"\bvar\s+" + re.escape(variable) + r"\s*=\s*(\"(?:[^\"\\]|\\.)*\")\s*;", script)
    return json.loads(match.group(1)) if match else None


def js_array(script: str, variable: str) -> list:
    match = re.search(r"\bvar\s+" + re.escape(variable) + r"\s*=\s*", script)
    if not match:
        raise DataError(f"基金数据缺少 {variable}")
    value, _ = json.JSONDecoder().raw_decode(script[match.end():].lstrip())
    if not isinstance(value, list):
        raise DataError(f"基金数据 {variable} 不是数组")
    return value


def money(value: str | None) -> float | None:
    if not value:
        return None
    match = re.fullmatch(r"\s*([\d,]+(?:\.\d+)?)\s*(万|亿)?元\s*", value)
    if not match:
        return None
    scale = {None: 1, "万": 10_000, "亿": 100_000_000}[match.group(2)]
    amount = nonnegative(match.group(1).replace(",", ""))
    return amount * scale if amount is not None else None


def fund_record(code: str, timeout: int) -> dict:
    script_url = f"https://fund.eastmoney.com/pingzhongdata/{code}.js"
    fees_url = f"https://fundf10.eastmoney.com/jjfl_{code}.html"
    script = text_response(script_url, timeout)
    name = js_string(script, "fS_name")
    reported_code = js_string(script, "fS_code")
    if reported_code != code or not name:
        raise DataError(f"基金 {code}: 源代码或名称不匹配")
    if "纳斯达克100" in name:
        index = "nasdaq"
    elif "标普500" in name:
        index = "sp500"
    else:
        raise DataError(f"基金 {code}: 名称未明确标注目标指数，跳过 {name}")
    if not re.search(r"[AC](?:\(|（|$)", name):
        raise DataError(f"基金 {code}: 无法从源名称确认 A/C 份额，跳过 {name}")
    trend = js_array(script, "Data_netWorthTrend")
    navs = []
    today = dt.datetime.now(SHANGHAI).date()
    for point in trend:
        if not isinstance(point, dict) or not isinstance(point.get("x"), (float, int)):
            raise DataError(f"基金 {code}: 净值时间序列格式异常")
        nav_date = dt.datetime.fromtimestamp(point["x"] / 1000, SHANGHAI).date()
        if nav_date > today:
            raise DataError(f"基金 {code}: 出现未来净值日期")
        navs.append((nav_date, positive(point.get("y"), f"基金 {code} 单位净值")))
    if not navs or navs != sorted(navs) or len({day for day, _ in navs}) != len(navs):
        raise DataError(f"基金 {code}: 单位净值为空或顺序异常")
    parser = FundHTML()
    parser.feed(text_response(fees_url, timeout))
    status = parser.field("申购状态")
    if status is None:
        raise DataError(f"基金 {code}: 无法识别申购状态，跳过而不猜测")
    if "暂停" in status or "封闭" in status:
        state = "paused"
    elif "开放" in status or "限大额" in status or "限制大额" in status:
        state = "open"
    else:
        state = "unknown"
    limit_text = parser.field("日累计申购限额")
    limit = money(limit_text)
    annual = []
    for label in ("管理费率", "托管费率", "销售服务费率"):
        field = parser.field(label)
        match = re.search(r"(\d+(?:\.\d+)?)\s*%", field or "")
        annual.append(nonnegative(match.group(1)) if match else None)
    annual_fee = round(sum(annual), 6) if all(x is not None for x in annual) else None
    full_status = status + (f"；日累计申购限额：{limit_text}" if limit_text else "；日累计申购限额未披露")
    return {
        "code": code,
        "name": name,
        "index": index,
        "url": f"https://fund.eastmoney.com/{code}.html",
        "nav": navs[-1][1],
        "navDate": navs[-1][0].isoformat(),
        "checkedAt": iso_now(),
        "purchaseState": state,
        "purchaseStatus": full_status,
        "purchaseLimit": limit,
        "purchaseFeePct": nonnegative(js_string(script, "fund_Rate")),
        "annualFeePct": annual_fee,
    }


def safe_output(value: str | None) -> Path:
    validate_structure()
    # The data folder itself must not redirect to a web directory by symlink.
    if PRIVATE_ROOT.resolve() != PRIVATE_ROOT.absolute():
        raise DataError("个人数据目录是符号链接，拒绝写入；请使用项目内真实私有目录")
    output = Path(value).expanduser().resolve() if value else DEFAULT_OUTPUT.resolve()
    if output.is_relative_to(WEBSITE_ROOT.resolve()):
        raise DataError("拒绝把个人数据写入网站文件目录；数据不能随网站发布")
    if not output.is_relative_to(PRIVATE_ROOT.resolve()) or output.suffix.lower() != ".json":
        raise DataError(f"输出必须是 {PRIVATE_ROOT} 内的 JSON 文件")
    if output.exists() and output.is_dir():
        raise DataError("输出目标不能是目录")
    return output


def atomic_write_package(output: Path, package: dict) -> None:
    """Validate a private temporary file before atomically replacing the old pack."""
    output = safe_output(str(output))
    encoded = json.dumps(package, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary_path: Path | None = None
    try:
        with NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=output.parent,
            prefix=f".{output.name}.",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temporary_path = Path(temporary.name)
            os.fchmod(temporary.fileno(), 0o600)
            temporary.write(encoded)
            temporary.flush()
            os.fsync(temporary.fileno())
        if json.loads(temporary_path.read_text(encoding="utf-8")) != package:
            raise DataError("临时文件回读校验失败，原数据包未被覆盖")
        os.replace(temporary_path, output)
        temporary_path = None
    finally:
        # Only the exact temporary file created by this invocation is eligible.
        if temporary_path is not None:
            try:
                temporary_path.unlink(missing_ok=True)
            except OSError as exc:
                print(f"警告：本次临时文件未能清理：{temporary_path}: {exc}", file=sys.stderr)


def build(end_month: str, timeout: int) -> dict:
    loaders = {
        "nasdaq": lambda: fred_series("NASDAQ100", end_month, timeout),
        "sp500": lambda: shiller_series(end_month, timeout),
        "gold": lambda: gold_series(end_month, timeout),
        "fx": lambda: fred_series("EXCHUS", end_month, timeout),
    }
    series = {}
    sources = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        jobs = {key: executor.submit(loader) for key, loader in loaders.items()}
        for key, job in jobs.items():
            points, source = job.result()
            series[key] = points
            sources.append(source)
            print(f"已读取 {key}: {min(points)}—{max(points)}，{len(points)} 个月", flush=True)
    common_end = min(max(points) for points in series.values())
    if common_end < "2000-01":
        raise DataError("共同历史覆盖不足以从 2000 年开始")
    months = month_range(START_MONTH, common_end)
    for key, points in series.items():
        missing = [m for m in months if m not in points]
        if missing:
            raise DataError(f"{key} 缺少月份 {', '.join(missing[:8])}，未插值或填补")
    rows = [{"month": month, **{key: points[month] for key, points in series.items()}} for month in months]
    if common_end != end_month:
        print(f"提示：按四个源共同完整月份截断至 {common_end}，请求为 {end_month}", file=sys.stderr)
    market_updated = iso_now()
    records = []
    # At most two funds at a time. Each fund uses only two public source requests.
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        jobs = {code: executor.submit(fund_record, code, timeout) for code in FUND_CODES}
        for code, job in jobs.items():
            try:
                record = job.result()
                records.append(record)
                print(f"已核实基金 {code} {record['name']}：{record['purchaseStatus']}", flush=True)
            except (DataError, ValueError, KeyError) as exc:
                print(f"警告：基金 {code} 已跳过：{exc}", file=sys.stderr, flush=True)
    if not records:
        raise DataError("六只基金均未核实成功，未覆盖已有数据包")
    sources.append({
        "label": "基金净值、申购状态与费率：天天基金 / 东方财富",
        "url": "https://fund.eastmoney.com/",
        "note": (
            "每只基金读取公开 pingzhongdata/{code}.js 与 fundf10.eastmoney.com/jjfl_{code}.html；"
            "未执行远程 JavaScript。保留 A/C 原名称。限额与购买费率只代表天天基金渠道，"
            "以基金公司公告及实际下单页为准；未知值为 null，不等于无限额。"
            "管理费、托管费及销售服务费已从实际净值中扣除，不能对基金净值收益重复扣费。"
            "东方财富保留相关权利；此包只保存在设备，不随公开网站分发。"
        ),
    })
    now = iso_now()
    return {
        "schemaVersion": 1,
        "kind": "xuelema-invest-private",
        "createdAt": now,
        "market": {"method": METHOD, "updatedAt": market_updated, "sources": sources, "rows": rows},
        "funds": {"checkedAt": now, "funds": records},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", help="只允许个人数据目录内的 JSON 路径")
    parser.add_argument("--end-month", default=last_complete_month(), help="最后完整月份 YYYY-MM，默认上个月")
    parser.add_argument("--timeout", type=int, default=35, help="单次请求超时秒数，默认 35")
    args = parser.parse_args()
    try:
        validate_structure()
        end_month = validate_month(args.end_month)
        if not "2000-01" <= end_month <= last_complete_month():
            raise DataError("最后月份必须从 2000-01 起，且不能包含当前或未来月份")
        if not 5 <= args.timeout <= 60:
            raise DataError("timeout 必须在 5—60 秒之间")
        output = safe_output(args.output)
        package = build(end_month, args.timeout)
        # Write only after every market source passes strict completeness checks.
        atomic_write_package(output, package)
        rows = package["market"]["rows"]
        print(f"完成：{output}\n历史范围：{rows[0]['month']}—{rows[-1]['month']}，{len(rows)} 行；基金 {len(package['funds']['funds'])} 只")
        print("历史锚点（均为源数据月均，不是月末）：")
        for row in rows:
            if row["month"] in {"2000-01", "2008-10", "2020-03", "2020-12", rows[-1]["month"]}:
                print(json.dumps(row, ensure_ascii=False, sort_keys=True))
        return 0
    except (DataError, OSError, ValueError, KeyError) as exc:
        print(f"失败：{exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
