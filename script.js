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

        // Reklam sağlayıcıları sıralı listesi
        const AD_PROVIDERS_SEQUENCE = ['monetag', 'adexium', 'adextra'];
        
        const AD_PROVIDERS = {
            monetag: {
                scriptUrl: '//libtl.com/sdk.js',
                dataZone: '10301465',
                dataSdk: 'show_10301465'
            },
            adexium: {
                scriptUrl: 'https://cdn.tgads.space/assets/js/adexium-widget.min.js',
                wid: '70d12969-8210-48e9-a651-f5574848bc84',
                adFormat: 'interstitial'
            },
            adextra: {
                scriptUrl: 'https://partner.adextra.io/jt/d34bcbcf6512122c89e0c7654c0bda0619117b6e.js',
                divId: 'd34bcbcf6512122c89e0c7654c0bda0619117b6e'
            }
        };

        let appData = {};
        let userData = {};
        let tg;
        let countdownInterval;
        let adProviderScriptsLoaded = {};
        let currentAdProviderIndex = 0;

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
        
        // --- FONKSİYONLAR ---
        
        // Reklam script'ini dinamik olarak yükle
        function loadAdScript(providerName, providerConfig) {
            return new Promise((resolve, reject) => {
                if (adProviderScriptsLoaded[providerName]) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = providerConfig.scriptUrl;
                
                if (providerName === 'monetag') {
                    script.async = true;
                }
                
                script.onload = () => {
                    adProviderScriptsLoaded[providerName] = true;
                    resolve();
                };
                
                script.onerror = () => {
                    console.error(`Failed to load ${providerName} script`);
                    reject(new Error(`Failed to load ${providerName} script`));
                };
                
                document.head.appendChild(script);
            });
        }

        // Sıradaki reklam sağlayıcısını göster
        async function showNextAd() {
            const providerName = AD_PROVIDERS_SEQUENCE[currentAdProviderIndex];
            const providerConfig = AD_PROVIDERS[providerName];
            
            try {
                await loadAdScript(providerName, providerConfig);
                
                switch(providerName) {
                    case 'monetag':
                        showMonetagAd();
                        break;
                    case 'adexium':
                        showAdexiumAd();
                        break;
                    case 'adextra':
                        showAdextraAd();
                        break;
                }
                
                // Bir sonraki reklam sağlayıcısına geç
                currentAdProviderIndex = (currentAdProviderIndex + 1) % AD_PROVIDERS_SEQUENCE.length;
                
                // Reklam gösterildiği zamanı kaydet
                userData.lastAdTime = Date.now();
                saveAppData();
                
                // Butonu devre dışı bırak ve geri sayımı başlat
                updateAdButtonState();
            } catch (error) {
                console.error(`Error showing ${providerName} ad:`, error);
                // Hata durumunda bir sonraki sağlayıcıya geç
                currentAdProviderIndex = (currentAdProviderIndex + 1) % AD_PROVIDERS_SEQUENCE.length;
                showNextAd();
            }
        }

        // Monetag reklamını göster
        function showMonetagAd() {
            if (typeof show_10301465 === 'function') {
                show_10301465().then(() => {
                    handleAdSuccess();
                }).catch(error => {
                    console.error('Monetag ad error:', error);
                });
            } else {
                console.error('Monetag function not available');
            }
        }

        // Adexium reklamını göster
        function showAdexiumAd() {
            if (typeof AdexiumWidget !== 'undefined') {
                const adexiumWidget = new AdexiumWidget({
                    wid: AD_PROVIDERS.adexium.wid, 
                    adFormat: AD_PROVIDERS.adexium.adFormat
                });
                
                // Reklam başarıyla gösterildiğinde
                adexiumWidget.onAdShown = () => {
                    console.log('Adexium ad shown');
                };
                
                // Reklam tamamlandığında veya kapatıldığında
                adexiumWidget.onAdClosed = () => {
                    handleAdSuccess();
                };
                
                // Reklamı göster
                adexiumWidget.showAd();
            } else {
                console.error('AdexiumWidget not available');
            }
        }

        // Adextra reklamını göster
        function showAdextraAd() {
            if (typeof p_adextra === 'function') {
                const onSuccess = () => {
                    handleAdSuccess();
                };
                
                const onError = () => {
                    console.error('Adextra ad error');
                };
                
                p_adextra(onSuccess, onError);
            } else {
                console.error('p_adextra function not available');
            }
        }

        // Reklam başarıyla izlendiğinde ödül ver
        function handleAdSuccess() {
            // Rastgele kredi miktarı belirle
            const earnedCredits = Math.floor(Math.random() * (MAX_REWARD_CREDITS - MIN_REWARD_CREDITS + 1)) + MIN_REWARD_CREDITS;
            userData.credits += earnedCredits;
            
            // USDT değerini güncelle
            userData.usdtBalance = userData.credits * CREDIT_TO_USDT_RATE;
            
            // Verileri kaydet
            saveAppData();
            
            // Arayüzü güncelle
            updateUI();
            
            // Ödül bildirimi göster
            tg.showPopup({
                title: 'Tebrikler!',
                message: `Reklamı izlediniz ve ${earnedCredits} kredi kazandınız!`,
                buttons: [{ text: 'Tamam' }]
            });
        }

        // Yeni kullanıcı oluştur
        function createNewUser(user) {
            return {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name || '',
                username: user.username || '',
                credits: 0,
                usdtBalance: 0,
                usdtAddress: '',
                lastAdTime: 0,
                isAdmin: user.username === ADMIN_USERNAME.replace('@', '')
            };
        }

        // Uygulama verilerini yükle
        function loadAppData() {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                appData = JSON.parse(storedData);
            } else {
                appData = {};
            }
        }

        // Kullanıcı verilerini ayarla
        function setUserData(user) {
            if (appData[user.id]) {
                userData = appData[user.id];
                // Kullanıcı adını güncelle (değişmiş olabilir)
                userData.firstName = user.first_name;
                userData.lastName = user.last_name || '';
                userData.username = user.username || '';
                // Admin durumunu kontrol et
                userData.isAdmin = user.username === ADMIN_USERNAME.replace('@', '');
            } else {
                userData = createNewUser(user);
                appData[user.id] = userData;
            }
        }

        // Uygulama verilerini kaydet
        function saveAppData() {
            appData[userData.id] = userData;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
        }

        // Uygulamayı başlat
        function initializeApp(user) {
            loadAppData();
            setUserData(user);
            updateUI();
            
            // Admin menüsünü göster/gizle
            if (userData.isAdmin) {
                adminMenuLink.style.display = 'block';
            }
        }

        // Arayüzü güncelle
        function updateUI() {
            userNameSpan.textContent = `${userData.firstName} ${userData.lastName}`;
            creditBalanceSpan.textContent = userData.credits;
            usdtBalanceSpan.textContent = userData.usdtBalance.toFixed(8);
            
            if (userData.usdtAddress) {
                paymentUsdtAddressSpan.textContent = userData.usdtAddress;
            }
            
            userBalanceSpan.textContent = `${userData.usdtBalance.toFixed(8)} USDT`;
            
            updateAdButtonState();
        }

        // Reklam butonunun durumunu güncelle
        function updateAdButtonState() {
            const now = Date.now();
            const timeSinceLastAd = now - userData.lastAdTime;
            const cooldownMs = AD_COOLDOWN_MINUTES * 60 * 1000;
            
            if (timeSinceLastAd >= cooldownMs) {
                // Reklam izlenebilir
                adButton.classList.remove('disabled');
                adButtonTextSpan.textContent = 'Reklam İzle';
            } else {
                // Soğuma süresi devam ediyor
                adButton.classList.add('disabled');
                const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastAd) / 1000);
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                adButtonTextSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }

        // Çekim talebini işle
        function handleWithdrawRequest() {
            const amount = parseFloat(withdrawAmountInput.value);
            
            if (!userData.usdtAddress) {
                showAlert('Lütfen önce cüzdan adresinizi kaydedin.', 'danger');
                return;
            }
            
            if (isNaN(amount) || amount < 5 || amount > 100) {
                showAlert('Çekim miktarı 5 ile 100 USDT arasında olmalıdır.', 'danger');
                return;
            }
            
            if (amount > userData.usdtBalance) {
                showAlert('Yetersiz bakiye.', 'danger');
                return;
            }
            
            // Yeni çekim talebi oluştur
            const requestId = Date.now().toString();
            const request = {
                id: requestId,
                userId: userData.id,
                userName: `${userData.firstName} ${userData.lastName}`,
                userUsername: userData.username,
                amount: amount,
                address: userData.usdtAddress,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };
            
            // Talebi veriye ekle
            if (!appData.withdrawRequests) {
                appData.withdrawRequests = {};
            }
            appData.withdrawRequests[requestId] = request;
            
            // Bakiyeden düş
            userData.usdtBalance -= amount;
            userData.credits = Math.floor(userData.usdtBalance / CREDIT_TO_USDT_RATE);
            
            // Kaydet ve arayüzü güncelle
            saveAppData();
            updateUI();
            
            // Admin panelini güncelle (eğer açıksa)
            if (adminPage.style.display !== 'none') {
                renderAdminPanel();
            }
            
            // Başarılı bildirim göster
            showAlert(`Çekim talebiniz oluşturuldu: ${amount} USDT`, 'success');
            withdrawAmountInput.value = '';
        }

        // Uyarı göster
        function showAlert(message, type) {
            withdrawAlertDiv.textContent = message;
            withdrawAlertDiv.className = `alert alert-${type}`;
            withdrawAlertDiv.style.display = 'block';
            
            setTimeout(() => {
                withdrawAlertDiv.style.display = 'none';
            }, 5000);
        }

        // Admin panelini render et
        function renderAdminPanel() {
            if (!appData.withdrawRequests || Object.keys(appData.withdrawRequests).length === 0) {
                adminRequestsContainer.innerHTML = '<p>Bekleyen çekim talebi bulunmuyor.</p>';
                return;
            }
            
            let html = '';
            for (const requestId in appData.withdrawRequests) {
                const request = appData.withdrawRequests[requestId];
                
                if (request.status !== 'pending') continue;
                
                const date = new Date(request.timestamp);
                const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                
                html += `
                    <div class="admin-request-card">
                        <div class="card-title">Talep ID: ${requestId}</div>
                        <p><strong>Kullanıcı:</strong> ${request.userName} (@${request.userUsername})</p>
                        <p><strong>Miktar:</strong> ${request.amount} USDT</p>
                        <p><strong>Adres:</strong> ${request.address}</p>
                        <p><strong>Tarih:</strong> ${formattedDate}</p>
                        <div class="d-flex gap-2">
                            <button class="btn btn-success btn-sm" onclick="approveRequest('${requestId}')">Onayla</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteRequest('${requestId}')">Sil</button>
                        </div>
                    </div>
                `;
            }
            
            adminRequestsContainer.innerHTML = html;
        }

        // Talebi sil
        window.deleteRequest = function(requestId) {
            if (confirm('Bu talebi silmek istediğinizden emin misiniz?')) {
                delete appData.withdrawRequests[requestId];
                saveAppData();
                renderAdminPanel();
            }
        }

        // Talebi onayla
        window.approveRequest = function(requestId) {
            if (confirm('Bu talebi onaylamak istediğinizden emin misiniz?')) {
                appData.withdrawRequests[requestId].status = 'approved';
                saveAppData();
                renderAdminPanel();
            }
        }

        // Olay dinleyicileri kur
        function setupEventListeners() {
            // Reklam butonu tıklama
            adButton.addEventListener('click', () => {
                if (!adButton.classList.contains('disabled')) {
                    showNextAd();
                }
            });

            // Navigasyon menüsü
            menuLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Aktif linki güncelle
                    menuLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    
                    // Sayfa göster/gizle
                    const targetPage = link.getAttribute('data-page');
                    document.querySelectorAll('.page-content').forEach(page => {
                        page.style.display = 'none';
                    });
                    document.getElementById(targetPage).style.display = 'block';
                    
                    // Admin paneli ise render et
                    if (targetPage === 'admin-page') {
                        renderAdminPanel();
                    }
                });
            });

            // Cüzdan formu
            walletForm.addEventListener('submit', (e) => {
                e.preventDefault();
                userData.usdtAddress = usdtAddressInput.value;
                saveAppData();
                paymentUsdtAddressSpan.textContent = userData.usdtAddress;
                
                tg.showPopup({
                    title: 'Başarılı!',
                    message: 'Cüzdan adresiniz başarıyla kaydedildi.',
                    buttons: [{ text: 'Tamam' }]
                });
            });

            // Çekim butonu
            withdrawButton.addEventListener('click', handleWithdrawRequest);
        }

    } else {
        // Sayfa normal bir tarayıcıda açıldı.
        // Giriş sayfası zaten görünür olduğu için bir şey yapmaya gerek yok.
        console.log("Running in a standard browser. Showing landing page.");
    }
});
