import React, { useState, useEffect, use } from 'react';

const GithubVisual = () => {
    const [token, setToken] = useState(localStorage.getItem("token") || '');
    const [username, setUsername] = useState(localStorage.getItem("username") || '');
    const [data, setData] = useState(null);
    const [selectedRepo, setSelectedRepo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fetchCount, setFetchCount] = useState(30); // Default to fetching 30 repositories
    const [fetchAll, setFetchAll] = useState(false); // Option to fetch all repositories
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateCommits, setSelectedDateCommits] = useState([]);

    useEffect(() => {
        localStorage.setItem("token", token);
    }, [token])

    useEffect(() => {
        localStorage.setItem("username", username);
    }, [username])
    // Fetch repositories from GitHub API
    const fetchRepos = async () => {
        setLoading(true);
        setError('');
        try {
            // If fetchAll is true, we'll need to handle pagination
            if (fetchAll) {
                let allRepos = [];
                let page = 1;
                let hasMorePages = true;

                while (hasMorePages) {
                    const response = await fetch(`https://api.github.com/users/${username}/repos?page=${page}&per_page=100`, {
                        headers: {
                            'Authorization': `token ${token}`,
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to fetch repositories: ${response.statusText}`);
                    }

                    const repos = await response.json();
                    allRepos = [...allRepos, ...repos];

                    // Check if we have more pages
                    hasMorePages = repos.length === 100;
                    page++;
                }

                setData({ repos: allRepos });
            } else {
                // Fetch limited number of repositories
                const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=${fetchCount}`, {
                    headers: {
                        'Authorization': `token ${token}`,
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch repositories: ${response.statusText}`);
                }

                const repos = await response.json();
                setData({ repos });
            }
        } catch (error) {
            console.error('Error fetching repositories:', error);
            setError(`Error: ${error.message || 'Unknown error occurred'}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchCodeFromCommitHash = (owner , repo, commitSha) => {

        const url = `https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`;

        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer YOUR_GITHUB_TOKEN` // replace with your GitHub token
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    }

    // Fetch details for a selected repository
    const fetchRepoDetails = async () => {
        if (!selectedRepo) return;

        setLoading(true);
        setError('');

        try {
            // Find the selected repo
            const repo = data.repos.find(r => r.name === selectedRepo);
            if (!repo) throw new Error('Repository not found');

            // Fetch commits
            const commitsResponse = await fetch(`https://api.github.com/repos/${username}/${selectedRepo}/commits?per_page=100`, {
                headers: {
                    'Authorization': `token ${token}`,
                }
            });

            if (!commitsResponse.ok) {
                throw new Error(`Failed to fetch commits: ${commitsResponse.statusText}`);
            }

            const commits = await commitsResponse.json();

            // Fetch contributors
            const contributorsResponse = await fetch(`https://api.github.com/repos/${username}/${selectedRepo}/contributors`, {
                headers: {
                    'Authorization': `token ${token}`,
                }
            });

            let contributors = [];
            if (contributorsResponse.ok) {
                contributors = await contributorsResponse.json();
            }

            setData(prev => ({
                ...prev,
                repoDetails: repo,
                commits,
                contributors
            }));

            // Initialize with commits for the current date
            updateSelectedDateCommits(currentDate, commits);

        } catch (error) {
            console.error('Error fetching repo details:', error);
            setError(`Error: ${error.message || 'Unknown error occurred'}`);
        } finally {
            setLoading(false);
        }
    };

    // Update commits for a selected date
    const updateSelectedDateCommits = (date, commitsList) => {
        if (!commitsList) return;

        const dateStr = date.toISOString().split('T')[0];
        const commitsForDate = commitsList.filter(commit => {
            const commitDate = new Date(commit.commit.author.date).toISOString().split('T')[0];
            return commitDate === dateStr;
        });

        setSelectedDateCommits(commitsForDate);
    };

    // Handle date selection in calendar
    const handleDateSelect = (date) => {
        setCurrentDate(date);
        if (data?.commits) {
            updateSelectedDateCommits(date, data.commits);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Render GitHub-style contribution calendar
    const renderContributionCalendar = () => {
        if (!data?.commits || data.commits.length === 0) return null;

        // Group commits by date
        const commitsByDate = {};
        data.commits.forEach(commit => {
            const date = new Date(commit.commit.author.date).toISOString().split('T')[0];
            commitsByDate[date] = (commitsByDate[date] || 0) + 1;
        });

        // Generate last 365 days of data
        const days = [];
        const today = new Date();
        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const commitCount = commitsByDate[dateString] || 0;
            days.push({ date: dateString, count: commitCount });
        }

        // Group by weeks (7 days)
        const weeks = [];
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }

        // Get color based on commit count (GitHub-style)
        const getColor = (count) => {
            if (count === 0) return '#ebedf0';
            if (count < 3) return '#9be9a8';
            if (count < 5) return '#40c463';
            if (count < 8) return '#30a14e';
            return '#216e39';
        };

        return (
            <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#58a6ff' }}>Commit Activity</h3>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '3px',
                    overflowX: 'auto',
                    padding: '10px 0'
                }}>
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {week.map((day, dayIndex) => (
                                <div
                                    key={dayIndex}
                                    title={`${day.date}: ${day.count} commit${day.count !== 1 ? 's' : ''}`}
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '2px',
                                        backgroundColor: getColor(day.count),
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        const dateObj = new Date(day.date);
                                        handleDateSelect(dateObj);
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '10px',
                    color: '#8b949e',
                    fontSize: '12px'
                }}>
                    <span>Less</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#ebedf0' }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#9be9a8' }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#40c463' }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#30a14e' }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#216e39' }} />
                    </div>
                    <span>More</span>
                </div>
            </div>
        );
    };

    // Render a monthly calendar component for commits
    const renderMonthlyCalendar = () => {
        if (!data?.commits) return null;

        // Group commits by date
        const commitsByDate = {};
        data.commits.forEach(commit => {
            const date = new Date(commit.commit.author.date).toISOString().split('T')[0];
            commitsByDate[date] = (commitsByDate[date] || 0) + 1;
        });

        // Get current month and year
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Calculate first day of month and number of days in month
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Days of the week
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Previous/Next month navigation
        const navigateMonth = (increment) => {
            const newDate = new Date(currentDate);
            newDate.setMonth(newDate.getMonth() + increment);
            setCurrentDate(newDate);
        };

        // Get color based on commit count for calendar
        const getCalendarColor = (count) => {
            if (count === 0) return { bg: '#161b22', text: '#c9d1d9' };
            if (count < 3) return { bg: '#0e4429', text: '#ffffff' };
            if (count < 5) return { bg: '#006d32', text: '#ffffff' };
            if (count < 8) return { bg: '#26a641', text: '#ffffff' };
            return { bg: '#39d353', text: '#000000' };
        };

        // Build calendar days
        const calendarDays = [];
        let dayCount = 1;

        // Build rows for the calendar
        for (let i = 0; i < 6; i++) {
            const week = [];
            for (let j = 0; j < 7; j++) {
                if ((i === 0 && j < firstDay) || dayCount > daysInMonth) {
                    week.push(null); // Empty cell
                } else {
                    const dateObj = new Date(year, month, dayCount);
                    const dateStr = dateObj.toISOString().split('T')[0];
                    const commitCount = commitsByDate[dateStr] || 0;
                    const isSelected = dayCount === currentDate.getDate();

                    week.push({
                        day: dayCount,
                        commitCount,
                        dateObj,
                        dateStr,
                        isSelected
                    });

                    dayCount++;
                }
            }
            calendarDays.push(week);
            if (dayCount > daysInMonth) break;
        }

        return (
            <div style={{ marginTop: '30px' }}>
                <h3 style={{ color: '#58a6ff' }}>Commit Calendar</h3>
                <div style={{
                    background: '#161b22',
                    borderRadius: '6px',
                    border: '1px solid #30363d',
                    padding: '15px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px'
                    }}>
                        <button
                            onClick={() => navigateMonth(-1)}
                            style={{
                                background: '#21262d',
                                color: '#c9d1d9',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                cursor: 'pointer'
                            }}
                        >
                            ◀ Prev
                        </button>
                        <h3 style={{ margin: 0 }}>
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                            onClick={() => navigateMonth(1)}
                            style={{
                                background: '#21262d',
                                color: '#c9d1d9',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                cursor: 'pointer'
                            }}
                        >
                            Next ▶
                        </button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {weekdays.map(day => (
                                    <th key={day} style={{
                                        padding: '8px',
                                        textAlign: 'center',
                                        color: '#8b949e'
                                    }}>
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {calendarDays.map((week, i) => (
                                <tr key={i}>
                                    {week.map((day, j) => day ? (
                                        <td
                                            key={j}
                                            onClick={() => handleDateSelect(day.dateObj)}
                                            style={{
                                                padding: '8px',
                                                textAlign: 'center',
                                                background: day.isSelected ? '#1f6feb' : getCalendarColor(day.commitCount).bg,
                                                color: day.isSelected ? '#ffffff' : getCalendarColor(day.commitCount).text,
                                                border: '1px solid #30363d',
                                                cursor: 'pointer',
                                                position: 'relative'
                                            }}
                                        >
                                            <div>{day.day}</div>
                                            {day.commitCount > 0 && (
                                                <div style={{
                                                    fontSize: '10px',
                                                    position: 'absolute',
                                                    bottom: '2px',
                                                    right: '4px'
                                                }}>
                                                    {day.commitCount}
                                                </div>
                                            )}
                                        </td>
                                    ) : (
                                        <td key={j} style={{ padding: '8px' }}></td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div style={{
            backgroundColor: '#0d1117',
            color: '#c9d1d9',
            fontFamily: 'monospace',
            padding: '20px',
            borderRadius: '8px',
            margin: '0 auto',
            height: '100vh'
        }}>
            <h1 style={{ color: '#58a6ff' }}>GitHub Repository Explorer</h1>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="password"
                    placeholder="GitHub Token (required)"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    style={{
                        display: 'block',
                        margin: '10px 0',
                        padding: '8px',
                        background: '#161b22',
                        color: '#c9d1d9',
                        border: '1px solid #30363d',
                        borderRadius: '6px',
                        width: '100%'
                    }}
                />
                <input
                    type="text"
                    placeholder="GitHub Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                        display: 'block',
                        margin: '10px 0',
                        padding: '8px',
                        background: '#161b22',
                        color: '#c9d1d9',
                        border: '1px solid #30363d',
                        borderRadius: '6px',
                        width: '100%'
                    }}
                />

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '10px'
                }}>
                    <div style={{ marginRight: '20px' }}>
                        <input
                            type="checkbox"
                            id="fetchAll"
                            checked={fetchAll}
                            onChange={(e) => setFetchAll(e.target.checked)}
                            style={{ marginRight: '5px' }}
                        />
                        <label htmlFor="fetchAll">Fetch all repositories</label>
                    </div>

                    {!fetchAll && (
                        <div>
                            <label htmlFor="fetchCount" style={{ marginRight: '5px' }}>Fetch count:</label>
                            <input
                                type="number"
                                id="fetchCount"
                                min="1"
                                max="100"
                                value={fetchCount}
                                onChange={(e) => setFetchCount(parseInt(e.target.value) || 30)}
                                style={{
                                    width: '60px',
                                    padding: '4px',
                                    background: '#161b22',
                                    color: '#c9d1d9',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px'
                                }}
                            />
                        </div>
                    )}
                </div>

                <button
                    onClick={fetchRepos}
                    disabled={loading || !token || !username}
                    style={{
                        background: '#238636',
                        color: '#ffffff',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading || !token || !username ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        opacity: loading || !token || !username ? 0.7 : 1
                    }}
                >
                    {loading ? 'Loading...' : fetchAll ? 'Fetch All Repositories' : `Fetch ${fetchCount} Repositories`}
                </button>
            </div>

            {error && (
                <div style={{
                    margin: '15px 0',
                    padding: '10px',
                    background: '#3d1d24',
                    color: '#f85149',
                    borderRadius: '6px',
                    border: '1px solid #f85149'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {data?.repos && (
                <div style={{ marginTop: '20px' }}>
                    <h2 style={{ color: '#58a6ff' }}>Repositories ({data.repos.length})</h2>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                        <select
                            onChange={(e) => setSelectedRepo(e.target.value)}
                            value={selectedRepo}
                            style={{
                                flex: '1',
                                background: '#161b22',
                                color: '#c9d1d9',
                                border: '1px solid #30363d',
                                padding: '8px',
                                borderRadius: '6px'
                            }}
                        >
                            <option value="">-- Select a Repository --</option>
                            {data.repos.map((repo) => (
                                <option key={repo.id} value={repo.name}>
                                    {repo.name} ({repo.stargazers_count} ⭐)
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={fetchRepoDetails}
                            disabled={!selectedRepo || loading}
                            style={{
                                background: '#1f6feb',
                                color: '#ffffff',
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: !selectedRepo || loading ? 'not-allowed' : 'pointer',
                                marginLeft: '10px',
                                fontWeight: 'bold',
                                opacity: !selectedRepo || loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Loading...' : 'View Details'}
                        </button>
                    </div>
                </div>
            )}

            {data?.repoDetails && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#161b22', borderRadius: '6px', border: '1px solid #30363d' }}>
                    <h2 style={{ color: '#58a6ff' }}>
                        <a
                            href={data.repoDetails.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                            {data.repoDetails.full_name}
                        </a>
                    </h2>
                    <p style={{ color: '#8b949e' }}>{data.repoDetails.description || 'No description'}</p>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <span>⭐ {data.repoDetails.stargazers_count}</span>
                        <span>🍴 {data.repoDetails.forks_count}</span>
                        <span>👁️ {data.repoDetails.watchers_count}</span>
                        <span>📅 Updated: {formatDate(data.repoDetails.updated_at)}</span>
                    </div>
                </div>
            )}

            {/* Contribution heatmap */}
            {data?.commits && renderContributionCalendar()}

            {/* Monthly calendar */}
            {data?.commits && renderMonthlyCalendar()}

            {/* Selected date commits */}
            {selectedDateCommits.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3 style={{ color: '#58a6ff' }}>
                        Commits on {currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        ({selectedDateCommits.length})
                    </h3>
                    <div style={{ background: '#161b22', borderRadius: '6px', border: '1px solid #30363d' }}>
                        {selectedDateCommits.map((commit) => (
                            <div key={commit.sha} style={{ padding: '10px', borderBottom: '1px solid #30363d' }}>
                                <div style={{ fontWeight: 'bold' }}>
                                    {commit.commit.message.split('\n')[0]}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px', fontSize: '14px', color: '#8b949e' }}>
                                    {commit.author?.avatar_url && (
                                        <img
                                            src={commit.author.avatar_url}
                                            alt="author"
                                            style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '8px' }}
                                        />
                                    )}
                                    <span>{commit.commit.author.name}</span>
                                    <span style={{ margin: '0 8px' }}>•</span>
                                    <span>{formatDate(commit.commit.author.date)}</span>
                                    <span style={{ margin: '0 8px' }}>•</span>
                                    <span style={{ fontFamily: 'monospace' }}>{commit.sha.substring(0, 7)}</span>
                                </div>
                            </div>
                        ))}
                        {selectedDateCommits.length === 0 && (
                            <div style={{ padding: '15px', textAlign: 'center', color: '#8b949e' }}>
                                No commits on this date
                            </div>
                        )}
                    </div>
                </div>
            )}

            {data?.commits && (
                <div style={{ marginTop: '20px' }}>
                    <h3 style={{ color: '#58a6ff' }}>Recent Commits</h3>
                    <div style={{ background: '#161b22', borderRadius: '6px', border: '1px solid #30363d' }}>
                        {data.commits.slice(0, 10).map((commit) => (
                            <div key={commit.sha} style={{ padding: '10px', borderBottom: '1px solid #30363d' }}>
                                <div style={{ fontWeight: 'bold' }}>
                                    {commit.commit.message.split('\n')[0]}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px', fontSize: '14px', color: '#8b949e' }}>
                                    {commit.author?.avatar_url && (
                                        <img
                                            src={commit.author.avatar_url}
                                            alt="author"
                                            style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '8px' }}
                                        />
                                    )}
                                    <span>{commit.commit.author.name}</span>
                                    <span style={{ margin: '0 8px' }}>•</span>
                                    <span>{formatDate(commit.commit.author.date)}</span>
                                    <span style={{ margin: '0 8px' }}>•</span>
                                    <span style={{ fontFamily: 'monospace' }}>{commit.sha.substring(0, 7)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data?.contributors && data.contributors.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3 style={{ color: '#58a6ff' }}>Top Contributors</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {data.contributors.map(contributor => (
                            <div key={contributor.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: '#161b22',
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid #30363d'
                            }}>
                                <img
                                    src={contributor.avatar_url}
                                    alt={contributor.login}
                                    style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }}
                                />
                                <div>
                                    <div>{contributor.login}</div>
                                    <div style={{ fontSize: '12px', color: '#8b949e' }}>{contributor.contributions} commits</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GithubVisual;