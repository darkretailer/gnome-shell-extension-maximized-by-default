const Meta = imports.gi.Meta;
const ExtensionUtils = imports.misc.extensionUtils;

let _windowCreatedId;
let _settings;


function init() {
    _settings = ExtensionUtils.getSettings();
}

var blacklist = ['Calculator'];

function enable() {
    _windowCreatedId = global.display.connect('window-created', (d, win) => {
        if (! blacklist.includes(win.title)) {
            if (win.can_maximize()) {
                if (_settings.get_boolean('vertical')) {
                    win.maximize(Meta.MaximizeFlags.VERTICAL);
                }
                if (_settings.get_boolean('horizontal')) {
                    win.maximize(Meta.MaximizeFlags.HORIZONTAL);
                }
            }
        }
        // output in: journalctl /usr/bin/gnome-shell -f
        // global.log('gnome-extension maxi@darkretailer.github.com: "' + win.title + '"');
    });
}

function disable() {
    global.display.disconnect(_windowCreatedId);
    // _setting = null;
} 
