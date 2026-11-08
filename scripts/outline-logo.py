from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

root = Path.cwd()
font = instantiateVariableFont(TTFont(root / "public/fonts/Geist-Variable.ttf"), {"wght": 580})
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
scale = 64 / font["head"].unitsPerEm
x = 2.0
paths = []
for char in "retrace":
    glyph = glyphs[cmap[ord(char)]]
    pen = SVGPathPen(glyphs)
    glyph.draw(pen)
    paths.append(f'<path transform="translate({x:.3f} 62) scale({scale:.6f} {-scale:.6f})" d="{pen.getCommands()}"/>')
    x += glyph.width * scale - 2.1
width = x + 17
wordmark = f'<g id="wordmark" fill="currentColor">{"".join(paths)}<rect x="{x+5:.3f}" y="53" width="8" height="8" fill="#DC942F"/></g>'
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.3f} 74" role="img" aria-labelledby="title"><title id="title">Retrace wordmark</title>{wordmark}</svg>'
(root / "public/brand/retrace-logo.svg").write_text(svg, encoding="utf-8")
mark = '<g id="mark" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="miter"><path d="M9 12h23v10H18v14h21"/><circle cx="9" cy="12" r="3" fill="currentColor" stroke="none"/><circle cx="39" cy="36" r="3" fill="#DC942F" stroke="none"/></g>'
(root / "public/brand/retrace-mark.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" aria-labelledby="title"><title id="title">Retrace trace symbol</title>{mark}</svg>', encoding="utf-8")
(root / "src/app/icon.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="4" fill="#FAF6F3"/><g color="#26211E">{mark}</g></svg>', encoding="utf-8")
(root / "src/components/brand.tsx").write_text(f'''export function BrandMark({{ className = "" }}: {{ className?: string }}) {{
  return <svg className={{className}} viewBox="0 0 48 48" fill="none" aria-hidden="true"><use href="/brand/retrace-mark.svg#mark" /></svg>;
}}

export function Brand({{ className = "" }}: {{ className?: string }}) {{
  return <span className={{`brand ${{className}}`}}><svg viewBox="0 0 {width:.3f} 74" aria-hidden="true"><use href="/brand/retrace-logo.svg#wordmark" /></svg><span className="sr-only">Retrace</span></span>;
}}
''', encoding="utf-8")
print(f"Outlined wordmark and trace symbol created. ViewBox width: {width:.3f}")
