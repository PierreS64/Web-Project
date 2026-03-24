/**
 * customer.js
 * Logic cho trang khach-hang.html
 */

const currentUser = Storage.getCurrentUser();
if (!currentUser || currentUser.role !== 'tenant') {
    alert('Bạn không có quyền truy cập trang này!');
    window.location.href = 'index.html';
}

let tenantActionModal;
let tenantInvoiceModal;
let paymentQrModal;
let issueModal;
let tenantIssueDetailModal;

let selectedTenantRoomId = null;
let selectedTenantInvoiceId = null;
let selectedTenantIssueId = null;
let paymentPollTimer = null;
let selectedIssueImages = [];

const TENANT_ISSUE_FILTER_KEY = 'tenant_issue_status_filter';

let tenantActionGalleryState = {
    images: [],
    index: 0
};

let tenantIssueGalleryState = {
    images: [],
    index: 0
};

const MAX_ISSUE_IMAGES = 10;
const MAX_ISSUE_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_ISSUE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

function isNonEmptyText(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

document.addEventListener('DOMContentLoaded', () => {
    tenantActionModal = new bootstrap.Modal(document.getElementById('tenantActionModal'));
    tenantInvoiceModal = new bootstrap.Modal(document.getElementById('tenantInvoiceModal'));
    paymentQrModal = new bootstrap.Modal(document.getElementById('paymentQrModal'));
    issueModal = new bootstrap.Modal(document.getElementById('issueModal'));
    tenantIssueDetailModal = new bootstrap.Modal(document.getElementById('tenantIssueDetailModal'));

    renderTenantRoomList();
    renderTenantNotifications();
    setInterval(renderTenantNotifications, 30000);

    const searchInput = document.getElementById('tenantSearchInput');
    if (searchInput) searchInput.addEventListener('input', renderTenantRoomList);

    const invoiceFilter = document.getElementById('tenantInvoiceFilter');
    if (invoiceFilter) invoiceFilter.addEventListener('change', renderTenantRoomList);

    const issueStatusFilter = document.getElementById('tenantIssueStatusFilter');
    if (issueStatusFilter) {
        issueStatusFilter.value = readTenantIssueFilter();
        issueStatusFilter.addEventListener('change', () => {
            writeTenantIssueFilter(issueStatusFilter.value);
            renderTenantIssueHistory();
        });
    }

    initIssueImageUploadHandlers();
});

function getIssueStatusConfig(status) {
    if (status === 'resolved') {
        return {
            label: 'Đã xử lý',
            tagClass: 'resolved',
            textClass: 'text-success'
        };
    }

    return {
        label: 'Chưa xử lý',
        tagClass: 'pending',
        textClass: 'text-danger'
    };
}

function getSelectedTenantRoom() {
    if (!selectedTenantRoomId) return null;
    return Storage.getRoomById(selectedTenantRoomId);
}

function getTenantIssueReports(room) {
    if (!room || !Array.isArray(room.issueReports)) return [];

    return room.issueReports
        .filter((issue) => issue && issue.tenantPhone === currentUser.phone)
        .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

function readTenantIssueFilter() {
    const saved = (localStorage.getItem(TENANT_ISSUE_FILTER_KEY) || '').toLowerCase();
    if (saved === 'pending' || saved === 'resolved' || saved === 'all') return saved;
    return 'pending';
}

function writeTenantIssueFilter(value) {
    const normalized = (value || '').toLowerCase();
    if (normalized !== 'pending' && normalized !== 'resolved' && normalized !== 'all') return;
    localStorage.setItem(TENANT_ISSUE_FILTER_KEY, normalized);
}

function switchIssueTab(tab) {
    const reportBtn = document.getElementById('issueTabReportBtn');
    const historyBtn = document.getElementById('issueTabHistoryBtn');
    const reportPane = document.getElementById('issueReportPane');
    const historyPane = document.getElementById('issueHistoryPane');
    const submitBtn = document.getElementById('issueSubmitBtn');

    if (!reportBtn || !historyBtn || !reportPane || !historyPane || !submitBtn) return;

    const isHistory = tab === 'history';
    reportBtn.classList.toggle('active', !isHistory);
    historyBtn.classList.toggle('active', isHistory);
    reportPane.classList.toggle('d-none', isHistory);
    historyPane.classList.toggle('d-none', !isHistory);
    submitBtn.classList.toggle('d-none', isHistory);

    if (isHistory) {
        renderTenantIssueHistory();
    }
}

window.switchIssueTab = switchIssueTab;

function buildIssueImagePreviewHtml(issue) {
    const images = Array.isArray(issue.images) ? issue.images : [];
    const firstImage = images[0] && images[0].base64 ? images[0].base64 : '';
    if (firstImage) {
        return `<img src="${firstImage}" alt="${issue.title || 'issue-image'}">`;
    }

    return '<div class="issue-placeholder-image">Không có ảnh</div>';
}

function renderTenantIssueHistory() {
    const listEl = document.getElementById('tenantIssueHistoryList');
    if (!listEl) return;

    const room = getSelectedTenantRoom();
    const statusFilter = (document.getElementById('tenantIssueStatusFilter')?.value || readTenantIssueFilter()).toLowerCase();
    const issues = getTenantIssueReports(room).filter((issue) => {
        if (statusFilter === 'all') return true;
        return (issue.status || 'pending') === statusFilter;
    });

    if (!issues.length) {
        listEl.innerHTML = '<div class="issue-empty-state">Bạn chưa gửi báo cáo sự cố nào cho phòng này.</div>';
        return;
    }

    listEl.innerHTML = issues.map((issue) => {
        const statusConfig = getIssueStatusConfig(issue.status);
        const createdText = new Date(issue.createdAt || Date.now()).toLocaleString('vi-VN');

        return `
            <article class="issue-history-card" onclick="openTenantIssueDetail('${issue.id}')">
                <div class="issue-history-content">
                    <div class="issue-history-title">${issue.title || 'Sự cố không tiêu đề'}</div>
                    <div class="issue-history-description">${issue.description || 'Không có mô tả.'}</div>
                    <div class="issue-history-meta">Báo cáo lúc: ${createdText}</div>
                </div>
                <div class="issue-history-image-box">
                    ${buildIssueImagePreviewHtml(issue)}
                    <span class="issue-status-tag ${statusConfig.tagClass}">${statusConfig.label}</span>
                </div>
            </article>
        `;
    }).join('');
}

function renderTenantIssueGallery(images) {
    const track = document.getElementById('tenantIssueGalleryTrack');
    if (!track) return;

    if (!Array.isArray(images) || images.length === 0) {
        track.innerHTML = `
            <div class="owner-action-gallery-slide is-active" data-index="0" style="left:0;width:100%;opacity:1;transform:none;">
                <div class="issue-placeholder-image">Không có ảnh sự cố</div>
            </div>
        `;
        return;
    }

    track.innerHTML = images.map((src, idx) => `
        <div class="owner-action-gallery-slide" data-index="${idx}">
            <img src="${src}" alt="issue-image-${idx + 1}">
        </div>
    `).join('');

    syncTenantIssueGallery();
}

function syncTenantIssueGallery() {
    const track = document.getElementById('tenantIssueGalleryTrack');
    if (!track) return;

    const slides = Array.from(track.querySelectorAll('.owner-action-gallery-slide'));
    const total = slides.length;
    if (total === 0) return;

    const currentIndex = tenantIssueGalleryState.index;
    const prevIndex = (currentIndex - 1 + total) % total;
    const nextIndex = (currentIndex + 1) % total;

    slides.forEach((slide, idx) => {
        slide.classList.remove('is-active', 'is-prev', 'is-next');
        if (total === 1) {
            if (idx === currentIndex) slide.classList.add('is-active');
            return;
        }

        if (total === 2) {
            if (idx === currentIndex) slide.classList.add('is-active');
            else if (idx === nextIndex) slide.classList.add('is-next');
            return;
        }

        if (idx === currentIndex) slide.classList.add('is-active');
        else if (idx === prevIndex) slide.classList.add('is-prev');
        else if (idx === nextIndex) slide.classList.add('is-next');
    });

    const gallery = track.closest('.owner-action-gallery');
    if (!gallery) return;
    const prevBtn = gallery.querySelector('.owner-action-gallery-nav.prev');
    const nextBtn = gallery.querySelector('.owner-action-gallery-nav.next');
    const disabled = total <= 1;
    if (prevBtn) prevBtn.disabled = disabled;
    if (nextBtn) nextBtn.disabled = disabled;
}

function nextTenantIssueImage() {
    const total = tenantIssueGalleryState.images.length;
    if (total <= 1) return;
    tenantIssueGalleryState.index = (tenantIssueGalleryState.index + 1) % total;
    syncTenantIssueGallery();
}

function prevTenantIssueImage() {
    const total = tenantIssueGalleryState.images.length;
    if (total <= 1) return;
    tenantIssueGalleryState.index = (tenantIssueGalleryState.index - 1 + total) % total;
    syncTenantIssueGallery();
}

window.nextTenantIssueImage = nextTenantIssueImage;
window.prevTenantIssueImage = prevTenantIssueImage;

function openTenantIssueDetail(issueId) {
    const room = getSelectedTenantRoom();
    if (!room) return;

    const issues = getTenantIssueReports(room);
    const issue = issues.find((item) => item.id === issueId);
    if (!issue) return;

    selectedTenantIssueId = issue.id;
    const statusConfig = getIssueStatusConfig(issue.status);

    document.getElementById('tenantIssueDetailTitle').textContent = issue.title || 'Chi tiết sự cố';
    document.getElementById('tenantIssueDetailStatus').textContent = statusConfig.label;
    document.getElementById('tenantIssueDetailStatus').className = statusConfig.textClass;
    document.getElementById('tenantIssueDetailCreatedAt').textContent = new Date(issue.createdAt || Date.now()).toLocaleString('vi-VN');
    document.getElementById('tenantIssueDetailRoomTitle').textContent = room.title || '-';
    document.getElementById('tenantIssueDetailDescription').textContent = issue.description || '-';

    const imageSources = (Array.isArray(issue.images) ? issue.images : [])
        .map((item) => item && item.base64)
        .filter(Boolean);

    tenantIssueGalleryState.images = imageSources;
    tenantIssueGalleryState.index = 0;
    renderTenantIssueGallery(imageSources);

    tenantIssueDetailModal.show();
}

window.openTenantIssueDetail = openTenantIssueDetail;

function initIssueImageUploadHandlers() {
    const uploadArea = document.getElementById('issueImageUploadArea');
    const fileInput = document.getElementById('issueImages');

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleIssueImageSelection(e.target.files));

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
        handleIssueImageSelection(e.dataTransfer.files);
    });
}

