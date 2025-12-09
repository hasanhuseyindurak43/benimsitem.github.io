// script.js
document.addEventListener('DOMContentLoaded', () => {

    // --- DEĞİŞKENLER VE SEÇİCİLER ---
    const STORAGE_KEY = 'hesapData'; // Verileri localStorage'da bu anahtarla saklayacağız
    const AD_COOLDOWN_MINUTES = 5;
    const CREDIT_TO_USDT_RATE = 0.00000001; // 1 Kredi = 0.00000001 USDT
    const MIN_REWARD_CREDITS = 1;
    const MAX_REWARD_CREDITS = 3;

    let appData = {}; // Tüm kullanıcı verilerini tutacak ana nesne
    let userData = {}; // Sadece mevcut kullanıcıyı tutacak
    let tg;
    let countdownInterval;

    // Sayfa elemanları
    const homePage = document.getElementById('home-page');
    const walletPage = document.getElementById('wallet-page');
    const paymentPage = document.getElementById('payment-page');

    const adButton = document.getElementById('ad-button');
    const adButtonTextSpan = document.getElementById('ad-button-text');
    
    const creditBalanceSpan = document.getElementById('credit-balance');
    const usdtBalanceSpan = document.getElementById('usdt-balance');
    const userNameSpan = document.getElementById('user-name');

    const walletForm = document.getElementById('wallet-form');
    const usdtAddressInput = document.getElementById('usdt-address');

    const paymentUsdtAddressSpan = document.getElementById('payment-usdt-address');
    const userBalanceSpan = document.getElementById('user-balance');

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
        appData = storedData ? JSON.parse(storedData) : { users: {} };
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
        console.log("Veriler localStorage'a kaydedildi:", appData);
    }
    
    function initializeApp(user) {
        loadAppData();
        setUserData(user);
        updateUI();

        // --- YENİ: OTOMATİK İÇERİK REKLAMI ---
        // Bu kod, uygulama açıldığında otomatik olarak reklam gösterir.
        // Ödüllü reklamlardan bağımsız çalışır.
        if (window.show_10301465) {
            show_10301465({
                type: 'inApp',
                inAppSettings: {
                    frequency: 2,
                    capping: 0.1,
                    interval: 30,
                    timeout: 5,
                    everyPage: false
                }
            });
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

    // --- OLAY DİNLEYİCİLERİ (EVENT LISTENERS) ---

    function setupEventListeners() {
        adButton.addEventListener('click', () => {
            const now = Date.now();
            if (now >= userData.nextAdTimestamp && window.show_10301465) {
                // Ödüllü reklam için rastgele tür seç
                const adType = Math.random() > 0.5 ? 'interstitial' : 'popup';
                const adPromise = (adType === 'interstitial') ? show_10301465() : show_10301465('pop');

                adPromise.then(() => {
                    // Reklam başarıyla izlendi, ödülü ver
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

        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPageId = link.dataset.page;
                menuLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                document.querySelectorAll('.page-content').forEach(page => page.style.display = 'none');
                document.getElementById(targetPageId).style.display = 'block';
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
