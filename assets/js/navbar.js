(function() {
    const TAB_CONFIG = [
        { key: 'all', label: 'Tất cả' },
        { key: 'housing', label: 'Hoạt động Trọ' },
        { key: 'payment', label: 'Giao dịch' },
        { key: 'promo', label: 'Khuyến mãi' },
        { key: 'account', label: 'Tài khoản' }
    ];

    let activeTab = 'all';

    function formatNotificationTime(isoTime) {
        const targetTime = new Date(isoTime || Date.now());
        const now = new Date();
        const diffSeconds = Math.max(0, Math.floor((now.getTime() - targetTime.getTime()) / 1000));

        if (diffSeconds < 60) return 'Vừa xong';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
        if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} ngày trước`;

        return targetTime.toLocaleString('vi-VN');
    }

    function mapNotificationCategory(type) {
        const value = (type || '').toLowerCase();
        if (value.includes('invoice') || value.includes('payment')) return 'payment';
        if (value.includes('contract') || value.includes('issue') || value.includes('room')) return 'housing';
        if (value.includes('promo') || value.includes('voucher') || value.includes('discount')) return 'promo';
        if (value.includes('account') || value.includes('auth') || value.includes('system')) return 'account';
        return 'housing';
    }

    function resolveNotificationLink(item, user) {
        const category = mapNotificationCategory(item.type);
        const roomId = item.meta && item.meta.roomId;

        if (category === 'account') {
            return 'ho-so.html#account-info';
        }

        if (category === 'promo') {
            return 'trang-chu.html';
        }

        if (user && user.role === 'owner') {
            return 'chu-tro.html';
        }

        if (user && user.role === 'tenant') {
            return 'khach-hang.html';
        }

        if (roomId) {
            return `chi-tiet.html?id=${roomId}`;
        }

        return 'trang-chu.html';
    }

    function resolveViewAllNotificationLink(user) {
        if (!user) return 'trang-chu.html';
        if (user.role === 'owner') return 'chu-tro.html#ownerNotificationList';
        if (user.role === 'tenant') return 'khach-hang.html#tenantNotificationList';
        return 'trang-chu.html';
    }

    function renderNotificationDropdown() {
        const user = window.Storage && Storage.getCurrentUser ? Storage.getCurrentUser() : null;
        const notificationBadge = document.getElementById('notification-badge');
        const listEl = document.getElementById('nav-notification-list');
        const tabWrap = document.getElementById('nav-notification-tabs');
        if (!listEl || !tabWrap) return;

        const notifications = user ? Storage.getNotifications(user.phone) : [];
        const unread = notifications.filter((item) => !item.isRead);

        if (notificationBadge) {
            const unreadCount = unread.length;
            if (unreadCount > 0) {
                notificationBadge.classList.remove('d-none');
                notificationBadge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
            } else {
                notificationBadge.classList.add('d-none');
            }
        }

        const countByTab = {
            all: unread.length,
            housing: 0,
            payment: 0,
            promo: 0,
            account: 0
        };

        unread.forEach((item) => {
            const key = mapNotificationCategory(item.type);
            if (countByTab[key] !== undefined) countByTab[key] += 1;
        });

        tabWrap.querySelectorAll('.nav-notification-tab').forEach((tabBtn) => {
            const key = tabBtn.dataset.tab || 'all';
            tabBtn.classList.toggle('active', key === activeTab);
            const badge = tabBtn.querySelector('.nav-tab-badge');
            const value = countByTab[key] || 0;
            if (!badge) return;
            if (value > 0) {
                badge.classList.remove('d-none');
                badge.textContent = value > 9 ? '9+' : String(value);
            } else {
                badge.classList.add('d-none');
            }
        });

        const filtered = notifications.filter((item) => {
            if (activeTab === 'all') return true;
            return mapNotificationCategory(item.type) === activeTab;
        });

        if (!filtered.length) {
            listEl.innerHTML = '<div class="nav-notification-empty">Không có thông báo ở mục này.</div>';
            return;
        }

        listEl.innerHTML = filtered.slice(0, 20).map((item) => {
            const title = item.title || 'Thông báo';
            const message = item.message || 'Bạn có thông báo mới.';
            return `
                <button type="button" class="nav-notification-item ${item.isRead ? '' : 'unread'}" data-id="${item.id}">
                    <div class="nav-notification-title">${title}</div>
                    <div class="nav-notification-message">${message}</div>
                    <div class="nav-notification-time">${formatNotificationTime(item.createdAt)}</div>
                </button>
            `;
        }).join('');

        listEl.querySelectorAll('.nav-notification-item').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const selected = notifications.find((item) => item.id === id);
                if (!selected) return;
                Storage.markNotificationRead(id, user ? user.phone : '');
                renderNotificationDropdown();
                window.location.href = resolveNotificationLink(selected, user);
            });
        });
    }

    function refreshNavbarAuthUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userInfo = document.getElementById('user-info');
        const profileName = document.getElementById('nav-profile-name');
        const adminLink = document.getElementById('admin-link');
        const viewAllLink = document.querySelector('.nav-notification-foot a');
        const user = window.Storage && Storage.getCurrentUser ? Storage.getCurrentUser() : null;

        if (!authButtons || !userInfo) return;

        if (!user) {
            authButtons.classList.remove('d-none');
            userInfo.classList.add('d-none');
            userInfo.classList.remove('d-flex');
            if (adminLink) adminLink.classList.add('d-none');
            if (viewAllLink) viewAllLink.href = resolveViewAllNotificationLink(null);
            return;
        }

        authButtons.classList.add('d-none');
        userInfo.classList.remove('d-none');
        userInfo.classList.add('d-flex');
        if (profileName) profileName.textContent = user.name || 'Người dùng';

        if (adminLink) {
            if (user.role === 'owner') {
                adminLink.classList.remove('d-none');
                adminLink.href = 'chu-tro.html';
                adminLink.innerHTML = '<i class="fa-solid fa-list-check"></i> Quản lý';
            } else if (user.role === 'tenant') {
                adminLink.classList.remove('d-none');
                adminLink.href = 'khach-hang.html';
                adminLink.innerHTML = '<i class="fa-solid fa-house-user"></i> Thuê trọ';
            } else {
                adminLink.classList.add('d-none');
            }
        }

        if (viewAllLink) {
            viewAllLink.href = resolveViewAllNotificationLink(user);
        }

        renderNotificationDropdown();
    }

    function initNavbarTabs() {
        const tabWrap = document.getElementById('nav-notification-tabs');
        if (!tabWrap) return;

        tabWrap.innerHTML = TAB_CONFIG.map((tab) => `
            <button type="button" class="nav-notification-tab ${tab.key === activeTab ? 'active' : ''}" data-tab="${tab.key}">
                ${tab.label}
                <span class="nav-tab-badge d-none">0</span>
            </button>
        `).join('');

        tabWrap.querySelectorAll('.nav-notification-tab').forEach((tabBtn) => {
            tabBtn.addEventListener('click', () => {
                activeTab = tabBtn.dataset.tab || 'all';
                renderNotificationDropdown();
            });
        });
    }

    function initNavbarEvents() {
        const markAllBtn = document.getElementById('nav-mark-all-read');
        const dropdownToggle = document.getElementById('notification-toggle');
        const dropdownMenu = dropdownToggle ? dropdownToggle.nextElementSibling : null;

        if (dropdownToggle) {
            // Keep dropdown open on inside clicks; close only when clicking outside.
            dropdownToggle.setAttribute('data-bs-auto-close', 'outside');
        }

        if (dropdownMenu) {
            dropdownMenu.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }

        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => {
                const user = window.Storage && Storage.getCurrentUser ? Storage.getCurrentUser() : null;
                if (!user) return;
                Storage.markAllNotificationsRead(user.phone);
                renderNotificationDropdown();
            });
        }

        if (dropdownToggle) {
            dropdownToggle.addEventListener('click', () => {
                renderNotificationDropdown();
            });
        }
    }

    function initNavbarUI() {
        initNavbarTabs();
        initNavbarEvents();
        refreshNavbarAuthUI();
        setInterval(renderNotificationDropdown, 30000);
    }

    window.handleNavbarAuthClick = function(event, type) {
        const hasModal = document.getElementById('authModal');
        if (hasModal && typeof window.openAuthModal === 'function') {
            event.preventDefault();
            window.openAuthModal(type);
            return false;
        }
        return true;
    };

    window.NavbarUI = {
        refreshAuthUI: refreshNavbarAuthUI,
        refreshNotifications: renderNotificationDropdown
    };

    document.addEventListener('DOMContentLoaded', initNavbarUI);
})();
