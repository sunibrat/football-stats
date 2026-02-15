// Display current date
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US');

// Sample card data (if CSV doesn't have cards)
const cardData = {
    'Real Madrid vs Barcelona': {
        '2024-04-21': { homeYellow: ['Vinicius Jr.', 'Modric'], awayYellow: ['Pedri'], homeRed: [], awayRed: [] },
        '2024-01-14': { homeYellow: ['Lewandowski', 'Araujo'], awayYellow: ['Carvajal'], homeRed: [], awayRed: [] },
        '2023-10-28': { homeYellow: ['Gavi'], awayYellow: ['Kroos', 'Rüdiger'], homeRed: [], awayRed: [] }
    }
};

// Main search function
async function searchMatches() {
    const homeTeam = document.getElementById('homeTeam').value.trim();
    const awayTeam = document.getElementById('awayTeam').value.trim();
    const league = document.getElementById('leagueSelect').value;
    const matchCount = document.getElementById('matchCount').value;
    
    if (!homeTeam || !awayTeam) {
        showError('Please enter both teams');
        return;
    }
    
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    document.getElementById('statsSummary').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    
    try {
        let csvPath = '';
        switch(league) {
            case 'espana':
                csvPath = 'data/espana/esp.1.csv';
                break;
            case 'england':
                csvPath = 'data/england/eng.1.csv';
                break;
            case 'champions':
                csvPath = 'data/champions-league/cl.csv';
                break;
        }
        
        let matches = [];
        try {
            const response = await fetch(csvPath);
            if (response.ok) {
                const csvText = await response.text();
                matches = parseCSV(csvText, homeTeam, awayTeam);
            } else {
                console.log('CSV file not found, using sample data');
                matches = getSampleData(homeTeam, awayTeam);
            }
        } catch (error) {
            console.log('Error loading CSV, using sample data');
            matches = getSampleData(homeTeam, awayTeam);
        }
        
        if (matchCount !== 'all') {
            matches = matches.slice(0, parseInt(matchCount));
        }
        
        if (matches.length === 0) {
            showError('No matches found between these teams');
            return;
        }
        
        displayResults(matches, homeTeam, awayTeam);
        
    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Parse CSV file
function parseCSV(csvText, homeTeam, awayTeam) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    const dateIdx = headers.findIndex(h => h.includes('Date'));
    const homeIdx = headers.findIndex(h => h.includes('Home') || h.includes('Team 1'));
    const awayIdx = headers.findIndex(h => h.includes('Away') || h.includes('Team 2'));
    const scoreIdx = headers.findIndex(h => h.includes('FT') || h.includes('Score'));
    
    const matches = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 5) continue;
        
        const home = values[homeIdx]?.trim() || '';
        const away = values[awayIdx]?.trim() || '';
        
        if ((home.includes(homeTeam) && away.includes(awayTeam)) || 
            (home.includes(awayTeam) && away.includes(homeTeam))) {
            
            const score = values[scoreIdx]?.trim() || '0-0';
            const [homeGoals, awayGoals] = score.split('-').map(Number);
            
            matches.push({
                date: values[dateIdx] || 'Unknown date',
                homeTeam: home,
                awayTeam: away,
                score: score,
                homeGoals: homeGoals || 0,
                awayGoals: awayGoals || 0,
                competition: league === 'espana' ? 'La Liga' : 
                           league === 'england' ? 'Premier League' : 'Champions League'
            });
        }
    }
    
    return matches;
}

// Sample data for testing
function getSampleData(homeTeam, awayTeam) {
    return [
        { date: '2024-04-21', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', score: '3-2', homeGoals: 3, awayGoals: 2, competition: 'La Liga' },
        { date: '2024-01-14', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', score: '1-4', homeGoals: 1, awayGoals: 4, competition: 'Super Cup' },
        { date: '2023-10-28', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', score: '1-2', homeGoals: 1, awayGoals: 2, competition: 'La Liga' },
        { date: '2023-03-19', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', score: '2-1', homeGoals: 2, awayGoals: 1, competition: 'La Liga' },
        { date: '2023-03-02', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', score: '0-1', homeGoals: 0, awayGoals: 1, competition: 'Copa del Rey' }
    ];
}

// Display results
function displayResults(matches, homeTeam, awayTeam) {
    const resultsDiv = document.getElementById('results');
    const statsDiv = document.getElementById('statsSummary');
    
    let homeWins = 0, awayWins = 0, draws = 0;
    let homeGoals = 0, awayGoals = 0;
    
    matches.forEach(m => {
        if (m.homeGoals > m.awayGoals) {
            if (m.homeTeam.includes(homeTeam)) homeWins++;
            else awayWins++;
        } else if (m.awayGoals > m.homeGoals) {
            if (m.awayTeam.includes(homeTeam)) homeWins++;
            else awayWins++;
        } else {
            draws++;
        }
        
        homeGoals += m.homeGoals;
        awayGoals += m.awayGoals;
    });
    
    statsDiv.innerHTML = `
        <h3>📊 Statistics</h3>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-number">${homeWins}</div>
                <div class="stat-label">${homeTeam} Wins</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${draws}</div>
                <div class="stat-label">Draws</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${awayWins}</div>
                <div class="stat-label">${awayTeam} Wins</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${homeGoals + awayGoals}</div>
                <div class="stat-label">Total Goals</div>
            </div>
        </div>
    `;
    
    let html = '<h3>⚔️ Matches</h3>';
    
    matches.forEach(m => {
        const matchKey = `${m.homeTeam} vs ${m.awayTeam}`;
        const cards = cardData[matchKey]?.[m.date] || 
                     { homeYellow: [], awayYellow: [], homeRed: [], awayRed: [] };
        
        html += `
            <div class="match-card">
                <div class="match-header">
                    <span class="match-date">📅 ${formatDate(m.date)}</span>
                    <span class="match-score">${m.score}</span>
                </div>
                
                <div class="match-teams">
                    <div class="team-name home">🏠 ${m.homeTeam}</div>
                    <div class="vs">VS</div>
                    <div class="team-name away">✈️ ${m.awayTeam}</div>
                </div>
                
                <div class="match-stats">
                    <div class="stat-item">
                        <div class="stat-label">🏆 Competition</div>
                        <div class="stat-value">${m.competition}</div>
                    </div>
                </div>
                
                <div class="cards">
                    ${cards.homeYellow.map(p => `<span class="yellow-card">🟨 ${p}</span>`).join('')}
                    ${cards.awayYellow.map(p => `<span class="yellow-card">🟨 ${p}</span>`).join('')}
                    ${cards.homeRed.map(p => `<span class="red-card">🟥 ${p}</span>`).join('')}
                    ${cards.awayRed.map(p => `<span class="red-card">🟥 ${p}</span>`).join('')}
                </div>
            </div>
        `;
    });
    
    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
    statsDiv.style.display = 'block';
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = '❌ ' + message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}