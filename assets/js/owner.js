/**
 * owner.js
 * Logic xử lý cho trang chu-tro.html
 */

// 1. CHECK QUYỀN TRUY CẬP
const currentUser = Storage.getCurrentUser();
if (!currentUser || currentUser.role !== 'owner') {
    alert('Bạn không có quyền truy cập trang này!');
    window.location.href = 'trang-chu.html';
}

// 2. BIẾN TOÀN CỤC
let roomModal;
let contractModal;
let endContractModal;
let roomActionModal;
let invoiceModal;
let selectedRoomActionId = null;
let ownerActionGalleryState = {
    images: [],
    index: 0
};
let selectedImages = [];
// let map, marker;
// let defaultLocation = { lat: 21.0285, lng: 105.8542 }; // Hà Nội

document.addEventListener('DOMContentLoaded', () => {
    roomModal = new bootstrap.Modal(document.getElementById('roomModal'));
    contractModal = new bootstrap.Modal(document.getElementById('contractModal'));
    endContractModal = new bootstrap.Modal(document.getElementById('endContractModal'));
    roomActionModal = new bootstrap.Modal(document.getElementById('roomActionModal'));
    invoiceModal = new bootstrap.Modal(document.getElementById('invoiceModal'));
    renderTable();
    renderOwnerNotifications();
    setInterval(renderOwnerNotifications, 30000);

    // Sự kiện tìm kiếm & lọc
    document.getElementById('searchInput').addEventListener('input', renderTable);
    document.getElementById('statusFilter').addEventListener('change', renderTable);
    
    // Init Location Data
    fetchProvinces();
    initImageUploadHandlers();

    const tenantPhoneInput = document.getElementById('tenantPhone');
    if (tenantPhoneInput) {
        tenantPhoneInput.addEventListener('input', autoFillTenantNameByPhone);
        tenantPhoneInput.addEventListener('blur', autoFillTenantNameByPhone);
    }

    document.querySelectorAll('.invoice-calc').forEach((input) => {
        input.addEventListener('input', recalculateInvoice);
    });
    
    // Fix map rendering issue when modal opens
    /*
    document.getElementById('roomModal').addEventListener('shown.bs.modal', () => {
        if(map) {
            google.maps.event.trigger(map, 'resize');
            // Re-center map if there's a marker
            if (marker && marker.getPosition()) {
                map.setCenter(marker.getPosition());
            } else {
                map.setCenter(defaultLocation);
            }
        }
    });
    */
});

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

function isNonEmptyText(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) && num > 0;
}

function isNonNegativeNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0;
}

function initImageUploadHandlers() {
    const uploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('roomImages');

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleImageSelection(e.target.files));

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-success');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('border-success');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-success');
        handleImageSelection(e.dataTransfer.files);
    });
}

