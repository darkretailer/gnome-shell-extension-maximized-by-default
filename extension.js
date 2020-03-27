var Meta = imports.gi.Meta;
var ExtensionUtils = imports.misc.extensionUtils;

var _windowCreatedId;
var _settings;

var debug = false;

function init() {
    _settings = ExtensionUtils.getSettings();
}

function enable() {
    _windowCreatedId = global.display.connect('window-created', (d, win) => {
        if (debug) {
            global.log("gnome-extension maxi@darkretailer.github.com: New " + win.gtk_application_id);
        }
        
        if (! this._settings.get_strv('blacklisted-apps').includes(win.gtk_application_id + ".desktop")) {
            if (win.can_maximize()) {
                if (_settings.get_boolean('vertical')) {
                    win.maximize(Meta.MaximizeFlags.VERTICAL);
                }
                if (_settings.get_boolean('horizontal')) {
                    win.maximize(Meta.MaximizeFlags.HORIZONTAL);
                }
            }
        } else {
            if (debug) {
                global.log('gnome-extension maxi@darkretailer.github.com: "' + win.gtk_application_id + '" is blacklisted');
            }
        }
    });
}

function disable() {
    global.display.disconnect(_windowCreatedId);
    _windowCreatedId = null;
} 
