import os
import urllib.request
from datetime import datetime
import sys

# Конфигурация - актуални линкове за сезон 2025/2026
LEAGUES = {
    'espana': {
        'url': 'https://www.football-data.co.uk/mmz4281/2526/SP1.csv',
        'filename': 'esp.1.csv',
        'name': 'La Liga'
    },
    'england': {
        'url': 'https://www.football-data.co.uk/mmz4281/2526/E0.csv',
        'filename': 'eng.1.csv',
        'name': 'Premier League'
    },
    'champions-league': {
        'url': 'https://www.football-data.co.uk/mmz4281/2526/C1.csv',
        'filename': 'cl.csv',
        'name': 'Champions League'
    }
}

DATA_FOLDER = 'data'
LOG_FILE = 'update_log.txt'

def log_message(message):
    """Записва съобщение в конзолата и във файл"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_entry = f'[{timestamp}] {message}'
    print(log_entry)
    
    # Записвай във файл само ако не сме в GitHub Actions
    if not os.getenv('GITHUB_ACTIONS'):
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_entry + '\n')

def check_file_has_data(filepath):
    """Проверява дали файлът има реални данни"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            if len(lines) <= 1:
                return False
            if len(lines) > 1 and len(lines[1].strip()) < 10:
                return False
            return True
    except:
        return False

def download_file(url, folder, filename, league_name):
    try:
        folder_path = os.path.join(DATA_FOLDER, folder)
        os.makedirs(folder_path, exist_ok=True)
        filepath = os.path.join(folder_path, filename)
        
        log_message(f'📥 Downloading {league_name}...')
        
        urllib.request.urlretrieve(url, filepath)
        
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            if size > 1000 and check_file_has_data(filepath):
                log_message(f'✅ {league_name}: {size} bytes - OK')
                return True
            else:
                log_message(f'⚠️ {league_name}: файлът е празен ({size} bytes)')
                os.remove(filepath)
                return False
        else:
            log_message(f'❌ {league_name}: файлът не беше създаден')
            return False
            
    except Exception as e:
        log_message(f'❌ Error downloading {league_name}: {str(e)}')
        return False

def main():
    log_message('🚀 STARTING UPDATE PROCESS')
    log_message('=' * 50)
    
    # Проверка за интернет
    try:
        urllib.request.urlopen('https://www.google.com', timeout=5)
        log_message('✅ Internet connection OK')
    except:
        log_message('❌ No internet connection!')
        sys.exit(1)
    
    successful = 0
    failed = 0
    
    for league, config in LEAGUES.items():
        if download_file(config['url'], league, config['filename'], config['name']):
            successful += 1
        else:
            failed += 1
    
    log_message('=' * 50)
    log_message(f'📊 SUMMARY: {successful} successful, {failed} failed')
    
    # Изтрий лог файла в GitHub Actions
    if os.getenv('GITHUB_ACTIONS') and os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)
        print("🧹 Removed log file for GitHub Actions")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'❌ UNHANDLED ERROR: {str(e)}')
        sys.exit(1)