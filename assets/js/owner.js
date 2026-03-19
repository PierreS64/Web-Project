/**
 * owner.js
 * Logic xử lý cho trang owner.html
 */

// 1. CHECK QUYỀN TRUY CẬP
const currentUser = Storage.getCurrentUser();
if (!currentUser || currentUser.role !== 'owner') {
    alert('Bạn không có quyền truy cập trang này!');
    window.location.href = 'index.html';
}

// 2. BIẾN TOÀN CỤC
let roomModal;
let contractModal;
let selectedImages = [];
// let map, marker;
// let defaultLocation = { lat: 21.0285, lng: 105.8542 }; // Hà Nội

document.addEventListener('DOMContentLoaded', () => {
    roomModal = new bootstrap.Modal(document.getElementById('roomModal'));
    contractModal = new bootstrap.Modal(document.getElementById('contractModal'));
    renderTable();

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
    
    // Fallback getAttribute nếu dataset lỗi
    const option = citySel.options[selectedIndex];
    const code = option.dataset.code || option.getAttribute('data-code');

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
    const code = option.dataset.code || option.getAttribute('data-code');

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



// 3. RENDER BẢNG DỮ LIỆU
function renderTable() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const filter = document.getElementById('statusFilter').value;
    const rooms = Storage.getRooms();

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    // Lọc dữ liệu
    const filteredRooms = rooms.filter(room => {
        const matchName = room.title.toLowerCase().includes(keyword);
        const matchStatus = filter === 'all' || room.status === filter;
        return matchName && matchStatus;
    });

    if (filteredRooms.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3">Không tìm thấy dữ liệu.</td></tr>';
        return;
    }

    // Vẽ từng dòng
    filteredRooms.forEach(room => {
        const price = new Intl.NumberFormat('vi-VN').format(room.price);
        const statusBadge = room.status === 'available' 
            ? '<span class="badge bg-success">Còn trống</span>' 
            : '<span class="badge bg-secondary">Đã thuê</span>';

        const row = `
            <tr>
                <td class="fw-bold text-primary">${room.title}</td>
                <td><span class="badge bg-info text-dark">${room.type || 'Phòng trọ'}</span></td>
                <td class="text-danger fw-bold">${price} đ</td>
                <td>${room.area} m²</td>
                <td>${room.address}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editRoom('${room.id}')" title="Sửa">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-sm btn-warning me-1" onclick="openContractModal('${room.id}')" title="Tạo hợp đồng">
                        <i class="fa-solid fa-file-signature"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteRoom('${room.id}')" title="Xóa">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
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
        document.getElementById('roomType').value = room.type || 'Phòng trọ';
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

        // Cố gắng fill lại địa chỉ từ các thành phần (nếu có)
        // Nếu là dữ liệu đã được lưu với API mới (có room.city)
        if (room.city) {
            // 1. Set City
            const cityFound = setSelectValue('addrCity', room.city);
            
            if (cityFound) {
                // 2. Load Districts (await)
                await window.loadDistricts();
                // 3. Set District
                const distFound = setSelectValue('addrDistrict', room.district);
                
                if (distFound) {
                    // 4. Load Wards (await)
                    await window.loadWards();
                    // 5. Set Ward
                    setSelectValue('addrWard', room.ward);
                }
            }

            document.getElementById('addrStreet').value = room.street;
        } else {
            // Fallback cho dữ liệu cũ (chỉ có string address)
            document.getElementById('addrCity').value = '';
            // Reset districts/wards
            const distSel = document.getElementById('addrDistrict');
            const wardSel = document.getElementById('addrWard');
            distSel.innerHTML = '<option value="">-- Quận/Huyện --</option>';
            wardSel.innerHTML = '<option value="">-- Phường/Xã --</option>';
            distSel.disabled = true;
            wardSel.disabled = true;

            document.getElementById('addrStreet').value = room.address;
        }
        
        document.getElementById('roomDesc').value = room.description || '';
        document.getElementById('roomStatus').value = room.status;

        selectedImages = [];
        if (Array.isArray(room.images) && room.images.length > 0) {
            selectedImages = room.images.map((src, idx) => ({
                name: `image-${idx + 1}`,
                size: 0,
                base64: src
            }));
        } else if (room.image) {
            selectedImages = [{
                name: 'image-1',
                size: 0,
                base64: room.image
            }];
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
    const price = document.getElementById('roomPrice').value;
    const elecPrice = document.getElementById('roomElecPrice').value;
    const waterPrice = document.getElementById('roomWaterPrice').value;
    const wifiPrice = document.getElementById('roomWifiPrice').value;
    const servicePrice = document.getElementById('roomServicePrice').value;
    const description = document.getElementById('roomDesc').value.trim();

    // Lấy thông tin địa chỉ
    const city = document.getElementById('addrCity').value;
    const district = document.getElementById('addrDistrict').value;
    const ward = document.getElementById('addrWard').value;
    const street = document.getElementById('addrStreet').value.trim();

    // Validate cơ bản
    if (!title) return alert('Vui lòng nhập Tên phòng!');
    if (!price) return alert('Vui lòng nhập Giá tiền!');
    if (!document.getElementById('roomArea').value) return alert('Vui lòng nhập Diện tích!');
    
    if (!city || !district || !ward) return alert('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã!');
    if (!street) return alert('Vui lòng nhập địa chỉ cụ thể (Số nhà, đường)!');

    /*
    const lat = document.getElementById('roomLat').value;
    const lng = document.getElementById('roomLng').value;
    if (!lat || !lng) return alert('Vui lòng chọn vị trí trên bản đồ!');
    */

    if (!description) return alert('Vui lòng nhập Mô tả!');
    if (!document.getElementById('roomStatus').value) return alert('Vui lòng chọn Trạng thái!');

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

    // Lấy thông tin chủ nhà (User đang đăng nhập)
    let ownerName = 'Chủ nhà';
    let ownerPhone = 'Liên hệ';
    
    // Nếu đang sửa admin, ráng giữ thông tin cũ
    if (id) {
        const oldRoom = Storage.getRoomById(id);
        if (oldRoom) {
            ownerName = oldRoom.ownerName || ownerName;
            ownerPhone = oldRoom.ownerPhone || ownerPhone;
        }
    } 
    
    // Nếu tạo mới hoặc chưa có info, thử lấy từ CurrentUser
    const currentUser = Storage.getCurrentUser();
    if (currentUser) {
        // Nếu tạo mới hoàn toàn -> Lấy của người đang tạo
        if (!id) {
            ownerName = currentUser.name;
            ownerPhone = currentUser.phone;
        }
        // Nếu sửa mà cũ chưa có -> Update
        else if (ownerName === 'Chủ nhà') {
             ownerName = currentUser.name;
             ownerPhone = currentUser.phone;
        }
    }

    const roomData = {
        id: id || 'ROOM_' + Date.now(),
        title: title,
        type: document.getElementById('roomType').value,
        price: Number(price),
        elecPrice: Number(elecPrice) || 0,
        waterPrice: Number(waterPrice) || 0,
        wifiPrice: Number(wifiPrice) || 0,
        servicePrice: Number(servicePrice) || 0,
        area: document.getElementById('roomArea').value,
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
        status: document.getElementById('roomStatus').value,
        images: imagesArray,
        contract: id && Storage.getRoomById(id) ? (Storage.getRoomById(id).contract || null) : null
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
            alert('Lỗi: Dung lượng lưu trữ đầy! Vui lòng chọn ảnh nhỏ hơn hoặc xóa bớt dữ liệu cũ.');
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
        contractModal.hide();
        renderTable();
        alert('Tạo hợp đồng thành công!');
    } catch (error) {
        console.error(error);
        alert('Không thể lưu hợp đồng. Vui lòng thử lại.');
    }
}

// 7. XÓA PHÒNG
function deleteRoom(id) {
    if(confirm('Bạn có chắc chắn muốn xóa phòng này? Hành động này không thể phục hồi!')) {
        Storage.deleteRoom(id);
        renderTable();
    }
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
