// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const historyBtn = document.getElementById('historyBtn');
const savedBtn = document.getElementById('savedBtn');
const themeBtn = document.getElementById('themeBtn');
const historyPanel = document.getElementById('historyPanel');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const venueCardTemplate = document.getElementById('venueCardTemplate');

// State
let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
let savedVenues = JSON.parse(localStorage.getItem('savedVenues')) || [];

// Event Listeners
sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
});
historyBtn.addEventListener('click', toggleHistoryPanel);
closeHistoryBtn.addEventListener('click', toggleHistoryPanel);
savedBtn.addEventListener('click', showSavedVenues);
themeBtn.addEventListener('click', toggleTheme);

// Initialize
loadChatHistory();
checkTheme();

// Functions
async function handleSendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user');
    userInput.value = '';

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'spinner';
    chatMessages.appendChild(loadingDiv);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        
        // Remove loading indicator
        loadingDiv.remove();

        // Handle the response
        if (data.error) {
            addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        } else {
            addMessage(data.response, 'bot');
            
            // If venues are included in the response, display them
            if (data.venues && data.venues.length > 0) {
                displayVenues(data.venues);
            }
        }

        // Save to history
        saveChatHistory(message, data.response);
    } catch (error) {
        console.error('Error:', error);
        loadingDiv.remove();
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    }

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message fade-in`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
}

function displayVenues(venues) {
    venues.forEach(venue => {
        const venueCard = venueCardTemplate.content.cloneNode(true);
        
        // Fill in venue details
        venueCard.querySelector('.venue-image').src = venue.image || 'default-venue.jpg';
        venueCard.querySelector('.venue-name').textContent = venue.name;
        venueCard.querySelector('.venue-type').textContent = venue.type;
        venueCard.querySelector('.rating').innerHTML = `<i class="fas fa-star"></i> ${venue.rating}`;
        
        if (venue.price) {
            venueCard.querySelector('.price').innerHTML = `<i class="fas fa-dollar-sign"></i> ${venue.price}`;
        }
        
        if (venue.capacity) {
            venueCard.querySelector('.capacity').innerHTML = `<i class="fas fa-users"></i> ${venue.capacity}`;
        }
        
        venueCard.querySelector('.address').textContent = venue.address;
        
        // Set up Google Maps directions link
        const directionsLink = venueCard.querySelector('.directions-link');
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address)}`;
        directionsLink.href = mapsUrl;
        
        // Set up save button
        const saveBtn = venueCard.querySelector('.save-venue');
        saveBtn.addEventListener('click', () => saveVenue(venue));
        
        // Add to chat
        chatMessages.appendChild(venueCard);
    });
}

function saveVenue(venue) {
    if (!savedVenues.some(v => v.name === venue.name)) {
        savedVenues.push(venue);
        localStorage.setItem('savedVenues', JSON.stringify(savedVenues));
        showNotification('Venue saved!');
    }
}

function showSavedVenues() {
    chatMessages.innerHTML = '';
    
    if (savedVenues.length === 0) {
        addMessage('No saved venues yet.', 'bot');
        return;
    }
    
    addMessage('Here are your saved venues:', 'bot');
    displayVenues(savedVenues);
}

function saveChatHistory(userMessage, botResponse) {
    const conversation = {
        timestamp: new Date().toISOString(),
        userMessage,
        botResponse
    };
    
    chatHistory.push(conversation);
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function loadChatHistory() {
    const historyContent = document.getElementById('historyContent');
    historyContent.innerHTML = '';
    
    chatHistory.forEach(conv => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-timestamp">${new Date(conv.timestamp).toLocaleString()}</div>
            <div class="history-user-message">${conv.userMessage}</div>
            <div class="history-bot-response">${conv.botResponse}</div>
        `;
        historyContent.appendChild(historyItem);
    });
}

function toggleHistoryPanel() {
    historyPanel.classList.toggle('active');
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isDark = !document.body.classList.contains('light-theme');
    localStorage.setItem('darkTheme', isDark);
    themeBtn.innerHTML = isDark ? '<i class="fas fa-moon"></i> Theme' : '<i class="fas fa-sun"></i> Theme';
}

function checkTheme() {
    const isDark = localStorage.getItem('darkTheme') !== 'false';
    if (!isDark) {
        document.body.classList.add('light-theme');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i> Theme';
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification fade-in';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
} 