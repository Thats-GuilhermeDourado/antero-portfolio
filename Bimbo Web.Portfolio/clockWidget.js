// CLOCK WIDGET (Web Audio API)


const STEP_WIDTH = 64;
let isDragging = false;
let startX = 0;
let currentScroll = 0;
let lastStep = 0;

// Web Audio API 
let audioCtx;
let audioUnlocked = false;

document.addEventListener('DOMContentLoaded', () => {
    const clockElement = document.getElementById('clock');
    if (!clockElement) return;

    injectWidgetHTML();
    
    // Inicializar o contexto de áudio imediatamente
    initWiiUAudio();

    clockElement.style.cursor = 'pointer';
    clockElement.addEventListener('click', openClockWidget);
});

function initWiiUAudio() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioUnlocked = true;
        console.log('Áudio Wii U estilo inicializado');
    } catch (error) {
        console.error('Erro ao inicializar áudio:', error);
    }
}

function playWiiUScrollSound(direction = 0) {
    if (!audioUnlocked || !audioCtx) return;
    
    try {
        // Garantir que o contexto esteja ativo após interação do usuário
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        
        // Configurar filtro com som suave e satisfatório
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1;
        
        // Configurar o volume com envelope ADSR
        const now = audioCtx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01); // Attack rápido
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08); // Decay
        
        // Configurar oscilador
        oscillator.type = 'sine'; 
        
        // Frequência base com variação baseada na direção/velocidade
        let baseFreq = 440; // A4
        if (direction < 0) {
            baseFreq = 420; // Ligeiramente mais grave para scroll esquerdo
        } else if (direction > 0) {
            baseFreq = 460; // Ligeiramente mais agudo para scroll direito
        }
        
        // Adiciona uma variação aleatória sutil
        const freqVariation = 20 * Math.random() - 10;
        oscillator.frequency.setValueAtTime(baseFreq + freqVariation, now);
        
        // Adicionei vibrato pra tornar o som mais interessante e suave
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 8; // Vibrato lento
        lfoGain.gain.value = 3; // Pouca modulação
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        lfo.start();
        oscillator.start(now);
        
        // Parar após um tempinho
        oscillator.stop(now + 0.08);
        lfo.stop(now + 0.08);
        
        // Limpar recursos
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
            filter.disconnect();
            lfo.disconnect();
            lfoGain.disconnect();
        };
        
    } catch (error) {
        console.error('Erro ao tocar som Wii U:', error);
    }
}

function playWiiUSelectSound() {
    if (!audioUnlocked || !audioCtx) return;
    
    try {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        // Criar dois osciladores para som mais rico
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        
        // Configurar filtro
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        // Configurar envelope
        const now = audioCtx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        // Configurar osciladores 
        osc1.type = 'sine';
        osc2.type = 'triangle'; // Adiciona harmônicos suaves
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc2.frequency.setValueAtTime(659.25, now); // E5 (quinta acima)
        
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 15;
        lfoGain.gain.value = 5;
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);
        
        // Conectar
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // Iniciar
        lfo.start();
        osc1.start(now);
        osc2.start(now);
        
        // Parar
        osc1.stop(now + 0.15);
        osc2.stop(now + 0.15);
        lfo.stop(now + 0.15);
        
    } catch (error) {
        console.error('Erro ao tocar som de seleção:', error);
    }
}

