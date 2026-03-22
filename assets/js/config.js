/**
 * config.js
 * Centralized configuration file
 * Chứa tất cả constants, regex patterns, và configuration values
 */

const CONFIG = {
    // ============================================
    // UI CONSTANTS
    // ============================================
    HOME_SECTION_LIMIT: 8,
    CATEGORY_PAGE_SIZE: 12,
    NOTIFICATION_REFRESH_INTERVAL: 30000,
    MODAL_ANIMATION_DURATION: 300,
    
    // ============================================
    // FILE UPLOAD SETTINGS
    // ============================================
    MAX_IMAGES: 10,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    
    // ============================================
    // VALIDATION PATTERNS
    // ============================================
    REGEX: {
        PHONE: /^\d{10}$/,
        PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{5,20}$/,
        // Name: Ít nhất 2 từ, chứa chữ và có thể có dấu tiếng Việt
        NAME: /^[a-zA-ZÀ-ỿ\s]{2,}$/,
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    
    VALIDATION: {
        PHONE: 'Số điện thoại phải có 10 chữ số',
        PASSWORD: 'Mật khẩu phải có 5-20 ký tự (hoa, thường, số, ký tự đặc biệt)',
        NAME: 'Tên phải có ít nhất 2 từ, không chứa số hoặc ký tự đặc biệt',
        REQUIRED_FIELD: 'Vui lòng không để trống trường này'
    },
    
    // ============================================
    // PRICE RANGES (VND)
    // ============================================
    PRICE_RANGES: {
        'under-3m': { label: 'Dưới 3 triệu', min: 0, max: 3000000 },
        '3m-5m': { label: '3-5 triệu', min: 3000000, max: 5000000 },
        '5m-10m': { label: '5-10 triệu', min: 5000000, max: 10000000 },
        '10m-20m': { label: '10-20 triệu', min: 10000000, max: 20000000 },
        'over-20m': { label: 'Trên 20 triệu', min: 20000000, max: Infinity }
    },
    
    // ============================================
    // AREA RANGES (m²)
    // ============================================
    AREA_RANGES: {
        'under-20': { label: 'Dưới 20 m²', min: 0, max: 20 },
        '20-40': { label: '20-40 m²', min: 20, max: 40 },
        '40-60': { label: '40-60 m²', min: 40, max: 60 },
        '60-80': { label: '60-80 m²', min: 60, max: 80 },
        'over-80': { label: 'Trên 80 m²', min: 80, max: Infinity }
    },
    
    // ============================================
    // ROOM TYPES
    // ============================================
    ROOM_TYPES: {
        'phong-tro': 'Nhà trọ, phòng trọ',
        'nha-nguyen-can': 'Nhà nguyên căn',
        'can-ho': 'Căn hộ',
        'ky-tuc-xa': 'Ký túc xá'
    },
    
    // ============================================
    // USER ROLES
    // ============================================
    ROLES: {
        OWNER: 'owner',
        TENANT: 'tenant'
    },
    
    ROLE_LABELS: {
        'owner': 'Chủ nhà (Owner)',
        'tenant': 'Khách thuê (Tenant)'
    },
    
    // ============================================
    // API ENDPOINTS
    // ============================================
    API: {
        PROVINCE: 'https://provinces.open-api.vn/api/',
        PROVINCE_DEPTH1: 'https://provinces.open-api.vn/api/?depth=1',
        PROVINCE_PATTERN: 'https://provinces.open-api.vn/api/p/{code}?depth=2',
        DISTRICT_PATTERN: 'https://provinces.open-api.vn/api/d/{code}?depth=2'
    },
    
    // ============================================
    // NOTIFICATION TYPES & CATEGORIES
    // ============================================
    NOTIFICATION_TYPES: {
        HOUSING: 'housing',
        PAYMENT: 'payment',
        PROMO: 'promo',
        ACCOUNT: 'account'
    },
    
    NOTIFICATION_TABS: [
        { key: 'all', label: 'Tất cả' },
        { key: 'housing', label: 'Hoạt động Trọ' },
        { key: 'payment', label: 'Giao dịch' },
        { key: 'promo', label: 'Khuyến mãi' },
        { key: 'account', label: 'Tài khoản' }
    ],
    
    // ============================================
    // INVOICE STATUS
    // ============================================
    INVOICE_STATUS: {
        UNPAID: 'unpaid',
        PAID: 'paid',
        OVERDUE: 'overdue',
        CANCELLED: 'cancelled'
    },
    
    INVOICE_STATUS_LABELS: {
        'unpaid': 'Chưa thanh toán',
        'paid': 'Đã thanh toán',
        'overdue': 'Quá hạn',
        'cancelled': 'Hủy'
    },
    
    // ============================================
    // ROOM STATUS
    // ============================================
    ROOM_STATUS: {
        AVAILABLE: 'available',
        RENTED: 'rented',
        MAINTENANCE: 'maintenance'
    },
    
    ROOM_STATUS_LABELS: {
        'available': 'Còn trống',
        'rented': 'Đã thuê',
        'maintenance': 'Bảo trì'
    },
    
    // ============================================
    // PAGINATION
    // ============================================
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 12,
        DEFAULT_PAGE: 1
    },
    
    // ============================================
    // ERROR MESSAGES
    // ============================================
    MESSAGES: {
        ERROR_LOAD_DATA: 'Lỗi khi tải dữ liệu. Vui lòng thử lại.',
        ERROR_SAVE_DATA: 'Lỗi khi lưu dữ liệu. Vui lòng thử lại.',
        ERROR_DELETE_DATA: 'Lỗi khi xóa dữ liệu. Vui lòng thử lại.',
        ERROR_NETWORK: 'Lỗi kết nối. Vui lòng kiểm tra internet.',
        SUCCESS_SAVE: 'Lưu dữ liệu thành công!',
        SUCCESS_DELETE: 'Xóa dữ liệu thành công!',
        CONFIRM_DELETE: 'Bạn có chắc muốn xóa?',
        UNAUTHORIZED: 'Bạn không có quyền truy cập trang này!',
        LOGIN_REQUIRED: 'Vui lòng đăng nhập để tiếp tục.'
    },
    
    // ============================================
    // TIME CONSTANTS (milieconds)
    // ============================================
    TIME: {
        ALERT_DURATION: 5000,  // 5s
        TOAST_DURATION: 3000,  // 3s
        DEBOUNCE_SEARCH: 300,  // 300ms
        API_TIMEOUT: 10000     // 10s
    },
    
    // ============================================
    // FEATURES TOGGLE
    // ============================================
    FEATURES: {
        ENABLE_FAVORITES: true,
        ENABLE_SEARCH_HISTORY: true,
        ENABLE_NOTIFICATIONS: true,
        ENABLE_CHAT: false,  // Not implemented yet
        ENABLE_VIDEO_TOUR: false  // Not implemented yet
    }
};

// ✅ Export cho các file khác sử dụng
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
