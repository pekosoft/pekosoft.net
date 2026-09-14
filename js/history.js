// Pekosoft History
// pekosoft.net/js/history.js

(() => {
  class PekosoftHistory {
    constructor(options = {}) {
      this.list = options.list || null;
      this.codeView = options.codeView || null;
      this.listContainer = options.listContainer || this.list?.closest(".playlist-table") || this.list || null;
      this.undoButton = options.undoButton || null;
      this.redoButton = options.redoButton || null;
      this.sortButton = options.sortButton || null;
      this.viewButton = options.viewButton || null;
      this.restore = typeof options.restore === "function" ? options.restore : () => {};
      this.limit = Math.max(1, Number(options.limit) || 50);
      this.initialLabel = String(options.initialLabel || "Initial state");
      this.initialIcon = String(options.initialIcon || "reset");
      this.historyStartLabel = String(options.historyStartLabel || "History start");
      this.historyStartIcon = String(options.historyStartIcon || "undo");
      this.sortStorageKey = String(options.sortStorageKey || "");
      this.viewStorageKey = String(options.viewStorageKey || "");
      this.sortDirection = options.sortDirection === "asc" ? "asc" : "desc";
      this.viewMode = ["list", "json", "javascript"].includes(options.viewMode) ? options.viewMode : "list";
      this.entries = [];
      this.position = 0;
      this.hasTrimmed = false;

      if (this.sortStorageKey) {
        try {
          const savedSort = localStorage.getItem(this.sortStorageKey);
          if (savedSort === "asc" || savedSort === "desc") this.sortDirection = savedSort;
        } catch (_) {
          // Storage may be unavailable in restricted browsing modes.
        }
      }

      if (this.viewStorageKey) {
        try {
          const savedView = localStorage.getItem(this.viewStorageKey);
          if (["list", "json", "javascript"].includes(savedView)) this.viewMode = savedView;
        } catch (_) {
          // Storage may be unavailable in restricted browsing modes.
        }
      }

      this.undoButton?.addEventListener("click", () => this.undo());
      this.redoButton?.addEventListener("click", () => this.redo());
      this.sortButton?.addEventListener("click", () => this.toggleSort());
      this.viewButton?.addEventListener("click", () => this.toggleView());
      this.render();
    }

    record(label, before, after, options = {}) {
      if (before === after) return false;

      if (this.position < this.entries.length) {
        this.entries.splice(this.position);
      }

      this.entries.push({
        label: String(label || "Changed state"),
        icon: String(options.icon || "undo"),
        before,
        after,
        timestamp: Date.now()
      });

      if (this.entries.length > this.limit) {
        this.entries.shift();
        this.hasTrimmed = true;
      }

      this.position = this.entries.length;
      this.render();
      return true;
    }

    undo() {
      if (this.position <= 0) return false;
      const entry = this.entries[this.position - 1];
      this.restore(entry.before, { direction: "undo", entry });
      this.position--;
      this.render();
      return true;
    }

    redo() {
      if (this.position >= this.entries.length) return false;
      const entry = this.entries[this.position];
      this.restore(entry.after, { direction: "redo", entry });
      this.position++;
      this.render();
      return true;
    }

    goTo(position) {
      const target = Math.max(0, Math.min(this.entries.length, Number(position) || 0));
      while (this.position > target) this.undo();
      while (this.position < target) this.redo();
    }

    clear() {
      this.entries = [];
      this.position = 0;
      this.hasTrimmed = false;
      this.render();
    }

    toggleSort() {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      if (this.sortStorageKey) {
        try {
          localStorage.setItem(this.sortStorageKey, this.sortDirection);
        } catch (_) {
          // Sorting still works for the current session.
        }
      }
      this.render();
    }

    toggleView() {
      const modes = ["list", "json", "javascript"];
      this.viewMode = modes[(modes.indexOf(this.viewMode) + 1) % modes.length];
      if (this.viewStorageKey) {
        try {
          localStorage.setItem(this.viewStorageKey, this.viewMode);
        } catch (_) {
          // View switching still works for the current session.
        }
      }
      this.render();
    }

    formatTime(timestamp) {
      const date = new Date(timestamp);
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
      return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }

    parseSnapshot(snapshot) {
      if (typeof snapshot !== "string") return snapshot;
      try {
        return JSON.parse(snapshot);
      } catch (_) {
        return snapshot;
      }
    }

    toObject() {
      const entries = this.entries.map((entry, index) => ({
        position: index + 1,
        label: entry.label,
        icon: entry.icon,
        timestamp: entry.timestamp,
        before: this.parseSnapshot(entry.before),
        after: this.parseSnapshot(entry.after)
      }));
      if (this.sortDirection === "desc") entries.reverse();
      return {
        position: this.position,
        sort: this.sortDirection,
        initialLabel: this.hasTrimmed ? this.historyStartLabel : this.initialLabel,
        initial: this.entries.length ? this.parseSnapshot(this.entries[0].before) : null,
        entries
      };
    }

    toJSON(space = 2) {
      return JSON.stringify(this.toObject(), null, space);
    }

    toJavaScript(variableName = "history") {
      const safeName = /^[A-Za-z_$][\w$]*$/.test(variableName) ? variableName : "history";
      return `const ${safeName} = ${this.toJSON(2)};`;
    }

    createEntry(position, label, timestamp, icon) {
      const row = document.createElement("tr");
      row.className = "module-history-entry";
      row.classList.toggle("active", position === this.position);
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", position === this.position ? "true" : "false");
      row.title = label;

      const number = document.createElement("td");
      number.className = "module-history-number recording-col-index";
      number.textContent = String(position);

      const text = document.createElement("td");
      text.className = "module-history-label history-col-label";
      text.textContent = label;

      const iconCell = document.createElement("td");
      iconCell.className = "history-col-icon";

      const iconContainer = document.createElement("span");
      iconContainer.className = "module-history-icon history-entry-icon";
      iconContainer.setAttribute("aria-hidden", "true");
      iconContainer.innerHTML = `<svg class="icons"><use href="/icons.svg#${icon}" /></svg>`;
      iconCell.appendChild(iconContainer);

      const time = document.createElement("td");
      time.className = "module-history-time history-col-time";
      time.textContent = timestamp ? this.formatTime(timestamp) : "";

      row.append(number, iconCell, text, time);
      row.addEventListener("click", () => this.goTo(position));
      return row;
    }

    render() {
      if (this.list) {
        this.list.textContent = "";
        const rows = [
          {
            position: 0,
            label: this.hasTrimmed ? this.historyStartLabel : this.initialLabel,
            timestamp: null,
            icon: this.hasTrimmed ? this.historyStartIcon : this.initialIcon
          },
          ...this.entries.map((entry, index) => ({ ...entry, position: index + 1 }))
        ];
        if (this.sortDirection === "desc") rows.reverse();
        rows.forEach((entry) => {
          this.list.appendChild(this.createEntry(entry.position, entry.label, entry.timestamp, entry.icon));
        });
      }

      if (this.listContainer) this.listContainer.hidden = this.viewMode !== "list";
      if (this.codeView) {
        this.codeView.hidden = this.viewMode === "list";
        this.codeView.value = this.viewMode === "javascript" ? this.toJavaScript() : this.toJSON();
      }

      if (this.undoButton) this.undoButton.disabled = this.position <= 0;
      if (this.redoButton) this.redoButton.disabled = this.position >= this.entries.length;
      if (this.sortButton) {
        const isDescending = this.sortDirection === "desc";
        this.sortButton.classList.toggle("button-on", isDescending);
        this.sortButton.setAttribute("aria-pressed", isDescending ? "true" : "false");
        this.sortButton.title = isDescending ? "SORT: Descending" : "SORT: Ascending";
      }
      if (this.viewButton) {
        const iconUse = this.viewButton.querySelector("use");
        const config = {
          list: { icon: "view_list", title: "VIEW: List" },
          json: { icon: "panel", title: "VIEW: JSON" },
          javascript: { icon: "js", title: "VIEW: JavaScript" }
        }[this.viewMode];
        if (iconUse) iconUse.setAttribute("href", `/icons.svg#${config.icon}`);
        this.viewButton.title = config.title;
        this.viewButton.classList.toggle("button-on", this.viewMode !== "list");
        this.viewButton.setAttribute("aria-pressed", this.viewMode !== "list" ? "true" : "false");
      }
    }
  }

  window.PekosoftHistory = PekosoftHistory;
})();

// END OF FILE
