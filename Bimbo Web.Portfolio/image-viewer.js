// ===== IMAGE VIEWER SYSTEM =====
class XPImageViewerSystem {
    constructor(context = 'moodboards') {
        this.context = context;
        this.currentImageIndex = 0;
        this.images = [];
        this.viewerWindow = null;
        this.imageElement = null;
        this.isFullscreen = false;
        
// Diferentes configurações por contexto
        this.configs = {
            'moodboards': {
                title: 'Moodboards Viewer',
                icon: 'assets/moodboard.ico',
                defaultImages: [
                    { src: 'images/moodboards/surfs.jpg', title: 'Color Palettes' },
                    { src: 'images/moodboards/sweet summer.jpg', title: 'Visual References' }
                ],
                canSetWallpaper: false // Moodboards não pode ser wallpaper
            },
            'styling': {
                title: 'Styling Viewer',
                icon: 'assets/styling.ico',
                defaultImages: [
                    { src: 'images/styling/wardrobe.jpg', title: 'Wardrobe Collection' },
                    { src: 'images/styling/props.jpg', title: 'Prop Coordination' }
                ],
                canSetWallpaper: false // Styling não pode ser wallpaper
            },
            'stage': {
                title: 'Stage Setup Viewer',
                icon: 'assets/stage.ico',
                defaultImages: [
                    { src: 'images/stage/layout.jpg', title: 'Stage Layout' },
                    { src: 'images/stage/lighting.jpg', title: 'Lighting Setup' }
                ],
                canSetWallpaper: false // Stage não pode ser wallpaper
            },
            'editing': {
                title: 'Editing Suite Viewer',
                icon: 'assets/editing.ico',
                defaultImages: [
                    { src: 'images/editing/kiikii.jpg', title: 'Editing Timeline' },
                    { src: 'images/editing/ocean.jpg', title: 'Color Grading' }
                ],
                canSetWallpaper: false // Editing não pode ser wallpaper
            },
            'photography': {
                title: 'Photography Viewer',
                icon: 'assets/photography.ico',
                defaultImages: [
                    { src: 'images/photography/drinks.jpg', title: 'Portrait Photography' },
                    { src: 'images/photography/praia.jpg', title: 'Landscape Shot' }
                ],
                canSetWallpaper: true // Maaasss Photography pode ser wallpaper :))
            }
        };
        
        // Inicializar com imagens padrão
        this.loadDefaultImages();
    }

