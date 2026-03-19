/**
 * main.js
 * Logic cho trang chủ trang-chu.html
 */

let authModal;
let roomDetailModal;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo Modal
    const authModalEl = document.getElementById('authModal');
    if(authModalEl) {
        authModal = new bootstrap.Modal(authModalEl);
    }
    if(document.getElementById('roomDetailModal')) {
        roomDetailModal = new bootstrap.Modal(document.getElementById('roomDetailModal'));
    }

    // 2. Render dữ liệu
    renderHomeRooms();
    checkAuth();

    // 3. Sự kiện tìm kiếm
    const btnSearch = document.querySelector('.btn-search');
    if(btnSearch) {
        btnSearch.addEventListener('click', handleSearch);
    }

    // 4. Scroll To Top Logic
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

    // 5. Reset form khi đóng modal
    if(authModalEl) {
        authModalEl.addEventListener('hidden.bs.modal', () => {
            // Reset các form
            const forms = authModalEl.querySelectorAll('form');
            forms.forEach(f => f.reset());
            
            // Reset trạng thái hiển thị mật khẩu về mặc định (ẩn)
            const passInputs = authModalEl.querySelectorAll('input[type="text"]');
            passInputs.forEach(inp => {
                if(inp.id.includes('Pass')) inp.type = 'password';
            });
            const eyeIcons = authModalEl.querySelectorAll('.fa-eye');
            eyeIcons.forEach(icon => {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            });
        });
    }
});

// --- AUTHENTICATION ---
function openAuthModal(type) {
    if(authModal) {
        authModal.show();
        switchTab(type);
    }
}

function switchTab(type) {
    const loginForm = document.getElementById('form-login');
    const regForm = document.getElementById('form-register');
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-register');

    if (type === 'login') {
        loginForm.classList.remove('d-none'); 
        regForm.classList.add('d-none');
        tabLogin.classList.add('active'); 
        tabReg.classList.remove('active');
    } else {
        loginForm.classList.add('d-none'); 
        regForm.classList.remove('d-none');
        tabLogin.classList.remove('active'); 
        tabReg.classList.add('active');
    }
}

// Chức năng ẩn/hiện mật khẩu
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const phone = document.getElementById('logPhone').value;
    const pass = document.getElementById('logPass').value;
    const user = Storage.login(phone, pass);
    if(user) {
        // Tự động đóng modal và tải lại trang để cập nhật giao diện
        authModal.hide();
        window.location.reload();
    } else {
        alert('Sai thông tin đăng nhập!');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const pass = document.getElementById('regPass').value;
    const role = document.getElementById('regRole').value;

    if (!/^\d{10}$/.test(phone)) return alert('Lỗi: SĐT phải là 10 số!');
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{5,20}$/.test(pass)) return alert('Lỗi: Mật khẩu chưa đủ mạnh (Hoa, thường, số, ký tự đặc biệt)!');
    if (name.split(/\s+/).length < 2 || /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(name)) return alert('Lỗi: Tên không hợp lệ!');

    if (Storage.register({ name, phone, pass, role })) {
        alert('Đăng ký thành công!'); 
        switchTab('login');
        document.getElementById('logPhone').value = phone;
        document.getElementById('form-register').querySelector('form').reset();
    } else {
        alert('SĐT đã tồn tại!');
    }
}

function checkAuth() {
    const user = Storage.getCurrentUser();
    if (user) {
        const authButtons = document.getElementById('auth-buttons');
        const userInfo = document.getElementById('user-info');
        
        if(authButtons) authButtons.classList.add('d-none');
        if(userInfo) {
            userInfo.classList.remove('d-none');
            userInfo.classList.add('d-flex');
            // Dùng innerHTML để giữ Icon
            const displayNameEl = document.getElementById('display-name');
            if(displayNameEl) {
                displayNameEl.innerHTML = `<i class="fa-solid fa-user"></i> Hi, ${user.name}`;
            }
            const adminLink = document.getElementById('admin-link');
            if(adminLink) {
                if (user.role === 'owner') {
                    adminLink.classList.remove('d-none');
                    adminLink.href = 'chu-tro.html';
                    adminLink.innerHTML = '<i class="fa-solid fa-list-check"></i> Quản lý';
                } else if (user.role === 'tenant') {
                    adminLink.classList.remove('d-none');
                    adminLink.href = 'khach-hang.html';
                    adminLink.innerHTML = '<i class="fa-solid fa-house-user"></i> Thuê trọ';
                }
            }
        }
    }
}

