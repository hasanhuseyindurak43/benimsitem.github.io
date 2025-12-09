// script.js
document.addEventListener('DOMContentLoaded', () => {

    // --- DEĞİŞKENLER VE SEÇİCİLER ---
    const STORAGE_KEY = 'tgAppData';
    let userData = {};
    let tg;

    // Sayfa elemanları
    const homePage = document.getElementById('home-page');
    const walletPage = document.getElementById('wallet-page');
    const paymentPage = document.getElementById('payment-page');

    const clickCircle = document.getElementById('click-circle');
    const clickCountSpan = document.getElementById('click-count');
    const totalClicksSpan = document.getElementById('total-clicks');
    const totalAdsSpan = document.getElementById('total-ads');
    const userNameSpan = document.getElementById('user-name');

    const walletForm = document.getElementById('wallet-form');
    const btcInput = document.getElementById('btc-address');
    const ethInput = document.getElementById('eth-address');
    const tronInput = document.getElementById('tron-address');

    const paymentTronAddressSpan = document.getElementById('payment-tron-address');
    const userBalanceSpan = document.getElementById('user-balance');

    const adModal = new bootstrap.Modal(document.getElementById('adModal'));
    const menuLinks = document.querySelectorAll('.nav-link[data-page]');

    // --- TELEGRAM WEB APP BAŞLATMA ---
    if (window.Telegram) {
        tg = window.Telegram.WebApp;
        tg.ready(); // Uygulamanın hazır olduğunu Telegram'a bildir
        tg.expand(); // Uygulamayı tam ekrana getir

        const user = tg.initDataUnsafe.user;
        if (user) {
            initializeUser(user);
            setupEventListeners();
        } else {
            // Telegram dışında veya kullanıcı bilgisi alınamazsa
            document.body.innerHTML = '<div class="container text-center mt-5"><h1>Hata</h1><p>Bu uygulama sadece Telegram üzerinden çalışır.</p></div>';
        }
    } else {
        document.body.innerHTML = '<div class="container text-center mt-5"><h1>Hata</h1><p>Telegram Web App SDK bulunamadı.</p></div>';
    }

    // --- TEMEL FONKSİYONLAR ---

    /**
     * Yeni bir kullanıcı için varsayılan veri yapısı oluşturur.
     * @param {object} user - Telegram kullanıcı objesi
     */
    function createNewUser(user) {
        return {
            id: user.id,
            name: user.first_name,
            username: user.username || 'N/A',
            clickCount: 0,
            adsWatched: 0,
            wallets: {
                BTC: '',
                ETH: '',
                TRON: ''
            }
        };
    }

    /**
     * localStorage'dan tüm verileri yükler veya yeni bir veri seti oluşturur.
     * @param {object} user - Telegram kullanıcı objesi
     */
    function loadUserData(user) {
        const allData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        if (!allData.users) {
            allData.users = {};
        }

        if (!allData.users[user.id]) {
            allData.users[user.id] = createNewUser(user);
        }

        userData = allData.users[user.id];
        console.log("Kullanıcı verileri yüklendi:", userData);
    }

    /**
     * Mevcut kullanıcı verilerini localStorage'a kaydeder.
     */
    function saveUserData() {
        const allData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        allData.users[userData.id] = userData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
        console.log("Kullanıcı verileri kaydedildi:", userData);
    }

    /**
     * Uygulamayı ilk başlatır, kullanıcı verilerini yükler ve arayüzü günceller.
     * @param {object} user - Telegram kullanıcı objesi
     */
    function initializeUser(user) {
        loadUserData(user);
        updateUI();
    }

    /**
     * Arayüzdeki (UI) tüm dinamik elemanları günceller.
     */
    function updateUI() {
        userNameSpan.textContent = `${userData.name} (@${userData.username})`;
        clickCountSpan.textContent = userData.clickCount;
        totalClicksSpan.textContent = userData.clickCount;
        totalAdsSpan.textContent = userData.adsWatched;

        // Cüzdan sayfası inputlarını güncelle
        btcInput.value = userData.wallets.BTC;
        ethInput.value = userData.wallets.ETH;
        tronInput.value = userData.wallets.TRON;

        // Ödeme sayfası bilgilerini güncelle
        paymentTronAddressSpan.textContent = userData.wallets.TRON || 'Kayıtlı değil';
        const balance = (userData.adsWatched * 0.1).toFixed(2); // Her reklam için 0.1 USDT varsayımı
        userBalanceSpan.textContent = `${balance} USDT`;
    }

    // --- OLAY DİNLEYİCİLERİ (EVENT LISTENERS) ---

    function setupEventListeners() {
        // Tıklama Dairesi
        clickCircle.addEventListener('click', () => {
            userData.clickCount++;
            clickCountSpan.textContent = userData.clickCount;
            totalClicksSpan.textContent = userData.clickCount;

            // Her 5 tıklamada bir reklam göster
            if (userData.clickCount % 5 === 0) {
                userData.adsWatched++;
                totalAdsSpan.textContent = userData.adsWatched;
                adModal.show();
            }
            saveUserData();
        });

        // Alt Menü Navigasyonu
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPageId = link.dataset.page;

                // Aktif link stilini değiştir
                menuLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Sayfaları gizle/göster
                document.querySelectorAll('.page-content').forEach(page => {
                    page.style.display = 'none';
                });
                document.getElementById(targetPageId).style.display = 'block';

                // Ödeme veya Cüzdan sayfasına geçince arayüzü güncelle
                if (targetPageId === 'payment-page' || targetPageId === 'wallet-page') {
                    updateUI();
                }
            });
        });

        // Cüzdan Formu
        walletForm.addEventListener('submit', (e) => {
            e.preventDefault();
            userData.wallets.BTC = btcInput.value;
            userData.wallets.ETH = ethInput.value;
            userData.wallets.TRON = tronInput.value;
            saveUserData();
            alert('Cüzdan adresleriniz başarıyla kaydedildi!');
        });
    }
});
