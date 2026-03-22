/**
 * utils.js
 * Helper functions và utilities cho toàn dự án
 */

const Utils = {
    /**
     * Format số tiền theo định dạng tiền tệ Việt Nam
     * @param {number} amount - Số tiền cần format
     * @returns {string} Chuỗi định dạng tiền
     * @example Utils.formatCurrency(5000000) => "5.000.000"
     */
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('vi-VN').format(Number(amount) || 0);
    },
    
    /**
     * Format tiền với ký hiệu "đ" (VND)
     * @param {number} amount - Số tiền cần format
     * @returns {string} "5.000.000đ"
     */
    formatMoney: function(amount) {
        return this.formatCurrency(amount) + 'đ';
    },
    
    /**
     * Format thời gian - hiển thị theo cách "vừa xong", "2 giờ trước", etc.
     * @param {string|Date} isoTime - ISO time string hoặc Date object
     * @returns {string} Chuỗi thời gian định dạng
     */
    formatTimeAgo: function(isoTime) {
        const targetTime = new Date(isoTime || Date.now());
        const now = new Date();
        const diffSeconds = Math.max(0, Math.floor((now.getTime() - targetTime.getTime()) / 1000));
        
        if (diffSeconds < 60) return 'Vừa xong';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
        if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} ngày trước`;
        
        return targetTime.toLocaleString('vi-VN');
    },
    
    /**
     * Sanitize input để tránh XSS attacks
     * @param {string} input - Input cần sanitize
     * @returns {string} Sanitized string
     */
    sanitizeInput: function(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },
    
    /**
     * Tạo unique ID
     * @returns {string} Unique identifier
     */
    generateId: function() {
        return `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    },
    
    /**
     * Debounce function - tránh gọi function quá nhiều lần
     * @param {Function} func - Function cần debounce
     * @param {number} wait - Thời gian chờ (milliseconds)
     * @returns {Function} Debounced function
     * 
     * @example
     * const search = Utils.debounce((query) => {
     *   console.log('Searching:', query);
     * }, 300);
     * 
     * inputElement.addEventListener('input', (e) => {
     *   search(e.target.value);
     * });
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Throttle function - giới hạn tần suất gọi function
     * @param {Function} func - Function cần throttle
     * @param {number} limit - Thời gian tối thiểu giữa các lần gọi (milliseconds)
     * @returns {Function} Throttled function
     */
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Convert File object sang Base64 string
     * @param {File} file - File object
     * @returns {Promise<string>} Base64 string
     */
    convertToBase64: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    /**
     * Validate file - kiểm tra type và size
     * @param {File} file - File object cần kiểm tra
     * @returns {Object} { isValid: boolean, error: string }
     */
    validateFile: function(file) {
        // Kiểm tra type
        if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return {
                isValid: false,
                error: `File type không được hỗ trợ. Cho phép: ${CONFIG.ALLOWED_IMAGE_TYPES.join(', ')}`
            };
        }
        
        // Kiểm tra size
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            const maxSize = Math.round(CONFIG.MAX_FILE_SIZE / 1024 / 1024);
            return {
                isValid: false,
                error: `File quá lớn. Tối đa ${maxSize}MB`
            };
        }
        
        return { isValid: true, error: null };
    },
    
    /**
     * Show toast/alert message
     * @param {string} message - Message cần hiển thị
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {number} duration - Thời gian hiển thị (ms)
     */
    showAlert: function(message, type = 'info', duration = 5000) {
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';
        
        const alertEl = document.createElement('div');
        alertEl.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
        alertEl.style.cssText = 'top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; max-width: 500px;';
        alertEl.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertEl);
        
        if (duration > 0) {
            setTimeout(() => {
                alertEl.remove();
            }, duration);
        }
    },
    
    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess: function(message) {
        this.showAlert(message, 'success', 3000);
    },
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError: function(message) {
        this.showAlert(message, 'error', 5000);
    },
    
    /**
     * Show warning message
     * @param {string} message - Warning message
     */
    showWarning: function(message) {
        this.showAlert(message, 'warning', 4000);
    },
    
    /**
     * Get URL parameters
     * @param {string} paramName - Parameter name
     * @returns {string|null} Parameter value hoặc null
     * 
     * @example
     * // URL: example.com?id=123&name=test
     * Utils.getUrlParam('id') => "123"
     */
    getUrlParam: function(paramName) {
        const params = new URLSearchParams(window.location.search);
        return params.get(paramName);
    },
    
    /**
     * Check xem user có login hay không
     * @returns {boolean} true nếu đã login
     */
    isLoggedIn: function() {
        return Storage.getCurrentUser() !== null;
    },
    
    /**
     * Kiểm tra xem user có role cụ thể không
     * @param {string} role - Role cần kiểm tra ('owner', 'tenant')
     * @returns {boolean} true nếu user có role đó
     */
    hasRole: function(role) {
        const user = Storage.getCurrentUser();
        return user && user.role === role;
    },
    
    /**
     * Clone object (deep copy)
     * @param {Object} obj - Object cần clone
     * @returns {Object} Cloned object
     */
    clone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * Merge objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    merge: function(target, source) {
        return { ...target, ...source };
    },
    
    /**
     * Sleep function - delay execution
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     * 
     * @example
     * await Utils.sleep(1000); // Delay 1 second
     */
    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Normalize string - trim và convert to lowercase
     * @param {string} str - String cần normalize
     * @returns {string} Normalized string
     */
    normalize: function(str) {
        return (str || '').toLowerCase().trim();
    },
    
    /**
     * Remove duplicates từ array
     * @param {Array} array - Array cần remove duplicates
     * @returns {Array} Array không có duplicates
     */
    unique: function(array) {
        return [...new Set(array)];
    },
    
    /**
     * Find index of element trong array
     * @param {Array} array - Array cần tìm
     * @param {Function} predicate - Condition function
     * @returns {number} Index hoặc -1 nếu không tìm thấy
     */
    findIndex: function(array, predicate) {
        for (let i = 0; i < array.length; i++) {
            if (predicate(array[i], i, array)) return i;
        }
        return -1;
    },
    
    /**
     * Scroll to element smoothly
     * @param {Element|string} element - Element hoặc selector string
     * @param {number} offset - Offset từ top (default: 0)
     */
    scrollToElement: function(element, offset = 0) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return;
        
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
};

// ✅ Export cho các file khác sử dụng
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