async function handleImageSelection(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    clearValidationMessage();

    for (const file of files) {
        if (selectedImages.length >= MAX_IMAGES) {
            showValidationMessage(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh.`, 'warning');
            break;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            showValidationMessage(`File ${file.name} không đúng định dạng ảnh.`, 'danger');
            continue;
        }

        if (file.size > MAX_FILE_SIZE) {
            showValidationMessage(`File ${file.name} vượt quá 5MB.`, 'danger');
            continue;
        }

        try {
            const base64 = await convertBase64(file);
            selectedImages.push({
                name: file.name,
                size: file.size,
                base64: base64
            });
        } catch (error) {
            console.error(error);
            showValidationMessage(`Không thể xử lý file ${file.name}.`, 'danger');
        }
    }

    renderImagePreview();
    document.getElementById('roomImages').value = '';
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    renderImagePreview();
}

window.removeImage = removeImage;

function renderImagePreview() {
    const container = document.getElementById('imagePreviewContainer');
    const prompt = document.getElementById('uploadPrompt');
    if (!container || !prompt) return;

    if (selectedImages.length === 0) {
        container.innerHTML = '';
        prompt.style.display = 'block';
        return;
    }

    prompt.style.display = 'none';

    const cards = selectedImages.map((img, index) => {
        const sizeMb = img.size ? `${(img.size / 1024 / 1024).toFixed(2)}MB` : 'Ảnh cũ';
        return `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card h-100 shadow-sm position-relative">
                    <img src="${img.base64}" alt="${img.name || 'room-image'}" class="card-img-top" style="height: 140px; object-fit: cover;">
                    <div class="card-body p-2">
                        <div class="small text-truncate" title="${img.name || 'Ảnh đã lưu'}">${img.name || 'Ảnh đã lưu'}</div>
                        <div class="text-muted small">${sizeMb}</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" onclick="removeImage(${index})">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <small class="text-muted fw-semibold">Đã chọn ${selectedImages.length}/${MAX_IMAGES} ảnh</small>
        </div>
        <div class="row g-2">${cards}</div>
    `;
}

function showValidationMessage(message, type) {
    const msg = document.getElementById('imageValidationMsg');
    if (!msg) return;
    msg.className = `alert alert-${type} mt-2`;
    msg.textContent = message;
    msg.classList.remove('d-none');
}

function clearValidationMessage() {
    const msg = document.getElementById('imageValidationMsg');
    if (!msg) return;
    msg.classList.add('d-none');
    msg.textContent = '';
}

/*
window.initAdminMap = function() {
    map = new google.maps.Map(document.getElementById('adminMap'), {
        center: defaultLocation,
        zoom: 13
    });

    marker = new google.maps.Marker({
        map: map,
        draggable: true
    });

    // Update Init inputs on drag end
    marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        document.getElementById('roomLat').value = pos.lat();
        document.getElementById('roomLng').value = pos.lng();
    });

    // Move marker on click
    map.addListener('click', (e) => {
        moveMarker(e.latLng);
    });
};

function moveMarker(latLng) {
    marker.setPosition(latLng);
    document.getElementById('roomLat').value = latLng.lat();
    document.getElementById('roomLng').value = latLng.lng();
}
*/

// --- DATA CÁC TỈNH/THÀNH (API) ---
const PROVINCE_API = 'https://provinces.open-api.vn/api/';

// Helper: Sắp xếp theo tên
const sortByName = (a, b) => a.name.localeCompare(b.name);

// 1. Fetch Tỉnh/Thành
async function fetchProvinces() {
    const citySel = document.getElementById('addrCity');
    try {
        const res = await fetch(PROVINCE_API + '?depth=1');
        const data = await res.json();
        
        data.sort(sortByName);

        let html = '<option value="">-- Tỉnh/Thành --</option>';
        data.forEach(item => {
            html += `<option value="${item.name}" data-code="${item.code}">${item.name}</option>`;
        });
        citySel.innerHTML = html;
    } catch (error) {
        console.error('Lỗi tải tỉnh thành:', error);
        citySel.innerHTML = '<option value="">Lỗi kết nối API</option>';
    }
}

// 2. Fetch Quận/Huyện
window.loadDistricts = async function() {
    const citySel = document.getElementById('addrCity');
    const distSel = document.getElementById('addrDistrict');
    const wardSel = document.getElementById('addrWard');
    
    // UI Loading state
    distSel.disabled = true;
    wardSel.disabled = true;
    distSel.innerHTML = '<option value="">Đang tải...</option>';
    wardSel.innerHTML = '<option value="">-- Phường/Xã --</option>';

    // Lấy code an toàn
    const selectedIndex = citySel.selectedIndex;
    if (selectedIndex < 0) return;
    
    const option = citySel.options[selectedIndex];
    const code = option.dataset.code;

    if (!code) {
        distSel.innerHTML = '<option value="">-- Quận/Huyện --</option>';
        return;
    }

    try {
        const res = await fetch(`${PROVINCE_API}p/${code}?depth=2`);
        const data = await res.json();
        
        if (data.districts && data.districts.length > 0) {
            data.districts.sort(sortByName);
            let html = '<option value="">-- Quận/Huyện --</option>';
            data.districts.forEach(item => {
                html += `<option value="${item.name}" data-code="${item.code}">${item.name}</option>`;
            });
            distSel.innerHTML = html;
            distSel.disabled = false;
        } else {
            distSel.innerHTML = '<option value="">Không có dữ liệu</option>';
        }
    } catch (error) {
        console.error('Lỗi tải quận huyện:', error);
        distSel.innerHTML = '<option value="">Lỗi API</option>';
    }
}

// 3. Fetch Phường/Xã
window.loadWards = async function() {
    const distSel = document.getElementById('addrDistrict');
    const wardSel = document.getElementById('addrWard');

    // UI Loading state
    wardSel.disabled = true;
    wardSel.innerHTML = '<option value="">Đang tải...</option>';

    const selectedIndex = distSel.selectedIndex;
    if (selectedIndex < 0) return;

    const option = distSel.options[selectedIndex];
    const code = option.dataset.code;

    if (!code) {
        wardSel.innerHTML = '<option value="">-- Phường/Xã --</option>';
        return;
    }

    try {
        const res = await fetch(`${PROVINCE_API}d/${code}?depth=2`);
        const data = await res.json();
        
        if (data.wards && data.wards.length > 0) {
            data.wards.sort(sortByName);
            let html = '<option value="">-- Phường/Xã --</option>';
            data.wards.forEach(item => {
                html += `<option value="${item.name}">${item.name}</option>`;
            });
            wardSel.innerHTML = html;
            wardSel.disabled = false;
        } else {
            wardSel.innerHTML = '<option value="">Không có dữ liệu</option>';
        }
    } catch (error) {
        console.error('Lỗi tải phường xã:', error);
        wardSel.innerHTML = '<option value="">Lỗi API</option>';
    }
}

// Helper set giá trị cho Select (Dùng khi Edit)
function setSelectValue(id, value) {
    const select = document.getElementById(id);
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === value) {
            select.selectedIndex = i;
            return true;
        }
    }
    return false;
}



// 3. RENDER DANH SÁCH PHÒNG
function renderTable() {
    const keyword = (document.getElementById('searchInput').value || '').toLowerCase().trim();
    const filter = document.getElementById('statusFilter').value;
    const listEl = document.getElementById('ownerRoomList');
    const emptyEl = document.getElementById('ownerEmptyState');
    const rooms = Storage.getRooms();

    const ownerRooms = rooms.filter((room) => {
        if (room.ownerPhone) return room.ownerPhone === currentUser.phone;
        return true;
    });

    const filteredRooms = ownerRooms.filter((room) => {
        const title = (room.title || '').toLowerCase();
        const address = (room.address || '').toLowerCase();
        const matchKeyword = title.includes(keyword) || address.includes(keyword);
        const matchStatus = filter === 'all' || room.status === filter;
        return matchKeyword && matchStatus;
    });

    if (filteredRooms.length === 0) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('d-none');
        return;
    }

    emptyEl.classList.add('d-none');
    listEl.innerHTML = filteredRooms.map((room) => buildOwnerRoomCard(room)).join('');
}

function buildOwnerRoomCard(room) {
    const price = new Intl.NumberFormat('vi-VN').format(Number(room.price) || 0);
    const area = Number(room.area) || 0;
    const locationText = room.address;
    const image = Array.isArray(room.images) && room.images.length > 0 ? room.images[0] : '';
    const statusBadge = room.status === 'available'
        ? '<span class="badge bg-success">Còn trống</span>'
        : '<span class="badge bg-secondary">Đã thuê</span>';

    return `
        <article class="category-room-card owner-room-card" onclick="openRoomActionModalById('${room.id}')">
            <div class="category-room-image-wrap">
                <img src="${image}" alt="${room.title}" class="category-room-image">
            </div>
            <div class="category-room-content">
                <div class="d-flex justify-content-between gap-2 align-items-start mb-1">
                    <h4 class="category-room-title mb-0">${room.title}</h4>
                    ${statusBadge}
                </div>
                <div class="category-room-price">${price}đ/tháng</div>
                <div class="category-room-tags">
                    <span>${room.type}</span>
                    <span>${area}m²</span>
                </div>
                <div class="category-room-location"><i class="fa-solid fa-location-dot"></i> ${locationText}</div>
            </div>
        </article>
    `;
}

// 4. MỞ MODAL THÊM MỚI
function openModal() {
    document.getElementById('roomForm').reset();
    document.getElementById('roomId').value = '';

    selectedImages = [];
    clearValidationMessage();
    renderImagePreview();
    const fileInput = document.getElementById('roomImages');
    if (fileInput) fileInput.value = '';
    
    // Reset Select boxes
    document.getElementById('addrCity').value = '';
    loadDistricts(); // Reset district & ward
    
    // Reset Map
    /*
    document.getElementById('roomLat').value = '';
    document.getElementById('roomLng').value = '';
    if(marker) marker.setPosition(null);
    if(map) map.setCenter(defaultLocation);
    */

    document.getElementById('modalTitle').innerText = 'Thêm phòng mới';
    roomModal.show();
}

// 5. MỞ MODAL SỬA
async function editRoom(id) {
    const room = Storage.getRoomById(id);
    if (room) {
        document.getElementById('roomId').value = room.id;
        document.getElementById('roomTitle').value = room.title;
        document.getElementById('roomType').value = room.type;
        document.getElementById('roomPrice').value = room.price;
        document.getElementById('roomElecPrice').value = room.elecPrice || '';
        document.getElementById('roomWaterPrice').value = room.waterPrice || '';
        document.getElementById('roomWifiPrice').value = room.wifiPrice || '';
        document.getElementById('roomServicePrice').value = room.servicePrice || '';
        document.getElementById('roomArea').value = room.area;

        // Reset & Populate Checkboxes
        const setChecked = (containerId, values) => {
            document.querySelectorAll(`#${containerId} input[type="checkbox"]`).forEach(cb => {
                cb.checked = values && values.includes(cb.value);
            });
        };
        setChecked('targetCheckboxes', room.targets);
        setChecked('amenityCheckboxes', room.amenities);
        setChecked('surroundingCheckboxes', room.surroundings);

        // Map Data
        /*
        if (room.lat && room.lng) {
            const loc = { lat: parseFloat(room.lat), lng: parseFloat(room.lng) };
            moveMarker(new google.maps.LatLng(loc.lat, loc.lng));
            if(map) map.setCenter(loc);
        } else {
            // No saved location, can try to geocode here if we wanted
            if(marker) marker.setPosition(null);
        }
        */

        const cityFound = setSelectValue('addrCity', room.city);
        if (cityFound) {
            await window.loadDistricts();
            const distFound = setSelectValue('addrDistrict', room.district);
            if (distFound) {
                await window.loadWards();
                setSelectValue('addrWard', room.ward);
            }
        }
        document.getElementById('addrStreet').value = room.street;
        
        document.getElementById('roomDesc').value = room.description || '';
        document.getElementById('roomStatus').value = room.status;

        selectedImages = [];
        if (Array.isArray(room.images) && room.images.length > 0) {
            selectedImages = room.images.map((src, idx) => ({
                name: `image-${idx + 1}`,
                size: 0,
                base64: src
            }));
        }
        clearValidationMessage();
        renderImagePreview();
        const fileInput = document.getElementById('roomImages');
        if (fileInput) fileInput.value = '';
        
        document.getElementById('modalTitle').innerText = 'Cập nhật thông tin';
        roomModal.show();
    }
}

