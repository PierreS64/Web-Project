const ROOMS_KEY = 'room_data';
const USERS_KEY = 'user_data';
const CURRENT_USER_KEY = 'current_user';
const NOTIFICATIONS_KEY = 'notification_data';
const REMEMBER_LOGIN_KEY = 'remember_login_data';

// --- DỮ LIỆU MẪU (SEED DATA) ---
const initialUsers = [
    { name: 'Nguyễn Thuận Phong', phone: '0912345601', pass: 'Phong123#', role: 'owner', email: 'phong.nt@nhaxanh.vn', gender: 'Nam', birthdate: '1996-04-12', idCard: '001096000001', address: 'Hà Đông, Hà Nội' },
    { name: 'Nguyễn Hồng Phúc', phone: '0912345602', pass: 'Phuc123#', role: 'owner', email: 'phuc.nh@nhaxanh.vn', gender: 'Nam', birthdate: '1994-09-22', idCard: '001094000002', address: 'Cầu Giấy, Hà Nội' },
    { name: 'Nguyễn Tiến Thành', phone: '0912345603', pass: 'Thanh123#', role: 'owner', email: 'thanh.nt@nhaxanh.vn', gender: 'Nam', birthdate: '1995-01-15', idCard: '079095000003', address: 'Quận 7, TP. Hồ Chí Minh' },
    { name: 'Hàn Minh Tùng', phone: '0912345604', pass: 'Tung123#', role: 'owner', email: 'tung.hm@nhaxanh.vn', gender: 'Nam', birthdate: '1993-06-18', idCard: '031093000004', address: 'Hải Châu, Đà Nẵng' },
    { name: 'Ninh Viết Mạnh', phone: '0912345605', pass: 'Manh123#', role: 'owner', email: 'manh.nv@nhaxanh.vn', gender: 'Nam', birthdate: '1992-11-04', idCard: '022092000005', address: 'Ngô Quyền, Hải Phòng' },

    { name: 'Lê Minh Anh', phone: '0901234501', pass: 'Anh123#', role: 'tenant', email: 'anh.lm@gmail.com', gender: 'Nữ', birthdate: '2001-03-11', idCard: '001201000101', address: 'Nam Từ Liêm, Hà Nội' },
    { name: 'Trần Quốc Bảo', phone: '0901234502', pass: 'Bao123#', role: 'tenant', email: 'bao.tq@gmail.com', gender: 'Nam', birthdate: '1999-07-20', idCard: '079199000102', address: 'Bình Thạnh, TP. Hồ Chí Minh' },
    { name: 'Phạm Gia Hân', phone: '0901234503', pass: 'Han123#', role: 'tenant', email: 'han.pg@gmail.com', gender: 'Nữ', birthdate: '2000-10-02', idCard: '031200000103', address: 'Sơn Trà, Đà Nẵng' },
    { name: 'Vũ Thành Đạt', phone: '0901234504', pass: 'Dat123#', role: 'tenant', email: 'dat.vt@gmail.com', gender: 'Nam', birthdate: '1998-12-18', idCard: '022198000104', address: 'Lê Chân, Hải Phòng' },
    { name: 'Đỗ Thanh Tâm', phone: '0901234505', pass: 'Tam123#', role: 'tenant', email: 'tam.dt@gmail.com', gender: 'Nữ', birthdate: '2002-05-26', idCard: '001202000105', address: 'Đống Đa, Hà Nội' },
    { name: 'Ngô Hải Nam', phone: '0901234506', pass: 'Nam123#', role: 'tenant', email: 'nam.nh@gmail.com', gender: 'Nam', birthdate: '1997-08-13', idCard: '079197000106', address: 'Thủ Đức, TP. Hồ Chí Minh' },
    { name: 'Bùi Khánh Linh', phone: '0901234507', pass: 'Linh123#', role: 'tenant', email: 'linh.bk@gmail.com', gender: 'Nữ', birthdate: '2001-11-29', idCard: '031201000107', address: 'Liên Chiểu, Đà Nẵng' },
    { name: 'Mai Đức Long', phone: '0901234508', pass: 'Long123#', role: 'tenant', email: 'long.md@gmail.com', gender: 'Nam', birthdate: '1996-09-09', idCard: '022196000108', address: 'Hồng Bàng, Hải Phòng' },
    { name: 'Hoàng Phương Thảo', phone: '0901234509', pass: 'Thao123#', role: 'tenant', email: 'thao.hp@gmail.com', gender: 'Nữ', birthdate: '2000-02-14', idCard: '001200000109', address: 'Ba Đình, Hà Nội' },
    { name: 'Đặng Quốc Huy', phone: '0901234510', pass: 'Huy123#', role: 'tenant', email: 'huy.dq@gmail.com', gender: 'Nam', birthdate: '1999-04-30', idCard: '079199000110', address: 'Gò Vấp, TP. Hồ Chí Minh' }
];

const seedImages = ['img/HaNoi.jpg', 'img/HCM.jpg', 'img/DaNang.jpg', 'img/HaiPhong.webp'];

