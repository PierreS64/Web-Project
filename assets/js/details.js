// Override renderHomeRooms to prevent error on detail page
// Since main.js calls it automatically
window.renderHomeRooms = function() {};

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if(!id) {
        document.getElementById('detail-container').innerHTML = '<div class="alert alert-danger">Không tìm thấy phòng!</div>';
        return;
    }

    const room = Storage.getRoomById(id);
    if(!room) {
       document.getElementById('detail-container').innerHTML = '<div class="alert alert-warning">Phòng không tồn tại hoặc đã bị xóa.</div>';
       return; 
    }

    renderDetail(room);
});

let detailGalleryState = {
    images: [],
    index: 0
};

function renderDetail(room) {
    if (!room
        || !(room.title && room.type && room.address && room.description && room.ownerName && room.ownerPhone)
        || !Array.isArray(room.images) || room.images.length === 0
        || !Number.isFinite(Number(room.price)) || Number(room.price) <= 0
        || !Number.isFinite(Number(room.area)) || Number(room.area) <= 0
        || !Array.isArray(room.amenities)
        || !Array.isArray(room.targets)
        || !Array.isArray(room.surroundings)) {
        document.getElementById('detail-container').innerHTML = '<div class="alert alert-danger">Dữ liệu phòng không hợp lệ hoặc thiếu trường bắt buộc.</div>';
        return;
    }

    const price = Utils.formatCurrency(room.price);
    const images = room.images && Array.isArray(room.images) ? room.images : [];
    const ownerName = room.ownerName;
    const ownerPhone = room.ownerPhone;
    const phoneDisplay = ownerPhone;
    
    // Map Amenities
    const amenitiesHtml = room.amenities.map(item => `
        <div class="info-item"><i class="${getIcon(item)}"></i> ${item}</div>
    `).join('');

    // Map Targets
    const targetsHtml = room.targets.map(item => `
        <div class="info-item"><i class="${getIcon(item)}"></i> ${item}</div>
    `).join('');

    // Map Surroundings
    const surroundingsHtml = room.surroundings.map(item => `
        <div class="info-item"><i class="${getIcon(item)}"></i> ${item}</div>
    `).join('');

    const html = `
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="index.html">Trang chủ</a></li>
                <li class="breadcrumb-item active" aria-current="page">${room.type}</li>
            </ol>
        </nav>

        <div class="row">
            <div class="col-lg-8">
                <!-- Header -->
                <h1 class="detail-header-title">${room.title}</h1>
                <p class="detail-address"><i class="fa-solid fa-location-dot"></i> ${room.address}</p>
                
                <!-- Images -->
                ${renderDetailGallery(images, room.title)}
                
                <!-- Intro -->
                <div class="my-4">
                    <h5 class="section-title">Giới thiệu</h5>
                    <p style="white-space: pre-line;">${room.description}</p>
                    <hr class="text-secondary opacity-25 my-3">
                    <p><strong>Diện tích:</strong> ${room.area} m²</p>
                    <p><strong>Giá điện:</strong> ${room.elecPrice ? Utils.formatCurrency(room.elecPrice) + ' đ/kW' : 'Miễn phí'}</p>
                    <p><strong>Giá nước:</strong> ${room.waterPrice ? Utils.formatCurrency(room.waterPrice) + ' đ/tháng' : 'Miễn phí'}</p>
                    <p><strong>Wifi:</strong> ${room.wifiPrice ? Utils.formatCurrency(room.wifiPrice) + ' đ/tháng' : 'Miễn phí'}</p>
                    <p><strong>Dịch vụ:</strong> ${room.servicePrice ? Utils.formatCurrency(room.servicePrice) + ' đ/tháng' : 'Miễn phí'}</p>
                </div>

                <!-- Đối tượng -->
                ${targetsHtml ? `
                <hr class="text-secondary opacity-25 my-4">
                <div class="mb-4">
                    <h5 class="section-title">Đối tượng</h5>
                    <div class="info-grid">${targetsHtml}</div>
                </div>` : ''}

                <!-- Tiện nghi -->
                ${amenitiesHtml ? `
                <hr class="text-secondary opacity-25 my-4">
                <div class="mb-4">
                    <h5 class="section-title">Tiện nghi</h5>
                    <div class="info-grid">${amenitiesHtml}</div>
                </div>` : ''}

                <!-- Môi trường -->
                ${surroundingsHtml ? `
                <hr class="text-secondary opacity-25 my-4">
                <div class="mb-4">
                    <h5 class="section-title">Môi trường xung quanh</h5>
                    <div class="info-grid">${surroundingsHtml}</div>
                </div>` : ''}

            </div>

            <div class="col-lg-4">
                <div class="contact-card sticky-contact">
                    <div class="mb-3">
                        <span class="text-muted small">Giá thuê</span>
                        <div class="detail-price">${price}đ/tháng</div>
                    </div>
                    
                    <div class="d-flex align-items-center mb-4">
                        <div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white me-3" style="width: 50px; height: 50px;">
                            <i class="fa-solid fa-user fa-lg"></i>
                        </div>
                        <div>
                            <div class="fw-bold">${ownerName}</div>
                            <div class="text-muted small">${phoneDisplay}</div>
                        </div>
                    </div>

                    <div class="d-grid gap-2">
                        <button class="btn btn-danger py-2 fw-bold" ${ownerPhone ? `onclick="window.open('tel:${ownerPhone}')"` : 'disabled'}><i class="fa-solid fa-phone"></i> ${phoneDisplay}</button>
                        <button class="btn zalo-btn py-2" ${ownerPhone ? `onclick="window.open('https://zalo.me/${ownerPhone}', '_blank')"` : 'disabled'}><i class="fa-solid fa-comment"></i> Nhắn Zalo</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('detail-container').innerHTML = html;
    initDetailGallery(images);
}

function renderDetailGallery(images, title) {
    if (!images || images.length === 0) {
        return '';
    }

    const slides = images.map((src, idx) => `
        <div class="detail-gallery-slide" data-index="${idx}">
            <img src="${src}" alt="${title} - ảnh ${idx + 1}">
        </div>
    `).join('');

    return `
        <div class="detail-gallery">
            <button class="detail-gallery-nav prev" type="button" onclick="prevDetailImage()" aria-label="Ảnh trước">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <div class="detail-gallery-track" id="detailGalleryTrack">
                ${slides}
            </div>
            <button class="detail-gallery-nav next" type="button" onclick="nextDetailImage()" aria-label="Ảnh tiếp theo">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
        <div class="detail-gallery-counter" id="detailGalleryCounter"></div>
    `;
}

function initDetailGallery(images) {
    detailGalleryState.images = images;
    detailGalleryState.index = 0;
    syncDetailGallery();
}

function syncDetailGallery() {
    const track = document.getElementById('detailGalleryTrack');
    const counter = document.getElementById('detailGalleryCounter');
    if (!track || !counter) return;

    const slides = Array.from(track.querySelectorAll('.detail-gallery-slide'));
    const total = slides.length;
    if (total === 0) return;

    const currentIndex = detailGalleryState.index;
    const prevIndex = (currentIndex - 1 + total) % total;
    const nextIndex = (currentIndex + 1) % total;

    slides.forEach((slide, idx) => {
        slide.classList.remove('is-active', 'is-prev', 'is-next');
        if (idx === currentIndex) slide.classList.add('is-active');
        else if (idx === prevIndex) slide.classList.add('is-prev');
        else if (idx === nextIndex) slide.classList.add('is-next');
    });

    counter.textContent = `${currentIndex + 1} / ${total}`;
}

function nextDetailImage() {
    const total = detailGalleryState.images.length;
    if (total <= 1) return;
    detailGalleryState.index = (detailGalleryState.index + 1) % total;
    syncDetailGallery();
}

function prevDetailImage() {
    const total = detailGalleryState.images.length;
    if (total <= 1) return;
    detailGalleryState.index = (detailGalleryState.index - 1 + total) % total;
    syncDetailGallery();
}

window.nextDetailImage = nextDetailImage;
window.prevDetailImage = prevDetailImage;

function getIcon(name) {
    const map = {
        'Đi học': 'fa-solid fa-graduation-cap',
        'Đi làm': 'fa-solid fa-briefcase',
        'Cặp đôi': 'fa-solid fa-user-group',
        'Gác lửng': 'fa-solid fa-stairs',
        'Wifi': 'fa-solid fa-wifi',
        'Vệ sinh trong': 'fa-solid fa-toilet',
        'Phòng tắm': 'fa-solid fa-bath',
        'Kệ bếp': 'fa-solid fa-kitchen-set',
        'Điều hòa': 'fa-regular fa-snowflake',
        'Tủ lạnh': 'fa-solid fa-snowflake', // FontAwesome free might duplicate
        'Giường nệm': 'fa-solid fa-bed',
        'Tủ áo quần': 'fa-solid fa-shirt',
        'Ban công/sân thượng': 'fa-regular fa-sun',
        'Thang máy': 'fa-solid fa-elevator',
        'Bãi để xe riêng': 'fa-solid fa-motorcycle',
        'Chợ': 'fa-solid fa-store',
        'Siêu thị': 'fa-solid fa-cart-shopping',
        'Trường học': 'fa-solid fa-school',
        'Công viên': 'fa-solid fa-tree',
        'Bến xe Bus': 'fa-solid fa-bus',
        'Cây xanh': 'fa-solid fa-leaf'
    };
    return map[name] || 'fa-solid fa-check';
}