// Helper: Đọc file ảnh sang Base64 và Nén ảnh (để hỗ trợ file lớn > 10MB)
const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);

        fileReader.onload = (event) => {
            // Tạo Image object để xử lý resize/nén
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                // Tạo canvas để vẽ lại ảnh
                const canvas = document.createElement('canvas');
                
                // Tính toán kích thước mới (Max width 1024px để giảm dung lượng)
                const MAX_WIDTH = 1024;
                let width = img.width;
                let height = img.height;
                
                if (width > MAX_WIDTH) {
                    height = height * (MAX_WIDTH / width);
                    width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Xuất ra Base64 với định dạng JPEG và chất lượng 0.7
                // Điều này giúp file 10MB -> ~100-200KB, lưu được vào LocalStorage
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedDataUrl);
            };
            
            img.onerror = (error) => reject(error);
        };

        fileReader.onerror = (error) => {
            reject(error);
        };
    });
};

// 6. LƯU DỮ LIỆU (CREATE / UPDATE)
function getCheckedValues(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

async function saveRoom() {
    const id = document.getElementById('roomId').value;
    const title = document.getElementById('roomTitle').value.trim();
    const roomType = document.getElementById('roomType').value;
    const roomStatus = document.getElementById('roomStatus').value;
    const price = document.getElementById('roomPrice').value;
    const elecPrice = document.getElementById('roomElecPrice').value;
    const waterPrice = document.getElementById('roomWaterPrice').value;
    const wifiPrice = document.getElementById('roomWifiPrice').value;
    const servicePrice = document.getElementById('roomServicePrice').value;
    const area = document.getElementById('roomArea').value;
    const description = document.getElementById('roomDesc').value.trim();

    // Lấy thông tin địa chỉ
    const city = document.getElementById('addrCity').value;
    const district = document.getElementById('addrDistrict').value;
    const ward = document.getElementById('addrWard').value;
    const street = document.getElementById('addrStreet').value.trim();

    // Validate cơ bản
    if (!isNonEmptyText(title)) return alert('Vui lòng nhập Tên phòng!');
    if (!isNonEmptyText(roomType)) return alert('Vui lòng chọn Loại hình phòng!');
    if (!isPositiveNumber(price)) return alert('Giá tiền phải là số lớn hơn 0.');
    if (!isPositiveNumber(area)) return alert('Diện tích phải là số lớn hơn 0.');
    
    if (!city || !district || !ward) return alert('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã!');
    if (!street) return alert('Vui lòng nhập địa chỉ cụ thể (Số nhà, đường)!');

    /*
    const lat = document.getElementById('roomLat').value;
    const lng = document.getElementById('roomLng').value;
    if (!lat || !lng) return alert('Vui lòng chọn vị trí trên bản đồ!');
    */

    if (!isNonEmptyText(description)) return alert('Vui lòng nhập Mô tả!');
    if (!isNonEmptyText(roomStatus)) return alert('Vui lòng chọn Trạng thái!');

    if (!isNonNegativeNumber(elecPrice) || !isNonNegativeNumber(waterPrice) || !isNonNegativeNumber(wifiPrice) || !isNonNegativeNumber(servicePrice)) {
        return alert('Các giá điện/nước/wifi/dịch vụ phải là số không âm.');
    }

    // Ghép địa chỉ hiển thị
    // Ưu tiên: Số nhà, Phường, Quận, TP
    let fullAddress = street;
    if (ward) fullAddress += `, ${ward}`;
    if (district) fullAddress += `, ${district}`;
    if (city) fullAddress += `, ${city}`;
    
    // Nếu người dùng không chọn gì cả mà chỉ nhập street (hoặc để trống street) thì vẫn lấy fullAddress
    if(fullAddress.startsWith(', ')) fullAddress = fullAddress.substring(2);

    // Xử lý ảnh
        if (selectedImages.length === 0) {
            return alert('Vui lòng chọn ít nhất 1 ảnh cho phòng!');
        }

        // Xử lý ảnh: Chuyển toàn bộ selectedImages thành mảng base64
        const imagesArray = selectedImages.map(img => img.base64);

    // Xử lý Checkboxes
    const targets = getCheckedValues('targetCheckboxes');
    const amenities = getCheckedValues('amenityCheckboxes');
    const surroundings = getCheckedValues('surroundingCheckboxes');

    const currentUser = Storage.getCurrentUser();
    if (!currentUser || !isNonEmptyText(currentUser.name) || !isNonEmptyText(currentUser.phone)) {
        return alert('Thông tin chủ trọ không hợp lệ. Vui lòng đăng nhập lại.');
    }

    const existingRoom = id ? Storage.getRoomById(id) : null;
    if (id && !existingRoom) return alert('Không tìm thấy dữ liệu phòng để cập nhật.');

    const ownerName = currentUser.name;
    const ownerPhone = currentUser.phone;

    const roomData = {
        id: id || 'ROOM_' + Date.now(),
        title: title,
        type: roomType,
        price: Number(price),
        elecPrice: Number(elecPrice) || 0,
        waterPrice: Number(waterPrice) || 0,
        wifiPrice: Number(wifiPrice) || 0,
        servicePrice: Number(servicePrice) || 0,
        area: area,
        ownerName: ownerName,
        ownerPhone: ownerPhone,
        address: fullAddress,
        
        city: city,
        district: district,
        ward: ward,
        street: street,
        // lat: lat,
        // lng: lng,

        targets: targets,
        amenities: amenities,
        surroundings: surroundings,

        description: description,
        status: roomStatus,
        images: imagesArray,
        contract: existingRoom ? (existingRoom.contract || null) : null,
        invoices: existingRoom ? (existingRoom.invoices || []) : [],
        lastElectricReading: existingRoom ? (existingRoom.lastElectricReading || 0) : 0
    };

    try {
        if (id) {
            // Có ID -> Gọi Update
            Storage.updateRoom(roomData);
            alert('Cập nhật thành công!');
        } else {
            // Không ID -> Gọi Add
            Storage.addRoom(roomData);
            alert('Thêm mới thành công!');
        }
        roomModal.hide();
        renderTable(); // Vẽ lại bảng
    } catch (e) {
        console.error(e);
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            alert('Lỗi: Dung lượng lưu trữ đầy! Vui lòng chọn ảnh nhỏ hơn hoặc xóa bớt dữ liệu.');
        } else {
            alert('Có lỗi xảy ra khi lưu dữ liệu: ' + e.message);
        }
    }
}

