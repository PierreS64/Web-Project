document.addEventListener('DOMContentLoaded', () => {
    initCategoryPage();
});

function isRoomDataValid(room) {
    return room
        && typeof room.title === 'string' && room.title.trim()
        && typeof room.type === 'string' && room.type.trim()
        && typeof room.address === 'string' && room.address.trim()
        && Array.isArray(room.images) && room.images.length > 0
        && Number.isFinite(Number(room.price)) && Number(room.price) > 0
        && Number.isFinite(Number(room.area)) && Number(room.area) > 0;
}

function initCategoryPage() {
    const pageRoot = document.querySelector('.category-page-wrap');
    if (!pageRoot) return;

    const categoryKey = pageRoot.dataset.category || 'phong-tro';
    const config = getCategoryConfig(categoryKey);

    const titleEl = document.getElementById('category-page-title');
    const breadcrumbEl = document.getElementById('category-breadcrumb-current');
    const resultTitleEl = document.getElementById('category-result-title');
    const listEl = document.getElementById('category-room-list');
    const sortSelect = document.getElementById('sortSelect');
    const resetBtn = document.getElementById('resetFiltersBtn');
    const keywordInput = document.getElementById('categoryKeyword');
    const quickPriceSelect = document.getElementById('categoryPriceQuick');
    const typeSelect = document.getElementById('categoryTypeSelect');
    const searchBtn = document.getElementById('categorySearchBtn');

    if (!titleEl || !breadcrumbEl || !resultTitleEl || !listEl || !sortSelect || !resetBtn) return;

    titleEl.textContent = config.heroTitle;
    breadcrumbEl.textContent = config.breadcrumb;

    const isFavoriteMode = pageRoot.dataset.favorites === '1';
    const canUseFavorites = typeof Favorites !== 'undefined' && typeof Favorites.getAll === 'function';
    const favoriteIds = isFavoriteMode && canUseFavorites ? Favorites.getAll() : [];

    let allRooms = Storage.getRooms().filter(isRoomDataValid).filter(config.filterByType);
    if (isFavoriteMode) {
        allRooms = allRooms.filter((room) => favoriteIds.includes(room.id));
        titleEl.textContent = 'PHÒNG TRỌ YÊU THÍCH CỦA BẠN';
        breadcrumbEl.textContent = 'Danh sách yêu thích';
        resultTitleEl.textContent = `Tổng ${allRooms.length} kết quả`;
    }

    const applyAll = () => {
        const keyword = (keywordInput ? keywordInput.value : '').trim().toLowerCase();
        const quickPrice = quickPriceSelect ? quickPriceSelect.value : 'all';

        const filtered = allRooms
            .filter((room) => {
                if (!keyword) return true;
                const title = (room.title || '').toLowerCase();
                const address = (room.address || [room.street, room.ward, room.district, room.city].filter(Boolean).join(', ')).toLowerCase();
                return title.includes(keyword) || address.includes(keyword);
            })
            .filter((room) => matchPrice(room, quickPrice))
            .filter((room) => matchPrice(room, getRadioValue('priceRange')))
            .filter((room) => matchArea(room, getRadioValue('areaRange')))
            .filter((room) => matchMultiCheckbox(room.amenities, getCheckboxValues('amenities')))
            .filter((room) => matchMultiCheckbox(room.surroundings, getCheckboxValues('surroundings')))
            .filter((room) => matchTarget(room.targets, getRadioValue('target')));

        const sorted = sortRooms(filtered, sortSelect.value);
        resultTitleEl.textContent = `Tổng ${sorted.length} kết quả`;

        if (sorted.length === 0) {
            listEl.innerHTML = '<div class="category-empty">Không có tin đăng phù hợp bộ lọc hiện tại.</div>';
            return;
        }

        listEl.innerHTML = sorted.map(buildCategoryCard).join('');
        if (typeof setupFavoriteButtons === 'function') setupFavoriteButtons();
        if (typeof syncAllFavoriteButtons === 'function') syncAllFavoriteButtons();
    };

    if (isFavoriteMode && !Storage.getCurrentUser()) {
        listEl.innerHTML = '<div class="category-empty">Vui lòng đăng nhập để xem phòng yêu thích của bạn.</div>';
        resultTitleEl.textContent = 'Tổng 0 kết quả';
        return;
    }

    document.querySelectorAll('input[name="priceRange"]').forEach((input) => input.addEventListener('change', applyAll));
    document.querySelectorAll('input[name="areaRange"]').forEach((input) => input.addEventListener('change', applyAll));
    document.querySelectorAll('input[name="amenities"]').forEach((input) => input.addEventListener('change', applyAll));
    document.querySelectorAll('input[name="surroundings"]').forEach((input) => input.addEventListener('change', applyAll));
    document.querySelectorAll('input[name="target"]').forEach((input) => input.addEventListener('change', applyAll));
    sortSelect.addEventListener('change', applyAll);

    if (searchBtn) {
        searchBtn.addEventListener('click', applyAll);
    }

    if (keywordInput) {
        keywordInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                applyAll();
            }
        });
    }

    if (quickPriceSelect) {
        quickPriceSelect.addEventListener('change', () => {
            const matchedRadio = document.querySelector(`input[name="priceRange"][value="${quickPriceSelect.value}"]`);
            if (matchedRadio) {
                matchedRadio.checked = true;
            }
            applyAll();
        });
    }

    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            const routeMap = {
                'tat-ca': 'tat-ca-tin-dang.html',
                'phong-tro': 'phong-tro.html',
                'nha-nguyen-can': 'nha-nguyen-can.html',
                'can-ho': 'can-ho.html',
                'ky-tuc-xa': 'ky-tuc-xa.html'
            };
            const target = routeMap[typeSelect.value] || 'phong-tro.html';
            window.location.href = target;
        });
    }

    resetBtn.addEventListener('click', () => {
        resetGroup('priceRange', 'all');
        resetGroup('areaRange', 'all');
        resetGroup('target', 'all');
        if (keywordInput) keywordInput.value = '';
        if (quickPriceSelect) quickPriceSelect.value = 'all';
        document.querySelectorAll('input[name="amenities"], input[name="surroundings"]').forEach((cb) => {
            cb.checked = false;
        });
        sortSelect.value = 'newest';
        applyAll();
    });

    applyAll();
}

