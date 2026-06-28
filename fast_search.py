import os
import re

search_dirs = [r'd:\OneDrive\Code webapp']
patterns = ['AES', 'decrypt', 'crypto', '065.043.037.002_HSQN_GCT', 'HSQN_GCT']

def search():
    for d in search_dirs:
        for root, dirs, files in os.walk(d):
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            if '.git' in dirs:
                dirs.remove('.git')
                
            for file in files:
                if file.endswith(('.js', '.ts', '.html', '.php', '.cs', '.py', '.txt', '.md')):
                    path = os.path.join(root, file)
                    try:
                        with open(path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            for p in patterns:
                                if p in content:
                                    print(f"Found '{p}' in {path}")
                                    break # Avoid printing multiple times for same file
                    except Exception:
                        pass

if __name__ == '__main__':
    search()
