import base64
import zlib
import bz2
import lzma
import sys

def test_decompress(filepath):
    with open(filepath, 'r') as f:
        data = f.read().strip()
    
    decoded = base64.b64decode(data)
    
    print(f"Decoded length: {len(decoded)}")
    print(f"First 20 bytes: {decoded[:20]}")
    
    try:
        print("Trying zlib...")
        decompressed = zlib.decompress(decoded)
        print(f"zlib success! Length: {len(decompressed)}")
        print(f"Content preview: {decompressed[:100]}")
        return
    except Exception as e:
        print(f"zlib err: {e}")
        
    try:
        print("Trying bz2...")
        decompressed = bz2.decompress(decoded)
        print(f"bz2 success! Length: {len(decompressed)}")
        print(f"Content preview: {decompressed[:100]}")
        return
    except Exception as e:
        print(f"bz2 err: {e}")
        
    try:
        print("Trying lzma...")
        decompressed = lzma.decompress(decoded)
        print(f"lzma success! Length: {len(decompressed)}")
        print(f"Content preview: {decompressed[:100]}")
        return
    except Exception as e:
        print(f"lzma err: {e}")
        
    print("Could not decompress using standard libraries. It might be encrypted.")

if __name__ == '__main__':
    test_decompress('065.043.037.002_HSQN_GCT.json')
