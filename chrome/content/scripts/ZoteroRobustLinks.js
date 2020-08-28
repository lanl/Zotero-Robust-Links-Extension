Zotero.RobustLinks = {
  init: function () {
    // if an event involving an item occurs, notifierCallback is invoked.
    var notifierID = Zotero.Notifier.registerObserver(this.notifierCallback, ['item']);
    window.addEventListener('unload', function(e) {
        Zotero.Notifier.unregisterObserver(notifierID);
    }, false);
  },
 
 
  // Callback implementing the notify() method to pass to the Notifier
  notifierCallback: {
    notify: function(event, type, ids, extraData) {
      console.log("fired event " + event + " for id " + ids);
      console.log("type:");
      console.log(type);
      console.log("extraData:");
      console.log(extraData);
      var items = Zotero.Items.get(ids);

      // 'add' is easier to control - 'modify' is triggered by too many actions
      // if ( (event == 'add') || (event == 'modify') ) {
      if (event == 'add') {      

        for(item of items) {

          console.log("item is of type " + item.itemTypeID);

          // we don't work with attachments (2) or notes (26)
          if (item.itemTypeID != 2 && item.itemTypeID != 26) {
            Zotero.RobustLinksCreator.makeRobustLink(null, item);
          }

        }
      }

    }
  }
};

window.addEventListener('load', Zotero.RobustLinks.init(), false);