async function handleIssueImageSelection(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    clearIssueImageValidationMessage();

    for (const file of files) {
        if (selectedIssueImages.length >= MAX_ISSUE_IMAGES) {
            showIssueImageValidationMessage(`Chỉ được chọn tối đa ${MAX_ISSUE_IMAGES} ảnh.`, 'warning');
            break;
        }

        if (!ALLOWED_ISSUE_IMAGE_TYPES.includes(file.type)) {
            showIssueImageValidationMessage(`File ${file.name} không đúng định dạng ảnh.`, 'danger');
            continue;
        }

        if (file.size > MAX_ISSUE_IMAGE_SIZE) {
            showIssueImageValidationMessage(`File ${file.name} vượt quá 5MB.`, 'danger');
            continue;
        }

        try {
            const base64 = await convertIssueImageToBase64(file);
            selectedIssueImages.push({
                name: file.name,
                size: file.size,
                base64
            });
        } catch (error) {
            console.error(error);
            showIssueImageValidationMessage(`Không thể xử lý file ${file.name}.`, 'danger');
        }
    }

    renderIssueImagePreview();
    document.getElementById('issueImages').value = '';
}

function removeIssueImage(index) {
    selectedIssueImages.splice(index, 1);
    renderIssueImagePreview();
}

window.removeIssueImage = removeIssueImage;

