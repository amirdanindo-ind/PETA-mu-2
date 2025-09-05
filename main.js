import { modules, simulations, videos } from './data.js';

const appContainer = document.getElementById('app-container');

// --- Language & State Management ---
let currentLang = 'en';
let currentView = {
    render: () => renderWelcomeScreen(), // Default view
};

function t(translatable) {
    if (typeof translatable === 'string' || !translatable) {
        return translatable;
    }
    return translatable[currentLang] || translatable['en'];
}

function setView(renderFunc, ...args) {
    currentView = {
        render: () => renderFunc(...args),
    };
    currentView.render();
}

function setupLangSwitcher() {
    const switcher = document.querySelector('.lang-switcher');
    if (!switcher) return;

    switcher.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const newLang = e.target.dataset.lang;
            if (newLang !== currentLang) {
                currentLang = newLang;
                // Update active button
                switcher.querySelector('.active').classList.remove('active');
                switcher.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));
                e.target.classList.add('active');
                e.target.setAttribute('aria-pressed','true');
                // Re-render current view with new language
                currentView.render();
            }
        }
    });
}

// --- Sound Effects ---
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let waterBuffer, sprinklerBuffer, switchBuffer;

async function loadSound(url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
    } catch (e) {
        console.error(`Failed to load sound: ${url}`, e);
        return null;
    }
}

async function setupSounds() {
    waterBuffer = await loadSound('water-sound.mp3');
    sprinklerBuffer = await loadSound('sprinkler-sound.mp3');
    switchBuffer = await loadSound('light-switch.mp3');
}

