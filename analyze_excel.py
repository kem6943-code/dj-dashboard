import pandas as pd
import json

file_path = r'C:\Users\김윤주\Desktop\실적보고 대시보드 만들기\1. 경영 현황_창원사업부.xlsx'

try:
    # 1. 시트 이름 확인
    xls = pd.ExcelFile(file_path)
    print("Sheets:", xls.sheet_names)
    
    # 2. 첫 번째 시트 (보통 'Raw', 'Data', 또는 '1. 월별 실적') 데이터 구조 확인
    sheet_name = [s for s in xls.sheet_names if '월별' in s or '실적' in s]
    target_sheet = sheet_name[0] if sheet_name else xls.sheet_names[0]
    
    # 상위 20행 정도 읽어서 헤더 구조 파악
    df = pd.read_excel(file_path, sheet_name=target_sheet, nrows=30, header=None)
    
    # NaN 값을 None으로 변환하여 JSON으로 출력 가능하게 함
    df = df.where(pd.notnull(df), None)
    
    print("\n--- Sheet Data Preview ---")
    print(df.head(20).to_string())

except Exception as e:
    print(f"Error reading excel file: {e}")
