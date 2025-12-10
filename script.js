// script.js - GÜNCELLENMİŞ (AYLIK 5-10 USDT HESAPLAMASI)
document.addEventListener('DOMContentLoaded', () => {

    // --- DEĞİŞKENLER VE SEÇİCİLER ---
    const STORAGE_KEY = 'hesapData';
    const AD_COOLDOWN_MINUTES = 5; // 5 dakika bekleme
    const CREDIT_TO_USDT_RATE = 5; // 1 Kredi = 10 USDT
    
    // --- GÜNCELLENMİŞ: Aylık 5-10 USDT için gerekli kredi aralığı ---
    // Hesaplama: 5 dakika bekleme, günde 16 saat aktif, ayda 30 gün
    // Günde: (60/5) * 16 = 192 reklam
    // Ayda: 192 * 30 = 5760 reklam
    // Minimum: 5 USDT / 5760 = 0.00086806 USDT/reklam
    // Maksimum: 10 USDT / 5760 = 0.00173611 USDT/reklam
    // 1 Kredi = 10 USDT olduğu için:
    const MIN_REWARD_CREDITS = 0.000008606; // 0.00086806 USDT / 10
    const MAX_REWARD_CREDITS = 0.000017611; // 0.00173611 USDT / 10
    
    const ADMIN_USERNAME = 'Hasan199243';

    // --- MONETAG KONFİGÜRASYONU ---
    const MONETAG_CONFIG = {
        scriptUrl: '//libtl.com/sdk.js',
        dataZone: '10301465',
        dataSdk: 'show_10301465',
        adSettings: {
            type: 'inApp',
            inAppSettings: {
                frequency: 2,
                capping: 0.1,
                interval: 30,
                timeout: 5,
                everyPage: false
            }
        }
    };

    let appData = {};
    let userData = {};
    let tg;
    let countdownInterval;
    let monetagScriptLoaded = false;
    let adWatchStartTime = 0;
    let adWatchInterval;
    
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
    const adminUsersContainer = document.getElementById('admin-users-container');
    const adminBannedUsersContainer = document.getElementById('admin-banned-users-container');
    const userCountBadge = document.getElementById('user-count');

    const menuLinks = document.querySelectorAll('.nav-link[data-page]');

    // --- TELEGRAM WEB APP BAŞLATMA ---
    if (window.Telegram) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const user = tg.initDataUnsafe.user;
        if (user) {
            initializeApp(user);
            setupEventListeners();
            countdownInterval = setInterval(updateAdButtonState, 1000);
            
            // Monetag script'ini önceden yükle
            loadMonetagScript();
        } else {
            document.body.innerHTML = '<div class="container text-center mt-5"><h1>Hata</h1><p>Bu uygulama sadece Telegram üzerinden çalışır.</p></div>';
        }
    } else {
        document.body.innerHTML = '<div class="container text-center mt-5"><h1>Hata</h1><p>Gerekli SDK\'lar bulunamadı.</p></div>';
    }

    // --- MONETAG SCRIPT'İNİ YÜKLEME FONKSİYONU ---
    function loadMonetagScript() {
        return new Promise((resolve, reject) => {
            if (monetagScriptLoaded) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = MONETAG_CONFIG.scriptUrl;
            script.setAttribute('data-zone', MONETAG_CONFIG.dataZone);
            script.setAttribute('data-sdk', MONETAG_CONFIG.dataSdk);

            script.onload = () => {
                monetagScriptLoaded = true;
                console.log('Monetag scripti başarıyla yüklendi.');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Monetag script yüklenemedi.'));
            };

            document.head.appendChild(script);
        });
    }

    // --- GÜNCELLENMİŞ: SADECE MONETAG REKLAMINI GÖSTERME FONKSİYONU ---
    function showMonetagAd() {
        if (!monetagScriptLoaded) {
            loadMonetagScript()
                .then(() => {
                    if (window.show_10301465) {
                        showAd();
                    } else {
                        console.error("Monetag fonksiyonu bulunamadı.");
                        tg.showAlert('Reklam yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
                    }
                })
                .catch(error => {
                    console.error('Monetag script yüklenemedi:', error);
                    tg.showAlert('Reklam yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
                });
        } else {
            if (window.show_10301465) {
                showAd();
            } else {
                console.error("Monetag fonksiyonu bulunamadı.");
                tg.showAlert('Reklam yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
            }
        }
    }
    
    function showAd() {
        // Reklam izleme süresini başlat
        adWatchStartTime = Date.now();
        
        // Kullanıcının reklamdan çıkmasını engellemek için bir overlay oluştur
        const adOverlay = document.createElement('div');
        adOverlay.id = 'ad-overlay';
        adOverlay.style.position = 'fixed';
        adOverlay.style.top = '0';
        adOverlay.style.left = '0';
        adOverlay.style.width = '100%';
        adOverlay.style.height = '100%';
        adOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        adOverlay.style.backdropFilter = 'blur(10px)';
        adOverlay.style.zIndex = '9999';
        adOverlay.style.display = 'flex';
        adOverlay.style.flexDirection = 'column';
        adOverlay.style.justifyContent = 'center';
        adOverlay.style.alignItems = 'center';
        
        // Reklam izleme mesajı
        const adMessage = document.createElement('div');
        adMessage.style.fontSize = '20px';
        adMessage.style.color = '#ffffff';
        adMessage.style.marginBottom = '20px';
        adMessage.style.textAlign = 'center';
        adMessage.style.padding = '20px';
        adMessage.style.backgroundColor = 'rgba(40, 167, 69, 0.3)';
        adMessage.style.borderRadius = '10px';
        adMessage.innerHTML = 'Lütfen reklamı tam olarak izleyin<br>' +
                             `Kazanacağınız: ${MIN_REWARD_CREDITS.toFixed(9)} - ${MAX_REWARD_CREDITS.toFixed(9)} Kredi<br>` +
                             '(1 Kredi = 10 USDT)<br>' +
                             'Bekleme süresi: 5 dakika';
        
        // Kalan süreyi gösteren sayaç
        const adTimer = document.createElement('div');
        adTimer.id = 'ad-timer';
        adTimer.style.fontSize = '24px';
        adTimer.style.fontWeight = 'bold';
        adTimer.style.color = '#28a745';
        adTimer.style.marginBottom = '30px';
        adTimer.style.textAlign = 'center';
        adTimer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        adTimer.style.padding = '15px';
        adTimer.style.borderRadius = '10px';
        adTimer.style.width = '80%';
        adTimer.textContent = 'Reklam izleniyor... Kalan süre: 30 saniye';
        
        // Aylık kazanç bilgisi
        const monthlyInfo = document.createElement('div');
        monthlyInfo.style.fontSize = '16px';
        monthlyInfo.style.color = '#ffffff';
        monthlyInfo.style.textAlign = 'center';
        monthlyInfo.style.marginTop = '20px';
        monthlyInfo.style.padding = '15px';
        monthlyInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        monthlyInfo.style.borderRadius = '10px';
        monthlyInfo.innerHTML = '<strong>Aylık Kazanç Hesaplaması:</strong><br>' +
                               '• 5 dakika bekleme<br>' +
                               '• Günde 16 saat aktif (192 reklam)<br>' +
                               '• Ayda 30 gün (5,760 reklam)<br>' +
                               '• <strong>Aylık kazanç: 5-10 USDT</strong>';
        
        adOverlay.appendChild(adMessage);
        adOverlay.appendChild(adTimer);
        adOverlay.appendChild(monthlyInfo);
        document.body.appendChild(adOverlay);
        
        // Her saniye sayaçı güncelle
        let secondsLeft = 30;
        adWatchInterval = setInterval(() => {
            secondsLeft--;
            adTimer.textContent = `Reklam izleniyor... Kalan süre: ${secondsLeft} saniye`;
            
            if (secondsLeft <= 0) {
                clearInterval(adWatchInterval);
                document.body.removeChild(adOverlay);
                handleAdSuccess();
            }
        }, 1000);
        
        // Monetag reklamını göster
        show_10301465(MONETAG_CONFIG.adSettings);
    }

    function handleAdSuccess() {
        // Rastgele kredi kazanma (MIN_REWARD_CREDITS - MAX_REWARD_CREDITS arası)
        const earnedCredits = MIN_REWARD_CREDITS + (Math.random() * (MAX_REWARD_CREDITS - MIN_REWARD_CREDITS));
        
        // USDT'ye çevir
        const earnedUSDT = earnedCredits * CREDIT_TO_USDT_RATE;
        
        tg.showAlert(`Tebrikler! ${earnedCredits.toFixed(9)} Kredi (${earnedUSDT.toFixed(8)} USDT) kazandınız!\n5 dakika sonra tekrar reklam izleyebilirsiniz.`);
        
        userData.credit_balance += earnedCredits;
        const now = Date.now();
        userData.lastAdTimestamp = now;
        userData.nextAdTimestamp = now + (AD_COOLDOWN_MINUTES * 60 * 1000);
        
        saveAppData();
        updateUI();
        updateAdButtonState();
    }

    // --- TEMEL FONKSİYONLAR ---
    function createNewUser(user) {
        return {
            username: user.username || user.first_name,
            credit_balance: 0,
            lastAdTimestamp: 0,
            nextAdTimestamp: 0,
            usdt_wallet_address: '',
            isBanned: false
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
        
        // Kullanıcının banlı olup olmadığını kontrol et
        if (userData.isBanned) {
            document.body.innerHTML = '<div class="container text-center mt-5"><h1>Erişim Engellendi</h1><p>Hesabınız engellenmiştir. Lütfen yönetici ile iletişime geçin.</p></div>';
            throw new Error('User is banned');
        }
        
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

        // Admin kullanıcısı kontrolü
        if (userData.username === ADMIN_USERNAME) {
            adminMenuLink.style.display = 'flex';
        }
    }

    function updateUI() {
        userNameSpan.textContent = userData.username;
        const usdtBalance = userData.credit_balance * CREDIT_TO_USDT_RATE;
        
        // Kredi bakiyesini göster (9 ondalık basamak)
        creditBalanceSpan.textContent = userData.credit_balance.toFixed(9);
        usdtBalanceSpan.textContent = usdtBalance.toFixed(8);
        userBalanceSpan.textContent = `${usdtBalance.toFixed(8)} USDT`;

        usdtAddressInput.value = userData.usdt_wallet_address;
        paymentUsdtAddressSpan.textContent = userData.usdt_wallet_address || 'Kayıtlı değil';
    }
    
    function updateAdButtonState() {
        const now = Date.now();
        if (now >= userData.nextAdTimestamp) {
            adButton.classList.remove('disabled');
            adButtonTextSpan.innerHTML = 'Reklam İzle<br>' +
                                        `(${MIN_REWARD_CREDITS.toFixed(9)}-${MAX_REWARD_CREDITS.toFixed(9)} Kredi)<br>` +
                                        '5 dk bekleme';
        } else {
            adButton.classList.add('disabled');
            const remainingTime = Math.floor((userData.nextAdTimestamp - now) / 1000);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            adButtonTextSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // --- ÇEKİM TALEBİ VE ADMIN PANELİ FONKSİYONLARI ---
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

        // Kredi'den düş (USDT'ye çevirerek)
        const creditsToDeduct = amount / CREDIT_TO_USDT_RATE;
        userData.credit_balance -= creditsToDeduct;

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
        renderAdminUsersList();
        renderAdminRequests();
        renderAdminBannedUsers();
    }
    
    function renderAdminUsersList() {
        adminUsersContainer.innerHTML = '';
        const users = appData.users || {};
        
        // Kullanıcı sayısını güncelle
        const userCount = Object.keys(users).length;
        userCountBadge.textContent = `${userCount} Kullanıcı`;
        
        if (Object.keys(users).length === 0) {
            adminUsersContainer.innerHTML = '<tr><td colspan="4" class="text-center">Kullanıcı bulunmamaktadır.</td></tr>';
            return;
        }

        for (const userId in users) {
            const user = users[userId];
            const usdtBalance = user.credit_balance * CREDIT_TO_USDT_RATE;
            
            const userRow = document.createElement('tr');
            userRow.innerHTML = `
                <td>${user.username}</td>
                <td>${user.credit_balance.toFixed(9)}</td>
                <td>${usdtBalance.toFixed(8)}</td>
                <td>
                    <button class="btn btn-sm ${user.isBanned ? 'btn-success' : 'btn-danger'}" onclick="toggleUserBan('${userId}')">
                        ${user.isBanned ? 'Banı Kaldır' : 'Banla'}
                    </button>
                </td>
            `;
            adminUsersContainer.appendChild(userRow);
        }
    }
    
    function renderAdminRequests() {
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
    
    function renderAdminBannedUsers() {
        adminBannedUsersContainer.innerHTML = '';
        const users = appData.users || {};
        const bannedUsers = [];
        
        // Banlı kullanıcıları filtrele
        for (const userId in users) {
            if (users[userId].isBanned) {
                bannedUsers.push({
                    id: userId,
                    username: users[userId].username
                });
            }
        }
        
        if (bannedUsers.length === 0) {
            adminBannedUsersContainer.innerHTML = '<p>Banlı kullanıcı bulunmamaktadır.</p>';
            return;
        }
        
        for (const user of bannedUsers) {
            const userCard = document.createElement('div');
            userCard.className = 'admin-banned-user-card';
            userCard.innerHTML = `
                <div class="card-title">
                    ${user.username}
                </div>
                <button class="btn btn-success btn-sm" onclick="toggleUserBan('${user.id}')">Banı Kaldır</button>
            `;
            adminBannedUsersContainer.appendChild(userCard);
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
    
    window.toggleUserBan = function(userId) {
        if (!appData.users[userId]) return;
        
        const user = appData.users[userId];
        user.isBanned = !user.isBanned;
        
        saveAppData();
        renderAdminPanel();
        
        const action = user.isBanned ? 'banlandı' : 'banı kaldırıldı';
        tg.showAlert(`${user.username} kullanıcısı ${action}.`);
    }

    // --- OLAY DİNLEYİCİLERİ (EVENT LISTENERS) ---
    function setupEventListeners() {
        adButton.addEventListener('click', () => {
            const now = Date.now();
            if (now >= userData.nextAdTimestamp) {
                showMonetagAd();
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
