// script.js
document.addEventListener('DOMContentLoaded', () => {

    // --- DEĞİŞKENLER VE SEÇİCİLER ---
    const STORAGE_KEY = 'tgAppData';
    const AD_COOLDOWN_MINUTES = 5; // Reklam arası bekleme süresi (dakika)
    const REWARD_AMOUNT = 0.00000001; // Reklam ödülü

    let userData = {};
    let tg;
    let countdownInterval; // Geri sayım için interval

    // Sayfa elemanları
    const homePage = document.getElementById('home-page');
    const walletPage = document.getElementById('wallet-page');
    const paymentPage = document.getElementById('payment-page');

    const adButton = document.getElementById('ad-button');
    const adButtonTextSpan = document.getElementById('ad-button-text');
    
    const totalAdsSpan = document.getElementById('total-ads');
    const userNameSpan = document.getElementById('user-name');
    const usdtBalanceSpan = document.getElementById('usdt-balance'); // Yeni

    const walletForm = document.getElementById('wallet-form');
    const btcInput = document.getElementById('btc-address');
    const ethInput = document.getElementById('eth-address');
    const tronInput = document.getElementById('tron-address');

    const paymentTronAddressSpan = document.getElementById('payment-tron-address');
    const userBalanceSpan = document.getElementById('user-balance');

    const menuLinks = document.querySelectorAll('.nav-link[data-page]');

    // --- TELEGRAM WEB APP BAŞLATMA ---
    if (window.Telegram && window.show_10301465) { // SDK'nın varlığını da kontrol et
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const user = tg.initDataUnsafe.user;
        if (user) {
            initializeUser(user);
            setupEventListeners();
            // Geri sayımı başlat
            updateAdButtonState(); 
            countdownInterval = setInterval(updateAdButtonState, 1000);
        } else {
            document.body.innerHTML = '<div class="container text-center mt-5"><h1>Hata</h1><p>Bu uygulama sadece Telegram üzerinden çalışır.</p></div>';
        }
    } else {
        document.body.innerHTML = '<div class="container text-center mt-5"><h1>Hata</h1><p>Telegram Web App SDK veya Reklam SDK bulunamadı.</p></div>';
    }

    // --- TEMEL FONKSİYONLAR ---

    function createNewUser(user) {
        return {
            id: user.id,
            name: user.first_name,
            username: user.username || 'N/A',
            usdt_balance: 0, // Yeni
            totalAdsWatched: 0, // isim değişti
            nextAdTimestamp: 0, // Yeni: Bir sonraki reklamın zamanı
            wallets: {
                BTC: '',
                ETH: '',
                TRON: ''
            }
        };
    }

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

    function saveUserData() {
        const allData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        allData.users[userData.id] = userData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
        console.log("Kullanıcı verileri kaydedildi:", userData);
    }

    function initializeUser(user) {
        loadUserData(user);
        updateUI();
    }

    function updateUI() {
        userNameSpan.textContent = `${userData.name} (@${userData.username})`;
        totalAdsSpan.textContent = userData.totalAdsWatched;
        usdtBalanceSpan.textContent = userData.usdt_balance.toFixed(8); // 8 basamak göster

        btcInput.value = userData.wallets.BTC;
        ethInput.value = userData.wallets.ETH;
        tronInput.value = userData.wallets.TRON;

        paymentTronAddressSpan.textContent = userData.wallets.TRON || 'Kayıtlı değil';
        userBalanceSpan.textContent = `${userData.usdt_balance.toFixed(8)} USDT`;
    }
    
    // --- YENİ: REKLAM BUTONU DURUMUNU GÜNCELLEME FONKSİYONU ---
    function updateAdButtonState() {
        const now = Date.now();

        if (now >= userData.nextAdTimestamp) {
            // Reklam mevcut
            adButton.classList.remove('disabled');
            adButtonTextSpan.textContent = 'Reklam İzle';
        } else {
            // Reklam beklemede
            adButton.classList.add('disabled');
            const remainingTime = Math.floor((userData.nextAdTimestamp - now) / 1000);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            adButtonTextSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }


    // --- OLAY DİNLEYİCİLERİ (EVENT LISTENERS) ---

    function setupEventListeners() {
        // Reklam Butonu Tıklama
        adButton.addEventListener('click', () => {
            const now = Date.now();
            // Buton aktifse ve SDK varsa
            if (now >= userData.nextAdTimestamp && window.show_10301465) {
                // Reklamı göster
                show_10301465('pop').then(() => {
                    // Reklam başarıyla izlendi, ödülü ver
                    tg.showAlert('Tebrikler! 0.00000001 USDT bakiyenize eklendi!');
                    
                    userData.usdt_balance += REWARD_AMOUNT;
                    userData.totalAdsWatched++;
                    userData.nextAdTimestamp = now + (AD_COOLDOWN_MINUTES * 60 * 1000); // 5 dk sonrası için yeni zaman damgası
                    
                    saveUserData();
                    updateUI();
                    updateAdButtonState(); // Buton durumunu hemen güncelle
                }).catch(e => {
                    // Reklam gösterilemedi veya hata oluştu
                    console.error("Reklam hatası:", e);
                    tg.showAlert('Reklam yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
                });
            }
        });

        // Alt Menü Navigasyonu
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPageId = link.dataset.page;

                menuLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                document.querySelectorAll('.page-content').forEach(page => {
                    page.style.display = 'none';
                });
                document.getElementById(targetPageId).style.display = 'block';

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
            tg.showAlert('Cüzdan adresleriniz başarıyla kaydedildi!');
        });
    }
});
