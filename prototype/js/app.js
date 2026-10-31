/* INTERFACE 2026: lokální prototyp bez závislostí. Data poskytuje js/data.js. */
(() => {
  'use strict';
  const data = window.FESTIVAL_DATA;
  if (!data) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const byId = Object.fromEntries(data.performers.map(person => [person.id, person]));
  const stageById = Object.fromEntries(data.stages.map(stage => [stage.id, stage]));
  const savedKey = 'interface-2026-favourites';
  const reservationKey = 'interface-2026-reservations';
  let saved = new Set(JSON.parse(localStorage.getItem(savedKey) || '[]'));
  let reservations = JSON.parse(localStorage.getItem(reservationKey) || '{}');
  let programmeLimit = 9;
  const programmeState = { day: 'all', stage: 'all', type: 'all', search: '' };
  const lineupState = { category: 'all', search: '' };

  const displayDate = day => ['Pátek 11. 9.', 'Sobota 12. 9.', 'Neděle 13. 9.'][day - 1];
  const escape = value => String(value).replace(/[&<>"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[char]));
  const eventPerformer = event => byId[event.performerIds[0]];
  const store = () => { localStorage.setItem(savedKey, JSON.stringify([...saved])); localStorage.setItem(reservationKey, JSON.stringify(reservations)); updateSavedCount(); };
  const updateSavedCount = () => $$('[data-saved-count]').forEach(node => { node.textContent = saved.size; });
  const toast = message => { const node = $('#toast-template').content.firstElementChild.cloneNode(true); node.textContent = message; document.body.append(node); setTimeout(() => node.remove(), 2800); };

  function populateFilters() {
    const stages = $('#stage-filter');
    data.stages.forEach(stage => stages.insertAdjacentHTML('beforeend', `<option value="${stage.id}">${escape(stage.name)}</option>`));
    const types = [...new Set(data.schedule.map(event => event.type))].sort((a,b) => a.localeCompare(b, 'cs'));
    const select = $('#type-filter');
    types.forEach(type => select.insertAdjacentHTML('beforeend', `<option value="${escape(type)}">${escape(type)}</option>`));
  }
  function filteredEvents() {
    const query = programmeState.search.toLocaleLowerCase('cs');
    return data.schedule.filter(event => {
      const performer = eventPerformer(event);
      const text = [event.title, event.description, performer?.name, ...event.tags].join(' ').toLocaleLowerCase('cs');
      return (programmeState.day === 'all' || String(event.day) === programmeState.day) && (programmeState.stage === 'all' || event.stageId === programmeState.stage) && (programmeState.type === 'all' || event.type === programmeState.type) && (!query || text.includes(query));
    }).sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }
  function eventCard(event) {
    const person = eventPerformer(event);
    const isSaved = saved.has(event.id);
    return `<article class="event"><div class="time">${event.startTime}<br><span>${displayDate(event.day)}</span></div><div><h3>${escape(event.title)}</h3><p>${escape(person?.name || 'Program INTERFACE')}</p></div><div class="meta">${escape(stageById[event.stageId].name)}<br>${escape(event.type)}</div><div class="event-actions"><button class="mini-button" type="button" data-detail-event="${event.id}"><span aria-hidden="true">ⓘ</span> Detail</button><button class="mini-button save" type="button" data-save="${event.id}"><span aria-hidden="true">${isSaved ? '★' : '☆'}</span> ${isSaved ? 'Uloženo' : 'Uložit'}</button></div></article>`;
  }
  function renderProgramme() {
    const events = filteredEvents();
    $('#program-count').textContent = `${events.length} položek`;
    $('#programme-list').innerHTML = events.slice(0, programmeLimit).map(eventCard).join('') || '<p>Žádná položka neodpovídá zvoleným filtrům.</p>';
    $('#show-more').hidden = events.length <= programmeLimit;
  }
  function renderPerformers() {
    const query = lineupState.search.toLocaleLowerCase('cs');
    const people = data.performers.filter(person => (lineupState.category === 'all' || person.category === lineupState.category) && (!query || [person.name, person.role, person.country, person.category].join(' ').toLocaleLowerCase('cs').includes(query)));
    $('#performer-list').innerHTML = people.map((person, index) => `<article class="performer"><span class="number">${String(index + 1).padStart(2,'0')} · ${escape(person.category)}</span><div><h3>${escape(person.name)}</h3><p>${escape(person.role)} · ${escape(person.country)}</p></div><button class="mini-button profile" type="button" data-detail-person="${person.id}"><span aria-hidden="true">↗</span> Profil a vystoupení</button></article>`).join('') || '<p>Účinkující nebyl nalezen.</p>';
  }
  function renderStages() {
    $('#stage-list').innerHTML = data.stages.map((stage, index) => `<article class="stage"><p class="eyebrow">0${index + 1} · ${escape(stage.location)}</p><h3>${escape(stage.name)}</h3><p>${escape(stage.description)}</p><button class="mini-button profile" type="button" data-stage-filter="${stage.id}"><span aria-hidden="true">⌖</span> Program scény</button></article>`).join('');
  }
  function openDialog(html) { const dialog = $('#detail-dialog'); $('#dialog-content').innerHTML = html; dialog.showModal(); }
  function eventDetail(id) {
    const event = data.schedule.find(item => item.id === id); if (!event) return;
    const person = eventPerformer(event), availability = event.capacity ? event.capacity - (reservations[id] || 0) : null;
    const registration = event.type.includes('Workshop') ? `<form data-reservation="${id}"><h3>Rezervace workshopu</h3><p>${availability} volných míst z ${event.capacity}. Vezměte si vlastní sluchátka.</p><label>Jméno<input required name="name" autocomplete="name"></label><label>E-mail<input required type="email" name="email" autocomplete="email"></label><button class="button primary" ${availability < 1 ? 'disabled' : ''}><span aria-hidden="true">✓</span> ${availability < 1 ? 'Kapacita je naplněna' : 'Rezervovat místo'}</button></form>` : '';
    openDialog(`<p class="eyebrow">${displayDate(event.day)} · ${event.startTime} · ${escape(stageById[event.stageId].name)}</p><h2>${escape(event.title)}</h2><p class="tags">${event.tags.map(escape).join(' · ')}</p><p>${escape(event.description)}</p><p><b>Účinkující:</b> <button class="text-button" data-detail-person="${person.id}">${escape(person.name)}</button></p><button class="button outline" type="button" data-save="${event.id}"><span aria-hidden="true">${saved.has(event.id) ? '×' : '☆'}</span> ${saved.has(event.id) ? 'Odebrat z Mého programu' : 'Přidat do Mého programu'}</button>${registration}`);
  }
  function playPreview(person) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return toast('Váš prohlížeč nepodporuje zvukový náhled.');
    const styles = {
      'Hudba & Live Acts': { wave: 'sawtooth', notes: [0, 7, 12, 7], step: .34, duration: .3, gain: .055, base: 110 },
      'Audiovizuální umění': { wave: 'triangle', notes: [0, 12, 19, 12], step: .42, duration: .38, gain: .06, base: 146 },
      'Kreativní kód & Algorave': { wave: 'square', notes: [0, 3, 7, 10, 7, 3], step: .22, duration: .18, gain: .032, base: 98 },
      'Zvukový hardware & Syntéza': { wave: 'sine', notes: [0, 5, 7, 12, 7], step: .36, duration: .32, gain: .075, base: 82 }
    };
    const style = styles[person.category] || styles['Hudba & Live Acts'];
    const variation = (Number(person.id.slice(-2)) || 1) % 6;
    const context = new AudioContext();
    const start = context.currentTime + .03;
    void context.resume();

    style.notes.forEach((note, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const time = start + index * style.step;
      const frequency = style.base * Math.pow(2, (note + variation) / 12);
      oscillator.type = style.wave;
      oscillator.frequency.setValueAtTime(frequency, time);
      gain.gain.setValueAtTime(.0001, time);
      gain.gain.exponentialRampToValueAtTime(style.gain, time + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, time + style.duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(time);
      oscillator.stop(time + style.duration + .03);
    });
    toast(`Přehrává se zvukový náhled: ${person.name}`);
  }
  function personDetail(id) {
    const person = byId[id]; if (!person) return;
    const appearances = data.schedule.filter(event => event.performerIds.includes(id)).sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    openDialog(`<p class="eyebrow">${escape(person.category)} · ${escape(person.country)}</p><h2>${escape(person.name)}</h2><p>${escape(person.bio)}</p><p><b>${escape(person.role)}</b></p><button class="button primary" type="button" data-play="${person.id}"><span aria-hidden="true">▷</span> Poslechnout náhled</button><h3>Vystoupení na festivalu</h3>${appearances.map(event => `<p><button class="text-button" data-detail-event="${event.id}"><span aria-hidden="true">→</span> ${displayDate(event.day)} · ${event.startTime} — ${escape(event.title)}</button></p>`).join('')}`);
  }
  function openSaved() {
    const chosen = data.schedule.filter(event => saved.has(event.id)).sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    $('#saved-content').innerHTML = `<p class="eyebrow">Osobní program</p><h2>Můj program</h2>${chosen.length ? chosen.map(event => `<article class="event"><div class="time">${event.startTime}<br>${displayDate(event.day)}</div><div><h3>${escape(event.title)}</h3><p>${escape(stageById[event.stageId].name)}</p></div><button class="mini-button remove" type="button" data-save="${event.id}"><span aria-hidden="true">×</span> Odebrat</button></article>`).join('') : '<p>Zatím tu nic není. Přidejte si vystoupení z programu.</p>'}`;
    const dialog = $('#saved-dialog');
    if (!dialog.open) dialog.showModal();
  }
  function toggleSaved(id) {
    saved.has(id) ? saved.delete(id) : saved.add(id);
    store();
    renderProgramme();
    if ($('#saved-dialog').open) openSaved();
    toast(saved.has(id) ? 'Přidáno do Mého programu.' : 'Odebráno z Mého programu.');
  }
  function closeMobileMenu() {
    const menu = $('#mobile-menu');
    const toggle = $('[data-toggle-mobile-menu]');
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('button'); if (!target) return;
    if (target.dataset.toggleMobileMenu !== undefined) {
      const menu = $('#mobile-menu');
      const open = menu.classList.toggle('open');
      target.setAttribute('aria-expanded', String(open));
      return;
    }
    if (target.dataset.day !== undefined) { programmeState.day = target.dataset.day; programmeLimit = 9; $$('#day-filters .pill').forEach(button => button.classList.toggle('active', button === target)); renderProgramme(); }
    if (target.dataset.category !== undefined) { lineupState.category = target.dataset.category; $$('#category-filters .pill').forEach(button => button.classList.toggle('active', button === target)); renderPerformers(); }
    if (target.dataset.detailEvent) eventDetail(target.dataset.detailEvent);
    if (target.dataset.detailPerson) personDetail(target.dataset.detailPerson);
    if (target.dataset.save) toggleSaved(target.dataset.save);
    if (target.dataset.play) playPreview(byId[target.dataset.play]);
    if (target.dataset.stageFilter) { programmeState.stage = target.dataset.stageFilter; $('#stage-filter').value = programmeState.stage; programmeLimit = 9; renderProgramme(); $('#program').scrollIntoView({behavior:'smooth'}); }
    if (target.matches('[data-open-saved]')) { openSaved(); closeMobileMenu(); }
    if (target.matches('[data-close-dialog]')) $('#detail-dialog').close();
    if (target.matches('[data-close-saved]')) $('#saved-dialog').close();
    if (target.id === 'show-more') { programmeLimit += 9; renderProgramme(); }
  });
  $('#stage-filter').addEventListener('change', event => { programmeState.stage = event.target.value; programmeLimit = 9; renderProgramme(); });
  $('#type-filter').addEventListener('change', event => { programmeState.type = event.target.value; programmeLimit = 9; renderProgramme(); });
  $('#program-search').addEventListener('input', event => { programmeState.search = event.target.value; programmeLimit = 9; renderProgramme(); });
  $('#performer-search').addEventListener('input', event => { lineupState.search = event.target.value; renderPerformers(); });
  $$('#mobile-menu a').forEach(link => link.addEventListener('click', closeMobileMenu));
  document.addEventListener('submit', event => { const form = event.target.closest('form[data-reservation]'); if (!form) return; event.preventDefault(); const id = form.dataset.reservation; reservations[id] = (reservations[id] || 0) + 1; saved.add(id); store(); $('#detail-dialog').close(); renderProgramme(); toast('Rezervace potvrzena. Workshop je uložen v Mém programu.'); });
  populateFilters(); renderProgramme(); renderPerformers(); renderStages(); updateSavedCount();
})();
