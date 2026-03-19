const ROOMS_KEY = 'room_data';
const USERS_KEY = 'user_data';
const CURRENT_USER_KEY = 'current_user';

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

    logout: function() {
        localStorage.removeItem(CURRENT_USER_KEY);
        // Chuyển về trang chủ để tránh lỗi nếu đang ở trang owner
        window.location.href = 'index.html';
    }
};