// --- ROOM LOGIC ---
function renderHomeRooms(roomsToRender = null) {
    const HOME_SECTION_LIMIT = 8;
    const SEE_ALL_MAP = {
        latest: 'see-all-latest',
        phongTro: 'see-all-phong-tro',
        nhaNguyenCan: 'see-all-nha-nguyen-can',
        canHo: 'see-all-can-ho',
        kyTucXa: 'see-all-ky-tuc-xa'
    };

    const rooms = roomsToRender || Storage.getRooms();
    const container = document.getElementById('room-list');
    const resultCount = document.getElementById('results-count');
    const roomPhongTro = document.getElementById('room-list-phong-tro');
    const roomNhaNguyenCan = document.getElementById('room-list-nha-nguyen-can');
    const roomCanHo = document.getElementById('room-list-can-ho');
    const roomKyTucXa = document.getElementById('room-list-ky-tuc-xa');
    const countPhongTro = document.getElementById('results-phong-tro');
    const countNhaNguyenCan = document.getElementById('results-nha-nguyen-can');
    const countCanHo = document.getElementById('results-can-ho');
    const countKyTucXa = document.getElementById('results-ky-tuc-xa');

    const toggleSeeAllButton = (key, total) => {
        const btnId = SEE_ALL_MAP[key];
        if (!btnId) return;
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.classList.toggle('d-none', total <= HOME_SECTION_LIMIT);
    };

    const normalizeType = (type = '') => type.toLowerCase().replace(/\s+/g, ' ').trim();
    const isPhongTro = (type = '') => {
        const normalized = normalizeType(type);
        return normalized === 'phòng trọ' || normalized === 'nhà trọ' || normalized === 'nhà trọ, phòng trọ';
    };

    const groupedRooms = {
        phongTro: rooms.filter(r => isPhongTro(r.type || 'Phòng trọ')),
        nhaNguyenCan: rooms.filter(r => normalizeType(r.type) === 'nhà nguyên căn'),
        canHo: rooms.filter(r => normalizeType(r.type) === 'căn hộ'),
        kyTucXa: rooms.filter(r => normalizeType(r.type) === 'ký túc xá')
    };

    const buildRoomCard = (room) => {
        const price = new Intl.NumberFormat('vi-VN').format(room.price);
        const area = Number(room.area) || 0;
        const type = room.type || 'Phòng trọ';
        const locationText = room.address || [room.street, room.ward, room.district, room.city].filter(Boolean).join(', ');
        const statusChip = room.status === 'rented' ? '<span class="room-chip room-chip-rented">Đã thuê</span>' : '';
        const imgUrl = (Array.isArray(room.images) && room.images.length > 0 ? room.images[0] : room.image) || 'img/logo.png';

        return `
        <div class="col-lg-3 col-md-6">
            <article class="room-card room-card-figma h-100" onclick="viewRoom('${room.id}')">
                <div class="room-thumb-wrap">
                    <img src="${imgUrl}" class="room-thumb" alt="${room.title}">
                    <div class="room-chip-row">
                        <span class="room-chip">${type}</span>
                        ${statusChip}
                    </div>
                    <button type="button" class="room-fav-btn" onclick="event.stopPropagation()" aria-label="Yêu thích">
                        <i class="fa-regular fa-heart"></i>
                    </button>
                </div>
                <div class="room-info-wrap">
                    <h5 class="room-title">${room.title}</h5>
                    <p class="room-location"><i class="fa-solid fa-location-dot"></i> ${locationText}</p>
                    <div class="room-price-row">
                        <div class="room-price">${price}đ<span>/tháng</span></div>
                        <div class="room-area"><i class="fa-solid fa-ruler-combined"></i> ${area}m²</div>
                    </div>
                </div>
            </article>
        </div>`;
    };

    const renderRoomList = (targetEl, items, emptyMessage = 'Chưa có tin đăng trong mục này.') => {
        if (!targetEl) return;
        if (items.length === 0) {
            targetEl.innerHTML = `<div class="col-12 text-muted py-3">${emptyMessage}</div>`;
            return;
        }
        targetEl.innerHTML = items.map(buildRoomCard).join('');
    };
    
    if(!container) return;

    if (resultCount) resultCount.textContent = `${rooms.length} tin đăng`;

    if(rooms.length === 0) { 
        renderRoomList(container, [], 'Chưa có tin đăng trong mục này.');
        renderRoomList(roomPhongTro, []);
        renderRoomList(roomNhaNguyenCan, []);
        renderRoomList(roomCanHo, []);
        renderRoomList(roomKyTucXa, []);

        toggleSeeAllButton('latest', 0);
        toggleSeeAllButton('phongTro', 0);
        toggleSeeAllButton('nhaNguyenCan', 0);
        toggleSeeAllButton('canHo', 0);
        toggleSeeAllButton('kyTucXa', 0);

        if (countPhongTro) countPhongTro.textContent = '0 tin đăng';
        if (countNhaNguyenCan) countNhaNguyenCan.textContent = '0 tin đăng';
        if (countCanHo) countCanHo.textContent = '0 tin đăng';
        if (countKyTucXa) countKyTucXa.textContent = '0 tin đăng';
        return; 
    }

    renderRoomList(container, rooms.slice(0, HOME_SECTION_LIMIT));

    renderRoomList(roomPhongTro, groupedRooms.phongTro.slice(0, HOME_SECTION_LIMIT));
    renderRoomList(roomNhaNguyenCan, groupedRooms.nhaNguyenCan.slice(0, HOME_SECTION_LIMIT));
    renderRoomList(roomCanHo, groupedRooms.canHo.slice(0, HOME_SECTION_LIMIT));
    renderRoomList(roomKyTucXa, groupedRooms.kyTucXa.slice(0, HOME_SECTION_LIMIT));

    toggleSeeAllButton('latest', rooms.length);
    toggleSeeAllButton('phongTro', groupedRooms.phongTro.length);
    toggleSeeAllButton('nhaNguyenCan', groupedRooms.nhaNguyenCan.length);
    toggleSeeAllButton('canHo', groupedRooms.canHo.length);
    toggleSeeAllButton('kyTucXa', groupedRooms.kyTucXa.length);

    if (countPhongTro) countPhongTro.textContent = `${groupedRooms.phongTro.length} tin đăng`;
    if (countNhaNguyenCan) countNhaNguyenCan.textContent = `${groupedRooms.nhaNguyenCan.length} tin đăng`;
    if (countCanHo) countCanHo.textContent = `${groupedRooms.canHo.length} tin đăng`;
    if (countKyTucXa) countKyTucXa.textContent = `${groupedRooms.kyTucXa.length} tin đăng`;
}

