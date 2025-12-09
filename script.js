// script.js
document.addEventListener('DOMContentLoaded', () => {

    // --- DEĞİŞKENLER VE SEÇİCİLER ---
    const STORAGE_KEY = 'hesapData';
    const AD_COOLDOWN_MINUTES = 5;
    const CREDIT_TO_USDT_RATE = 0.00000001;
    const MIN_REWARD_CREDITS = 1;
    const MAX_REWARD_CREDITS = 3;
    const ADMIN_USERNAME = 'Hasan199243'; // HATA DÜZELTİLDİ: @ işareti kaldırıldı

    let appData = {};
    let userData = {};
    let tg;
    let countdownInterval;

    // Sayfa elemanları
    const homePage = document.getElementById('home-page');
    const walletPage = document.getElementById('wallet-page');
    const paymentPage = document.getElementById('payment-page');
    const adminPage = document.getElementById('admin-page');

    const adButton = document.getElementById('ad-button');
    const adButtonTextSpan = document.getElementById('ad-button-text');
    
    const creditBalanceSpan = document.getElementById('credit-balance');
    const usdtBalanceSpan = document.getElementById('usdt-balance');
    const userNameSpan = document.getElementById('user-name');

    const walletForm = document.getElementById('wallet-form');
    const usdtAddressInput = document.getElementById('usdt-address');

    const paymentUsdtAddressSpan = document.getElementById('payment-usdt-address');
    const userBalanceSpan = document.getElementById('user-balance');
    const withdrawAmountInput = document.getElementById('withdraw-amount');
    const withdrawButton = document.getElementById('withdraw-button');
    const withdrawAlertDiv = document.getElementById('withdraw-alert');

    const adminMenuLink = document.getElementById('admin-menu-link');
    const adminRequestsContainer = document.getElementById('admin-requests-container');

    const menuLinks = document.querySelectorAll('.nav-link[data-page]');

    // --- TELEGRAM WEB APP BAŞLATMA ---
    if (window.Telegram && window.show_10301465) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const user = tg.initDataUnsafe.user;
        if (user) {
            initializeApp(user);
            setupEventListeners();
            countdownInterval = setInterval(updateAdButtonState, 1000);
        } else {
            document.body.innerHTML = '<div class="container text-center mt-5"><h1>Hata</h1><p>Bu uygulama sadece Telegram üzerinden çalışır.</p></div>';
        }
    } else {
        document.body.innerHTML = '<div class="container text-center mt-5"><h1>Hata</h1><p>Gerekli SDK\'lar bulunamadı.</p></div>';
    }

    // --- TEMEL FONKSİYONLAR ---

    function createNewUser(user) {
        return {
            username: user.username || user.first_name,
            credit_balance: 0,
            lastAdTimestamp: 0,
            nextAdTimestamp: 0,
            usdt_wallet_address: ''
        };
    }

    function loadAppData() {
        const storedData = localStorage.getItem(STORAGE_KEY);
        appData = storedData ? JSON.parse(storedData) : { users: {}, withdrawalRequests: {} };
        console.log("localStorage'dan Yüklenen Veri:", appData);
    }

    function setUserData(user) {
        if (!appData.users) appData.users = {};
        if (!appData.users[user.id]) {
            appData.users[user.id] = createNewUser(user);
        }
        userData = appData.users[user.id];
        console.log("Mevcut Kullanıcı Verileri:", userData);
    }

    function saveAppData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
        console.log("Veriler localStorage'a kaydedildi.");
    }
    
    function initializeApp(user) {
        loadAppData();
        setUserData(user);
        updateUI();

        // Admin menüsünü göster/gizle
        if (userData.username === ADMIN_USERNAME) {
            adminMenuLink.style.display = 'flex';
        }

        // Otomatik İçerik Reklamı
        if (window.show_10301465) {
            show_10301465({ type: 'inApp', inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false } });
        }
    }

    function updateUI() {
        userNameSpan.textContent = userData.username;
        const usdtBalance = userData.credit_balance * CREDIT_TO_USDT_RATE;
        
        creditBalanceSpan.textContent = userData.credit_balance;
        usdtBalanceSpan.textContent = usdtBalance.toFixed(8);
        userBalanceSpan.textContent = `${usdtBalance.toFixed(8)} USDT`;

        usdtAddressInput.value = userData.usdt_wallet_address;
        paymentUsdtAddressSpan.textContent = userData.usdt_wallet_address || 'Kayıtlı değil';
    }
    
    function updateAdButtonState() {
        const now = Date.now();
        if (now >= userData.nextAdTimestamp) {
            adButton.classList.remove('disabled');
            adButtonTextSpan.textContent = 'Reklam İzle';
        } else {
            adButton.classList.add('disabled');
            const remainingTime = Math.floor((userData.nextAdTimestamp - now) / 1000);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            adButtonTextSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    function handleWithdrawRequest() {
        const amount = parseFloat(withdrawAmountInput.value);
        const currentUsdtBalance = userData.credit_balance * CREDIT_TO_USDT_RATE;
        
        withdrawAlertDiv.style.display = 'none';
        withdrawAlertDiv.className = 'alert';

        if (isNaN(amount) || amount <= 0) {
            showAlert('Lütfen geçerli bir miktar girin.', 'danger');
            return;
        }
        if (amount < 5) {
            showAlert('Çekim minimum tutarı 5 USDT\'dir.', 'danger');
            return;
        }
        if (amount > currentUsdtBalance) {
            showAlert('Bakiyeniz yetersiz.', 'danger');
            return;
        }
        if (amount > 100) {
            showAlert('Çekim maksimum tutarı 100 USDT\'dir.', 'danger');
            return;
        }
        if (!userData.usdt_wallet_address) {
            showAlert('Lütfen önce cüzdan adresinizi kaydedin.', 'danger');
            return;
        }

        const requestId = Date.now().toString();
        const request = {
            id: requestId,
            userId: tg.initDataUnsafe.user.id,
            username: userData.username,
            amount: amount,
            walletAddress: userData.usdt_wallet_address,
            requestDate: new Date().toLocaleString('tr-TR'),
            status: 'pending'
        };

        userData.credit_balance -= (amount / CREDIT_TO_USDT_RATE);

        if (!appData.withdrawalRequests) appData.withdrawalRequests = {};
        appData.withdrawalRequests[requestId] = request;

        saveAppData();
        updateUI();
        
        showAlert(`${amount} USDT çekim talebiniz başarıyla oluşturuldu!`, 'success');
        withdrawAmountInput.value = '';
    }

    function showAlert(message, type) {
        withdrawAlertDiv.textContent = message;
        withdrawAlertDiv.classList.add(`alert-${type}`);
        withdrawAlertDiv.style.display = 'block';
    }

    function renderAdminPanel() {
        adminRequestsContainer.innerHTML = '';
        const requests = appData.withdrawalRequests || {};

        if (Object.keys(requests).length === 0) {
            adminRequestsContainer.innerHTML = '<p>Bekleyen çekim talebi bulunmamaktadır.</p>';
            return;
        }

        for (const requestId in requests) {
            const request = requests[requestId];
            const requestCard = document.createElement('div');
            requestCard.className = 'admin-request-card';
            requestCard.innerHTML = `
                <div class="card-title">
                    ${request.username} - ${request.amount} USDT
                </div>
                <p><strong>Cüzdan:</strong> ${request.walletAddress}</p>
                <p><strong>Talep Tarihi:</strong> ${request.requestDate}</p>
                <button class="btn btn-danger btn-sm" onclick="deleteRequest('${requestId}')">Talebi Sil / Onayla</button>
            `;
            adminRequestsContainer.appendChild(requestCard);
        }
    }
    
    window.deleteRequest = function(requestId) {
        if (confirm('Bu talebi silmek istediğinizden emin misiniz?')) {
            delete appData.withdrawalRequests[requestId];
            saveAppData();
            renderAdminPanel();
            tg.showAlert('Talep başarıyla silindi.');
        }
    }


    function setupEventListeners() {
        adButton.addEventListener('click', () => {
            const now = Date.now();
            if (now >= userData.nextAdTimestamp && window.show_10301465) {
                const adType = Math.random() > 0.5 ? 'interstitial' : 'popup';
                const adPromise = (adType === 'interstitial') ? show_10301465() : show_10301465('pop');

                adPromise.then(() => {
                    const earnedCredits = Math.floor(Math.random() * (MAX_REWARD_CREDITS - MIN_REWARD_CREDITS + 1)) + MIN_REWARD_CREDITS;
                    tg.showAlert(`Tebrikler! ${earnedCredits} kredi kazandınız!`);
                    userData.credit_balance += earnedCredits;
                    userData.lastAdTimestamp = now;
                    userData.nextAdTimestamp = now + (AD_COOLDOWN_MINUTES * 60 * 1000);
                    saveAppData();
                    updateUI();
                    updateAdButtonState();
                }).catch(e => {
                    console.error("Reklam hatası:", e);
                    tg.showAlert('Reklam yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
                });
            }
        });

        withdrawButton.addEventListener('click', handleWithdrawRequest);

        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPageId = link.dataset.page;
                menuLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                document.querySelectorAll('.page-content').forEach(page => page.style.display = 'none');
                document.getElementById(targetPageId).style.display = 'block';

                if (targetPageId === 'admin-page') {
                    renderAdminPanel();
                }
                
                if (targetPageId === 'payment-page' || targetPageId === 'wallet-page') {
                    updateUI();
                }
            });
        });

        walletForm.addEventListener('submit', (e) => {
            e.preventDefault();
            userData.usdt_wallet_address = usdtAddressInput.value;
            saveAppData();
            tg.showAlert('USDT çekim adresiniz başarıyla kaydedildi!');
        });
    }
});
