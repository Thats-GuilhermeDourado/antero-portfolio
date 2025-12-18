// main.js
// Sistema principal do site: simula um ambiente Windows interativo
// Inclui: sons, janelas arrastáveis, desktop, media player e activities.exe

// ===== SOUND SYSTEM =====
class SoundSystem {
    constructor() {
        this.volume = 0.5;
        this.muted = false;
        this.audioContext = null;
        this.sounds = {};
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API não suportada');
        }
    }
    
    playSound(type) {
        if (this.muted) return;
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        switch(type) {
            case 'click':
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                break;
            case 'hover':
                oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
                break;
            case 'startup':
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                break;
            case 'error':
                oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
                break;
            case 'delete':
                oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.4);
                gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
                break;
        }
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    setVolume(value) {
        this.volume = value / 100;
        const icon = document.querySelector('#volumeButton i');
        if (!icon) return;

        if (value === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (value < 50) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }
    
    toggleMute() {
        this.muted = !this.muted;
        const icon = document.querySelector('#volumeButton i');
        if (!icon) return;
        
        if (this.muted) {
            icon.className = 'fas fa-volume-mute';
            icon.style.color = '#ff0066';
        } else {
            icon.className = 'fas fa-volume-up';
            icon.style.color = 'white';
            this.setVolume(document.getElementById('volumeSlider').value);
        }
    }
}

// ===== WINDOW DRAGGING =====
class DraggableWindow {
    constructor(windowElement, titleBarElement) {
        this.window = windowElement;
        this.titleBar = titleBarElement;
        this.isDragging = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;
        
        this.init();
    }

    init() {
        this.titleBar.addEventListener('mousedown', this.startDrag.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.stopDrag.bind(this));
    }
    
    startDrag(e) {
        if (e.button !== 0) return;
        
        const rect = this.window.getBoundingClientRect();
        this.initialX = e.clientX - rect.left;
        this.initialY = e.clientY - rect.top;
    
        if (e.target === this.titleBar || e.target.closest('.window-title-bar, .hero-title-bar, .notepad-header, .skills-header, .video-player-header, .xp-window-header')) {
            this.isDragging = true;
            this.window.style.opacity = '0.9';
            if (window.app && window.app.soundSystem) {
                window.app.soundSystem.playSound('click');
            }
            
            this.window.classList.add('dragging');
            this.bringToFront();
        }
    }
    
    drag(e) {
        if (this.isDragging) {
            e.preventDefault();
            
            this.currentX = e.clientX - this.initialX;
            this.currentY = e.clientY - this.initialY;
            
            this.currentX = Math.max(0, Math.min(this.currentX, window.innerWidth - this.window.offsetWidth));
            this.currentY = Math.max(0, Math.min(this.currentY, window.innerHeight - 100));
            
            this.window.style.position = 'fixed';
            this.window.style.left = this.currentX + 'px';
            this.window.style.top = this.currentY + 'px';
            this.window.style.transform = 'none';
            
            this.window.style.zIndex = '20000';
        }
    }
    
    stopDrag() {
        if (this.isDragging) {
            this.isDragging = false;
            this.window.style.opacity = '1';
            this.window.classList.remove('dragging');
            
            if (this.window.classList.contains('about-popup') || 
                this.window.classList.contains('skills-panel') ||
                this.window.classList.contains('video-player-window') ||
                this.window.classList.contains('xp-window')) {
                this.window.style.left = '50%';
                this.window.style.top = '50%';
                this.window.style.transform = 'translate(-50%, -50%)';
            }
            
            setTimeout(() => {
                if (!this.isDragging) {
                    this.window.style.zIndex = '1000';
                }
            }, 100);
        }
    }
    
    bringToFront() {
        const allWindows = document.querySelectorAll('.about-popup, .skills-panel, .hero-window, .nav-window, .video-player-window, .xp-window');
        let maxZIndex = 1000;
        
        allWindows.forEach(w => {
            const zIndex = parseInt(window.getComputedStyle(w).zIndex) || 1000;
            if (zIndex > maxZIndex) maxZIndex = zIndex;
        });
        
        const newZIndex = maxZIndex + 10;
        this.window.style.zIndex = newZIndex.toString();
    }
}

// ===== DESKTOP MANAGER =====
class DesktopManager {
    constructor() {
        this.desktop = document.getElementById('desktop');
        this.contextMenu = document.getElementById('contextMenu');
        this.selectedIcon = null;
        this.selectedWindow = null;
        this.desktopIcons = [];
        this.init();
    }

    init() {
        this.setupContextMenu();
        this.setupDesktopClick();
        this.setupKeyboardShortcuts();
        this.setupTrashIcon();
    }

    setupContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            const windowElement = e.target.closest('.about-popup, .skills-panel, .hero-window, .nav-window, .video-player-window, .xp-window');
            
            if (windowElement) {
                e.preventDefault();
                this.selectedWindow = windowElement;
                this.showContextMenu(e.clientX, e.clientY, 'window');
                return;
            }
            
            const iconElement = e.target.closest('.desktop-icon');
            if (iconElement) {
                e.preventDefault();
                this.selectedIcon = iconElement;
                this.showContextMenu(e.clientX, e.clientY, 'icon');
                return;
            }
            