function handleSearch() {
    const keyword = document.getElementById('searchKeyword').value.toLowerCase().trim();
    const type = document.getElementById('searchType').value;

    const allRooms = Storage.getRooms();
    const filtered = allRooms.filter(r => {
        // 1. Lọc theo từ khóa (Tên hoặc Địa chỉ)
        const matchKeyword = r.title.toLowerCase().includes(keyword) || 
                             r.address.toLowerCase().includes(keyword);
        
        // 2. Lọc theo loại hình
        // Nếu chọn 'all' thì bỏ qua, nếu không thì so sánh chính xác
        // Dữ liệu cũ chưa có type thì mặc định coi là 'Phòng trọ'
        const roomType = r.type || 'Phòng trọ';
        const matchType = (type === 'all') || (roomType === type);

        return matchKeyword && matchType;
    });
    renderHomeRooms(filtered);
}

function postNewRoom() {
    const user = Storage.getCurrentUser();
    if(!user) {
        alert('Vui lòng đăng nhập để đăng tin!');
        openAuthModal('login');
        return;
    }
    if(user.role !== 'owner') {
        alert('Chỉ tài khoản Chủ Trọ mới được đăng tin!');
        return;
    }
    // Chuyển sang trang owner và mở modal (giả lập)
    if(confirm('Chuyển đến trang quản lý để đăng tin?')) {
        window.location.href = 'chu-tro.html';
    }
}

