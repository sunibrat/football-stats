const API_KEY = 'd59c8752a6f7c65a048cc5ef97c2238b';
const API_HOST = 'v3.football.api-sports.io';

let currentTeamId = null;
let teamIds = {};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
    searchTeam();
});

async function searchTeam() {
    const teamName = document.getElementById('teamInput').value.trim();
    if (!teamName) {
        showError('Please enter a team name');
        return;
    }

    showLoading();
    hideError();

    try {
        const teamId = await getTeamId(teamName);
        if (!teamId) {
            showError('Team not found');
            hideLoading();
            return;
        }
        
        currentTeamId = teamId;
        
        const teamResponse = await fetch(
            `https://v3.football.api-sports.io/teams?id=${teamId}`,
            { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST } }
        );
        const teamData = await teamResponse.json();
        
        if (teamData.response && teamData.response.length > 0) {
            displayTeamInfo(teamData.response[0]);
        }

        const fixturesResponse = await fetch(
            `https://v3.football.api-sports.io/fixtures?team=${teamId}&next=15&status=NS`,
            { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST } }
        );
        
        const fixturesData = await fixturesResponse.json();
        const allFixtures = fixturesData.response || [];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingFixtures = allFixtures.filter(fixture => {
            const matchDate = new Date(fixture.fixture.date);
            return matchDate >= today;
        });
        
        displayUpcomingMatches(upcomingFixtures);

    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function getTeamId(teamName) {
    if (teamIds[teamName]) return teamIds[teamName];
    
    try {
        const response = await fetch(
            `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(teamName)}`,
            { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST } }
        );
        
        const data = await response.json();
        if (data.response && data.response.length > 0) {
            const teamId = data.response[0].team.id;
            teamIds[teamName] = teamId;
            return teamId;
        }
    } catch (error) {
        console.error('Error fetching team ID:', error);
    }
    return null;
}

function displayTeamInfo(teamData) {
    const team = teamData.team;
    const venue = teamData.venue;
    
    document.getElementById('teamInfo').innerHTML = `
        <h2>🏆 ${team.name}</h2>
        <p>📍 ${venue.name || 'N/A'} (${venue.city || 'N/A'}) • Capacity: ${venue.capacity?.toLocaleString() || 'N/A'}</p>
    `;
    document.getElementById('teamInfo').style.display = 'block';
}

function displayUpcomingMatches(fixtures) {
    const matchesList = document.getElementById('matchesList');
    
    if (!fixtures || fixtures.length === 0) {
        matchesList.innerHTML = '<p>No upcoming matches found.</p>';
    } else {
        let html = '';
        fixtures.forEach(fixture => {
            const date = new Date(fixture.fixture.date);
            const isToday = date.toDateString() === new Date().toDateString();
            const status = fixture.fixture.status.short;
            
            let statusBadge = '';
            if (status === 'NS') {
                statusBadge = '<span class="status-badge upcoming">⏳ Upcoming</span>';
            }
            
            html += `
                <div class="match-card" onclick="selectMatch('${fixture.teams.home.name}', '${fixture.teams.away.name}')">
                    <div class="match-header">
                        <span class="match-date">📅 ${date.toLocaleDateString()}</span>
                        <span class="match-competition">🏆 ${fixture.league.name}</span>
                    </div>
                    <div class="match-teams">
                        <span class="team home">🏠 ${fixture.teams.home.name}</span>
                        <span class="vs">VS</span>
                        <span class="team away">✈️ ${fixture.teams.away.name}</span>
                    </div>
                    <div style="margin-top: 10px; text-align: center;">
                        ${statusBadge}
                        ${isToday ? '<span class="today-badge">🔴 TODAY</span>' : ''}
                    </div>
                </div>
            `;
        });
        matchesList.innerHTML = html;
    }
    
    document.getElementById('upcomingMatches').style.display = 'block';
    document.getElementById('matchHistory').style.display = 'none';
}