            if (e.target === this.desktop || e.target.closest('.desktop')) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY, 'desktop');
            }
        });
        
        document.addEventListener('click', () => {
            if (this.contextMenu) this.contextMenu.style.display = 'none';
        });
        
        if (this.contextMenu) {
            this.contextMenu.addEventListener('click', (e) => {
                const action = e.target.closest('.context-item')?.dataset.action;
                if (action) {
                    this.handleContextAction(action);
                    this.contextMenu.style.display = 'none';
                }
            });
        }
    }
    
    showContextMenu(x, y, type) {
        if (!this.contextMenu) return;
        
        const menuWidth = 220;
        const menuHeight = 150;
        
        if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
        if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;
        
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.style.display = 'block';
        this.contextMenu.style.zIndex = '3000';
        
        const items = this.contextMenu.querySelectorAll('.context-item');
        items.forEach(item => {
            const action = item.dataset.action;
            
            if (type === 'icon') {
                item.style.display = (action === 'refreshDesktop') ? 'flex' : 'none';
            } else if (type === 'window') {
                item.style.display = (action === 'addToDesktop' || action === 'closeWindow') ? 'flex' : 'none';
            } else if (type === 'desktop') {
                item.style.display = (action === 'refreshDesktop') ? 'flex' : 'none';
            }
        });
        
        if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
    }
    
    handleContextAction(action) {
        switch(action) {
            case 'addToDesktop':
                this.addWindowToDesktop(this.selectedWindow);
                break;
            case 'closeWindow':
                this.closeWindow(this.selectedWindow);
                break;
            case 'refreshDesktop':
                this.refreshDesktop();
                break;
        }
    }
    
    setupDesktopClick() {
        this.desktop.addEventListener('click', (e) => {
            if (e.target === this.desktop || !e.target.closest('.desktop-icon')) {
                document.querySelectorAll('.desktop-icon.selected').forEach(icon => {
                    icon.classList.remove('selected');
                });
                this.selectedIcon = null;
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedIcon) {
                e.preventDefault();
                this.deleteSelectedIcon();
            }
            
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.desktop.style.display = this.desktop.style.display === 'none' ? 'flex' : 'none';
            }
        });
    }
    
    setupTrashIcon() {
        const trashIcon = document.getElementById('trashIcon');
        if (!trashIcon) return;
        
        trashIcon.addEventListener('mouseenter', () => {
            if (window.app?.soundSystem) window.app.soundSystem.playSound('hover');
        });
        
        trashIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.selectedIcon) {
                this.deleteSelectedIconWithAnimation();
            } else {
                this.showNotification('Selecione um ícone primeiro!');
                if (window.app?.soundSystem) window.app.soundSystem.playSound('error');
            }
        });
        
        trashIcon.addEventListener('dragover', (e) => {
            e.preventDefault();
            trashIcon.classList.add('drag-over');
        });
        
        trashIcon.addEventListener('dragleave', () => {
            trashIcon.classList.remove('drag-over');
        });
        
        trashIcon.addEventListener('drop', (e) => {
            e.preventDefault();
            trashIcon.classList.remove('drag-over');
            
            const draggedIconId = e.dataTransfer.getData('text/plain');
            if (draggedIconId) {
                const icon = document.querySelector(`[data-id="${draggedIconId}"]`);
                if (icon) {
                    this.selectedIcon = icon;
                    this.deleteSelectedIconWithAnimation();
                }
            }
        });
    }
    
    makeIconDraggable(icon) {
        icon.setAttribute('draggable', 'true');
        icon.dataset.id = icon.dataset.id || `icon_${Date.now()}`;
        
        icon.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', icon.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
            icon.style.opacity = '0.7';
            if (window.app?.soundSystem) window.app.soundSystem.playSound('hover');
        });
        
        icon.addEventListener('dragend', () => {
            icon.style.opacity = '1';
        });
        
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            
            document.querySelectorAll('.desktop-icon.selected').forEach(otherIcon => {
                if (otherIcon !== icon) otherIcon.classList.remove('selected');
            });
            
            icon.classList.add('selected');
            this.selectedIcon = icon;
            
            if (e.detail === 2) {
                const windowId = icon.dataset.windowId;
                if (windowId) {
                    if (windowId === 'xpVideoPlayer' && window.app?.xpMediaPlayer) {
                        window.app.xpMediaPlayer.showVideoPlayer();
                    } else if (windowId === 'aboutPopup' && window.app?.aboutMe) {
                        window.app.aboutMe.showAboutPopup();
                    } else if (windowId === 'skillsPanel' && window.app?.aboutMe) {
                        window.app.aboutMe.showSkillsPanel();
                    } else if (windowId === 'navWindow') {
                        const navWindow = document.getElementById('navWindow');
                        if (navWindow) navWindow.style.display = 'block';
                    } else if (windowId === 'heroWindow') {
                        const heroWindow = document.getElementById('heroWindow');
                        if (heroWindow) heroWindow.style.display = 'block';
                    } else if (windowId === 'activitiesWindow') {
                        if (window.app?.activitiesSystem) {
                            window.app.activitiesSystem.open();
                        }
                    } else if (icon.dataset.context && window.XPImageViewerSystem) {
                        const context = icon.dataset.context;
                        const imageViewer = new XPImageViewerSystem(context);
                        imageViewer.showImageViewer();
                    }
                }
                if (window.app?.soundSystem) window.app.soundSystem.playSound('startup');
            }
        });
        
        icon.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.selectedIcon = icon;
            this.showContextMenu(e.clientX, e.clientY, 'icon');
        });

        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        icon.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            
            const rect = icon.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            initialX = parseFloat(icon.style.left) || rect.left;
            initialY = parseFloat(icon.style.top) || rect.top;
            
            const desktop = document.getElementById('desktop');
            const desktopRect = desktop.getBoundingClientRect();
            
            const moveHandler = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;
                
                if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                    isDragging = true;
                    
                    let newX = initialX + deltaX;
                    let newY = initialY + deltaY;
                    
                    newX = Math.max(10, Math.min(newX, desktopRect.width - 80));
                    newY = Math.max(10, Math.min(newY, desktopRect.height - 80));
                    
                    icon.style.left = newX + 'px';
                    icon.style.top = newY + 'px';
                    icon.style.zIndex = '10000';
                }
            };
            
            const upHandler = () => {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                
                if (isDragging) {
                    isDragging = false;
                    icon.style.zIndex = '10';
                    if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
                }
            };
            
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });
    }
    
    addWindowToDesktop(windowElement) {
        if (!windowElement) return;
        
        const windowId = windowElement.id;
        if (!windowId) return;
        
        let title = '';
        let iconSrc = '';
        let iconPath = 'assets/';
    
        if (windowId === 'xpVideoPlayer' || windowId.includes('video')) {
            title = 'Windows Media Player';
            iconSrc = iconPath + 'video.ico';
        } else if (windowId === 'aboutPopup') {
            title = 'About Me.txt';
            iconSrc = iconPath + 'folder.ico';
        } else if (windowId === 'skillsPanel') {
            title = 'Skills Config';
            iconSrc = iconPath + 'gear.ico';
        } else if (windowId === 'navWindow') {
            title = 'Navigation.exe';
            iconSrc = iconPath + 'navigation.ico';
        } else if (windowId === 'heroWindow') {
            title = 'Portfolio.exe';
            iconSrc = iconPath + 'portfolio.ico';
        } else if (windowId === 'activitiesWindow') {
            title = 'activities.exe';
            iconSrc = iconPath + 'activities.ico';
        } else {
            return;
        }
        
        // VERIFICAÇÃO: Ver se já existe um ícone com este windowId
        const existingIcon = this.desktopIcons.find(icon => 
            icon.windowId === windowId || icon.name === title
        );
        
        if (existingIcon) {
            this.showNotification(`${title} is already on the desktop! 🖥️`);
            return;
        }
        
        // Verificar também no DOM
        const existingDomIcon = document.querySelector(`[data-window-id="${windowId}"]`);
        if (existingDomIcon) {
            this.showNotification(`${title} is already on the desktop! 🖥️`);
            return;
        }
        
        // Criar ícone
        const iconId = `desktop_icon_${windowId}_${Date.now()}`;
        const desktop = document.getElementById('desktop');
        
        const icon = document.createElement('div');
        icon.className = 'desktop-icon app-icon';
        icon.dataset.id = iconId;
        icon.dataset.name = title;
        icon.dataset.windowId = windowId;
        icon.dataset.type = windowId;
        
        // Posição aleatória
        const desktopRect = desktop.getBoundingClientRect();
        const x = 20 + Math.random() * (desktopRect.width - 180);
        const y = 20 + Math.random() * (desktopRect.height - 140);
        
        icon.style.left = `${x}px`;
        icon.style.top = `${y}px`;
        
        // Usar imagem do ícone real
        icon.innerHTML = `
            <div class="icon-image">
                <img src="${iconSrc}" alt="${title}" style="width: 48px; height: 48px;">
            </div>
            <div class="icon-label">${title}</div>
        `;
        
        // Eventos
        icon.addEventListener('dblclick', () => {
            if (windowId === 'xpVideoPlayer' && window.app?.xpMediaPlayer) {
                window.app.xpMediaPlayer.showVideoPlayer();
            } else if (windowId === 'aboutPopup' && window.app?.aboutMe) {
                window.app.aboutMe.showAboutPopup();
            } else if (windowId === 'skillsPanel' && window.app?.aboutMe) {
                window.app.aboutMe.showSkillsPanel();
            } else if (windowId === 'navWindow') {
                const navWindow = document.getElementById('navWindow');
                if (navWindow) navWindow.style.display = 'block';
            } else if (windowId === 'heroWindow') {
                const heroWindow = document.getElementById('heroWindow');
                if (heroWindow) heroWindow.style.display = 'block';
            } else if (windowId === 'activitiesWindow') {
                if (window.app?.activitiesSystem) {
                    window.app.activitiesSystem.open();
                }
            }
            
            if (window.app?.soundSystem) window.app.soundSystem.playSound('startup');
        });
        
        // Context menu
        icon.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.selectedIcon = icon;
            this.showContextMenu(e.clientX, e.clientY, 'icon');
        });
        
        // Tornar arrastável
        this.makeIconDraggable(icon);
        
        // Adicionar ao desktop
        desktop.appendChild(icon);
        
        // Adicionar à lista
        this.desktopIcons.push({
            id: iconId,
            element: icon,
            name: title,
            type: windowId,
            windowId: windowId
        });
        
        // Som de confirmação
        if (window.app?.soundSystem) {
            window.app.soundSystem.playSound('startup');
        }
        
        this.showNotification(`${title} adicionado à área de trabalho!`);
    }
    
    closeWindow(windowElement) {
        if (!windowElement) return;
        
        if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
        
        const windowId = windowElement.id;
        
        if (windowId === 'aboutPopup') {
            const overlay = document.getElementById('aboutOverlay');
            if (overlay) overlay.style.display = 'none';
            windowElement.style.display = 'none';
        } else if (windowId === 'skillsPanel') {
            const overlay = document.getElementById('skillsOverlay');
            if (overlay) overlay.style.display = 'none';
            windowElement.style.display = 'none';
        } else if (windowId === 'xpVideoPlayer') {
            const overlay = document.querySelector('.video-player-overlay');
            if (overlay) overlay.remove();
        } else if (windowId === 'activitiesWindow') {
            const overlay = document.getElementById('activitiesOverlay');
            if (overlay) overlay.style.display = 'none';
            windowElement.style.display = 'none';
        } else {
            windowElement.style.display = 'none';
        }
    }
    
    deleteSelectedIconWithAnimation() {
        if (!this.selectedIcon) return;
        
        const iconId = this.selectedIcon.dataset.id;
        const iconName = this.selectedIcon.dataset.name || 'Ícone';
        
        // Adiciona animação de exclusão
        this.selectedIcon.classList.add('icon-deleting');
        
        // Som de exclusão
        if (window.app?.soundSystem) {
            window.app.soundSystem.playSound('click');
            setTimeout(() => {
                window.app.soundSystem.playSound('delete');
            }, 300);
        }
        
        // Remove após animação
        setTimeout(() => {
            this.desktopIcons = this.desktopIcons.filter(icon => icon.id !== iconId);
            this.selectedIcon.remove();
            this.selectedIcon = null;
            
            this.showNotification(`${iconName} excluído! 🗑️`);
        }, 800);
    }
    
    deleteSelectedIcon() {
        this.deleteSelectedIconWithAnimation();
    }
    
    refreshDesktop() {
        const iconWidth = 80;
        const iconHeight = 70;
        const iconsPerRow = Math.floor(this.desktop.clientWidth / (iconWidth + 20));
        
        this.desktopIcons.forEach((iconData, index) => {
            const row = Math.floor(index / iconsPerRow);
            const col = index % iconsPerRow;
            
            const x = 20 + col * (iconWidth + 20);
            const y = 20 + row * (iconHeight + 20);
            
            iconData.element.style.left = x + 'px';
            iconData.element.style.top = y + 'px';
        });
        
        this.showNotification('Desktop reorganizado!');
        
        if (window.app?.soundSystem) window.app.soundSystem.playSound('startup');
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-info-circle" style="color: #4a90e2;"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// ===== MEDIA PLAYER SYSTEM =====
class XPMediaPlayerSystem {
    constructor() {
        this.currentVideo = null;
        this.videoElement = null;
        this.isPlaying = false;
        this.playlist = [
            { 
                title: "Curta Anjo", 
                src: "videos/curta anjo.mp4",
                type: "video/mp4" 
            },
            { 
                title: "Eramos Livres", 
                src: "videos/EramosLivres_CurtaMetragem.mp4",
                type: "video/mp4" 
            }
        ];
        this.currentTrack = 0;
        this.init();
    }
    
    init() {
        this.setupVideoNav();
    }
    
    setupVideoNav() {
        const videoNav = document.getElementById('videoNav');
        if (videoNav) {
            videoNav.addEventListener('click', (e) => {
                e.preventDefault();
                this.showVideoPlayer();
            });
        }
    }
    
    showVideoPlayer() {
        this.createVideoPlayerOverlay();
        
        if (window.app?.soundSystem) {
            window.app.soundSystem.playSound('startup');
        }
    }
    
    createVideoPlayerOverlay() {
        const oldOverlay = document.querySelector('.video-player-overlay');
        if (oldOverlay) oldOverlay.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'video-player-overlay';
        overlay.style.display = 'flex';
        overlay.style.zIndex = '2000';
        
        overlay.innerHTML = `
            <div class="video-player-window" id="xpVideoPlayer">
                <div class="video-player-header" id="xpVideoPlayerHeader">
                    <div class="video-player-title">
                        <i class="fas fa-play-circle"></i>
                        Windows Media Player
                    </div>
                    <div class="video-player-controls">
                        <div class="video-player-btn" id="xpMinBtn">_</div>
                        <div class="video-player-btn" id="xpMaxBtn">□</div>
                        <div class="video-player-btn" id="xpCloseBtn">×</div>
                    </div>
                </div>
                <div class="video-player-body">
                    <div class="video-container">
                        <video id="xpRealVideo" style="width:100%; height:100%; background:#000;">
                            Seu navegador não suporta vídeo HTML5.
                        </video>
                    </div>
                    
                    <div class="video-controls">
                        <button class="video-control-btn" id="xpPlayBtn" title="Play">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="video-control-btn" id="xpPauseBtn" title="Pause">
                            <i class="fas fa-pause"></i>
                        </button>
                        <button class="video-control-btn" id="xpStopBtn" title="Stop">
                            <i class="fas fa-stop"></i>
                        </button>
                        <input type="range" class="video-seek-bar" id="xpSeekBar" min="0" max="100" value="0" title="Seek">
                        <div class="time-display" id="xpTimeDisplay">00:00 / 00:00</div>
                        <button class="video-control-btn" id="xpVolumeBtn" title="Volume">
                            <i class="fas fa-volume-up"></i>
                        </button>
                        <input type="range" class="video-volume-bar" id="xpVolumeBar" min="0" max="100" value="80" title="Volume">
                        <button class="video-control-btn fullscreen-btn" id="xpFullscreenBtn" title="Fullscreen">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                    
                    <div class="video-playlist">
                        <div class="playlist-title">
                            <i class="fas fa-list"></i> Playlist
                        </div>
                        <div class="playlist-items" id="xpPlaylistItems">
                            ${this.playlist.map((item, index) => `
                                <div class="playlist-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                                    <i class="fas fa-file-video"></i> ${item.title}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        this.setupXPPlayerControls();
        
        const playerWindow = document.getElementById('xpVideoPlayer');
        const playerHeader = document.getElementById('xpVideoPlayerHeader');
        if (playerWindow && playerHeader) {
            new DraggableWindow(playerWindow, playerHeader);
        }
        
        this.loadVideo(0);
    }
    
    setupXPPlayerControls() {
        const videoElement = document.getElementById('xpRealVideo');
        const playBtn = document.getElementById('xpPlayBtn');
        const pauseBtn = document.getElementById('xpPauseBtn');
        const stopBtn = document.getElementById('xpStopBtn');
        const seekBar = document.getElementById('xpSeekBar');
        const volumeBar = document.getElementById('xpVolumeBar');
        const volumeBtn = document.getElementById('xpVolumeBtn');
        const fullscreenBtn = document.getElementById('xpFullscreenBtn');
        const closeBtn = document.getElementById('xpCloseBtn');
        const minBtn = document.getElementById('xpMinBtn');
        const maxBtn = document.getElementById('xpMaxBtn');
        const timeDisplay = document.getElementById('xpTimeDisplay');
        const playlistItems = document.querySelectorAll('.playlist-item');
        
        this.videoElement = videoElement;
        
        if (videoElement) {
            videoElement.controls = false;
            videoElement.preload = "metadata";
            
            videoElement.addEventListener('timeupdate', () => {
                if (videoElement.duration) {
                    const progress = (videoElement.currentTime / videoElement.duration) * 100;
                    if (seekBar) seekBar.value = progress;
                    
                    if (timeDisplay) {
                        const currentTime = this.formatTime(videoElement.currentTime);
                        const duration = this.formatTime(videoElement.duration);
                        timeDisplay.textContent = `${currentTime} / ${duration}`;
                    }
                }
            });
            
            videoElement.addEventListener('ended', () => {
                this.isPlaying = false;
                if (playBtn) playBtn.style.display = 'flex';
                if (pauseBtn) pauseBtn.style.display = 'none';
            });
            
            videoElement.addEventListener('loadedmetadata', () => {
                if (timeDisplay) {
                    const duration = this.formatTime(videoElement.duration);
                    timeDisplay.textContent = `00:00 / ${duration}`;
                }
            });
        }
        
        if (playBtn && videoElement) {
            playBtn.addEventListener('click', () => {
                videoElement.play();
                this.isPlaying = true;
                playBtn.style.display = 'none';
                pauseBtn.style.display = 'flex';
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
        
        if (pauseBtn && videoElement) {
            pauseBtn.style.display = 'none';
            pauseBtn.addEventListener('click', () => {
                videoElement.pause();
                this.isPlaying = false;
                playBtn.style.display = 'flex';
                pauseBtn.style.display = 'none';
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
        
        if (stopBtn && videoElement) {
            stopBtn.addEventListener('click', () => {
                videoElement.pause();
                videoElement.currentTime = 0;
                this.isPlaying = false;
                playBtn.style.display = 'flex';
                pauseBtn.style.display = 'none';
                if (seekBar) seekBar.value = 0;
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
        
        if (seekBar && videoElement) {
            seekBar.addEventListener('input', (e) => {
                if (videoElement.duration) {
                    const time = (seekBar.value / 100) * videoElement.duration;
                    videoElement.currentTime = time;
                }
            });
            
            seekBar.addEventListener('change', () => {
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
        
        if (volumeBar && videoElement) {
            volumeBar.addEventListener('input', () => {
                videoElement.volume = volumeBar.value / 100;
                if (window.app?.soundSystem) {
                    window.app.soundSystem.setVolume(volumeBar.value);
                }
            });
        }
        
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => {
                if (window.app?.soundSystem) {
                    window.app.soundSystem.toggleMute();
                    if (window.app.soundSystem.muted) {
                        videoElement.volume = 0;
                        volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                    } else {
                        videoElement.volume = volumeBar.value / 100;
                        volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                    }
                    window.app.soundSystem.playSound('click');
                }
            });
        }
        
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        playlistItems.forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.getAttribute('data-index'));
                this.loadVideo(index);
                
                playlistItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        });
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const overlay = document.querySelector('.video-player-overlay');
                if (overlay) overlay.remove();
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
        
        if (minBtn) {
            minBtn.addEventListener('click', () => {
                const player = document.getElementById('xpVideoPlayer');
                if (player) {
                    player.style.display = 'none';
                    setTimeout(() => {
                        player.style.display = 'flex';
                    }, 1000);
                }
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
        
        if (maxBtn) {
            maxBtn.addEventListener('click', () => {
                const player = document.getElementById('xpVideoPlayer');
                if (player) {
                    player.classList.toggle('maximized');
                    if (player.classList.contains('maximized')) {
                        player.style.width = '90%';
                        player.style.height = '90vh';
                        maxBtn.innerHTML = '❐';
                    } else {
                        player.style.width = '800px';
                        player.style.height = '600px';
                        maxBtn.innerHTML = '□';
                    }
                }
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
    }
    
    loadVideo(index) {
        if (index >= 0 && index < this.playlist.length) {
            const video = this.playlist[index];
            this.currentTrack = index;
            this.isPlaying = false;
            
            const titleElement = document.querySelector('.video-player-title');
            if (titleElement) {
                titleElement.innerHTML = `<i class="fas fa-play-circle"></i> ${video.title} - Windows Media Player`;
            }
            
            const videoElement = document.getElementById('xpRealVideo');
            if (videoElement) {
                videoElement.pause();
                videoElement.src = video.src;
                videoElement.type = video.type;
                
                const playBtn = document.getElementById('xpPlayBtn');
                const pauseBtn = document.getElementById('xpPauseBtn');
                const seekBar = document.getElementById('xpSeekBar');
                
                if (playBtn) playBtn.style.display = 'flex';
                if (pauseBtn) pauseBtn.style.display = 'none';
                if (seekBar) seekBar.value = 0;
                
                videoElement.load();
                
                videoElement.addEventListener('error', (e) => {
                    const timeDisplay = document.getElementById('xpTimeDisplay');
                    if (timeDisplay) {
                        timeDisplay.textContent = "Erro ao carregar vídeo";
                        timeDisplay.style.color = "#ff0000";
                    }
                });
            }
        }
    }
    
    toggleFullscreen() {
        const videoPlayer = document.getElementById('xpVideoPlayer');
        const videoElement = document.getElementById('xpRealVideo');
        
        if (!document.fullscreenElement) {
            if (videoPlayer.requestFullscreen) {
                videoPlayer.requestFullscreen();
            } else if (videoPlayer.webkitRequestFullscreen) {
                videoPlayer.webkitRequestFullscreen();
            } else if (videoPlayer.msRequestFullscreen) {
                videoPlayer.msRequestFullscreen();
            }
            
            if (videoElement) {
                videoElement.style.height = 'calc(100% - 120px)';
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            if (videoElement) {
                videoElement.style.height = '400px';
            }
        }
        
        if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return "00:00";
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    hideVideoPlayer() {
        const overlay = document.querySelector('.video-player-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// ===== ACTIVITIES SYSTEM =====
class ActivitiesSystem {
    constructor() {
        this.window = document.getElementById('activitiesWindow');
        this.overlay = document.getElementById('activitiesOverlay');
        this.header = document.getElementById('activitiesHeader');
        this.isOpen = false;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupDraggable();
        this.setupNavigation();
        
        if (this.window) {
            this.window.style.display = 'none';
        }
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
        
        this.setupProjectsNav();
    }
    
    setupEventListeners() {
        const closeBtn = document.getElementById('activitiesCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        const minBtn = document.getElementById('activitiesMinBtn');
        if (minBtn) {
            minBtn.addEventListener('click', () => {
                if (window.app?.soundSystem) {
                    window.app.soundSystem.playSound('click');
                }
                this.window.style.display = 'none';
                setTimeout(() => {
                    this.window.style.display = 'block';
                }, 1000);
            });
        }
        
        const maxBtn = document.getElementById('activitiesMaxBtn');
        if (maxBtn) {
            maxBtn.addEventListener('click', () => {
                if (window.app?.soundSystem) {
                    window.app.soundSystem.playSound('click');
                }
                
                if (this.window.classList.contains('maximized')) {
                    this.window.classList.remove('maximized');
                    this.window.style.width = '720px';
                    this.window.style.height = '520px';
                    this.window.style.top = '50%';
                    this.window.style.left = '50%';
                    this.window.style.transform = 'translate(-50%, -50%)';
                    maxBtn.innerHTML = '□';
                } else {
                    this.window.classList.add('maximized');
                    this.window.style.width = '95%';
                    this.window.style.height = '90vh';
                    this.window.style.top = '50%';
                    this.window.style.left = '50%';
                    this.window.style.transform = 'translate(-50%, -50%)';
                    maxBtn.innerHTML = '❐';
                }
            });
        }
        
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    setupDraggable() {
        if (!this.window || !this.header) return;
        
        new DraggableWindow(this.window, this.header);
    }
    
    setupProjectsNav() {
        const projectsNav = document.getElementById('projectsNav');
        if (projectsNav) {
            projectsNav.onclick = null;
            
            projectsNav.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.open();
            });
        }
    }
    
    setupNavigation() {
        const folderLinks = document.querySelectorAll('.xp-folder-link');
        folderLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const folder = link.dataset.folder;
                this.openFolder(folder);
                
                if (window.app?.soundSystem) {
                    window.app.soundSystem.playSound('click');
                }
            });
        });
        
        const backLinks = document.querySelectorAll('.xp-back-link');
        backLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDirectory();
                
                if (window.app?.soundSystem) {
                    window.app.soundSystem.playSound('click');
                }
            });
        });
    }
    
    open() {
        if (this.window && this.overlay) {
            this.window.style.animation = 'none';
            this.window.style.display = 'block';
            this.overlay.style.display = 'block';
            this.isOpen = true;
            
            if (!this.window.classList.contains('maximized')) {
                this.window.style.width = '720px';
                this.window.style.height = '520px';
                this.window.style.left = '50%';
                this.window.style.top = '50%';
                this.window.style.transform = 'translate(-50%, -50%)';
            }
            
            this.window.style.zIndex = '1005';
            this.overlay.style.zIndex = '1004';
            
            this.showDirectory();
            
            if (window.app?.soundSystem) {
                window.app.soundSystem.playSound('click');
            }
        }
    }
    
    close() {
        if (this.window && this.overlay) {
            if (window.app?.soundSystem) {
                window.app.soundSystem.playSound('click');
            }
            
            this.window.style.display = 'none';
            this.overlay.style.display = 'none';
            this.isOpen = false;
        }
    }
    
    openFolder(folderName) {
        document.querySelectorAll('.xp-content-section').forEach(section => {
            section.style.display = 'none';
        });
        
        const folderSection = document.getElementById(`${folderName}Section`);
        if (folderSection) {
            folderSection.style.display = 'block';
        }
        
        const directoryView = document.querySelector('.xp-directory > fieldset:first-of-type');
        if (directoryView) {
            directoryView.style.display = 'none';
        }
        
        const statusBar = document.querySelector('.xp-window-statusbar span:first-child');
        if (statusBar) {
            statusBar.textContent = `${folderName.charAt(0).toUpperCase() + folderName.slice(1)} folder`;
        }
    }
    
    showDirectory() {
        const directoryView = document.querySelector('.xp-directory > fieldset:first-of-type');
        if (directoryView) {
            directoryView.style.display = 'block';
        }
        
        document.querySelectorAll('.xp-content-section').forEach(section => {
            section.style.display = 'none';
        });
        
        const statusBar = document.querySelector('.xp-window-statusbar span:first-child');
        if (statusBar) {
            statusBar.textContent = '4 items';
        }
    }
}

// ===== ABOUT ME SYSTEM =====
class AboutMeSystem {
    constructor() {
        this.skillsPanel = null;
        this.init();
    }
    
    init() {
        this.setupAboutMeClick();
        this.setupPopupControls();
        this.setupEmailCopy();
        this.setupPortraitClick();
        this.setupSocialButtons();
        this.setupSkillsPanel();
    }
    
    setupAboutMeClick() {
        const aboutNav = document.getElementById('aboutNav');
        if (aboutNav) {
            aboutNav.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
                this.showAboutPopup();
            });
        }
    }
    
    showAboutPopup() {
        const popup = document.getElementById('aboutPopup');
        const overlay = document.getElementById('aboutOverlay');
        
        if (popup && overlay) {
            this.loadPortraitImage();
            
            popup.style.display = 'block';
            overlay.style.display = 'block';
            
            popup.style.zIndex = '1003';
            overlay.style.zIndex = '1002';
            
            popup.style.animation = 'none';
            setTimeout(() => {
                popup.style.animation = 'popupAppear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }, 10);
            
            if (window.app?.soundSystem) window.app.soundSystem.playSound('startup');
            
            const header = document.querySelector('.notepad-header');
            if (header && popup) {
                new DraggableWindow(popup, header);
            }
        }
    }
    
    loadPortraitImage() {
        const portraitImg = document.getElementById('portraitImage');
        const placeholder = document.getElementById('portraitPlaceholder');
        
        if (portraitImg) {
            const testImage = new Image();
            testImage.onload = () => {
                portraitImg.style.display = 'block';
                if (placeholder) placeholder.style.display = 'none';
            };
            testImage.onerror = () => {
                portraitImg.style.display = 'none';
                if (placeholder) placeholder.style.display = 'flex';
            };
            testImage.src = portraitImg.src;
        }
    }
    
    setupPopupControls() {
        const closeBtn = document.getElementById('aboutCloseBtn');
        const overlay = document.getElementById('aboutOverlay');
        const popup = document.getElementById('aboutPopup');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideAboutPopup();
            });
        }
        
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.hideAboutPopup();
            });
        }
        
        const minBtn = document.getElementById('aboutMinBtn');
        if (minBtn) {
            minBtn.addEventListener('click', () => {
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
                popup.style.transform = 'translate(-50%, -50%) scale(0.01)';
                popup.style.opacity = '0';
                setTimeout(() => {
                    this.hideAboutPopup();
                }, 300);
            });
        }
        
        const maxBtn = document.getElementById('aboutMaxBtn');
        if (maxBtn) {
            maxBtn.addEventListener('click', () => {
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
                
                if (popup.classList.contains('maximized')) {
                    popup.classList.remove('maximized');
                    popup.style.width = '600px';
                    popup.style.height = '';
                    popup.style.maxHeight = '80vh';
                } else {
                    popup.classList.add('maximized');
                    popup.style.width = '90%';
                    popup.style.maxHeight = '90vh';
                }
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && popup && popup.style.display === 'block') {
                this.hideAboutPopup();
            }
        });
    }
    
    hideAboutPopup() {
        const popup = document.getElementById('aboutPopup');
        const overlay = document.getElementById('aboutOverlay');
        
        if (popup && overlay) {
            if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            
            popup.style.animation = 'none';
            popup.style.transform = 'translate(-50%, -50%) scale(0.8)';
            popup.style.opacity = '0';
            
            setTimeout(() => {
                popup.style.display = 'none';
                overlay.style.display = 'none';
                popup.style.transform = '';
                popup.style.opacity = '';
                popup.style.animation = '';
            }, 300);
        }
    }
    
    setupEmailCopy() {
        const copyBtn = document.getElementById('copyTextBtn');
        const copyEmailBtn = document.getElementById('copyEmailBtn');
        const emailText = document.getElementById('emailText');
        
        const copyEmail = () => {
            if (!emailText) return;
            
            const email = emailText.textContent;
            
            navigator.clipboard.writeText(email).then(() => {
                if (copyBtn) {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = 'Copied!';
                    copyBtn.classList.add('copied');
                    
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }
                
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
                this.showNotification('Email copied to clipboard! ✨');
                
            }).catch(err => {
                const textArea = document.createElement('textarea');
                textArea.value = email;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (copyBtn) {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = 'Copied!';
                    copyBtn.classList.add('copied');
                    
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }
                
                this.showNotification('Email copied! 📧');
            });
        };
        
        if (copyBtn) copyBtn.addEventListener('click', copyEmail);
        if (copyEmailBtn) copyEmailBtn.addEventListener('click', copyEmail);
    }
    
    setupPortraitClick() {
        const portraitContainer = document.querySelector('.about-portrait');
        if (portraitContainer) {
            portraitContainer.addEventListener('click', () => {
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
                
                portraitContainer.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    portraitContainer.style.transform = '';
                }, 200);
                
                this.showPortraitModal();
            });
        }
    }
    
    showPortraitModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        `;
        
        const img = document.createElement('img');
        img.src = 'assets/portrait.jpg';
        img.alt = 'Antero Rodrigo - Portrait';
        img.style.cssText = `
            max-width: 80%;
            max-height: 80%;
            border: 3px solid #ff69b4;
            box-shadow: 0 0 30px rgba(255,105,180,0.5);
        `;
        
        modal.appendChild(img);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', () => {
            if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            document.body.removeChild(modal);
        });
        
        const closeModal = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', closeModal);
            }
        };
        document.addEventListener('keydown', closeModal);
    }
    
    setupSocialButtons() {
        const fakeButtons = ['fakeTwitterBtn', 'fakeBehanceBtn'];
        
        fakeButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
                    
                    btn.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        btn.style.transform = '';
                    }, 200);
                    
                    const messages = [
                        "Coming soon! 🚀",
                        "Under construction! 🛠️",
                        "Launching in Q4 2024! 📅",
                        "This feature is baking! 🍰"
                    ];
                    
                    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
                    this.showNotification(randomMsg);
                });
            }
        });
    }
    
    setupSkillsPanel() {
        const openBtn = document.getElementById('openSkillsPanel');
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                this.showSkillsPanel();
            });
        }
        
        if (!document.getElementById('skillsPanel')) {
            this.createSkillsPanel();
        }
    }
    
    createSkillsPanel() {
        const overlay = document.createElement('div');
        overlay.className = 'skills-panel-overlay';
        overlay.id = 'skillsOverlay';
        overlay.style.display = 'none';
        overlay.style.zIndex = '1004';
        
        const panel = document.createElement('div');
        panel.className = 'skills-panel';
        panel.id = 'skillsPanel';
        panel.style.display = 'none';
        panel.style.zIndex = '1005';
        
        panel.innerHTML = `
            <div class="skills-header" id="skillsHeader">
                <div>
                    <i class="fas fa-cogs"></i>
                    Creative Skills Configuration
                </div>
                <div class="skills-controls">
                    <div class="skills-btn" id="skillsMinBtn">
                        <i class="fas fa-window-minimize"></i>
                    </div>
                    <div class="skills-btn" id="skillsCloseBtn">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
            </div>
            
            <div class="skills-menu">
                <div class="skills-menu-item">File</div>
                <div class="skills-menu-item">Edit</div>
                <div class="skills-menu-item">View</div>
                <div class="skills-menu-item">Tools</div>
                <div class="skills-menu-item">Help</div>
            </div>
            
            <div class="skills-content">
                <div class="skills-category">
                    <div class="skills-category-title">
                        <i class="fab fa-adobe"></i>
                        Adobe Creative Suite
                    </div>
                    <div class="skills-grid">
                        <div class="skill-item" data-skill="photoshop">
                            <div class="skill-icon">
                                <i class="fas fa-paint-brush"></i>
                            </div>
                            <div class="skill-name">Photoshop</div>
                            <div class="skill-level">
                                <div class="skill-level-fill" style="width: 90%"></div>
                            </div>
                        </div>
                        
                        <div class="skill-item" data-skill="after-effects">
                            <div class="skill-icon">
                                <i class="fas fa-film"></i>
                            </div>
                            <div class="skill-name">After Effects</div>
                            <div class="skill-level">
                                <div class="skill-level-fill" style="width: 85%"></div>
                            </div>
                        </div>
                        
                        <div class="skill-item" data-skill="premiere">
                            <div class="skill-icon">
                                <i class="fas fa-video"></i>
                            </div>
                            <div class="skill-name">Premiere Pro</div>
                            <div class="skill-level">
                                <div class="skill-level-fill" style="width: 88%"></div>
                            </div>
                        </div>
                        
                        <div class="skill-item" data-skill="illustrator">
                            <div class="skill-icon">
                                <i class="fas fa-pen-nib"></i>
                            </div>
                            <div class="skill-name">Illustrator</div>
                            <div class="skill-level">
                                <div class="skill-level-fill" style="width: 80%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="skills-category">
                    <div class="skills-category-title">
                        <i class="fas fa-camera"></i>
                        Photography & Video
                    </div>
                    <div class="skills-grid">
                        <div class="skill-item">
                            <div class="skill-icon">
                                <i class="fas fa-lightbulb"></i>
                            </div>
                            <div class="skill-name">Lighting</div>
                            <div class="skill-level">
                                <div class="skill-level-fill" style="width: 92%"></div>
                            </div>
                        </div>
                        
                        <div class="skill-item">
                            <div class="skill-icon">
                                <i class="fas fa-palette"></i>
                            </div>
                            <div class="skill-name">Color Grading</div>
                            <div class="skill-level">
                                <div class="skill-level-fill" style="width: 87%"></div>
                            </div>
                        </div>
                        
                        <div class="skill-item">
                            <div class="skill-icon">
                                <i class="fas fa-edit"></i>
                            </div>
                            <div class="skill-name">Photo Editing</div>
                            <div class="skill-level">
                                <div class="skill-level-fill" style="width: 95%"></div>
                            </div>
                        </div>
                        
                        <div class="skill-item">
                            <div class="skill-icon">
                                <i class="fas fa-music"></i>
                            </div>
                            <div class="skill-name">Sound Design</div>
                            <div class="skill-level">
                                <div class="skill-level-fill" style="width: 75%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="skills-status-bar">
                <span>12 skills configured</span>
                <span>Ready</span>
            </div>
        `;
        
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        
        const skillsHeader = document.getElementById('skillsHeader');
        if (skillsHeader && panel) {
            new DraggableWindow(panel, skillsHeader);
        }
        
        const skillsCloseBtn = document.getElementById('skillsCloseBtn');
        if (skillsCloseBtn) {
            skillsCloseBtn.addEventListener('click', () => {
                this.hideSkillsPanel();
            });
        }
        
        const skillsMinBtn = document.getElementById('skillsMinBtn');
        if (skillsMinBtn) {
            skillsMinBtn.addEventListener('click', () => {
                this.minimizeSkillsPanel();
            });
        }
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideSkillsPanel();
            }
        });
    }
    
    showSkillsPanel() {
        const overlay = document.getElementById('skillsOverlay');
        const panel = document.getElementById('skillsPanel');
        
        if (overlay && panel) {
            this.hideAboutPopup();
            
            overlay.style.display = 'flex';
            panel.style.display = 'block';
            
            overlay.style.zIndex = '1004';
            panel.style.zIndex = '1005';
            
            if (window.app?.soundSystem) window.app.soundSystem.playSound('startup');
            
            panel.style.left = '50%';
            panel.style.top = '50%';
            panel.style.transform = 'translate(-50%, -50%)';
        }
    }
    
    hideSkillsPanel() {
        const overlay = document.getElementById('skillsOverlay');
        const panel = document.getElementById('skillsPanel');
        
        if (overlay && panel) {
            if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            
            panel.style.transform = 'translate(-50%, -50%) scale(0.8)';
            panel.style.opacity = '0';
            
            setTimeout(() => {
                overlay.style.display = 'none';
                panel.style.display = 'none';
                panel.style.transform = '';
                panel.style.opacity = '';
            }, 300);
        }
    }
    
    minimizeSkillsPanel() {
        const panel = document.getElementById('skillsPanel');
        if (panel) {
            panel.style.transform = 'translate(-50%, -50%) scale(0.01)';
            panel.style.opacity = '0';
            setTimeout(() => {
                this.hideSkillsPanel();
                this.showNotification('Skills panel minimized');
            }, 300);
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-info-circle" style="color: #4a90e2;"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// ===== IMAGE VIEWER SYSTEM =====
class XPImageViewerSystem {
    constructor(context = 'moodboards') {
        this.context = context;
        this.currentImageIndex = 0;
        this.images = [];
        this.viewerWindow = null;
        this.imageElement = null;
        this.isFullscreen = false;
        
        this.configs = {
            'moodboards': {
                title: 'Moodboards Viewer',
                icon: 'assets/moodboard.ico',
                defaultImages: [
                    { src: 'images/moodboards/surfs.jpg', title: 'Color Palettes' },
                    { src: 'images/moodboards/sweet summer.jpg', title: 'Visual References' }
                ],
                canSetWallpaper: false
            },
            'styling': {
                title: 'Styling Viewer',
                icon: 'assets/styling.ico',
                defaultImages: [
                    { src: 'images/styling/wardrobe.jpg', title: 'Wardrobe Collection' },
                    { src: 'images/styling/props.jpg', title: 'Prop Coordination' }
                ],
                canSetWallpaper: false
            },
            'stage': {
                title: 'Stage Setup Viewer',
                icon: 'assets/stage.ico',
                defaultImages: [
                    { src: 'images/stage/layout.jpg', title: 'Stage Layout' },
                    { src: 'images/stage/lighting.jpg', title: 'Lighting Setup' }
                ],
                canSetWallpaper: false
            },
            'editing': {
                title: 'Editing Suite Viewer',
                icon: 'assets/editing.ico',
                defaultImages: [
                    { src: 'images/editing/kiikii.jpg', title: 'Editing Timeline' },
                    { src: 'images/editing/ocean.jpg', title: 'Color Grading' }
                ],
                canSetWallpaper: false
            },
            'photography': {
                title: 'Photography Viewer',
                icon: 'assets/photography.ico',
                defaultImages: [
                    { src: 'images/photography/drinks.jpg', title: 'Portrait Photography' },
                    { src: 'images/photography/praia.jpg', title: 'Landscape Shot' }
                ],
                canSetWallpaper: true
            }
        };
        
        this.loadDefaultImages();
    }

    createContextMenuIfNeeded() {
        if (document.getElementById('xpImageContextMenu')) return;
        
        const config = this.configs[this.context] || this.configs['moodboards'];
        
        if (config.canSetWallpaper) {
            const menu = document.createElement('div');
            menu.id = 'xpImageContextMenu';
            menu.className = 'xp-context-menu';
            menu.style.cssText = `
                position: fixed;
                background: white;
                border: 2px solid black;
                box-shadow: 4px 4px 0 rgba(0,0,0,0.5);
                z-index: 99999;
                display: none;
                min-width: 200px;
                font-family: 'VT323', monospace;
                font-size: 16px;
                padding: 5px;
            `;
            
            menu.innerHTML = `
                <div class="xp-context-item" data-action="setWallpaper" style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #eee;">
                    🖼️ Set as Desktop Wallpaper
                </div>
                <div class="xp-context-item" data-action="saveImage" style="padding: 10px 15px; cursor: pointer;">
                    💾 Save Image As...
                </div>
            `;
            
            document.body.appendChild(menu);
            console.log('✅ Menu do image viewer CRIADO dinamicamente');
        }
    }
    
    loadDefaultImages() {
        const config = this.configs[this.context] || this.configs['moodboards'];
        this.images = config.defaultImages;
    }
    
    openFromNavigation(source) {
        if (source) this.context = source;
        this.showImageViewer();
    }
    
    showImageViewer() {
        this.createViewerWindow();
        
        if (window.app?.soundSystem) {
            window.app.soundSystem.playSound('startup');
        }

        const config = this.configs[this.context] || this.configs['moodboards'];
        if (config.canSetWallpaper) {
            this.setupPhotographyContextMenu();
        }
    }
    
    setupPhotographyContextMenu() {
        const contextMenu = document.getElementById('xpImageContextMenu');
        const imageContainer = document.getElementById('xpImageContainer');
        
        if (!imageContainer || !contextMenu) return;
        
        imageContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            contextMenu.style.left = e.clientX + 'px';
            contextMenu.style.top = e.clientY + 'px';
            contextMenu.style.display = 'block';
            contextMenu.style.zIndex = '3000';
            
            const closeMenu = (clickEvent) => {
                if (!contextMenu.contains(clickEvent.target)) {
                    contextMenu.style.display = 'none';
                    document.removeEventListener('click', closeMenu);
                }
            };
            
            setTimeout(() => {
                document.addEventListener('click', closeMenu);
            }, 100);
            
            if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
        });
        
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.closest('.xp-context-item')?.dataset.action;
            if (action) {
                this.handleContextAction(action);
                contextMenu.style.display = 'none';
            }
        });
    }

    createViewerWindow() {
        const oldOverlay = document.querySelector('.image-viewer-overlay');
        if (oldOverlay) oldOverlay.remove();
        
        const config = this.configs[this.context] || this.configs['moodboards'];
        
        const overlay = document.createElement('div');
        overlay.className = 'image-viewer-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        `;
        
        overlay.innerHTML = `
            <div class="xp-image-viewer" id="xpImageViewer" style="
                width: 800px;
                height: 600px;
                background: #ece9d8;
                border: 3px solid;
                border-color: #ffffff #808080 #808080 #ffffff;
                box-shadow: 8px 8px 0 rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                font-family: "Tahoma", "MS Sans Serif", sans-serif;
                z-index: 2001;
                position: relative;
            ">
                <div class="xp-image-header" id="xpImageHeader" style="
                    background: linear-gradient(to right, #0a246a, #a6caf0);
                    padding: 6px 12px;
                    border-bottom: 2px solid #000;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: white;
                    cursor: move;
                    font-size: 11px;
                    font-weight: bold;
                ">
                    <div class="xp-image-title" style="display: flex; align-items: center; gap: 8px;">
                        <img src="${config.icon}" alt="" style="width: 16px; height: 16px;">
                        ${config.title} - [${this.currentImageIndex + 1}/${this.images.length}]
                    </div>
                    <div class="xp-image-controls" style="display: flex; gap: 4px;">
                        <div class="xp-image-btn" id="xpImageMinBtn" style="
                            width: 20px;
                            height: 20px;
                            border: 2px solid;
                            border-color: #ffffff #808080 #808080 #ffffff;
                            background: #c0c0c0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 10px;
                            cursor: pointer;
                            color: #000;
                            font-family: "Webdings", "Marlett", sans-serif;
                        ">_</div>
                        <div class="xp-image-btn" id="xpImageMaxBtn" style="
                            width: 20px;
                            height: 20px;
                            border: 2px solid;
                            border-color: #ffffff #808080 #808080 #ffffff;
                            background: #c0c0c0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 10px;
                            cursor: pointer;
                            color: #000;
                            font-family: "Webdings", "Marlett", sans-serif;
                        ">□</div>
                        <div class="xp-image-btn" id="xpImageCloseBtn" style="
                            width: 20px;
                            height: 20px;
                            border: 2px solid;
                            border-color: #ffffff #808080 #808080 #ffffff;
                            background: #c0c0c0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 10px;
                            cursor: pointer;
                            color: #000;
                            font-family: "Webdings", "Marlett", sans-serif;
                        ">×</div>
                    </div>
                </div>
                
                <div class="xp-image-menu" style="
                    background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
                    padding: 4px 8px;
                    border-bottom: 2px solid #808080;
                    display: flex;
                    gap: 15px;
                    font-size: 11px;
                ">
                    <div class="xp-menu-item" style="padding: 2px 8px; cursor: pointer; border: 1px solid transparent;">File</div>
                    <div class="xp-menu-item" style="padding: 2px 8px; cursor: pointer; border: 1px solid transparent;">Edit</div>
                    <div class="xp-menu-item" style="padding: 2px 8px; cursor: pointer; border: 1px solid transparent;">View</div>
                    <div class="xp-menu-item" style="padding: 2px 8px; cursor: pointer; border: 1px solid transparent;">Tools</div>
                    <div class="xp-menu-item" style="padding: 2px 8px; cursor: pointer; border: 1px solid transparent;">Help</div>
                </div>
                
                <div class="xp-image-body" style="
                    flex: 1;
                    padding: 15px;
                    background: #d4d0c8;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    position: relative;
                ">
                    <div class="xp-image-container" id="xpImageContainer" style="
                        flex: 1;
                        background: #000;
                        border: 2px solid #000;
                        position: relative;
                        overflow: hidden;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <img id="xpCurrentImage" src="${this.images[this.currentImageIndex]?.src || ''}" 
                             alt="${this.images[this.currentImageIndex]?.title || 'Image'}"
                             style="
                                max-width: 100%;
                                max-height: 100%;
                                object-fit: contain;
                                display: block;
                             ">
                        <div id="xpImageError" style="
                            color: white;
                            font-size: 14px;
                            text-align: center;
                            padding: 20px;
                            display: none;
                        ">Image not found or failed to load.</div>
                    </div>

                    <div class="xp-image-controls-bar" style="
                        background: #d4d0c8;
                        padding: 8px 12px;
                        border: 2px solid;
                        border-color: #808080 #ffffff #ffffff #808080;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        flex-wrap: wrap;
                    ">
                        <button class="xp-control-btn" id="xpPrevBtn" title="Previous" style="
                            width: 32px;
                            height: 32px;
                            background: #d4d0c8;
                            border: 2px solid;
                            border-color: #ffffff #808080 #808080 #ffffff;
                            color: #000;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            font-size: 12px;
                        ">◄</button>
                        
                        <button class="xp-control-btn" id="xpNextBtn" title="Next" style="
                            width: 32px;
                            height: 32px;
                            background: #d4d0c8;
                            border: 2px solid;
                            border-color: #ffffff #808080 #808080 #ffffff;
                            color: #000;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            font-size: 12px;
                        ">►</button>
                        
                        <div class="xp-image-info" style="
                            font-size: 11px;
                            color: #000;
                            background: #c0c0c8;
                            padding: 4px 8px;
                            border: 2px solid;
                            border-color: #808080 #ffffff #ffffff #808080;
                            min-width: 200px;
                        ">
                            <div id="xpImageName">${this.images[this.currentImageIndex]?.title || 'No image loaded'}</div>
                            <div id="xpImageCounter">${this.currentImageIndex + 1} of ${this.images.length}</div>
                        </div>

                        <div class="xp-desktop-section" style="margin-left: auto; display: flex; gap: 8px;">
                            ${config.canSetWallpaper ? `
                            <button class="xp-control-btn" id="xpSetWallpaperBtn" title="Set as Wallpaper" style="
                                width: auto;
                                height: 32px;
                                padding: 0 12px;
                                background: #d4d0c8;
                                border: 2px solid;
                                border-color: #ffffff #808080 #808080 #ffffff;
                                color: #000;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                cursor: pointer;
                                font-size: 11px;
                                font-family: 'Tahoma', 'MS Sans Serif', sans-serif;
                                white-space: nowrap;
                                gap: 4px;
                            ">
                                <span style="font-size: 14px;">🖼️</span> Set as Wallpaper
                            </button>
                            ` : ''}
                            
                            <button class="xp-control-btn" id="xpAddToDesktopBtn" title="Add to Desktop" style="
                                width: 32px;
                                height: 32px;
                                background: #d4d0c8;
                                border: 2px solid;
                                border-color: #ffffff #808080 #808080 #ffffff;
                                color: #000;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                cursor: pointer;
                                font-size: 12px;
                            ">🏠</button>
                            
                            <button class="xp-control-btn" id="xpFullscreenBtn" title="Fullscreen" style="
                                width: 32px;
                                height: 32px;
                                background: #d4d0c8;
                                border: 2px solid;
                                border-color: #ffffff #808080 #808080 #ffffff;
                                color: #000;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                cursor: pointer;
                                font-size: 12px;
                            ">⛶</button>
                        </div>
                    </div>
                    
                    ${config.canSetWallpaper ? `
                    <div class="xp-context-menu" id="xpImageContextMenu" style="display: none;">
                        <div class="xp-context-item" data-action="setWallpaper">
                            Set as Desktop Wallpaper
                        </div>
                        <hr style="margin: 4px 8px; border: none; border-top: 1px solid #808080;">
                        <div class="xp-context-item" data-action="saveImage">
                            Save Image As...
                        </div>
                    </div>
                    ` : ''}
                </div>

                <div class="xp-image-status" style="
                    background: linear-gradient(to right, #f0f0f0, #e0e0e0);
                    border-top: 2px solid #808080;
                    padding: 4px 8px;
                    font-size: 11px;
                    color: #666;
                    display: flex;
                    justify-content: space-between;
                ">
                    <span>Ready</span>
                    <span id="xpImageSize">${this.images[this.currentImageIndex]?.src || ''}</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        this.setupImageViewerControls();
        
        const viewerWindow = document.getElementById('xpImageViewer');
        const viewerHeader = document.getElementById('xpImageHeader');
        if (viewerWindow && viewerHeader) {
            new DraggableWindow(viewerWindow, viewerHeader);
        }
        
        this.loadImage(0);
    }
    
    setupImageViewerControls() {
        const imageElement = document.getElementById('xpCurrentImage');
        const prevBtn = document.getElementById('xpPrevBtn');
        const nextBtn = document.getElementById('xpNextBtn');
        const setWallpaperBtn = document.getElementById('xpSetWallpaperBtn');
        const addToDesktopBtn = document.getElementById('xpAddToDesktopBtn');
        const fullscreenBtn = document.getElementById('xpFullscreenBtn');
        const closeBtn = document.getElementById('xpImageCloseBtn');
        const minBtn = document.getElementById('xpImageMinBtn');
        const maxBtn = document.getElementById('xpImageMaxBtn');
        const imageContainer = document.getElementById('xpImageContainer');
        const imageName = document.getElementById('xpImageName');
        const imageCounter = document.getElementById('xpImageCounter');
        const imageSize = document.getElementById('xpImageSize');
        const contextMenu = document.getElementById('xpImageContextMenu');
        
        this.imageContainer = imageContainer;
        this.imageName = imageName;
        this.imageCounter = imageCounter;
        
        if (contextMenu) {
            console.log('✅ Menu do image viewer encontrado');
        } else {
            console.log('❌ Menu do image viewer NÃO encontrado - criando...');
            this.createContextMenuIfNeeded();
        }
        
        this.imageElement = imageElement;
        this.viewerWindow = document.getElementById('xpImageViewer');
        
        if (imageElement) {
            imageElement.onload = () => {
                const errorElement = document.getElementById('xpImageError');
                if (errorElement) errorElement.style.display = 'none';
                
                if (imageSize) {
                    imageSize.textContent = `${imageElement.naturalWidth} × ${imageElement.naturalHeight}`;
                }
            };
            
            imageElement.onerror = () => {
                const errorElement = document.getElementById('xpImageError');
                if (errorElement) {
                    errorElement.style.display = 'block';
                    errorElement.innerHTML = `
                        Failed to load image.<br>
                        <small>${this.images[this.currentImageIndex]?.src || ''}</small>
                    `;
                }
                if (imageSize) imageSize.textContent = 'Load error';
            };
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.previousImage();
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextImage();
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
        
        if (setWallpaperBtn) {
            setWallpaperBtn.addEventListener('click', () => {
                this.setAsWallpaper();
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
        
        if (addToDesktopBtn) {
            addToDesktopBtn.addEventListener('click', () => {
                this.addToDesktop();
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
        
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideImageViewer();
            });
        }
        
        if (minBtn) {
            minBtn.addEventListener('click', () => {
                if (this.viewerWindow) {
                    this.viewerWindow.style.display = 'none';
                    setTimeout(() => {
                        this.viewerWindow.style.display = 'flex';
                    }, 1000);
                }
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
        
        if (maxBtn) {
            maxBtn.addEventListener('click', () => {
                if (this.viewerWindow) {
                    this.viewerWindow.classList.toggle('maximized');
                    if (this.viewerWindow.classList.contains('maximized')) {
                        this.viewerWindow.style.width = '90%';
                        this.viewerWindow.style.height = '90vh';
                        maxBtn.innerHTML = '❐';
                    } else {
                        this.viewerWindow.style.width = '800px';
                        this.viewerWindow.style.height = '600px';
                        maxBtn.innerHTML = '□';
                    }
                }
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
    }
    
    loadImage(index) {
        if (index >= 0 && index < this.images.length) {
            this.currentImageIndex = index;
            const image = this.images[index];
            
            const imageElement = document.getElementById('xpCurrentImage');
            const titleElement = document.querySelector('.xp-image-title');
            const imageName = document.getElementById('xpImageName');
            const imageCounter = document.getElementById('xpImageCounter');
            
            if (imageElement && image.src) {
                imageElement.src = image.src;
                imageElement.alt = image.title || 'Image';
                    
                imageElement.style.display = 'none';
                setTimeout(() => {
                    imageElement.style.display = 'block';
                }, 10);
            }
                
            if (titleElement) {
                const config = this.configs[this.context] || this.configs['moodboards'];
                titleElement.innerHTML = `
                    <img src="${config.icon}" alt="" style="width: 16px; height: 16px;">
                    ${config.title} - [${index + 1}/${this.images.length}]
                `;
            }
            
            if (imageName) imageName.textContent = image.title || 'Untitled';
            if (imageCounter) imageCounter.textContent = `${index + 1} of ${this.images.length}`;
        }
    }
    
    previousImage() {
        let newIndex = this.currentImageIndex - 1;
        if (newIndex < 0) newIndex = this.images.length - 1;
        this.loadImage(newIndex);
    }
    
    nextImage() {
        let newIndex = this.currentImageIndex + 1;
        if (newIndex >= this.images.length) newIndex = 0;
        this.loadImage(newIndex);
    }
    
    toggleFullscreen() {
        const viewerWindow = document.getElementById('xpImageViewer');
        const imageContainer = document.getElementById('xpImageContainer');
        
        if (!document.fullscreenElement) {
            if (viewerWindow.requestFullscreen) {
                viewerWindow.requestFullscreen();
            } else if (viewerWindow.webkitRequestFullscreen) {
                viewerWindow.webkitRequestFullscreen();
            } else if (viewerWindow.msRequestFullscreen) {
                viewerWindow.msRequestFullscreen();
            }
            
            if (imageContainer) {
                imageContainer.style.height = 'calc(100vh - 140px)';
            }
            
            this.isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            if (imageContainer) {
                imageContainer.style.height = '';
            }
            
            this.isFullscreen = false;
        }
        
        if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
    }
    
    handleContextAction(action) {
        const config = this.configs[this.context] || this.configs['moodboards'];
        
        if (!config.canSetWallpaper) {
            this.showNotification('This feature is only available for Photography images');
            return;
        }
        
        switch(action) {
            case 'setWallpaper':
                this.setAsWallpaper();
                break;
            case 'saveImage':
                this.saveImageAs();
                break;
        }
        
        if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
    }
    
    setAsWallpaper() {
        const config = this.configs[this.context] || this.configs['moodboards'];
        
        if (!config.canSetWallpaper) {
            this.showNotification('This feature is only available for Photography images');
            return;
        }
        
        const currentImage = this.images[this.currentImageIndex];
        if (!currentImage) {
            this.showNotification('No image selected');
            return;
        }
        
        const desktop = document.getElementById('desktop');
        if (desktop) {
            const img = new Image();
            img.onload = () => {
                desktop.style.backgroundImage = `url('${currentImage.src}')`;
                desktop.style.backgroundSize = 'cover';
                desktop.style.backgroundPosition = 'center';
                desktop.style.backgroundRepeat = 'no-repeat';
                desktop.style.backgroundAttachment = 'fixed';
                desktop.style.boxShadow = 'inset 0 0 0 2000px rgba(0, 0, 0, 0.2)';
                desktop.classList.add('has-wallpaper');
                
                this.showNotification('Wallpaper set successfully! 🖼️');
            };
            
            img.onerror = () => {
                this.showNotification('Error: Image not found');
                console.error(`❌ Imagem não encontrada: ${currentImage.src}`);
            };
            
            img.src = currentImage.src;
        } else {
            this.showNotification('Desktop element not found');
        }
    }
    
    saveImageAs() {
        const config = this.configs[this.context] || this.configs['moodboards'];
        
        if (!config.canSetWallpaper) {
            this.showNotification('This feature is only available for Photography images');
            return;
        }
        
        const currentImage = this.images[this.currentImageIndex];
        if (!currentImage) {
            this.showNotification('No image selected');
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            const link = document.createElement('a');
            link.href = currentImage.src;
            link.download = currentImage.title?.replace(/\s+/g, '_') || 'photography_image';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showNotification('Image download started... 💾');
        };
        
        img.onerror = () => {
            this.showNotification('Error: Cannot download image');
            console.error(`❌ Erro ao baixar imagem: ${currentImage.src}`);
        };
        
        img.src = currentImage.src;
    }
    
    showNotification(message) {
        const oldNotifications = document.querySelectorAll('.notification');
        oldNotifications.forEach(notif => {
            if (notif.parentNode) notif.parentNode.removeChild(notif);
        });
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-info-circle" style="color: #ff69b4;"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out';
        }, 10);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    hideImageViewer() {
        const overlay = document.querySelector('.image-viewer-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
    }
    
    // VERIFICAÇÃO DE ÍCONE DUPLICADO
    addToDesktop() {
        const desktop = document.getElementById('desktop');
        const config = this.configs[this.context] || this.configs['moodboards'];
        const iconId = `image_viewer_${this.context}_${Date.now()}`;
        
        // Usa a lógica do DesktopManager 
        if (window.app?.desktopManager?.desktopIcons) {
            const existingIcons = window.app.desktopManager.desktopIcons.filter(icon => 
                icon.name === config.title || icon.context === this.context
            );
            
            if (existingIcons.length > 0) {
                this.showNotification(`${config.title} is already on the desktop! 🖥️`);
                return;
            }
        }
        
        // Verificação por elementos no DOM
        const existingDomIcons = document.querySelectorAll(`[data-context="${this.context}"]`);
        if (existingDomIcons.length > 0) {
            this.showNotification(`${config.title} is already on the desktop! 🖥️`);
            return;
        }
        
        const icon = document.createElement('div');
        icon.className = 'desktop-icon app-icon';
        icon.dataset.id = iconId;
        icon.dataset.name = config.title;
        icon.dataset.context = this.context;
        icon.dataset.type = 'image-viewer';
        
        const desktopRect = desktop.getBoundingClientRect();
        const x = 20 + Math.random() * (desktopRect.width - 180);
        const y = 20 + Math.random() * (desktopRect.height - 140);
        
        icon.style.left = `${x}px`;
        icon.style.top = `${y}px`;
        
        icon.innerHTML = `
            <div class="icon-image">
                <img src="${config.icon}" alt="${config.title}" style="width: 48px; height: 48px;">
            </div>
            <div class="icon-label">${config.title}</div>
        `;
        
        icon.addEventListener('dblclick', () => {
            const imageViewer = new XPImageViewerSystem(this.context);
            imageViewer.showImageViewer();
            if (window.app?.soundSystem) window.app.soundSystem.playSound('startup');
        });
        
        icon.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (window.app?.desktopManager) {
                window.app.desktopManager.selectedIcon = icon;
                window.app.desktopManager.showContextMenu(e.clientX, e.clientY, 'icon');
            }
        });
        
        if (window.app?.desktopManager) {
            window.app.desktopManager.makeIconDraggable(icon);
        }
        
        desktop.appendChild(icon);
        
        if (window.app?.desktopManager?.desktopIcons) {
            window.app.desktopManager.desktopIcons.push({
                id: iconId,
                element: icon,
                name: config.title,
                type: 'image-viewer',
                context: this.context
            });
        }
        
        if (window.app?.soundSystem) {
            window.app.soundSystem.playSound('startup');
        }
        
        this.showNotification(`${config.title} added to desktop! 🖥️`);
    }
}

// ===== PATCH PARA DESKTOP MANAGER =====
function patchDesktopManager() {
    if (typeof DesktopManager === 'undefined') {
        setTimeout(patchDesktopManager, 100);
        return;
    }

    const originalHandleContextAction = DesktopManager.prototype.handleContextAction;
    DesktopManager.prototype.handleContextAction = function(action) {
        if (action === 'addToDesktop' && this.selectedWindow) {
            const windowId = this.selectedWindow.id;
            
            if (windowId === 'xpImageViewer') {
                const viewer = document.querySelector('.image-viewer-overlay');
                if (viewer) {
                    const titleElement = this.selectedWindow.querySelector('.xp-image-title img');
                    let context = 'moodboards';
                    
                    if (titleElement) {
                        const iconSrc = titleElement.src;
                        if (iconSrc.includes('styling')) context = 'styling';
                        else if (iconSrc.includes('stage')) context = 'stage';
                        else if (iconSrc.includes('editing')) context = 'editing';
                        else if (iconSrc.includes('photography')) context = 'photography';
                    }
                    
                    const imageViewer = new XPImageViewerSystem(context);
                    imageViewer.addToDesktop();
                    return;
                }
            }
        }
        
        if (originalHandleContextAction) {
            return originalHandleContextAction.call(this, action);
        }
    };
}

// ===== INTEGRAÇÃO COM O SISTEMA =====
function setupImageViewerNavigation() {
    const setupActivitiesImageLinks = () => {
        setTimeout(() => {
            const moodboardsBtn = document.querySelector('[data-section="moodboards"]');
            const stylingBtn = document.querySelector('[data-section="styling"]');
            const stageBtn = document.querySelector('[data-section="stage"]');
            const editingBtn = document.querySelector('[data-section="editing"]');
            
            const openImageViewer = (context) => {
                if (window.XPImageViewerSystem) {
                    const imageViewer = new XPImageViewerSystem(context);
                    imageViewer.showImageViewer();
                    
                    const viewerWindow = document.getElementById('xpImageViewer');
                    if (viewerWindow && window.app?.desktopManager) {
                        viewerWindow.addEventListener('contextmenu', (e) => {
                            e.preventDefault();
                            window.app.desktopManager.selectedWindow = viewerWindow;
                            window.app.desktopManager.showContextMenu(e.clientX, e.clientY, 'window');
                        });
                    }
                    
                    if (window.app?.soundSystem) {
                        window.app.soundSystem.playSound('startup');
                    }
                }
            };
            
            if (moodboardsBtn) {
                moodboardsBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openImageViewer('moodboards');
                });
                moodboardsBtn.style.cursor = 'pointer';
                moodboardsBtn.title = 'Click to open Image Viewer';
            }
            
            if (stylingBtn) {
                stylingBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openImageViewer('styling');
                });
                stylingBtn.style.cursor = 'pointer';
                stylingBtn.title = 'Click to open Image Viewer';
            }
            
            if (stageBtn) {
                stageBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openImageViewer('stage');
                });
                stageBtn.style.cursor = 'pointer';
                stageBtn.title = 'Click to open Image Viewer';
            }
            
            if (editingBtn) {
                editingBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openImageViewer('editing');
                });
                editingBtn.style.cursor = 'pointer';
                editingBtn.title = 'Click to open Image Viewer';
            }
        }, 1000);
    };
    
    const setupPhotographyNav = () => {
        const photoNav = document.getElementById('photoNav');
        if (photoNav) {
            photoNav.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (window.XPImageViewerSystem) {
                    const imageViewer = new XPImageViewerSystem('photography');
                    imageViewer.showImageViewer();
                    
                    if (window.app?.soundSystem) {
                        window.app.soundSystem.playSound('startup');
                    }
                } else {
                    console.error('Image Viewer system not loaded');
                    alert('Image Viewer system not available. Please refresh the page.');
                }
            });
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupActivitiesImageLinks();
            setupPhotographyNav();
        });
    } else {
        setupActivitiesImageLinks();
        setupPhotographyNav();
    }
}

// Chame o patch
patchDesktopManager();

// Inicializar sistema de navegação
setupImageViewerNavigation();

// Exportar para uso global
window.XPImageViewerSystem = XPImageViewerSystem;

// ===== MAIN APPLICATION =====
class AnteroPortfolio {
    constructor() {
        this.soundSystem = new SoundSystem();
        this.startMenu = null;
        this.windows = [];
        this.aboutMe = null;
        this.desktopManager = null;
        this.xpMediaPlayer = null;
        this.activitiesSystem = null;
        this.initialize();
    }
    
    initialize() {
        this.soundSystem.init();
        this.setupClock();
        this.setupEventListeners();
        this.setupWindowControls();
        this.setupNavigation();
        this.setupVolumeControl();
        this.welcomeMessage();
        this.initDraggableWindows();
        
        this.aboutMe = new AboutMeSystem();
        this.xpMediaPlayer = new XPMediaPlayerSystem();
        this.activitiesSystem = new ActivitiesSystem();
        
        setTimeout(() => {
            this.desktopManager = new DesktopManager();
        }, 500);
    }
    
    initDraggableWindows() {
        const navWindow = document.getElementById('navWindow');
        const navTitleBar = document.getElementById('windowTitleBar');
        if (navWindow && navTitleBar) {
            this.windows.push(new DraggableWindow(navWindow, navTitleBar));
        }
        
        const heroWindow = document.getElementById('heroWindow');
        const heroTitleBar = document.getElementById('heroTitleBar');
        if (heroWindow && heroTitleBar) {
            this.windows.push(new DraggableWindow(heroWindow, heroTitleBar));
        }
        
        const activitiesWindow = document.getElementById('activitiesWindow');
        const activitiesHeader = document.getElementById('activitiesHeader');
        if (activitiesWindow && activitiesHeader) {
            new DraggableWindow(activitiesWindow, activitiesHeader);
        }
    }
    
    setupClock() {
        function updateClock() {
            const now = new Date();
            const time = now.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            const clockElement = document.getElementById('clock');
            if (clockElement) clockElement.textContent = time;
        }
        
        setInterval(updateClock, 1000);
        updateClock();
    }
    
    setupEventListeners() {
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.soundSystem.playSound('click');
                this.toggleStartMenu();
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                const navWindow = document.getElementById('navWindow');
                if (navWindow) {
                    navWindow.style.display = navWindow.style.display === 'none' ? 'block' : 'none';
                    this.soundSystem.playSound('click');
                }
            }
            
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                this.showRefreshLoading();
            }
            
            if (e.key === 'Escape') {
                if (this.startMenu) this.startMenu.style.display = 'none';
                const volumePopup = document.getElementById('volumePopup');
                if (volumePopup) volumePopup.style.display = 'none';
                
                const aboutPopup = document.getElementById('aboutPopup');
                if (aboutPopup && aboutPopup.style.display === 'block') {
                    this.aboutMe.hideAboutPopup();
                }
                
                const skillsOverlay = document.getElementById('skillsOverlay');
                if (skillsOverlay && skillsOverlay.style.display === 'flex') {
                    this.aboutMe.hideSkillsPanel();
                }
                
                const videoOverlay = document.querySelector('.video-player-overlay');
                if (videoOverlay) {
                    this.xpMediaPlayer.hideVideoPlayer();
                }
                
                if (this.activitiesSystem && this.activitiesSystem.isOpen) {
                    this.activitiesSystem.close();
                }
            }
        });
        
        document.addEventListener('click', (e) => {
            if (this.startMenu && !e.target.closest('#startButton') && !e.target.closest('#startMenu')) {
                this.startMenu.style.display = 'none';
            }
        });
    }
    
    setupWindowControls() {
        const navWindow = document.getElementById('navWindow');
        
        const minBtn = document.getElementById('minBtn');
        if (minBtn && navWindow) {
            minBtn.addEventListener('click', () => {
                this.soundSystem.playSound('click');
                navWindow.style.display = 'none';
            });
        }
        
        const maxBtn = document.getElementById('maxBtn');
        if (maxBtn && navWindow) {
            maxBtn.addEventListener('click', () => {
                this.soundSystem.playSound('click');
                if (navWindow.classList.contains('maximized')) {
                    navWindow.classList.remove('maximized');
                    navWindow.style.width = '500px';
                    navWindow.style.height = 'auto';
                    navWindow.style.left = '50px';
                    navWindow.style.top = '50px';
                    maxBtn.innerHTML = '<i class="fas fa-window-maximize"></i>';
                } else {
                    navWindow.classList.add('maximized');
                    navWindow.style.width = 'calc(100% - 40px)';
                    navWindow.style.height = 'calc(100% - 100px)';
                    navWindow.style.left = '20px';
                    navWindow.style.top = '20px';
                    maxBtn.innerHTML = '<i class="fas fa-window-restore"></i>';
                }
            });
        }
        
        const closeBtn = document.getElementById('closeBtn');
        if (closeBtn && navWindow) {
            closeBtn.addEventListener('click', () => {
                this.soundSystem.playSound('click');
                if (confirm('Close Navigation window?')) {
                    navWindow.style.display = 'none';
                }
            });
        }
        
        const heroWindow = document.getElementById('heroWindow');
        const heroMinBtn = document.getElementById('heroMinBtn');
        const heroMaxBtn = document.getElementById('heroMaxBtn');
        const heroCloseBtn = document.getElementById('heroCloseBtn');
        
        if (heroMinBtn && heroWindow) {
            heroMinBtn.addEventListener('click', () => {
                this.soundSystem.playSound('click');
                heroWindow.style.display = 'none';
            });
        }
        
        if (heroMaxBtn && heroWindow) {
            heroMaxBtn.addEventListener('click', () => {
                this.soundSystem.playSound('click');
                if (heroWindow.classList.contains('maximized')) {
                    heroWindow.classList.remove('maximized');
                    heroWindow.style.width = '600px';
                    heroWindow.style.height = 'auto';
                    heroWindow.style.left = '';
                    heroWindow.style.top = '';
                    heroMaxBtn.innerHTML = '<i class="fas fa-window-maximize"></i>';
                } else {
                    heroWindow.classList.add('maximized');
                    heroWindow.style.width = 'calc(100% - 40px)';
                    heroWindow.style.height = 'calc(100vh - 100px)';
                    heroWindow.style.left = '20px';
                    heroWindow.style.top = '20px';
                    heroMaxBtn.innerHTML = '<i class="fas fa-window-restore"></i>';
                }
            });
        }
        
        if (heroCloseBtn && heroWindow) {
            heroCloseBtn.addEventListener('click', () => {
                this.soundSystem.playSound('click');
                if (confirm('Close Portfolio window?')) {
                    heroWindow.style.display = 'none';
                }
            });
        }
    }
    
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('mouseenter', () => this.soundSystem.playSound('hover'));
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.soundSystem.playSound('click');
                
                item.style.transform = 'scale(0.95)';
                setTimeout(() => item.style.transform = '', 200);
                
                const section = item.id.replace('Nav', '').toLowerCase();
                
                if (section === 'video') return;
                if (section === 'about') return;
                if (section === 'projects') return;
                
                this.showSection(section, item.textContent.trim());
            });
        });
    }
    
    setupVolumeControl() {
        const volumeButton = document.getElementById('volumeButton');
        const volumePopup = document.getElementById('volumePopup');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (volumeButton && volumePopup) {
            volumeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                volumePopup.style.display = volumePopup.style.display === 'block' ? 'none' : 'block';
            });
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => {
                this.soundSystem.setVolume(volumeSlider.value);
                this.soundSystem.playSound('click');
            });
        }
        
        document.addEventListener('click', (e) => {
            if (volumePopup && 
                !e.target.closest('.volume-control') && 
                !e.target.closest('.volume-popup')) {
                volumePopup.style.display = 'none';
            }
        });
    }
    
    toggleStartMenu() {
        if (!this.startMenu) {
            this.createStartMenu();
        }
        
        this.startMenu.style.display = this.startMenu.style.display === 'block' ? 'none' : 'block';
    }
    
    createStartMenu() {
        this.startMenu = document.createElement('div');
        this.startMenu.id = 'startMenu';
        this.startMenu.style.cssText = `
            position: fixed;
            bottom: 50px;
            left: 10px;
            width: 300px;
            background: #ffe6f2;
            border: 3px solid #000;
            z-index: 1001;
            box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
            display: none;
        `;
        
        this.startMenu.innerHTML = `
            <div style="padding: 15px; border-bottom: 2px solid #000; background: #ff69b4; color: white; font-weight: bold;">
                <i class="fas fa-user"></i> Antero Rodrigo
            </div>
            <div style="padding: 10px;">
                <div class="start-menu-item" data-action="showNav" style="padding: 8px; border-bottom: 1px solid #ffb6e1; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <div style="width: 20px; height: 20px; background: #ff1493; border: 2px solid #000;"></div>
                    Show Navigation
                </div>
                <div class="start-menu-item" data-action="refresh" style="padding: 8px; border-bottom: 1px solid #ffb6e1; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <div style="width: 20px; height: 20px; background: #ffff00; border: 2px solid #000; position: relative;">
                        <div style="width: 12px; height: 12px; background: #000; position: absolute; top: 3px; left: 3px;"></div>
                    </div>
                    Refresh Page
                </div>
                <div class="start-menu-item" data-action="showDesktop" style="padding: 8px; border-bottom: 1px solid #ffb6e1; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <div style="width: 20px; height: 20px; background: #00ff00; border: 2px solid #000; position: relative;">
                        <div style="width: 8px; height: 8px; background: #000; position: absolute; top: 2px; left: 2px; bottom: 2px; right: 2px;"></div>
                    </div>
                    Show Desktop
                </div>
                <div class="start-menu-item" data-action="shutdown" style="padding: 8px; cursor: pointer; color: #ff0066; display: flex; align-items: center; gap: 8px;">
                    <div style="width: 20px; height: 20px; background: #ff0066; border: 2px solid #000; position: relative;">
                        <div style="width: 8px; height: 8px; background: #000; position: absolute; top: 5px; left: 5px;"></div>
                    </div>
                    Shutdown
                </div>
            </div>
        `;
        
        document.body.appendChild(this.startMenu);
        
        this.startMenu.querySelectorAll('.start-menu-item').forEach(item => {
            item.addEventListener('mouseenter', () => this.soundSystem.playSound('hover'));
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.soundSystem.playSound('click');
                const action = item.getAttribute('data-action');
                this.handleStartMenuAction(action);
                this.startMenu.style.display = 'none';
            });
        });
    }
    
    handleStartMenuAction(action) {
        switch(action) {
            case 'showNav':
                const navWindow = document.getElementById('navWindow');
                if (navWindow) navWindow.style.display = 'block';
                break;
            case 'refresh':
                this.showRefreshLoading();
                break;
            case 'showDesktop':
                const windows = document.querySelectorAll('.nav-window, .hero-window, .about-popup, .skills-panel, .xp-window');
                windows.forEach(window => {
                    window.style.display = 'none';
                });
                const overlays = document.querySelectorAll('.popup-overlay, .skills-panel-overlay, .video-player-overlay, .xp-window-overlay');
                overlays.forEach(overlay => {
                    overlay.style.display = 'none';
                });
                break;
            case 'shutdown':
                if (confirm('Shut down AnteroRodrigo.exe?')) {
                    this.showShutdownScreen();
                }
                break;
        }
    }
    
    showRefreshLoading() {
        const overlay = document.getElementById('loadingOverlay');
        const progress = document.getElementById('refreshProgress');
        const message = document.getElementById('loadingMessage');
        
        if (!overlay || !progress || !message) return;
        
        overlay.style.display = 'flex';
        progress.style.width = '0%';
        this.soundSystem.playSound('startup');
        
        let load = 0;
        const messages = [
            "Closing applications...",
            "Saving settings...",
            "Clearing cache...",
            "Reloading assets...",
            "Initializing glamour...",
            "Almost there..."
        ];
        
        const interval = setInterval(() => {
            load += 15 + Math.random() * 10;
            if (load > 100) load = 100;
            progress.style.width = load + '%';
            
            if (load > 15 && load < 30) message.textContent = messages[0];
            else if (load >= 30 && load < 45) message.textContent = messages[1];
            else if (load >= 45 && load < 60) message.textContent = messages[2];
            else if (load >= 60 && load < 75) message.textContent = messages[3];
            else if (load >= 75 && load < 90) message.textContent = messages[4];
            else if (load >= 90) message.textContent = messages[5];
            
            if (load >= 100) {
                clearInterval(interval);
                setTimeout(() => location.reload(), 800);
            }
        }, 150);
    }
    
    showShutdownScreen() {
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #ff69b4; color: white; font-family: 'VT323';">
                <div style="text-align: center; padding: 40px; background: rgba(0,0,0,0.3); border: 3px solid #000;">
                    <div style="font-size: 48px; margin-bottom: 20px;">✿</div>
                    <div style="font-size: 24px; margin-bottom: 10px;">Windows 98</div>
                    <div style="font-size: 18px; margin-bottom: 30px;">Antero Rodrigo Edition</div>
                    <div style="font-size: 20px;">It's now safe to turn off your computer.</div>
                    <div style="margin-top: 30px; font-size: 14px; opacity: 0.8;">
                        Press any key to restart...
                    </div>
                </div>
            </div>
        `;
        
        document.addEventListener('keydown', () => location.reload());
    }
    
    welcomeMessage() {
        console.log('🎀 AnteroRodrigo.exe loaded successfully! 🎀');
        console.log('📁 Tip: Try dragging the windows around!');
        console.log('🖱️ Cursor: Custom Windows 98 style');
        console.log('✨ Aesthetic: Bimbo × Windows 2000');
        
        this.soundSystem.playSound('startup');
        
        setTimeout(() => {
            console.log('💡 Tip: Click the Start button for more options!');
            console.log('💡 Right-click windows to add them to desktop!');
        }, 2000);
    }
}

// ===== GLOBAL FUNCTIONS =====
function muteAll() {
    if (window.app) {
        window.app.soundSystem.toggleMute();
        window.app.soundSystem.playSound('click');
    }
}

function closeVolume() {
    const volumePopup = document.getElementById('volumePopup');
    if (volumePopup) volumePopup.style.display = 'none';
    if (window.app) window.app.soundSystem.playSound('click');
}

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AnteroPortfolio();
});