function viewRoom(id) {
    // Navigate to detail page
    window.location.href = `chi-tiet.html?id=${id}`;
}

function bookRoom() {
    const user = Storage.getCurrentUser();
    if(!user) {
        alert('Vui lòng đăng nhập để đặt phòng!');
        if(roomDetailModal) roomDetailModal.hide();
        openAuthModal('login');
        return;
    }
    alert('Yêu cầu đặt phòng đã được gửi tới chủ nhà! (Tính năng đang phát triển)');
    if(roomDetailModal) roomDetailModal.hide();
}


// --- 6. ADVANCED SEARCH LOGIC ---

// Mặc định selectedTabType là "all"
let selectedTabType = 'all'; 

// Init for Advanced Search
document.addEventListener('DOMContentLoaded', () => {
    initAdvancedSearchLocation();

    const mainInput = document.getElementById('mainSearchInput');
    if (mainInput) {
        mainInput.addEventListener('focus', openAdvancedSearchPopup);
        mainInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                executeSearch();
            }
        });
    }

    // Close popups when clicking outside
    document.addEventListener('click', function(event) {
        // Location Popup
        const locPopup = document.getElementById('advancedSearchPopup');
        const mainInputEl = document.getElementById('mainSearchInput');
        const searchButton = document.getElementById('mainSearchButton');
        const clickedSearchTrigger = (mainInputEl && mainInputEl.contains(event.target)) || (searchButton && searchButton.contains(event.target));

        if (locPopup && !locPopup.contains(event.target) && !clickedSearchTrigger) {
             locPopup.classList.remove('show');
        }

        // Combined Filter Popup
        const filterBtn = document.getElementById('filterBtn');
        const filterPopup = document.getElementById('filterPopup');
        if (filterBtn && filterPopup && !filterBtn.contains(event.target) && !filterPopup.contains(event.target)) {
            filterPopup.classList.remove('show');
        }
    });
});

// -- Custom Filter Logic --

function toggleFilterPopup(id) {
    const popup = document.getElementById(id);
    document.querySelectorAll('.filter-popup').forEach(p => {
        if(p.id !== id) p.classList.remove('show');
    });
    popup.classList.toggle('show');
    
    // Init Visuals
    if(id === 'filterPopup' && popup.classList.contains('show')) {
        updateTrack();
    }
}

function applyFilter(popupId) {
    document.getElementById(popupId).classList.remove('show');
    executeSearch();
}

// 1. Price Logic (Dual Slider)
function slideOne() {
    const rangeMin = document.getElementById("rangeMin");
    const rangeMax = document.getElementById("rangeMax");
    if(parseInt(rangeMin.value) > parseInt(rangeMax.value)) {
        rangeMin.value = rangeMax.value;
    }
    document.getElementById("priceMin").value = rangeMin.value;
    updateTrack();
    uncheckPriceRadios();
}

function slideTwo() {
    const rangeMin = document.getElementById("rangeMin");
    const rangeMax = document.getElementById("rangeMax");
    if(parseInt(rangeMax.value) < parseInt(rangeMin.value)) {
        rangeMax.value = rangeMin.value;
    }
    document.getElementById("priceMax").value = rangeMax.value;
    updateTrack();
    uncheckPriceRadios();
}

function manualInput(type) {
    const rangeMin = document.getElementById("rangeMin");
    const rangeMax = document.getElementById("rangeMax");
    const inputMin = document.getElementById("priceMin");
    const inputMax = document.getElementById("priceMax");
    
    let min = parseInt(inputMin.value) || 0;
    let max = parseInt(inputMax.value) || 100000000;
    
    if(min > max) { 
        if(type === 'min') { min = max; inputMin.value = min;}
        else { max = min; inputMax.value = max;}
    }

    if(min >= 0 && min <= 100000000) rangeMin.value = min;
    if(max >= 0 && max <= 100000000) rangeMax.value = max;
    
    updateTrack();
    uncheckPriceRadios();
}