function renderIssueImagePreview() {
    const container = document.getElementById('issueImagePreviewContainer');
    const prompt = document.getElementById('issueUploadPrompt');
    if (!container || !prompt) return;

    if (selectedIssueImages.length === 0) {
        container.innerHTML = '';
        prompt.style.display = 'block';
        return;
    }

    prompt.style.display = 'none';

    const cards = selectedIssueImages.map((img, index) => {
        const sizeMb = `${(img.size / 1024 / 1024).toFixed(2)}MB`;
        return `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card h-100 shadow-sm position-relative">
                    <img src="${img.base64}" alt="${img.name || 'issue-image'}" class="card-img-top" style="height: 140px; object-fit: cover;">
                    <div class="card-body p-2">
                        <div class="small text-truncate" title="${img.name || 'Ảnh sự cố'}">${img.name || 'Ảnh sự cố'}</div>
                        <div class="text-muted small">${sizeMb}</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" onclick="removeIssueImage(${index})">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <small class="text-muted fw-semibold">Đã chọn ${selectedIssueImages.length}/${MAX_ISSUE_IMAGES} ảnh</small>
        </div>
        <div class="row g-2">${cards}</div>
    `;
}

function showIssueImageValidationMessage(message, type) {
    const msg = document.getElementById('issueImageValidationMsg');
    if (!msg) return;
    msg.className = `alert alert-${type} mt-2`;
    msg.textContent = message;
    msg.classList.remove('d-none');
}

function clearIssueImageValidationMessage() {
    const msg = document.getElementById('issueImageValidationMsg');
    if (!msg) return;
    msg.classList.add('d-none');
    msg.textContent = '';
}

function convertIssueImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
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

                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };

            img.onerror = reject;
        };

        reader.onerror = reject;
    });
}