function openContractModal(roomId) {
    const room = Storage.getRoomById(roomId);
    if (!room) {
        alert('Không tìm thấy phòng trọ!');
        return;
    }

    const form = document.getElementById('contractForm');
    if (form) form.reset();

    document.getElementById('contractRoomId').value = room.id;
    document.getElementById('contractRoomTitle').textContent = `Phòng: ${room.title}`;
    document.getElementById('tenantLookupStatus').textContent = '';

    const existingInfo = document.getElementById('existingContractInfo');
    existingInfo.classList.add('d-none');
    document.getElementById('contractFile').required = true;

    if (room.contract) {
        document.getElementById('tenantPhone').value = room.contract.tenantPhone || '';
        document.getElementById('tenantName').value = room.contract.tenantName || '';
        existingInfo.classList.remove('d-none');
        existingInfo.textContent = `Đã có hợp đồng: ${room.contract.fileName || 'contract.pdf'}. Bạn có thể chọn PDF mới để thay thế.`;
        document.getElementById('contractFile').required = false;
    }

    contractModal.show();
}

function autoFillTenantNameByPhone() {
    const phoneInput = document.getElementById('tenantPhone');
    const nameInput = document.getElementById('tenantName');
    const statusEl = document.getElementById('tenantLookupStatus');

    const phone = (phoneInput.value || '').trim();
    if (!phone) {
        statusEl.textContent = '';
        return;
    }

    const user = Storage.getUserByPhone(phone);
    if (user) {
        nameInput.value = user.name || '';
        statusEl.className = 'form-text text-success';
        statusEl.textContent = 'Đã tìm thấy khách hàng trong hệ thống.';
    } else {
        statusEl.className = 'form-text text-warning';
        statusEl.textContent = 'Chưa tìm thấy số điện thoại trong hệ thống, bạn có thể nhập tên thủ công.';
    }
}