function updateTrack() {
    const rangeMin = document.getElementById("rangeMin");
    const rangeMax = document.getElementById("rangeMax");
    const track = document.getElementById("sliderTrack");
    
    if(!rangeMin || !track) return;
    
    const minVal = parseInt(rangeMin.value);
    const maxVal = parseInt(rangeMax.value);
    const maxTotal = 100000000; // Max Range Fixed
    
    const percent1 = (minVal / maxTotal) * 100;
    const percent2 = (maxVal / maxTotal) * 100;
    
    track.style.left = percent1 + "%";
    track.style.width = (percent2 - percent1) + "%";
    
    if(document.getElementById('priceMinLabel')) {
        document.getElementById('priceMinLabel').innerText = new Intl.NumberFormat('vi-VN').format(minVal);
        document.getElementById('priceMaxLabel').innerText = new Intl.NumberFormat('vi-VN').format(maxVal);
    }
}

function uncheckPriceRadios() {
    document.querySelectorAll('input[name="priceRadio"]').forEach(r => r.checked = false);
}

function updatePriceLabel(radio) {
    const val = radio.value;
    let min = 0, max = 100000000;
    
    if (val === 'duoi1tr') { max = 1000000; }
    else if (val === '1tr-5tr') { min = 1000000; max = 5000000; }
    else if (val === '5tr-10tr') { min = 5000000; max = 10000000; }
    else if (val === '10tr-20tr') { min = 10000000; max = 20000000; }
    else if (val === 'tren20tr') { min = 20000000; max = 100000000; }
    
    document.getElementById("priceMin").value = min;
    document.getElementById("priceMax").value = max;
    document.getElementById("rangeMin").value = min;
    document.getElementById("rangeMax").value = max;
    updateTrack();
}

function resetPriceFilter() {
    document.getElementById('priceMin').value = '0';
    document.getElementById('priceMax').value = '100000000';
    document.getElementById('rangeMin').value = 0;
    document.getElementById('rangeMax').value = 100000000;
    
    const allRadio = document.querySelector('input[name="priceRadio"][value="all"]');
    if(allRadio) allRadio.checked = true;
    updateTrack();
}

// 2. Area Logic
function updateAreaLabel(radio) {
    // No label update needed for Icon Only
}

function resetAreaFilter() {
    const allRadio = document.querySelector('input[name="areaRadio"][value="all"]');
    if(allRadio) allRadio.checked = true;
}

function resetCombinedFilters() {
    resetPriceFilter();
    resetAreaFilter();
}

// -- End Custom Filter Logic --

