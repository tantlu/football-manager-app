// File: frontend/script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- KHAI BÁO BIẾN TRẠNG THÁI VÀ HẰNG SỐ ---
    const API_URL = 'https://football-manager-app.onrender.com/api';

    let token = null;
    let seasons = [];
    let currentSeasonId = null;
    let currentStoryId = null;
    let playersData = [];
    let currentSort = { column: 'ca', order: 'desc' };
    let lastViewedHash = '#/squad'; // Biến mới để biết quay về đâu

    // --- LẤY CÁC PHẦN TỬ GIAO DIỆN ---
    const loginView = document.getElementById('loginView');
    const appView = document.getElementById('appView');
    const storyDetailView = document.getElementById('storyDetailView');
    const playerDetailView = document.getElementById('playerDetailView');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const mySquadTab = document.getElementById('mySquadTab');
    const forumTab = document.getElementById('forumTab');
    const userInfoDiv = document.getElementById('userInfo');
    const seasonSelector = document.getElementById('seasonSelector');
    const createSeasonBtn = document.getElementById('createSeasonBtn');
    const squadViewContainer = document.getElementById('squadViewContainer');
    const squadTitle = document.getElementById('squadTitle');
    const filterInput = document.getElementById('filterInput');
    const playerTable = document.getElementById('playerTable');
    const uploadArea = document.getElementById('uploadArea');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const deleteSquadBtn = document.getElementById('deleteSquadBtn');
    const storyContainer = document.getElementById('storyContainer');
    const storyHeader = document.getElementById('storyHeader');
    const storyDisplay = document.getElementById('storyDisplay');
    const storyEditor = document.getElementById('storyEditor');
    const storyTitleInput = document.getElementById('storyTitleInput');
    const storyContentTextarea = document.getElementById('storyContentTextarea');
    const saveStoryBtn = document.getElementById('saveStoryBtn');
    const forumView = document.getElementById('forumView');
    const storiesFeed = document.getElementById('storiesFeed');
    const backToForumBtn = document.getElementById('backToForumBtn');
    const detailStoryTitle = document.getElementById('detailStoryTitle');
    const detailStoryMeta = document.getElementById('detailStoryMeta');
    const detailStoryContent = document.getElementById('detailStoryContent');
    const detailPlayerTable = document.getElementById('detailPlayerTable');
    const editStoryBtn = document.getElementById('editStoryBtn');
    const detailStoryEditor = document.getElementById('detailStoryEditor');
    const editStoryTitleInput = document.getElementById('editStoryTitleInput');
    const editStoryContentTextarea = document.getElementById('editStoryContentTextarea');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const commentSection = document.getElementById('commentSection');
    const commentForm = document.getElementById('commentForm');
    const commentContent = document.getElementById('commentContent');
    const commentList = document.getElementById('commentList');
    const allMainViews = [loginView, appView, storyDetailView, playerDetailView];

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
            localStorage.setItem('userId', result.userId);
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
        localStorage.removeItem('userId');
        location.hash = '';
        showLoginView();
    };

    // --- LOGIC ĐỊNH TUYẾN (ROUTING) ---
    const router = async () => {
        console.log('Router is running... Hash is:', location.hash);
        const path = location.hash.slice(2).split('/');
        const currentRoute = path[0] || 'squad';
        const param = path[1];

        if (!token) {
            showView(loginView);
            return;
        }
        
        // Mặc định hiển thị appView, các hàm con sẽ xử lý các view chi tiết
        showView(appView);

        switch (currentRoute) {
            case 'squad':
                showSquadView();
                lastViewedHash = '#/squad';
                break;
            case 'forum':
                await showForumView();
                lastViewedHash = '#/forum';
                break;
            case 'story':
                if (param) await handleViewStoryDetail(param);
                break;
            case 'player':
                if (param) await handleViewPlayerDetail(param);
                break;
            default:
                location.hash = '#/squad';
                break;
        }
    };

    // --- CÁC HÀM HIỂN THỊ VIEW ---
    const showLoginView = () => {
        loginView.style.display = 'block';
        appView.style.display = 'none';
        storyDetailView.style.display = 'none';
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

    const showView = (viewToShow) => {
        allMainViews.forEach(view => view.style.display = 'none');
        viewToShow.style.display = 'block';
    };

    const showSquadView = () => {
        squadViewContainer.style.display = 'block';
        forumView.style.display = 'none';
        mySquadTab.classList.add('active');
        forumTab.classList.remove('active');
    };

    const showForumView = async () => {
        squadViewContainer.style.display = 'none';
        forumView.style.display = 'block';
        mySquadTab.classList.remove('active');
        forumTab.classList.add('active');
        await fetchPublicFeed();
    };

    // --- LOGIC MÙA GIẢI & ĐỘI HÌNH ---
    const fetchSeasons = async () => {
        seasons = await apiCall('/seasons');
        if (!seasons) return;
        renderSeasonSelector();
        if (seasons.length > 0) {
            currentSeasonId = seasonSelector.value || seasons[0].id;
            seasonSelector.value = currentSeasonId;
            fetchSquadForSeason(currentSeasonId);
            uploadArea.style.display = 'block';
        } else {
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
                location.hash = '#/squad';
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
        renderTable(playersData || [], playerTable);
        updateSidebar(playersData || []);
        await fetchStoryForSeason(seasonId);
    };

    const handleUpload = async () => {
        if (!fileInput.files[0]) return alert('Please select a file to upload.');
        if (!currentSeasonId) return alert('Please create and select a season first.');
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
        if (!currentSeasonId) return alert('Please select a season to delete.');
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
        if (!currentSeasonId || !title || !content) return alert("Please select a season and provide both a title and content.");
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
            <a href="#/story/${story.seasonId}" class="story-card-link text-decoration-none">
                <div class="story-card">
                    <h3 class="story-title">${story.title}</h3>
                    <p class="story-meta">By <strong>${story.season.user.username}</strong> for season ${story.season.seasonName}</p>
                    <p class="story-content">${story.content.substring(0, 400)}...</p>
                </div>
            </a>
        `).join('');
    };
    
    const handleViewStoryDetail = async (seasonId) => {
        const data = await apiCall(`/stories/details/${seasonId}`);
        if (data) {
            currentStoryId = data.story.id;
            const loggedInUserId = localStorage.getItem('userId');
            appView.style.display = 'none';
            storyDetailView.style.display = 'block';
            detailStoryContent.style.display = 'block';
            detailStoryEditor.style.display = 'none';
            detailStoryTitle.innerText = data.story.title;
            detailStoryMeta.innerText = `By ${data.story.season.user.username} for season ${data.story.season.seasonName}`;
            detailStoryContent.innerText = data.story.content;
            if (loggedInUserId && parseInt(loggedInUserId) === data.story.season.user.id) {
                editStoryBtn.style.display = 'block';
            } else {
                editStoryBtn.style.display = 'none';
            }
            await fetchComments(data.story.id);
            renderTable(data.players, detailPlayerTable);
        }
    };

    const handleBackToForum = () => { location.hash = '#/forum'; };
    const handleBackClick = () => {
        location.hash = lastViewedHash;
    };

    const handleEditStoryClick = () => {
        editStoryTitleInput.value = detailStoryTitle.innerText;
        editStoryContentTextarea.value = detailStoryContent.innerText;
        detailStoryContent.style.display = 'none';
        editStoryBtn.style.display = 'none';
        detailStoryEditor.style.display = 'block';
    };

    const handleCancelEdit = () => {
        detailStoryContent.style.display = 'block';
        editStoryBtn.style.display = 'block';
        detailStoryEditor.style.display = 'none';
    };

    const handleSaveChanges = async () => {
        const title = editStoryTitleInput.value;
        const content = editStoryContentTextarea.value;
        if (!currentStoryId || !title || !content) return alert('Title and content cannot be empty.');
        const updatedStory = await apiCall(`/stories/${currentStoryId}`, 'PUT', { title, content });
        if(updatedStory) {
            alert('Story updated successfully!');
            detailStoryTitle.innerText = updatedStory.title;
            detailStoryContent.innerText = updatedStory.content;
            handleCancelEdit();
        }
    };

    const fetchComments = async (storyId) => {
        const comments = await apiCall(`/comments/${storyId}`);
        if (comments) renderComments(comments);
    };

    const renderComments = (comments) => {
        if (comments.length === 0) {
            commentList.innerHTML = '<p class="text-muted">No comments yet. Be the first to comment!</p>';
            return;
        }
        commentList.innerHTML = comments.map(comment => `
            <div class="border-bottom pb-2 mb-2">
                <p class="mb-1">${comment.content}</p>
                <small class="text-muted">By <strong>${comment.author.username}</strong> on ${new Date(comment.createdAt).toLocaleString()}</small>
            </div>
        `).join('');
    };

    const handlePostComment = async (event) => {
        event.preventDefault();
        const content = commentContent.value;
        if (!content || !currentStoryId) return;
        const newComment = await apiCall(`/comments/${currentStoryId}`, 'POST', { content });
        if (newComment) {
            commentContent.value = '';
            fetchComments(currentStoryId);
        }
    };

    const renderSeasonSelector = () => {
        seasonSelector.innerHTML = seasons.map(s => `<option value="${s.id}">${s.seasonName}</option>`).join('');
    };

    window.renderTable = (data, tableElement = playerTable) => {
    if (!data || data.length === 0) {
        tableElement.innerHTML = `<tr><td colspan="13" class="text-center">No player data available.</td></tr>`;
        return;
    }
    tableElement.innerHTML = data.map(player => `
        <tr data-player-id="${player.id}" style="cursor: pointer;">
            <td>${player.dorsal || '-'}</td>
            <td>
                <div>
                    <img class="flag-icon" src="https://flagcdn.com/16x12/${getCountryCode(player.nation)}.png" alt="${player.nation}">
                    <a href="#/player/${player.id}" class="player-name-link">${player.name}</a>
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
        renderTable(sorted, playerTable); // Chú ý: Sắp xếp chỉ áp dụng cho bảng chính
    };

    const initializeApp = async () => {
        token = localStorage.getItem('authToken');
        if (token) {
            showAppView();
            await fetchSeasons();
            await router();
        } else {
            showLoginView();
        }
    };

    // --- LOGIC MỚI: XEM CHI TIẾT CẦU THỦ ---
    const handleViewPlayerDetail = async (playerId) => {
        console.log('Viewing player detail for ID:', playerId);
        const player = await apiCall(`/players/${playerId}`);
        if(player) {
            renderPlayerDetail(player);
            showView(playerDetailView);
        }
    };

    const renderPlayerDetail = (player) => {
        // Điền thông tin cơ bản
        document.getElementById('playerName').innerText = player.name;
        document.getElementById('playerPosition').innerText = player.position;
        document.getElementById('playerCA').innerText = player.ca;
        document.getElementById('playerPA').innerText = player.pa;
        document.getElementById('playerAge').innerText = player.age;
        document.getElementById('playerValue').innerText = player.value > 0 ? `€${player.value.toFixed(1)}M` : 'N/A';
        document.getElementById('playerPersonality').innerText = player.personality;
        document.getElementById('playerHeight').innerText = `${player.height || '?'} cm`;
        document.getElementById('playerWeight').innerText = `${player.weight || '?'} kg`;
        document.getElementById('playerRightFoot').innerText = player.rightFoot;
        document.getElementById('playerLeftFoot').innerText = player.leftFoot;
        
        // Render các cột chỉ số
        const technicalAttrs = { Corners: player.corners, Crossing: player.crossing, Dribbling: player.dribbling, Finishing: player.finishing, "First Touch": player.firstTouch, "Free Kick": player.freeKick, Heading: player.heading, "Long Shots": player.longShots, "Long Throws": player.longThrows, Marking: player.marking, Passing: player.passing, "Penalty Taking": player.penalty, Tackling: player.tackling, Technique: player.technique };
        const mentalAttrs = { Aggression: player.aggression, Anticipation: player.anticipation, Bravery: player.bravery, Composure: player.composure, Concentration: player.concentration, Decisions: player.decisions, Determination: player.determination, Flair: player.flair, Leadership: player.leadership, "Off The Ball": player.offTheBall, Positioning: player.positioning, Teamwork: player.teamwork, Vision: player.vision, "Work Rate": player.workRate };
        const physicalAttrs = { Acceleration: player.acceleration, Agility: player.agility, Balance: player.balance, "Jumping Reach": player.jumping, "Natural Fitness": player.naturalFit, Pace: player.pace, Stamina: player.stamina, Strength: player.strength };

        renderAttributeList('technical-attrs', technicalAttrs);
        renderAttributeList('mental-attrs', mentalAttrs);
        renderAttributeList('physical-attrs', physicalAttrs);
    };

    const renderAttributeList = (containerId, attributes) => {
        const container = document.getElementById(containerId);
        container.innerHTML = Object.entries(attributes).map(([name, value]) => `
            <div class="attribute-row">
                <span>${name}</span>
                <span class="attribute-value" style="background-color: ${getAttributeColor(value)}">${value || 0}</span>
            </div>
        `).join('');
    };
        
    // --- GẮN CÁC EVENT LISTENERS ---
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    createSeasonBtn.addEventListener('click', handleCreateSeason);
    seasonSelector.addEventListener('change', (e) => fetchSquadForSeason(e.target.value));
    uploadBtn.addEventListener('click', handleUpload);
    deleteSquadBtn.addEventListener('click', handleDeleteSquad);
    saveStoryBtn.addEventListener('click', handleSaveStory);
    filterInput.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = playersData.filter(p => p.name.toLowerCase().includes(searchTerm));
        renderTable(filtered, playerTable);
    });
    
    backToForumBtn.addEventListener('click', handleBackToForum);
    document.getElementById('backBtn').addEventListener('click', handleBackClick);
    
    editStoryBtn.addEventListener('click', handleEditStoryClick);
    cancelEditBtn.addEventListener('click', handleCancelEdit);
    saveChangesBtn.addEventListener('click', handleSaveChanges);
    commentForm.addEventListener('submit', handlePostComment);

    window.addEventListener('hashchange', router);

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
    
    initializeApp();
});