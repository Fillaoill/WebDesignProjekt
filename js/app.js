/**
 * INTERFACE 2026 – Core Application Logic
 * Mobile-First, Vanilla JS, Zero External Dependencies, Zero Emojis
 */

(function () {
  'use strict';

  // 1. Data Store Resolver (Bulletproof Local & Fallback Resolution)
  function resolveFestivalData() {
    if (typeof window !== 'undefined' && window.FESTIVAL_DATA && window.FESTIVAL_DATA.schedule) {
      return window.FESTIVAL_DATA;
    }
    if (typeof FESTIVAL_DATA !== 'undefined' && FESTIVAL_DATA && FESTIVAL_DATA.schedule) {
      return FESTIVAL_DATA;
    }
    return null;
  }

  let festivalData = resolveFestivalData();

  // State Management with Safe LocalStorage parsing
  function safeJsonParse(key, fallback) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  const state = {
    currentDay: 1,
    selectedStage: 'all',
    selectedType: 'all',
    searchQuery: '',
    performerCategory: 'all',
    performerQuery: '',
    lineupExpanded: false,
    activeLineupGenre: null,
    programViewMode: 'grid',
    theme: localStorage.getItem('interface_theme') || 'light',
    myScheduleIds: safeJsonParse('interface_my_schedule', []),
    workshopReservations: safeJsonParse('interface_workshop_res', {}),
    activePlayingPerformerId: null,
    isPlayingAudio: false
  };

  // Web Audio Synthesis Engine
  let audioCtx = null;
  let synthOscillator = null;
  let synthGain = null;
  let synthInterval = null;

  // DOM Elements Cache
  let elements = {};

  function cacheDomElements() {
    elements = {
      scheduleContainer: document.getElementById('schedule-container'),
      performersContainer: document.getElementById('performers-container'),
      filteredCount: document.getElementById('filtered-items-count'),
      dayTabs: document.querySelectorAll('.day-tab'),
      stageFilter: document.getElementById('stage-filter'),
      typeFilter: document.getElementById('type-filter'),
      programSearch: document.getElementById('program-search'),
      clearSearchBtn: document.getElementById('clear-program-search'),
      resetFiltersBtn: document.getElementById('reset-filters-btn'),
      categoryPills: document.querySelectorAll('.category-pill'),
      performerSearch: document.getElementById('performer-search'),
      scheduleBadge: document.getElementById('schedule-badge'),
      mScheduleBadge: document.getElementById('m-schedule-badge'),
      btnOpenSchedule: document.getElementById('btn-open-my-schedule'),
      mBtnOpenSchedule: document.getElementById('m-btn-my-schedule'),
      scheduleDrawer: document.getElementById('schedule-drawer'),
      drawerCloseBtn: document.getElementById('drawer-close-btn'),
      myScheduleList: document.getElementById('my-schedule-items-list'),
      clashAlert: document.getElementById('clash-alert'),
      clashDetails: document.getElementById('clash-details'),
      btnClearSchedule: document.getElementById('btn-clear-schedule'),
      btnExportCalendar: document.getElementById('btn-export-calendar'),
      detailModal: document.getElementById('detail-modal'),
      modalBodyContent: document.getElementById('modal-body-content'),
      modalCloseBtn: document.getElementById('modal-close-btn'),
      globalPlayer: document.getElementById('global-player'),
      playerArtistName: document.getElementById('player-artist-name'),
      playerTrackTitle: document.getElementById('player-track-title'),
      playerTogglePlay: document.getElementById('player-toggle-play'),
      playerCloseBtn: document.getElementById('player-close-btn'),
      audioVisualizer: document.getElementById('audio-visualizer'),
      toastContainer: document.getElementById('toast-container'),
      mapInteractiveZones: document.querySelectorAll('.map-interactive-zone'),
      stageHoverHud: document.getElementById('stage-hover-hud'),
      hudStageBadge: document.getElementById('hud-stage-badge'),
      hudCapacityBadge: document.getElementById('hud-capacity-badge'),
      hudStageTitle: document.getElementById('hud-stage-title'),
      hudStageLocation: document.getElementById('hud-stage-location'),
      hudStageDesc: document.getElementById('hud-stage-desc'),
      hudPreviewList: document.getElementById('hud-preview-list'),
      hudFilterBtn: document.getElementById('hud-filter-btn'),
      heroCanvas: document.getElementById('hero-sound-canvas'),
      btnLineupExpand: document.getElementById('btn-lineup-expand'),
      lineupExpandLabel: document.getElementById('lineup-expand-label'),
      lineupFade: document.getElementById('lineup-fade'),
      lineupExpandRow: document.getElementById('lineup-expand-row'),
      themeToggleBtn: document.getElementById('theme-toggle-btn'),
      viewModeGridBtn: document.getElementById('view-mode-grid'),
      viewModeListBtn: document.getElementById('view-mode-list')
    };
  }

  // 2. Application Entry Point
  async function initApp() {
    cacheDomElements();

    // Infallible data resolution
    if (!festivalData) {
      festivalData = resolveFestivalData();
    }

    if (!festivalData) {
      try {
        const response = await fetch('./data.json');
        if (response.ok) {
          festivalData = await response.json();
          window.FESTIVAL_DATA = festivalData;
        }
      } catch (err) {
        console.warn('Fetch fallback failed, trying to re-read window.FESTIVAL_DATA');
        festivalData = resolveFestivalData();
      }
    }

    if (!festivalData || !festivalData.schedule || !festivalData.performers) {
      console.error('Data se nepodařilo načíst.');
      if (elements.scheduleContainer) {
        elements.scheduleContainer.innerHTML = '<div class="empty-schedule-state"><p>Chyba při inicializaci databáze. Zkontrolujte prosím existenci js/data.js.</p></div>';
      }
      return;
    }

    initTheme();
    renderProgram();
    renderLineup();
    updateScheduleBadges();
    initEventListeners();
    setupStageMap();
    initHeroSoundToy();
    initHeroCanvasAnimation();
    initParallax();
  }

  // Theme Management
  function initTheme() {
    const saved = localStorage.getItem('interface_theme') || 'light';
    state.theme = saved;
    document.documentElement.setAttribute('data-theme', saved);
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    state.theme = nextTheme;
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('interface_theme', nextTheme);
    showToast(nextTheme === 'dark' ? 'Tmavý režim aktivován 🌙' : 'Světlý režim aktivován ☀️');
  }

  // 3. Program Timetable Rendering & Filtering (Matrix Grid + List views)
  function renderProgram() {
    if (!festivalData || !elements.scheduleContainer) return;

    const query = state.searchQuery.trim().toLowerCase();

    const filtered = festivalData.schedule.filter(item => {
      // 1. Day match
      const matchDay = item.day === state.currentDay;

      // 2. Stage match
      const matchStage = state.selectedStage === 'all' || item.stageId === state.selectedStage;

      // 3. Flexible Type match
      let matchType = true;
      if (state.selectedType !== 'all') {
        const t = (item.type || '').toLowerCase();
        if (state.selectedType === 'concert') {
          matchType = t.includes('koncert') || t.includes('show') || t.includes('set') || t.includes('live');
        } else if (state.selectedType === 'av') {
          matchType = t.includes('av') || t.includes('laser') || t.includes('light') || t.includes('instalac') || t.includes('projekc');
        } else if (state.selectedType === 'workshop') {
          matchType = t.includes('workshop') || t.includes('masterclass') || t.includes('demo') || t.includes('přednášk');
        } else if (state.selectedType === 'algorave') {
          matchType = t.includes('algorave') || t.includes('jam') || t.includes('kód');
        } else {
          matchType = item.type === state.selectedType;
        }
      }

      // 4. Query match
      let matchQuery = true;
      if (query) {
        const performer = getPerformerById(item.performerIds[0]);
        const perfName = performer ? performer.name.toLowerCase() : '';
        const title = (item.title || '').toLowerCase();
        const tags = (item.tags || []).join(' ').toLowerCase();
        matchQuery = title.includes(query) || perfName.includes(query) || tags.includes(query);
      }

      return matchDay && matchStage && matchType && matchQuery;
    });

    if (elements.filteredCount) {
      elements.filteredCount.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      elements.scheduleContainer.innerHTML = `
        <div class="empty-schedule-state">
          <p>Žádné vystoupení neodpovídá zvoleným filtrům pro tento den.</p>
          <button type="button" class="btn btn-outline btn-sm mt-3" id="empty-reset-btn">Resetovat filtry</button>
        </div>
      `;
      const resetBtn = document.getElementById('empty-reset-btn');
      if (resetBtn) resetBtn.addEventListener('click', resetFilters);
      return;
    }

    // Sort chronologically
    filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Render based on chosen view mode
    if (state.programViewMode === 'grid') {
      elements.scheduleContainer.innerHTML = renderProgramGrid(filtered);
    } else {
      elements.scheduleContainer.innerHTML = renderProgramList(filtered);
    }
  }

  // 3a. Interactive Timetable Matrix Board (Rozvrh scén a hodin)
  function renderProgramGrid(filtered) {
    const stageDefs = [
      { id: 'stage_sound', name: 'Sound & Live Stage', location: 'Pavilon B', dotClass: 'sound' },
      { id: 'stage_av', name: 'Audiovisual Dome', location: 'Nová Spirála', dotClass: 'av' },
      { id: 'stage_lab', name: 'Creative Code Lab', location: 'Pavilon D', dotClass: 'lab' }
    ];

    const visibleStages = state.selectedStage === 'all'
      ? stageDefs
      : stageDefs.filter(s => s.id === state.selectedStage);

    // Extract hours present in current day's filtered schedule
    const hoursSet = new Set();
    filtered.forEach(item => {
      const h = parseInt(item.startTime.split(':')[0], 10);
      hoursSet.add(h);
    });

    // Chronological order supporting late night hours (00:00, 01:00, 02:00)
    const sortedHours = Array.from(hoursSet).sort((a, b) => {
      const normA = a < 6 ? a + 24 : a;
      const normB = b < 6 ? b + 24 : b;
      return normA - normB;
    });

    return `
      <div class="timetable-board-wrap">
        <div class="timetable-grid" style="grid-template-columns: 86px repeat(${visibleStages.length}, minmax(260px, 1fr));">
          
          <!-- Sticky Header Corner -->
          <div class="timetable-corner-cell">Čas</div>

          <!-- Sticky Stage Headers -->
          ${visibleStages.map(st => `
            <div class="timetable-stage-col-header" data-stage-col="${st.id}">
              <div class="col-stage-name">
                <span class="col-stage-dot ${st.dotClass}"></span>
                <span>${st.name}</span>
              </div>
              <span class="col-stage-location">${st.location}</span>
            </div>
          `).join('')}

          <!-- Hour rows -->
          ${sortedHours.map((hour, idx) => {
            const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
            const isNearBottom = idx >= sortedHours.length - 2;

            return `
              <div class="timetable-time-cell">${hourLabel}</div>
              ${visibleStages.map(st => {
                const itemsInSlot = filtered.filter(item => {
                  const itemH = parseInt(item.startTime.split(':')[0], 10);
                  return item.stageId === st.id && itemH === hour;
                });

                if (itemsInSlot.length === 0) {
                  return `<div class="timetable-stage-lane" data-lane-stage="${st.id}" data-lane-hour="${hourLabel}"></div>`;
                }

                return `
                  <div class="timetable-stage-lane" data-lane-stage="${st.id}" data-lane-hour="${hourLabel}">
                    ${itemsInSlot.map(item => {
                      const performer = getPerformerById(item.performerIds[0]);
                      const isSaved = state.myScheduleIds.includes(item.id);
                      const stageClass = item.stageId === 'stage_sound' ? 'stage-sound' : (item.stageId === 'stage_av' ? 'stage-av' : 'stage-lab');
                      const initials = performer ? performer.name.split(' ').map(w => w[0]).join('').slice(0, 2) : 'IN';

                      let workshopReg = '';
                      if (item.requiresRegistration) {
                        const reservedCount = state.workshopReservations[item.id] ? state.workshopReservations[item.id].length : 0;
                        const remaining = Math.max(0, item.capacity - reservedCount);
                        workshopReg = `<span class="act-type-tag" style="color:var(--stage-lab); margin-top:0.25rem;">Workshop: volno ${remaining}/${item.capacity}</span>`;
                      }

                      return `
                        <div class="timetable-act-card ${stageClass}" data-item-id="${item.id}" tabindex="0" role="button" aria-haspopup="dialog" aria-label="${escapeHtml(item.title)}">
                          <div class="act-card-header">
                            <span class="act-time-badge">${item.startTime} – ${item.endTime}</span>
                            <span class="act-type-tag">${escapeHtml(item.type)}</span>
                          </div>
                          <div class="act-title">${escapeHtml(item.title)}</div>
                          ${performer ? `
                            <div class="act-performer-sub">
                              <span>${escapeHtml(performer.name)}</span>
                              <span style="opacity:0.6;">[${performer.country}]</span>
                            </div>
                          ` : ''}
                          ${workshopReg}

                          <!-- Interactive Hover Popover -->
                          <div class="timetable-popover ${isNearBottom ? 'flip-up' : ''}" data-popover-item="${item.id}">
                            <div class="popover-header">
                              <div class="popover-avatar">${escapeHtml(initials)}</div>
                              <div class="popover-perf-info">
                                <div class="popover-perf-name">${performer ? escapeHtml(performer.name) : escapeHtml(item.title)}</div>
                                <div class="popover-perf-role">${performer ? `${escapeHtml(performer.role)} (${performer.country})` : st.name}</div>
                              </div>
                            </div>
                            <div class="popover-desc">${escapeHtml(item.description)}</div>
                            <div class="popover-actions">
                              ${performer ? `
                                <button type="button" class="popover-btn-audio btn-audio-preview" data-audio-performer="${performer.id}">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                  <span>Ukázka</span>
                                </button>
                              ` : '<span></span>'}
                              <button type="button" class="popover-btn-save btn-save-schedule ${isSaved ? 'saved' : ''}" data-item-id="${item.id}">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                <span>${isSaved ? 'Uloženo' : 'Přidat'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `;
              }).join('')}
            `;
          }).join('')}

        </div>
      </div>
    `;
  }

  // 3b. Linear Timeline List View
  function renderProgramList(filtered) {
    return filtered.map(item => {
      const performer = getPerformerById(item.performerIds[0]);
      const stage = getStageById(item.stageId);
      const isSaved = state.myScheduleIds.includes(item.id);
      const stageClass = item.stageId === 'stage_sound' ? 'stage-badge-sound' : (item.stageId === 'stage_av' ? 'stage-badge-av' : 'stage-badge-lab');
      
      let workshopHtml = '';
      if (item.requiresRegistration) {
        const reservedCount = state.workshopReservations[item.id] ? state.workshopReservations[item.id].length : 0;
        const remaining = Math.max(0, item.capacity - reservedCount);
        const isFull = remaining === 0;
        workshopHtml = `
          <button type="button" class="btn-workshop-reg" data-workshop-id="${item.id}" ${isFull ? 'disabled' : ''}>
            ${isFull ? 'Kapacita naplněna' : `Rezervovat (volno: ${remaining}/${item.capacity})`}
          </button>
        `;
      }

      return `
        <article class="schedule-card" data-item-id="${item.id}">
          <div class="schedule-card-header">
            <div class="time-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${item.startTime} – ${item.endTime}</span>
            </div>
            <span class="stage-badge ${stageClass}">${stage ? stage.name : item.stageId}</span>
          </div>

          <h3 class="schedule-card-title" data-item-id="${item.id}">
            ${escapeHtml(item.title)}
          </h3>

          <div class="performer-meta-row">
            ${performer ? `
              <span class="performer-name-link" data-performer-id="${performer.id}">
                <svg class="inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                ${escapeHtml(performer.name)} [${performer.country}]
              </span>
              <span>/</span>
              <span>${escapeHtml(performer.category)}</span>
            ` : ''}
          </div>

          <div class="tags-row">
            <span class="item-tag">${escapeHtml(item.type)}</span>
            ${(item.tags || []).map(t => `<span class="item-tag">#${escapeHtml(t)}</span>`).join('')}
          </div>

          <div class="schedule-card-actions">
            <div class="actions-left">
              ${performer ? `
                <button type="button" class="btn-audio-preview" data-audio-performer="${performer.id}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  <span>Ukázka</span>
                </button>
              ` : ''}
              ${workshopHtml}
            </div>

            <button type="button" class="btn-save-schedule ${isSaved ? 'saved' : ''}" data-item-id="${item.id}" aria-label="Uložit do mého programu">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>${isSaved ? 'Uloženo' : 'Přidat'}</span>
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  // 4. Line-up Directory: 4 Interactive Genre Bubbles + Unfolding 360° Asymmetric Spiderweb
  const GENRE_CLUSTERS = [
    {
      id: 'sound',
      categoryMatch: 'hudba',
      themeClass: 'sound',
      color: '#7c6dfc',
      title: 'Hudba & Live Acts',
      kicker: 'Scéna: Pavilon B',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>'
    },
    {
      id: 'av',
      categoryMatch: 'audiovizuální',
      themeClass: 'av',
      color: '#d46daa',
      title: 'Audiovizuální umění & Světlo',
      kicker: 'Scéna: Nová Spirála 360°',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"></path></svg>'
    },
    {
      id: 'code',
      categoryMatch: 'kód',
      themeClass: 'lab',
      color: '#3fc4d4',
      title: 'Kreativní kód, AI & Algorave',
      kicker: 'Scéna: Pavilon D & Algorave',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>'
    },
    {
      id: 'hardware',
      categoryMatch: 'hardware',
      themeClass: 'gold',
      color: '#c8a96e',
      title: 'Zvukový hardware & Moduláry',
      kicker: 'Scéna: Modular Lab & Výstava',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="12" x2="15" y2="15"></line></svg>'
    }
  ];

  function renderLineup() {
    if (!festivalData || !elements.performersContainer) return;

    const query = state.performerQuery.trim().toLowerCase();
    const selCat = state.performerCategory.toLowerCase();

    // Overall filter based on search query
    const filteredAll = festivalData.performers.filter(p => {
      let matchCat = true;
      if (selCat !== 'all') {
        const pCat = (p.category || '').toLowerCase();
        matchCat = pCat.includes(selCat) || selCat.includes(pCat);
      }
      const matchQuery = !query || 
        p.name.toLowerCase().includes(query) || 
        p.role.toLowerCase().includes(query) || 
        (p.bio && p.bio.toLowerCase().includes(query));

      return matchCat && matchQuery;
    });

    if (filteredAll.length === 0) {
      elements.performersContainer.innerHTML = `
        <div class="empty-schedule-state" style="width: 100%; text-align: center; padding: 3rem 1rem;">
          <p>Nenalezen žádný vystupující odpovídající vašemu dotazu.</p>
        </div>
      `;
      if (elements.lineupExpandRow) elements.lineupExpandRow.style.display = 'none';
      if (elements.lineupFade) elements.lineupFade.style.display = 'none';
      return;
    }

    // STATE 1: BUBBLE OVERVIEW (If activeLineupGenre is null and no active search query)
    if (!state.activeLineupGenre && !query) {
      if (elements.lineupExpandRow) elements.lineupExpandRow.style.display = 'none';
      if (elements.lineupFade) elements.lineupFade.style.display = 'none';

      let bubblesHtml = '<div class="genre-bubbles-grid">';

      GENRE_CLUSTERS.forEach(clusterDef => {
        const count = festivalData.performers.filter(p => {
          const cat = (p.category || '').toLowerCase();
          return cat.includes(clusterDef.categoryMatch);
        }).length;

        bubblesHtml += `
          <div class="genre-bubble-item ${clusterDef.themeClass}" data-genre-bubble="${clusterDef.id}" tabindex="0" role="button" aria-label="Prozkoumat žánr ${clusterDef.title}">
            <div class="genre-bubble-orb">
              <div class="bubble-orb-icon">${clusterDef.iconSvg}</div>
              <span class="bubble-orb-kicker">${clusterDef.kicker}</span>
              <h3 class="bubble-orb-title">${clusterDef.title}</h3>
              <span class="bubble-orb-badge">${count} umělců</span>
            </div>
            <button type="button" class="bubble-explore-cta" data-genre-explore="${clusterDef.id}">
              <span>Explore</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        `;
      });

      bubblesHtml += '</div>';
      elements.performersContainer.innerHTML = bubblesHtml;
      return;
    }

    // STATE 2: UNFOLDED 360° ASYMMETRIC SPIDERWEB CLOUD (Volně na stránce)
    // If a search query is active and activeLineupGenre is not set, pick the first matching cluster
    let activeClusterId = state.activeLineupGenre;
    if (!activeClusterId && query) {
      for (const cl of GENRE_CLUSTERS) {
        if (filteredAll.some(p => (p.category || '').toLowerCase().includes(cl.categoryMatch))) {
          activeClusterId = cl.id;
          break;
        }
      }
      if (!activeClusterId) activeClusterId = 'sound';
    }

    const activeCluster = GENRE_CLUSTERS.find(c => c.id === activeClusterId) || GENRE_CLUSTERS[0];
    
    // Performers belonging to this unfolded active cluster
    const clusterPerformers = filteredAll.filter(p => {
      const cat = (p.category || '').toLowerCase();
      return cat.includes(activeCluster.categoryMatch);
    });

    const unfoldedHtml = `
      <div class="unfolded-genre-cloud ${activeCluster.themeClass}" data-active-genre="${activeCluster.id}">
        <!-- Navigation bar with Back button and Quick Genre Switchers -->
        <div class="cloud-nav-bar">
          <button type="button" class="btn-cloud-back" id="btn-back-to-bubbles" title="Zpět na přehled všech 4 žánrů">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>Všechny 4 žánry</span>
          </button>

          <div class="cloud-genre-switchers">
            ${GENRE_CLUSTERS.map(c => `
              <button type="button" class="genre-switch-chip ${c.themeClass} ${c.id === activeCluster.id ? 'active' : ''}" data-switch-genre="${c.id}">
                <span class="switch-dot"></span>
                <span>${c.title}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Open, unconstrained 360° canvas (No boxed enclosing card) -->
        <div class="cloud-open-canvas" id="cloud-canvas-arena">
          <svg class="cloud-curves-svg" id="cloud-curves-svg" aria-hidden="true"></svg>

          <!-- Central Active Epicenter Bubble (Větší, vlnící se a blurred okraj, bez ikony) -->
          <div class="cloud-epicenter-hub ${activeCluster.themeClass}" id="cloud-epicenter-hub" title="Epicentrum žánru: ${activeCluster.title} (Lze tažením přemístit)">
            <span class="epicenter-kicker">${activeCluster.kicker}</span>
            <h3 class="epicenter-title">${activeCluster.title}</h3>
            <span class="epicenter-count-pill">${clusterPerformers.length} v pavučině</span>
          </div>

          <!-- Orbiting Satellites (Artists) around the Epicenter -->
          ${clusterPerformers.map((p, idx) => `
            <div class="cloud-artist-node ${activeCluster.themeClass}" 
                 id="cloud-node-${p.id}" 
                 data-performer-id="${p.id}" 
                 data-node-idx="${idx}"
                 tabindex="0" 
                 role="button" 
                 aria-haspopup="dialog" 
                 aria-label="${escapeHtml(p.name)}"
                 title="Klikněte pro detail nebo tažením přemístěte">
              <div class="node-content">
                <div class="node-top-row">
                  <span class="node-name">${escapeHtml(p.name)}</span>
                  <span class="node-country">${p.country || ''}</span>
                </div>
                <div class="node-role">${escapeHtml(p.role)}</div>
              </div>
              <button type="button" class="node-play-btn" data-audio-performer="${p.id}" aria-label="Přehrát ukázku ${escapeHtml(p.name)}" title="Přehrát generativní ukázku">
                <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </button>

              <!-- Rich Hover Details Card (Bližší info při hoveru) -->
              <div class="artist-hover-card" role="tooltip">
                <div class="hover-card-header">
                  <div class="hover-card-title">${escapeHtml(p.name)}</div>
                  <span class="hover-card-flag">${p.country || ''}</span>
                </div>
                <div class="hover-card-role">${escapeHtml(p.role)}${p.company ? ' — ' + escapeHtml(p.company) : ''}</div>
                <p class="hover-card-bio">${escapeHtml(p.bio || 'Vystupující na festivalu INTERFACE 2026.')}</p>
                ${p.featuredTrack ? `
                  <div class="hover-card-track">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                    <span>${escapeHtml(p.featuredTrack)}</span>
                  </div>
                ` : ''}
                <div class="hover-card-footer">
                  <button type="button" class="hover-play-btn" data-audio-performer="${p.id}">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    <span>Ukázka</span>
                  </button>
                  <button type="button" class="hover-detail-btn" data-performer-id="${p.id}">
                    Detail umělce →
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    elements.performersContainer.innerHTML = unfoldedHtml;

    if (elements.lineupExpandRow) elements.lineupExpandRow.style.display = 'none';
    if (elements.lineupFade) elements.lineupFade.style.display = 'none';

    // Calculate widely dispersed 360° positions, draw splines and attach drag handlers
    requestAnimationFrame(() => {
      positionCloudSatellitesAndCurves(activeCluster);
    });
  }

  // Update spline curve and anchor point for a specific satellite node
  function updateNodeSplineCurve(node, cx, cy, strokeColor, svg) {
    const perfId = node.getAttribute('data-performer-id');
    const curve = svg.querySelector(`#cloud-curve-${perfId}`);
    const circle = svg.querySelector(`#cloud-anchor-${perfId}`);
    if (!curve || !circle) return;

    const left = parseFloat(node.style.left) || 0;
    const top = parseFloat(node.style.top) || 0;
    const w = node.offsetWidth || 215;
    const h = node.offsetHeight || 56;

    const isLeftOfCenter = (left + w / 2) < cx;
    if (isLeftOfCenter) {
      node.classList.remove('anchor-left');
      node.classList.add('anchor-right');
    } else {
      node.classList.remove('anchor-right');
      node.classList.add('anchor-left');
    }

    const targetX = isLeftOfCenter ? (left + w) : left;
    const targetY = top + h / 2;

    const dx = targetX - cx;
    const dy = targetY - cy;
    const cp1X = cx + dx * 0.45;
    const cp1Y = cy + dy * 0.15;
    const cp2X = cx + dx * 0.65;
    const cp2Y = targetY - dy * 0.15;

    curve.setAttribute('d', `M ${cx.toFixed(1)} ${cy.toFixed(1)} C ${cp1X.toFixed(1)} ${cp1Y.toFixed(1)}, ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)}, ${targetX.toFixed(1)} ${targetY.toFixed(1)}`);
    circle.setAttribute('cx', targetX.toFixed(1));
    circle.setAttribute('cy', targetY.toFixed(1));
  }

  // Position satellite nodes 360° widely dispersed all around the epicenter and setup drag
  function positionCloudSatellitesAndCurves(clusterDef) {
    const arena = document.getElementById('cloud-canvas-arena');
    const svg = document.getElementById('cloud-curves-svg');
    const hub = document.getElementById('cloud-epicenter-hub');
    const nodes = document.querySelectorAll('.cloud-artist-node');
    if (!arena || !svg || !hub || !nodes.length) return;

    // Mobile fallback check: under 768px, layout is vertical flex
    if (window.innerWidth <= 768) {
      svg.innerHTML = '';
      return;
    }

    const arenaWidth = arena.offsetWidth || 1150;
    // Generously expanded height to give wide dispersion without overlapping
    const arenaHeight = Math.max(900, Math.min(1150, 800 + Math.ceil(nodes.length / 4) * 65));
    arena.style.minHeight = arenaHeight + 'px';

    const cx = arenaWidth / 2;
    const cy = arenaHeight / 2;

    // Center hub initial position
    hub.style.left = '50%';
    hub.style.top = '50%';
    hub.style.transform = 'translate(-50%, -50%)';

    const N = nodes.length;
    // Wide, non-overlapping asymmetric orbital radii
    const orbitalRadii = [300, 420, 340, 480, 290, 390, 450, 330, 470, 310, 410, 460, 320, 430, 350, 490];
    const nodeWidth = 215;
    const nodeHeight = 56;

    let pathsHtml = '';

    nodes.forEach((node, i) => {
      // 360 degree distribution around the epicenter
      const baseAngle = (i / N) * (Math.PI * 2) - Math.PI / 2;
      // Staggered angular jitter to avoid rigid circular feel
      const jitter = ((i % 4) - 1.5) * 0.08;
      const angle = baseAngle + jitter;
      const r = orbitalRadii[i % orbitalRadii.length];

      let nx = cx + r * Math.cos(angle) - nodeWidth / 2;
      let ny = cy + r * Math.sin(angle) - nodeHeight / 2;

      // Ensure nodes stay within arena bounds with safety padding
      nx = Math.max(20, Math.min(nx, arenaWidth - nodeWidth - 20));
      ny = Math.max(20, Math.min(ny, arenaHeight - nodeHeight - 20));

      node.style.left = `${nx.toFixed(1)}px`;
      node.style.top = `${ny.toFixed(1)}px`;

      // Set anchor point on the side facing the center
      const isLeftOfCenter = (nx + nodeWidth / 2) < cx;
      if (isLeftOfCenter) {
        node.classList.remove('anchor-left');
        node.classList.add('anchor-right');
      } else {
        node.classList.remove('anchor-right');
        node.classList.add('anchor-left');
      }

      const targetX = isLeftOfCenter ? (nx + nodeWidth) : nx;
      const targetY = ny + nodeHeight / 2;
      const perfId = node.getAttribute('data-performer-id');

      // Bezier control points for smooth natural organic spline curves
      const dx = targetX - cx;
      const dy = targetY - cy;
      const cp1X = cx + dx * 0.45;
      const cp1Y = cy + dy * 0.15;
      const cp2X = cx + dx * 0.65;
      const cp2Y = targetY - dy * 0.15;

      pathsHtml += `
        <path id="cloud-curve-${perfId}" 
              class="cloud-spline-curve" 
              d="M ${cx.toFixed(1)} ${cy.toFixed(1)} C ${cp1X.toFixed(1)} ${cp1Y.toFixed(1)}, ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)}, ${targetX.toFixed(1)} ${targetY.toFixed(1)}" 
              stroke="${clusterDef.color}"></path>
        <circle id="cloud-anchor-${perfId}" cx="${targetX.toFixed(1)}" cy="${targetY.toFixed(1)}" r="3" fill="${clusterDef.color}" opacity="0.85"></circle>
      `;
    });

    // Epicenter central anchor ring and luminous core
    pathsHtml += `
      <circle id="cloud-center-ring" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="12" fill="none" stroke="${clusterDef.color}" stroke-width="2" opacity="0.65"></circle>
      <circle id="cloud-center-dot" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" fill="${clusterDef.color}"></circle>
    `;

    svg.innerHTML = pathsHtml;

    // Attach curve hover interactions
    nodes.forEach(node => {
      const perfId = node.getAttribute('data-performer-id');
      const curve = svg.querySelector(`#cloud-curve-${perfId}`);
      if (!curve) return;

      node.addEventListener('mouseenter', () => {
        if (!node.classList.contains('is-dragging')) {
          curve.classList.add('active-curve');
        }
      });
      node.addEventListener('mouseleave', () => {
        curve.classList.remove('active-curve');
      });
    });

    // Epicenter hover: highlight all radiating curves
    hub.addEventListener('mouseenter', () => {
      svg.querySelectorAll('.cloud-spline-curve').forEach(c => c.classList.add('active-curve'));
    });
    hub.addEventListener('mouseleave', () => {
      svg.querySelectorAll('.cloud-spline-curve').forEach(c => c.classList.remove('active-curve'));
    });

    // Initialize Interactive Drag & Drop on Artist Nodes & Epicenter
    initCloudDrag(arena, svg, hub, nodes, clusterDef);
  }

  // Interactive Drag & Drop with real-time spline deformation
  function initCloudDrag(arena, svg, hub, nodes, clusterDef) {
    function getHubCenter() {
      const hubRect = hub.getBoundingClientRect();
      const arenaRect = arena.getBoundingClientRect();
      return {
        x: hubRect.left - arenaRect.left + hubRect.width / 2,
        y: hubRect.top - arenaRect.top + hubRect.height / 2
      };
    }

    // Dragging for individual artist nodes
    nodes.forEach(node => {
      let isDragging = false;
      let startX = 0, startY = 0;
      let initialLeft = 0, initialTop = 0;

      function onStart(e) {
        if (e.target.closest('button') || e.target.closest('.artist-hover-card')) return;

        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

        startX = clientX;
        startY = clientY;
        initialLeft = parseFloat(node.style.left) || 0;
        initialTop = parseFloat(node.style.top) || 0;
        isDragging = false;

        window.addEventListener('mousemove', onMove, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);
      }

      function onMove(e) {
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

        const dx = clientX - startX;
        const dy = clientY - startY;

        if (!isDragging && Math.hypot(dx, dy) > 4) {
          isDragging = true;
          node.setAttribute('data-dragged', '1');
          node.classList.add('is-dragging');
        }

        if (isDragging) {
          if (e.cancelable) e.preventDefault();
          const arenaW = arena.offsetWidth;
          const arenaH = arena.offsetHeight;
          const nodeW = node.offsetWidth || 215;
          const nodeH = node.offsetHeight || 56;

          let newLeft = Math.max(12, Math.min(arenaW - nodeW - 12, initialLeft + dx));
          let newTop = Math.max(12, Math.min(arenaH - nodeH - 12, initialTop + dy));

          node.style.left = `${newLeft.toFixed(1)}px`;
          node.style.top = `${newTop.toFixed(1)}px`;

          const hubPos = getHubCenter();
          updateNodeSplineCurve(node, hubPos.x, hubPos.y, clusterDef.color, svg);
        }
      }

      function onEnd() {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchend', onEnd);

        node.classList.remove('is-dragging');
        if (isDragging) {
          setTimeout(() => {
            node.removeAttribute('data-dragged');
          }, 160);
        }
      }

      node.addEventListener('mousedown', onStart);
      node.addEventListener('touchstart', onStart, { passive: true });
    });

    // Support dragging the center epicenter hub as well
    let isHubDragging = false;
    let hubStartX = 0, hubStartY = 0;
    let hubInitialLeft = 0, hubInitialTop = 0;

    function onHubStart(e) {
      if (e.target.closest('button')) return;
      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

      hubStartX = clientX;
      hubStartY = clientY;

      const hubRect = hub.getBoundingClientRect();
      const arenaRect = arena.getBoundingClientRect();
      hubInitialLeft = hubRect.left - arenaRect.left;
      hubInitialTop = hubRect.top - arenaRect.top;
      isHubDragging = false;

      window.addEventListener('mousemove', onHubMove, { passive: false });
      window.addEventListener('touchmove', onHubMove, { passive: false });
      window.addEventListener('mouseup', onHubEnd);
      window.addEventListener('touchend', onHubEnd);
    }

    function onHubMove(e) {
      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

      const dx = clientX - hubStartX;
      const dy = clientY - hubStartY;

      if (!isHubDragging && Math.hypot(dx, dy) > 4) {
        isHubDragging = true;
        hub.style.transform = 'none';
      }

      if (isHubDragging) {
        if (e.cancelable) e.preventDefault();
        const arenaW = arena.offsetWidth;
        const arenaH = arena.offsetHeight;
        const hubW = hub.offsetWidth || 250;
        const hubH = hub.offsetHeight || 250;

        let newLeft = Math.max(12, Math.min(arenaW - hubW - 12, hubInitialLeft + dx));
        let newTop = Math.max(12, Math.min(arenaH - hubH - 12, hubInitialTop + dy));

        hub.style.left = `${newLeft.toFixed(1)}px`;
        hub.style.top = `${newTop.toFixed(1)}px`;

        const curHubX = newLeft + hubW / 2;
        const curHubY = newTop + hubH / 2;

        const centerRing = svg.querySelector('#cloud-center-ring');
        const centerDot = svg.querySelector('#cloud-center-dot');
        if (centerRing) {
          centerRing.setAttribute('cx', curHubX.toFixed(1));
          centerRing.setAttribute('cy', curHubY.toFixed(1));
        }
        if (centerDot) {
          centerDot.setAttribute('cx', curHubX.toFixed(1));
          centerDot.setAttribute('cy', curHubY.toFixed(1));
        }

        nodes.forEach(node => {
          updateNodeSplineCurve(node, curHubX, curHubY, clusterDef.color, svg);
        });
      }
    }

    function onHubEnd() {
      window.removeEventListener('mousemove', onHubMove);
      window.removeEventListener('touchmove', onHubMove);
      window.removeEventListener('mouseup', onHubEnd);
      window.removeEventListener('touchend', onHubEnd);
    }

    hub.addEventListener('mousedown', onHubStart);
    hub.addEventListener('touchstart', onHubStart, { passive: true });
  }

  // Redraw curves on window resize with debouncing
  let resizeCurvesTimeout = null;
  window.addEventListener('resize', () => {
    if (resizeCurvesTimeout) clearTimeout(resizeCurvesTimeout);
    resizeCurvesTimeout = setTimeout(() => {
      if (state.activeLineupGenre) {
        const activeCluster = GENRE_CLUSTERS.find(c => c.id === state.activeLineupGenre) || GENRE_CLUSTERS[0];
        positionCloudSatellitesAndCurves(activeCluster);
      }
    }, 80);
  });

  // 5. Interactive "Můj program" & Clashfinder
  function toggleScheduleItem(itemId) {
    const idx = state.myScheduleIds.indexOf(itemId);
    if (idx > -1) {
      state.myScheduleIds.splice(idx, 1);
      showToast('Položka odebrána z Vašeho programu.');
    } else {
      state.myScheduleIds.push(itemId);
      showToast('Položka uložena do „Můj program“!');
    }

    localStorage.setItem('interface_my_schedule', JSON.stringify(state.myScheduleIds));
    updateScheduleBadges();
    renderProgram();
    if (elements.scheduleDrawer && elements.scheduleDrawer.classList.contains('open')) {
      renderMyScheduleDrawer();
    }
  }

  function updateScheduleBadges() {
    const count = state.myScheduleIds.length;
    if (elements.scheduleBadge) elements.scheduleBadge.textContent = count;
    if (elements.mScheduleBadge) elements.mScheduleBadge.textContent = count;
  }

  function renderMyScheduleDrawer() {
    const savedItems = festivalData.schedule.filter(item => state.myScheduleIds.includes(item.id));

    if (savedItems.length === 0) {
      if (elements.clashAlert) elements.clashAlert.style.display = 'none';
      elements.myScheduleList.innerHTML = `
        <div class="empty-schedule-state">
          <p>Zatím jste si neuložili žádné vystoupení.</p>
          <p style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--text-dim);">
            Klikněte na tlačítko „Přidat“ u jakéhokoliv slotu v programu.
          </p>
        </div>
      `;
      return;
    }

    // Sort by day and time
    savedItems.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.startTime.localeCompare(b.startTime);
    });

    // Clashfinder conflict check
    const clashes = [];
    for (let i = 0; i < savedItems.length; i++) {
      for (let j = i + 1; j < savedItems.length; j++) {
        const itemA = savedItems[i];
        const itemB = savedItems[j];
        if (itemA.day === itemB.day && itemA.stageId !== itemB.stageId) {
          if (itemA.startTime < itemB.endTime && itemB.startTime < itemA.endTime) {
            clashes.push(`${itemA.title} (${itemA.startTime}) a ${itemB.title} (${itemB.startTime})`);
          }
        }
      }
    }

    if (clashes.length > 0 && elements.clashAlert) {
      elements.clashAlert.style.display = 'flex';
      elements.clashDetails.textContent = `Pozor, v programu máte překryv: ${clashes[0]}`;
    } else if (elements.clashAlert) {
      elements.clashAlert.style.display = 'none';
    }

    const dayNames = { 1: 'Pátek', 2: 'Sobota', 3: 'Neděle' };
    elements.myScheduleList.innerHTML = savedItems.map(item => {
      const performer = getPerformerById(item.performerIds[0]);
      const stage = getStageById(item.stageId);

      return `
        <div class="my-schedule-item">
          <div class="my-schedule-item-info">
            <div class="my-schedule-item-title">${escapeHtml(item.title)}</div>
            <div class="my-schedule-item-meta">${dayNames[item.day]} / ${item.startTime}–${item.endTime} — ${stage ? stage.name : ''}</div>
          </div>
          <button type="button" class="btn-remove-item remove-saved-btn" data-remove-id="${item.id}" aria-label="Odstranit">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      `;
    }).join('');

    elements.myScheduleList.querySelectorAll('.remove-saved-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-remove-id');
        toggleScheduleItem(id);
      });
    });
  }

  // 6. Web Audio API Sound Toy & Preview Player
  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) audioCtx = new AudioCtxClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playHeroSound(type) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'analog') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now); // A2
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    } else if (type === 'glitch') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.05);
      osc.frequency.setValueAtTime(220, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    } else if (type === 'ambient') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(146.83, now); // D3
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    } else if (type === 'algorave') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(65.41, now); // C2 bass
      osc.frequency.exponentialRampToValueAtTime(32.7, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.85);

    // Trigger visual pulse on hero canvas
    if (window.triggerCanvasWave) {
      window.triggerCanvasWave();
    }
  }

  function playPerformerPreview(performerId) {
    const performer = getPerformerById(performerId);
    if (!performer) return;

    state.activePlayingPerformerId = performerId;
    state.isPlayingAudio = true;

    elements.globalPlayer.style.display = 'block';
    elements.playerArtistName.textContent = performer.name;
    elements.playerTrackTitle.textContent = performer.featuredTrack || 'Generative Sound Preview';
    elements.playerTogglePlay.querySelector('.play-icon').style.display = 'none';
    elements.playerTogglePlay.querySelector('.pause-icon').style.display = 'block';

    startContinuousSynth(performer.category);
  }

  function startContinuousSynth(category) {
    stopContinuousSynth();
    const ctx = getAudioContext();
    if (!ctx) return;

    let baseFreq = 130.81; // C3
    if (category === 'Hudba & Live Acts') baseFreq = 110; // A2
    if (category === 'Audiovizuální umění') baseFreq = 146.83; // D3
    if (category === 'Kreativní kód & Algorave') baseFreq = 164.81; // E3

    synthOscillator = ctx.createOscillator();
    synthGain = ctx.createGain();

    synthOscillator.type = category === 'Kreativní kód & Algorave' ? 'sawtooth' : 'sine';
    synthOscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    synthGain.gain.setValueAtTime(0.06, ctx.currentTime);

    synthOscillator.connect(synthGain);
    synthGain.connect(ctx.destination);
    synthOscillator.start();

    const pattern = [1, 1.25, 1.5, 1.875, 2];
    let idx = 0;
    synthInterval = setInterval(() => {
      if (!synthOscillator || !ctx) return;
      idx = (idx + 1) % pattern.length;
      synthOscillator.frequency.setTargetAtTime(baseFreq * pattern[idx], ctx.currentTime, 0.08);
    }, 450);
  }

  function stopContinuousSynth() {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
    if (synthOscillator) {
      try {
        synthOscillator.stop();
        synthOscillator.disconnect();
      } catch (e) {}
      synthOscillator = null;
    }
  }

  function pauseAudioPreview() {
    stopContinuousSynth();
    state.isPlayingAudio = false;
    elements.playerTogglePlay.querySelector('.play-icon').style.display = 'block';
    elements.playerTogglePlay.querySelector('.pause-icon').style.display = 'none';
  }

  function resumeAudioPreview() {
    if (state.activePlayingPerformerId) {
      const performer = getPerformerById(state.activePlayingPerformerId);
      if (performer) {
        state.isPlayingAudio = true;
        elements.playerTogglePlay.querySelector('.play-icon').style.display = 'none';
        elements.playerTogglePlay.querySelector('.pause-icon').style.display = 'block';
        startContinuousSynth(performer.category);
      }
    }
  }

  function closeAudioPlayer() {
    stopContinuousSynth();
    state.isPlayingAudio = false;
    elements.globalPlayer.style.display = 'none';
  }

  // 7. Modals: Performer Detail, Item Detail & Workshop Reservation
  function openPerformerModal(performerId) {
    const performer = getPerformerById(performerId);
    if (!performer) return;

    const appearances = festivalData.schedule.filter(s => s.performerIds.includes(performer.id));

    const initials = performer.name.split(' ').map(w => w[0]).join('').slice(0,2);
    elements.modalBodyContent.innerHTML = `
      <div class="modal-performer-header">
        <div class="modal-avatar">${escapeHtml(initials)}</div>
        <div>
          <span class="stage-badge stage-badge-lab" style="margin-bottom:0.4rem;display:inline-block;">${escapeHtml(performer.category)}</span>
          <div class="modal-performer-name">${escapeHtml(performer.name)}</div>
          <div class="modal-performer-role">${escapeHtml(performer.role)} — ${escapeHtml(performer.company || '')} [${performer.country}]</div>
        </div>
      </div>

      <p class="modal-performer-bio">${escapeHtml(performer.bio || '')}</p>

      <div style="background: var(--bg-elevated); border: 1px solid var(--border-faint); border-radius: 10px; padding: 0.9rem 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;">
        <div>
          <span style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.2rem;">Charakteristická skladba</span>
          <span style="font-family: var(--font-serif); font-size: 1rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(performer.featuredTrack || 'Live Performance')}</span>
        </div>
        <button type="button" class="btn btn-primary btn-sm modal-play-btn" data-audio-performer="${performer.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          Přehrát ukázku
        </button>
      </div>

      <div class="modal-schedule-section">
        <h4>Vystoupení na INTERFACE 2026</h4>
        ${appearances.map(app => {
          const stage = getStageById(app.stageId);
          const isSaved = state.myScheduleIds.includes(app.id);
          return `
            <div class="modal-schedule-item" style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;">
              <div>
                <div style="font-family:var(--font-serif);font-size:0.95rem;font-weight:600;color:var(--text-primary);margin-bottom:0.15rem;">${escapeHtml(app.title)}</div>
                <div style="font-family:var(--font-mono);font-size:0.68rem;color:var(--text-tertiary);">Den ${app.day} / ${app.startTime}–${app.endTime} — ${stage ? stage.name : ''}</div>
              </div>
              <button type="button" class="btn btn-outline btn-sm modal-save-btn" data-item-id="${app.id}" style="flex-shrink:0;">
                ${isSaved ? 'Uloženo' : '+ Uložit'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    elements.modalBodyContent.querySelector('.modal-play-btn').addEventListener('click', () => {
      playPerformerPreview(performer.id);
    });

    elements.modalBodyContent.querySelectorAll('.modal-save-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-item-id');
        toggleScheduleItem(id);
        openPerformerModal(performerId);
      });
    });

    elements.detailModal.classList.add('open');
  }

  function openItemDetailModal(itemId) {
    const item = festivalData.schedule.find(s => s.id === itemId);
    if (!item) return;

    const performer = getPerformerById(item.performerIds[0]);
    const stage = getStageById(item.stageId);
    const isSaved = state.myScheduleIds.includes(item.id);

    elements.modalBodyContent.innerHTML = `
      <div class="modal-program-meta" style="padding-right:2.5rem;">
        <span class="modal-meta-tag">${stage ? stage.name : ''}</span>
        <span class="modal-meta-tag">Den ${item.day} / ${item.startTime}–${item.endTime}</span>
        <span class="modal-meta-tag">${escapeHtml(item.type)}</span>
        ${item.level ? `<span class="modal-meta-tag">Úroveň: ${escapeHtml(item.level)}</span>` : ''}
      </div>

      <h2 class="modal-program-title">${escapeHtml(item.title)}</h2>

      ${performer ? `
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1.25rem;font-size:0.85rem;color:var(--text-secondary);">
          Účinkující:
          <span style="font-family:var(--font-serif);font-size:0.9rem;font-weight:600;color:var(--text-primary);cursor:pointer;" id="modal-performer-link" data-perf-id="${performer.id}">
            ${escapeHtml(performer.name)} [${performer.country}]
          </span>
        </div>
      ` : ''}

      <p class="modal-program-desc">${escapeHtml(item.description)}</p>

      <div class="tags-row" style="margin-bottom:1.5rem;">
        ${(item.tags || []).map(t => `<span class="item-tag">#${escapeHtml(t)}</span>`).join('')}
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-faint);padding-top:1.25rem;gap:0.75rem;">
        ${performer ? `
          <button type="button" class="btn btn-primary btn-sm" id="modal-play-track-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Přehrát ukázku
          </button>
        ` : '<div></div>'}
        <button type="button" class="btn btn-outline btn-sm" id="modal-save-item-btn">
          ${isSaved ? 'Uloženo v programu' : '+ Přidat do programu'}
        </button>
      </div>
    `;

    const perfLink = document.getElementById('modal-performer-link');
    if (perfLink) {
      perfLink.addEventListener('click', () => {
        openPerformerModal(perfLink.getAttribute('data-perf-id'));
      });
    }

    const playBtn = document.getElementById('modal-play-track-btn');
    if (playBtn && performer) {
      playBtn.addEventListener('click', () => {
        playPerformerPreview(performer.id);
      });
    }

    const saveBtn = document.getElementById('modal-save-item-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        toggleScheduleItem(item.id);
        openItemDetailModal(itemId);
      });
    }

    elements.detailModal.classList.add('open');
  }

  function openWorkshopReservationModal(workshopId) {
    const item = festivalData.schedule.find(s => s.id === workshopId);
    if (!item) return;

    const performer = getPerformerById(item.performerIds[0]);
    const reservedList = state.workshopReservations[item.id] || [];
    const remaining = Math.max(0, item.capacity - reservedList.length);

    elements.modalBodyContent.innerHTML = `
      <div style="margin-bottom: 1rem;">
        <span class="stage-badge stage-badge-lab">Praktická tvůrčí laboratoř</span>
      </div>

      <h2 style="font-size: 1.35rem; color: #fff; margin-bottom: 0.5rem;">Rezervace: ${escapeHtml(item.title)}</h2>
      <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 1.25rem;">
        Lektor: ${performer ? performer.name : ''} • Kapacita: ${item.capacity} míst (volno: ${remaining})
      </p>

      <form id="workshop-res-form" style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <label class="filter-label" for="res-name">Jméno a příjmení:</label>
          <input type="text" id="res-name" class="form-input" required placeholder="např. Ondřej Novák">
        </div>

        <div>
          <label class="filter-label" for="res-email">E-mail pro zaslání potvrzení:</label>
          <input type="email" id="res-email" class="form-input" required placeholder="ondrej@example.com">
        </div>

        <div style="font-size: 0.8rem; color: var(--text-dim); background: var(--bg-primary); padding: 0.75rem; border-radius: 8px;">
          Na workshopu je k dispozici zapůjčení hardwaru. Doporučujeme vzít si vlastní kabelová sluchátka (Jack 3.5mm).
        </div>

        <button type="submit" class="btn btn-primary btn-block" style="margin-top: 0.5rem;">
          Potvrdit nezávaznou rezervaci
        </button>
      </form>
    `;

    const form = document.getElementById('workshop-res-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('res-name').value.trim();
      const email = document.getElementById('res-email').value.trim();

      if (!state.workshopReservations[item.id]) {
        state.workshopReservations[item.id] = [];
      }

      state.workshopReservations[item.id].push({ name, email, date: new Date().toISOString() });
      localStorage.setItem('interface_workshop_res', JSON.stringify(state.workshopReservations));

      if (!state.myScheduleIds.includes(item.id)) {
        state.myScheduleIds.push(item.id);
        localStorage.setItem('interface_my_schedule', JSON.stringify(state.myScheduleIds));
        updateScheduleBadges();
      }

      elements.detailModal.classList.remove('open');
      showToast(`Rezervace pro ${name} potvrzena! Workshop byl přidán do Vašeho programu.`);
      renderProgram();
    });

    elements.detailModal.classList.add('open');
  }

  // 8. Venue Map Setup
  // 8. Venue Full-Bleed Map & Pinpoint Hover HUD
  function setupStageMap() {
    const zones = document.querySelectorAll('.map-interactive-zone');
    const hud = document.getElementById('stage-hover-hud');
    const arrowEl = document.getElementById('hud-pointer-arrow');
    const mapViewport = document.querySelector('.stages-map-viewport');
    if (!zones.length || !hud || !mapViewport) return;

    const hudBadge = document.getElementById('hud-stage-badge');
    const hudCap = document.getElementById('hud-capacity-badge');
    const hudTitle = document.getElementById('hud-stage-title');
    const hudLoc = document.getElementById('hud-stage-location');
    const hudDesc = document.getElementById('hud-stage-desc');
    const hudList = document.getElementById('hud-preview-list');
    const hudBtn = document.getElementById('hud-filter-btn');

    let currentTargetStage = null;
    let hideTimeout = null;

    function populateAndShowHud(stageId, targetEl) {
      if (hideTimeout) clearTimeout(hideTimeout);

      if (stageId === 'poi_park') {
        currentTargetStage = null;
        if (hudBadge) hudBadge.textContent = 'SPECIÁLNÍ ZÓNA';
        if (hudCap) hudCap.textContent = 'Venkovní areál';
        if (hudTitle) hudTitle.textContent = 'Světelný park & Fontána';
        if (hudLoc) hudLoc.textContent = 'Křižíkova fontána a park';
        if (hudDesc) hudDesc.textContent = 'Imerzivní světelné a laserové sochy, projekce vodní mlhy a noční kinetické instalace (20:30–02:00).';
        if (hudList) {
          hudList.innerHTML = `
            <div class="hud-preview-item"><span class="hud-preview-time">20:30</span> Lunchmeat Prism Void</div>
            <div class="hud-preview-item"><span class="hud-preview-time">22:00</span> Laser Choreography Live</div>
          `;
        }
        if (hudBtn) hudBtn.style.display = 'none';
      } else {
        const stage = getStageById(stageId);
        if (!stage) return;
        currentTargetStage = stage.id;

        if (hudBadge) hudBadge.textContent = stage.id === 'stage_sound' ? 'SCÉNA 01' : stage.id === 'stage_av' ? 'SCÉNA 02' : 'SCÉNA 03';
        if (hudCap) hudCap.textContent = `Kapacita: ${stage.capacity} osob`;
        if (hudTitle) hudTitle.textContent = stage.name;
        if (hudLoc) hudLoc.textContent = stage.location;
        if (hudDesc) hudDesc.textContent = stage.description;

        const stageItems = festivalData.schedule
          .filter(s => s.stageId === stage.id && s.day === state.currentDay)
          .slice(0, 3);

        if (hudList) {
          hudList.innerHTML = stageItems.map(item => `
            <div class="hud-preview-item">
              <span class="hud-preview-time">${item.startTime}</span>
              <span>${escapeHtml(item.title)}</span>
            </div>
          `).join('') || '<div class="hud-preview-item" style="color:var(--text-tertiary);">Žádný program pro vybraný den.</div>';
        }

        if (hudBtn) {
          hudBtn.style.display = 'inline-flex';
          hudBtn.textContent = `Zobrazit program: ${stage.name} →`;
        }
      }

      // Pinpoint positioning with directional pointer arrow
      const vpRect = mapViewport.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      const targetCenterX = targetRect.left - vpRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top - vpRect.top + targetRect.height / 2;

      const hudWidth = Math.min(320, vpRect.width - 32);
      const hudHeight = 220;

      let posX = 0;
      let posY = 0;
      let arrowClass = 'arrow-top';

      hud.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left', 'arrow-right');

      // Adaptive quadrant placement
      if (targetCenterY > vpRect.height * 0.52) {
        // Lower building (e.g. stage_av) -> position HUD above building
        posY = targetRect.top - vpRect.top - hudHeight - 16;
        posX = targetCenterX - hudWidth / 2;
        arrowClass = 'arrow-bottom';
      } else if (targetCenterX > vpRect.width * 0.62) {
        // Far right zone (e.g. poi_park) -> position HUD to the left
        posX = targetRect.left - vpRect.left - hudWidth - 20;
        posY = targetCenterY - hudHeight / 2;
        arrowClass = 'arrow-right';
      } else {
        // Upper buildings (e.g. stage_sound, stage_lab) -> position HUD below building
        posY = targetRect.bottom - vpRect.top + 16;
        posX = targetCenterX - hudWidth / 2;
        arrowClass = 'arrow-top';
      }

      // Viewport safety boundary clamping
      posX = Math.max(16, Math.min(posX, vpRect.width - hudWidth - 16));
      posY = Math.max(16, Math.min(posY, vpRect.height - hudHeight - 16));

      hud.classList.add(arrowClass);
      hud.style.left = `${posX.toFixed(1)}px`;
      hud.style.top = `${posY.toFixed(1)}px`;

      // Direct pointer arrow alignment towards the building center
      if (arrowEl) {
        if (arrowClass === 'arrow-top' || arrowClass === 'arrow-bottom') {
          const arrowOffset = Math.max(24, Math.min(targetCenterX - posX, hudWidth - 24));
          arrowEl.style.left = `${arrowOffset.toFixed(1)}px`;
          arrowEl.style.top = '';
        } else if (arrowClass === 'arrow-left' || arrowClass === 'arrow-right') {
          const arrowOffset = Math.max(24, Math.min(targetCenterY - posY, hudHeight - 24));
          arrowEl.style.top = `${arrowOffset.toFixed(1)}px`;
          arrowEl.style.left = '';
        }
      }

      hud.classList.add('visible');
      hud.setAttribute('aria-hidden', 'false');
    }

    function hideHud() {
      hideTimeout = setTimeout(() => {
        hud.classList.remove('visible');
        hud.setAttribute('aria-hidden', 'true');
        zones.forEach(z => z.classList.remove('hovered'));
      }, 150);
    }

    zones.forEach(zone => {
      const stageId = zone.getAttribute('data-stage-id');

      zone.addEventListener('mouseenter', () => {
        zones.forEach(z => z.classList.remove('hovered'));
        zone.classList.add('hovered');
        populateAndShowHud(stageId, zone);
      });

      zone.addEventListener('mouseleave', () => {
        hideHud();
      });

      zone.addEventListener('click', (e) => {
        e.stopPropagation();
        zones.forEach(z => z.classList.remove('hovered'));
        zone.classList.add('hovered');
        populateAndShowHud(stageId, zone);
      });
    });

    // Keep HUD open when hovering into the HUD itself
    hud.addEventListener('mouseenter', () => {
      if (hideTimeout) clearTimeout(hideTimeout);
    });
    hud.addEventListener('mouseleave', () => {
      hideHud();
    });

    if (hudBtn) {
      hudBtn.addEventListener('click', () => {
        if (currentTargetStage) {
          state.selectedStage = currentTargetStage;
          if (elements.stageFilter) elements.stageFilter.value = currentTargetStage;
          renderProgram();
          const progSec = document.getElementById('program');
          if (progSec) progSec.scrollIntoView({ behavior: 'smooth' });
          showToast(`Aktivován filtr: ${currentTargetStage}`);
        }
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.map-interactive-zone') && !e.target.closest('#stage-hover-hud')) {
        hideHud();
      }
    });
  }

  // 9. Hero Sound Toy & Canvas Animation
  function initHeroSoundToy() {
    if (!elements.soundPads) return;
    elements.soundPads.forEach(pad => {
      pad.addEventListener('click', (e) => {
        const soundType = pad.getAttribute('data-sound');
        playHeroSound(soundType);

        pad.classList.add('active');
        setTimeout(() => pad.classList.remove('active'), 250);
      });
    });
  }

  function initHeroCanvasAnimation() {
    const canvas = elements.heroCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.offsetWidth || 1200;
      height = canvas.parentElement.offsetHeight || 500;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    resize();
    window.addEventListener('resize', resize);

    // Particle nodes for visual synthesizer peaks
    const particles = Array.from({ length: 24 }, (_, i) => ({
      x: (i / 24) * 1200,
      waveIndex: i % 4,
      speed: 0.8 + Math.random() * 0.9,
      size: 2.2 + Math.random() * 2.2,
      pulse: Math.random() * Math.PI * 2
    }));

    let phase = 0;
    let burstAmplitude = 36;
    let mouseX = -1000;
    let mouseY = -1000;

    const hero = document.getElementById('hero');
    if (hero) {
      hero.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      });
      hero.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
      });
    }

    window.triggerCanvasWave = function () {
      burstAmplitude = 75;
    };

    function draw() {
      ctx.clearRect(0, 0, width, height);

      phase += 0.022;
      burstAmplitude += (36 - burstAmplitude) * 0.04;

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

      // 4 Vivid Audio Harmonics (Multi-layered, high contrast waves)
      const waves = [
        {
          freq: 0.009,
          speed: 1.1,
          ampMult: 1.1,
          lineWidth: 2.6,
          color: isDark ? 'rgba(124, 109, 252, 0.85)' : 'rgba(82, 66, 216, 0.72)',
          glow: isDark ? 'rgba(124, 109, 252, 0.4)' : 'rgba(82, 66, 216, 0.25)',
          yOffset: 0
        },
        {
          freq: 0.014,
          speed: -0.9,
          ampMult: 0.85,
          lineWidth: 2.2,
          color: isDark ? 'rgba(218, 173, 76, 0.9)' : 'rgba(165, 126, 40, 0.8)',
          glow: isDark ? 'rgba(218, 173, 76, 0.4)' : 'rgba(165, 126, 40, 0.25)',
          yOffset: 12
        },
        {
          freq: 0.018,
          speed: 1.4,
          ampMult: 0.7,
          lineWidth: 2.0,
          color: isDark ? 'rgba(212, 109, 170, 0.8)' : 'rgba(182, 54, 131, 0.68)',
          glow: isDark ? 'rgba(212, 109, 170, 0.35)' : 'rgba(182, 54, 131, 0.2)',
          yOffset: -14
        },
        {
          freq: 0.007,
          speed: -0.6,
          ampMult: 0.95,
          lineWidth: 1.8,
          color: isDark ? 'rgba(63, 196, 212, 0.75)' : 'rgba(9, 142, 156, 0.65)',
          glow: isDark ? 'rgba(63, 196, 212, 0.3)' : 'rgba(9, 142, 156, 0.2)',
          yOffset: 24
        }
      ];

      const centerY = height * 0.52;

      waves.forEach((w, waveIdx) => {
        ctx.beginPath();
        ctx.lineWidth = w.lineWidth;
        ctx.strokeStyle = w.color;
        ctx.shadowColor = w.glow;
        ctx.shadowBlur = 12;

        const step = 5;
        for (let x = 0; x <= width + step; x += step) {
          // Distance to mouse for interactive swell
          const dx = x - mouseX;
          const mouseDist = Math.abs(dx);
          const mouseInfluence = mouseDist < 160 ? Math.cos((mouseDist / 160) * (Math.PI / 2)) * 24 : 0;

          const baseAmp = burstAmplitude * w.ampMult + mouseInfluence;
          const y = centerY + w.yOffset +
            Math.sin(x * w.freq + phase * w.speed) * baseAmp +
            Math.cos(x * (w.freq * 2.1) - phase * 0.7) * (baseAmp * 0.35);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Reset shadow for particles
      ctx.shadowBlur = 0;

      // Draw pulsating harmonic particles on the waves
      particles.forEach(p => {
        p.x += p.speed;
        if (p.x > width) p.x = 0;
        p.pulse += 0.05;

        const w = waves[p.waveIndex];
        const baseAmp = burstAmplitude * w.ampMult;
        const y = centerY + w.yOffset +
          Math.sin(p.x * w.freq + phase * w.speed) * baseAmp +
          Math.cos(p.x * (w.freq * 2.1) - phase * 0.7) * (baseAmp * 0.35);

        const currentSize = p.size + Math.sin(p.pulse) * 1.2;

        ctx.fillStyle = w.color;
        ctx.beginPath();
        ctx.arc(p.x, y, Math.max(1.5, currentSize), 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }

    draw();
  }

  // 10. Calendar Export (.ics)
  function exportScheduleToICS() {
    const saved = festivalData.schedule.filter(s => state.myScheduleIds.includes(s.id));
    if (saved.length === 0) {
      showToast('Nemáte uložena žádná vystoupení k exportu.');
      return;
    }

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//INTERFACE 2026//Festival Schedule//CS\nCALSCALE:GREGORIAN\n";
    saved.forEach(item => {
      const stage = getStageById(item.stageId);
      const stageName = stage ? stage.name : 'INTERFACE 2026';
      const dateRaw = item.date.replace(/-/g, '');
      const startRaw = item.startTime.replace(':', '') + '00';
      const endRaw = item.endTime.replace(':', '') + '00';

      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:${item.title}\n`;
      icsContent += `DESCRIPTION:${item.description}\n`;
      icsContent += `LOCATION:${stageName}, Výstaviště Praha Holešovice\n`;
      icsContent += `DTSTART:${dateRaw}T${startRaw}\n`;
      icsContent += `DTEND:${dateRaw}T${endRaw}\n`;
      icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'interface_2026_muj_program.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Soubor kalendáře (.ics) byl stažen!');
  }

  // 11. Event Listeners Setup
  function initEventListeners() {
    // Day Tabs
    if (elements.dayTabs) {
      elements.dayTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          elements.dayTabs.forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          });
          const target = e.currentTarget;
          target.classList.add('active');
          target.setAttribute('aria-selected', 'true');
          state.currentDay = parseInt(target.getAttribute('data-day'), 10);
          renderProgram();
        });
      });
    }

    // Stage & Type Filters
    if (elements.stageFilter) {
      elements.stageFilter.addEventListener('change', (e) => {
        state.selectedStage = e.target.value;
        renderProgram();
      });
    }

    if (elements.typeFilter) {
      elements.typeFilter.addEventListener('change', (e) => {
        state.selectedType = e.target.value;
        renderProgram();
      });
    }

    // Program Search Input
    if (elements.programSearch) {
      elements.programSearch.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (elements.clearSearchBtn) {
          elements.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
        }
        renderProgram();
      });
    }

    if (elements.clearSearchBtn) {
      elements.clearSearchBtn.addEventListener('click', () => {
        state.searchQuery = '';
        if (elements.programSearch) elements.programSearch.value = '';
        elements.clearSearchBtn.style.display = 'none';
        renderProgram();
      });
    }

    if (elements.resetFiltersBtn) {
      elements.resetFiltersBtn.addEventListener('click', resetFilters);
    }

    // Quick Filter Chips
    document.querySelectorAll('.chip-filter[data-stage]').forEach(chip => {
      chip.addEventListener('click', () => {
        const stage = chip.getAttribute('data-stage');
        const day = parseInt(chip.getAttribute('data-day'), 10);
        state.selectedStage = stage;
        state.currentDay = day;
        if (elements.stageFilter) elements.stageFilter.value = stage;
        if (elements.dayTabs) {
          elements.dayTabs.forEach(t => {
            const isAct = parseInt(t.getAttribute('data-day'), 10) === day;
            t.classList.toggle('active', isAct);
            t.setAttribute('aria-selected', isAct ? 'true' : 'false');
          });
        }
        renderProgram();
        showToast('Aktivován filtr: Pátek večer @ Sound & Live Stage (Scénář 1)');
      });
    });

    document.querySelectorAll('.chip-filter[data-type]').forEach(chip => {
      chip.addEventListener('click', () => {
        const type = chip.getAttribute('data-type');
        state.selectedType = type;
        if (elements.typeFilter) elements.typeFilter.value = type;
        renderProgram();
      });
    });

    // Category Pills (Lineup)
    if (elements.categoryPills) {
      elements.categoryPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          elements.categoryPills.forEach(p => p.classList.remove('active'));
          const target = e.currentTarget;
          target.classList.add('active');
          state.performerCategory = target.getAttribute('data-category');
          renderLineup();
        });
      });
    }

    // Performer Search Input
    if (elements.performerSearch) {
      elements.performerSearch.addEventListener('input', (e) => {
        state.performerQuery = e.target.value;
        renderLineup();
      });
    }

    // Lineup Expand / Collapse Button
    if (elements.btnLineupExpand) {
      elements.btnLineupExpand.addEventListener('click', () => {
        state.lineupExpanded = !state.lineupExpanded;
        if (!state.lineupExpanded) {
          const lineupSec = document.getElementById('lineup');
          if (lineupSec) lineupSec.scrollIntoView({ behavior: 'smooth' });
        }
        renderLineup();
      });
    }

    // Theme Toggle Button
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // View Mode Switcher (Grid Timetable vs Timeline List)
    if (elements.viewModeGridBtn) {
      elements.viewModeGridBtn.addEventListener('click', () => {
        state.programViewMode = 'grid';
        if (elements.viewModeGridBtn) elements.viewModeGridBtn.classList.add('active');
        if (elements.viewModeListBtn) elements.viewModeListBtn.classList.remove('active');
        renderProgram();
      });
    }

    if (elements.viewModeListBtn) {
      elements.viewModeListBtn.addEventListener('click', () => {
        state.programViewMode = 'list';
        if (elements.viewModeListBtn) elements.viewModeListBtn.classList.add('active');
        if (elements.viewModeGridBtn) elements.viewModeGridBtn.classList.remove('active');
        renderProgram();
      });
    }

    // Delegated Clicks on Schedule
    if (elements.scheduleContainer) {
      elements.scheduleContainer.addEventListener('click', (e) => {
        const audioBtn = e.target.closest('.btn-audio-preview');
        if (audioBtn) {
          e.stopPropagation();
          const perfId = audioBtn.getAttribute('data-audio-performer');
          playPerformerPreview(perfId);
          return;
        }

        const saveBtn = e.target.closest('.btn-save-schedule');
        if (saveBtn) {
          e.stopPropagation();
          const itemId = saveBtn.getAttribute('data-item-id');
          toggleScheduleItem(itemId);
          return;
        }

        const workshopBtn = e.target.closest('.btn-workshop-reg');
        if (workshopBtn) {
          e.stopPropagation();
          const workshopId = workshopBtn.getAttribute('data-workshop-id');
          openWorkshopReservationModal(workshopId);
          return;
        }

        const perfLink = e.target.closest('.performer-name-link');
        if (perfLink) {
          e.stopPropagation();
          const perfId = perfLink.getAttribute('data-performer-id');
          openPerformerModal(perfId);
          return;
        }

        const cardTitle = e.target.closest('.schedule-card-title, .act-title');
        const card = e.target.closest('.schedule-card, .timetable-act-card');
        if (cardTitle || card) {
          const itemId = (cardTitle || card).getAttribute('data-item-id');
          openItemDetailModal(itemId);
        }
      });
    }

    // Delegated Clicks on Performers: Bubbles & 360° Unfolded Spiderweb
    if (elements.performersContainer) {
      elements.performersContainer.addEventListener('click', (e) => {
        // 1. Back to 4 bubbles overview
        const backBtn = e.target.closest('#btn-back-to-bubbles, .btn-cloud-back');
        if (backBtn) {
          e.stopPropagation();
          state.activeLineupGenre = null;
          renderLineup();
          return;
        }

        // 2. Switch active genre chip in unfolded cloud
        const switchChip = e.target.closest('[data-switch-genre]');
        if (switchChip) {
          e.stopPropagation();
          state.activeLineupGenre = switchChip.getAttribute('data-switch-genre');
          renderLineup();
          return;
        }

        // 3. Click on a Genre Bubble or its Explore button
        const bubble = e.target.closest('[data-genre-bubble], [data-genre-explore]');
        if (bubble) {
          e.stopPropagation();
          const genreId = bubble.getAttribute('data-genre-bubble') || bubble.getAttribute('data-genre-explore');
          state.activeLineupGenre = genreId;
          renderLineup();
          return;
        }

        // 4. Play audio preview button
        const playBtn = e.target.closest('.node-play-btn, .chip-play-btn, .hover-play-btn, .btn-play-preview');
        if (playBtn) {
          e.stopPropagation();
          const perfId = playBtn.getAttribute('data-audio-performer');
          playPerformerPreview(perfId);
          return;
        }

        // 5. Detail trigger button in hover card
        const detailBtn = e.target.closest('.hover-detail-btn, .btn-performer-detail');
        if (detailBtn) {
          e.stopPropagation();
          const perfId = detailBtn.getAttribute('data-performer-id');
          openPerformerModal(perfId);
          return;
        }

        // 6. Clicking on the artist node itself
        const artistNode = e.target.closest('.cloud-artist-node, .obsidian-artist-node, .artist-satellite-chip, .performer-card');
        if (artistNode) {
          if (artistNode.getAttribute('data-dragged') === '1') return;
          const perfId = artistNode.getAttribute('data-performer-id');
          openPerformerModal(perfId);
        }
      });

      // Keyboard access on bubbles & artist nodes (Enter / Space)
      elements.performersContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const bubble = e.target.closest('[data-genre-bubble]');
          if (bubble && !e.target.closest('button')) {
            e.preventDefault();
            state.activeLineupGenre = bubble.getAttribute('data-genre-bubble');
            renderLineup();
            return;
          }

          const node = e.target.closest('.cloud-artist-node, .obsidian-artist-node');
          if (node && !e.target.closest('button')) {
            e.preventDefault();
            const perfId = node.getAttribute('data-performer-id');
            openPerformerModal(perfId);
          }
        }
      });
    }

    // Drawer triggers
    const openDrawer = () => {
      renderMyScheduleDrawer();
      if (elements.scheduleDrawer) elements.scheduleDrawer.classList.add('open');
    };
    if (elements.btnOpenSchedule) elements.btnOpenSchedule.addEventListener('click', openDrawer);
    if (elements.mBtnOpenSchedule) elements.mBtnOpenSchedule.addEventListener('click', openDrawer);
    if (elements.drawerCloseBtn) {
      elements.drawerCloseBtn.addEventListener('click', () => {
        elements.scheduleDrawer.classList.remove('open');
      });
    }

    if (elements.btnClearSchedule) {
      elements.btnClearSchedule.addEventListener('click', () => {
        if (confirm('Opravdu chcete vymazat celý svůj uložený program?')) {
          state.myScheduleIds = [];
          localStorage.removeItem('interface_my_schedule');
          updateScheduleBadges();
          renderProgram();
          renderMyScheduleDrawer();
          showToast('Váš program byl vymazán.');
        }
      });
    }

    if (elements.btnExportCalendar) {
      elements.btnExportCalendar.addEventListener('click', exportScheduleToICS);
    }

    // Player Controls
    if (elements.playerTogglePlay) {
      elements.playerTogglePlay.addEventListener('click', () => {
        if (state.isPlayingAudio) {
          pauseAudioPreview();
        } else {
          resumeAudioPreview();
        }
      });
    }
    if (elements.playerCloseBtn) {
      elements.playerCloseBtn.addEventListener('click', closeAudioPlayer);
    }

    // Modal Close
    if (elements.modalCloseBtn) {
      elements.modalCloseBtn.addEventListener('click', () => {
        elements.detailModal.classList.remove('open');
      });
    }

    window.addEventListener('click', (e) => {
      if (e.target === elements.detailModal) elements.detailModal.classList.remove('open');
      if (e.target === elements.scheduleDrawer) elements.scheduleDrawer.classList.remove('open');
    });

    // Ticket triggers
    document.querySelectorAll('.buy-ticket-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const ticketType = btn.getAttribute('data-ticket');
        showToast(`Zvolena vstupenka: ${ticketType}. Přesměrování do pokladny...`);
      });
    });
  }

  function resetFilters() {
    state.selectedStage = 'all';
    state.selectedType = 'all';
    state.searchQuery = '';
    if (elements.stageFilter) elements.stageFilter.value = 'all';
    if (elements.typeFilter) elements.typeFilter.value = 'all';
    if (elements.programSearch) elements.programSearch.value = '';
    if (elements.clearSearchBtn) elements.clearSearchBtn.style.display = 'none';
    renderProgram();
    showToast('Filtry byly resetovány.');
  }

  // Toast Helper
  function showToast(message) {
    if (!elements.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  // 12. Parallax Motion Engine (Scroll & Mouse Tilt)
  function initParallax() {
    const parallaxEls = document.querySelectorAll('[data-parallax-speed]');

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.pageYOffset;
          parallaxEls.forEach(el => {
            const speed = parseFloat(el.getAttribute('data-parallax-speed') || '0');
            const offset = scrollY * speed;
            el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // 3D subtle mouse tilt on hero asymmetric stats
    const hero = document.getElementById('hero');
    const statsGroup = document.getElementById('hero-stats-group');
    if (hero && statsGroup) {
      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = (y / rect.height) * -4;
        const rotateY = (x / rect.width) * 4;
        statsGroup.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      });

      hero.addEventListener('mouseleave', () => {
        statsGroup.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
      });
    }
  }

  // Lookups & Sanitization
  function getPerformerById(id) {
    if (!festivalData || !festivalData.performers) return null;
    return festivalData.performers.find(p => p.id === id) || null;
  }

  function getStageById(id) {
    if (!festivalData || !festivalData.stages) return null;
    return festivalData.stages.find(s => s.id === id) || null;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Bootstrapping
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
