(() => {
  class TableCards {
    constructor(table) {
      this.table = table;
      this.storageKey = table.dataset.cardsKey || '';
      this.button = document.getElementById(table.dataset.cardsButton);
      this.pendingRefresh = false;
      this.observer = new MutationObserver(() => {
        if (this.pendingRefresh) return;
        this.pendingRefresh = true;
        requestAnimationFrame(() => {
          this.pendingRefresh = false;
          this.refresh();
        });
      });

      let savedView = 'table';
      if (this.storageKey) {
        try {
          savedView = localStorage.getItem(this.storageKey);
        } catch (error) {
          console.warn('Unable to restore table view:', error);
        }
        document.getElementById('reset-button')?.addEventListener('click', () => this.setCards(false));
      }
      this.button?.addEventListener('click', () => this.setCards(!this.active));
      this.setCards(savedView === 'cards', false);
    }

    rows() {
      return [...this.table.tBodies].flatMap(body => [...body.rows]);
    }

    cells(row) {
      return [...row.cells].filter(cell => !cell.classList.contains('table-card-actions'));
    }

    setCards(active, persist = true) {
      const changed = this.active !== active;
      this.active = active;
      this.table.classList.toggle('table-cards', active);
      if (this.button) {
        this.button.classList.toggle('button-on', active);
        this.button.setAttribute('aria-pressed', String(active));
        this.button.title = active ? 'Switch to table' : 'Switch to cards';
      }
      if (persist && this.storageKey) {
        try {
          localStorage.setItem(this.storageKey, active ? 'cards' : 'table');
        } catch (error) {
          console.warn('Unable to save table view:', error);
        }
      }
      this.refresh();
      if (changed) this.table.dispatchEvent(new CustomEvent('tableviewchange', { bubbles: true }));
    }

    refresh() {
      this.observer.disconnect();
      if (!this.active) {
        this.table.querySelectorAll('.table-card-actions').forEach(cell => cell.remove());
        return;
      }

      const headers = [...(this.table.tHead?.rows[0]?.cells || [])];
      const visibleHeaders = headers.filter(header =>
        !header.hidden && !header.classList.contains('hidden') && getComputedStyle(header).display !== 'none');
      for (const row of this.rows()) {
        const cells = this.cells(row);
        const columns = cells.length === headers.length ? headers : visibleHeaders;
        const message = cells.length === 1 && cells[0].colSpan > 1;
        row.classList.toggle('table-card-message', message);
        cells.forEach((cell, index) => {
          const label = message ? '' : (columns[index]?.textContent || '').trim();
          cell.dataset.cardLabel = label;
          cell.dataset.cardHeading = String(!!label && label === this.table.dataset.cardsHeading);
        });
        if (!message && !row.querySelector('.table-card-actions')) this.addCopyButton(row);
      }
      this.observer.observe(this.table, {
        subtree: true, childList: true, characterData: true,
        attributes: true, attributeFilter: ['class', 'style', 'hidden']
      });
    }

    getRowText(row) {
      return this.cells(row).map(cell => {
        const inputs = [...cell.querySelectorAll('input, select, textarea')]
          .filter(input => !['radio', 'checkbox'].includes(input.type) && !input.closest('[hidden], .hidden'));
        const value = inputs.length ? inputs.map(input => input.value).join(' ')
          : cell.querySelector('button') ? '' : cell.textContent.trim();
        return value ? `${cell.dataset.cardLabel ? cell.dataset.cardLabel + ': ' : ''}${value}` : '';
      }).filter(Boolean).join('\n');
    }

    addCopyButton(row) {
      const cell = document.createElement('td');
      cell.className = 'table-card-actions';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'square icon-only table-card-copy';
      button.title = 'Copy card';
      button.setAttribute('aria-label', 'Copy card');
      button.dataset.helpRelease = 'index';
      button.dataset.helpEntry = 'Table view';
      button.innerHTML = '<svg class="icons" aria-hidden="true"><use href="/icons.svg#copy" /></svg>';
      button.addEventListener('dblclick', event => event.stopPropagation());
      button.addEventListener('click', async event => {
        event.stopPropagation();
        const text = this.getRowText(row);
        try {
          if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable');
          await navigator.clipboard.writeText(text);
        } catch (error) {
          console.warn('Unable to copy table card:', error);
          window.prompt('Copy card:', text);
        }
      });
      cell.appendChild(button);
      row.appendChild(cell);
    }
  }

  window.TableCards = TableCards;
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('table[data-cards-key]').forEach(table => new TableCards(table));
  });
})();
