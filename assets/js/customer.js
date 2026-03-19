/**
 * customer.js
 * Logic cho trang khach-hang.html
 */

const currentUser = Storage.getCurrentUser();
if (!currentUser || currentUser.role !== 'tenant') {
    alert('Bạn không có quyền truy cập trang này!');
    window.location.href = 'trang-chu.html';
}

let tenantActionModal;
let tenantInvoiceModal;
let paymentQrModal;
let issueModal;

let selectedTenantRoomId = null;
let selectedTenantInvoiceId = null;
let paymentPollTimer = null;

let tenantActionGalleryState = {
    images: [],
    index: 0
};

document.addEventListener('DOMContentLoaded', () => {
    tenantActionModal = new bootstrap.Modal(document.getElementById('tenantActionModal'));
    tenantInvoiceModal = new bootstrap.Modal(document.getElementById('tenantInvoiceModal'));
    paymentQrModal = new bootstrap.Modal(document.getElementById('paymentQrModal'));
    issueModal = new bootstrap.Modal(document.getElementById('issueModal'));

    const displayNameEl = document.getElementById('display-name');
    if (displayNameEl) {
        displayNameEl.innerHTML = `<i class="fa-solid fa-user"></i> Hi, ${currentUser.name}`;
    }

    renderTenantRoomList();
    renderTenantNotifications();

    const searchInput = document.getElementById('tenantSearchInput');
    if (searchInput) searchInput.addEventListener('input', renderTenantRoomList);

    const invoiceFilter = document.getElementById('tenantInvoiceFilter');
    if (invoiceFilter) invoiceFilter.addEventListener('change', renderTenantRoomList);

    const qrModalEl = document.getElementById('paymentQrModal');
    if (qrModalEl) {
        qrModalEl.addEventListener('hidden.bs.modal', () => {
            stopPaymentAutoPolling();
        });
    }
});

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
    const image = (Array.isArray(room.images) && room.images.length > 0 ? room.images[0] : room.image) || 'img/logo.png';
    const price = new Intl.NumberFormat('vi-VN').format(Number(room.price) || 0);
    const area = Number(room.area) || 0;
    const locationText = room.address || [room.street, room.ward, room.district, room.city].filter(Boolean).join(', ');

    const invoices = Array.isArray(room.invoices) ? room.invoices : [];
    const unpaidCount = invoices.filter((inv) => (inv.status || 'unpaid') !== 'paid').length;

    return `
        <article class="category-room-card owner-room-card" onclick="openTenantActionModalById('${room.id}')">
            <div class="category-room-image-wrap">
                <img src="${image}" alt="${room.title}" class="category-room-image">
            </div>
            <div class="category-room-content">
                <div class="d-flex justify-content-between gap-2 align-items-start mb-1">
                    <h4 class="category-room-title mb-0">${room.title || 'Phòng trọ'}</h4>
                    <span class="badge ${unpaidCount > 0 ? 'bg-danger' : 'bg-success'}">${unpaidCount > 0 ? `${unpaidCount} hóa đơn chưa trả` : 'Đã thanh toán đủ'}</span>
                </div>
                <div class="category-room-price">${price}đ/tháng</div>
                <div class="category-room-tags">
                    <span>${room.type || 'Phòng trọ'}</span>
                    <span>${area}m2</span>
                </div>
                <div class="category-room-location"><i class="fa-solid fa-location-dot"></i> ${locationText || 'Chưa cập nhật'}</div>
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

    selectedTenantRoomId = room.id;

    const images = Array.isArray(room.images) && room.images.length > 0
        ? room.images
        : (room.image ? [room.image] : ['img/logo.png']);

    document.getElementById('tenantActionTitle').textContent = room.title || 'Chi tiết phòng thuê';
    document.getElementById('tenantActionType').textContent = room.type || 'Phòng trọ';
    document.getElementById('tenantActionPrice').textContent = `${new Intl.NumberFormat('vi-VN').format(Number(room.price) || 0)}đ/tháng`;
    document.getElementById('tenantActionArea').textContent = `${Number(room.area) || 0}m2`;
    document.getElementById('tenantActionAddress').textContent = room.address || [room.street, room.ward, room.district, room.city].filter(Boolean).join(', ') || 'Chưa cập nhật';
    document.getElementById('tenantActionOwner').textContent = `${room.ownerName || 'Chủ trọ'} - ${room.ownerPhone || 'Liên hệ'}`;
    document.getElementById('tenantActionDescription').textContent = room.description || 'Chưa có mô tả.';

    initTenantActionGallery(images, room.title || 'Phòng trọ');
    tenantActionModal.show();
}

window.openTenantActionModalById = openTenantActionModalById;

function initTenantActionGallery(images, title) {
    tenantActionGalleryState.images = images || [];
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
        alert('Phòng này chưa có hóa đơn nào.');
        return;
    }

    const selectEl = document.getElementById('tenantInvoiceSelect');
    selectEl.innerHTML = invoices.map((inv) => {
        const amount = new Intl.NumberFormat('vi-VN').format(Number(inv.grandTotal) || 0);
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

    const formatMoney = (amount) => `${new Intl.NumberFormat('vi-VN').format(Number(amount) || 0)}đ`;

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

    const invoice = (room.invoices || []).find((inv) => inv.id === selectedTenantInvoiceId);
    if (!invoice) return;

    if (invoice.status === 'paid') {
        alert('Hóa đơn này đã thanh toán.');
        return;
    }

    const owner = Storage.getUserByPhone(room.ownerPhone);
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
        <div><strong>Số tiền:</strong> ${new Intl.NumberFormat('vi-VN').format(amount)}đ</div>
        <div><strong>Nội dung:</strong> ${transferContent}</div>
    `;

    document.getElementById('paymentVerifyStatus').className = 'alert alert-info mt-3 mb-0 text-start';
    document.getElementById('paymentVerifyStatus').textContent = 'Hệ thống đang theo dõi thanh toán theo nội dung chuyển khoản.';

    Storage.addNotification({
        toPhone: room.ownerPhone,
        fromPhone: currentUser.phone,
        type: 'payment_initiated',
        title: 'Khách thuê mở QR thanh toán',
        message: `${currentUser.name} đã mở QR cho hóa đơn kỳ ${invoice.period} (${new Intl.NumberFormat('vi-VN').format(amount)}đ).`,
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
    startPaymentAutoPolling(room.id, invoice.id, amount, transferContent);
}

window.openPaymentQrModal = openPaymentQrModal;

function startPaymentAutoPolling(roomId, invoiceId, amount, transferContent) {
    stopPaymentAutoPolling();
    paymentPollTimer = setInterval(() => {
        verifyPaymentNow(true, roomId, invoiceId, amount, transferContent);
    }, 30000);
}

function stopPaymentAutoPolling() {
    if (paymentPollTimer) {
        clearInterval(paymentPollTimer);
        paymentPollTimer = null;
    }
}

async function verifyPaymentNow(silent = false, roomId, invoiceId, amount, transferContent) {
    const localRoomId = roomId || selectedTenantRoomId;
    const localInvoiceId = invoiceId || selectedTenantInvoiceId;
    const room = Storage.getRoomById(localRoomId);
    if (!room) return;

    const invoice = (room.invoices || []).find((inv) => inv.id === localInvoiceId);
    if (!invoice) return;

    const paymentAmount = amount || Number(invoice.grandTotal) || 0;
    const content = transferContent || `${currentUser.name} ${invoice.period}`.trim();

    const statusEl = document.getElementById('paymentVerifyStatus');
    const monitorConfig = Storage.getPaymentMonitorConfig();

    if (!monitorConfig || !monitorConfig.endpoint) {
        if (!silent && statusEl) {
            statusEl.className = 'alert alert-warning mt-3 mb-0 text-start';
            statusEl.textContent = 'Chưa cấu hình API kiểm tra biến động số dư. Vui lòng cấu hình trong hồ sơ cá nhân.';
        }
        return;
    }

    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (monitorConfig.token) {
            headers.Authorization = `Bearer ${monitorConfig.token}`;
        }
        if (monitorConfig.clientId) {
            headers['X-Client-Id'] = monitorConfig.clientId;
        }

        const method = (monitorConfig.method || 'POST').toUpperCase();
        const payload = {
            amount: paymentAmount,
            content,
            accountNumber: monitorConfig.accountNumber || '',
            sinceMinutes: Number(monitorConfig.sinceMinutes || 240)
        };

        const requestOptions = {
            method,
            headers
        };

        if (method !== 'GET') {
            requestOptions.body = JSON.stringify(payload);
        }

        const res = await fetch(monitorConfig.endpoint, requestOptions);
        const data = await res.json();

        const transactions = Array.isArray(data?.transactions)
            ? data.transactions
            : (Array.isArray(data?.data?.transactions) ? data.data.transactions : []);

        const foundTx = transactions.find((tx) => {
            const txAmount = Number(tx.amount || tx.value || 0);
            const txContent = String(tx.description || tx.content || tx.memo || '').toLowerCase();
            return txAmount >= paymentAmount && txContent.includes(content.toLowerCase());
        });

        if (foundTx) {
            completeInvoicePaid(room, invoice, content, foundTx.reference || foundTx.id || foundTx.transactionId || 'AUTO');
            if (statusEl) {
                statusEl.className = 'alert alert-success mt-3 mb-0 text-start';
                statusEl.textContent = 'Đã xác nhận thanh toán thành công tự động từ API biến động số dư.';
            }
            stopPaymentAutoPolling();
        } else if (!silent && statusEl) {
            statusEl.className = 'alert alert-info mt-3 mb-0 text-start';
            statusEl.textContent = 'Chưa tìm thấy giao dịch phù hợp. Hệ thống sẽ tiếp tục theo dõi.';
        }
    } catch (error) {
        console.error(error);
        if (!silent && statusEl) {
            statusEl.className = 'alert alert-danger mt-3 mb-0 text-start';
            statusEl.textContent = 'Không thể kiểm tra API biến động số dư. Hãy thử lại sau.';
        }
    }
}

