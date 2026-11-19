"""슬라이드마다 아래쪽에 '출처' 목록을 클릭 가능한 링크로 단다. usage: python3 -I add_footers.py <unpacked dir>
기존 출처 상자가 있으면 내용을 바꾸고, 없으면 새 상자를 만든다. 링크는 글자색(회색)을 그대로 쓴다."""
import sys, re, html
D = sys.argv[1]
EMU = 914400
L = {  # 이름: (표시 글자, 주소)
    "dart": ("DART 반기보고서(2026.8)", "https://dart.fss.or.kr/"),
    "deal_profit": ("딜사이트 2026.1", "https://dealsite.co.kr/articles/156016"),
    "herald_top3": ("헤럴드경제 2026.2", "https://www.heraldk.com/article/2026020818065217721"),
    "hk_power": ("한경비즈니스 2025.4", "https://magazine.hankyung.com/business/article/202504239598b"),
    "hc": ("현대카드", "https://www.hyundaicard.com"),
    "inthe": ("인더뉴스 2023.1.4", "https://www.inthenews.co.kr/news/article.html?no=51037"),
    "mtn": ("MTN 2023.4", "https://news.mtn.co.kr/news-detail/2023041813590243135"),
    "daum_smcc": ("다음뉴스 2024.10.17", "https://v.daum.net/v/20241017182901036"),
    "herald_llm": ("헤럴드경제 2026.3.8", "https://www.heraldk.com/article/2026030818171329996"),
    "herald_snu": ("헤럴드경제 2026.4.8(서울대 강연)", "https://www.heraldk.com/article/2026040815472146026"),
    "herald_data": ("헤럴드경제 2026.4.8", "https://www.heraldk.com/article/2026040818422046298"),
    "hk_china": ("한국경제 2026.9.29", "https://www.hankyung.com/article/2026092909816"),
    "daum_apple": ("다음뉴스 2026.7.3", "https://v.daum.net/v/20260703061702205"),
    "deal_apple": ("딜사이트 2023.5.25", "https://dealsite.co.kr/articles/104336"),
    "herald_univ": ("헤럴드경제 2025.9.22", "https://www.heraldk.com/article/2025092219010018473"),
    "hk_llm": ("한국경제 2026.8.20", "https://www.hankyung.com/article/2026082013561"),
    "insta": ("정 부회장 인스타그램", "https://www.instagram.com/diegobluff/"),
    "deal_benefit": ("딜사이트 2023.11.27", "https://dealsite.co.kr/articles/113613"),
    "deal_port": ("딜사이트 2023.12.28", "https://dealsite.co.kr/articles/115399"),
    "ceoscore": ("CEO스코어데일리 2023.12", "https://www.ceoscoredaily.com/page/view/2023122616552548160"),
    "hk_ceo": ("한경비즈니스 2024.12", "https://magazine.hankyung.com/business/article/202412198038b"),
    "ddaily": ("디지털데일리 2026.5", "https://www.ddaily.co.kr/page/view/2026052017124329295"),
}
# 슬라이드: (강의자료 글자 또는 None, [출처], [사진 출처], 어두운 배경?, 상자 폭 인치)
PLAN = {
    1: (None, [], ["hc"], True, 7.0),
    2: ("리더십 강의자료 목차", [], ["hc"], False, 10.6),
    3: ("리더십 강의자료 2 · 4 · 6 · 9장", [], [], True, 10.6),
    4: (None, [], ["hc"], True, 10.6),
    5: (None, ["dart", "deal_profit", "herald_top3", "hk_power"], ["hc"], False, 10.6),
    6: (None, ["inthe", "mtn", "daum_smcc", "herald_llm", "herald_snu", "hk_china"], ["hc", "hk_llm", "herald_snu", "insta"], False, 10.6),
    7: ("리더십 강의자료 2 · 4장", [], ["hc"], True, 10.6),
    8: ("리더십 강의자료 2장", ["daum_apple", "herald_data", "hk_china", "deal_apple"], ["hc", "insta"], False, 10.6),
    9: ("리더십 강의자료 4장", ["herald_univ"], ["hk_llm"], False, 10.6),
    10: ("리더십 강의자료 4장", ["hk_power", "herald_llm"], [], False, 10.6),
    11: ("리더십 강의자료 6장", [], ["hc"], True, 10.6),
    12: ("리더십 강의자료 6장", ["hk_power", "deal_benefit", "herald_snu", "herald_univ"], ["herald_snu", "insta"], False, 10.6),
    13: ("리더십 강의자료 9장", [], ["hc"], True, 10.6),
    14: ("리더십 강의자료 9장", ["inthe", "deal_port", "deal_benefit", "ceoscore"], [], False, 10.6),
    15: ("리더십 강의자료 9장", ["hk_ceo", "herald_llm", "herald_data", "herald_univ", "hk_llm", "ddaily", "daum_smcc"], [], False, 10.6),
    16: ("리더십 강의자료 2 · 4 · 6 · 9장", ["herald_univ", "deal_apple", "deal_port", "herald_llm"], [], False, 10.6),
    18: (None, [], ["hc"], True, 5.5),
}
EXT = ('<a:extLst><a:ext uri="{A12FA001-AC4F-418D-AE19-62706E023703}">'
       '<ahyp:hlinkClr xmlns:ahyp="http://schemas.microsoft.com/office/drawing/2018/hyperlinkcolor" val="tx"/></a:ext></a:extLst>')


