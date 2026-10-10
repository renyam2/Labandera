#!/usr/bin/env python3
from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        pass
    def footer(self):
        if self.page_no() == 1:
            return
        self.set_font("Arial", "", 9)
        self.set_text_color(100)
        self.cell(0, 10, f"Página {self.page_no()}", align="C", new_x="LMARGIN", new_y="NEXT")

pdf = PDF("P", "mm", "A4")
pdf.set_auto_page_break(True, margin=20)

def t1(t):
    pdf.ln(6); pdf.set_font("Arial", "B", 14)
    pdf.multi_cell(0, 7, t, new_x="LMARGIN", new_y="NEXT"); pdf.ln(2)

def t2(t):
    pdf.ln(4); pdf.set_font("Arial", "B", 12)
    pdf.multi_cell(0, 6, t, new_x="LMARGIN", new_y="NEXT"); pdf.ln(1)

def p(t):
    pdf.set_font("Arial", "", 12)
    pdf.multi_cell(0, 6, t, align="J", new_x="LMARGIN", new_y="NEXT"); pdf.ln(3)

def pn(t):
    pdf.set_font("Arial", "B", 12)
    pdf.multi_cell(0, 6, t, align="J", new_x="LMARGIN", new_y="NEXT"); pdf.ln(2)

def li(items):
    pdf.set_font("Arial", "", 12)
    for i in items:
        pdf.multi_cell(0, 6, "  •  " + i, align="J", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

def tb(h, rows):
    pdf.set_font("Arial", "B", 11)
    cw = [min(len(x)*1.8+4, 170//len(h)) for x in h]
    cw[-1] += 170 - sum(cw)
    for i, x in enumerate(h):
        pdf.cell(cw[i], 7, x, border=1, align="C")
    pdf.ln()
    pdf.set_font("Arial", "", 11)
    for row in rows:
        for i, c in enumerate(row):
            pdf.multi_cell(cw[i], 6, c, border=1, align="L", new_x="RIGHT", new_y="TOP")
        pdf.ln()
    pdf.ln(3)
