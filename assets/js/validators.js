/**
 * validators.js
 * Centralized validation functions
 * Tất cả logic validation được tập trung ở đây để dễ maintain
 */

const Validators = {
    /**
     * Kiểm tra số điện thoại (10 chữ số)
     * @param {string} phone - Số điện thoại cần kiểm tra
     * @returns {boolean} true nếu hợp lệ
     */
    phone: function(phone) {
        if (typeof phone !== 'string') return false;
        return CONFIG.REGEX.PHONE.test(phone.trim());
    },
    
    /**
     * Kiểm tra mật khẩu (5-20 ký tự, chứa hoa, thường, số, ký tự đặc biệt)
     * @param {string} password - Mật khẩu cần kiểm tra
     * @returns {boolean} true nếu hợp lệ
     */
    password: function(password) {
        if (typeof password !== 'string') return false;
        return CONFIG.REGEX.PASSWORD.test(password);
    },
    
    /**
     * Kiểm tra tên (ít nhất 2 từ, không chứa số)
     * @param {string} name - Tên cần kiểm tra
     * @returns {boolean} true nếu hợp lệ
     */
    name: function(name) {
        if (typeof name !== 'string') return false;
        const trimmed = name.trim();
        const parts = trimmed.split(/\s+/);
        
        // Kiểm tra ít nhất 2 từ
        if (parts.length < 2) return false;
        
        // Kiểm tra format (không chứa số và ký tự đặc biệt)
        return /^[a-zA-ZÀ-ỿ\s]+$/.test(trimmed);
    },
    
    /**
     * Kiểm tra email
     * @param {string} email - Email cần kiểm tra
     * @returns {boolean} true nếu hợp lệ
     */
    email: function(email) {
        if (typeof email !== 'string') return false;
        return CONFIG.REGEX.EMAIL.test(email.trim());
    },
    
    /**
     * Kiểm tra xem string có trống hay không
     * @param {string} value - String cần kiểm tra
     * @returns {boolean} true nếu không trống
     */
    notEmpty: function(value) {
        return typeof value === 'string' && value.trim().length > 0;
    },
    
    /**
     * Kiểm tra xem số có hợp lệ không
     * @param {number|string} value - Giá trị cần kiểm tra
     * @param {number} min - Giá trị tối thiểu (optional)
     * @param {number} max - Giá trị tối đa (optional)
     * @returns {boolean} true nếu hợp lệ
     */
    positiveNumber: function(value, min = 0, max = Infinity) {
        const num = Number(value);
        return Number.isFinite(num) && num >= min && num <= max;
    },
    
    /**
     * Kiểm tra độ dài của string
     * @param {string} value - String cần kiểm tra
     * @param {number} min - Độ dài tối thiểu
     * @param {number} max - Độ dài tối đa
     * @returns {boolean} true nếu độ dài hợp lệ
     */
    length: function(value, min = 1, max = Infinity) {
        if (typeof value !== 'string') return false;
        const len = value.trim().length;
        return len >= min && len <= max;
    },
    
    /**
     * Kiểm tra xem array có chứa các required fields không
     * @param {Array} array - Array cần kiểm tra
     * @param {Array} requiredFields - Danh sách fields bắt buộc
     * @returns {boolean} true nếu hợp lệ
     */
    arrayHasRequiredFields: function(array, requiredFields) {
        if (!Array.isArray(array)) return false;
        return array.length > 0 && array.every(item =>
            requiredFields.every(field => item[field] && item[field].toString().trim())
        );
    },
    
    /**
     * Validation form object
     * @param {Object} formData - Object chứa dữ liệu form
     * @param {Object} rules - Object chứa validation rules
     * @returns {Object} { isValid: boolean, errors: Object }
     * 
     * @example
     * const formData = { phone: '0123456789', password: 'Abc123!@#' };
     * const rules = {
     *   phone: { type: 'phone', required: true },
     *   password: { type: 'password', required: true }
     * };
     * const result = Validators.validateForm(formData, rules);
     */
    validateForm: function(formData, rules) {
        const errors = {};
        
        for (const field in rules) {
            if (!rules.hasOwnProperty(field)) continue;
            
            const rule = rules[field];
            const value = formData[field];
            
            // Check required
            if (rule.required && !this.notEmpty(value)) {
                errors[field] = `${field} là bắt buộc`;
                continue;
            }
            
            // If not required and empty, skip other validations
            if (!rule.required && !this.notEmpty(value)) {
                continue;
            }
            
            // Check by type
            switch (rule.type) {
                case 'phone':
                    if (!this.phone(value)) {
                        errors[field] = CONFIG.VALIDATION.PHONE;
                    }
                    break;
                    
                case 'password':
                    if (!this.password(value)) {
                        errors[field] = CONFIG.VALIDATION.PASSWORD;
                    }
                    break;
                    
                case 'name':
                    if (!this.name(value)) {
                        errors[field] = CONFIG.VALIDATION.NAME;
                    }
                    break;
                    
                case 'email':
                    if (!this.email(value)) {
                        errors[field] = `Email không hợp lệ`;
                    }
                    break;
                    
                case 'number':
                    const min = rule.min || 0;
                    const max = rule.max || Infinity;
                    if (!this.positiveNumber(value, min, max)) {
                        errors[field] = `Vui lòng nhập số từ ${min} đến ${max}`;
                    }
                    break;
                    
                case 'select':
                    if (!value || value === '' || value === 'all') {
                        errors[field] = `Vui lòng chọn ${field}`;
                    }
                    break;
                    
                case 'text':
                    if (rule.minLength && !this.length(value, rule.minLength)) {
                        errors[field] = `Tối thiểu ${rule.minLength} ký tự`;
                    }
                    if (rule.maxLength && !this.length(value, 0, rule.maxLength)) {
                        errors[field] = `Tối đa ${rule.maxLength} ký tự`;
                    }
                    break;
            }
            
            // Custom validation function
            if (rule.custom && typeof rule.custom === 'function') {
                const customError = rule.custom(value);
                if (customError) {
                    errors[field] = customError;
                }
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    },
    
    /**
     * Validate room data
     * @param {Object} room - Room object
     * @returns {boolean} true nếu room data hợp lệ
     */
    isRoomValid: function(room) {
        return room
            && this.notEmpty(room.title)
            && this.notEmpty(room.type)
            && this.notEmpty(room.address)
            && Array.isArray(room.images) && room.images.length > 0
            && this.positiveNumber(room.price)
            && this.positiveNumber(room.area);
    },
    
    /**
     * Validate user data
     * @param {Object} user - User object
     * @returns {boolean} true nếu user data hợp lệ
     */
    isUserValid: function(user) {
        return user
            && this.notEmpty(user.name)
            && this.phone(user.phone)
            && this.notEmpty(user.pass)
            && (user.role === CONFIG.ROLES.OWNER || user.role === CONFIG.ROLES.TENANT);
    }
};

// ✅ Export cho các file khác sử dụng
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
}