function getTenantRooms() {
    return Storage.getRooms().filter((room) => room.contract && room.contract.tenantPhone === currentUser.phone);
}

function renderTenantRoomList() {
    const listEl = document.getElementById('tenantRoomList');
    const emptyEl = document.getElementById('tenantEmptyState');
    if (!listEl || !emptyEl) return;

    const keyword = (document.getElementById('tenantSearchInput').value || '').toLowerCase().trim();
    const invoiceFilter = document.getElementById('tenantInvoiceFilter').value;

    const rooms = getTenantRooms().filter((room) => {
        const title = (room.title || '').toLowerCase();
        const address = (room.address || '').toLowerCase();
        const hitKeyword = title.includes(keyword) || address.includes(keyword);

        if (!hitKeyword) return false;

        const invoices = Array.isArray(room.invoices) ? room.invoices : [];
        const hasUnpaid = invoices.some((inv) => (inv.status || 'unpaid') !== 'paid');
        const hasPaid = invoices.some((inv) => inv.status === 'paid');

        if (invoiceFilter === 'unpaid') return hasUnpaid;
        if (invoiceFilter === 'paid') return hasPaid;
        return true;
    });

    if (!rooms.length) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('d-none');
        return;
    }

    emptyEl.classList.add('d-none');
    listEl.innerHTML = rooms.map((room) => buildTenantRoomCard(room)).join('');
}

function buildTenantRoomCard(room) {
    const image = Array.isArray(room.images) && room.images.length > 0 ? room.images[0] : '';
    const price = Utils.formatCurrency(Number(room.price) || 0);
    const area = Number(room.area) || 0;
    const locationText = room.address;

    const invoices = Array.isArray(room.invoices) ? room.invoices : [];
    const unpaidCount = invoices.filter((inv) => (inv.status || 'unpaid') !== 'paid').length;

    return `
        <article class="category-room-card owner-room-card" onclick="openTenantActionModalById('${room.id}')">
            <div class="category-room-image-wrap">
                <img src="${image}" alt="${room.title}" class="category-room-image">
            </div>
            <div class="category-room-content">
                <div class="d-flex justify-content-between gap-2 align-items-start mb-1">
                    <h4 class="category-room-title mb-0">${room.title}</h4>
                    <span class="badge ${unpaidCount > 0 ? 'bg-danger' : 'bg-success'}">${unpaidCount > 0 ? `${unpaidCount} hóa đơn chưa trả` : 'Đã thanh toán đủ'}</span>
                </div>
                <div class="category-room-price">${price}đ/tháng</div>
                <div class="category-room-tags">
                    <span>${room.type}</span>
                    <span>${area}m2</span>
                </div>
                <div class="category-room-location"><i class="fa-solid fa-location-dot"></i> ${locationText}</div>
            </div>
        </article>
    `;
}

function openTenantActionModalById(roomId) {
    const room = Storage.getRoomById(roomId);
    if (!room) {
        alert('Không tìm thấy phòng!');
        return;
    }
    if (!Array.isArray(room.images) || room.images.length === 0) return alert('Dữ liệu phòng thiếu ảnh. Vui lòng liên hệ chủ trọ cập nhật.');
    if (!isNonEmptyText(room.title) || !isNonEmptyText(room.type) || !isNonEmptyText(room.address) || !isNonEmptyText(room.description)) {
        return alert('Dữ liệu phòng chưa đầy đủ trường bắt buộc. Vui lòng liên hệ chủ trọ cập nhật.');
    }

    selectedTenantRoomId = room.id;

    const images = room.images;

    document.getElementById('tenantActionTitle').textContent = room.title;
    document.getElementById('tenantActionType').textContent = room.type;
    document.getElementById('tenantActionPrice').textContent = `${Utils.formatCurrency(Number(room.price) || 0)}đ/tháng`;
    document.getElementById('tenantActionArea').textContent = `${Number(room.area) || 0}m2`;
    document.getElementById('tenantActionAddress').textContent = room.address;
    document.getElementById('tenantActionOwner').textContent = `${room.ownerName} - ${room.ownerPhone}`;
    document.getElementById('tenantActionDescription').textContent = room.description;

    initTenantActionGallery(images, room.title);
    tenantActionModal.show();
}

window.openTenantActionModalById = openTenantActionModalById;

