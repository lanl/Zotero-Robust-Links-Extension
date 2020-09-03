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

        for(item of items) {

          Zotero.debug("item is of type " + item.itemTypeID);

          // we don't work with attachments (2) or notes (26)
          if (item.itemTypeID != 2 && item.itemTypeID != 26) {
            Zotero.RobustLinksCreator.eventMakeRobustLink(null, item);
          }

        }
      }

    }
  }
};

window.addEventListener('load', Zotero.RobustLinks.init(), false);
