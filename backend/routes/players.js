// File: frontend/player.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://football-manager-app.onrender.com/api';

    // Hàm gọi API (tương tự file script.js chính)
    const apiCall = async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    };

    // Hàm tô màu cho chỉ số
    const getAttributeColor = (value) => {
        if (value >= 18) return '#28a745'; if (value >= 15) return '#d4edda'; if (value >= 12) return '#cce5ff';
        if (value >= 10) return '#fff3cd'; if (value > 0) return '#f8d7da'; return '#f8f9fa';
    };

    // Hàm hiển thị danh sách chỉ số
    const renderAttributeList = (containerId, attributes) => {
        const container = document.getElementById(containerId);
        container.innerHTML = Object.entries(attributes).map(([name, value]) => `
            <div class="attribute-row">
                <span>${name}</span>
                <span class="attribute-value" style="background-color: ${getAttributeColor(value)}">${value || 0}</span>
            </div>
        `).join('');
    };

    // Hàm hiển thị chi tiết cầu thủ
    const renderPlayerDetail = (player) => {
        document.title = player.name; // Cập nhật tiêu đề trang
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
        
        const technicalAttrs = { Corners: player.corners, Crossing: player.crossing, Dribbling: player.dribbling, Finishing: player.finishing, "First Touch": player.firstTouch, "Free Kick": player.freeKick, Heading: player.heading, "Long Shots": player.longShots, "Long Throws": player.longThrows, Marking: player.marking, Passing: player.passing, "Penalty Taking": player.penalty, Tackling: player.tackling, Technique: player.technique };
        const mentalAttrs = { Aggression: player.aggression, Anticipation: player.anticipation, Bravery: player.bravery, Composure: player.composure, Concentration: player.concentration, Decisions: player.decisions, Determination: player.determination, Flair: player.flair, Leadership: player.leadership, "Off The Ball": player.offTheBall, Positioning: player.positioning, Teamwork: player.teamwork, Vision: player.vision, "Work Rate": player.workRate };
        const physicalAttrs = { Acceleration: player.acceleration, Agility: player.agility, Balance: player.balance, "Jumping Reach": player.jumping, "Natural Fitness": player.naturalFit, Pace: player.pace, Stamina: player.stamina, Strength: player.strength };

        renderAttributeList('technical-attrs', technicalAttrs);
        renderAttributeList('mental-attrs', mentalAttrs);
        renderAttributeList('physical-attrs', physicalAttrs);
    };

    // Hàm chính để khởi chạy trang
    const initializePage = async () => {
        // Lấy ID cầu thủ từ tham số URL (ví dụ: player.html?id=123)
        const params = new URLSearchParams(window.location.search);
        const playerId = params.get('id');

        if (playerId) {
            const player = await apiCall(`/players/${playerId}`);
            if (player) {
                renderPlayerDetail(player);
            } else {
                document.getElementById('playerName').innerText = 'Player not found.';
            }
        } else {
            document.getElementById('playerName').innerText = 'No player ID specified.';
        }
    };

    initializePage();
});