// --- Top Level: DOM Element References & Popup Functions ---
const popupOverlay = document.getElementById('popupOverlay');
const popupTitle = document.getElementById('popupTitle');
const popupBody = document.getElementById('popupBody');
const popupClose = document.getElementById('popupClose');

// Popup Functions (Defined Globally)
function openPopup(title, content) { if(!popupOverlay||!popupTitle||!popupBody)return; popupTitle.textContent=title;popupBody.innerHTML=content;popupOverlay.style.display='flex';document.body.style.overflow='hidden';}
function closePopup() { if(!popupOverlay)return; popupOverlay.style.display='none';document.body.style.overflow='';}

// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    // Use the URL provided in the original code block
    const BACKEND_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxynAxigAQDmb4DvpNCY5sf-Jio8nJ_3ztyfoejAviU5wNhQW2OvOA3titCbTOpgSPpzA/exec";
    const PREFERRED_MODEL = "eleven_multilingual_v2";

    // --- DOM Elements ---
    const voiceListContainer = document.getElementById('voice-list'); // Swiper wrapper
    const voiceSearchInput = document.getElementById('voice-search');
    const textInput = document.getElementById('text-input');
    const generateBtn = document.getElementById('generate-btn');
    const audioPlayerContainer = document.getElementById('audio-player-container');
    const audioPlayer = document.getElementById('audio-player');
    const downloadBtn = document.getElementById('download-btn');
    const statusMessage = document.getElementById('status-message');
    const errorMessageDiv = document.getElementById('error-message');
    const loadingVoicesContainer = document.querySelector('.loading-voices');
    const voiceSwiperContainer = document.getElementById('voice-swiper');
    const noVoicesMessage = document.getElementById('no-voices-message');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const copyTextBtn = document.getElementById('copy-text-btn');       // Ensure reference
    const clearTextBtn = document.getElementById('clear-text-btn');      // Ensure reference
    // Filter Elements
    const filterToggleBtn = document.getElementById('filter-toggle-btn'); // Ensure reference
    const filterPanel = document.getElementById('filter-panel');       // Ensure reference
    const filterGenderSelect = document.getElementById('filter-gender');
    const filterAgeSelect = document.getElementById('filter-age');
    const filterAccentSelect = document.getElementById('filter-accent');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    // --- State Variables ---
    let allVoices = []; let selectedVoiceId = null; let currentAudioBlob = null; let currentAudioUrl = null;
    let voiceSwiper = null; // Swiper instance

    // --- Helper Functions ---
    function capitalizeFirstLetter(s){if(!s)return'';return s.charAt(0).toUpperCase()+s.slice(1);}
    function updateStatus(message, type = 'info') { if(statusMessage){statusMessage.textContent=message;statusMessage.className=`status-message status-${type}`;}if(type!=='error'&&errorMessageDiv){errorMessageDiv.style.display='none';errorMessageDiv.textContent='';}if(type==='warning')console.warn('Warn:',message);else if(type==='error')console.error('Error:',message);}
    function displayError(message) { if(errorMessageDiv){errorMessageDiv.textContent=message;errorMessageDiv.style.display='block';errorMessageDiv.scrollIntoView({behavior:'smooth',block:'nearest'});}updateStatus('An error occurred.','error');}
    function populateSelect(el,opts){if(!el)return;el.innerHTML='<option value="">All</option>';opts.forEach(o=>{const p=document.createElement('option');p.value=o.toLowerCase();p.textContent=o;el.appendChild(p);});}
    function resetFilterDropdowns(){populateSelect(filterGenderSelect,[]);populateSelect(filterAgeSelect,[]);populateSelect(filterAccentSelect,[]);}
    function populateFilterDropdowns(v){const g=new Set(),a=new Set(),c=new Set();v.forEach(vo=>{vo.labels?.gender&&g.add(capitalizeFirstLetter(vo.labels.gender));vo.labels?.age&&a.add(capitalizeFirstLetter(vo.labels.age));vo.labels?.accent&&c.add(capitalizeFirstLetter(vo.labels.accent));});populateSelect(filterGenderSelect,[...g].sort());populateSelect(filterAgeSelect,[...a].sort());populateSelect(filterAccentSelect,[...c].sort());}

    // --- Swiper Initialization / Update ---
    function initializeOrUpdateSwiper() {
        if (!voiceSwiperContainer || !voiceListContainer) return;
        const hasSlides = voiceListContainer.children.length > 0;
        const isContainerVisible = voiceSwiperContainer.style.display === 'block';

        if (isContainerVisible && hasSlides) {
            if (voiceSwiper && !voiceSwiper.destroyed) {
                console.log("Updating Swiper.");
                voiceSwiper.update();
            } else {
                console.log("Initializing Swiper.");
                if (voiceSwiper) { try { voiceSwiper.destroy(true, true); } catch(e) { console.error("Err destroying old swiper:", e); } }
                 try {
                    voiceSwiper = new Swiper(voiceSwiperContainer, {
                        slidesPerView: 2, spaceBetween: 15,
                        loop: true, grabCursor: true,
                        // ## Pagination REMOVED from options ##
                        // pagination: { el: '.swiper-pagination', clickable: true },
                        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                        breakpoints: { 640: { slidesPerView: 3, spaceBetween: 20 }, 768: { slidesPerView: 4, spaceBetween: 20 }, 1024: { slidesPerView: 5, spaceBetween: 25 } },
                        observer: true, observeParents: true, observeSlideChildren: true,
                    });
                 } catch (swiperError) { console.error("Err initializing Swiper:", swiperError); displayError("Could not init voice slider."); }
            }
        } else {
            if (voiceSwiper && !voiceSwiper.destroyed) {
                console.log("Destroying Swiper (no slides/hidden).");
                try { voiceSwiper.destroy(true, true); } catch(e) { console.error("Err destroying swiper:", e); }
                voiceSwiper = null;
            }
        }
    }

    // --- Core Functions ---

    async function fetchVoices() {
        // ... (Fetch logic - same as your provided code) ...
        if (loadingVoicesContainer) loadingVoicesContainer.classList.remove('hidden');
        if (voiceSwiperContainer) voiceSwiperContainer.style.display = 'none';
        if (voiceListContainer) voiceListContainer.innerHTML = '';
        if (noVoicesMessage) noVoicesMessage.style.display = 'none';
        resetFilterDropdowns();
        if(filterPanel) filterPanel.classList.remove('active');
        if(filterToggleBtn) filterToggleBtn.setAttribute('aria-expanded', 'false');
        if(errorMessageDiv) errorMessageDiv.style.display = 'none';
        updateStatus('Loading voices...', 'info');
        if (!BACKEND_SCRIPT_URL || BACKEND_SCRIPT_URL === "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") { displayError("Service URL not configured."); updateStatus('Configuration Error', 'error'); if (loadingVoicesContainer) loadingVoicesContainer.classList.add('hidden'); return; }
        try {
            const response = await fetch(BACKEND_SCRIPT_URL, { method: 'GET' });
            if (!response.ok) { throw new Error(`Backend network response error (Status: ${response.status})`); }
            const data = await response.json();
            if (data.error) { throw new Error(data.error || "Failed to load voices."); }
            if (!data.voices) { throw new Error("Received unexpected voice data."); }
            allVoices = data.voices || [];
            console.log(`Total voices received: ${allVoices.length}`);
            if (loadingVoicesContainer) loadingVoicesContainer.classList.add('hidden');
            if (allVoices.length === 0) { if (noVoicesMessage) { noVoicesMessage.textContent = "No voices currently available."; noVoicesMessage.style.display = 'block'; } if (voiceSwiperContainer) voiceSwiperContainer.style.display = 'none'; initializeOrUpdateSwiper(); updateStatus('Failed to load voices.', 'error'); }
            else { populateFilterDropdowns(allVoices); applyFiltersAndDisplayVoices(); updateStatus('Ready. Select voice and enter text.', 'info'); }
        } catch (error) { console.error("Error fetching voices:", error); if (loadingVoicesContainer) loadingVoicesContainer.classList.add('hidden'); displayError(`Failed to load voices: ${error.message}`); updateStatus('Error loading voices.', 'error'); if (noVoicesMessage) { noVoicesMessage.textContent = "Could not load voices."; noVoicesMessage.style.display = 'block'; } if (voiceSwiperContainer) voiceSwiperContainer.style.display = 'none'; initializeOrUpdateSwiper(); allVoices = []; }
    }

    // Displays voices IN SWIPER SLIDES
    function displayVoices(voicesToDisplay) {
        if (!voiceListContainer || !voiceSwiperContainer || !noVoicesMessage) return;
        voiceListContainer.innerHTML = ''; // Clear slides
        noVoicesMessage.style.display = 'none';

        if (voicesToDisplay.length === 0) {
            noVoicesMessage.textContent = "No voices match your filter criteria.";
            noVoicesMessage.style.display = 'block'; voiceSwiperContainer.style.display = 'none';
            initializeOrUpdateSwiper(); // Destroy swiper
            selectedVoiceId = null; return;
        }

        voiceSwiperContainer.style.display = 'block';
        const fragment = document.createDocumentFragment();
        voicesToDisplay.forEach(voice => {
            const slide = document.createElement('div'); slide.classList.add('swiper-slide');
            const voiceItem = document.createElement('div'); voiceItem.classList.add('voice-item');
            voiceItem.dataset.voiceId = voice.voice_id;
            const name = voice.name || 'Unnamed';
            // Corrected: displayAccent logic needed full code here
            const accentLabel = voice.labels?.accent || ''; const genderLabel = voice.labels?.gender || '';
            const ageLabel = voice.labels?.age || ''; const descriptionLabel = voice.labels?.description || '';
            let displayAccent = accentLabel ? capitalizeFirstLetter(accentLabel) : capitalizeFirstLetter(descriptionLabel);
            if (displayAccent.toLowerCase() === 'american' && descriptionLabel) displayAccent = capitalizeFirstLetter(descriptionLabel);
            voiceItem.innerHTML = `<div class="voice-info"><h4>${name}</h4><div class="voice-details">${genderLabel ? `<span><i class="fa-solid fa-venus-mars"></i> ${capitalizeFirstLetter(genderLabel)}</span>` : ''}${ageLabel ? `<span><i class="fa-solid fa-user"></i> ${capitalizeFirstLetter(ageLabel)}</span>` : ''}${displayAccent ? `<span><i class="fa-solid fa-map-pin"></i> ${displayAccent}</span>` : ''}</div></div><i class="fas fa-check selected-icon"></i>`;
            if (voice.voice_id === selectedVoiceId) voiceItem.classList.add('selected');
            // ## Attach Listener Correctly ##
            voiceItem.addEventListener('click', () => {
                handleVoiceSelection(voice.voice_id, voiceItem); // Pass ID and Element
            });
            slide.appendChild(voiceItem);
            fragment.appendChild(slide);
        });
        voiceListContainer.appendChild(fragment);

        // Initialize/Update Swiper AFTER appending
        requestAnimationFrame(() => {
             initializeOrUpdateSwiper();
             // Re-apply selection logic
             setTimeout(() => {
                 if (!selectedVoiceId && voicesToDisplay.length > 0) {
                     const firstItem = voiceListContainer.querySelector('.voice-item');
                     if (firstItem) { handleVoiceSelection(firstItem.dataset.voiceId, firstItem); }
                 } else if (selectedVoiceId) {
                      const currentSelectedItem = voiceListContainer.querySelector(`.voice-item[data-voice-id="${selectedVoiceId}"]`);
                      if (currentSelectedItem && !currentSelectedItem.classList.contains('selected')) {
                          voiceListContainer.querySelectorAll('.voice-item.selected').forEach(el => el.classList.remove('selected'));
                          currentSelectedItem.classList.add('selected');
                      } else if (!currentSelectedItem) {
                          const firstItem = voiceListContainer.querySelector('.voice-item');
                          if (firstItem) handleVoiceSelection(firstItem.dataset.voiceId, firstItem);
                          else selectedVoiceId = null; updateStatus('Select a voice.', 'info'); // Update status if selection lost
                      }
                 }
             }, 150);
        });
    }

    // Applies filters and re-displays voices
    function applyFiltersAndDisplayVoices() {
         if(!allVoices||!voiceListContainer)return;
         const searchTerm = voiceSearchInput?voiceSearchInput.value.toLowerCase().trim():'';
         const selectedGender = filterGenderSelect?filterGenderSelect.value:'';
         const selectedAge = filterAgeSelect?filterAgeSelect.value:'';
         const selectedAccent = filterAccentSelect?filterAccentSelect.value:'';
         const filteredVoices = allVoices.filter(v=>{ const n=(v.name||'').toLowerCase();const ge=(v.labels?.gender||'').toLowerCase();const ag=(v.labels?.age||'').toLowerCase();const ac=(v.labels?.accent||'').toLowerCase();const d=(v.labels?.description||'').toLowerCase();const sm=!searchTerm||n.includes(searchTerm)||d.includes(searchTerm);const gm=!selectedGender||ge===selectedGender;const am=!selectedAge||ag===selectedAge;const acm=!selectedAccent||ac===selectedAccent;return sm&&gm&&am&&acm; });
         displayVoices(filteredVoices);
     }


    // Handles voice selection - Takes voiceId and the clicked element
    function handleVoiceSelection(voiceId, clickedElement) {
         if (!voiceId || !clickedElement || !voiceListContainer) return;
         // Deselect others first
         voiceListContainer.querySelectorAll('.voice-item.selected').forEach(el => el.classList.remove('selected'));
         // Select clicked one
         clickedElement.classList.add('selected');
         // ## **CRITICAL FIX: Update the state variable** ##
         selectedVoiceId = voiceId;
         console.log("Selected Voice ID SET TO:", selectedVoiceId); // Debug log
         // ## **CRITICAL FIX: Update status message** ##
         updateStatus('Voice selected. Enter text and generate.','info');
     }

    // ## **CRITICAL FIX: Define toggleFilterPanel function** ##
    function toggleFilterPanel() {
        if (!filterPanel || !filterToggleBtn) return;
        const isExpanded = filterPanel.classList.toggle('active');
        filterToggleBtn.setAttribute('aria-expanded', isExpanded);
        console.log("Filter panel toggled, active:", isExpanded);
    }

    // Clears all filters
    function clearAllFilters(){if(voiceSearchInput)voiceSearchInput.value='';if(filterGenderSelect)filterGenderSelect.value='';if(filterAgeSelect)filterAgeSelect.value='';if(filterAccentSelect)filterAccentSelect.value='';applyFiltersAndDisplayVoices();}

    // Generates audio via backend
    async function generateAudio() {
        const text = textInput ? textInput.value.trim() : '';
        console.log("Generate clicked. Current selectedVoiceId:", selectedVoiceId); // Debug log
        // ## Check selectedVoiceId state variable ##
        if (!text) { updateStatus('Please enter some text.', 'warning'); return; }
        if (!selectedVoiceId) { updateStatus('Please select a voice first.', 'warning'); return; } // Check state here
        if (!BACKEND_SCRIPT_URL || BACKEND_SCRIPT_URL === "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") { displayError("Service URL not configured."); return; }

        // ... (Rest of generateAudio is same as your provided code) ...
        const generateButton = document.getElementById('generate-btn');
        if (generateButton) { generateButton.disabled = true; generateButton.classList.add('loading'); }
        if (downloadBtn) { downloadBtn.style.display = 'none'; downloadBtn.href = '#'; }
        if (audioPlayerContainer) audioPlayerContainer.style.display = 'none'; if (audioPlayer) audioPlayer.src = '';
        if(errorMessageDiv) errorMessageDiv.style.display = 'none'; updateStatus('Generating audio...', 'info');
        if (currentAudioUrl) { URL.revokeObjectURL(currentAudioUrl); currentAudioUrl = null; currentAudioBlob = null; }
        try {
            const requestPayload = { text: text, voiceId: selectedVoiceId }; // Use state variable
            const response = await fetch(BACKEND_SCRIPT_URL, { method: 'POST', body: JSON.stringify(requestPayload) });
            if (!response.ok) { throw new Error(`Backend network response error (Status: ${response.status})`); }
            const data = await response.json(); if (data.error) { throw new Error(data.error || "Failed to generate audio."); }
            if (!data.audioB64 || !data.contentType) { throw new Error("Received unexpected audio data."); }
            const byteCharacters = atob(data.audioB64); const byteNumbers = new Array(byteCharacters.length); for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); } const byteArray = new Uint8Array(byteNumbers); currentAudioBlob = new Blob([byteArray], { type: data.contentType }); currentAudioUrl = URL.createObjectURL(currentAudioBlob);
            if (audioPlayer) audioPlayer.src = currentAudioUrl; if (audioPlayerContainer) audioPlayerContainer.style.display = 'block'; if (downloadBtn) { downloadBtn.href = currentAudioUrl; downloadBtn.download = `SpeechGenie_audio_${Date.now()}.mp3`; downloadBtn.style.display = 'inline-flex'; } updateStatus('Audio generated successfully.', 'success');
        } catch (error) { console.error("Error generating audio:", error); displayError(`Audio generation failed due to heavy traffic 😅`); updateStatus('Please Regenerate Again', 'error'); if (downloadBtn) downloadBtn.style.display = 'none'; }
        finally { const finalGenerateButton = document.getElementById('generate-btn'); if (finalGenerateButton) { finalGenerateButton.disabled = false; finalGenerateButton.classList.remove('loading'); } }
    }

    // ## **CRITICAL FIX: Define copyText function** ##
    function copyText(){
        if(!textInput||!textInput.value) { updateStatus('Nothing to copy.', 'warning'); return; }
        navigator.clipboard.writeText(textInput.value).then(()=>{
            if(copyTextBtn){ const o=copyTextBtn.innerHTML;copyTextBtn.innerHTML='<i class="fas fa-check"></i>';copyTextBtn.style.color='var(--success-color)';setTimeout(()=>{copyTextBtn.innerHTML=o;copyTextBtn.style.color='';},1500);}
            updateStatus('Text copied.','info');
        }).catch(e=>{console.error('Copy failed: ',e);updateStatus('Copy failed.','error');});
    }

    // ## **CRITICAL FIX: Define clearText function** ##
    function clearText(){
        if(textInput) { textInput.value=''; updateStatus('Text cleared.', 'info'); }
    }

    // Theme functions (same as provided)
    function toggleTheme(){ document.body.classList.toggle('light-mode'); localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark'); if (themeToggleBtn) { themeToggleBtn.setAttribute('aria-label', document.body.classList.contains('light-mode') ? 'Switch to dark mode' : 'Switch to light mode'); } }
    function loadTheme(){ const t = localStorage.getItem('theme'); if (t === 'dark') { document.body.classList.remove('light-mode'); } else { document.body.classList.add('light-mode'); } if (themeToggleBtn) { themeToggleBtn.setAttribute('aria-label', document.body.classList.contains('light-mode') ? 'Switch to dark mode' : 'Switch to light mode'); } }

    // --- Event Listeners (Ensure all are correctly attached) ---
    if(filterToggleBtn) filterToggleBtn.addEventListener('click', toggleFilterPanel); // ## Attach listener ##
    if(voiceSearchInput) voiceSearchInput.addEventListener('input', applyFiltersAndDisplayVoices);
    if(filterGenderSelect) filterGenderSelect.addEventListener('change', applyFiltersAndDisplayVoices);
    if(filterAgeSelect) filterAgeSelect.addEventListener('change', applyFiltersAndDisplayVoices);
    if(filterAccentSelect) filterAccentSelect.addEventListener('change', applyFiltersAndDisplayVoices);
    if(clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearAllFilters);
    if(generateBtn) generateBtn.addEventListener('click', generateAudio);
    if(themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
    if(copyTextBtn) copyTextBtn.addEventListener('click', copyText);       // ## Attach listener ##
    if(clearTextBtn) clearTextBtn.addEventListener('click', clearText);     // ## Attach listener ##
    // Popup listeners
    if (popupOverlay) { popupOverlay.addEventListener('click', (event) => { if (event.target === popupOverlay) { closePopup(); } }); }
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && popupOverlay && popupOverlay.style.display === 'flex') { closePopup(); } });
    // Cleanup audio URL
    window.addEventListener('beforeunload',()=>{if(currentAudioUrl)URL.revokeObjectURL(currentAudioUrl);});

    // --- Initializations ---
    loadTheme();
    fetchVoices();

}); // End DOMContentLoaded
