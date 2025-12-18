
let desktopManager = null;

// Função de compatibilidade para o código existente
document.addEventListener('DOMContentLoaded', () => {
    // Esta função é apenas para compatibilidade
    // O DesktopManager real é inicializado no main.js
    console.log('DesktopManager compatibility layer loaded');
});

// Função auxiliar para adicionar ícones via o sistema principal
function addIcon(name, iconClass, callback, imageUrl = null) {
    if (window.app && window.addDesktopIcon) {
        const type = iconClass.includes('fa-play') ? 'media' :
                    iconClass.includes('fa-user') ? 'about' :
                    iconClass.includes('fa-images') ? 'photos' :
                    iconClass.includes('fa-code') ? 'projects' :
                    iconClass.includes('fa-envelope') ? 'contact' : 'folder';
        
        return window.addDesktopIcon(name, type, callback);
    }
    return null;
}

// Exportar para compatibilidade
window.addIcon = addIcon;