function initTenantActionGallery(images, title) {
    if (!Array.isArray(images) || images.length === 0) return;
    tenantActionGalleryState.images = images;
    tenantActionGalleryState.index = 0;

    const track = document.getElementById('tenantActionGalleryTrack');
    if (!track) return;

    track.innerHTML = tenantActionGalleryState.images.map((src, idx) => `
        <div class="owner-action-gallery-slide" data-index="${idx}">
            <img src="${src}" alt="${title} - ảnh ${idx + 1}">
        </div>
    `).join('');

    syncTenantActionGallery();
}

function syncTenantActionGallery() {
    const track = document.getElementById('tenantActionGalleryTrack');
    if (!track) return;

    const slides = Array.from(track.querySelectorAll('.owner-action-gallery-slide'));
    const total = slides.length;
    if (!total) return;

    const currentIndex = tenantActionGalleryState.index;
    const prevIndex = (currentIndex - 1 + total) % total;
    const nextIndex = (currentIndex + 1) % total;

    slides.forEach((slide, idx) => {
        slide.classList.remove('is-active', 'is-prev', 'is-next');
        if (total === 1) {
            if (idx === currentIndex) slide.classList.add('is-active');
            return;
        }

        if (total === 2) {
            if (idx === currentIndex) slide.classList.add('is-active');
            else if (idx === nextIndex) slide.classList.add('is-next');
            return;
        }

        if (idx === currentIndex) slide.classList.add('is-active');
        else if (idx === prevIndex) slide.classList.add('is-prev');
        else if (idx === nextIndex) slide.classList.add('is-next');
    });

    const prevBtn = document.querySelector('#tenantActionModal .owner-action-gallery-nav.prev');
    const nextBtn = document.querySelector('#tenantActionModal .owner-action-gallery-nav.next');
    const disabled = total <= 1;
    if (prevBtn) prevBtn.disabled = disabled;
    if (nextBtn) nextBtn.disabled = disabled;
}

function nextTenantActionImage() {
    const total = tenantActionGalleryState.images.length;
    if (total <= 1) return;
    tenantActionGalleryState.index = (tenantActionGalleryState.index + 1) % total;
    syncTenantActionGallery();
}

function prevTenantActionImage() {
    const total = tenantActionGalleryState.images.length;
    if (total <= 1) return;
    tenantActionGalleryState.index = (tenantActionGalleryState.index - 1 + total) % total;
    syncTenantActionGallery();
}

window.nextTenantActionImage = nextTenantActionImage;
window.prevTenantActionImage = prevTenantActionImage;

function openTenantInvoiceModal() {
    if (!selectedTenantRoomId) return;
    const room = Storage.getRoomById(selectedTenantRoomId);
    if (!room) return;

    const invoices = Array.isArray(room.invoices) ? room.invoices : [];
    if (!invoices.length) {
        Utils.showError('Phòng này chưa có hóa đơn nào.');
        return;
    }

    const selectEl = document.getElementById('tenantInvoiceSelect');
    selectEl.innerHTML = invoices.map((inv) => {
        const amount = Utils.formatCurrency(Number(inv.grandTotal) || 0);
        const label = `${inv.period} - ${amount}đ`;
        return `<option value="${inv.id}">${label}</option>`;
    }).join('');

    selectedTenantInvoiceId = invoices[0].id;
    selectEl.value = selectedTenantInvoiceId;
    renderTenantInvoiceDetail();

    tenantActionModal.hide();
    tenantInvoiceModal.show();
}

window.openTenantInvoiceModal = openTenantInvoiceModal;

