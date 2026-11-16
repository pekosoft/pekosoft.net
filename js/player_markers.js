(() => {
    const items = document.getElementById('marker-items');
    const lines = document.getElementById('marker-lines');
    const buttons = Object.fromEntries([
        'drop', 'previous', 'next', 'select-all', 'deselect-all', 'show', 'lines', 'delete', 'lock'
    ].map(name => [name, document.getElementById(`marker-${name}-button`)]));
    const selected = new Set();
    let showMarkers = localStorage.getItem('player.show_markers') !== 'false';
    let showLines = localStorage.getItem('player.show_marker_lines') === 'true';
    let locked = localStorage.getItem('player.lock_markers') === 'true';
    let renderedState = '';
    let renderedMarkers = [];

    function setToggle(button, enabled) {
        button.classList.toggle('button-on', enabled);
        button.setAttribute('aria-pressed', String(enabled));
    }

    function setDisabled(button, disabled) {
        button.disabled = disabled;
        button.classList.toggle('grey', disabled);
    }

    function updateButtons() {
        const recording = mediaRecorder?.state === 'recording';
        const canSeek = !recording && Boolean(loadedAudioBuffer && hasLoadedAudioSource());
        setDisabled(buttons.drop, locked || (!recording && !canSeek));
        setDisabled(buttons.previous, !canSeek || !timelineMarkers.length);
        setDisabled(buttons.next, !canSeek || !timelineMarkers.length);
        setDisabled(buttons['select-all'], !timelineMarkers.length || selected.size === timelineMarkers.length);
        setDisabled(buttons['deselect-all'], !selected.size);
        setDisabled(buttons.delete, locked || !selected.size);
        setToggle(buttons.show, showMarkers);
        setToggle(buttons.lines, showLines);
        setToggle(buttons.lock, locked);
        buttons.lock.title = locked ? 'Unlock markers' : 'Lock markers';
    }

    function actionButton(icon, label, action, disabled = false) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'action-btn square icon-only';
        button.title = label;
        button.setAttribute('aria-label', label);
        button.disabled = disabled;
        button.classList.toggle('grey', disabled);
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'icons');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', `/icons.svg#${icon}`);
        svg.appendChild(use);
        button.appendChild(svg);
        button.addEventListener('click', action);
        return button;
    }

    function markChanged(recordingMarker = false) {
        if (!recordingMarker && mediaRecorder?.state !== 'recording') {
            markerChangesPending = true;
            if (currentPlaylistItem) {
                currentPlaylistItem.markers = timelineMarkers.slice();
                currentPlaylistItem.markersModified = true;
            }
        }
        redrawTimelineCanvas();
        updateActionButtonStates();
    }

    function removeMarkers(markers) {
        if (locked) return;
        for (let index = timelineMarkers.length - 1; index >= 0; index--) {
            if (markers.has(timelineMarkers[index])) timelineMarkers.splice(index, 1);
        }
        markers.forEach(marker => selected.delete(marker));
        markChanged();
    }

    function seekMarker(marker, play = false) {
        const duration = audioPlayer.duration || loadedAudioBuffer?.duration || 0;
        if (!duration || mediaRecorder?.state === 'recording') return;
        seekToTimelineRatio(marker.time / duration);
        if (play && (audioPlayer.paused || audioPlayer.ended)) playButton.click();
    }

    function renderTable() {
        const canPlay = mediaRecorder?.state !== 'recording' && Boolean(loadedAudioBuffer && hasLoadedAudioSource());
        const state = JSON.stringify([timelineMarkers.map(marker => [marker.time, marker.name, selected.has(marker)]), locked, canPlay]);
        if (state === renderedState && timelineMarkers.length === renderedMarkers.length &&
            timelineMarkers.every((marker, index) => marker === renderedMarkers[index])) return;
        renderedState = state;
        renderedMarkers = timelineMarkers.slice();
        items.replaceChildren();
        timelineMarkers.forEach((marker, index) => {
            const row = document.createElement('tr');
            row.classList.toggle('selected', selected.has(marker));
            const indexCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = selected.has(marker);
            checkbox.setAttribute('aria-label', `Select marker ${index + 1}`);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) selected.add(marker);
                else selected.delete(marker);
                refreshMarkerModule();
            });
            indexCell.append(checkbox, document.createTextNode(` ${index + 1}`));
            const playCell = document.createElement('td');
            playCell.appendChild(actionButton('play', `Play from marker ${index + 1}`, () => seekMarker(marker, true), !canPlay));
            const nameCell = document.createElement('td');
            const name = document.createElement('input');
            name.type = 'text';
            name.value = marker.name || '';
            name.disabled = locked;
            name.setAttribute('aria-label', `Name of marker ${index + 1}`);
            name.addEventListener('change', () => {
                if (locked || name.value === marker.name) return;
                const replacement = { ...marker, name: name.value };
                const markerIndex = timelineMarkers.indexOf(marker);
                if (markerIndex < 0) return;
                timelineMarkers[markerIndex] = replacement;
                if (selected.delete(marker)) selected.add(replacement);
                markChanged();
            });
            nameCell.appendChild(name);
            const timeCell = document.createElement('td');
            timeCell.textContent = formatDurationForPanel(marker.time);
            const deleteCell = document.createElement('td');
            deleteCell.appendChild(actionButton('delete', `Delete marker ${index + 1}`, () => removeMarkers(new Set([marker])), locked));
            row.append(indexCell, playCell, nameCell, timeCell, deleteCell);
            items.appendChild(row);
        });
    }

    function renderLines() {
        lines.replaceChildren();
        const duration = loadedAudioBuffer?.duration || 0;
        if (!showLines || !duration || mediaRecorder?.state === 'recording') return;
        for (const marker of timelineMarkers) {
            if (!Number.isFinite(marker.time) || marker.time < 0 || marker.time > duration) continue;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const x = marker.time / duration * 4096;
            line.setAttribute('x1', x);
            line.setAttribute('x2', x);
            line.setAttribute('y1', '0');
            line.setAttribute('y2', '256');
            lines.appendChild(line);
        }
    }

    function refreshMarkerModule() {
        for (const marker of selected) {
            if (!timelineMarkers.includes(marker)) selected.delete(marker);
        }
        window.markerRulerVisible = showMarkers;
        renderTable();
        renderLines();
        updateButtons();
    }

    window.refreshMarkerModule = refreshMarkerModule;
    window.addRecordingMarker = (recorder, time) => {
        if (!Number.isFinite(time) || time < 0) return;
        recorder.markers.push({ time, name: `Marker ${recorder.markers.length + 1}` });
        if (timelineMarkers === recorder.markers) markChanged(true);
    };

    buttons.drop.addEventListener('click', () => {
        if (locked) return;
        if (mediaRecorder?.state === 'recording') {
            if (mediaRecorder.dropMarker) mediaRecorder.dropMarker();
            else window.addRecordingMarker(mediaRecorder, Math.max(0, (Date.now() - startTime) / 1000));
            return;
        }
        if (!loadedAudioBuffer || !hasLoadedAudioSource()) return;
        timelineMarkers.push({ time: Math.max(0, Math.min(audioPlayer.currentTime, loadedAudioBuffer.duration)), name: `Marker ${timelineMarkers.length + 1}` });
        timelineMarkers.sort((left, right) => left.time - right.time);
        markChanged();
    });

    for (const [name, direction] of [['previous', -1], ['next', 1]]) {
        buttons[name].addEventListener('click', () => {
            const ordered = timelineMarkers.slice().sort((left, right) => left.time - right.time);
            const time = audioPlayer.currentTime;
            let marker;
            if (direction < 0) {
                const reversed = ordered.reverse();
                const current = reversed.find(entry => entry.time <= time + 0.001);
                marker = (current && reversed.find(entry => entry.time < current.time)) || reversed[0];
            } else {
                marker = ordered.find(entry => entry.time > time + 0.001) || ordered[0];
            }
            if (marker) seekMarker(marker);
        });
    }

    buttons['select-all'].addEventListener('click', () => {
        timelineMarkers.forEach(marker => selected.add(marker));
        refreshMarkerModule();
    });
    buttons['deselect-all'].addEventListener('click', () => {
        selected.clear();
        refreshMarkerModule();
    });
    buttons.delete.addEventListener('click', () => removeMarkers(new Set(selected)));
    buttons.show.addEventListener('click', () => {
        showMarkers = !showMarkers;
        localStorage.setItem('player.show_markers', String(showMarkers));
        window.markerRulerVisible = showMarkers;
        redrawTimelineCanvas();
    });
    buttons.lines.addEventListener('click', () => {
        showLines = !showLines;
        localStorage.setItem('player.show_marker_lines', String(showLines));
        redrawTimelineCanvas();
    });
    buttons.lock.addEventListener('click', () => {
        locked = !locked;
        localStorage.setItem('player.lock_markers', String(locked));
        refreshMarkerModule();
    });

    refreshMarkerModule();
})();
