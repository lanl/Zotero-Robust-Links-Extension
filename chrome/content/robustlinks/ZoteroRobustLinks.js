Zotero.RobustLinks = {
  init: function () {
    // if an event involving an item occurs, notifierCallback is invoked.
    var notifierID = Zotero.Notifier.registerObserver(this.notifierCallback, [
      'item'
    ]);
    window.addEventListener('unload', function(e) {
        Zotero.Notifier.unregisterObserver(notifierID);
    }, false);
  },
 
  // Callback implementing the notify() method to pass to the Notifier
  notifierCallback: {
    notify: function(event, type, ids, extraData) {
      Zotero.debug("fired event " + event + " for id " + ids);
      Zotero.debug("type: " + type);
      Zotero.debug("extraData:");
      Zotero.debug(extraData);

      var items = Zotero.Items.get(ids);

      // 'add' is easier to control - 'modify' is triggered by too many actions
      // if ( (event == 'add') || (event == 'modify') ) {
      if ((event == 'add') && (type == 'item')) {

        if ( (Zotero.Prefs.get('extensions.robustlinks.archiveonadd', true) == "no" ) ) {
          return;
        }

        for(item of items) {

          Zotero.debug("item is of type " + item.itemTypeID);

          // we don't work with attachments (2) or notes (26)
          if (item.itemTypeID != 2 && item.itemTypeID != 26) {
            archive_name = Zotero.Prefs.get('extensions.robustlinks.whatarchive', true);

            if ( archive_name == "random" ) {
              archive_name = null;
            }

            Zotero.RobustLinksCreator.eventMakeRobustLink(archive_name, item);
          }

        }
      }

    }
  },

  openPreferences: function () {

    if (!('_preferencesWindow' in this) || this._preferencesWindow === null || this._preferencesWindow.closed) {
        var featureStr = 'chrome,titlebar,toolbar=yes,resizable,centerscreen,';
        var modalStr = Services.prefs.getBoolPref('browser.preferences.instantApply') ? 'dialog=no' : 'modal';
        featureStr = featureStr + modalStr;

        this._preferencesWindow =
            window.openDialog('chrome://robustlinks/content/options.xul', 'robustlinks-prefs', featureStr);
    }

    this._preferencesWindow.focus();
  }

};

window.addEventListener('load', Zotero.RobustLinks.init(), false);
