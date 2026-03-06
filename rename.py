import os
import glob

tables = ['profiles', 'clients', 'appointments', 'financial_transactions', 'anamnesis', 'support_messages']
migrations_dir = './supabase/migrations'
src_dir = './src'

print('--- SQL Migrations ---')
for f in glob.glob(f'{migrations_dir}/*.sql'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    changed = False
    for t in tables:
        # Avoid prefixing if already prefixed
        if f'public.{t}' in content:
            content = content.replace(f'public.{t}', f'public.nx_{t}')
            changed = True
        if f'REFERENCES {t}' in content:
            content = content.replace(f'REFERENCES {t}', f'REFERENCES nx_{t}')
            changed = True
        if f'ON {t}' in content:
            content = content.replace(f'ON {t}', f'ON nx_{t}')
            changed = True
            
    if changed:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f'Updated {f}')

print('--- React Code ---')
for root, _, files in os.walk(src_dir):
    for filename in files:
        if filename.endswith('.tsx') or filename.endswith('.ts'):
            f = os.path.join(root, filename)
            with open(f, 'r', encoding='utf-8') as file:
                content = file.read()
            
            changed = False
            for t in tables:
                # Assuming supabase.from('table_name')
                if f"'{t}'" in content:
                    content = content.replace(f"'{t}'", f"'nx_{t}'")
                    changed = True
                if f'"{t}"' in content:
                    content = content.replace(f'"{t}"', f'"nx_{t}"')
                    changed = True
                    
            if changed:
                with open(f, 'w', encoding='utf-8') as file:
                    file.write(content)
                print(f'Updated {f}')
