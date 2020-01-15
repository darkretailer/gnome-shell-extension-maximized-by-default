// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
/* exported init buildPrefsWidget */

const { Gio, GObject, Gtk } = imports.gi;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;


function init() {
    //ExtensionUtils.initTranslations();
}

const MaxiSettings = GObject.registerClass(
class MaxiSettings extends Gtk.Grid {
    _init(params) {
        super._init(params);

        this.margin = 24;
        this.row_spacing = 6;
        this.orientation = Gtk.Orientation.VERTICAL;

        let align = new Gtk.Alignment({ left_padding: 12 });
        this.add(align);

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            row_spacing: 6,
            column_spacing: 6,
        });
        align.add(grid);

        try {
            this._settings = ExtensionUtils.getSettings();
        } catch (e) {
            logError(e, 'Failed to load gnome-shell-extension_maxi settings');
        }
        
        let check = new Gtk.CheckButton({
            label: _('maximize vertical'),
            margin_top: 6,
        });
        this._settings.bind('vertical', check, 'active', Gio.SettingsBindFlags.DEFAULT);
        this.add(check);

        check = new Gtk.CheckButton({
            label: _('maximize horizontal'),
            margin_top: 6,
        });
        this._settings.bind('horizontal', check, 'active', Gio.SettingsBindFlags.DEFAULT);
        this.add(check);
    }
});

function buildPrefsWidget() {
    let maxisettings = new MaxiSettings();
    maxisettings.show_all();

    return maxisettings;
}

