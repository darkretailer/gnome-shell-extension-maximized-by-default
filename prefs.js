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
        
        let check = new Gtk.CheckButton({
            label: _('[⇕] maximize vertical'),
            margin_top: 6,
        });
        this._settings.bind('vertical', check, 'active', Gio.SettingsBindFlags.DEFAULT);
        this.add(check);

        check = new Gtk.CheckButton({
            label: _('[⇔] maximize horizontal'),
            margin_top: 6,
        });
        this._settings.bind('horizontal', check, 'active', Gio.SettingsBindFlags.DEFAULT);
        this.add(check);

        this._store = new Gtk.ListStore();
        this._store.set_column_types([Gio.AppInfo, GObject.TYPE_STRING, Gio.Icon]);
        this._treeView = new Gtk.TreeView({ model: this._store, hexpand: true, vexpand: true });
        this._treeView.get_selection().set_mode(Gtk.SelectionMode.SINGLE);

        const appColumn = new Gtk.TreeViewColumn({ expand: true, sort_column_id: Columns.DISPLAY_NAME, title: _("Applications to be ignored:") });
        const iconRenderer = new Gtk.CellRendererPixbuf;
        appColumn.pack_start(iconRenderer, false);
        appColumn.add_attribute(iconRenderer, "gicon", Columns.ICON);
        const nameRenderer = new Gtk.CellRendererText;
        appColumn.pack_start(nameRenderer, true);
        appColumn.add_attribute(nameRenderer, "text", Columns.DISPLAY_NAME);
        this._treeView.append_column(appColumn);

        this.add(this._treeView);

        const toolbar = new Gtk.Toolbar();
        toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);
        this.add(toolbar);

        const newButton = new Gtk.ToolButton({ stock_id: Gtk.STOCK_NEW, label: _(""), is_important: true });
        newButton.connect('clicked', this._createNew.bind(this));
        toolbar.add(newButton);

        const delButton = new Gtk.ToolButton({ stock_id: Gtk.STOCK_DELETE });
        delButton.connect('clicked', this._deleteSelected.bind(this));
        toolbar.add(delButton);

        this._changedPermitted = true;
        this._refresh();
    }

    _createNew() {
        const dialog = new Gtk.Dialog({ title: _("Application to ignore"), transient_for: this.get_toplevel(), modal: true });
        dialog.add_button(Gtk.STOCK_CANCEL, Gtk.ResponseType.CANCEL);
        dialog.add_button(_("Add"), Gtk.ResponseType.OK);
        dialog.set_default_response(Gtk.ResponseType.OK);

        const grid = new Gtk.Grid({ column_spacing: 10, row_spacing: 15, margin: 10 });
        dialog._appChooser = new Gtk.AppChooserWidget({ show_all: true });
        grid.attach(dialog._appChooser, 0, 0, 2, 1);
        dialog.get_content_area().add(grid);

        dialog.connect('response', (dialog, id) => {

            if (id != Gtk.ResponseType.OK) {
                dialog.destroy();
                return;
            }

            const appInfo = dialog._appChooser.get_app_info();

            if (!appInfo) {
                return;
            }

            this._changedPermitted = false;
            if (!this._appendItem(appInfo.get_id())) {
                this._changedPermitted = true;
                return;
            }
            let iter = this._store.append();

            this._store.set(iter, [Columns.APPINFO, Columns.ICON, Columns.DISPLAY_NAME], [appInfo, appInfo.get_icon(), appInfo.get_display_name()]);
            this._changedPermitted = true;

            dialog.destroy();
        });
        dialog.show_all();
    }

    _deleteSelected() {
        const [any, , iter] = this._treeView.get_selection().get_selected();

        if (any) {
            const appInfo = this._store.get_value(iter, Columns.APPINFO);

            this._changedPermitted = false;
            this._removeItem(appInfo.get_id());
            this._store.remove(iter);
            this._changedPermitted = true;
        }
    }

    _refresh() {
        if (!this._changedPermitted) {
            return;
        }

        this._store.clear();

        const currentItems = this._settings.get_strv("blacklisted-apps");
        const validItems = [ ];
        for (let i = 0; i < currentItems.length; i++) {
            const id = currentItems[i];
            const appInfo = Gio.DesktopAppInfo.new(id);

            if (!appInfo) {
                continue;
            }

            validItems.push(currentItems[i]);

            const iter = this._store.append();
            this._store.set(iter, [Columns.APPINFO, Columns.ICON, Columns.DISPLAY_NAME], [appInfo, appInfo.get_icon(), appInfo.get_display_name()]);
        }

        if (validItems.length != currentItems.length) {
            this._settings.set_strv("blacklisted-apps", validItems);
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
});

function buildPrefsWidget() {
    let maxisettings = new MaxiSettings();
    maxisettings.show_all();
    return maxisettings;
}