function getCategoryConfig(key) {
    const normalizeType = (text = '') => text.toLowerCase().replace(/\s+/g, ' ').trim();
    const isPhongTro = (type = '') => {
        const t = normalizeType(type);
        return t === 'nhà trọ, phòng trọ' || t === 'nhà trọ' || t === 'phòng trọ';
    };

    const configMap = {
        'tat-ca': {
            heroTitle: 'TẤT CẢ TIN ĐĂNG MỚI NHẤT',
            breadcrumb: 'Tất cả tin đăng',
            filterByType: () => true
        },
        'phong-tro': {
            heroTitle: 'TÌM NHÀ TRỌ, PHÒNG TRỌ GIÁ RẺ, MỚI NHẤT',
            breadcrumb: 'Nhà trọ, phòng trọ',
            filterByType: (room) => isPhongTro(room.type)
        },
        'nha-nguyen-can': {
            heroTitle: 'TÌM NHÀ NGUYÊN CĂN GIÁ RẺ, MỚI NHẤT',
            breadcrumb: 'Nhà nguyên căn',
            filterByType: (room) => normalizeType(room.type) === 'nhà nguyên căn'
        },
        'can-ho': {
            heroTitle: 'TÌM CĂN HỘ CHO THUÊ GIÁ RẺ, MỚI NHẤT',
            breadcrumb: 'Căn hộ',
            filterByType: (room) => normalizeType(room.type) === 'căn hộ'
        },
        'ky-tuc-xa': {
            heroTitle: 'TÌM KÝ TÚC XÁ GIÁ RẺ, MỚI NHẤT',
            breadcrumb: 'Ký túc xá',
            filterByType: (room) => normalizeType(room.type) === 'ký túc xá'
        }
    };

    return configMap[key] || configMap['phong-tro'];
}

function getRadioValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : 'all';
}

function getCheckboxValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((item) => item.value);
}

function resetGroup(name, value) {
    const target = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (target) target.checked = true;
}

function matchPrice(room, rangeValue) {
    const price = Number(room.price) || 0;
    if (rangeValue === 'under-3') return price < 3000000;
    if (rangeValue === '3-5') return price >= 3000000 && price <= 5000000;
    if (rangeValue === '5-10') return price > 5000000 && price <= 10000000;
    if (rangeValue === 'over-10') return price > 10000000;
    return true;
}

function matchArea(room, rangeValue) {
    const area = Number(room.area) || 0;
    if (rangeValue === 'under-20') return area < 20;
    if (rangeValue === '20-40') return area >= 20 && area <= 40;
    if (rangeValue === '40-60') return area > 40 && area <= 60;
    if (rangeValue === '60-80') return area > 60 && area <= 80;
    if (rangeValue === 'over-80') return area > 80;
    return true;
}

function matchMultiCheckbox(roomValues = [], selectedValues = []) {
    if (selectedValues.length === 0) return true;
    const source = Array.isArray(roomValues) ? roomValues : [];
    return selectedValues.every((value) => source.includes(value));
}

function matchTarget(targets = [], selectedTarget) {
    if (!selectedTarget || selectedTarget === 'all') return true;
    const source = Array.isArray(targets) ? targets : [];
    return source.includes(selectedTarget);
}

function sortRooms(rooms, sortBy) {
    const result = [...rooms];
    if (sortBy === 'price-asc') {
        result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-desc') {
        result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'area-desc') {
        result.sort((a, b) => (Number(b.area) || 0) - (Number(a.area) || 0));
    } else {
        result.sort((a, b) => {
            const idA = Number(String(a.id || '').replace(/\D/g, '')) || 0;
            const idB = Number(String(b.id || '').replace(/\D/g, '')) || 0;
            return idB - idA;
        });
    }
    return result;
}

function buildCategoryCard(room) {
    const priceText = Utils.formatCurrency(Number(room.price) || 0);
    const areaText = Number(room.area) || 0;
    const locationText = room.address;
    const thumb = Array.isArray(room.images) && room.images.length > 0 ? room.images[0] : '';
    const amenityPreview = Array.isArray(room.amenities) && room.amenities.length > 0
        ? `<div class="room-extra-info"><i class="fa-solid fa-square-check"></i> ${room.amenities.slice(0, 3).join(', ')}</div>`
        : '';
    const typeClass = getCategoryTypeClass(room.type);

    return `
        <article class="category-room-card" data-room-id="${room.id}" onclick="openRoomDetail('${room.id}')">
            <div class="category-room-image-wrap">
                <img src="${thumb}" alt="${room.title}" class="category-room-image">
                <button type="button" class="room-fav-btn" aria-label="Yêu thích">
                    <i class="fa-regular fa-heart"></i>
                </button>
            </div>
            <div class="category-room-content">
                <h4 class="category-room-title">${room.title}</h4>
                <div class="category-room-price">Từ ${priceText}đ/tháng</div>
                <div class="category-room-tags">
                    <span class="${typeClass}">${room.type}</span>
                    <span>${areaText}m2</span>
                </div>
                <div class="category-room-location"><i class="fa-solid fa-location-dot"></i> ${locationText}</div>
                ${amenityPreview}
            </div>
        </article>
    `;
}

function getCategoryTypeClass(type) {
    const normalized = String(type || '').toLowerCase().trim();
    if (normalized === 'nhà nguyên căn') return 'tag-type-house';
    if (normalized === 'căn hộ') return 'tag-type-apartment';
    if (normalized === 'ký túc xá') return 'tag-type-dorm';
    return 'tag-type-motel';
}

function openRoomDetail(id) {
    window.location.href = `chi-tiet.html?id=${id}`;
}
