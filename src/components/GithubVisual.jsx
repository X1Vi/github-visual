import React, { useState, useEffect } from 'react';
import MonthYearPicker from './MonthYearPicker';
import { COLORS } from '../theme/theme';

const GithubVisual = () => {
    const [token, setToken] = useState(localStorage.getItem("token") || '');
    const [username, setUsername] = useState(localStorage.getItem("username") || '');
    const [data, setData] = useState(JSON.parse(localStorage.getItem("data")) || null);
    const [selectedRepo, setSelectedRepo] = useState(localStorage.getItem("selectedRepo") || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fetchCount, setFetchCount] = useState(parseInt(localStorage.getItem("fetchCount")) || 30);
    const [fetchAll, setFetchAll] = useState(localStorage.getItem("fetchAll") === 'true');
    const [currentDate, setCurrentDate] = useState(() => {
        const storedDate = localStorage.getItem("currentDate");
        const parsedDate = storedDate ? new Date(storedDate) : null;
        return parsedDate && !isNaN(parsedDate) ? parsedDate : new Date();
    });
    const [dateSubtractCommit, setDateSubtractCommitDate] = useState(localStorage.getItem("dateSubtractCommit") || 7);
    const [selectedDateCommits, setSelectedDateCommits] = useState(JSON.parse(localStorage.getItem("selectedDateCommits")) || []);

    // All useEffect hooks remain unchanged
    useEffect(() => {
        if (data === null) return;
        let { commits } = data;
        if (Array.isArray(commits) && commits.length > 200) return;
        localStorage.setItem("data", JSON.stringify(data));
    }, [data]);

    useEffect(() => { localStorage.setItem("selectedRepo", selectedRepo); }, [selectedRepo]);
    useEffect(() => { localStorage.setItem("fetchCount", fetchCount); }, [fetchCount]);
    useEffect(() => { localStorage.setItem("fetchAll", fetchAll); }, [fetchAll]);
    useEffect(() => { localStorage.setItem("currentDate", currentDate.toISOString()); }, [currentDate]);
    useEffect(() => { localStorage.setItem("selectedDateCommits", JSON.stringify(selectedDateCommits)); }, [selectedDateCommits]);
    useEffect(() => { localStorage.setItem("token", token); }, [token]);
    useEffect(() => { localStorage.setItem("username", username); }, [username]);
    useEffect(() => { localStorage.setItem("dateSubtractCommit", dateSubtractCommit); }, [dateSubtractCommit]);

    // All fetch functions remain unchanged
    const fetchRepos = async () => {
        setLoading(true);
        setError('');
        try {
            if (fetchAll) {
                let allRepos = [];
                let page = 1;
                let hasMorePages = true;
                while (hasMorePages) {
                    const response = await fetch(`https://api.github.com/users/${username}/repos?page=${page}&per_page=100`, {
                        headers: { 'Authorization': `token ${token}` }
                    });
                    if (!response.ok) throw new Error(`Failed to fetch repositories: ${response.statusText}`);
                    const repos = await response.json();
                    allRepos = [...allRepos, ...repos];
                    hasMorePages = repos.length === 100;
                    page++;
                }
                setData({ repos: allRepos });
            } else {
                const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=${fetchCount}`, {
                    headers: { 'Authorization': `token ${token}` }
                });
                if (!response.ok) throw new Error(`Failed to fetch repositories: ${response.statusText}`);
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

    const _fetchCodeFromCommitHash = (owner, repo, commitSha, token) => {
        const url = `https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`;
        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => console.log(data))
            .catch(error => console.error('There was a problem with the fetch operation:', error));
    };

    const fetchRepoDetails = async () => {
        if (!selectedRepo) return;
        setLoading(true);
        setError('');
        try {
            const repo = data.repos.find(r => r.name === selectedRepo);
            if (!repo) throw new Error('Repository not found');
            const commits = await fetchRecentCommits();
            const contributorsResponse = await fetch(`https://api.github.com/repos/${username}/${selectedRepo}/contributors`, {
                headers: { 'Authorization': `token ${token}` }
            });
            let contributors = [];
            if (contributorsResponse.ok) contributors = await contributorsResponse.json();
            setData(prev => ({ ...prev, repoDetails: repo, commits, contributors }));
            updateSelectedDateCommits(currentDate, commits);
        } catch (error) {
            console.error('Error fetching repo details:', error);
            setError(`Error: ${error.message || 'Unknown error occurred'}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentCommits = async () => {
        let allCommits = [];
        let page = 1;
        let hasMore = true;
        const sinceDate = new Date();
        sinceDate.setMonth(sinceDate.getMonth() - dateSubtractCommit);
        const sinceISO = sinceDate.toISOString();
        try {
            while (hasMore) {
                const commitsResponse = await fetch(
                    `https://api.github.com/repos/${username}/${selectedRepo}/commits?per_page=100&page=${page}&since=${sinceISO}`,
                    { headers: { 'Authorization': `token ${token}` } }
                );
                if (!commitsResponse.ok) throw new Error(`Failed to fetch commits: ${commitsResponse.statusText}`);
                const commits = await commitsResponse.json();
                allCommits = [...allCommits, ...commits];
                const linkHeader = commitsResponse.headers.get('Link');
                hasMore = linkHeader && linkHeader.includes('rel="next"');
                page++;
            }
            return allCommits;
        } catch (error) {
            console.error('Error fetching recent commits:', error);
            throw error;
        }
    };

    const fetchAllCommits = async () => {
        let allCommits = [];
        let page = 1;
        let hasMore = true;
        try {
            while (hasMore) {
                const commitsResponse = await fetch(`https://api.github.com/repos/${username}/${selectedRepo}/commits?per_page=100&page=${page}`, {
                    headers: { 'Authorization': `token ${token}` }
                });
                if (!commitsResponse.ok) throw new Error(`Failed to fetch commits: ${commitsResponse.statusText}`);
                const commits = await commitsResponse.json();
                allCommits = [...allCommits, ...commits];
                const linkHeader = commitsResponse.headers.get('Link');
                hasMore = linkHeader && linkHeader.includes('rel="next"');
                page++;
            }
            return allCommits;
        } catch (error) {
            console.error('Error fetching all commits:', error);
            throw error;
        }
    };

    const updateSelectedDateCommits = (date, commitsList) => {
        if (!commitsList) return;
        const dateStr = date.toISOString().split('T')[0];
        const commitsForDate = commitsList.filter(commit => {
            const commitDate = new Date(commit.commit.author.date).toISOString().split('T')[0];
            return commitDate === dateStr;
        });
        setSelectedDateCommits(commitsForDate);
    };

    const handleDateSelect = (date) => {
        setCurrentDate(date);
        if (data?.commits) updateSelectedDateCommits(date, data.commits);
    };

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

    const renderContributionCalendar = () => {
        if (!data?.commits || data.commits.length === 0) return null;
        const commitsByDate = {};
        data.commits.forEach(commit => {
            const date = new Date(commit.commit.author.date).toISOString().split('T')[0];
            commitsByDate[date] = (commitsByDate[date] || 0) + 1;
        });
        const days = [];
        const today = new Date();
        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const commitCount = commitsByDate[dateString] || 0;
            days.push({ date: dateString, count: commitCount });
        }
        const weeks = [];
        for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
        const getColor = (count) => {
            if (count === 0) return COLORS.contrib0;
            if (count < 3) return COLORS.contrib1;
            if (count < 5) return COLORS.contrib2;
            if (count < 8) return COLORS.contrib3;
            return COLORS.contrib4;
        };

        return (
            <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: COLORS.linkText }}>Commit Activity</h3>
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
                    color: COLORS.secondaryText,
                    fontSize: '12px'
                }}>
                    <span>Less</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: COLORS.contrib0 }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: COLORS.contrib1 }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: COLORS.contrib2 }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: COLORS.contrib3 }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: COLORS.contrib4 }} />
                    </div>
                    <span>More</span>
                </div>
            </div>
        );
    };

    const renderMonthlyCalendar = () => {
        if (!data?.commits) return null;
        const commitsByDate = {};
        data.commits.forEach(commit => {
            const date = new Date(commit.commit.author.date);
            const dateStr = date.toISOString().split('T')[0];
            commitsByDate[dateStr] = (commitsByDate[dateStr] || 0) + 1;
        });
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const navigateMonth = (increment) => {
            const newDate = new Date(currentDate);
            newDate.setMonth(newDate.getMonth() + increment);
            setCurrentDate(newDate);
        };
        const getCalendarColor = (count) => {
            if (count === 0) return { bg: COLORS.calDay0Bg, text: COLORS.primaryText };
            if (count < 3) return { bg: COLORS.calDay1Bg, text: COLORS.white };
            if (count < 5) return { bg: COLORS.calDay2Bg, text: COLORS.white };
            if (count < 8) return { bg: COLORS.calDay3Bg, text: COLORS.white };
            return { bg: COLORS.calDay4Bg, text: COLORS.black };
        };
        const calendarDays = [];
        let dayCount = 1;
        for (let i = 0; i < 6; i++) {
            const week = [];
            for (let j = 0; j < 7; j++) {
                if ((i === 0 && j < firstDay) || dayCount > daysInMonth) {
                    week.push(null);
                } else {
                    const dateObj = new Date(year, month, dayCount + 1);
                    const dateStr = dateObj.toISOString().split('T')[0];
                    const commitCount = commitsByDate[dateStr] || 0;
                    const isSelected = dateStr === currentDate.toISOString().split('T')[0];
                    week.push({ day: dayCount, commitCount, dateObj, dateStr, isSelected });
                    dayCount++;
                }
            }
            calendarDays.push(week);
            if (dayCount > daysInMonth) break;
        }

        return (
            <div style={{ marginTop: '30px' }}>
                <h3 style={{ color: COLORS.linkText }}>Commit Calendar</h3>
                <div style={{ justifyContent: 'center', alignContent: 'center', alignItems: "center", display: 'flex' }}>
                    <MonthYearPicker onDateChange={(newDate) => setCurrentDate(newDate)} />
                </div>
                <div style={{
                    background: COLORS.secondaryBg,
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border}`,
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
                                background: COLORS.buttonBgSecondary,
                                color: COLORS.primaryText,
                                border: `1px solid ${COLORS.buttonBorder}`,
                                borderRadius: '6px',
                                padding: '5px 10px',
                                cursor: 'pointer'
                            }}
                        >
                            ◀ Prev
                        </button>
                        <h3 style={{ margin: 0, color: COLORS.primaryText }}>
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                            onClick={() => navigateMonth(1)}
                            style={{
                                background: COLORS.buttonBgSecondary,
                                color: COLORS.primaryText,
                                border: `1px solid ${COLORS.buttonBorder}`,
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
                                        color: COLORS.secondaryText
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
                                                background: day.isSelected ? COLORS.calDaySelected : getCalendarColor(day.commitCount).bg,
                                                color: day.isSelected ? COLORS.white : getCalendarColor(day.commitCount).text,
                                                border: `1px solid ${COLORS.border}`,
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
            backgroundColor: COLORS.primaryBg,
            color: COLORS.primaryText,
            fontFamily: 'monospace',
            padding: '20px',
            borderRadius: '8px',
            margin: '0 auto',
            height: '100vh'
        }}>
            <h1 style={{ color: COLORS.linkText }}>GitHub Repository Explorer</h1>
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
                        background: COLORS.secondaryBg,
                        color: COLORS.primaryText,
                        border: `1px solid ${COLORS.border}`,
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
                        background: COLORS.secondaryBg,
                        color: COLORS.primaryText,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '6px',
                        width: '100%'
                    }}
                />
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ marginRight: '20px' }}>
                        <input
                            type="checkbox"
                            id="fetchAll"
                            checked={fetchAll}
                            onChange={(e) => setFetchAll(e.target.checked)}
                            style={{ marginRight: '5px' }}
                        />
                        <label htmlFor="fetchAll" style={{ color: COLORS.primaryText }}>Fetch all repositories</label>
                    </div>
                    <div>
                        <label htmlFor="floatInput" style={{ marginRight: '5px', color: COLORS.primaryText }}>Timeline of commits (months) ? </label>
                        <input
                            type="number"
                            id="floatInput"
                            step="0.5"
                            value={dateSubtractCommit}
                            onChange={(e) => {
                                const inputFloat = parseFloat(e.target.value);
                                if (!isNaN(inputFloat)) setDateSubtractCommitDate(inputFloat);
                            }}
                            style={{
                                width: '100px',
                                padding: '4px',
                                background: COLORS.secondaryBg,
                                color: COLORS.primaryText,
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: '6px'
                            }}
                        />
                    </div>
                    {!fetchAll && (
                        <div>
                            <label htmlFor="fetchCount" style={{ marginRight: '5px', color: COLORS.primaryText }}>Fetch count:</label>
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
                                    background: COLORS.secondaryBg,
                                    color: COLORS.primaryText,
                                    border: `1px solid ${COLORS.border}`,
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
                        background: COLORS.buttonBg,
                        color: COLORS.white,
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
                    background: COLORS.errorBg,
                    color: COLORS.errorText,
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.errorText}`
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}
            {data?.repos && (
                <div style={{ marginTop: '20px' }}>
                    <h2 style={{ color: COLORS.linkText }}>Repositories ({data.repos.length})</h2>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                        <select
                            onChange={(e) => setSelectedRepo(e.target.value)}
                            value={selectedRepo}
                            style={{
                                flex: '1',
                                background: COLORS.secondaryBg,
                                color: COLORS.primaryText,
                                border: `1px solid ${COLORS.border}`,
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
                                background: COLORS.buttonHoverBg,
                                color: COLORS.white,
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
                <div style={{ marginTop: '20px', padding: '15px', background: COLORS.secondaryBg, borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
                    <h2 style={{ color: COLORS.linkText }}>
                        <a href={data.repoDetails.html_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                            {data.repoDetails.full_name}
                        </a>
                    </h2>
                    <p style={{ color: COLORS.secondaryText }}>{data.repoDetails.description || 'No description'}</p>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <span>⭐ {data.repoDetails.stargazers_count}</span>
                        <span>🍴 {data.repoDetails.forks_count}</span>
                        <span>👁️ {data.repoDetails.watchers_count}</span>
                        <span>📅 Updated: {formatDate(data.repoDetails.updated_at)}</span>
                    </div>
                </div>
            )}
            {data?.commits && renderContributionCalendar()}
            {data?.commits && renderMonthlyCalendar()}
            {selectedDateCommits.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3 style={{ color: COLORS.linkText }}>
                        Commits on {currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        ({selectedDateCommits.length})
                    </h3>
                    <div style={{ background: COLORS.secondaryBg, borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
                        {selectedDateCommits.map((commit) => (
                            <div key={commit.sha} style={{ padding: '10px', borderBottom: `1px solid ${COLORS.border}` }}>
                                <div style={{ fontWeight: 'bold', color: COLORS.primaryText }}>
                                    {commit.commit.message.split('\n')[0]}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px', fontSize: '14px', color: COLORS.secondaryText }}>
                                    {commit.author?.avatar_url && (
                                        <img src={commit.author.avatar_url} alt="author" style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '8px' }} />
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
                            <div style={{ padding: '15px', textAlign: 'center', color: COLORS.secondaryText }}>
                                No commits on this date
                            </div>
                        )}
                    </div>
                </div>
            )}
            {data?.commits && (
                <div style={{ marginTop: '20px' }}>
                    <h3 style={{ color: COLORS.linkText }}>Recent Commits</h3>
                    <div style={{ background: COLORS.secondaryBg, borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
                        {data.commits.slice(0, 10).map((commit) => (
                            <div key={commit.sha} style={{ padding: '10px', borderBottom: `1px solid ${COLORS.border}` }}>
                                <div style={{ fontWeight: 'bold', color: COLORS.primaryText }}>
                                    {commit.commit.message.split('\n')[0]}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px', fontSize: '14px', color: COLORS.secondaryText }}>
                                    {commit.author?.avatar_url && (
                                        <img src={commit.author.avatar_url} alt="author" style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '8px' }} />
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
                    <h3 style={{ color: COLORS.linkText }}>Top Contributors</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {data.contributors.map(contributor => (
                            <div key={contributor.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: COLORS.secondaryBg,
                                padding: '8px',
                                borderRadius: '6px',
                                border: `1px solid ${COLORS.border}`
                            }}>
                                <img src={contributor.avatar_url} alt={contributor.login} style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }} />
                                <div>
                                    <div style={{ color: COLORS.primaryText }}>{contributor.login}</div>
                                    <div style={{ fontSize: '12px', color: COLORS.secondaryText }}>{contributor.contributions} commits</div>
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