function getRandomSeedImages(count = 3) {
    const pool = [...seedImages];

    for (let i = pool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, Math.min(count, pool.length));
}

function createSeedRoom(id, title, type, ownerName, ownerPhone, city, district, ward, street, price, area, status = 'available') {
    return {
        id,
        title,
        type,
        price,
        elecPrice: 3800,
        waterPrice: 120000,
        wifiPrice: 100000,
        servicePrice: 150000,
        area,
        ownerName,
        ownerPhone,
        address: `${street}, ${ward}, ${district}, ${city}`,
        city,
        district,
        ward,
        street,
        targets: ['sinh viên', 'người đi làm'],
        amenities: ['nội thất cơ bản', 'điều hòa', 'wifi', 'chỗ để xe'],
        surroundings: ['gần chợ', 'gần trường học', 'gần bến xe'],
        description: `${title} vị trí đẹp, thuận tiện di chuyển, khu vực an ninh, có thể dọn vào ở ngay.`,
        status,
        images: getRandomSeedImages(3),
        contract: null,
        invoices: [],
        lastElectricReading: 0
    };
}

const initialRooms = [
    createSeedRoom('ROOM_SEED_001', 'Phòng trọ khép kín gần Keangnam', 'nhà trọ, phòng trọ', 'Nguyễn Thuận Phong', '0912345601', 'Hà Nội', 'Nam Từ Liêm', 'Mễ Trì', 'Số 18 ngõ 12 Mễ Trì Hạ', 3800000, 24),
    createSeedRoom('ROOM_SEED_002', 'Phòng trọ full nội thất Nguyễn Trãi', 'nhà trọ, phòng trọ', 'Nguyễn Hồng Phúc', '0912345602', 'Hà Nội', 'Thanh Xuân', 'Khương Trung', 'Số 62 Nguyễn Trãi', 4200000, 26),
    createSeedRoom('ROOM_SEED_003', 'Phòng trọ mới xây gần ĐH Bách Khoa', 'nhà trọ, phòng trọ', 'Nguyễn Tiến Thành', '0912345603', 'Hà Nội', 'Hai Bà Trưng', 'Bách Khoa', 'Số 9 Tạ Quang Bửu', 3500000, 22),
    createSeedRoom('ROOM_SEED_004', 'Phòng trọ ban công Quận 7', 'nhà trọ, phòng trọ', 'Hàn Minh Tùng', '0912345604', 'TP. Hồ Chí Minh', 'Quận 7', 'Tân Phong', 'Số 25 đường 17', 4700000, 28),
    createSeedRoom('ROOM_SEED_005', 'Phòng trọ gần cầu Rồng', 'nhà trọ, phòng trọ', 'Ninh Viết Mạnh', '0912345605', 'Đà Nẵng', 'Hải Châu', 'Hòa Cường Bắc', 'Số 105 Núi Thành', 3200000, 20),

    createSeedRoom('ROOM_SEED_006', 'Nhà nguyên căn 2PN Cầu Giấy', 'nhà nguyên căn', 'Nguyễn Thuận Phong', '0912345601', 'Hà Nội', 'Cầu Giấy', 'Dịch Vọng Hậu', 'Số 45 Trần Quốc Vượng', 12000000, 65),
    createSeedRoom('ROOM_SEED_007', 'Nhà nguyên căn gần Lotte Liễu Giai', 'nhà nguyên căn', 'Nguyễn Hồng Phúc', '0912345602', 'Hà Nội', 'Ba Đình', 'Cống Vị', 'Số 12 Liễu Giai', 16500000, 85),
    createSeedRoom('ROOM_SEED_008', 'Nhà nguyên căn hẻm xe hơi Thủ Đức', 'nhà nguyên căn', 'Nguyễn Tiến Thành', '0912345603', 'TP. Hồ Chí Minh', 'Thủ Đức', 'Hiệp Bình Chánh', 'Số 88 đường 23', 14500000, 78),
    createSeedRoom('ROOM_SEED_009', 'Nhà nguyên căn gần biển Mỹ Khê', 'nhà nguyên căn', 'Hàn Minh Tùng', '0912345604', 'Đà Nẵng', 'Sơn Trà', 'An Hải Bắc', 'Số 14 Võ Văn Kiệt', 13000000, 72),
    createSeedRoom('ROOM_SEED_010', 'Nhà nguyên căn trung tâm Hải Phòng', 'nhà nguyên căn', 'Ninh Viết Mạnh', '0912345605', 'Hải Phòng', 'Lê Chân', 'Dư Hàng Kênh', 'Số 31 Tô Hiệu', 11000000, 60),

    createSeedRoom('ROOM_SEED_011', 'Căn hộ studio Landmark View', 'căn hộ', 'Nguyễn Thuận Phong', '0912345601', 'TP. Hồ Chí Minh', 'Bình Thạnh', 'Phường 22', 'Số 208 Nguyễn Hữu Cảnh', 9000000, 35),
    createSeedRoom('ROOM_SEED_012', 'Căn hộ 1PN gần Hồ Tây', 'căn hộ', 'Nguyễn Hồng Phúc', '0912345602', 'Hà Nội', 'Tây Hồ', 'Quảng An', 'Số 52 Xuân Diệu', 10500000, 42),
    createSeedRoom('ROOM_SEED_013', 'Căn hộ mini Nguyễn Văn Linh', 'căn hộ', 'Nguyễn Tiến Thành', '0912345603', 'Đà Nẵng', 'Thanh Khê', 'Chính Gián', 'Số 77 Nguyễn Văn Linh', 7500000, 32),
    createSeedRoom('ROOM_SEED_014', 'Căn hộ 2PN view sông Hàn', 'căn hộ', 'Hàn Minh Tùng', '0912345604', 'Đà Nẵng', 'Hải Châu', 'Bình Hiên', 'Số 2 Bạch Đằng', 14000000, 58),
    createSeedRoom('ROOM_SEED_015', 'Căn hộ cao cấp Vincom Hải Phòng', 'căn hộ', 'Ninh Viết Mạnh', '0912345605', 'Hải Phòng', 'Ngô Quyền', 'Máy Tơ', 'Số 1 Lê Thánh Tông', 12500000, 55),

    createSeedRoom('ROOM_SEED_016', 'Ký túc xá tiện nghi gần ĐH Quốc Gia', 'ký túc xá', 'Nguyễn Thuận Phong', '0912345601', 'Hà Nội', 'Cầu Giấy', 'Dịch Vọng', 'Số 144 Xuân Thủy', 1800000, 18),
    createSeedRoom('ROOM_SEED_017', 'Ký túc xá gần ĐH Kinh Tế TP.HCM', 'ký túc xá', 'Nguyễn Hồng Phúc', '0912345602', 'TP. Hồ Chí Minh', 'Quận 10', 'Phường 12', 'Số 279 Nguyễn Tri Phương', 2200000, 20),
    createSeedRoom('ROOM_SEED_018', 'Ký túc xá sinh viên Bách Khoa Đà Nẵng', 'ký túc xá', 'Nguyễn Tiến Thành', '0912345603', 'Đà Nẵng', 'Liên Chiểu', 'Hòa Khánh Bắc', 'Số 54 Nguyễn Lương Bằng', 1600000, 16),
    createSeedRoom('ROOM_SEED_019', 'Ký túc xá cao cấp Lạch Tray', 'ký túc xá', 'Hàn Minh Tùng', '0912345604', 'Hải Phòng', 'Ngô Quyền', 'Lạch Tray', 'Số 98 Lạch Tray', 2100000, 19),
    createSeedRoom('ROOM_SEED_020', 'Ký túc xá trung tâm Hà Đông', 'ký túc xá', 'Ninh Viết Mạnh', '0912345605', 'Hà Nội', 'Hà Đông', 'Vạn Phúc', 'Số 21 Tố Hữu', 1900000, 18)
];

