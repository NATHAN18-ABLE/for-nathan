"""참고자료 슬라이드(17번)의 각 항목에 외부 링크를 건다. usage: python3 -I add_links.py <unpacked dir>"""
import sys, re, html
d = sys.argv[1]
slide = f"{d}/ppt/slides/slide17.xml"
rels = f"{d}/ppt/slides/_rels/slide17.xml.rels"
LINKS = {
    "현대카드, 「반기보고서」 제32기, 2026.8.14 제출, DART": ("https://dart.fss.or.kr/", "현대카드, 「반기보고서」 제32기, 2026.8.14 제출, DART (‘현대카드’ 검색)"),
    "현대카드, 日 ‘빅3 카드사’에 AI 플랫폼 수출 (2024.10.17)": ("https://v.daum.net/v/20241017182901036", None),
    "다음/뉴스, 애플페이 확산 또 제동…신한·국민 연내 도입 ‘안갯속’ (2026.7.3)": ("https://v.daum.net/v/20260703061702205", None),
    "딜사이트, 현대카드 애플페이 약발 벌써 끝? (2023.5.25)": ("https://dealsite.co.kr/articles/104336", None),
    "헤럴드경제, 정태영 “유니버스 추가 수출로 궤도 안착 자신” (2025.9.22)": ("https://www.heraldk.com/article/2025092219010018473", None),
    "한국경제, 정태영 알리바바·유니트리 방문 (2026.9.29)": ("https://www.hankyung.com/article/2026092909816", None),
    "한경비즈니스, 2025 파워금융인30: 정태영 (2025.4)": ("https://magazine.hankyung.com/business/article/202504239598b", None),
    "딜사이트, 불황 속 장기 투자·고객 혜택 유지 (2023.11.27)": ("https://dealsite.co.kr/articles/113613", None),
    "헤럴드경제, “AI 시대 진짜 승부수는 데이터 설계” (2026.4.8)": ("https://www.heraldk.com/article/2026040815472146026", None),
    "인더뉴스, 정태영 2023 신년사 (2023.1.4)": ("https://www.inthenews.co.kr/news/article.html?no=51037", None),
    "딜사이트, 선제적 포트폴리오 조정 (2023.12.28)": ("https://dealsite.co.kr/articles/115399", None),
    "CEO스코어데일리, 카드사 순이익 고금리 장기화 (2023.12)": ("https://www.ceoscoredaily.com/page/view/2023122616552548160", None),
    "한경비즈니스, 카드 부문 올해의 CEO (2024.12)": ("https://magazine.hankyung.com/business/article/202412198038b", None),
    "헤럴드경제, 리더그룹 LLM 실습 교육 (2026.3.8)": ("https://www.heraldk.com/article/2026030818171329996", None),
    "헤럴드경제, “AI 시대 데이터 설계가 승부처” (2026.4.8)": ("https://www.heraldk.com/article/2026040818422046298", None),
    "한국경제, 정태영 LLM 교육 참여 (2026.8.20)": ("https://www.hankyung.com/article/2026082013561", None),
    "디지털데일리, 현대카드 AWS AI 서비스 (2026.5)": ("https://www.ddaily.co.kr/page/view/2026052017124329295", None),
}
x = open(slide, encoding="utf-8").read()
r = open(rels, encoding="utf-8").read()
ids = [int(i) for i in re.findall(r'Id="rId(\d+)"', r)]
nxt = max(ids) + 1
new_rels = []
done = 0
for text, (url, new_text) in LINKS.items():
    esc = html.escape(text, quote=False)
    # 항목 하나 = 런 하나: <a:r><a:rPr ...>...</a:rPr><a:t>text</a:t></a:r>
    m = re.search(r'(<a:r><a:rPr[^>]*>)((?:(?!</a:rPr>|<a:r>).)*?)(</a:rPr><a:t>)' + re.escape(esc) + r'(</a:t></a:r>)', x)
    if not m:
        m = re.search(r'(<a:r><a:rPr[^>]*>)((?:(?!</a:rPr>|<a:r>).)*?)(</a:rPr><a:t>)' + re.escape(text) + r'(</a:t></a:r>)', x)
    assert m, f"not found: {text}"
    rid = f"rId{nxt}"; nxt += 1
    body = m.group(2)
    assert "hlinkClick" not in body
    label = html.escape(new_text or text, quote=False)
    rep = f'{m.group(1)}{body}<a:hlinkClick r:id="{rid}"/>{m.group(3)}{label}{m.group(4)}'
    x = x[:m.start()] + rep + x[m.end():]
    new_rels.append(f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{html.escape(url)}" TargetMode="External"/>')
    done += 1
r = r.replace("</Relationships>", "".join(new_rels) + "</Relationships>")
open(slide, "w", encoding="utf-8").write(x)
open(rels, "w", encoding="utf-8").write(r)
print("linked", done)
