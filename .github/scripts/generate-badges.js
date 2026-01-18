const axios = require('axios');
const fs = require('fs');

const username = 'aaravmaloo';
const token = process.env.GH_TOKEN;
const headers = { Authorization: `token ${token}` };

(async () => {
  try {
    // Get user repos
    const reposRes = await axios.get(`https://api.github.com/user/repos?per_page=100`, { headers });
    const repos = reposRes.data;

    let totalStars = 0;
    let totalCommits = 0;
    let totalRepos = repos.length;

    for (const repo of repos) {
      totalStars += repo.stargazers_count;

      // Get commits count for default branch
      if (repo.default_branch) {
        const commitsRes = await axios.get(
          `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=1&sha=${repo.default_branch}`,
          { headers }
        );
        const linkHeader = commitsRes.headers.link;
        if (linkHeader) {
          // Parse last page from Link header
          const match = linkHeader.match(/&page=(\d+)>; rel="last"/);
          if (match) totalCommits += parseInt(match[1], 10);
        } else {
          totalCommits += commitsRes.data.length;
        }
      }
    }

    // Generate badge SVGs
    const badgeTemplate = (label, value, color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="120" height="20" fill="#555"/>
  <rect rx="3" x="60" width="60" height="20" fill="${color}"/>
  <path fill="${color}" d="M60 0h4v20h-4z"/>
  <rect rx="3" width="120" height="20" fill="url(#b)"/>
  <g fill="#fff" text-anchor="middle" font-family="Verdana" font-size="11">
    <text x="30" y="14">${label}</text>
    <text x="90" y="14">${value}</text>
  </g>
</svg>`;

    if (!fs.existsSync('badges')) fs.mkdirSync('badges');
    fs.writeFileSync('badges/commits.svg', badgeTemplate('Commits', totalCommits, '#4c1'));
    fs.writeFileSync('badges/stars.svg', badgeTemplate('Stars', totalStars, '#007ec6'));
    fs.writeFileSync('badges/repos.svg', badgeTemplate('Repos', totalRepos, '#ff8000'));

    console.log('Badges updated!');
  } catch (err) {
    console.error(err);
  }
})();