    createContextMenuIfNeeded() {
        // Verifica se já existe
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
                    🖼️ 
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
    
    // Método para abrir o viewer a partir de diferentes pontos
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
        
        // Mostrar context menu no botão direito
        imageContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            // Posicionar menu próximo ao cursor
            contextMenu.style.left = e.clientX + 'px';
            contextMenu.style.top = e.clientY + 'px';
            contextMenu.style.display = 'block';
            contextMenu.style.zIndex = '3000';
            
            // Fechar menu ao clicar fora
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
        
        // Configurar ações do menu
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.closest('.xp-context-item')?.dataset.action;
            if (action) {
                this.handleContextAction(action);
                contextMenu.style.display = 'none';
            }
        });
    }

    createViewerWindow() {
        // Remove viewer anterior se existir
        const oldOverlay = document.querySelector('.image-viewer-overlay');
        if (oldOverlay) oldOverlay.remove();
        
        // Configuração atual
        const config = this.configs[this.context] || this.configs['moodboards'];
        
        // Cria overlay
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
        
        // Cria janela do Image Viewer
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
                
                <!-- Menu estilo Windows XP -->
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
                    <!-- Área da imagem -->
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

                    <!-- Controles -->
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

                        <!-- SEÇÃO ÚNICA COM TODOS OS BOTÕES -->
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
                                <span style="font-size: 14px;">🖼️</span> 
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
                    
                    <!-- Context Menu APENAS para Photography -->
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

                <!-- Status bar -->
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
        
        // Configura controles
        this.setupImageViewerControls();
        
        // Torna arrastável
        const viewerWindow = document.getElementById('xpImageViewer');
        const viewerHeader = document.getElementById('xpImageHeader');
        if (viewerWindow && viewerHeader) {
            new DraggableWindow(viewerWindow, viewerHeader);
        }
        
        // Carrega primeira imagem
        this.loadImage(0);
    }
    
    setupImageViewerControls() {
        const imageElement = document.getElementById('xpCurrentImage');
        const prevBtn = document.getElementById('xpPrevBtn');
        const nextBtn = document.getElementById('xpNextBtn');
        const setWallpaperBtn = document.getElementById('xpSetWallpaperBtn'); // NOVO
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
            // Cria o menu se não existir
            this.createContextMenuIfNeeded();
        }
        
        // Salva referências
        this.imageElement = imageElement;
        this.viewerWindow = document.getElementById('xpImageViewer');
        
        // Carregar imagem com tratamento de erro
        if (imageElement) {
            imageElement.onload = () => {
                const errorElement = document.getElementById('xpImageError');
                if (errorElement) errorElement.style.display = 'none';
                
                // Atualizar informações
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
        
        // Navegação
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
        
        // Botão para definir wallpaper aparece apenas para Photography)
        if (setWallpaperBtn) {
            setWallpaperBtn.addEventListener('click', () => {
                this.setAsWallpaper();
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
        
        // Botão para adicionar à área de trabalho
        if (addToDesktopBtn) {
            addToDesktopBtn.addEventListener('click', () => {
                this.addToDesktop();
                if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
            });
        }
        
        // Fullscreen
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // Controles da janela
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
            
            // Atualizar elementos da interface
            const imageElement = document.getElementById('xpCurrentImage');
            const titleElement = document.querySelector('.xp-image-title');
            const imageName = document.getElementById('xpImageName');
            const imageCounter = document.getElementById('xpImageCounter');
            
            if (imageElement && image.src) {
                imageElement.src = image.src;
                imageElement.alt = image.title || 'Image';
                    
                // Forçar recarregamento
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
            
            console.log(`📷 Carregando imagem: ${image.src}`);
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
            // Entrar em fullscreen
            if (viewerWindow.requestFullscreen) {
                viewerWindow.requestFullscreen();
            } else if (viewerWindow.webkitRequestFullscreen) {
                viewerWindow.webkitRequestFullscreen();
            } else if (viewerWindow.msRequestFullscreen) {
                viewerWindow.msRequestFullscreen();
            }
            
            // Ajustar container da imagem
            if (imageContainer) {
                imageContainer.style.height = 'calc(100vh - 140px)';
            }
            
            this.isFullscreen = true;
        } else {
            // Sair do fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            // Restaurar tamanho
            if (imageContainer) {
                imageContainer.style.height = '';
            }
            
            this.isFullscreen = false;
        }
        
        if (window.app?.soundSystem) window.app.soundSystem.playSound('click');
    }
    
    handleContextAction(action) {
        const config = this.configs[this.context] || this.configs['moodboards'];
        
        // APENAS Photography pode usar essas ações
        if (!config.canSetWallpaper) {
            // Se não for photography, mostra mensagem de erro
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
        
        // Verificação dupla por segurança
        if (!config.canSetWallpaper) {
            this.showNotification('This feature is only available for Photography images');
            return;
        }
        
        const currentImage = this.images[this.currentImageIndex];
        if (!currentImage) {
            this.showNotification('No image selected');
            return;
        }
        
        // Aplicar como wallpaper da área de trabalho virtual
        const desktop = document.getElementById('desktop');
        if (desktop) {
            // Verifica se a imagem existe antes de aplicar
            const img = new Image();
            img.onload = () => {
                // Aplica o wallpaper
                desktop.style.backgroundImage = `url('${currentImage.src}')`;
                desktop.style.backgroundSize = 'cover';
                desktop.style.backgroundPosition = 'center';
                desktop.style.backgroundRepeat = 'no-repeat';
                desktop.style.backgroundAttachment = 'fixed';
                
                // Adiciona overlay escuro para melhor contraste com ícones
                desktop.style.boxShadow = 'inset 0 0 0 2000px rgba(0, 0, 0, 0.2)';
                
                // Adicionar classe para lembrar que tem wallpaper
                desktop.classList.add('has-wallpaper');
                
                this.showNotification('Wallpaper set successfully! 🖼️');
                
                console.log(`🎨 Wallpaper definido: ${currentImage.title || currentImage.src}`);
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
        
        // APENAS Photography pode salvar
        if (!config.canSetWallpaper) {
            this.showNotification('This feature is only available for Photography images');
            return;
        }
        
        const currentImage = this.images[this.currentImageIndex];
        if (!currentImage) {
            this.showNotification('No image selected');
            return;
        }
        
        // Verifica se a imagem existe
        const img = new Image();
        img.onload = () => {
            // Cria link de download
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
        // Remove notificações anteriores
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
        
        // Animação de entrada
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out';
        }, 10);
        
        // Remove após 3 segundos
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
    
    // Método para adicionar à área de trabalho (funciona para todos os viewers)
    addToDesktop() {
        const desktop = document.getElementById('desktop');
        const config = this.configs[this.context] || this.configs['moodboards'];
        const iconId = `image_viewer_${this.context}_${Date.now()}`;
        
        // Verificar se já existe um ícone igual na área de trabalho
        const existingIcons = document.querySelectorAll(`[data-context="${this.context}"]`);
        if (existingIcons.length > 0) {
            this.showNotification(`${config.title} is already on the desktop!`);
            return;
        }
        
        const icon = document.createElement('div');
        icon.className = 'desktop-icon app-icon';
        icon.dataset.id = iconId;
        icon.dataset.name = config.title;
        icon.dataset.context = this.context;
        icon.dataset.type = 'image-viewer';
        
        // Posição aleatória
        const desktopRect = desktop.getBoundingClientRect();
        const x = 20 + Math.random() * (desktopRect.width - 180);
        const y = 20 + Math.random() * (desktopRect.height - 140);
        
        icon.style.left = `${x}px`;
        icon.style.top = `${y}px`;
        
        // Ícone com imagem real
        icon.innerHTML = `
            <div class="icon-image">
                <img src="${config.icon}" alt="${config.title}" style="width: 48px; height: 48px;">
            </div>
            <div class="icon-label">${config.title}</div>
        `;
        
        // Eventos
        icon.addEventListener('dblclick', () => {
            const imageViewer = new XPImageViewerSystem(this.context);
            imageViewer.showImageViewer();
            if (window.app?.soundSystem) window.app.soundSystem.playSound('startup');
        });
        
        // Context menu
        icon.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (window.app?.desktopManager) {
                window.app.desktopManager.selectedIcon = icon;
                window.app.desktopManager.showContextMenu(e.clientX, e.clientY, 'icon');
            }
        });
        
        // Tornar arrastável
        if (window.app?.desktopManager) {
            window.app.desktopManager.makeIconDraggable(icon);
        }
        
        desktop.appendChild(icon);
        
        // Adicionar à lista
        if (window.app?.desktopManager?.desktopIcons) {
            window.app.desktopManager.desktopIcons.push({
                id: iconId,
                element: icon,
                name: config.title,
                type: 'image-viewer',
                context: this.context
            });
        }
        
        // Som
        if (window.app?.soundSystem) {
            window.app.soundSystem.playSound('startup');
        }
        
        // Notificação
        this.showNotification(`${config.title} added to desktop! 🖥️`);
    }
}

// ===== MODIFICAÇÃO NO DESKTOP MANAGER =====
// Adiciona suporte para image viewers no context menu
function patchDesktopManager() {
    if (typeof DesktopManager === 'undefined') {
        setTimeout(patchDesktopManager, 100);
        return;
    }

    const originalHandleContextAction = DesktopManager.prototype.handleContextAction;
    DesktopManager.prototype.handleContextAction = function(action) {
        if (action === 'addToDesktop' && this.selectedWindow) {
            const windowId = this.selectedWindow.id;
            
            // Verificar se é um image viewer
            if (windowId === 'xpImageViewer') {
                const viewer = document.querySelector('.image-viewer-overlay');
                if (viewer) {
                    // Obter contexto do viewer
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
        
        // Chama função original para outras ações
        if (originalHandleContextAction) {
            return originalHandleContextAction.call(this, action);
        }
    };
}

// Chame a função para patch
patchDesktopManager();

// ===== INTEGRAÇÃO COM O SISTEMA =====
// Função para inicializar image viewers a partir da navegação
function setupImageViewerNavigation() {

    const setupActivitiesImageLinks = () => {
        // Aguardar o Activities System carregar
        setTimeout(() => {
            const moodboardsBtn = document.querySelector('[data-section="moodboards"]');
            const stylingBtn = document.querySelector('[data-section="styling"]');
            const stageBtn = document.querySelector('[data-section="stage"]');
            const editingBtn = document.querySelector('[data-section="editing"]');
            
            const openImageViewer = (context) => {
                if (window.XPImageViewerSystem) {
                    const imageViewer = new XPImageViewerSystem(context);
                    imageViewer.showImageViewer();
                    
                    // Opção de adicionar à área de trabalho via context menu
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
    
    // Configurar clique no Photography na navegação principal
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
    
    // Executar após carregamento
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

// Inicializar sistema de navegação
setupImageViewerNavigation();

// Exportar para uso global
window.XPImageViewerSystem = XPImageViewerSystem;