function injectWidgetHTML() {
    const widgetHTML = `
        <div id="clockWidgetOverlay" class="clock-widget-overlay">
            <div class="clock-widget-window">
                <div class="widget-header">
                    <span>Relógio Virtual</span>
                    <button class="xp-close" onclick="closeClockWidget()">✕</button>
                </div>

                <div class="widget-content">
                    <div class="dog-display">
                        <img id="current-dog" src="assets/dog1.jpg" alt="Pet atual">
                    </div>

                    <div class="pet-selector">
                        <div class="arrow left" onclick="scrollPet(-1)">◀</div>

                        <div class="pet-viewport">
                            <div class="pet-track" id="petTrack">
                                <img src="assets/dog1.jpg" data-pet="dog1.jpg">
                                <img src="assets/dog2.jpg" data-pet="dog2.jpg">
                                <img src="assets/dog3.jpg" data-pet="dog3.jpg">
                                <img src="assets/dog4.jpg" data-pet="dog4.jpg">
                                <img src="assets/dog5.jpg" data-pet="dog5.jpg">
                                <img src="assets/dog6.jpg" data-pet="dog6.jpg">
                            </div>
                        </div>

                        <div class="arrow right" onclick="scrollPet(1)">▶</div>
                    </div>

                    <div class="analog-clock">
                        <div class="hand hour"></div>
                        <div class="hand minute"></div>
                        <div class="hand second"></div>
                        <div class="clock-center"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
}

function openClockWidget() {
    const overlay = document.getElementById('clockWidgetOverlay');
    overlay.style.display = 'flex';

    updateAnalogClock();
    initPetSlider();
    playWiiUSelectSound(); // Som ao abrir
}

function closeClockWidget() {
    const overlay = document.getElementById('clockWidgetOverlay');
    if (overlay) {
        playWiiUSelectSound(); // Som ao fechar
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 150);
    }
}

// Relogio analógico
function updateAnalogClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const secondHand = document.querySelector('.hand.second');
    const minuteHand = document.querySelector('.hand.minute');
    const hourHand   = document.querySelector('.hand.hour');

    if (secondHand && minuteHand && hourHand) {
        const secondDegrees = seconds * 6;
        const minuteDegrees = minutes * 6 + seconds * 0.1;
        const hourDegrees   = (hours % 12) * 30 + minutes * 0.5;

        secondHand.style.transform = `rotate(${secondDegrees - 90}deg)`;
        minuteHand.style.transform = `rotate(${minuteDegrees - 90}deg)`;
        hourHand.style.transform   = `rotate(${hourDegrees - 90}deg)`;
    }

    setTimeout(updateAnalogClock, 1000);
}


// Slide do Pet
function initPetSlider() {
    const track = document.getElementById('petTrack');
    const viewport = document.querySelector('.pet-viewport');
    if (!track || !viewport) return;

    isDragging = false;
    currentScroll = 0;
    lastStep = 0;
    track.style.transform = 'translateX(0px)';

    viewport.onpointerdown = null;
    viewport.onpointermove = null;
    viewport.onpointerup = null;
    viewport.onpointercancel = null;

    viewport.onpointerdown = onPointerDown;
    viewport.onpointermove = onPointerMove;
    viewport.onpointerup = onPointerUp;
    viewport.onpointercancel = onPointerUp;
}

function onPointerDown(e) {
    isDragging = true;
    startX = e.clientX;
    lastStep = Math.round(Math.abs(currentScroll) / STEP_WIDTH);
    
    // Tocar som suave ao iniciar arrasto
    playWiiUScrollSound(0);

    try { 
        e.currentTarget.setPointerCapture(e.pointerId); 
    } catch (error) {
        console.warn('setPointerCapture não suportado:', error);
    }
}

function onPointerMove(e) {
    if (!isDragging) return;

    const delta = e.clientX - startX;
    const scroll = currentScroll + delta;
    const track = document.getElementById('petTrack');
    if (track) {
        track.style.transform = `translateX(${scroll}px)`;
        
        const currentStep = Math.round(Math.abs(scroll) / STEP_WIDTH);
        if (currentStep !== lastStep) {
            const direction = delta > 0 ? 1 : -1;
            playWiiUScrollSound(direction);
            lastStep = currentStep;
        }
    }
}

function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;

    const track = document.getElementById('petTrack');
    if (!track) return;
    
    const maxScroll = 0;
    const minScroll = -(track.children.length - 1) * STEP_WIDTH;

    currentScroll = Math.min(
        maxScroll,
        Math.max(minScroll, currentScroll + (e.clientX - startX))
    );

    track.style.transform = `translateX(${currentScroll}px)`;
    updateSelectedPet();
    
    // Tocar som de confirmação ao soltar
    playWiiUSelectSound();
}

function scrollPet(direction) {
    const track = document.getElementById('petTrack');
    if (!track) return;
    
    const maxScroll = 0;
    const minScroll = -(track.children.length - 1) * STEP_WIDTH;
    
    currentScroll = Math.min(
        maxScroll,
        Math.max(minScroll, currentScroll + (STEP_WIDTH * direction))
    );
    
    track.style.transform = `translateX(${currentScroll}px)`;
    
    // Tocar som com direção
    playWiiUScrollSound(direction);
    
    // Tocar som de seleção após um delay
    setTimeout(() => {
        updateSelectedPet();
        playWiiUSelectSound();
    }, 100);
}

// Um pequeno PET fofo
function updateSelectedPet() {
    const track = document.getElementById('petTrack');
    const currentDog = document.getElementById('current-dog');
    
    if (!track || !currentDog) return;
    
    const index = Math.round(Math.abs(currentScroll) / STEP_WIDTH);
    const img = track.children[index];
    
    if (img) {
        currentDog.src = img.src;
    }
}
