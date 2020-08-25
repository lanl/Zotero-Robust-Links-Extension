Zotero.Memento = {
  init: function () {
    // if an event involving an item occurs, notifierCallback is invoked.
    var notifierID = Zotero.Notifier.registerObserver(this.notifierCallback, ['item']);
    window.addEventListener('unload', function(e) {
        Zotero.Notifier.unregisterObserver(notifierID);
    }, false);
  },
 
 
  // Callback implementing the notify() method to pass to the Notifier
  notifierCallback: {
    notify: function(event, type, id, extraData) {
      console.log("fired event " + event);
      var item = Zotero.Items.get(id);

      // 'add' is easier to control - 'modify' is triggered by too many actions
      // if ( (event == 'add') || (event == 'modify') ) {
      if (event == 'add') {
        Zotero.RobustLinksCreator.makeRobustLink(null);
      }
    }
  }
};

window.addEventListener('load', Zotero.Memento.init(), false);
