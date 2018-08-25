const Main = imports.ui.main;
const ExtensionSystem = imports.ui.extensionSystem;
const SlidingControl = imports.ui.overviewControls.SlidingControl;
const ThumbnailsSlider = imports.ui.overviewControls.ThumbnailsSlider;

const Meta = imports.gi.Meta;

class ShowWorkSpaces {
    constructor({uuid = "show-workspaces@uuid.com", 
                metadata: {name="Show Workspaces"}} = {}) {
        this.modifiedSliders = [];
        this.uuid = uuid;
        
        this.discoveredSliders = ShowWorkSpaces.discoverSliders(uuid);
        this.log('===========================================================');
        this.log(`Created "${name}"`);
        this.log('===========================================================');
    }

    static discoverSliders(uuid) {
        const discovered = [ThumbnailsSlider];
        for (const ext of new Set(ExtensionSystem.getEnabledExtensions())) {
            if (ext === 'multi-monitors-add-on@spin83') {
                try {
                    if (Array.isArray(Main.mmOverview) && Main.mmOverview.length > 0) {
                        discovered.push(Main.mmOverview[0]._controls._thumbnailsSlider.constructor);
                    }
                } catch (e) {
                    global.logError(e, `<${uuid}> Error attempting to add multimonitor sliders`);
                }
            }
        }
        return discovered;
    }

    startForSlider(slidingControlType) {
        if (slidingControlType.prototype instanceof SlidingControl) {
            const _getSlide = slidingControlType.prototype._getSlide;

            this.makeAlwaysShowSlider(slidingControlType, () => {
                const screen = global.screen;
                if (!Meta.prefs_get_dynamic_workspaces() ||
                    screen.n_workspaces > 2 ||
                    screen.get_active_workspace_index !== 0) {
                    return 1;
                }
                return 0;
            }, _getSlide);

            this.modifiedSliders.push({
                source: slidingControlType,
                initialSlide: _getSlide
            });
        }
    }

    makeAlwaysShowSlider(slidingControlType, hookGetSlide, fallback) {
        slidingControlType.prototype._getSlide = function () {
            let value = hookGetSlide();
            if (value !== 0) {
                return value;
            }
            return fallback.call(this);
        }
    }

    undoAlwaysShowSlider(slidingControlType, initialFunc) {
        slidingControlType.prototype._getSlide = initialFunc;
    }

    start() {
        this.log("Starting plugin...");
        this.discoveredSliders.forEach(slider => this.startForSlider(slider));
    }

    stop() {
        this.log("Stopping plugin...");
        for (const { source, initialSlide } of this.modifiedSliders) {
            this.undoAlwaysShowSlider(source, initialSlide);
        }
    }

    log(...message) {
        global.log(`<${this.uuid}> ${message.join(" ")}`);
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