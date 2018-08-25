const Main = imports.ui.main;
const ExtensionSystem = imports.ui.extensionSystem;
const SlidingControl = imports.ui.overviewControls.SlidingControl;
const ThumbnailsSlider = imports.ui.overviewControls.ThumbnailsSlider;

const Meta = imports.gi.Meta;

const Config = imports.misc.config;

class ShowWorkSpaces {
    constructor({uuid="show-workspaces@uuid.com", name="Show Workspaces"} = {}) {
        this.sliders = [];
        this.uuid = uuid;

        // this.log(`Enabled extensions: ${[...new Set(ExtensionSystem.getEnabledExtensions())]}`);
        this.log(`Created "${name}"`);
        this.log(`${JSON.stringify(Config.PACKAGE_NAME)}`);
    }

    start() {
        this.log("Starting plugin...");
        this.startForSlider(ThumbnailsSlider);

        Main.overview.connect('showing', () => {
            
            // let workSpaceViews = Main.overview.viewSelector._workspacesDisplay._workspacesViews;
            // this.log(`Number of views: ${workSpaceViews.length}`);
            // let shown = false;
            // for (const view of workSpaceViews) {
            //     this.log(`WorkspaceView on monitor: ${view._monitorIndex}`,
            //         `has ${view._workspaces.length} workspaces`);
            //     // if (!shown) {
            //     //     for (const workspace of view._workspaces) {
            //     //         this.log(Object.getOwnPropertyNames(workspace.metaWorkspace));
            //     //         break;
            //     //     }
            //     //     shown = true;
            //     // }
            // }

            // this.log(`Controls: ${Object.getOwnPropertyNames(Main.overview._controls)}`)

            // Main.overview._controls._thumbnailsSlider.slideIn();
        });
    }

    stop() {
        this.log("Stopping plugin...");
        for (const {source, initialSlide} of this.sliders) {
            this.undoAlwaysShowSlider(source, initialSlide);
        }
    }

    startForSlider(slidingControlType) {
        if (slidingControlType.prototype instanceof SlidingControl) {
            const _getSlide = slidingControlType.prototype._getSlide;

            this.makeAlwaysShowSlider(slidingControlType, () => {
                const screen = global.screen;
                if (!Meta.prefs_get_dynamic_workspaces() ||
                    screen.n_workspaces > 1 ||
                    screen.get_active_workspace_index !== 0) {
                    return 1;
                }
                return 0;
            }, _getSlide);

            this.sliders.push({
                source: slidingControlType,
                initialSlide: _getSlide
            });
        }
    }

    makeAlwaysShowSlider(slidingControlType, replaceGetSlide, fallback) {
        slidingControlType.prototype._getSlide = function () {
            let value = replaceGetSlide();
            if (value !== 0) {
                return value;
            }
            return fallback.call(this);
        }
    }

    undoAlwaysShowSlider(slidingControlType, initialFunc) {
        slidingControlType.prototype._getSlide = initialFunc;
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