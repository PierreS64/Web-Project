const ROOMS_KEY = 'room_data';
const USERS_KEY = 'user_data';
const CURRENT_USER_KEY = 'current_user';
const NOTIFICATIONS_KEY = 'notification_data';

// --- DỮ LIỆU MẪU (SEED DATA) ---
const initialRooms = [];
const initialUsers = [];

// --- KHỞI TẠO DỮ LIỆU ---
(function initData() {
    // Nếu chưa có dữ liệu phòng thì khởi tạo mảng rỗng
    if (!localStorage.getItem(ROOMS_KEY)) {
        localStorage.setItem(ROOMS_KEY, JSON.stringify(initialRooms));
    } 
    
    // Nếu chưa có user thì khởi tạo mảng rỗng
    if (!localStorage.getItem(USERS_KEY)) {
        localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
    }

    // Kho thông báo chung cho toàn hệ thống
    if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    }
})();

// --- API XỬ LÝ DỮ LIỆU ---
const Storage = {
    // 1. QUẢN LÝ PHÒNG (CRUD)
    getRooms: function() {
        return JSON.parse(localStorage.getItem(ROOMS_KEY)) || [];
    },
    
    getRoomById: function(id) {
        return this.getRooms().find(r => r.id === id);
    },

    saveRooms: function(rooms) {
        localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
    },

    addRoom: function(room) {
        const rooms = this.getRooms();
        rooms.unshift(room); // Thêm lên đầu
        this.saveRooms(rooms);
    },

    updateRoom: function(updatedRoom) {
        const rooms = this.getRooms();
        const index = rooms.findIndex(r => r.id === updatedRoom.id);
        if (index !== -1) {
            rooms[index] = updatedRoom;
            this.saveRooms(rooms);
        }
    },

    deleteRoom: function(id) {
        const rooms = this.getRooms().filter(r => r.id !== id);
        this.saveRooms(rooms);
    },

    // 2. QUẢN LÝ USER (AUTH)
    login: function(phone, pass) {
        const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
        const user = users.find(u => u.phone === phone && u.pass === pass);
        if (user) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            return user;
        }
        return null;
    },

    register: function(newUser) {
        const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
        // Kiểm tra trùng SĐT
        if (users.some(u => u.phone === newUser.phone)) return false;
        
        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return true;
    },

    updateUser: function(updatedUser) {
        const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
        const index = users.findIndex(u => u.phone === updatedUser.phone);
        if (index !== -1) {
            users[index] = updatedUser;
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.phone === updatedUser.phone) {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
            }
            return true;
        }
        return false;
    },
    getUsers: function() {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    },
    getUserByPhone: function(phone) {
        const normalizedPhone = (phone || '').trim();
        if (!normalizedPhone) return null;
        return this.getUsers().find(u => u.phone === normalizedPhone) || null;
    },
    getCurrentUser: function() {
        return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    },

    // 3. THÔNG BÁO HỆ THỐNG
    getNotifications: function(phone) {
        const notifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
        if (!phone) return notifications;
        return notifications
            .filter((item) => item.toPhone === phone)
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    },

    addNotification: function(payload) {
        if (!payload || !payload.toPhone) return null;
        const notifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
        const record = {
            id: `NTF_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            toPhone: payload.toPhone,
            fromPhone: payload.fromPhone || '',
            type: payload.type || 'system',
            title: payload.title || 'Thông báo mới',
            message: payload.message || '',
            meta: payload.meta || {},
            isRead: false,
            createdAt: new Date().toISOString()
        };
        notifications.unshift(record);
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
        return record;
    },

    markNotificationRead: function(id, phone) {
        const notifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
        const index = notifications.findIndex((n) => n.id === id && (!phone || n.toPhone === phone));
        if (index === -1) return false;
        notifications[index].isRead = true;
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
        return true;
    },

    markAllNotificationsRead: function(phone) {
        if (!phone) return 0;
        const notifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
        let changed = 0;
        notifications.forEach((n) => {
            if (n.toPhone === phone && !n.isRead) {
                n.isRead = true;
                changed += 1;
            }
        });
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
        return changed;
    },

    // 4. HOÁ ĐƠN - THANH TOÁN
    markInvoicePaid: function(roomId, invoiceId, paymentInfo = {}) {
        const room = this.getRoomById(roomId);
        if (!room || !Array.isArray(room.invoices)) return null;

        const nextInvoices = room.invoices.map((inv) => {
            if (inv.id !== invoiceId) return inv;
            return {
                ...inv,
                status: 'paid',
                paidAt: paymentInfo.paidAt || new Date().toISOString(),
                paymentMethod: paymentInfo.paymentMethod || 'bank_transfer',
                paymentRef: paymentInfo.paymentRef || '',
                paymentContent: paymentInfo.paymentContent || ''
            };
        });

        const updatedRoom = {
            ...room,
            invoices: nextInvoices
        };

        this.updateRoom(updatedRoom);
        return updatedRoom;
    },

    logout: function() {
        localStorage.removeItem(CURRENT_USER_KEY);
        // Chuyển về trang chủ để tránh lỗi nếu đang ở trang owner
        window.location.href = 'trang-chu.html';
    }
};
