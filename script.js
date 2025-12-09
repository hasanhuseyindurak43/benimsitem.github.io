// script.js
document.addEventListener('DOMContentLoaded', () => {

    // --- DEĞİŞKENLER VE SEÇİCİLER ---
    const API_URL = 'api.php'; // PHP API dosyamızın yolu
    const AD_COOLDOWN_MINUTES = 5;
    const REWARD_AMOUNT = 0.00000001;

    let appData = {}; // Tüm kullanıcı verilerini tutacak ana nesne
    let userData = {}; // Sadece mevcut kullanıcıyı tutacak
    let tg;
    let countdownInterval;

    // Sayfa elemanları (değişiklik yok)
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

    // --- SUNUCU İLETİŞİM FONKSİYONLARI ---

    // Sunucudan verileri çeken fonksiyon
    async function readDataFromServer() {
        try {
            const response = await fetch(`${API_URL}?action=read`);
            if (!response.ok) throw new Error('Sunucudan veri okunamadı.');
            return await response.json();
        } catch (error) {
            console.error("Okuma Hatası:", error);
            tg.showAlert('Sunucu ile iletişim kurulamadı. Sayfayı yenilemeyi deneyin.');
            return null; // Hata durumunda null döndür
        }
    }

    // Sunucuya verileri gönderen fonksiyon
    async function writeDataToServer(data) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Sunucuya veri yazılamadı.');
            const result = await response.json();
            console.log("Sunucu Yanıtı:", result);
        } catch (error) {
            console.error("Yazma Hatası:", error);
            tg.showAlert('Veriler kaydedilemedi. Lütfen internet bağlantınızı kontrol edin.');
        }
    }

    // --- TELEGRAM WEB APP BAŞLATMA ---
    if (window.Telegram && window.show_10301465) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const user = tg.initDataUnsafe.user;
        if (user) {
            initializeApp(user);
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
            time_info: 0,
            usdt_balance: 0.00000000,
            usdt_wallet_address: ''
        };
    }

    // Uygulamayı başlatır: Sunucudan veri çeker ve kullanıcıyı ayarlar
    async function initializeApp(user) {
        appData = await readDataFromServer();
        if (appData === null) return; // Sunucudan veri alınamadıysa durdur

        if (!appData.users) appData.users = {};
        if (!appData.users[user.id]) {
            appData.users[user.id] = createNewUser(user);
        }
        userData = appData.users[user.id];

        updateUI();
        setupEventListeners();
        countdownInterval = setInterval(updateAdButtonState, 1000);
    }

    // Arayüzü günceller (değişiklik yok)
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
        adButton.addEventListener('click', async () => {
            const now = Date.now();
            if (now >= userData.time_info && window.show_10301465) {
                show_10301465('pop').then(async () => {
                    tg.showAlert('Tebrikler! 0.00000001 USDT bakiyenize eklendi!');
                    
                    userData.usdt_balance += REWARD_AMOUNT;
                    userData.time_info = now + (AD_COOLDOWN_MINUTES * 60 * 1000);
                    
                    await writeDataToServer(appData); // Sunucuya kaydet
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

        walletForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            userData.usdt_wallet_address = usdtAddressInput.value;
            await writeDataToServer(appData); // Sunucuya kaydet
            tg.showAlert('USDT çekim adresiniz başarıyla kaydedildi!');
        });
    }
});
