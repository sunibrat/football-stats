import os
import subprocess
from datetime import datetime

# Configuration
REPOS = {
    'espana': 'https://github.com/footballcsv/espana.git',
    'england': 'https://github.com/footballcsv/england.git',
    'champions-league': 'https://github.com/footballcsv/europe-champions-league.git'
}

DATA_FOLDER = 'data'
LOG_FILE = 'update_log.txt'

def log_message(message):
    """Log message to file and console"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_entry = f'[{timestamp}] {message}'
    print(log_entry)
    
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(log_entry + '\n')

def update_repo(folder, url):
    """Update or clone a single repository"""
    path = os.path.join(DATA_FOLDER, folder)
    
    try:
        if os.path.exists(path):
            log_message(f'🔄 Updating {folder}...')
            subprocess.run(['git', '-C', path, 'pull'], check=True, capture_output=True, text=True)
            log_message(f'✅ {folder} - updated successfully')
        else:
            log_message(f'📥 Cloning {folder} for first time...')
            os.makedirs(DATA_FOLDER, exist_ok=True)
            subprocess.run(['git', 'clone', url, path], check=True, capture_output=True, text=True)
            log_message(f'✅ {folder} - cloned successfully')
            
    except subprocess.CalledProcessError as e:
        log_message(f'❌ ERROR for {folder}: {e.stderr}')
    except Exception as e:
        log_message(f'❌ UNEXPECTED ERROR for {folder}: {str(e)}')

def main():
    """Main function"""
    log_message('🚀 STARTING UPDATE PROCESS')
    log_message('=' * 50)
    
    # Check if git is installed
    try:
        subprocess.run(['git', '--version'], check=True, capture_output=True)
    except:
        log_message('❌ Git is not installed! Please install Git first.')
        return
    
    # Update all repositories
    for folder, url in REPOS.items():
        update_repo(folder, url)
    
    log_message('=' * 50)
    log_message('✅ UPDATE PROCESS COMPLETED')

if __name__ == '__main__':
    main()