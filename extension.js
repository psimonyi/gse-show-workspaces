// Basically revert this commit:
// https://git.gnome.org/browse/gnome-shell/commit/js/ui/overviewControls.js?id=2d849759c837ebc60f41022ce9ae83616ba0274e

const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const ThumbnailsSlider = imports.ui.overviewControls.ThumbnailsSlider;

let old_getAlwaysZoomOut;
let listenerId;

function init() {
}

function enable() {
    old_getAlwaysZoomOut = ThumbnailsSlider.prototype._getAlwaysZoomOut;
    ThumbnailsSlider.prototype._getAlwaysZoomOut = function () {
        // Always show the switcher if workspaces are in use.
        let usingWorkspaces = !Meta.prefs_get_dynamic_workspaces() ||
                              global.screen.n_workspaces > 2 ||
                              global.screen.get_active_workspace_index() != 0;
        if (usingWorkspaces) return true;
        // Also show it under the normal conditions.
        return old_getAlwaysZoomOut.call(this);
    }

    let slider = Main.overview._controls._thumbnailsSlider;
    listenerId = global.window_manager.connect('switch-workspace',
        Lang.bind(slider, slider._updateSlide));
}

function disable() {
    ThumbnailsSlider.prototype._getAlwaysZoomOut = old_getAlwaysZoomOut;
    global.window_manager.disconnect(listenerId);
}
