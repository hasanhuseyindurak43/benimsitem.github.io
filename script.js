// script.js
document.addEventListener('DOMContentLoaded', () => {

    const desktopView = document.getElementById('desktop-view');
    const telegramAppView = document.getElementById('telegram-app-view');

    // --- EN ÖNEMLİ KONTROL: Sayfanın Nerede Açıldığını Tespit Etme ---
    if (window.Telegram && window.Telegram.WebApp) {
        // Sayfa Telegram içinde açıldı.
        // Giriş sayfasını gizle, uygulamayı göster.
        desktopView.style.display = 'none';
        telegramAppView.style.display = 'block';

        // --- DEĞİŞKENLER VE SEÇİCİLER (Sadece Telegram'da çalışacak) ---
        const STORAGE_KEY = 'hesapData';
        const AD_COOLDOWN_MINUTES = 5;
        const CREDIT_TO_USDT_RATE = 0.00000001;
        const MIN_REWARD_CREDITS = 1;
        const MAX_REWARD_CREDITS = 3;
        const ADMIN_USERNAME = '@Hasan199243';

        const AD_PROVIDERS = {
            interstitials: {
                adexium: {
                    scriptUrl: 'https://cdn.tgads.space/assets/js/adexium-widget.min.js',
                    wid: '70d12969-8210-48e9-a651-f5574848bc84',
                    adFormat: 'interstitial'
                },
                monetag: {
                    scriptUrl: '//libtl.com/sdk.js',
                    dataZone: '10301465',
                    dataSdk: 'show_10301465'
                }
            },
            banners: {
                adextra: {
                    scriptUrl: 'https://partner.adextra.io/jt/d34bcbcf6512122c89e0c7654c0bda0619117b6e.js'
                }
            }
        };

        let appData = {};
        let userData = {};
        let tg;
        let countdownInterval;
        let adProviderScriptsLoaded = {};

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
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const user = tg.initDataUnsafe.user;
        if (user) {
            initializeApp(user);
            setupEventListeners();
            countdownInterval = setInterval(updateAdButtonState, 1000);
        } else {
            // Bu durum Telegram içinde ama kullanıcı verisi yoksa oluşur.
            // Uygulama içini boşaltıp hata mesajı gösterelim.
            telegramAppView.innerHTML = '<div class="container text-center mt-5"><h1>Hata</h1><p>Kullanıcı bilgileri alınamadı.</p></div>';
        }
        
        // --- Diğer tüm fonksiyonlar burada kalıyor (değişiklik yok) ---
        function loadAdScript(providerName, providerConfig) { /* ... */ }
        function showRandomAd() { /* ... */ }
        function handleAdSuccess() { /* ... */ }
        function createNewUser(user) { /* ... */ }
        function loadAppData() { /* ... */ }
        function setUserData(user) { /* ... */ }
        function saveAppData() { /* ... */ }
        function initializeApp(user) { /* ... */ }
        function updateUI() { /* ... */ }
        function updateAdButtonState() { /* ... */ }
        function handleWithdrawRequest() { /* ... */ }
        function showAlert(message, type) { /* ... */ }
        function renderAdminPanel() { /* ... */ }
        window.deleteRequest = function(requestId) { /* ... */ }
        function setupEventListeners() { /* ... */ }

        // Fonksiyonların içeriğini buraya yapıştırın (önceki kodlarla aynı)
        // Kısaca, mevcut script.js dosyanızın tüm içeriğini bu if bloğunun içine taşıyın.
        // Bu, normal tarayıcıda hata almayı engeller.

    } else {
        // Sayfa normal bir tarayıcıda açıldı.
        // Giriş sayfası zaten görünür olduğu için bir şey yapmaya gerek yok.
        console.log("Running in a standard browser. Showing landing page.");
    }
});