function selectSearchTab(el, type) {
    selectedTabType = type;
    document.querySelectorAll('.search-tab-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
}

function openAdvancedSearchPopup() {
    const popup = document.getElementById('advancedSearchPopup');
    if (!popup) return;

    document.querySelectorAll('.filter-popup').forEach(p => p.classList.remove('show'));
    popup.classList.add('show');
}

function handleSearchTrigger(event) {
    if (event) event.preventDefault();

    const popup = document.getElementById('advancedSearchPopup');
    if (popup && !popup.classList.contains('show')) {
        openAdvancedSearchPopup();
        return;
    }

    executeSearch();
}

function toggleAdvancedSearch() {
    const popup = document.getElementById('advancedSearchPopup');
    if (!popup) return;

    if (popup.classList.contains('show')) {
        popup.classList.remove('show');
    } else {
        openAdvancedSearchPopup();
    }
}

function switchPopupTab(tabName) {
    const tabAreaBtn = document.getElementById('tab-area');
    const tabMapBtn = document.getElementById('tab-map');
    const contentArea = document.getElementById('content-area');
    const contentMap = document.getElementById('content-map');

    if (tabName === 'area') {
        tabAreaBtn.classList.add('active');
        tabMapBtn.classList.remove('active');
        contentArea.classList.remove('d-none');
        contentMap.classList.add('d-none');
    } else {
        tabAreaBtn.classList.remove('active');
        tabMapBtn.classList.add('active');
        contentArea.classList.add('d-none');
        contentMap.classList.remove('d-none');
    }
}

function quickSelectCity(cityName) {
    const citySel = document.getElementById('advCity');
    if (!citySel) return;

    let found = false;
    // Find option
    for (let i = 0; i < citySel.options.length; i++) {
        // Basic match (Chứa tên)
        if (citySel.options[i].text.includes(cityName)) {
            citySel.selectedIndex = i;
            found = true;
            // Trigger loading districts (không chờ để có thể lọc ngay theo city)
            loadAdvDistricts();
            break;
        }
    }

    if (!found) return;

    // Khi bấm vào ảnh thành phố: lọc ngay, không ghi lên thanh tìm kiếm
    executeSearch({ ignoreTextKeyword: true });
}

function resetAdvancedSearch() {
    document.getElementById('advCity').value = '';
    document.getElementById('advDistrict').innerHTML = '<option value="">Quận/Huyện...</option>';
    document.getElementById('advDistrict').disabled = true;
    document.getElementById('advWard').innerHTML = '<option value="">Phường/Xã...</option>';
    document.getElementById('advWard').disabled = true;
    document.getElementById('mainSearchInput').value = '';
}

function executeSearch(options = {}) {
    // 1. Get location string from Advanced Search
    const city = document.getElementById('advCity').value;
    const district = document.getElementById('advDistrict').value;
    const ward = document.getElementById('advWard').value;

    let locationKeyword = options.ignoreTextKeyword ? '' : document.getElementById('mainSearchInput').value;

    // Nếu có chọn dropdown thì ưu tiên tạo string từ dropdown
    if (city) {
        let parts = [];
        if(ward) parts.push(ward);
        if(district) parts.push(district);
        if(city) parts.push(city);
        
        locationKeyword = parts.join(', ');
    }

    // 2. Get Filters Values (UPDATED FOR NEW UI)
    
    // Price
    let minPrice = 0, maxPrice = 999999999999;
    const priceRangeRadio = document.querySelector('input[name="priceRadio"]:checked').value;
    
    // Check custom inputs first
    const customMinP = document.getElementById('priceMin').value;
    const customMaxP = document.getElementById('priceMax').value;

    if (customMinP || customMaxP) {
        minPrice = customMinP ? Number(customMinP) : 0;
        maxPrice = customMaxP ? Number(customMaxP) : 999999999999;
    } else if (priceRangeRadio !== 'all') {
        // Preset parsing
        if (priceRangeRadio === 'duoi1tr') { maxPrice = 1000000; }
        else if (priceRangeRadio === '1tr-5tr') { minPrice = 1000000; maxPrice = 5000000; }
        else if (priceRangeRadio === '5tr-10tr') { minPrice = 5000000; maxPrice = 10000000; }
        else if (priceRangeRadio === '10tr-20tr') { minPrice = 10000000; maxPrice = 20000000; }
        else if (priceRangeRadio === 'tren20tr') { minPrice = 20000000; }
    }

    // Area
    let minArea = 0, maxArea = 999999;
    const areaRangeRadio = document.querySelector('input[name="areaRadio"]:checked').value;
    
    if (areaRangeRadio !== 'all') {
         if (areaRangeRadio === 'duoi20') { maxArea = 20; }
         else if (areaRangeRadio === '20-30') { minArea = 20; maxArea = 30; }
         else if (areaRangeRadio === '30-50') { minArea = 30; maxArea = 50; }
         else if (areaRangeRadio === '50-70') { minArea = 50; maxArea = 70; }
         else if (areaRangeRadio === '70-90') { minArea = 70; maxArea = 90; }
         else if (areaRangeRadio === 'tren90') { minArea = 90; }
    }


    // 3. Perform Filter
    const allRooms = Storage.getRooms();
    const filtered = allRooms.filter(r => {
        // A. Type Filter
        const typeMatch = (selectedTabType === 'all') || (r.type === selectedTabType);

        // B. Keyword / Location Filter
        const roomAddress = (r.address || [r.street, r.ward, r.district, r.city].filter(Boolean).join(', ')).toLowerCase();
        const locMatch = !locationKeyword || roomAddress.includes(locationKeyword.toLowerCase());

        // C. Price Filter
        const priceMatch = r.price >= minPrice && r.price <= maxPrice;

        // D. Area Filter
        const areaMatch = r.area >= minArea && r.area <= maxArea;

        return typeMatch && locMatch && priceMatch && areaMatch;
    });

    renderHomeRooms(filtered);
    
    // Close Popups
    document.getElementById('advancedSearchPopup').classList.remove('show');
}


// --- API LOCATION FOR HOME (Duplicate logic for simplicity) ---
const PROVINCE_API_HOME = 'https://provinces.open-api.vn/api/';

async function initAdvancedSearchLocation() {
    const citySel = document.getElementById('advCity');
    const distSel = document.getElementById('advDistrict');
    const wardSel = document.getElementById('advWard');
    
    if(!citySel) return; // Prevent error if elements missing

    try {
        const res = await fetch(PROVINCE_API_HOME + '?depth=1');
        const data = await res.json();
        data.sort((a, b) => a.name.localeCompare(b.name));
        
        let html = '<option value="">Chọn Tỉnh/TP...</option>';
        data.forEach(item => {
            html += `<option value="${item.name}" data-code="${item.code}">${item.name}</option>`;
        });
        citySel.innerHTML = html;

        // Events
        citySel.addEventListener('change', loadAdvDistricts);
        distSel.addEventListener('change', loadAdvWards);

    } catch (error) {
        console.error('Lỗi tải tỉnh thành trang chủ:', error);
    }
}

async function loadAdvDistricts() {
    const citySel = document.getElementById('advCity');
    const distSel = document.getElementById('advDistrict');
    const wardSel = document.getElementById('advWard');

    distSel.innerHTML = '<option value="">Đang tải...</option>';
    wardSel.innerHTML = '<option value="">Phường/Xã...</option>';
    distSel.disabled = true; 
    wardSel.disabled = true;

    const selectedIndex = citySel.selectedIndex;
    if (selectedIndex <= 0) {
        distSel.innerHTML = '<option value="">Quận/Huyện...</option>';
        return;
    }
    
    const option = citySel.options[selectedIndex];
    const code = option.dataset.code;

    try {
        const res = await fetch(`${PROVINCE_API_HOME}p/${code}?depth=2`);
        const data = await res.json();
        if (data.districts) {
            data.districts.sort((a,b)=>a.name.localeCompare(b.name));
            let html = '<option value="">Quận/Huyện...</option>';
            data.districts.forEach(item => {
                html += `<option value="${item.name}" data-code="${item.code}">${item.name}</option>`;
            });
            distSel.innerHTML = html;
            distSel.disabled = false;
        }
    } catch(e) { console.error(e); }
}

async function loadAdvWards() {
    const distSel = document.getElementById('advDistrict');
    const wardSel = document.getElementById('advWard');
    
    wardSel.innerHTML = '<option value="">Đang tải...</option>';
    wardSel.disabled = true;

    const selectedIndex = distSel.selectedIndex;
    if (selectedIndex <= 0) {
        wardSel.innerHTML = '<option value="">Phường/Xã...</option>';
        return;
    }

    const option = distSel.options[selectedIndex];
    const code = option.dataset.code;

    try {
        const res = await fetch(`${PROVINCE_API_HOME}d/${code}?depth=2`);
        const data = await res.json();
        if (data.wards) {
            data.wards.sort((a,b)=>a.name.localeCompare(b.name));
            let html = '<option value="">Phường/Xã...</option>';
            data.wards.forEach(item => {
                html += `<option value="${item.name}">${item.name}</option>`;
            });
            wardSel.innerHTML = html;
            wardSel.disabled = false;
        }
    } catch(e) { console.error(e); }
}
