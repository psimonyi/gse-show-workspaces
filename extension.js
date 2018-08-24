// Basically revert this commit:
// https://git.gnome.org/browse/gnome-shell/commit/js/ui/overviewControls.js?id=2d849759c837ebc60f41022ce9ae83616ba0274e

const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const ThumbnailsSlider = imports.ui.overviewControls.ThumbnailsSlider;

class ShowWorkSpaces {
    constructor({uuid="show-workspaces@uuid.com", name="Show Workspaces"} = {}) {
        this._getAlwaysZoomOut = undefined;
        this.listenerId = undefined;
        this.uuid = uuid;

        this.log(`Created "${name}"`);
    }

    start() {
        const self = this;
        self.log("Starting plugin...");
        self._getAlwaysZoomOut = ThumbnailsSlider.prototype._getAlwaysZoomOut;
        ThumbnailsSlider.prototype._getAlwaysZoomOut = function() {
            let screen = global.screen;
            // Always show the switcher if workspaces are in use.
            if (!Meta.prefs_get_dynamic_workspaces() ||
                screen.n_workspaces > 1 ||
                screen.get_active_workspace_index() !== 0) {
                return true;
            }
            // Also show it under the normal conditions.
            return self._getAlwaysZoomOut.call(this);
        };

        let slider = Main.overview._controls._thumbnailsSlider;
        self.listenerId = global.window_manager.connect('switch-workspace', 
            Lang.bind(slider, slider._updateSlide));
    }

    stop() {
        this.log("Stopping plugin...");
        ThumbnailsSlider.prototype._getAlwaysZoomOut = this._getAlwaysZoomOut;
        global.window_manager.disconnect(this.listenerId);
    }

    log(...message) {
        global.log(`[${this.uuid}]: ${message.join(" ")}`);
    }
}

var showWorkSpaces = undefined;

function init(meta) {
    showWorkSpaces = new ShowWorkSpaces(meta);
}

function enable() {
    if (showWorkSpaces !== undefined) {
        showWorkSpaces.start();   
    }
}

function disable() {
    if (showWorkSpaces !== undefined) {
        showWorkSpaces.stop();
    }
}