function playSound(buffer) {
    if (!buffer || audioContext.state === 'suspended') return;
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

// --- Views Rendering ---

function renderWelcomeScreen() {
    const readingModules = modules.filter(m => m.type === 'lessons' || m.type === 'quiz');
    const headerTitle = document.querySelector('header h1');
    const headerSubtitle = document.querySelector('header p');
    headerTitle.textContent = "PETAMU";
    headerSubtitle.textContent = t({en: "Exploring the Future of Farming and Technology", id: "Menjelajahi Masa Depan Pertanian dan Teknologi"});

    appContainer.innerHTML = `
        <div class="welcome-screen">
            <section class="intro-section">
                <div class="intro-content">
                    <h1>${t({en: "Welcome to PETAMU!", id: "Selamat Datang di PETAMU!"})}</h1>
                    <p>${t({en: "Your journey into the exciting world of Agricultural Technology starts here. Explore interactive lessons, watch engaging videos, and test your skills in our fun simulations to discover the future of farming.", id: "Perjalananmu ke dunia Teknologi Pertanian yang menarik dimulai di sini. Jelajahi pelajaran interaktif, tonton video menarik, dan uji keterampilanmu dalam simulasi seru kami untuk menemukan masa depan pertanian."})}</p>
                    <button class="intro-button" id="start-exploring-btn">${t({en: "Start Exploring", id: "Mulai Menjelajah"})}</button>
                </div>
            </section>
            <section class="welcome-section" id="reading-modules">
                <h2>${t({en: "Reading Modules", id: "Modul Bacaan"})}</h2>
                <div class="modules-grid">
                    ${readingModules.map(module => `
                        <div class="module-card" data-module-id="${module.id}">
                             <img src="${module.icon}" alt="${t(module.title)}" loading="lazy" width="100" height="100">
                            <div class="module-card-content">
                                <h3>${t(module.title)}</h3>
                                <p>${t(module.description)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>

            <section class="welcome-section" id="video-content">
                <h2>${t({en: "Videos", id: "Video"})}</h2>
                <div class="content-grid">
                    ${videos.map(video => `
                        <div class="module-card" data-video-id="${video.id}">
                            <img class="video-card" src="${video.thumbnail}" alt="${t(video.title)}" loading="lazy">
                            <div class="module-card-content">
                                <h3>${t(video.title)}</h3>
                                <p>${t(video.description)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>

            <section class="welcome-section" id="simulations">
                <h2>${t({en: "Fun Simulations", id: "Simulasi Seru"})}</h2>
                <div class="modules-grid">
                     ${simulations.map(sim => `
                        <div class="module-card" data-module-id="${sim.id}">
                            <img src="${sim.icon}" alt="${t(sim.title)}" loading="lazy" width="100" height="100">
                            <div class="module-card-content">
                                <h3>${t(sim.title)}</h3>
                                <p>${t(sim.description)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        </div>
    `;

    document.getElementById('start-exploring-btn').addEventListener('click', () => {
        document.getElementById('reading-modules').scrollIntoView({ behavior: 'smooth' });
    });

    // Event Listeners for Module/Sim cards
    document.querySelectorAll('.module-card[data-module-id]').forEach(card => {
        card.addEventListener('click', () => {
            // Resume audio context on user gesture
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }

            const moduleId = card.dataset.moduleId;
            const module = [...modules, ...simulations].find(m => m.id === moduleId);
            if (!module) return;

            switch (module.type) {
                case 'lessons':
                    setView(renderLessonView, moduleId);
                    break;
                case 'quiz':
                    setView(renderQuizView, moduleId);
                    break;
                case 'simulation':
                    if (moduleId === 'sifma') {
                        setView(renderSifmaView, moduleId);
                    } else if (moduleId === 'agri-precision-planner') {
                        setView(renderAPPView, moduleId);
                    } else if (moduleId === 'agritech-forge') {
                        setView(renderAgriTechForgeView, moduleId);
                    } else if (moduleId === 'hydro-tomato') {
                        setView(renderHydroTomatoView, moduleId);
                    } else {
                        setView(renderSimulationView, moduleId);
                    }
                    break;
                default:
                    setView(renderWelcomeScreen);
            }
        });
    });

    // Event Listeners for Video cards
    document.querySelectorAll('.module-card[data-video-id]').forEach(card => {
        card.addEventListener('click', () => {
            const videoId = card.dataset.videoId;
            const video = videos.find(v => v.id === videoId);
            if(video) {
                openVideoModal(video.videoId);
            }
        });
    });
}

function openVideoModal(videoId) {
    const modal = document.getElementById('video-modal');
    const videoPlayerContainer = document.getElementById('video-player-container');

    videoPlayerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

    modal.style.display = "block";

    const closeBtn = modal.querySelector('.close-button');
    closeBtn.onclick = () => closeModal(modal, videoPlayerContainer);

    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal(modal, videoPlayerContainer);
        }
    }
}

function closeModal(modal, playerContainer) {
    modal.style.display = "none";
    playerContainer.innerHTML = ""; // Stop the video by removing the iframe
}

function renderLessonView(moduleId) {
    const module = modules.find(m => m.id === moduleId);
    if (!module) {
        setView(renderWelcomeScreen);
        return;
    }

    appContainer.innerHTML = `
        <div class="lesson-view">
            <button class="back-button">&larr; ${t({en: "Back to Modules", id: "Kembali ke Modul"})}</button>
            <h2>${t(module.title)}</h2>
            <ul class="lesson-list">
                ${module.lessons.map(lesson => `
                    <li class="lesson-item" data-module-id="${moduleId}" data-lesson-id="${lesson.id}">
                        <h4>${t(lesson.title)}</h4>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    document.querySelector('.back-button').addEventListener('click', () => setView(renderWelcomeScreen));

    document.querySelectorAll('.lesson-item').forEach(item => {
        item.addEventListener('click', () => {
            setView(renderContentView, item.dataset.moduleId, item.dataset.lessonId);
        });
    });
}

function renderContentView(moduleId, lessonId) {
    const module = modules.find(m => m.id === moduleId);
    const lesson = module ? module.lessons.find(l => l.id === lessonId) : null;

    if (!lesson) {
        setView(renderWelcomeScreen);
        return;
    }

    appContainer.innerHTML = `
        <div class="content-view">
            <button class="back-button">&larr; ${t({en: "Back to Lessons", id: "Kembali ke Pelajaran"})}</button>
            <h3>${t(lesson.title)}</h3>
            <div class="lesson-content">
                ${t(lesson.content)}
            </div>
        </div>
    `;

    const hasVideo = !!lesson.videoId;
    const hasPdf = !!lesson.pdfUrl;

    // Create a container for resource buttons (Video and PDF)
    if (hasVideo || hasPdf) {
        const resourcesContainer = document.createElement('div');
        resourcesContainer.className = 'content-resources';

        if (hasVideo) {
            const videoButton = document.createElement('button');
            videoButton.className = 'sim-button video-button';
            videoButton.innerHTML = `🎬 ${t({en: 'Watch Associated Video', id: 'Tonton Video Terkait'})}`;
            videoButton.addEventListener('click', () => {
                openVideoModal(lesson.videoId);
            });
            resourcesContainer.appendChild(videoButton);
        }

        if (hasPdf) {
            const pdfButton = document.createElement('a');
            pdfButton.className = 'sim-button';
            pdfButton.href = lesson.pdfUrl;
            pdfButton.target = '_blank';
            if (lesson.pdfUrl !== '#') {
                pdfButton.setAttribute('download', '');
            }
            pdfButton.innerHTML = `📄 ${t(lesson.pdf) || t({en: "Download PDF", id: "Unduh PDF"})}`;
            resourcesContainer.appendChild(pdfButton);
        }

        const contentDiv = appContainer.querySelector('.lesson-content');
        if (contentDiv) {
            contentDiv.parentElement.insertBefore(resourcesContainer, contentDiv);
        }
    }

    document.querySelector('.back-button').addEventListener('click', () => {
        setView(renderLessonView, moduleId);
    });
}

function renderQuizView(moduleId) {
    const module = modules.find(m => m.id === moduleId);
    if (!module) {
        setView(renderWelcomeScreen);
        return;
    }

    const quiz = module.quiz;

    appContainer.innerHTML = `
        <div class="quiz-view">
            <button class="back-button">&larr; ${t({en: "Back to Modules", id: "Kembali ke Modul"})}</button>
            <h2>${t(quiz.title)}</h2>
            <p>${t(quiz.description)}</p>
            <form class="quiz-form" id="quiz-form">
                ${quiz.questions.map((q, index) => `
                    <div class="question-block">
                        <p>${index + 1}. ${t(q.question)}</p>
                        <ul class="answers-list">
                            ${q.answers.map((answer, i) => `
                                <li>
                                    <input type="radio" name="question-${index}" id="q${index}a${i}" value="${i}">
                                    <label for="q${index}a${i}">${t(answer)}</label>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
                <button type="submit" class="submit-quiz">${t({en: "Submit Answers", id: "Kirim Jawaban"})}</button>
            </form>
            <div id="quiz-results"></div>
        </div>
    `;

    document.querySelector('.back-button').addEventListener('click', () => setView(renderWelcomeScreen));

    document.getElementById('quiz-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        let score = 0;
        quiz.questions.forEach((q, index) => {
            const userAnswer = formData.get(`question-${index}`);
            if (userAnswer !== null && parseInt(userAnswer) === q.correctAnswer) {
                score++;
            }
        });

        const resultsContainer = document.getElementById('quiz-results');
        const totalQuestions = quiz.questions.length;
        resultsContainer.innerHTML = `${t({en: "You scored", id: "Skor Anda"})} ${score} ${t({en: "out of", id: "dari"})} ${totalQuestions}!`;
        resultsContainer.className = (score / totalQuestions) >= 0.7 ? 'correct' : 'incorrect';
    });
}

function renderSimulationView(moduleId) {
    const simModule = simulations.find(s => s.id === moduleId);
    if (!simModule) {
        setView(renderWelcomeScreen);
        return;
    }

    const sim = simModule.simulation;

    appContainer.innerHTML = `
        <div class="simulation-view">
            <button class="back-button">&larr; ${t({en: "Back to Modules", id: "Kembali ke Modul"})}</button>
            <h2>${t(sim.title)}</h2>
            <div class="simulation-container">
                <p>${t(sim.description)}</p>
                <div id="crop-grid"></div>
                <div id="sim-controls">
                    <button id="next-day-btn" class="sim-button">${t({en: "Next Day", id: "Hari Berikutnya"})}</button>
                </div>
                <div id="sim-status">${t({en: "Day:", id: "Hari:"})} 1 | ${t({en: "Healthy Crops:", id: "Tanaman Sehat:"})} 0/16</div>
            </div>
        </div>
    `;

    document.querySelector('.back-button').addEventListener('click', () => setView(renderWelcomeScreen));

    const cropGrid = document.getElementById('crop-grid');
    const nextDayBtn = document.getElementById('next-day-btn');
    const simStatus = document.getElementById('sim-status');

    let day = 1;
    const CROP_COUNT = 16;
    let cropStates = Array(CROP_COUNT).fill('healthy'); // 'healthy', 'thirsty', 'overwatered'
    let gameWon = false;

    function initializeCrops() {
        for(let i = 0; i < CROP_COUNT; i++) {
            cropStates[i] = Math.random() > 0.4 ? 'healthy' : 'thirsty';
        }
        renderCrops();
    }

    function renderCrops() {
        if (!cropGrid) return;
        cropGrid.innerHTML = '';
        let healthyCount = 0;
        cropStates.forEach((state, index) => {
            const plot = document.createElement('div');
            plot.className = `crop-plot ${state}`;
            plot.dataset.index = index;
            let emoji = '';
            if (state === 'healthy') {
                emoji = '🌱';
                healthyCount++;
            } else if (state === 'thirsty') {
                emoji = '🌵';
            } else {
                emoji = '💧';
            }
            plot.textContent = emoji;
            plot.addEventListener('click', () => waterCrop(index, plot));
            cropGrid.appendChild(plot);
        });
        simStatus.textContent = `${t({en: "Day:", id: "Hari:"})} ${day} | ${t({en: "Healthy Crops:", id: "Tanaman Sehat:"})} ${healthyCount}/${CROP_COUNT}`;

        if (healthyCount === CROP_COUNT && !gameWon) {
            gameWon = true;
            simStatus.textContent += ` - 🎉 ${t({en: "Perfect Harvest! You won!", id: "Panen Sempurna! Anda menang!"})} 🎉`;
            nextDayBtn.disabled = true;
            nextDayBtn.style.opacity = '0.5';
        }
    }

    function waterCrop(index, plotElement) {
        if (gameWon) return;

        // Play sound and animation
        playSound(waterBuffer);
        const waterDrop = document.createElement('div');
        waterDrop.className = 'water-animation';
        waterDrop.textContent = '💧';
        plotElement.appendChild(waterDrop);
        waterDrop.addEventListener('animationend', () => waterDrop.remove());

        if (cropStates[index] === 'thirsty') {
            cropStates[index] = 'healthy';
        } else if (cropStates[index] === 'healthy') {
            cropStates[index] = 'overwatered';
        }
        // Clicking overwatered does nothing

        // Use a short timeout to let the animation start before re-rendering
        setTimeout(renderCrops, 100);
    }

    nextDayBtn.addEventListener('click', () => {
        if (gameWon) return;
        day++;
        cropStates.forEach((state, index) => {
            // Natural progression of crops
            if (state === 'healthy') {
                // Healthy crops get thirsty over time
                if (Math.random() > 0.2) { // 80% chance
                    cropStates[index] = 'thirsty';
                }
            } else if (state === 'overwatered') {
                // Overwatered crops recover
                cropStates[index] = 'healthy';
            }
            // Thirsty crops remain thirsty
        });
        renderCrops();
    });

    initializeCrops();
}

function renderSifmaView(moduleId) {
    const simModule = simulations.find(s => s.id === moduleId);
    if (!simModule) {
        setView(renderWelcomeScreen);
        return;
    }

    const sim = simModule.simulation;

    appContainer.innerHTML = `
        <div class="sifma-view">
            <button class="back-button">&larr; ${t({en: "Back to Modules", id: "Kembali ke Modul"})}</button>
            <h2>${t(sim.title)}</h2>
            <p>${t(sim.description)}</p>
            <div class="sifma-dashboard">
                <div class="sifma-main-display">
                    <div id="sifma-sky"></div>
                    <div id="sifma-plant">🌿</div>
                     <div id="sifma-sprinkler" class="hidden">💦</div>
                </div>
                <div class="sifma-readouts">
                    <div class="readout-card" id="temp-card">
                        <div class="readout-header">🌡️ ${t({en: "Temperature", id: "Suhu"})}</div>
                        <div class="readout-value" id="temp-value">-- °C</div>
                    </div>
                    <div class="readout-card" id="humidity-card">
                        <div class="readout-header">💧 ${t({en: "Air Humidity", id: "Kelembaban Udara"})}</div>
                        <div class="readout-value" id="humidity-value">-- %</div>
                    </div>
                    <div class="readout-card" id="soil-card">
                        <div class="readout-header">🌱 ${t({en: "Soil Moisture", id: "Kelembaban Tanah"})}</div>
                        <div class="readout-value" id="soil-value">-- %</div>
                    </div>
                    <div class="readout-card" id="light-card">
                         <div class="readout-header">☀️ ${t({en: "Light Level", id: "Tingkat Cahaya"})}</div>
                        <div class="readout-value" id="light-value">-- lux</div>
                    </div>
                </div>
                <div class="sifma-controls">
                    <div class="control-group">
                        <h4>${t({en: "Irrigation", id: "Irigasi"})}</h4>
                        <button class="sim-button" id="sprinkler-btn">${t({en: "Sprinkler Off", id: "Penyiram Mati"})}</button>
                        <label class="switch">
                            <input type="checkbox" id="auto-sprinkler-toggle" checked>
                            <span class="slider round"></span>
                        </label>
                        <span>Auto</span>
                    </div>
                    <div class="control-group">
                        <h4>${t({en: "Lighting", id: "Pencahayaan"})}</h4>
                        <button class="sim-button" id="light-btn">${t({en: "Light Off", id: "Lampu Mati"})}</button>
                         <label class="switch">
                            <input type="checkbox" id="auto-light-toggle" checked>
                            <span class="slider round"></span>
                        </label>
                        <span>Auto</span>
                    </div>
                     <div class="control-group">
                        <h4>${t({en: "Help", id: "Bantuan"})}</h4>
                        <button class="sim-button" id="sifma-help-btn">? ${t({en: "Help", id: "Bantuan"})}</button>
                    </div>
                </div>
                <div class="sifma-log">
                    <h4>${t({en: "System Log", id: "Log Sistem"})}</h4>
                    <ul id="sifma-log-list"></ul>
                </div>
            </div>
        </div>
    `;

    document.querySelector('.back-button').addEventListener('click', () => {
        clearInterval(gameLoop);
        setView(renderWelcomeScreen);
    });

    // Modal Logic
    const infoModal = document.getElementById('sifma-info-modal');
    const helpBtn = document.getElementById('sifma-help-btn');
    const closeBtn = document.getElementById('sifma-info-close');
    helpBtn.onclick = () => infoModal.style.display = 'block';
    closeBtn.onclick = () => infoModal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == infoModal) {
            infoModal.style.display = "none";
        }
    }

    const state = {
        time: 0,
        temp: 22,
        humidity: 55,
        soilMoisture: 60,
        light: 800,
        isDay: true,
        sprinklerOn: false,
        lightOn: false,
        autoSprinkler: true,
        autoLight: true,
    };

    const ui = {
        plant: document.getElementById('sifma-plant'),
        sky: document.getElementById('sifma-sky'),
        sprinkler: document.getElementById('sifma-sprinkler'),
        log: document.getElementById('sifma-log-list'),
        temp: { card: document.getElementById('temp-card'), value: document.getElementById('temp-value') },
        humidity: { card: document.getElementById('humidity-card'), value: document.getElementById('humidity-value') },
        soil: { card: document.getElementById('soil-card'), value: document.getElementById('soil-value') },
        light: { card: document.getElementById('light-card'), value: document.getElementById('light-value') },
        sprinklerBtn: document.getElementById('sprinkler-btn'),
        lightBtn: document.getElementById('light-btn'),
        autoSprinklerToggle: document.getElementById('auto-sprinkler-toggle'),
        autoLightToggle: document.getElementById('auto-light-toggle'),
    };

    let lastSprinklerSoundTime = 0;

    function addLog(message, type = 'info') {
        const li = document.createElement('li');
        li.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        li.classList.add(`log-${type}`);
        ui.log.prepend(li);
        if (ui.log.children.length > 10) {
            ui.log.lastChild.remove();
        }
    }

    function updateState() {
        state.time += 1;

        // Simulate day/night cycle
        const dayCycle = Math.sin(state.time / 50); // Slower cycle
        state.isDay = dayCycle > -0.2;
        state.light = state.isDay ? Math.max(0, Math.round(dayCycle * 1000 + 300)) : 0;
        if(state.lightOn) state.light += 400;

        // Simulate temperature
        state.temp += (state.isDay ? 0.1 : -0.15) + (Math.random() - 0.5) * 0.5;
        state.temp = Math.max(5, Math.min(45, state.temp));

        // Simulate humidity and soil moisture
        state.humidity += (Math.random() - 0.5) * 2;
        state.soilMoisture -= (0.1 + state.temp / 200); // Dries faster when hot
        if(state.sprinklerOn) {
            state.soilMoisture += 1.5;
            state.humidity += 0.8;

            // Play sprinkler sound periodically
            const now = Date.now();
            if (now - lastSprinklerSoundTime > 3000) { // every 3 seconds
                 playSound(sprinklerBuffer);
                 lastSprinklerSoundTime = now;
            }
        }
        state.soilMoisture = Math.max(0, Math.min(100, state.soilMoisture));
        state.humidity = Math.max(10, Math.min(99, state.humidity));

        // Automation logic
        if(state.autoSprinkler) {
            if (state.soilMoisture < 30 && !state.sprinklerOn) {
                state.sprinklerOn = true;
                addLog(t({en: "Low soil moisture detected. Starting irrigation.", id: "Kelembaban tanah rendah terdeteksi. Memulai irigasi."}), "auto");
            } else if (state.soilMoisture > 80 && state.sprinklerOn) {
                state.sprinklerOn = false;
                addLog(t({en: "Soil moisture optimal. Stopping irrigation.", id: "Kelembaban tanah optimal. Menghentikan irigasi."}), "auto");
            }
        }
        if(state.autoLight) {
            if (!state.isDay && !state.lightOn) {
                state.lightOn = true;
                addLog(t({en: "It's dark. Turning on grow light.", id: "Hari sudah gelap. Menyalakan lampu pertumbuhan."}), "auto");
            } else if (state.isDay && state.lightOn) {
                state.lightOn = false;
                addLog(t({en: "It's daytime. Turning off grow light.", id: "Sudah siang. Mematikan lampu pertumbuhan."}), "auto");
            }
        }
    }

    function render() {
        // Update readouts
        ui.temp.value.textContent = `${state.temp.toFixed(1)} °C`;
        ui.humidity.value.textContent = `${state.humidity.toFixed(0)} %`;
        ui.soil.value.textContent = `${state.soilMoisture.toFixed(0)} %`;
        ui.light.value.textContent = `${state.light.toFixed(0)} lux`;

        // Update visual warnings
        updateCardWarning(ui.temp.card, state.temp, 15, 30);
        updateCardWarning(ui.humidity.card, state.humidity, 40, 70);
        updateCardWarning(ui.soil.card, state.soilMoisture, 30, 80);
        updateCardWarning(ui.light.card, state.light, 200, 1200);

        // Update main display
        ui.sky.className = state.isDay ? 'sky-day' : 'sky-night';
        if (state.lightOn) ui.sky.classList.add('light-on');

        if (state.soilMoisture < 20) ui.plant.textContent = '🥀'; // Wilting
        else if (state.soilMoisture < 40) ui.plant.textContent = '🌱'; // Needs water
        else ui.plant.textContent = '🌿'; // Healthy

        if(state.temp < 10 || state.temp > 35) ui.plant.textContent = '🥵';

        // Update controls
        ui.sprinkler.classList.toggle('hidden', !state.sprinklerOn);
        ui.sprinklerBtn.textContent = state.sprinklerOn ? t({en: "Sprinkler On", id: "Penyiram Nyala"}) : t({en: "Sprinkler Off", id: "Penyiram Mati"});
        ui.sprinklerBtn.classList.toggle('active', state.sprinklerOn);

        ui.lightBtn.textContent = state.lightOn ? t({en: "Light On", id: "Lampu Nyala"}) : t({en: "Light Off", id: "Lampu Mati"});
        ui.lightBtn.classList.toggle('active', state.lightOn);
    }

    function updateCardWarning(card, value, min, max) {
        card.classList.remove('warning', 'danger');
        if (value < min || value > max) {
            card.classList.add('warning');
        }
    }

    function setupEventListeners() {
        ui.sprinklerBtn.addEventListener('click', () => {
            state.sprinklerOn = !state.sprinklerOn;
            state.autoSprinkler = false;
            ui.autoSprinklerToggle.checked = false;
            addLog(`${t({en: "Sprinkler manually turned", id: "Penyiram diubah manual menjadi"})} ${state.sprinklerOn ? t({en: 'ON', id: 'NYALA'}) : t({en: 'OFF', id: 'MATI'})}.`, 'manual');
            if(state.sprinklerOn) playSound(sprinklerBuffer);
        });
        ui.lightBtn.addEventListener('click', () => {
            state.lightOn = !state.lightOn;
            state.autoLight = false;
            ui.autoLightToggle.checked = false;
            addLog(`${t({en: "Grow light manually turned", id: "Lampu pertumbuhan diubah manual menjadi"})} ${state.lightOn ? t({en: 'ON', id: 'NYALA'}) : t({en: 'OFF', id: 'MATI'})}.`, 'manual');
            playSound(switchBuffer);
        });
        ui.autoSprinklerToggle.addEventListener('change', (e) => {
            state.autoSprinkler = e.target.checked;
            addLog(`${t({en: "Auto-sprinkler", id: "Penyiram-otomatis"})} ${state.autoSprinkler ? t({en: 'enabled', id: 'diaktifkan'}) : t({en: 'disabled', id: 'dinonaktifkan'})}.`, 'info');
        });
        ui.autoLightToggle.addEventListener('change', (e) => {
            state.autoLight = e.target.checked;
            addLog(`${t({en: "Auto-light", id: "Lampu-otomatis"})} ${state.autoLight ? t({en: 'enabled', id: 'diaktifkan'}) : t({en: 'disabled', id: 'dinonaktifkan'})}.`, 'info');
        });
    }

    addLog(t({en: 'SifMA system initialized.', id: 'Sistem SifMA diinisialisasi.'}), 'info');
    setupEventListeners();
    const gameLoop = setInterval(() => {
        updateState();
        render();
    }, 1500);
}

function renderAgriTechForgeView(moduleId) {
    const simModule = simulations.find(s => s.id === moduleId);
    if (!simModule) {
        setView(renderWelcomeScreen);
        return;
    }
    const sim = simModule.simulation;

    appContainer.innerHTML = `
        <div class="forge-view">
            <button class="back-button">&larr; ${t({en: "Back to Modules", id: "Kembali ke Modul"})}</button>
            <h2>${t(sim.title)}</h2>
            <div class="forge-mission-brief">
                <h3 id="forge-mission-title"></h3>
                <p id="forge-mission-desc"></p>
            </div>
            <div class="forge-dashboard">
                <div class="forge-inventory-container">
                    <h4><span class="icon">🧰</span> ${t({en: 'Component Bay', id: 'Komponen'})}</h4>
                    <div id="forge-inventory"></div>
                </div>
                <div class="forge-workbench-container">
                    <h4><span class="icon">🛠️</span> ${t({en: 'Assembly Workbench', id: 'Meja Rakit'})}</h4>
                    <div id="forge-workbench" class="drop-zone">
                        <p class="placeholder-text">${t({en: 'Drag components here', id: 'Seret komponen ke sini'})}</p>
                    </div>
                    <button id="forge-reset-btn" class="sim-button reset-btn">${t({en: 'Clear Workbench', id: 'Kosongkan Meja'})}</button>
                </div>
                <div class="forge-testing-container">
                    <h4><span class="icon">🔬</span> ${t({en: 'Testing & Logs', id: 'Uji & Log'})}</h4>
                    <div id="forge-test-rig">
                         <div class="device-casing">
                            <div class="device-screen" id="device-screen">...</div>
                         </div>
                    </div>
                    <button id="forge-test-btn" class="sim-button" disabled>${t({en: 'Test Prototype', id: 'Uji Prototipe'})}</button>
                    <ul id="forge-log"></ul>
                </div>
            </div>
        </div>
    `;

    document.querySelector('.back-button').addEventListener('click', () => setView(renderWelcomeScreen));

    const state = {
        mission: {
            id: 'moisture-sensor',
            title: {en: 'Mission: Basic Soil Sensor', id: 'Misi: Sensor Tanah Dasar'},
            description: {en: 'A local farmer needs a simple, reliable device to monitor soil moisture. Drag the correct components to the workbench to assemble a prototype.', id: 'Seorang petani lokal membutuhkan perangkat sederhana untuk memantau kelembaban tanah. Seret komponen yang benar ke meja rakit untuk membuat prototipe.'},
            requiredComponents: ['mcu', 'probe', 'battery', 'casing'],
        },
        inventory: [
            { id: 'mcu', name: {en: 'Microcontroller', id: 'Mikrokontroler'}, icon: '🧠' },
            { id: 'probe', name: {en: 'Moisture Probe', id: 'Probe Kelembaban'}, icon: '🌡️' },
            { id: 'battery', name: {en: 'Power Source', id: 'Sumber Daya'}, icon: '🔋' },
            { id: 'casing', name: {en: 'Protective Casing', id: 'Casing Pelindung'}, icon: '📦' },
            { id: 'gps', name: {en: 'GPS Module', id: 'Modul GPS'}, icon: '🛰️' }, // Red herring
            { id: 'camera', name: {en: 'Camera Module', id: 'Modul Kamera'}, icon: '📷' }, // Red herring
        ],
        workbench: [],
        log: [],
    };

    const missionTitle = document.getElementById('forge-mission-title');
    const missionDesc = document.getElementById('forge-mission-desc');
    const inventoryDiv = document.getElementById('forge-inventory');
    const workbenchDiv = document.getElementById('forge-workbench');
    const testBtn = document.getElementById('forge-test-btn');
    const resetBtn = document.getElementById('forge-reset-btn');
    const logUl = document.getElementById('forge-log');
    const deviceScreen = document.getElementById('device-screen');

    function addLog(message, type = 'info') {
        state.log.unshift({ message, type });
        if (state.log.length > 5) state.log.pop();
        renderLog();
    }

    function renderLog() {
        logUl.innerHTML = state.log.map(item => `<li class="log-${item.type}">${item.message}</li>`).join('');
    }

    function renderInventory() {
        inventoryDiv.innerHTML = '';
        state.inventory.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'component-item';
            itemDiv.dataset.id = item.id;
            itemDiv.draggable = true;
            itemDiv.innerHTML = `<span class="icon">${item.icon}</span> ${t(item.name)}`;
            itemDiv.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', item.id);
                e.target.classList.add('dragging');
            });
            itemDiv.addEventListener('dragend', e => e.target.classList.remove('dragging'));
            inventoryDiv.appendChild(itemDiv);
        });
    }

    function renderWorkbench() {
        workbenchDiv.innerHTML = '';
        if (state.workbench.length === 0) {
            workbenchDiv.innerHTML = `<p class="placeholder-text">${t({en: 'Drag components here', id: 'Seret komponen ke sini'})}</p>`;
        } else {
            state.workbench.forEach(itemId => {
                const item = state.inventory.find(i => i.id === itemId);
                const itemDiv = document.createElement('div');
                itemDiv.className = 'component-item workbench-item';
                itemDiv.innerHTML = `<span class="icon">${item.icon}</span> ${t(item.name)}`;
                workbenchDiv.appendChild(itemDiv);
            });
        }
        testBtn.disabled = state.workbench.length === 0;
    }

    function checkAssembly() {
        const required = [...state.mission.requiredComponents].sort();
        const assembled = [...state.workbench].sort();

        if (JSON.stringify(required) === JSON.stringify(assembled)) {
            return { success: true, message: t({en: "Assembly correct. Prototype is functional!", id: "Rangkaian benar. Prototipe berfungsi!"}) };
        } else {
            const missing = required.filter(item => !assembled.includes(item));
            const extra = assembled.filter(item => !required.includes(item));

            if (missing.length > 0) {
                return { success: false, message: t({en: "Assembly failed. Missing essential components.", id: "Rangkaian gagal. Komponen penting tidak ada."}) };
            }
            if (extra.length > 0) {
                 return { success: false, message: t({en: "Assembly failed. Unnecessary components included.", id: "Rangkaian gagal. Ada komponen yang tidak perlu."}) };
            }
            return { success: false, message: t({en: "Assembly failed. Incorrect components.", id: "Rangkaian gagal. Komponen salah."}) };
        }
    }

    workbenchDiv.addEventListener('dragover', e => {
        e.preventDefault();
        workbenchDiv.classList.add('drag-over');
    });
     workbenchDiv.addEventListener('dragleave', () => workbenchDiv.classList.remove('drag-over'));
    workbenchDiv.addEventListener('drop', e => {
        e.preventDefault();
        workbenchDiv.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text/plain');
        if (id && !state.workbench.includes(id)) {
            playSound(switchBuffer);
            state.workbench.push(id);
            renderWorkbench();
        }
    });

    resetBtn.addEventListener('click', () => {
        state.workbench = [];
        deviceScreen.textContent = '...';
        deviceScreen.className = 'device-screen';
        addLog(t({en: 'Workbench cleared.', id: 'Meja rakit dikosongkan.'}), 'info');
        renderWorkbench();
    });

    testBtn.addEventListener('click', () => {
        const result = checkAssembly();
        addLog(result.message, result.success ? 'ok' : 'danger');
        deviceScreen.textContent = result.success ? t({en: 'READY', id: 'SIAP'}) : t({en: 'ERROR', id: 'GALAT'});
        deviceScreen.className = `device-screen ${result.success ? 'ok' : 'danger'}`;
        if(result.success) {
            playSound(waterBuffer); // Placeholder for success sound
        }
    });

    // Initial setup
    missionTitle.textContent = t(state.mission.title);
    missionDesc.textContent = t(state.mission.description);
    addLog(t({en: "Engineer, your first mission is ready.", id: "Insinyur, misi pertamamu sudah siap."}), 'info');
    renderInventory();
    renderWorkbench();
}

function renderAPPView(moduleId) {
    const simModule = simulations.find(s => s.id === moduleId);
    if (!simModule) {
        setView(renderWelcomeScreen);
        return;
    }
    const sim = simModule.simulation;

    appContainer.innerHTML = `
        <div class="app-view">
            <button class="back-button">&larr; ${t({en: "Back to Modules", id: "Kembali ke Modul"})}</button>
            <h2>${t(sim.title)}</h2>
            <p>${t(sim.description)}</p>
            <div class="app-dashboard">
                <div id="app-grid-container">
                    <div id="app-grid"></div>
                </div>
                <div id="app-sidebar">
                    <h3>${t({en: "Zone Info", id: "Info Zona"})}</h3>
                    <div id="app-zone-info">
                        <p>${t({en: "Select a zone to see details.", id: "Pilih zona untuk melihat detail."})}</p>
                    </div>
                    <div id="app-actions">
                         <button id="scan-btn" class="sim-button">${t({en: "Scan Field", id: "Pindai Lahan"})}</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('.back-button').addEventListener('click', () => setView(renderWelcomeScreen));

    const grid = document.getElementById('app-grid');
    const zoneInfo = document.getElementById('app-zone-info');
    const scanBtn = document.getElementById('scan-btn');
    const ZONES_X = 5;
    const ZONES_Y = 5;
    const TOTAL_ZONES = ZONES_X * ZONES_Y;
    let zones = [];
    let scanned = false;
    let selectedZone = null;

    function initializeField() {
        grid.innerHTML = '';
        zones = [];
        for (let i = 0; i < TOTAL_ZONES; i++) {
            const zone = {
                id: i,
                soilType: Math.random() < 0.3 ? 'sandy' : 'loam', // sandy, loam
                moisture: Math.floor(Math.random() * 40) + 20, // 20-60
                nutrients: Math.floor(Math.random() * 40) + 20, // 20-60
            };
            zones.push(zone);
            const cell = document.createElement('div');
            cell.className = 'app-grid-cell';
            cell.dataset.id = i;
            cell.style.backgroundColor = `rgba(139, 69, 19, ${zone.soilType === 'sandy' ? 0.4 : 0.7})`;
            cell.addEventListener('click', () => selectZone(i));
            grid.appendChild(cell);
        }
    }

    function selectZone(id) {
        if (!scanned) return;
        selectedZone = zones[id];
        // Remove old selection
        const oldSelected = grid.querySelector('.selected');
        if (oldSelected) oldSelected.classList.remove('selected');
        // Add new selection
        grid.querySelector(`[data-id="${id}"]`).classList.add('selected');
        renderZoneInfo();
    }

    function renderZoneInfo() {
        if (!selectedZone) {
            zoneInfo.innerHTML = `<p>${t({en: "Select a zone to see details.", id: "Pilih zona untuk melihat detail."})}</p>`;
            return;
        }
        const z = selectedZone;
        const moistureStatus = z.moisture < 40 ? `<span class="danger">${t({en: "Low", id: "Rendah"})}</span>` : `<span class="ok">${t({en: "Good", id: "Baik"})}</span>`;
        const nutrientStatus = z.nutrients < 40 ? `<span class="danger">${t({en: "Low", id: "Rendah"})}</span>` : `<span class="ok">${t({en: "Good", id: "Baik"})}</span>`;

        zoneInfo.innerHTML = `
            <h4>${t({en: "Zone", id: "Zona"})} ${z.id + 1}</h4>
            <p><strong>${t({en: "Soil Type", id: "Tipe Tanah"})}:</strong> ${t({en: z.soilType, id: z.soilType === 'sandy' ? 'berpasir' : 'lempung' })}</p>
            <p><strong>${t({en: "Moisture", id: "Kelembaban"})}:</strong> ${z.moisture}% (${moistureStatus})</p>
            <p><strong>${t({en: "Nutrients", id: "Nutrisi"})}:</strong> ${z.nutrients}% (${nutrientStatus})</p>
            <div class="zone-actions">
                <button class="sim-button" onclick="window.applyAction(${z.id}, 'water')">${t({en: "Water", id: "Siram"})}</button>
                <button class="sim-button" onclick="window.applyAction(${z.id}, 'fertilize')">${t({en: "Fertilize", id: "Beri Pupuk"})}</button>
            </div>
        `;
    }

    window.applyAction = (id, action) => {
        const zone = zones.find(z => z.id === id);
        if (!zone) return;

        if (action === 'water') {
            zone.moisture = Math.min(100, zone.moisture + 25);
            playSound(waterBuffer);
        } else if (action === 'fertilize') {
            zone.nutrients = Math.min(100, zone.nutrients + 25);
             playSound(switchBuffer); // Placeholder sound
        }
        renderZone(zone);
        if(selectedZone && selectedZone.id === id) {
            renderZoneInfo();
        }
    };

    function renderZone(zone) {
        const cell = grid.querySelector(`[data-id="${zone.id}"]`);
        // Color based on needs. Red for water, Blue for nutrients, Purple for both.
        const needsWater = zone.moisture < 40;
        const needsNutrients = zone.nutrients < 40;
        let color = 'transparent';
        if (needsWater && needsNutrients) color = 'rgba(128, 0, 128, 0.6)'; // Purple
        else if (needsWater) color = 'rgba(255, 0, 0, 0.6)'; // Red
        else if (needsNutrients) color = 'rgba(0, 0, 255, 0.6)'; // Blue

        cell.style.setProperty('--overlay-color', color);
    }

    scanBtn.addEventListener('click', () => {
        if (scanned) return;
        scanned = true;
        scanBtn.disabled = true;
        scanBtn.style.opacity = '0.5';
        grid.classList.add('scanned');
        zones.forEach(renderZone);
        zoneInfo.innerHTML = `<p>${t({en: "Scan complete! Select a zone to apply water or fertilizer.", id: "Pemindaian selesai! Pilih zona untuk memberi air atau pupuk."})}</p>`;
    });

    initializeField();
}

function renderHydroTomatoView(moduleId) {
    const simModule = simulations.find(s => s.id === moduleId);
    if (!simModule) {
        setView(renderWelcomeScreen);
        return;
    }
    const sim = simModule.simulation;

    appContainer.innerHTML = `
        <div class="simulation-view">
            <button class="back-button">&larr; ${t({en: "Back to Modules", id: "Kembali ke Modul"})}</button>
            <h2>${t(sim.title)}</h2>
            <p>${t(sim.description)}</p>
            <div class="hydro-tomato-dashboard">
                <div id="htt-timeline-container">
                    <h4>${t({en: "Growth Timeline", id: "Linimasa Pertumbuhan"})}</h4>
                    <ul id="htt-timeline"></ul>
                </div>
                <div id="htt-crop-status">
                    <h4>${t({en: "Crop Status: Heirloom Tomato", id: "Status Tanaman: Tomat Pusaka"})}</h4>
                    <div id="htt-plant-visual">🌱</div>
                    <p><strong>${t({en: "Stage", id: "Tahap"})}:</strong> <span id="htt-stage" class="status-value"></span></p>
                    <p><strong>${t({en: "Health", id: "Kesehatan"})}:</strong> <span id="htt-health" class="status-value"></span></p>
                    <p><strong>${t({en: "Progress", id: "Progres"})}:</strong> <span id="htt-progress" class="status-value"></span></p>
                </div>
                <div id="htt-environment">
                    <h4>${t({en: "Environment: Indoor Farm", id: "Lingkungan: Pertanian Dalam Ruangan"})}</h4>
                    <p><strong>${t({en: "Location", id: "Lokasi"})}:</strong> ${t({en:"Singapore (Controlled)", id: "Singapura (Terkontrol)"})}</p>
                    <p><strong>${t({en: "Temperature", id: "Suhu"})}:</strong> <span id="htt-temp" class="status-value"></span></p>
                    <p><strong>${t({en: "Water pH", id: "pH Air"})}:</strong> <span id="htt-ph" class="status-value"></span></p>
                    <p><strong>${t({en: "Light Cycle", id: "Siklus Cahaya"})}:</strong> <span id="htt-light" class="status-value"></span></p>
                </div>
                <div id="htt-technology">
                    <h4>${t({en: "Tech: AI Nutrient System", id: "Teknologi: Sistem Nutrisi AI"})}</h4>
                     <p><strong>${t({en: "Nutrient Mix (NPK)", id: "Campuran Nutrisi (NPK)"})}:</strong> <span id="htt-npk" class="status-value"></span></p>
                     <p><strong>${t({en: "AI Status", id: "Status AI"})}:</strong> <span id="htt-ai-status" class="status-value"></span></p>
                    <div id="htt-controls">
                        <button id="htt-next-btn" class="sim-button">${t({en: "Advance 1 Week", id: "Maju 1 Minggu"})}</button>
                    </div>
                </div>
                <div id="htt-log-container">
                    <h4>${t({en: "System Log", id: "Log Sistem"})}</h4>
                    <ul id="htt-log"></ul>
                </div>
            </div>
        </div>
    `;

    document.querySelector('.back-button').addEventListener('click', () => setView(renderWelcomeScreen));

    const plantVisuals = ['🌱', '🌿', '🌿', '🌸', '🍅', '🏆']; // Seedling, Vegetative, Flowering, Fruiting, Harvest, Win
    const growthStages = [
        { name: {en: "Germination", id:"Penyemaian"}, duration: 2, npk: "2-1-2" },
        { name: {en: "Vegetative", id:"Vegetatif"}, duration: 4, npk: "4-2-3" },
        { name: {en: "Flowering", id:"Berbunga"}, duration: 4, npk: "3-4-4" },
        { name: {en: "Fruiting", id:"Berbuah"}, duration: 6, npk: "2-3-5" },
        { name: {en: "Harvest", id:"Panen"}, duration: 1, npk: "0-0-0" }
    ];

    let state = {
        week: 0,
        stageIndex: 0,
        progressInStage: 0,
        health: 100,
        temp: 24,
        ph: 6.2,
        aiStatus: {en: "Calibrating...", id: "Kalibrasi..."},
        log: [],
        gameOver: false
    };

    const ui = {
        timeline: document.getElementById('htt-timeline'),
        plant: document.getElementById('htt-plant-visual'),
        stage: document.getElementById('htt-stage'),
        health: document.getElementById('htt-health'),
        progress: document.getElementById('htt-progress'),
        temp: document.getElementById('htt-temp'),
        ph: document.getElementById('htt-ph'),
        light: document.getElementById('htt-light'),
        npk: document.getElementById('htt-npk'),
        aiStatus: document.getElementById('htt-ai-status'),
        log: document.getElementById('htt-log'),
        nextBtn: document.getElementById('htt-next-btn')
    };

    function addLog(message, type = 'info') {
        const logMessage = t(message);
        state.log.unshift(`[${t({en:"Wk", id:"Mg"})}${state.week}] ${logMessage}`);
        if(state.log.length > 10) state.log.pop();

        ui.log.innerHTML = state.log.map(item => {
             let itemClass = 'info';
             if (item.includes(t({en:'successful', id:'berhasil'})) || item.includes(t({en:'entered', id:'memasuki'}))) itemClass = 'ok';
             if (item.includes(t({en:'fluctuation', id:'fluktuasi'})) || item.includes(t({en:'drift', id:'pergeseran'}))) itemClass = 'warning';
             if (item.includes(t({en:'suboptimal', id:'sub-optimal'})) || item.includes(t({en:'failure', id:'gagal'}))) itemClass = 'danger';
             return `<li class="log-${itemClass}">${item}</li>`;
        }).join('');
    }

    function update() {
        if(state.gameOver) return;
        state.week++;
        state.progressInStage++;

        // Environmental events
        if (Math.random() < 0.15) { // 15% chance of an event
            const eventType = Math.random();
            if (eventType < 0.5) { // Temp fluctuation
                state.temp += (Math.random() - 0.5) * 5; // Fluctuate up to 2.5C
                addLog({en: `Minor temperature fluctuation detected. AI is adjusting.`, id: `Fluktuasi suhu kecil terdeteksi. AI sedang menyesuaikan.`});
            } else { // pH drift
                state.ph += (Math.random() - 0.5) * 0.4;
                addLog({en: `Water pH drift detected. AI is re-balancing.`, id: `Pergeseran pH air terdeteksi. AI sedang menyeimbangkan kembali.`});
            }
        } else {
             state.temp = 24 + (Math.random() - 0.5) * 0.5; // Drift back to normal
             state.ph = 6.2 + (Math.random() - 0.5) * 0.1;
        }

        // Health checks
        let healthImpact = 0;
        if (state.temp < 20 || state.temp > 28) healthImpact += 5; // Temp stress
        if (state.ph < 5.8 || state.ph > 6.8) healthImpact += 5; // pH stress
        state.health = Math.max(0, state.health - healthImpact);
        if(healthImpact > 0) addLog({en:`Conditions are suboptimal. Plant health decreased.`, id:`Kondisi sub-optimal. Kesehatan tanaman menurun.`});
        else {
             state.health = Math.min(100, state.health + 2); // Recover health in good conditions
        }

        // Stage progression
        const currentStage = growthStages[state.stageIndex];
        if (state.progressInStage >= currentStage.duration) {

            document.querySelector(`.timeline-stage[data-stage="${state.stageIndex}"]`)?.classList.add('completed');

            state.stageIndex++;
            state.progressInStage = 0;
            if (state.stageIndex >= growthStages.length) {
                endGame(true);
            } else {
                 const newStageName = t(currentStage.name);
                 addLog({en:`Plant has entered the ${newStageName} stage.`, id:`Tanaman memasuki tahap ${newStageName}.`});
                 document.querySelector(`.timeline-stage[data-stage="${state.stageIndex}"]`)?.classList.add('active');
                 playSound(switchBuffer); // Sound for stage change
            }
        }

        if (state.health <= 0) {
            endGame(false);
        }

        render();
    }

    function render() {
        if(state.gameOver) return;
        const currentStage = growthStages[state.stageIndex];
        const visualIndex = state.health <= 0 ? 0 : state.stageIndex + (currentStage.name.en === 'Harvest' ? 1 : 0);

        ui.plant.textContent = plantVisuals[Math.min(visualIndex, plantVisuals.length - 2)];
        ui.stage.textContent = t(currentStage.name);
        ui.health.textContent = `${state.health}%`;
        ui.health.className = `status-value ${state.health < 50 ? 'bad' : 'good'}`;
        const progressPercentage = Math.floor((state.progressInStage / currentStage.duration) * 100);
        ui.progress.textContent = `${progressPercentage}%`;

        ui.temp.textContent = `${state.temp.toFixed(1)}°C`;
        ui.temp.className = `status-value ${state.temp < 20 || state.temp > 28 ? 'bad' : 'good'}`;
        ui.ph.textContent = state.ph.toFixed(2);
        ui.ph.className = `status-value ${state.ph < 5.8 || state.ph > 6.8 ? 'bad' : 'good'}`;

        ui.light.textContent = t({en:"16h On / 8h Off", id:"16j Nyala / 8j Mati"});
        ui.npk.textContent = currentStage.npk;
        state.aiStatus = (ui.temp.classList.contains('bad') || ui.ph.classList.contains('bad')) 
            ? {en:"Adjusting...", id:"Menyesuaikan..."} 
            : {en:"Optimal", id:"Optimal"};
        ui.aiStatus.textContent = t(state.aiStatus);
        ui.aiStatus.className = `status-value ${state.aiStatus.en === "Optimal" ? 'good' : ''}`;
    }

    function endGame(success) {
        state.gameOver = true;
        ui.nextBtn.disabled = true;
        ui.nextBtn.style.opacity = 0.5;
        if (success) {
            addLog({en:"Harvest successful! The heirloom tomatoes are of excellent quality.", id:"Panen berhasil! Tomat pusaka memiliki kualitas luar biasa."});
            ui.stage.textContent = t({en:"Success!", id:"Berhasil!"});
            ui.plant.textContent = plantVisuals[plantVisuals.length-1]; // Trophy
            playSound(waterBuffer); // Success sound
        } else {
             addLog({en:"Crop failure! The plants could not survive the conditions.", id:"Gagal panen! Tanaman tidak dapat bertahan dalam kondisi tersebut."});
             ui.stage.textContent = t({en:"Failure!", id:"Gagal!"});
             ui.plant.textContent = '💀'; // Skull for failure
        }
    }

    function initialize() {
        ui.timeline.innerHTML = growthStages.map((stage, i) => `
            <li class="timeline-stage ${i === 0 ? 'active' : ''}" data-stage="${i}">
                <div class="dot"></div>
                <div class="label">${t(stage.name)}</div>
            </li>
        `).join('');

        addLog({en:"Simulation started. Planting heirloom tomato seeds.", id:"Simulasi dimulai. Menanam benih tomat pusaka."});
        ui.nextBtn.addEventListener('click', update);
        render();
    }

    initialize();
}

function renderAboutView() {
    const headerTitle = document.querySelector('header h1');
    const headerSubtitle = document.querySelector('header p');
    headerTitle.textContent = t({en: "About PETAMU", id: "Tentang PETAMU"});
    headerSubtitle.textContent = t({en: "Our Mission & Vision", id: "Misi & Visi Kami"});

    appContainer.innerHTML = `
        <div class="content-view about-view">
            <button class="back-button">&larr; ${t({en: "Back to Home", id: "Kembali ke Beranda"})}</button>
            <h2>${t({en: "Welcome to PETAMU", id: "Selamat Datang di PETAMU"})}</h2>
            <p>${t({en: "PETAMU (Petualangan Tani Modern) is a dedicated learning platform designed to introduce the exciting world of Agricultural Technology (AgriTech) to students, educators, and enthusiasts. Our mission is to bridge the gap between traditional agriculture and modern technology, making learning accessible, interactive, and fun.", id: "PETAMU (Petualangan Tani Modern) adalah platform pembelajaran khusus yang dirancang untuk memperkenalkan dunia Teknologi Pertanian (AgriTech) yang menarik bagi siswa, pendidik, dan peminat. Misi kami adalah menjembatani kesenjangan antara pertanian tradisional dan teknologi modern, membuat pembelajaran dapat diakses, interaktif, dan menyenangkan."})}</p>

            <h3>${t({en: "Our Vision", id: "Visi Kami"})}</h3>
            <p>${t({en: "We envision a future where technology and agriculture work hand-in-hand to create a sustainable, efficient, and food-secure world. By inspiring the next generation of innovators, engineers, and farmers, we hope to contribute to solving some of the world's most pressing challenges.", id: "Kami membayangkan masa depan di mana teknologi dan pertanian bekerja berdampingan untuk menciptakan dunia yang berkelanjutan, efisien, dan andal dalam pangan. Dengan menginspirasi generasi inovator, insinyur, dan petani berikutnya, kami berharap dapat berkontribusi dalam memecahkan beberapa tantangan paling mendesak di dunia."})}</p>

            <h3>${t({en: "What We Offer", id: "Apa yang Kami Tawarkan"})}</h3>
            <ul class="about-list">
                <li><strong>${t({en: "Interactive Lessons:", id: "Pelajaran Interaktif:"})}</strong> ${t({en: "Dive into curated modules covering key topics like Precision Farming, IoT, Drones, and Vertical Farming.", id: "Selami modul-modul pilihan yang mencakup topik-topik utama seperti Pertanian Presisi, IoT, Drone, dan Pertanian Vertikal."})}</li>
                <li><strong>${t({en: "Engaging Simulations:", id: "Simulasi Menarik:"})}</strong> ${t({en: "Apply your knowledge in hands-on simulations. Manage a smart farm, design AgriTech tools, and optimize crop yields.", id: "Terapkan pengetahuan Anda dalam simulasi langsung. Kelola pertanian cerdas, rancang alat AgriTech, dan optimalkan hasil panen."})}</li>
                <li><strong>${t({en: "Curated Videos:", id: "Video Pilihan:"})}</strong> ${t({en: "Watch real-world examples and expert explanations of AgriTech in action.", id: "Tonton contoh-contoh dunia nyata dan penjelasan ahli tentang AgriTech dalam aksi."})}</li>
            </ul>
        </div>
    `;

    document.querySelector('.back-button').addEventListener('click', () => setView(renderWelcomeScreen));
}

document.getElementById('about-link').addEventListener('click', (e) => {
    e.preventDefault();
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    setView(renderAboutView);
});

// Initial render
setupSounds();
setupLangSwitcher();
setView(renderWelcomeScreen);