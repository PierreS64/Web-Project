/**
 * favorites.js
 * Manage favorite rooms list
 * Users can save rooms they like for later viewing
 */

const Favorites = {
    STORAGE_KEY: 'favorite_rooms',

    /**
     * Add room to favorites
     * @param {string} roomId - Room ID to add
     * @returns {boolean} true if added successfully
     */
    add: function(roomId) {
        const favorites = this.getAll();
        if (!favorites.includes(roomId)) {
            favorites.push(roomId);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
            this.notifyListeners();
            return true;
        }
        return false;
    },

    /**
     * Remove room from favorites
     * @param {string} roomId - Room ID to remove
     * @returns {boolean} true if removed successfully
     */
    remove: function(roomId) {
        const favorites = this.getAll().filter(id => id !== roomId);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
        this.notifyListeners();
        return true;
    },

    /**
     * Get all favorite room IDs
     * @returns {Array<string>} Array of room IDs
     */
    getAll: function() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    },

    /**
     * Get full room objects of favorited rooms
     * @returns {Array<Object>} Array of room objects
     */
    getFavoriteRooms: function() {
        if (typeof Storage === 'undefined') return [];
        const ids = this.getAll();
        const allRooms = Storage.getRooms();
        return allRooms.filter(room => ids.includes(room.id));
    },

    /**
     * Check if a room is favorited
     * @param {string} roomId - Room ID to check
     * @returns {boolean} true if favorited
     */
    isFavorite: function(roomId) {
        return this.getAll().includes(roomId);
    },

    /**
     * Toggle favorite status for a room
     * @param {string} roomId - Room ID
     * @returns {boolean} true if now favorited, false if unfavorited
     */
    toggle: function(roomId) {
        if (this.isFavorite(roomId)) {
            this.remove(roomId);
            return false;
        } else {
            this.add(roomId);
            return true;
        }
    },

    /**
     * Clear all favorites
     */
    clear: function() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        this.notifyListeners();
    },

    /**
     * Listener pattern for changes
     */
    _listeners: [],

    /**
     * Subscribe to favorite changes
     * @param {Function} callback - Called when favorites change
     */
    onChange: function(callback) {
        if (typeof callback === 'function') {
            this._listeners.push(callback);
        }
    },

    /**
     * Notify all listeners of changes
     */
    notifyListeners: function() {
        this._listeners.forEach(cb => {
            try {
                cb();
            } catch (e) {
                console.error('Error in favorites listener:', e);
            }
        });
    }
};

/**
 * Update favorite button UI
 * @param {string} roomId - Room ID
 * @param {boolean} isFav - Whether favorited
 */
function updateFavoriteButtonUI(roomId, isFav) {
    const card = document.querySelector(`[data-room-id="${roomId}"]`);
    if (!card) return;

    const btn = card.querySelector('.room-fav-btn');
    if (!btn) return;

    if (isFav) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        btn.setAttribute('aria-label', 'Bỏ thích');
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        btn.setAttribute('aria-label', 'Yêu thích');
    }
}

/**
 * Setup favorite button event listeners
 */
function setupFavoriteButtons() {
    document.querySelectorAll('.room-fav-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();

            const card = this.closest('[data-room-id]');
            if (!card) return;

            const roomId = card.dataset.roomId;
            const isFav = Favorites.toggle(roomId);
            updateFavoriteButtonUI(roomId, isFav);

            // Show feedback
            if (isFav) {
                Utils.showSuccess('Đã thêm vào danh sách yêu thích');
            } else {
                Utils.showSuccess('Đã xóa khỏi danh sách yêu thích');
            }
        });
    });
}

/**
 * Update all room cards with favorite status
 */
function syncAllFavoriteButtons() {
    const favoriteIds = Favorites.getAll();
    document.querySelectorAll('[data-room-id]').forEach(card => {
        const roomId = card.dataset.roomId;
        const isFav = favoriteIds.includes(roomId);
        updateFavoriteButtonUI(roomId, isFav);
    });
}

// Initialize favorites UI when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupFavoriteButtons();
    syncAllFavoriteButtons();

    // Re-setup when room list is updated
    const originalRenderHomeRooms = window.renderHomeRooms;
    window.renderHomeRooms = function(...args) {
        originalRenderHomeRooms.apply(this, args);
        setupFavoriteButtons();
        syncAllFavoriteButtons();
    };
});