function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
}

async function saveContract() {
    const roomId = document.getElementById('contractRoomId').value;
    const tenantPhone = (document.getElementById('tenantPhone').value || '').trim();
    const tenantName = (document.getElementById('tenantName').value || '').trim();
    const fileInput = document.getElementById('contractFile');

    if (!roomId) return alert('Không xác định được phòng trọ.');
    if (!/^\d{10}$/.test(tenantPhone)) return alert('Số điện thoại khách phải gồm đúng 10 chữ số.');
    if (!tenantName) return alert('Vui lòng nhập tên khách thuê.');

    const room = Storage.getRoomById(roomId);
    if (!room) return alert('Không tìm thấy phòng trọ.');

    const tenantUser = Storage.getUserByPhone(tenantPhone);
    if (!tenantUser || tenantUser.role !== 'tenant') {
        return alert('Số điện thoại khách thuê phải tồn tại trong hệ thống với vai trò Khách thuê.');
    }

    let contractFileName = room.contract?.fileName || '';
    let contractFileData = room.contract?.fileData || '';

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const isPdfType = file.type === 'application/pdf';
        const isPdfExt = /\.pdf$/i.test(file.name);

        if (!isPdfType && !isPdfExt) {
            return alert('Chỉ nhận file PDF cho hợp đồng.');
        }

        try {
            contractFileData = await convertFileToBase64(file);
            contractFileName = file.name;
        } catch (error) {
            console.error(error);
            return alert('Không thể đọc file hợp đồng PDF.');
        }
    } else if (!contractFileData) {
        return alert('Vui lòng tải lên hợp đồng PDF.');
    }

    const updatedRoom = {
        ...room,
        status: 'rented',
        contract: {
            tenantName,
            tenantPhone,
            fileName: contractFileName,
            fileData: contractFileData,
            updatedAt: new Date().toISOString(),
            createdAt: room.contract?.createdAt || new Date().toISOString()
        }
    };

    try {
        Storage.updateRoom(updatedRoom);
        Storage.addNotification({
            toPhone: tenantPhone,
            fromPhone: currentUser.phone,
            type: 'contract_created',
            title: 'Hợp đồng mới',
            message: `Chủ trọ đã tạo/cập nhật hợp đồng cho phòng ${room.title}.`,
            meta: {
                roomId: room.id,
                roomTitle: room.title
            }
        });
        contractModal.hide();
        renderTable();
        renderOwnerNotifications();
        alert('Tạo hợp đồng thành công!');
    } catch (error) {
        console.error(error);
        alert('Không thể lưu hợp đồng. Vui lòng thử lại.');
    }
}