function renderTenantInvoiceDetail() {
    if (!selectedTenantRoomId) return;

    const room = Storage.getRoomById(selectedTenantRoomId);
    if (!room) return;

    const invoiceId = document.getElementById('tenantInvoiceSelect').value;
    selectedTenantInvoiceId = invoiceId;

    const invoice = (room.invoices || []).find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    const formatMoney = (amount) => `${Utils.formatCurrency(Number(amount) || 0)}đ`;

    const rows = [
        ['Tiền nhà', invoice.rent],
        ['Tiền điện', invoice.electricTotal],
        ['Tiền nước', invoice.water],
        ['Tiền wifi', invoice.wifi],
        ['Tiền dịch vụ', invoice.service],
        ['Tiền xử lý sự cố', invoice.issue]
    ];

    const detailEl = document.getElementById('tenantInvoiceDetail');
    detailEl.innerHTML = `
        <div class="invoice-breakdown-row header">
            <span>Thành phần</span>
            <span>Số tiền</span>
        </div>
        ${rows.map((row) => `
            <div class="invoice-breakdown-row">
                <span>${row[0]}</span>
                <strong>${formatMoney(row[1])}</strong>
            </div>
        `).join('')}
        <div class="invoice-breakdown-row text-muted small">
            <span>Số điện: ${invoice.electricPreviousReading || 0} -> ${invoice.electricCurrentReading || 0} (${invoice.electricUsage || 0} kWh)</span>
            <span>Giá ${formatMoney(invoice.electricRate || 0)}/kWh</span>
        </div>
        <div class="invoice-breakdown-row total">
            <span>Tổng cần thanh toán</span>
            <strong>${formatMoney(invoice.grandTotal)}</strong>
        </div>
        <div class="small text-muted mt-2">Ghi chú: ${invoice.note || 'Không có'}</div>
    `;

    const statusEl = document.getElementById('tenantInvoiceStatus');
    const payBtn = document.getElementById('tenantPayInvoiceBtn');

    if (invoice.status === 'paid') {
        statusEl.innerHTML = `<span class="badge text-bg-success">Đã thanh toán lúc ${new Date(invoice.paidAt || Date.now()).toLocaleString('vi-VN')}</span>`;
        payBtn.disabled = true;
    } else {
        statusEl.innerHTML = '<span class="badge text-bg-danger">Chưa thanh toán</span>';
        payBtn.disabled = false;
    }
}

window.renderTenantInvoiceDetail = renderTenantInvoiceDetail;

function openPaymentQrModal() {
    if (!selectedTenantRoomId || !selectedTenantInvoiceId) return;

    const room = Storage.getRoomById(selectedTenantRoomId);
    if (!room) return;
    if (!room.contract || room.contract.tenantPhone !== currentUser.phone) {
        alert('Phòng chưa có hợp đồng hợp lệ với tài khoản hiện tại.');
        return;
    }

    const invoice = (room.invoices || []).find((inv) => inv.id === selectedTenantInvoiceId);
    if (!invoice) return;

    if (invoice.status === 'paid') {
        alert('Hóa đơn này đã thanh toán.');
        return;
    }

    const owner = Storage.getUserByPhone(room.ownerPhone);
    if (!owner) {
        alert('Không tìm thấy thông tin chủ trọ cho phòng này.');
        return;
    }
    const bankBin = owner?.bankBin || owner?.bankCode || '';
    const accountNumber = owner?.bankAccountNumber || '';
    const accountName = owner?.bankAccountName || room.ownerName || '';

    if (!bankBin || !accountNumber || !accountName) {
        alert('Chủ trọ chưa cấu hình đủ thông tin ngân hàng trong hồ sơ.');
        return;
    }

    const amount = Number(invoice.grandTotal) || 0;
    const transferContent = `${currentUser.name} ${invoice.period}`.trim();

    const qrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

    document.getElementById('paymentQrImage').src = qrUrl;
    document.getElementById('paymentQrInfo').innerHTML = `
        <div><strong>Ngân hàng:</strong> ${owner.bankName || owner.bankShortName || bankBin}</div>
        <div><strong>Số tài khoản:</strong> ${accountNumber}</div>
        <div><strong>Chủ tài khoản:</strong> ${accountName}</div>
        <div><strong>Số tiền:</strong> ${Utils.formatCurrency(amount)}đ</div>
        <div><strong>Nội dung:</strong> ${transferContent}</div>
    `;

    document.getElementById('paymentVerifyStatus').className = 'alert alert-info mt-3 mb-0 text-start';
    document.getElementById('paymentVerifyStatus').textContent = 'Vui lòng hoàn tất thanh toán theo thông tin QR ở trên.';

    Storage.addNotification({
        toPhone: room.ownerPhone,
        fromPhone: currentUser.phone,
        type: 'payment_initiated',
        title: 'Khách thuê mở QR thanh toán',
        message: `${currentUser.name} đã mở QR cho hóa đơn kỳ ${invoice.period} (${Utils.formatCurrency(amount)}đ).`,
        meta: {
            roomId: room.id,
            roomTitle: room.title,
            invoiceId: invoice.id,
            period: invoice.period,
            amount,
            transferContent
        }
    });

    paymentQrModal.show();
}

