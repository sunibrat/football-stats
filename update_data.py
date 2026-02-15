import os
import urllib.request
from datetime import datetime
import sys

# Конфигурация - актуални линкове за сезон 2025/2026
LEAGUES = {
    'espana': {
        'url': 'https://www.football-data.co.uk/mmz4281/2526/SP1.csv',
        'filename': 'esp.1.csv'
    },
    'england': {
        'url': 'https://www.football-data.co.uk/mmz4281/2526/E0.csv',
        'filename': 'eng.1.csv'
    },
    'champions-league': {
        'url': 'https://www.football-data.co.uk/mmz4281/2526/C1.csv',
        'filename': 'cl.csv'
    }
}

DATA_FOLDER = 'data'
LOG_FILE = 'update_log.txt'

def log_message(message):
    """Записва съобщение във файл и го принтира"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_entry = f'[{timestamp}] {message}'
    print(log_entry)
    
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_entry + '\n')
    except:
        pass  # Ако не може да запише лог файла, продължава

def download_file(url, folder, filename):
    """Изтегля CSV файл с обработка на грешки"""
    try:
        # Създава папката ако я няма
        folder_path = os.path.join(DATA_FOLDER, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        filepath = os.path.join(folder_path, filename)
        log_message(f'📥 Downloading {folder}/{filename} from {url}...')
        
        # Изтегляне с timeout
        urllib.request.urlretrieve(url, filepath)
        
        # Проверка дали файлът не е празен
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            if size > 100:
                log_message(f'✅ {folder}/{filename} downloaded successfully ({size} bytes)')
                return True
            else:
                log_message(f'❌ {folder}/{filename} is too small ({size} bytes)')
                return False
        else:
            log_message(f'❌ {folder}/{filename} was not created')
            return False
            
    except Exception as e:
        log_message(f'❌ Error downloading {folder}/{filename}: {str(e)}')
        return False

def main():
    log_message('🚀 STARTING UPDATE PROCESS')
    log_message('=' * 50)
    
    # Проверка за интернет връзка
    try:
        urllib.request.urlopen('https://www.google.com', timeout=5)
        log_message('✅ Internet connection OK')
    except:
        log_message('❌ No internet connection!')
        sys.exit(1)
    
    successful = 0
    failed = 0
    
    for league, config in LEAGUES.items():
        if download_file(config['url'], league, config['filename']):
            successful += 1
        else:
            failed += 1
    
    log_message('=' * 50)
    log_message(f'📊 SUMMARY: {successful} successful, {failed} failed')
    
    if failed > 0:
        log_message('⚠️ Some downloads failed!')
        sys.exit(1)  # Това ще маркира workflow-а като неуспешен
    else:
        log_message('✅ ALL DOWNLOADS SUCCESSFUL!')
    
    # Покажи къде са файловете
    log_message('\n📁 Files in data directory:')
    for league in LEAGUES.keys():
        folder_path = os.path.join(DATA_FOLDER, league)
        if os.path.exists(folder_path):
            files = os.listdir(folder_path)
            log_message(f'   {league}: {len(files)} files')
            for f in files:
                file_path = os.path.join(folder_path, f)
                size = os.path.getsize(file_path)
                log_message(f'     - {f} ({size} bytes)')

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'❌ UNHANDLED ERROR: {str(e)}')
        sys.exit(1)