function openRoomActionModalById(roomId) {
    const room = Storage.getRoomById(roomId);
    if (!room) {
        alert('Không tìm thấy phòng trọ!');
        return;
    }
    if (!Array.isArray(room.images) || room.images.length === 0) return alert('Dữ liệu phòng thiếu ảnh. Vui lòng cập nhật lại phòng.');
    if (!isNonEmptyText(room.title) || !isNonEmptyText(room.type) || !isNonEmptyText(room.address) || !isNonEmptyText(room.description)) {
        return alert('Dữ liệu phòng chưa đầy đủ trường bắt buộc. Vui lòng cập nhật lại phòng.');
    }
    if (!isPositiveNumber(room.price) || !isPositiveNumber(room.area)) {
        return alert('Dữ liệu phòng không hợp lệ (giá/diện tích). Vui lòng cập nhật lại phòng.');
    }

    selectedRoomActionId = room.id;

    const images = room.images;
    const location = room.address;
    const price = new Intl.NumberFormat('vi-VN').format(Number(room.price) || 0);
    const statusText = room.status === 'available' ? 'Còn trống' : 'Đã thuê';

    document.getElementById('roomActionTitle').textContent = room.title;
    document.getElementById('roomActionType').textContent = room.type;
    document.getElementById('roomActionPrice').textContent = `${price}đ/tháng`;
    document.getElementById('roomActionArea').textContent = `${Number(room.area) || 0}m²`;
    document.getElementById('roomActionStatus').textContent = statusText;
    document.getElementById('roomActionAddress').textContent = location;
    document.getElementById('roomActionDescription').textContent = room.description;

    initOwnerActionGallery(images, room.title);

    roomActionModal.show();
}

window.openRoomActionModalById = openRoomActionModalById;

function initOwnerActionGallery(images, title) {
    if (!Array.isArray(images) || images.length === 0) return;
    ownerActionGalleryState.images = images;
    ownerActionGalleryState.index = 0;

    const track = document.getElementById('ownerActionGalleryTrack');
    if (!track) return;

    const slides = ownerActionGalleryState.images.map((src, idx) => `
        <div class="owner-action-gallery-slide" data-index="${idx}">
            <img src="${src}" alt="${title} - ảnh ${idx + 1}">
        </div>
    `).join('');

    track.innerHTML = slides;
    syncOwnerActionGallery();
}

function syncOwnerActionGallery() {
    const track = document.getElementById('ownerActionGalleryTrack');
    if (!track) return;

    const slides = Array.from(track.querySelectorAll('.owner-action-gallery-slide'));
    const total = slides.length;
    if (total === 0) return;

    const currentIndex = ownerActionGalleryState.index;
    const prevIndex = (currentIndex - 1 + total) % total;
    const nextIndex = (currentIndex + 1) % total;

    slides.forEach((slide, idx) => {
        slide.classList.remove('is-active', 'is-prev', 'is-next');
        if (idx === currentIndex) slide.classList.add('is-active');
        else if (idx === prevIndex) slide.classList.add('is-prev');
        else if (idx === nextIndex) slide.classList.add('is-next');
    });

    const prevBtn = document.querySelector('.owner-action-gallery-nav.prev');
    const nextBtn = document.querySelector('.owner-action-gallery-nav.next');
    const disabled = total <= 1;
    if (prevBtn) prevBtn.disabled = disabled;
    if (nextBtn) nextBtn.disabled = disabled;
}

function nextOwnerActionImage() {
    const total = ownerActionGalleryState.images.length;
    if (total <= 1) return;
    ownerActionGalleryState.index = (ownerActionGalleryState.index + 1) % total;
    syncOwnerActionGallery();
}

function prevOwnerActionImage() {
    const total = ownerActionGalleryState.images.length;
    if (total <= 1) return;
    ownerActionGalleryState.index = (ownerActionGalleryState.index - 1 + total) % total;
    syncOwnerActionGallery();
}

window.nextOwnerActionImage = nextOwnerActionImage;
window.prevOwnerActionImage = prevOwnerActionImage;

function openContractFromAction() {
    if (!selectedRoomActionId) return;
    roomActionModal.hide();
    openContractModal(selectedRoomActionId);
}

window.openContractFromAction = openContractFromAction;

function openEndContractFromAction() {
    if (!selectedRoomActionId) return;
    roomActionModal.hide();
    openEndContractModal(selectedRoomActionId);
}

window.openEndContractFromAction = openEndContractFromAction;

function openEndContractModal(roomId) {
    const room = Storage.getRoomById(roomId);
    if (!room) {
        alert('Không tìm thấy phòng trọ!');
        return;
    }

    if (!room.contract) {
        alert('Phòng này chưa có hợp đồng để kết thúc.');
        return;
    }

    const form = document.getElementById('endContractForm');
    if (form) form.reset();

    const today = new Date();
    const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    document.getElementById('endContractRoomId').value = room.id;
    document.getElementById('endContractRoomTitle').textContent = `Phòng: ${room.title}`;
    document.getElementById('endContractDate').value = todayValue;

    endContractModal.show();
}

