// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
/* exported init buildPrefsWidget */

const { Gio, GObject, Gtk } = imports.gi;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;

const Columns = {
    APPINFO: 0,
    DISPLAY_NAME: 1,
    ICON: 2
};


function init() {
    //ExtensionUtils.initTranslations();
}

const MaxiSettings = GObject.registerClass(
    class MaxiSettings extends Gtk.Grid {
        _init(params) {
            super._init(params);

            this.margin = 30;
            this.row_spacing = 30;
            this.orientation = Gtk.Orientation.VERTICAL;

            try {
                this._settings = ExtensionUtils.getSettings();
            } catch (e) {
                logError(e, 'Failed to load gnome-shell-extension_maxi settings');
            }

            var check_debug = new Gtk.CheckButton({
                label: _('Debug'),
                margin_top: 6,
            });
            this._settings.bind('debug', check_debug, 'active', Gio.SettingsBindFlags.DEFAULT);
            this.attach(check_debug, 0, 0, 4, 1);

            let check = new Gtk.CheckButton({
                label: _('[⇕] maximize vertical'),
                margin_top: 6,
            });
            this._settings.bind('vertical', check, 'active', Gio.SettingsBindFlags.DEFAULT);
            this.attach(check, 0, 1, 4, 1);

            check = new Gtk.CheckButton({
                label: _('[⇔] maximize horizontal'),
                margin_top: 6,
            });
            this._settings.bind('horizontal', check, 'active', Gio.SettingsBindFlags.DEFAULT);
            this.attach(check, 0, 2, 4, 1);

            const appChooserTitle = Gtk.Label.new("Installed Applications:");
            appChooserTitle.halign = 1;
            this.attach(appChooserTitle, 0, 3, 4, 1);

            const appChooser = new Gtk.AppChooserWidget({ show_all: true });
            this.appChooser = appChooser;
            this.attach(appChooser, 0, 4, 4, 4);

            this._store = new Gtk.ListStore();
            this._store.set_column_types([Gio.AppInfo, GObject.TYPE_STRING, Gio.Icon]);
            this._ignoreList = new Gtk.TreeView({
                model: this._store,
                hexpand: true, vexpand: true
            });
            this._ignoreList.get_selection().set_mode(Gtk.SelectionMode.SINGLE);
            const appColumn = new Gtk.TreeViewColumn({
                expand: true,
                sort_column_id: Columns.DISPLAY_NAME,
                title: _("Applications that will not be maximized:")
            });
            const iconRenderer = new Gtk.CellRendererPixbuf;
            appColumn.pack_start(iconRenderer, false);
            appColumn.add_attribute(iconRenderer, "gicon", Columns.ICON);
            const nameRenderer = new Gtk.CellRendererText;
            appColumn.pack_start(nameRenderer, true);
            appColumn.add_attribute(nameRenderer, "text", Columns.DISPLAY_NAME);
            this._ignoreList.append_column(appColumn);
            this.attach(this._ignoreList, 0, 8, 4, 4);

            const addButton = new Gtk.Button();
            addButton.set_label("+");
            addButton.connect('clicked', this._addSelected.bind(this));
            this.attach(addButton, 0, 12, 2, 1);

            const removeButton = new Gtk.Button();
            removeButton.set_label("-");
            removeButton.connect('clicked', this._deleteSelected.bind(this));
            this.attach(removeButton, 2, 12, 2, 1);

            this._changedPermitted = true;
            this._refresh();
        }

        _addSelected() {
            const appInfo = this.appChooser.get_app_info();

            if (appInfo) {
                this._changedPermitted = false;
                this._appendItem(appInfo.get_id());
                const entry = this._store.append();
                this._store.set(entry,
                    [Columns.APPINFO, Columns.ICON, Columns.DISPLAY_NAME],
                    [appInfo, appInfo.get_icon(), appInfo.get_display_name()]);
                this._changedPermitted = true;
            }
        }

        _deleteSelected() {
            const [any, , iter] = this._ignoreList.get_selection().get_selected();

            if (any) {
                const appInfo = this._store.get_value(iter, Columns.APPINFO);

                this._changedPermitted = false;
                this._removeItem(appInfo.get_id());
                this._store.remove(iter);
                this._changedPermitted = true;
            }
        }

        _appendItem(id) {
            const currentItems = this._settings.get_strv("blacklisted-apps");

            if (currentItems.includes(id)) {
                printerr("Already have an item for this id");
                return false;
            }

            currentItems.push(id);
            this._settings.set_strv("blacklisted-apps", currentItems);
            return true;
        }

        _removeItem(id) {
            const currentItems = this._settings.get_strv("blacklisted-apps");
            const index = currentItems.indexOf(id);

            if (index < 0) {
                return;
            }

            currentItems.splice(index, 1);
            this._settings.set_strv("blacklisted-apps", currentItems);
        }

        _refresh() {
            if (!this._changedPermitted) {
                return;
            }

            this._store.clear();

            const currentItems = this._settings.get_strv("blacklisted-apps");
            const validItems = [];
            for (let i = 0; i < currentItems.length; i++) {
                const id = currentItems[i];
                const appInfo = Gio.DesktopAppInfo.new(id);

                if (!appInfo) {
                    continue;
                }

                validItems.push(currentItems[i]);

                const iter = this._store.append();
                this._store.set(iter,
                    [Columns.APPINFO, Columns.ICON, Columns.DISPLAY_NAME],
                    [appInfo, appInfo.get_icon(), appInfo.get_display_name()]);
            }

            if (validItems.length != currentItems.length) {
                this._settings.set_strv("blacklisted-apps", validItems);
            }
        }
    });

function buildPrefsWidget() {
    let maxisettings = new MaxiSettings();
    return maxisettings;
}