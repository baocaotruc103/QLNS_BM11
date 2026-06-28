import zipfile
import xml.etree.ElementTree as ET

def extract_headers(filepath):
    output_lines = []
    try:
        with zipfile.ZipFile(filepath, 'r') as z:
            # shared strings
            shared_strings = []
            if 'xl/sharedStrings.xml' in z.namelist():
                ss_content = z.read('xl/sharedStrings.xml')
                ss_root = ET.fromstring(ss_content)
                ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
                for si in ss_root.findall('main:si', ns):
                    t = si.find('main:t', ns)
                    if t is not None and t.text:
                        shared_strings.append(t.text)
                    else:
                        text = "".join([t_run.text for t_run in si.findall('.//main:t', ns) if t_run.text])
                        shared_strings.append(text)
            
            # workbook sheets
            wb_content = z.read('xl/workbook.xml')
            wb_root = ET.fromstring(wb_content)
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            sheets = wb_root.find('main:sheets', ns)
            sheet_map = {}
            for sheet in sheets.findall('main:sheet', ns):
                name = sheet.attrib.get('name')
                r_id = sheet.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                sheet_map[r_id] = {'name': name}
            
            rels_content = z.read('xl/_rels/workbook.xml.rels')
            rels_root = ET.fromstring(rels_content)
            rels_ns = {'rels': 'http://schemas.openxmlformats.org/package/2006/relationships'}
            for rel in rels_root.findall('rels:Relationship', rels_ns):
                r_id = rel.attrib.get('Id')
                target = rel.attrib.get('Target')
                if r_id in sheet_map:
                    sheet_map[r_id]['target'] = target

            for r_id, s_info in sheet_map.items():
                target = s_info.get('target')
                if not target: continue
                sheet_path = f"xl/{target}"
                if sheet_path not in z.namelist(): continue
                
                output_lines.append(f"=== Sheet: {s_info['name']} ===")
                sheet_content = z.read(sheet_path)
                sheet_root = ET.fromstring(sheet_content)
                sheetData = sheet_root.find('main:sheetData', ns)
                if sheetData is not None:
                    # Print first 2 rows
                    for row in list(sheetData.findall('main:row', ns))[:2]:
                        row_idx = row.attrib.get('r', '?')
                        row_data = []
                        for c in row.findall('main:c', ns):
                            col_ref = ''.join([ch for ch in c.attrib.get('r') if ch.isalpha()])
                            v = c.find('main:v', ns)
                            val = ""
                            if v is not None:
                                val = v.text
                                if c.attrib.get('t') == 's':
                                    try:
                                        val = shared_strings[int(val)]
                                    except:
                                        pass
                            if val:
                                row_data.append(f"{col_ref}: {val}")
                        output_lines.append(f"Row {row_idx}: " + ", ".join(row_data))
                output_lines.append("")

        with open('xlsm_structure.txt', 'w', encoding='utf-8') as f:
            f.write("\n".join(output_lines))
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_headers('065_043_037_002_HSQN_GCT_MDD_20260625.xlsm')
