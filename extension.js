const Meta = imports.gi.Meta;
const ExtensionUtils = imports.misc.extensionUtils;

let _windowCreatedId;
let _settings;

function init() {
    _settings = ExtensionUtils.getSettings();
}
function enable() {
    _windowCreatedId = global.display.connect('window-created', (d, win) => {
        if (win.can_maximize()) {
            if (_settings.get_boolean('vertical')) {
                win.maximize(Meta.MaximizeFlags.VERTICAL)
            }
            if (_settings.get_boolean('horizontal')) {
                win.maximize(Meta.MaximizeFlags.HORIZONTAL)
            }
            
        }
    });
}

function disable() {
    global.display.disconnect(_windowCreatedId);
    _setting = null;
} 
