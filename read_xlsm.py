import pandas as pd
import sys

def analyze_excel(filepath):
    try:
        # Load the excel file
        xl = pd.ExcelFile(filepath)
        print(f"File: {filepath}")
        print(f"Sheet names: {xl.sheet_names}")
        print("-" * 50)
        
        # Analyze each sheet
        for sheet in xl.sheet_names:
            print(f"Sheet: {sheet}")
            df = xl.parse(sheet, nrows=5) # read only first 5 rows to get structure
            print(f"Columns ({len(df.columns)}): {list(df.columns)}")
            if not df.empty:
                print("First row sample:")
                print(df.iloc[0].to_dict())
            print("-" * 50)
    except Exception as e:
        print(f"Error reading file: {e}")

if __name__ == "__main__":
    analyze_excel('065_043_037_002_HSQN_GCT_MDD_20260625.xlsm')
