"""Generate entirely synthetic fixtures, never read private Wind exports."""
import csv
import json
from pathlib import Path
from .scoring import ANNUAL_FIELDS, MARKET_FIELDS, ROLES, run

SAMPLES = [
 ('300699.SZ','光威复材'),('688295.SH','中复神鹰'),('001696.SZ','宗申动力'),('600580.SH','卧龙电驱'),
 ('600372.SH','中航机载'),('002465.SZ','海格通信'),('002151.SZ','北斗星通'),('300627.SZ','华测导航'),
 ('688070.SH','纵横股份'),('002389.SZ','航天彩虹'),('002085.SZ','万丰奥威'),('600038.SH','中直股份'),
 ('688631.SH','莱斯信息'),('000801.SZ','四川九洲'),('301091.SZ','深城交'),('300284.SZ','苏交科'),
 ('000099.SZ','中信海直'),('002352.SZ','顺丰控股'),('002023.SZ','海特高新'),('688568.SH','中科星图')]

def generate(directory=Path('data')):
    directory=Path(directory); directory.mkdir(parents=True,exist_ok=True)
    companies=[]; provisional=[]; rows=[]
    source='https://example.invalid/synthetic-wind-v1'
    for i,(code,name) in enumerate(SAMPLES):
        role=ROLES[i//4]
        companies.append(dict(stock_code=code,company_name=name,chain_role=role,exposure_score=40+5*(i%4),verification_status='mock',source_url=source,source_title='Synthetic fixture; not issuer facts'))
        provisional.append(dict(stock_code=code,company_name=name,chain_role=role,exposure_score=None,verification_status='pending_verification',source_url=None,missing_reason='Temporary research grouping; await company/product mapping and exposure evidence'))
        common=dict(stock_code=code,company_name=name,currency_unit='CNY_million',as_of_date='2026-10-13',source_url=source,source_title='Synthetic fixture; not actual company financials',published_date='',verification_status='mock',missing_reason='')
        revenue=1000+100*i
        for y in (2023,2024,2025):
            r=revenue*(1+.1*(y-2023))
            rows.append(dict(common,period_type='annual',report_period=f'{y}-12-31',revenue=r,revenue_yoy=10 if y==2023 else 100*(.1/(1+.1*(y-2024))),net_profit=r*.08,gross_margin=20+i%4,operating_cash_flow=r*(.06+.01*(i%4)),rd_expense=r*.05,inventory=r*.1,accounts_receivable=r*.15,capex=r*.04,asset_liability_ratio=40+i%4))
        for p in ('2024-09-30','2024-12-31','2025-03-31','2025-06-30','2025-09-30','2025-12-31','2026-03-31','2026-06-30'):
            r=revenue*(1+.1*(int(p[:4])-2023))/4
            rows.append(dict(common,period_type='quarter',report_period=p,revenue=r,net_profit=r*.08,gross_margin=20+i%4,operating_cash_flow=r*(.06+.01*(i%4))))
        rows.append(dict(common,period_type='market',report_period='',market_cap=5000+100*i,pe_ttm=20+i,pb=2+i*.1,ps_ttm=3+i*.1,total_return_1y=-10+i,volatility_1y=25+i))
    fields=['stock_code','company_name','report_period','period_type',*ANNUAL_FIELDS,*MARKET_FIELDS,'as_of_date','currency_unit','missing_reason','source_url','source_title','published_date','verification_status']
    with (directory/'financials.example.csv').open('w',encoding='utf-8',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=fields,lineterminator='\n'); writer.writeheader()
        for r in rows: writer.writerow({k:r.get(k,'null' if k in ANNUAL_FIELDS+MARKET_FIELDS else '') for k in fields})
    for name,data in [('scoring_companies.example.json',companies),('company_universe.provisional.json',provisional)]:
        (directory/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    output=run(directory/'financials.example.csv',directory/'scoring_companies.example.json',allow_mock=True)
    (directory/'company_impact.example.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__': generate()