async function saveEndContract() {
    const roomId = document.getElementById('endContractRoomId').value;
    const endDate = document.getElementById('endContractDate').value;
    const endReason = (document.getElementById('endContractReason').value || '').trim();

    if (!roomId) return alert('Không xác định được phòng trọ.');
    if (!endDate) return alert('Vui lòng chọn ngày kết thúc hợp đồng.');

    const room = Storage.getRoomById(roomId);
    if (!room || !room.contract) return alert('Không tìm thấy hợp đồng hiện tại của phòng này.');

    const tenantPhone = room.contract.tenantPhone;
    if (!/^\d{10}$/.test(tenantPhone || '')) {
        return alert('Hợp đồng hiện tại thiếu số điện thoại khách thuê hợp lệ.');
    }
    const endedContract = {
        ...room.contract,
        endedAt: new Date(`${endDate}T00:00:00`).toISOString(),
        endReason
    };

    const updatedRoom = {
        ...room,
        status: 'available',
        contractHistory: [endedContract].concat(Array.isArray(room.contractHistory) ? room.contractHistory : []),
        contract: null
    };

    try {
        Storage.updateRoom(updatedRoom);

        if (tenantPhone) {
            const reasonText = endReason ? ` Lý do: ${endReason}.` : '';
            Storage.addNotification({
                toPhone: tenantPhone,
                fromPhone: currentUser.phone,
                type: 'contract_ended',
                title: 'Hợp đồng đã kết thúc',
                message: `Hợp đồng phòng ${room.title} đã kết thúc vào ngày ${new Date(`${endDate}T00:00:00`).toLocaleDateString('vi-VN')}.${reasonText}`,
                meta: {
                    roomId: room.id,
                    roomTitle: room.title,
                    endDate,
                    endReason
                }
            });
        }

        endContractModal.hide();
        renderTable();
        renderOwnerNotifications();
        alert('Kết thúc hợp đồng thành công. Phòng đã chuyển về trạng thái còn trống.');
    } catch (error) {
        console.error(error);
        alert('Không thể kết thúc hợp đồng. Vui lòng thử lại.');
    }
}

window.saveEndContract = saveEndContract;

function openInvoiceFromAction() {
    if (!selectedRoomActionId) return;
    roomActionModal.hide();
    openInvoiceModal(selectedRoomActionId);
}

window.openInvoiceFromAction = openInvoiceFromAction;

function editFromAction() {
    if (!selectedRoomActionId) return;
    roomActionModal.hide();
    editRoom(selectedRoomActionId);
}

window.editFromAction = editFromAction;

function deleteFromAction() {
    if (!selectedRoomActionId) return;
    const deleted = deleteRoom(selectedRoomActionId);
    if (deleted) {
        roomActionModal.hide();
        selectedRoomActionId = null;
    }
}

window.deleteFromAction = deleteFromAction;

function openInvoiceModal(roomId) {
    const room = Storage.getRoomById(roomId);
    if (!room) return;

    const form = document.getElementById('invoiceForm');
    if (form) form.reset();

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const previousReading = Number(room.lastElectricReading || getLatestInvoiceReading(room) || 0);

    document.getElementById('invoiceRoomId').value = room.id;
    document.getElementById('invoiceRoomTitle').textContent = `Phòng: ${room.title}`;
    document.getElementById('invoicePeriod').value = period;
    document.getElementById('invoiceRent').value = Number(room.price) || 0;
    document.getElementById('invoiceElecRate').value = Number(room.elecPrice) || 0;
    document.getElementById('invoiceElecPrev').value = previousReading;
    document.getElementById('invoiceElecCurrent').value = previousReading;
    document.getElementById('invoiceWater').value = Number(room.waterPrice) || 0;
    document.getElementById('invoiceWifi').value = Number(room.wifiPrice) || 0;
    document.getElementById('invoiceService').value = Number(room.servicePrice) || 0;
    document.getElementById('invoiceIssue').value = '';
    document.getElementById('invoiceNote').value = '';

    recalculateInvoice();
    invoiceModal.show();
}

function getLatestInvoiceReading(room) {
    if (!Array.isArray(room.invoices) || room.invoices.length === 0) return 0;
    const latest = room.invoices[0];
    return Number(latest.electricCurrentReading || 0);
}

function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function recalculateInvoice() {
    const rate = toNumber(document.getElementById('invoiceElecRate').value);
    const prev = toNumber(document.getElementById('invoiceElecPrev').value);
    const current = toNumber(document.getElementById('invoiceElecCurrent').value);
    const usage = Math.max(current - prev, 0);
    const electricTotal = usage * rate;

    document.getElementById('invoiceElecUsage').value = usage;
    document.getElementById('invoiceElecTotal').value = electricTotal;

    const rent = toNumber(document.getElementById('invoiceRent').value);
    const water = toNumber(document.getElementById('invoiceWater').value);
    const wifi = toNumber(document.getElementById('invoiceWifi').value);
    const service = toNumber(document.getElementById('invoiceService').value);
    const issue = toNumber(document.getElementById('invoiceIssue').value);

    const grandTotal = rent + electricTotal + water + wifi + service + issue;
    document.getElementById('invoiceGrandTotal').value = grandTotal;
}

window.recalculateInvoice = recalculateInvoice;