window.verifyPaymentNow = () => verifyPaymentNow(false);

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

    stopPaymentAutoPolling();
}

window.markInvoicePaidManual = markInvoicePaidManual;

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
        message: `Bạn đã thanh toán hóa đơn kỳ ${invoice.period} (${new Intl.NumberFormat('vi-VN').format(invoice.grandTotal)}đ).`,
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

function openIssueModal() {
    if (!selectedTenantRoomId) return;
    const form = document.getElementById('issueForm');
    if (form) form.reset();
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

    const report = {
        id: `ISSUE_${Date.now()}`,
        tenantPhone: currentUser.phone,
        tenantName: currentUser.name,
        title: issueTitle,
        description: issueDescription,
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

    issueModal.hide();
    tenantActionModal.hide();
    renderTenantNotifications();
    alert('Đã gửi báo cáo sự cố tới chủ trọ.');
}

window.submitIssueReport = submitIssueReport;

function requestExtendContract() {
    if (!selectedTenantRoomId) return;
    const room = Storage.getRoomById(selectedTenantRoomId);
    if (!room) return;

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
        return `
            <article class="notification-item ${item.isRead ? '' : 'unread'}" onclick="markTenantNotificationRead('${item.id}')">
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <div class="fw-semibold">${item.title || 'Thông báo'}</div>
                    ${unread}
                </div>
                <div class="small text-muted mt-1">${item.message || ''}</div>
                <div class="small text-secondary mt-1">${new Date(item.createdAt || Date.now()).toLocaleString('vi-VN')}</div>
            </article>
        `;
    }).join('');
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
