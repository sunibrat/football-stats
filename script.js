// Global variables
let allMatches = [];
let allCards = [];
let leaguesIndex = {};
let injuries = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('last-update').textContent = new Date().toLocaleString();
    await loadData();
});

// Load all data from JSON files
async function loadData() {
    try {
        // Load leagues index
        const indexResponse = await fetch('data/leagues_index.json');
        if (indexResponse.ok) {
            leaguesIndex = await indexResponse.json();
            const leagueCount = Object.keys(leaguesIndex).length;
            document.getElementById('statsBadge').textContent = `📊 ${leagueCount} leagues loaded`;
        }

        // Load all matches
        const matchesResponse = await fetch('data/all_matches.json');
        if (matchesResponse.ok) {
            allMatches = await matchesResponse.json();
            console.log(`✅ Loaded ${allMatches.length} matches`);
        }

        // Load cards
        const cardsResponse = await fetch('data/all_cards.json');
        if (cardsResponse.ok) {
            allCards = await cardsResponse.json();
            console.log(`✅ Loaded ${allCards.length} cards`);
        }

        // Load injuries
        const injuriesResponse = await fetch('data/injuries.json');
        if (injuriesResponse.ok) {
            injuries = await injuriesResponse.json();
            console.log(`✅ Loaded ${injuries.length} injuries`);
        }

    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('statsBadge').textContent = '⚠️ Error loading data';
    }
}

// Search head-to-head matches
async function searchMatches() {
    const team1 = document.getElementById('team1').value.trim().toLowerCase();
    const team2 = document.getElementById('team2').value.trim().toLowerCase();

    if (!team1 || !team2) {
        showError('Please enter both team names');
        return;
    }

    showLoading();

    try {
        // Filter matches between the two teams
        const headToHead = allMatches.filter(m => 
            (m.home_team.toLowerCase().includes(team1) && m.away_team.toLowerCase().includes(team2)) ||
            (m.home_team.toLowerCase().includes(team2) && m.away_team.toLowerCase().includes(team1))
        );

        if (headToHead.length === 0) {
            hideLoading();
            showError(`No matches found between ${team1} and ${team2}`);
            return;
        }

        // Calculate statistics
        const stats = calculateStats(headToHead, team1, team2);
        displayStats(stats, team1, team2);
        displayMatches(headToHead, team1, team2);
        
    } catch (error) {
        showError('Error searching matches: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Calculate statistics
function calculateStats(matches, team1, team2) {
    let team1Wins = 0, team2Wins = 0, draws = 0;
    let team1Goals = 0, team2Goals = 0;

    matches.forEach(m => {
        if (m.home_score > m.away_score) {
            if (m.home_team.toLowerCase().includes(team1)) team1Wins++;
            else team2Wins++;
        } else if (m.away_score > m.home_score) {
            if (m.away_team.toLowerCase().includes(team1)) team1Wins++;
            else team2Wins++;
        } else {
            draws++;
        }

        if (m.home_team.toLowerCase().includes(team1)) {
            team1Goals += m.home_score;
            team2Goals += m.away_score;
        } else {
            team1Goals += m.away_score;
            team2Goals += m.home_score;
        }
    });

    return {
        team1Wins,
        team2Wins,
        draws,
        team1Goals,
        team2Goals,
        totalMatches: matches.length
    };
}

// Display statistics
function displayStats(stats, team1, team2) {
    const statsDiv = document.getElementById('stats-summary');
    
    statsDiv.innerHTML = `
        <h3>📊 Head-to-Head Statistics</h3>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-number">${stats.team1Wins}</div>
                <div class="stat-label">${team1} Wins</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${stats.draws}</div>
                <div class="stat-label">Draws</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${stats.team2Wins}</div>
                <div class="stat-label">${team2} Wins</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${stats.totalMatches}</div>
                <div class="stat-label">Total Matches</div>
            </div>
        </div>
        <div style="margin-top: 15px; text-align: center;">
            ⚽ Goals: ${team1} ${stats.team1Goals} - ${stats.team2Goals} ${team2}
        </div>
    `;
    
    statsDiv.style.display = 'block';
}

// Display matches
function displayMatches(matches, team1, team2) {
    const resultsDiv = document.getElementById('results');
    
    let html = '<h2 style="margin-bottom: 20px; color: #1e3c72;">⚔️ Head-to-Head Matches</h2>';
    
    matches.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    matches.forEach(m => {
        // Check if this team1 is home or away
        const isTeam1Home = m.home_team.toLowerCase().includes(team1);
        
        html += `
            <div class="match-card">
                <div class="match-header">
                    <span class="match-date">📅 ${formatDate(m.date)}</span>
                    <span class="match-competition">🏆 ${m.competition || 'Unknown'}</span>
                </div>
                <div class="match-teams">
                    <span class="team home">🏠 ${m.home_team}</span>
                    <span class="score">${m.home_score} - ${m.away_score}</span>
                    <span class="team away">✈️ ${m.away_team}</span>
                </div>
        `;
        
        // Add cards if available
        const matchCards = allCards.filter(c => 
            c.match_date === m.date && 
            c.home_team === m.home_team && 
            c.away_team === m.away_team
        );
        
        if (matchCards.length > 0) {
            html += '<div class="cards">';
            matchCards.forEach(card => {
                const cardType = card.Card_Type === 'Yellow' ? '🟨' : '🟥';
                const cardClass = card.Card_Type === 'Yellow' ? 'yellow-card' : 'red-card';
                html += `<span class="${cardClass}">${cardType} ${card.Player} (${card.Minute}')</span>`;
            });
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    // Add injuries section
    const team1Injuries = injuries.filter(i => 
        i.club && i.club.toLowerCase().includes(team1) ||
        i.team && i.team.toLowerCase().includes(team1)
    );
    
    const team2Injuries = injuries.filter(i => 
        i.club && i.club.toLowerCase().includes(team2) ||
        i.team && i.team.toLowerCase().includes(team2)
    );
    
    if (team1Injuries.length > 0 || team2Injuries.length > 0) {
        html += '<h2 style="margin: 30px 0 20px; color: #1e3c72;">🤕 Current Injuries</h2>';
        
        if (team1Injuries.length > 0) {
            html += `<h3>${team1}</h3><div class="cards">`;
            team1Injuries.forEach(i => {
                html += `<span class="red-card">⚕️ ${i.player_name} - ${i.injury}</span>`;
            });
            html += '</div>';
        }
        
        if (team2Injuries.length > 0) {
            html += `<h3 style="margin-top: 15px;">${team2}</h3><div class="cards">`;
            team2Injuries.forEach(i => {
                html += `<span class="red-card">⚕️ ${i.player_name} - ${i.injury}</span>`;
            });
            html += '</div>';
        }
    }
    
    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
}

// Helper: Format date
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Helper: Show loading
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('stats-summary').style.display = 'none';
    document.getElementById('results').style.display = 'none';
}

// Helper: Hide loading
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Helper: Show error
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = '❌ ' + message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}