/**
 * event-handlers.js
 * Centralized event handler initialization
 * Loại bỏ tất cả inline onclick handlers từ HTML
 */

const EventHandlers = {
    /**
     * Initialize all event listeners
     * Called once when DOM is loaded
     */
    init: function() {
        this.initAuthButtons();
        this.initSearchNavigation();
        this.initFilterButtons();
        this.initFormSubmits();
        this.initDropdownButtons();
    },

    /**
     * Authenticate buttons - Login & Register
     */
    initAuthButtons: function() {
        // Login button
        const loginBtn = document.getElementById('navLoginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof openAuthModal === 'function') {
                    openAuthModal('login');
                }
            });
        }

        // Register button
        const registerBtn = document.getElementById('navRegisterBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof openAuthModal === 'function') {
                    openAuthModal('register');
                }
            });
        }
    },

    /**
     * Search navigation tabs
     */
    initSearchNavigation: function() {
        document.querySelectorAll('.search-tab-item').forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                const href = this.dataset.href;
                if (href) {
                    window.location.href = href;
                }
            });
        });
    },

    /**
     * Filter & popup buttons
     */
    initFilterButtons: function() {
        // Filter button
        const filterBtn = document.getElementById('filterBtn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                if (typeof toggleFilterPopup === 'function') {
                    toggleFilterPopup('filterPopup');
                }
            });
        }

        // Reset filters button
        const resetBtn = document.getElementById('resetFiltersBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (typeof resetCombinedFilters === 'function') {
                    resetCombinedFilters();
                }
            });
        }

        // Apply filter button
        const applyBtn = document.querySelector('[data-action="apply-filter"]');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                if (typeof applyFilter === 'function') {
                    applyFilter('filterPopup');
                }
            });
        }
    },

    /**
     * Form submissions
     */
    initFormSubmits: function() {
        // Login form
        const loginForm = document.getElementById('form-login');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                if (typeof handleLogin === 'function') {
                    handleLogin(e);
                }
            });
        }

        // Register form
        const regForm = document.getElementById('form-register');
        if (regForm) {
            regForm.addEventListener('submit', (e) => {
                if (typeof handleRegister === 'function') {
                    handleRegister(e);
                }
            });
        }
    },

    /**
     * Dropdown & modal buttons
     */
    initDropdownButtons: function() {
        // Post new room button - moved to navbar.js via handleNavbarAuthClick
        const postNewBtn = document.getElementById('post-new-btn');
        if (postNewBtn) {
            postNewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof postNewRoom === 'function') {
                    postNewRoom();
                }
            });
        }

        // Logout button
        const logoutBtn = document.querySelector('.nav-profile-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof Storage !== 'undefined' && typeof Storage.logout === 'function') {
                    Storage.logout();
                }
            });
        }

        // Nav mark all read button - handled via navbar.js

        // Room booking button (detail page)
        const bookRoomBtn = document.querySelector('[onclick*="bookRoom"]');
        if (bookRoomBtn) {
            bookRoomBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof bookRoom === 'function') {
                    bookRoom();
                }
            });
        }
    }
};

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    EventHandlers.init();
});