// --- KHỞI TẠO DỮ LIỆU ---
(function initData() {
    // Đảm bảo luôn có seed room, nhưng không ghi đè dữ liệu user đã tạo.
    const roomDataRaw = localStorage.getItem(ROOMS_KEY);
    const roomData = roomDataRaw ? JSON.parse(roomDataRaw) : null;
    const currentRooms = Array.isArray(roomData) ? roomData : [];

    const existingRoomIds = new Set(currentRooms.map((r) => r && r.id).filter(Boolean));
    const missingSeedRooms = initialRooms.filter((room) => !existingRoomIds.has(room.id));
    if (missingSeedRooms.length > 0 || !Array.isArray(roomData)) {
        localStorage.setItem(ROOMS_KEY, JSON.stringify([...missingSeedRooms, ...currentRooms]));
    }
    
    // Đảm bảo luôn có seed user, nhưng không ghi đè dữ liệu user đã tạo.
    const userDataRaw = localStorage.getItem(USERS_KEY);
    const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
    const currentUsers = Array.isArray(userData) ? userData : [];
    const existingPhones = new Set(currentUsers.map((u) => u && u.phone).filter(Boolean));
    const missingSeedUsers = initialUsers.filter((user) => !existingPhones.has(user.phone));
    if (missingSeedUsers.length > 0 || !Array.isArray(userData)) {
        localStorage.setItem(USERS_KEY, JSON.stringify([...missingSeedUsers, ...currentUsers]));
    }

    // Kho thông báo chung cho toàn hệ thống
    if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    }

    if (!localStorage.getItem(REMEMBER_LOGIN_KEY)) {
        localStorage.setItem(REMEMBER_LOGIN_KEY, JSON.stringify(null));
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

    getRememberedLogin: function() {
        return JSON.parse(localStorage.getItem(REMEMBER_LOGIN_KEY)) || null;
    },

    setRememberedLogin: function(phone, pass) {
        if (!phone || !pass) return;
        localStorage.setItem(REMEMBER_LOGIN_KEY, JSON.stringify({ phone, pass }));
    },

    clearRememberedLogin: function() {
        localStorage.setItem(REMEMBER_LOGIN_KEY, JSON.stringify(null));
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
        window.location.href = 'index.html';
    }
};
