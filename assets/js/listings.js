document.addEventListener('DOMContentLoaded', () => {
    renderListingsPage();
});

function renderListingsPage() {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section') || 'latest';

    const titleEl = document.getElementById('listings-title');
    const countEl = document.getElementById('listings-count');
    const listEl = document.getElementById('all-room-list');

    if (!titleEl || !countEl || !listEl) return;

    const rooms = Storage.getRooms();
    const normalized = (text = '') => text.toLowerCase().replace(/\s+/g, ' ').trim();
    const isPhongTro = (type = '') => {
        const value = normalized(type);
        return value === 'phòng trọ' || value === 'nhà trọ' || value === 'nhà trọ, phòng trọ';
    };

    const sectionMap = {
        latest: {
            title: 'Tin đăng mới nhất',
            filter: () => true
        },
        'phong-tro': {
            title: 'Nhà trọ, phòng trọ',
            filter: (room) => isPhongTro(room.type || 'Phòng trọ')
        },
        'nha-nguyen-can': {
            title: 'Nhà nguyên căn',
            filter: (room) => normalized(room.type) === 'nhà nguyên căn'
        },
        'can-ho': {
            title: 'Căn hộ',
            filter: (room) => normalized(room.type) === 'căn hộ'
        },
        'ky-tuc-xa': {
            title: 'Ký túc xá',
            filter: (room) => normalized(room.type) === 'ký túc xá'
        }
    };

    const activeSection = sectionMap[section] || sectionMap.latest;
    const sectionRooms = rooms.filter(activeSection.filter);

    titleEl.textContent = activeSection.title;
    countEl.textContent = `${sectionRooms.length} tin đăng`;

    if (sectionRooms.length === 0) {
        listEl.innerHTML = '<div class="col-12 text-muted py-3">Chưa có tin đăng trong mục này.</div>';
    } else {
        listEl.innerHTML = sectionRooms.map(buildRoomCard).join('');
    }

    markActiveTab(section);
}

function markActiveTab(section) {
    const tabContainer = document.getElementById('listings-tabs');
    if (!tabContainer) return;

    tabContainer.querySelectorAll('a').forEach((link) => {
        const href = link.getAttribute('href') || '';
        const isActive = href.includes(`section=${section}`) || (section === 'latest' && href.includes('section=latest'));
        link.classList.toggle('active', isActive);
    });
}

function buildRoomCard(room) {
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
}

function viewRoom(id) {
    window.location.href = `detail.html?id=${id}`;
}