function saveInvoice() {
    const roomId = document.getElementById('invoiceRoomId').value;
    const room = Storage.getRoomById(roomId);
    if (!room) return alert('Không tìm thấy phòng trọ.');
    if (!room.contract || !/^\d{10}$/.test(room.contract.tenantPhone || '')) {
        return alert('Chỉ được tạo hoá đơn cho phòng đã có hợp đồng hợp lệ.');
    }

    const period = document.getElementById('invoicePeriod').value;
    const rent = toNumber(document.getElementById('invoiceRent').value);
    const rate = toNumber(document.getElementById('invoiceElecRate').value);
    const prev = toNumber(document.getElementById('invoiceElecPrev').value);
    const current = toNumber(document.getElementById('invoiceElecCurrent').value);

    if (!period) return alert('Vui lòng chọn kỳ hoá đơn.');
    if (!isPositiveNumber(rent)) return alert('Tiền nhà phải lớn hơn 0.');
    if (!isNonNegativeNumber(rate)) return alert('Giá điện phải là số không âm.');
    if (!isNonNegativeNumber(prev) || !isNonNegativeNumber(current)) return alert('Chỉ số điện phải là số không âm.');
    if (current < prev) return alert('Số điện hiện tại không được nhỏ hơn số điện kỳ trước.');

    recalculateInvoice();

    const invoiceData = {
        id: `INV_${Date.now()}`,
        period,
        rent,
        electricRate: rate,
        electricPreviousReading: prev,
        electricCurrentReading: current,
        electricUsage: toNumber(document.getElementById('invoiceElecUsage').value),
        electricTotal: toNumber(document.getElementById('invoiceElecTotal').value),
        water: toNumber(document.getElementById('invoiceWater').value),
        wifi: toNumber(document.getElementById('invoiceWifi').value),
        service: toNumber(document.getElementById('invoiceService').value),
        issue: toNumber(document.getElementById('invoiceIssue').value),
        grandTotal: toNumber(document.getElementById('invoiceGrandTotal').value),
        status: 'unpaid',
        note: (document.getElementById('invoiceNote').value || '').trim(),
        createdAt: new Date().toISOString()
    };

    if (!isPositiveNumber(invoiceData.grandTotal)) {
        return alert('Tổng hoá đơn phải lớn hơn 0.');
    }

    const invoices = Array.isArray(room.invoices) ? room.invoices : [];
    invoices.unshift(invoiceData);

    const updatedRoom = {
        ...room,
        invoices,
        lastElectricReading: current
    };

    try {
        Storage.updateRoom(updatedRoom);

        if (room.contract && room.contract.tenantPhone) {
            Storage.addNotification({
                toPhone: room.contract.tenantPhone,
                fromPhone: currentUser.phone,
                type: 'invoice_created',
                title: 'Hoá đơn mới',
                message: `Có hoá đơn kỳ ${invoiceData.period} cho phòng ${room.title}. Tổng cần thanh toán: ${new Intl.NumberFormat('vi-VN').format(invoiceData.grandTotal)}đ.`,
                meta: {
                    roomId: room.id,
                    roomTitle: room.title,
                    invoiceId: invoiceData.id,
                    period: invoiceData.period,
                    amount: invoiceData.grandTotal
                }
            });
        }

        invoiceModal.hide();
        renderTable();
        renderOwnerNotifications();
        alert('Tạo hoá đơn thành công!');
    } catch (error) {
        console.error(error);
        alert('Không thể lưu hoá đơn. Vui lòng thử lại.');
    }
}

window.saveInvoice = saveInvoice;

function renderOwnerNotifications() {
    const listEl = document.getElementById('ownerNotificationList');
    if (!listEl) return;

    const notifications = Storage.getNotifications(currentUser.phone);
    if (!notifications.length) {
        listEl.innerHTML = '<div class="text-muted small">Chưa có thông báo mới.</div>';
        return;
    }

    listEl.innerHTML = notifications.slice(0, 12).map((item) => {
        const created = formatNotificationTime(item.createdAt);
        const unread = item.isRead ? '' : '<span class="badge text-bg-danger">Mới</span>';
        return `
            <article class="notification-item ${item.isRead ? '' : 'unread'}" onclick="markOwnerNotificationRead('${item.id}')">
                <div class="d-flex justify-content-between gap-2 align-items-start">
                    <div class="fw-semibold">${item.title || 'Thông báo'}</div>
                    ${unread}
                </div>
                <div class="small text-muted mt-1">${item.message || ''}</div>
                <div class="small text-secondary mt-1">${created}</div>
            </article>
        `;
    }).join('');

    if (window.NavbarUI && typeof window.NavbarUI.refreshNotifications === 'function') {
        window.NavbarUI.refreshNotifications();
    }
}

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

function markOwnerNotificationRead(notificationId) {
    Storage.markNotificationRead(notificationId, currentUser.phone);
    renderOwnerNotifications();
}

window.markOwnerNotificationRead = markOwnerNotificationRead;

function markAllOwnerNotificationsRead() {
    Storage.markAllNotificationsRead(currentUser.phone);
    renderOwnerNotifications();
}

window.markAllOwnerNotificationsRead = markAllOwnerNotificationsRead;

// 7. XÓA PHÒNG
function deleteRoom(id) {
    if(confirm('Bạn có chắc chắn muốn xóa phòng này? Hành động này không thể phục hồi!')) {
        Storage.deleteRoom(id);
        renderTable();
        return true;
    }
    return false;
}
document.addEventListener('DOMContentLoaded', () => {
    // Scroll To Top Logic
    const scrollBtn = document.getElementById('scrollToTopBtn');
    if(scrollBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.classList.add('show');
            } else {
                scrollBtn.classList.remove('show');
            }
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