function completeInvoicePaid(room, invoice, transferContent, paymentRef) {
    const updatedRoom = Storage.markInvoicePaid(room.id, invoice.id, {
        paidAt: new Date().toISOString(),
        paymentMethod: 'bank_transfer',
        paymentRef,
        paymentContent: transferContent
    });

    if (!updatedRoom) return;

    Storage.addNotification({
        toPhone: room.ownerPhone,
        fromPhone: currentUser.phone,
        type: 'invoice_paid',
        title: 'Khách thuê đã thanh toán',
        message: `${currentUser.name} đã thanh toán hóa đơn kỳ ${invoice.period} cho phòng ${room.title}.`,
        meta: {
            roomId: room.id,
            roomTitle: room.title,
            invoiceId: invoice.id,
            period: invoice.period,
            amount: invoice.grandTotal,
            paymentRef
        }
    });

    Storage.addNotification({
        toPhone: currentUser.phone,
        fromPhone: room.ownerPhone,
        type: 'invoice_paid_success',
        title: 'Thanh toán thành công',
        message: `Bạn đã thanh toán hóa đơn kỳ ${invoice.period} (${Utils.formatCurrency(invoice.grandTotal)}đ).`,
        meta: {
            roomId: room.id,
            roomTitle: room.title,
            invoiceId: invoice.id,
            paymentRef
        }
    });

    renderTenantInvoiceDetail();
    renderTenantRoomList();
    renderTenantNotifications();
}

function markInvoicePaidManual() {
    if (!selectedTenantRoomId || !selectedTenantInvoiceId) return;
    const room = Storage.getRoomById(selectedTenantRoomId);
    if (!room) return;

    const invoice = (room.invoices || []).find((inv) => inv.id === selectedTenantInvoiceId);
    if (!invoice) return;

    const transferContent = `${currentUser.name} ${invoice.period}`.trim();
    completeInvoicePaid(room, invoice, transferContent, 'MANUAL_CONFIRM');

    const statusEl = document.getElementById('paymentVerifyStatus');
    if (statusEl) {
        statusEl.className = 'alert alert-success mt-3 mb-0 text-start';
        statusEl.textContent = 'Đã ghi nhận thanh toán thành công.';
    }
}

window.markInvoicePaidManual = markInvoicePaidManual;

function verifyPaymentNow() {
    markInvoicePaidManual();
}

window.verifyPaymentNow = verifyPaymentNow;

function openIssueModal() {
    if (!selectedTenantRoomId) return;
    const form = document.getElementById('issueForm');
    if (form) form.reset();
    selectedIssueImages = [];
    renderIssueImagePreview();
    clearIssueImageValidationMessage();
    const fileInput = document.getElementById('issueImages');
    if (fileInput) fileInput.value = '';
    const issueStatusFilter = document.getElementById('tenantIssueStatusFilter');
    if (issueStatusFilter) issueStatusFilter.value = readTenantIssueFilter();
    selectedTenantIssueId = null;
    switchIssueTab('report');
    renderTenantIssueHistory();
    issueModal.show();
}

window.openIssueModal = openIssueModal;

