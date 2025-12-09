// script.js
document.addEventListener('DOMContentLoaded', () => {

    // --- DEĞİŞKENLER VE SEÇİCİLER ---
    const STORAGE_KEY = 'hesapData'; // localStorage'da kullanacağımız anahtar
    const AD_COOLDOWN_MINUTES = 5;
    const REWARD_AMOUNT = 0.00000001;

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
    
    const totalAdsSpan = document.getElementById('total-ads');
    const userNameSpan = document.getElementById('user-name');
    const usdtBalanceSpan = document.getElementById('usdt-balance');

    const walletForm = document.getElementById('wallet-form');
    const usdtAddressInput = document.getElementById('usdt-address');

    const paymentUsdtAddressSpan = document.getElementById('payment-usdt-address');
    const userBalanceSpan = document.getElementById('user-balance');

    const menuLinks = document.querySelectorAll('.nav-link[data-page]');

    // --- TELEGRAM WEB APP BAŞLATMA ---
    if (window.Telegram && window.show_10301465) { // Reklam SDK'sının varlığını da kontrol et
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
            time_info: 0, // Bir sonraki reklam zamanı (milisaniye)
            usdt_balance: 0.00000000, // USDT Bakiyesi
            usdt_wallet_address: '' // USDT Çekim Adresi
        };
    }

    function loadAppData() {
        const storedData = localStorage.getItem(STORAGE_KEY);
        appData = storedData ? JSON.parse(storedData) : { users: {} };
        console.log("localStorage'dan Yüklenen Veri:", appData);
    }

    function setUserData(user) {
        if (!appData.users) {
            appData.users = {};
        }
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
    }

    function updateUI() {
        userNameSpan.textContent = userData.username;
        totalAdsSpan.textContent = Math.floor(userData.usdt_balance / REWARD_AMOUNT);
        usdtBalanceSpan.textContent = userData.usdt_balance.toFixed(8);

        usdtAddressInput.value = userData.usdt_wallet_address;
        paymentUsdtAddressSpan.textContent = userData.usdt_wallet_address || 'Kayıtlı değil';
        userBalanceSpan.textContent = `${userData.usdt_balance.toFixed(8)} USDT`;
    }
    
    function updateAdButtonState() {
        const now = Date.now();
        if (now >= userData.time_info) {
            adButton.classList.remove('disabled');
            adButtonTextSpan.textContent = 'Reklam İzle';
        } else {
            adButton.classList.add('disabled');
            const remainingTime = Math.floor((userData.time_info - now) / 1000);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            adButtonTextSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // --- OLAY DİNLEYİCİLERİ (EVENT LISTENERS) ---

    function setupEventListeners() {
        adButton.addEventListener('click', () => {
            const now = Date.now();
            if (now >= userData.time_info && window.show_10301465) {
                // REKLAM GÖSTERİLİYOR
                show_10301465('pop').then(() => {
                    // ÖDÜL VERİLİYOR
                    tg.showAlert('Tebrikler! 0.00000001 USDT bakiyenize eklendi!');
                    
                    userData.usdt_balance += REWARD_AMOUNT;
                    userData.time_info = now + (AD_COOLDOWN_MINUTES * 60 * 1000);
                    
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