def rpr(color, rid=None, bold=False):
    b = ' b="1"' if bold else ""
    link = f'<a:hlinkClick r:id="{rid}">{EXT}</a:hlinkClick>' if rid else ""
    return (f'<a:rPr lang="ko-KR" sz="900"{b} dirty="0"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
            f'<a:latin typeface="Pretendard" pitchFamily="34" charset="0"/><a:ea typeface="Pretendard" pitchFamily="34" charset="-122"/>'
            f'<a:cs typeface="Pretendard" pitchFamily="34" charset="-120"/>{link}</a:rPr>')


def run(text, color, rid=None, bold=False):
    return f'<a:r>{rpr(color, rid, bold)}<a:t xml:space="preserve">{html.escape(text, quote=False)}</a:t></a:r>'


def build(n, rels_xml):
    lec, refs, photos, dark, w = PLAN[n]
    color = "8C8C8C" if dark else "6E6E6E"
    ids = [int(i) for i in re.findall(r'Id="rId(\d+)"', rels_xml)]
    nxt = max(ids) + 1
    new_rels, runs = [], []

    def link(key):
        nonlocal nxt
        label, url = L[key]
        rid = f"rId{nxt}"; nxt += 1
        new_rels.append(f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{html.escape(url)}" TargetMode="External"/>')
        return run(label, color, rid)

    parts = []
    if lec or refs:
        parts.append([run("출처  ", color, bold=True)] + ([run(lec, color)] if lec else []) + [link(k) for k in refs])
    if photos:
        head = "사진 · 로고  " if n in (1, 18) else ("로고  " if n in (2, 4, 7, 11, 13) else "사진  ")
        parts.append([run(head, color, bold=True)] + [link(k) for k in photos])
    for gi, group in enumerate(parts):
        if gi:
            runs.append(run("     ", color))
        head, items = group[0], group[1:]
        runs.append(head)
        for i, it in enumerate(items):
            if i:
                runs.append(run(" · ", color))
            runs.append(it)
    para = ('<a:p><a:pPr marL="0" indent="0"><a:lnSpc><a:spcPct val="110000"/></a:lnSpc><a:buNone/></a:pPr>'
            + "".join(runs) + '<a:endParaRPr lang="ko-KR" sz="900" dirty="0"/></a:p>')
    return para, new_rels, w


for n in PLAN:
    sp_path = f"{D}/ppt/slides/slide{n}.xml"
    rel_path = f"{D}/ppt/slides/_rels/slide{n}.xml.rels"
    x = open(sp_path, encoding="utf-8").read()
    r = open(rel_path, encoding="utf-8").read()
    para, new_rels, w = build(n, r)
    y, h = 6.62, 0.62
    body = (f'<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="b"/><a:lstStyle/>{para}</p:txBody>')
    xfrm = f'<a:xfrm><a:off x="{int(0.75 * EMU)}" y="{int(y * EMU)}"/><a:ext cx="{int(w * EMU)}" cy="{int(h * EMU)}"/></a:xfrm>'
    old = None
    for sp in re.findall(r'<p:sp>(?:(?!</p:sp>).)*</p:sp>', x, flags=re.S):
        t = "".join(re.findall(r"<a:t>([^<]*)</a:t>", sp))
        if t.startswith("출처") or t.startswith("사진:"):
            old = sp
            break
    if old:
        new = re.sub(r"<a:xfrm>.*?</a:xfrm>", xfrm, old, count=1, flags=re.S)
        new = re.sub(r"<p:txBody>.*?</p:txBody>", body, new, count=1, flags=re.S)
        x = x.replace(old, new)
    else:
        nid = max(int(i) for i in re.findall(r'<p:cNvPr id="(\d+)"', x)) + 1
        sp = (f'<p:sp><p:nvSpPr><p:cNvPr id="{nid}" name="출처 {n}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
              f'<p:spPr>{xfrm}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>{body}</p:sp>')
        x = x.replace("</p:spTree>", sp + "</p:spTree>", 1)
    r = r.replace("</Relationships>", "".join(new_rels) + "</Relationships>")
    open(sp_path, "w", encoding="utf-8").write(x)
    open(rel_path, "w", encoding="utf-8").write(r)
    print(n, "updated" if old else "added", len(new_rels), "links")
