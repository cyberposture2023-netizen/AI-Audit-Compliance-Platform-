import json
import pandas as pd
from fpdf import FPDF
import os
from datetime import datetime

class ExportService:
    def __init__(self, data_dir=\"data\"):
        self.data_dir = data_dir
    
    def export_to_excel(self, controls_data, filename=None):
        \"\"\"Export controls data to Excel format\"\"\"
        if not filename:
            filename = f\"exports/compliance_controls_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx\"
        
        # Ensure exports directory exists
        os.makedirs('exports', exist_ok=True)
        
        # Create DataFrame from controls data
        df = pd.DataFrame(controls_data)
        
        # Create Excel writer
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Compliance Controls', index=False)
            
            # Add summary sheet
            summary_data = {
                'Metric': ['Total Controls', 'Implemented', 'In Progress', 'Not Started'],
                'Count': [
                    len(controls_data),
                    len([c for c in controls_data if c.get('status') == 'Implemented']),
                    len([c for c in controls_data if c.get('status') == 'In Progress']),
                    len([c for c in controls_data if c.get('status') == 'Not Started'])
                ]
            }
            pd.DataFrame(summary_data).to_excel(writer, sheet_name='Summary', index=False)
        
        return filename
    
    def export_to_pdf(self, controls_data, framework, filename=None):
        \"\"\"Export compliance report to PDF\"\"\"
        if not filename:
            filename = f\"exports/compliance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf\"
        
        # Ensure exports directory exists
        os.makedirs('exports', exist_ok=True)
        
        pdf = FPDF()
        pdf.add_page()
        
        # Title
        pdf.set_font(\"Arial\", 'B', 16)
        pdf.cell(0, 10, f\"{framework} Compliance Report\", ln=True, align='C')
        pdf.ln(10)
        
        # Date
        pdf.set_font(\"Arial\", size=12)
        pdf.cell(0, 10, f\"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\", ln=True)
        pdf.ln(10)
        
        # Summary
        pdf.set_font(\"Arial\", 'B', 14)
        pdf.cell(0, 10, \"Executive Summary\", ln=True)
        pdf.set_font(\"Arial\", size=12)
        
        total = len(controls_data)
        implemented = len([c for c in controls_data if c.get('status') == 'Implemented'])
        compliance_rate = (implemented / total * 100) if total > 0 else 0
        
        pdf.cell(0, 10, f\"Total Controls: {total}\", ln=True)
        pdf.cell(0, 10, f\"Implemented: {implemented}\", ln=True)
        pdf.cell(0, 10, f\"Compliance Rate: {compliance_rate:.1f}%\", ln=True)
        pdf.ln(10)
        
        # Controls Details
        pdf.set_font(\"Arial\", 'B', 14)
        pdf.cell(0, 10, \"Controls Details\", ln=True)
        pdf.set_font(\"Arial\", size=10)
        
        for control in controls_data:
            pdf.ln(5)
            pdf.multi_cell(0, 8, f\"Control: {control.get('name', 'N/A')}\")
            pdf.multi_cell(0, 8, f\"Status: {control.get('status', 'N/A')}\")
            pdf.multi_cell(0, 8, f\"Framework: {control.get('framework', 'N/A')}\")
            pdf.ln(2)
        
        pdf.output(filename)
        return filename