function submitIssueReport() {
    if (!selectedTenantRoomId) return;
    const room = Storage.getRoomById(selectedTenantRoomId);
    if (!room) return;

    const issueTitle = (document.getElementById('issueTitle').value || '').trim();
    const issueDescription = (document.getElementById('issueDescription').value || '').trim();

    if (!issueTitle || !issueDescription) {
        alert('Vui lòng nhập đủ tiêu đề và mô tả sự cố.');
        return;
    }
    if (!room.contract || room.contract.tenantPhone !== currentUser.phone) {
        alert('Chỉ khách thuê đang có hợp đồng mới được gửi báo cáo sự cố.');
        return;
    }

    const report = {
        id: `ISSUE_${Date.now()}`,
        tenantPhone: currentUser.phone,
        tenantName: currentUser.name,
        title: issueTitle,
        description: issueDescription,
        images: selectedIssueImages.map((item) => ({
            name: item.name,
            size: item.size,
            base64: item.base64
        })),
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    const nextIssueReports = Array.isArray(room.issueReports) ? room.issueReports : [];
    nextIssueReports.unshift(report);

    Storage.updateRoom({
        ...room,
        issueReports: nextIssueReports
    });

    Storage.addNotification({
        toPhone: room.ownerPhone,
        fromPhone: currentUser.phone,
        type: 'issue_reported',
        title: 'Báo cáo sự cố mới',
        message: `${currentUser.name} báo cáo sự cố: ${issueTitle}.`,
        meta: {
            roomId: room.id,
            roomTitle: room.title,
            issueId: report.id
        }
    });

    Storage.addNotification({
        toPhone: currentUser.phone,
        fromPhone: room.ownerPhone,
        type: 'issue_submitted',
        title: 'Đã gửi báo cáo sự cố',
        message: `Yêu cầu "${issueTitle}" đã được gửi tới chủ trọ.`,
        meta: {
            roomId: room.id,
            roomTitle: room.title,
            issueId: report.id
        }
    });

    const form = document.getElementById('issueForm');
    if (form) form.reset();
    selectedIssueImages = [];
    renderIssueImagePreview();
    clearIssueImageValidationMessage();
    renderTenantIssueHistory();
    switchIssueTab('history');
    renderTenantNotifications();
    alert('Đã gửi báo cáo sự cố tới chủ trọ.');
}

window.submitIssueReport = submitIssueReport;

function requestExtendContract() {
    if (!selectedTenantRoomId) return;
    const room = Storage.getRoomById(selectedTenantRoomId);
    if (!room) return;
    if (!room.contract || room.contract.tenantPhone !== currentUser.phone) {
        alert('Phòng này chưa có hợp đồng hợp lệ với bạn.');
        return;
    }

    Storage.addNotification({
        toPhone: room.ownerPhone,
        fromPhone: currentUser.phone,
        type: 'contract_extend_request',
        title: 'Yêu cầu gia hạn hợp đồng',
        message: `${currentUser.name} muốn gia hạn hợp đồng phòng ${room.title}.`,
        meta: {
            roomId: room.id,
            roomTitle: room.title
        }
    });

    Storage.addNotification({
        toPhone: currentUser.phone,
        fromPhone: room.ownerPhone,
        type: 'contract_extend_submitted',
        title: 'Đã gửi yêu cầu gia hạn',
        message: `Yêu cầu gia hạn phòng ${room.title} đã gửi tới chủ trọ.`,
        meta: {
            roomId: room.id,
            roomTitle: room.title
        }
    });

    renderTenantNotifications();
    alert('Đã gửi yêu cầu gia hạn hợp đồng cho chủ trọ.');
}

window.requestExtendContract = requestExtendContract;

function requestEndContract() {
    if (!selectedTenantRoomId) return;
    const room = Storage.getRoomById(selectedTenantRoomId);
    if (!room) return;
    if (!room.contract || room.contract.tenantPhone !== currentUser.phone) {
        alert('Phòng này chưa có hợp đồng hợp lệ với bạn.');
        return;
    }

    if (!confirm('Bạn chắc chắn muốn gửi yêu cầu kết thúc hợp đồng?')) return;

    Storage.addNotification({
        toPhone: room.ownerPhone,
        fromPhone: currentUser.phone,
        type: 'contract_end_request',
        title: 'Yêu cầu kết thúc hợp đồng',
        message: `${currentUser.name} yêu cầu kết thúc hợp đồng phòng ${room.title}.`,
        meta: {
            roomId: room.id,
            roomTitle: room.title
        }
    });

    Storage.addNotification({
        toPhone: currentUser.phone,
        fromPhone: room.ownerPhone,
        type: 'contract_end_submitted',
        title: 'Đã gửi yêu cầu kết thúc hợp đồng',
        message: `Yêu cầu kết thúc hợp đồng phòng ${room.title} đã gửi tới chủ trọ.`,
        meta: {
            roomId: room.id,
            roomTitle: room.title
        }
    });

    renderTenantNotifications();
    alert('Đã gửi yêu cầu kết thúc hợp đồng.');
}

window.requestEndContract = requestEndContract;

function renderTenantNotifications() {
    const listEl = document.getElementById('tenantNotificationList');
    if (!listEl) return;

    const notifications = Storage.getNotifications(currentUser.phone);
    if (!notifications.length) {
        listEl.innerHTML = '<div class="text-muted small">Chưa có thông báo mới.</div>';
        return;
    }

    listEl.innerHTML = notifications.slice(0, 20).map((item) => {
        const unread = item.isRead ? '' : '<span class="badge text-bg-danger">Mới</span>';
        const title = isNonEmptyText(item.title) ? item.title : 'Thông báo';
        const message = isNonEmptyText(item.message) ? item.message : 'Nội dung thông báo không hợp lệ.';
        return `
            <article class="notification-item ${item.isRead ? '' : 'unread'}" onclick="markTenantNotificationRead('${item.id}')">
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <div class="fw-semibold">${title}</div>
                    ${unread}
                </div>
                <div class="small text-muted mt-1">${message}</div>
                <div class="small text-secondary mt-1">${formatNotificationTime(item.createdAt)}</div>
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

function markTenantNotificationRead(notificationId) {
    Storage.markNotificationRead(notificationId, currentUser.phone);
    renderTenantNotifications();
}

window.markTenantNotificationRead = markTenantNotificationRead;

function markAllTenantNotificationsRead() {
    Storage.markAllNotificationsRead(currentUser.phone);
    renderTenantNotifications();
}

window.markAllTenantNotificationsRead = markAllTenantNotificationsRead;
