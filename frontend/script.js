// File: script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- KHAI BÁO BIẾN TRẠNG THÁI VÀ HẰNG SỐ ---
    const API_URL = 'https://football-manager-app.onrender.com/api'; // Địa chỉ backend của bạn

    let token = null;
    let seasons = [];
    let currentSeasonId = null;
    let playersData = [];
    let currentSort = { column: 'ca', order: 'desc' };

    // --- LẤY CÁC PHẦN TỬ GIAO DIỆN ---
    const loginView = document.getElementById('loginView');
    const appView = document.getElementById('appView');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const seasonSelector = document.getElementById('seasonSelector');
    const createSeasonBtn = document.getElementById('createSeasonBtn');
    const uploadArea = document.getElementById('uploadArea');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const playerTable = document.getElementById('playerTable');
    const squadTitle = document.getElementById('squadTitle');
    const userInfoDiv = document.getElementById('userInfo');
    const filterInput = document.getElementById('filterInput');
    const deleteSquadBtn = document.getElementById('deleteSquadBtn');
    // Các biến mới cho tính năng story/forum
    const mySquadTab = document.getElementById('mySquadTab');
    const forumTab = document.getElementById('forumTab');
    const squadViewContainer = document.getElementById('squadViewContainer');
    const forumView = document.getElementById('forumView');
    const storiesFeed = document.getElementById('storiesFeed');
    const storyContainer = document.getElementById('storyContainer');
    const storyHeader = document.getElementById('storyHeader');
    const storyDisplay = document.getElementById('storyDisplay');
    const storyEditor = document.getElementById('storyEditor');
    const storyTitleInput = document.getElementById('storyTitleInput');
    const storyContentTextarea = document.getElementById('storyContentTextarea');
    const saveStoryBtn = document.getElementById('saveStoryBtn');

    // --- HÀM GỌI API CHUNG ---
    const apiCall = async (endpoint, method = 'GET', body = null) => {
        const options = {
            method,
            headers: {}
        };
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        if (body) {
            if (body instanceof FormData) {
                options.body = body;
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
        }
        try {
            const response = await fetch(`${API_URL}${endpoint}`, options);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'API call failed');
            }
            if (response.status === 204 || response.headers.get("content-length") === "0") {
                return null;
            }
            return response.json();
        } catch (error) {
            alert(error.message);
            console.error('API Error:', error);
            if (error.message.includes('Authentication failed')) {
                handleLogout();
            }
            return null;
        }
    };

    // --- LOGIC XÁC THỰC ---
    const handleLogin = async (event) => {
        event.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const result = await apiCall('/auth/login', 'POST', { username, password });
        if (result && result.token) {
            token = result.token;
            localStorage.setItem('authToken', token);
            localStorage.setItem('username', username);
            initializeApp();
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const result = await apiCall('/auth/register', 'POST', { username, password });
        if (result) {
            alert(result.message + ". Please login now.");
            loginForm.reset();
            registerForm.reset();
        }
    };

    const handleLogout = () => {
        token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        showLoginView();
    };

    // --- LOGIC CHUYỂN TAB ---
    const showSquadView = () => {
        squadViewContainer.style.display = 'block';
        forumView.style.display = 'none';
        mySquadTab.classList.add('active');
        forumTab.classList.remove('active');
    };

    const showForumView = () => {
        squadViewContainer.style.display = 'none';
        forumView.style.display = 'block';
        mySquadTab.classList.remove('active');
        forumTab.classList.add('active');
        fetchPublicFeed();
    };

    // --- LOGIC MÙA GIẢI & ĐỘI HÌNH ---
    const fetchSeasons = async () => {
        seasons = await apiCall('/seasons');
        if (!seasons) return;

        renderSeasonSelector();
        if (seasons.length > 0) {
            currentSeasonId = seasons[0].id;
            seasonSelector.value = currentSeasonId;
            fetchSquadForSeason(currentSeasonId);
            uploadArea.style.display = 'block';
            storyContainer.style.display = 'block';
        } else {
            // Xử lý khi không có mùa giải nào
            uploadArea.style.display = 'block';
            storyContainer.style.display = 'none';
            playerTable.innerHTML = `<tr><td colspan="13" class="text-center">No seasons found. Please create a new season.</td></tr>`;
            squadTitle.innerText = 'CREATE A SEASON TO START';
        }
    };
    
    const handleCreateSeason = async () => {
        const seasonName = prompt("Enter new season name (e.g., 2024-2025):");
        if(seasonName) {
            const newSeason = await apiCall('/seasons', 'POST', { seasonName });
            if(newSeason) {
                await fetchSeasons();
                seasonSelector.value = newSeason.id;
                await fetchSquadForSeason(newSeason.id);
            }
        }
    };

    const fetchSquadForSeason = async (seasonId) => {
        if (!seasonId) {
            playerTable.innerHTML = `<tr><td colspan="13" class="text-center">Please select a season.</td></tr>`;
            squadTitle.innerText = 'SELECT A SEASON';
            storyContainer.style.display = 'none';
            return;
        };
        currentSeasonId = seasonId;
        const season = seasons.find(s => s.id == seasonId);
        squadTitle.innerText = season ? `SQUAD VIEW - ${season.seasonName}` : 'SQUAD VIEW';
        
        playersData = await apiCall(`/squads/${seasonId}`);
        renderTable(playersData || []);
        updateSidebar(playersData || []);
        await fetchStoryForSeason(seasonId);
    };

    const handleUpload = async () => {
        if (!fileInput.files[0]) {
            alert('Please select a file to upload.');
            return;
        }
        if (!currentSeasonId) {
            alert('Please create and select a season first.');
            return;
        }
        const formData = new FormData();
        formData.append('squadFile', fileInput.files[0]);

        uploadBtn.disabled = true;
        uploadBtn.innerText = 'Uploading...';
        const result = await apiCall(`/squads/upload/${currentSeasonId}`, 'POST', formData);
        if(result) {
            alert(result.message);
            fileInput.value = '';
            fetchSquadForSeason(currentSeasonId);
        }
        uploadBtn.disabled = false;
        uploadBtn.innerText = 'Upload';
    };

    const handleDeleteSquad = async () => {
        if (!currentSeasonId) {
            alert('Please select a season to delete.');
            return;
        }
        const season = seasons.find(s => s.id == currentSeasonId);
        const confirmation = confirm(`Are you sure you want to delete all squad data for season "${season.seasonName}"?\nThis action cannot be undone.`);

        if (confirmation) {
            const result = await apiCall(`/squads/${currentSeasonId}`, 'DELETE');
            if (result) {
                alert(result.message);
                fetchSquadForSeason(currentSeasonId);
            }
        }
    };

    // --- LOGIC STORY/FORUM ---
    const fetchStoryForSeason = async (seasonId) => {
        if (!seasonId) {
            storyContainer.style.display = 'none';
            return;
        }
        
        const season = seasons.find(s => s.id == seasonId);
        storyHeader.innerText = `My Story for ${season.seasonName}`;

        const story = await apiCall(`/stories/${seasonId}`);
        if(story) {
            storyTitleInput.value = story.title;
            storyContentTextarea.value = story.content;
            storyDisplay.innerHTML = `<h4>${story.title}</h4><p>${story.content}</p>`;
        } else {
            storyTitleInput.value = '';
            storyContentTextarea.value = '';
            storyDisplay.innerHTML = `<p class="text-muted">You haven't written a story for this season yet.</p>`;
        }
        storyContainer.style.display = 'block';
    };

    const handleSaveStory = async () => {
        const title = storyTitleInput.value;
        const content = storyContentTextarea.value;
        if (!currentSeasonId || !title || !content) {
            alert("Please select a season and provide both a title and content.");
            return;
        }
        saveStoryBtn.disabled = true;
        saveStoryBtn.innerText = 'Saving...';
        const result = await apiCall(`/stories/${currentSeasonId}`, 'POST', { title, content });
        if(result) {
            alert('Story saved!');
            storyDisplay.innerHTML = `<h4>${result.title}</h4><p>${result.content}</p>`;
        }
        saveStoryBtn.disabled = false;
        saveStoryBtn.innerText = 'Save Story';
    };

    const fetchPublicFeed = async () => {
        storiesFeed.innerHTML = '<p>Loading stories...</p>';
        const publicStories = await apiCall('/stories/public/feed');
        if (publicStories) {
            renderPublicFeed(publicStories);
        }
    };

    const renderPublicFeed = (stories) => {
        if (!stories || stories.length === 0) {
            storiesFeed.innerHTML = '<p>No career stories have been shared yet.</p>';
            return;
        }
        storiesFeed.innerHTML = stories.map(story => `
            <div class="story-card">
                <h3 class="story-title">${story.title}</h3>
                <p class="story-meta">
                    By <strong>${story.season.user.username}</strong> for season ${story.season.seasonName}
                </p>
                <p class="story-content">${story.content.substring(0, 400)}...</p>
            </div>
        `).join('');
    };

    // --- CÁC HÀM HIỂN THỊ & CẬP NHẬT GIAO DIỆN ---
    const showLoginView = () => {
        loginView.style.display = 'block';
        appView.style.display = 'none';
    };

    const showAppView = () => {
        loginView.style.display = 'none';
        appView.style.display = 'block';
        const username = localStorage.getItem('username');
        userInfoDiv.innerHTML = `
            <p>Welcome, <strong>${username}</strong></p>
            <button id="logoutBtn" class="btn btn-sm btn-danger w-100">Logout</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    };

    const renderSeasonSelector = () => {
        seasonSelector.innerHTML = seasons.map(s => `<option value="${s.id}">${s.seasonName}</option>`).join('');
    };

    window.renderTable = (data) => {
        if (!data || data.length === 0) {
            playerTable.innerHTML = `<tr><td colspan="13" class="text-center">No player data for this season. Please upload a file.</td></tr>`;
            return;
        }
        playerTable.innerHTML = data.map(player => `
             <tr>
                <td>${player.dorsal || '-'}</td>
                <td>
                    <div>
                        <img class="flag-icon" src="https://flagcdn.com/16x12/${getCountryCode(player.nation)}.png" alt="${player.nation}">
                        <span class="player-name">${player.name}</span>
                    </div>
                    <span class="player-position">${player.position}</span>
                </td>
                <td><span class="ca-box" style="background-color: ${getCaColor(player.ca)};">${player.ca}</span></td>
                <td>${player.age}</td>
                <td>${player.morale}</td>
                <td>${player.personality}</td>
                <td><span class="attribute-box" style="background-color: ${getAttributeColor(player.workRate)};">${player.workRate}</span></td>
                <td><span class="attribute-box" style="background-color: ${getAttributeColor(player.technique)};">${player.technique}</span></td>
                <td><span class="attribute-box" style="background-color: ${getAttributeColor(player.pace)};">${player.pace}</span></td>
                <td>${player.value > 0 ? `€${player.value.toFixed(1)}M` : 'N/A'}</td>
                <td>${player.matches}</td>
                <td>${player.goals} / ${player.assists}</td>
                <td><span class="stocking-box" style="background-color: ${getStockingColor(player.avgRating)};">${player.avgRating > 0 ? player.avgRating.toFixed(2) : '-'}</span></td>
            </tr>
        `).join('');
    };
    
    const updateSidebar = (data) => {
        if (!data || data.length === 0) {
            document.getElementById("topScorers").innerHTML = "";
            document.getElementById("topPlayers").innerHTML = "";
            return;
        }
        const topScorers = [...data].sort((a, b) => b.goals - a.goals).slice(0, 3);
        document.getElementById("topScorers").innerHTML = `<table class="sidebar-table">${topScorers.map(p => `<tr><td>${p.name}</td><td class="text-end"><strong>${p.goals}</strong></td></tr>`).join('')}</table>`;
        const topPlayers = [...data].sort((a, b) => b.ca - a.ca).slice(0, 3);
        document.getElementById("topPlayers").innerHTML = `<table class="sidebar-table">${topPlayers.map(p => `<tr><td>${p.name}</td><td><span class="rating-value">${p.ca}</span></td></tr>`).join('')}</table>`;
    };

    window.sortTable = (column) => {
        const order = (column === currentSort.column && currentSort.order === 'asc') ? 'desc' : 'asc';
        currentSort = { column, order };
        const sorted = [...playersData].sort((a, b) => {
            const valA = a[column];
            const valB = b[column];
            if (typeof valA === 'string') return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            return order === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
        });
        renderTable(sorted);
    };

    // --- KHỞI TẠO ỨNG DỤNG ---
    const initializeApp = async () => {
        token = localStorage.getItem('authToken');
        if (token) {
            showAppView();
            showSquadView();
            await fetchSeasons();
        } else {
            showLoginView();
        }
    };
        
    // --- GẮN CÁC EVENT LISTENERS ---
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    createSeasonBtn.addEventListener('click', handleCreateSeason);
    seasonSelector.addEventListener('change', (e) => fetchSquadForSeason(e.target.value));
    uploadBtn.addEventListener('click', handleUpload);
    deleteSquadBtn.addEventListener('click', handleDeleteSquad);
    mySquadTab.addEventListener('click', (e) => { e.preventDefault(); showSquadView(); });
    forumTab.addEventListener('click', (e) => { e.preventDefault(); showForumView(); });
    saveStoryBtn.addEventListener('click', handleSaveStory);
    filterInput.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = playersData.filter(p => p.name.toLowerCase().includes(searchTerm));
        renderTable(filtered);
    });

    // --- CÁC HÀM TIỆN ÍCH ---
    window.getCaColor = (value) => {
        if (value >= 180) return '#28a745'; if (value >= 160) return '#d4edda'; if (value >= 140) return '#cce5ff';
        if (value >= 120) return '#fff3cd'; if (value > 0) return '#f8d7da'; return '#f8f9fa';
    };
    window.getAttributeColor = (value) => {
        if (value >= 18) return '#28a745'; if (value >= 15) return '#d4edda'; if (value >= 12) return '#cce5ff';
        if (value >= 10) return '#fff3cd'; if (value > 0) return '#f8d7da'; return '#f8f9fa';
    };
    window.getStockingColor = (avgRating) => {
        if (avgRating >= 8.0) return '#198754'; if (avgRating >= 7.5) return '#28a745'; if (avgRating >= 7.0) return '#ffc107';
        if (avgRating > 0) return '#dc3545'; return '#6c757d';
    };
    window.getCountryCode = (nation) => {
        const map = {"AFG":"af","ALB":"al","ALG":"dz","AND":"ad","ANG":"ao","ATG":"ag","ARG":"ar","ARM":"am","AUS":"au","AUT":"at","AZE":"az","BAH":"bs","BHR":"bh","BAN":"bd","BRB":"bb","BLR":"by","BEL":"be","BLZ":"bz","BEN":"bj","BTN":"bt","BOL":"bo","BIH":"ba","BOT":"bw","BRA":"br","BRU":"bn","BUL":"bg","BFA":"bf","BDI":"bi","CAM":"kh","CMR":"cm","CAN":"ca","CPV":"cv","CTA":"cf","CHA":"td","CHI":"cl","CHN":"cn","COL":"co","COM":"km","CGO":"cg","COD":"cd","CRC":"cr","CIV":"ci","CRO":"hr","CUB":"cu","CYP":"cy","CZE":"cz","DEN":"dk","DJI":"dj","DMA":"dm","DOM":"do","ECU":"ec","EGY":"eg","SLV":"sv","EQG":"gq","ERI":"er","EST":"ee","ETH":"et","FIJ":"fj","FIN":"fi","FRA":"fr","GAB":"ga","GAM":"gm","GEO":"ge","GER":"de","GHA":"gh","GRE":"gr","GRN":"gd","GUA":"gt","GUI":"gn","GNB":"gw","GUY":"gy","HAI":"ht","HON":"hn","HKG":"hk","HUN":"hu","ISL":"is","IND":"in","IDN":"id","IRN":"ir","IRQ":"iq","IRL":"ie","ISR":"il","ITA":"it","JAM":"jm","JPN":"jp","JOR":"jo","KAZ":"kz","KEN":"ke","PRK":"kp","KOR":"kr","KOS":"xk","KUW":"kw","KGZ":"kg","LAO":"la","LAT":"lv","LBN":"lb","LES":"ls","LBR":"lr","LBY":"ly","LIE":"li","LTU":"lt","LUX":"lu","MAC":"mo","MKD":"mk","MAD":"mg","MWI":"mw","MAS":"my","MDV":"mv","MLI":"ml","MLT":"mt","MTN":"mr","MRI":"mu","MEX":"mx","MDA":"md","MGL":"mn","MNE":"me","MAR":"ma","MOZ":"mz","MYA":"mm","NAM":"na","NEP":"np","NED":"nl","NCL":"nc","NZL":"nz","NCA":"ni","NIG":"ne","NGA":"ng","NOR":"no","OMA":"om","PAK":"pk","PLE":"ps","PAN":"pa","PNG":"pg","PAR":"py","PER":"pe","PHI":"ph","POL":"pl","POR":"pt","PUR":"pr","QAT":"qa","ROU":"ro","RUS":"ru","RWA":"rw","SKN":"kn","LCA":"lc","VIN":"vc","SAM":"ws","SMR":"sm","STP":"st","KSA":"sa","SEN":"sn","SRB":"rs","SEY":"sc","SLE":"sl","SGP":"sg","SVK":"sk","SVN":"si","SOL":"sb","SOM":"so","RSA":"za","ESP":"es","SRI":"lk","SUD":"sd","SSD":"ss","SUR":"sr","SWE":"se","SUI":"ch","SYR":"sy","TAH":"pf","TPE":"tw","TJK":"tj","TAN":"tz","THA":"th","TLS":"tl","TOG":"tg","TGA":"to","TRI":"tt","TUN":"tn","TUR":"tr","TKM":"tm","UGA":"ug","UKR":"ua","UAE":"ae","ENG":"gb-eng","SCO":"gb-sct","WAL":"gb-wls","NIR":"gb-nir","USA":"us","URU":"uy","UZB":"uz","VAN":"vu","VEN":"ve","VIE":"vn","YEM":"ye","ZAM":"zm","ZIM":"zw"};
        return map[nation] || "un";
    };

    // Chạy hàm khởi tạo khi trang được tải
    initializeApp();
});