async function selectMatch(homeTeam, awayTeam) {
    showLoading();
    
    try {
        const homeId = await getTeamId(homeTeam);
        const awayId = await getTeamId(awayTeam);
        
        if (!homeId || !awayId) {
            showError('Could not find team IDs');
            hideLoading();
            return;
        }
        
        const h2hResponse = await fetch(
            `https://v3.football.api-sports.io/fixtures/headtohead?h2h=${homeId}-${awayId}&last=10`,
            { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST } }
        );

        const h2hData = await h2hResponse.json();
        const h2hMatches = h2hData.response || [];
        
        const matchesWithStats = await Promise.all(
            h2hMatches.map(async (match) => {
                const statsResponse = await fetch(
                    `https://v3.football.api-sports.io/fixtures/statistics?fixture=${match.fixture.id}`,
                    { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST } }
                );
                const statsData = await statsResponse.json();
                
                const eventsResponse = await fetch(
                    `https://v3.football.api-sports.io/fixtures/events?fixture=${match.fixture.id}`,
                    { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST } }
                );
                const eventsData = await eventsResponse.json();
                
                return {
                    ...match,
                    statistics: statsData.response,
                    events: eventsData.response
                };
            })
        );
        
        displayMatchHistory(matchesWithStats, homeTeam, awayTeam);

    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displayMatchHistory(matches, homeTeam, awayTeam) {
    let html = `<h3>${homeTeam} vs ${awayTeam} - Last ${matches.length} matches</h3>`;
    
    matches.forEach(match => {
        const fixture = match.fixture;
        const teams = match.teams;
        const goals = match.goals;
        
        html += `
            <div class="match-card">
                <div class="match-header">
                    <span class="match-date">📅 ${new Date(fixture.date).toLocaleDateString()}</span>
                    <span class="match-score">${goals.home || 0} - ${goals.away || 0}</span>
                </div>
                <div class="match-teams">
                    <span class="team home">${teams.home.name}</span>
                    <span class="vs">VS</span>
                    <span class="team away">${teams.away.name}</span>
                </div>
        `;
        
        if (match.statistics && match.statistics.length > 0) {
            const homeStats = match.statistics[0]?.statistics || [];
            const awayStats = match.statistics[1]?.statistics || [];
            
            html += '<div class="match-stats"><h4>📊 Statistics</h4><div class="stats-grid">';
            
            const keyStats = ['Ball Possession', 'Shots on Goal', 'Corner Kicks', 'Fouls', 'Yellow Cards', 'Red Cards'];
            
            keyStats.forEach(statName => {
                const homeStat = homeStats.find(s => s.type === statName);
                const awayStat = awayStats.find(s => s.type === statName);
                
                if (homeStat || awayStat) {
                    html += `
                        <div class="stat-item">
                            <div class="stat-label">${statName}</div>
                            <div class="stat-value">${homeStat?.value || 0} - ${awayStat?.value || 0}</div>
                        </div>
                    `;
                }
            });
            
            html += '</div></div>';
        }
        
        if (match.events && match.events.length > 0) {
            const cards = match.events.filter(e => e.type === 'Card');
            if (cards.length > 0) {
                html += '<div class="cards"><h4>🃏 Cards</h4>';
                cards.forEach(card => {
                    const cardClass = card.detail === 'Yellow Card' ? 'yellow-card' : 'red-card';
                    html += `<span class="${cardClass}">${card.detail === 'Yellow Card' ? '🟨' : '🟥'} ${card.player.name} (${card.time.elapsed}')</span>`;
                });
                html += '</div>';
            }
        }
        
        html += '</div>';
    });
    
    document.getElementById('historyList').innerHTML = html;
    document.getElementById('upcomingMatches').style.display = 'none';
    document.getElementById('matchHistory').style.display = 'block';
}

function showUpcoming() {
    document.getElementById('upcomingMatches').style.display = 'block';
    document.getElementById('matchHistory').style.display = 'none';
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(msg) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = '❌ ' + msg;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}