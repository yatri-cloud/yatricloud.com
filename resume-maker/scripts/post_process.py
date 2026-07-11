#!/usr/bin/env python3
"""
post_process.py (portable) — enable automatic hyphenation + inject no-hyphen
paragraph styles, using only the Python standard library (zipfile). No external
helper scripts required, so it runs anywhere Claude Code runs.

Usage:  python3 post_process.py <resume.docx>

A .docx is a zip. This rewrites word/settings.xml (turn on auto-hyphenation),
word/styles.xml (set default language en-US + add the kwlist / nohyp no-hyphen
styles used by build_resume.js), and repacks the archive in place.
"""
import sys, os, re, zipfile

DOCX = sys.argv[1] if len(sys.argv) > 1 else "Resume.docx"

HYPH = ('<w:autoHyphenation w:val="true"/>'
        '<w:consecutiveHyphenLimit w:val="2"/>'
        '<w:hyphenationZone w:val="357"/>'
        '<w:doNotHyphenateCaps w:val="true"/>')

STYLE = ('<w:style w:type="paragraph" w:styleId="{id}">'
         '<w:name w:val="{id}"/><w:basedOn w:val="Normal"/><w:qFormat/>'
         '<w:pPr><w:suppressAutoHyphens/></w:pPr></w:style>')


def patch_settings(xml: str) -> str:
    if "autoHyphenation" in xml:
        return xml
    if "<w:compat" in xml:                       # correct schema slot (before compat)
        return xml.replace("<w:compat", HYPH + "<w:compat", 1)
    if "</w:settings>" in xml:
        return xml.replace("</w:settings>", HYPH + "</w:settings>", 1)
    return xml


def patch_styles(xml: str) -> str:
    # 1) default language so the hyphenation dictionary applies
    if '<w:lang w:val="en-US"/>' not in xml:
        m = re.search(r"(<w:rPrDefault>\s*<w:rPr>)(.*?)(</w:rPr>)", xml, re.S)
        if m:
            xml = (xml[:m.start()] + m.group(1) + m.group(2)
                   + '<w:lang w:val="en-US"/>' + m.group(3) + xml[m.end():])
        else:
            xml = re.sub(r"(<w:styles[^>]*>)",
                         r"\1<w:docDefaults><w:rPrDefault><w:rPr>"
                         r'<w:lang w:val="en-US"/></w:rPr></w:rPrDefault></w:docDefaults>',
                         xml, count=1)
    # 2) the two no-hyphen paragraph styles
    for sid in ("kwlist", "nohyp"):
        if f'w:styleId="{sid}"' not in xml:
            xml = xml.replace("</w:styles>", STYLE.format(id=sid) + "</w:styles>", 1)
    return xml


def main():
    if not os.path.exists(DOCX):
        sys.exit(f"Not found: {DOCX}")
    tmp = DOCX + ".tmp"
    with zipfile.ZipFile(DOCX, "r") as zin, \
         zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "word/settings.xml":
                data = patch_settings(data.decode("utf-8")).encode("utf-8")
            elif item.filename == "word/styles.xml":
                data = patch_styles(data.decode("utf-8")).encode("utf-8")
            zout.writestr(item, data)
    os.replace(tmp, DOCX)
    print("post-process OK ->", DOCX)


if __name__ == "__main__":
    main()
