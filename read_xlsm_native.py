import zipfile
import xml.etree.ElementTree as ET
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

def analyze_xlsm_native(filepath):
    try:
        with zipfile.ZipFile(filepath, 'r') as z:
            # Get shared strings
            shared_strings = []
            if 'xl/sharedStrings.xml' in z.namelist():
                ss_content = z.read('xl/sharedStrings.xml')
                ss_root = ET.fromstring(ss_content)
                ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
                for si in ss_root.findall('main:si', ns):
                    t = si.find('main:t', ns)
                    if t is not None:
                        shared_strings.append(t.text)
                    else:
                        # Sometimes text is in runs
                        text = "".join([t_run.text for t_run in si.findall('.//main:t', ns) if t_run.text])
                        shared_strings.append(text)
            
            # Get sheets
            wb_content = z.read('xl/workbook.xml')
            wb_root = ET.fromstring(wb_content)
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            sheets = wb_root.find('main:sheets', ns)
            
            # Map sheet name to sheet ID
            sheet_map = {}
            for sheet in sheets.findall('main:sheet', ns):
                name = sheet.attrib.get('name')
                r_id = sheet.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                sheet_id = sheet.attrib.get('sheetId')
                sheet_map[r_id] = {'name': name, 'sheetId': sheet_id}
            
            # Get sheet relationships to find the XML file
            rels_content = z.read('xl/_rels/workbook.xml.rels')
            rels_root = ET.fromstring(rels_content)
            rels_ns = {'rels': 'http://schemas.openxmlformats.org/package/2006/relationships'}
            for rel in rels_root.findall('rels:Relationship', rels_ns):
                r_id = rel.attrib.get('Id')
                target = rel.attrib.get('Target')
                if r_id in sheet_map:
                    sheet_map[r_id]['target'] = target

            print(f"File: {filepath}")
            print("Sheets found:")
            for s in sheet_map.values():
                print(f" - {s['name']}")
            print("-" * 50)
            
            # Parse each sheet's first row
            for r_id, s_info in sheet_map.items():
                target = s_info.get('target')
                if not target:
                    continue
                
                sheet_path = f"xl/{target}"
                if sheet_path not in z.namelist():
                    continue
                    
                print(f"Sheet: {s_info['name']}")
                sheet_content = z.read(sheet_path)
                sheet_root = ET.fromstring(sheet_content)
                
                sheetData = sheet_root.find('main:sheetData', ns)
                if sheetData is not None:
                    # Parse first 3 rows
                    for row in list(sheetData.findall('main:row', ns))[:3]:
                        row_idx = row.attrib.get('r', '?')
                        row_data = []
                        for c in row.findall('main:c', ns):
                            col_ref = c.attrib.get('r')
                            v = c.find('main:v', ns)
                            val = ""
                            if v is not None:
                                val = v.text
                                if c.attrib.get('t') == 's': # shared string
                                    try:
                                        val = shared_strings[int(val)]
                                    except:
                                        pass
                            row_data.append(f"{col_ref}: {val}")
                        print(f"Row {row_idx}: {row_data}")
                print("-" * 50)

    except Exception as e:
        print(f"Error parsing file: {e}")

if __name__ == "__main__":
    analyze_xlsm_native('065_043_037_002_HSQN_GCT_MDD_20260625.xlsm')
