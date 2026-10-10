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

# PORTADA
pdf.add_page()
pdf.set_font("Arial", "B", 14)
pdf.set_text_color(30, 30, 30)
pdf.ln(50)
pdf.set_font("Arial", "B", 20)
pdf.cell(0, 12, "DESARROLLO PARA DISPOSITIVOS INTELIGENTES", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(8)
pdf.set_font("Arial", "", 14)
pdf.cell(0, 10, "FORMATO DE AVANCES", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(20)
pdf.set_draw_color(50, 50, 50)
pdf.line(40, pdf.get_y(), 170, pdf.get_y())
pdf.ln(12)
for label, valor in [
    ("Nombre de los integrantes:", "Elian Eduardo Ramírez Ramírez"),
    ("Grupo:", "IDGS17"),
    ("Nombre de la actividad:", "FORMATO DE AVANCES"),
    ("Nombre de la materia:", "Desarrollo para dispositivos inteligentes"),
]:
    pdf.set_font("Arial", "B", 12)
    pdf.cell(70, 8, label + "  ", border=0, align="L")
    pdf.set_font("Arial", "", 12)
    pdf.cell(0, 8, valor, border=0, align="L", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
pdf.ln(20)
pdf.set_font("Arial", "I", 11)
pdf.set_text_color(80, 80, 80)
pdf.cell(0, 8, "Documento académico - Respuestas a preguntas de Flutter, Hardware, Arquitectura Web e Interfaces", align="C", new_x="LMARGIN", new_y="NEXT")
