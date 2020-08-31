const getMethods = (obj) => {
    let properties = new Set()
    let currentObj = obj
    do {
      Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
    } while ((currentObj = Object.getPrototypeOf(currentObj)))
    return [...properties.keys()].filter(item => typeof obj[item] === 'function')
  }

Zotero.RobustLinksCreator = {

    /*
     * Indicates whether an item has an "archived" tag or not.
     *
     * @param {Zotero.Item} item: item to be checked.
     *
     * @return {Boolean}: true if item has "archived" tag. Returns false otherwise.
     */

    isArchived : function(item) {
        Zotero.debug("isArchived was called...");

        for(var attid of item.getAttachments()) {
            attachment = Zotero.Items.get(attid);
            if (attachment.getField('title') == 'Robust Link') {
                return true;
            }
        }

        return false;
      },

    /*
     * Ensures that a URL leads to a valid page and uses HTTP/HTTPS.
     *
     * @param {string} url: URL to be checked.
     *
     * returns {Boolean}: True if the URL leads to a resource that uses HTTP/HTTPS,
     *                    False otherwise.
     */

    checkValidUrl : function(url) {
        var pattern = /https?:\/\/.+/;
        var status = -1;
        var https = pattern.test(url);
        if (!https) {
          return false;
        }
        return true;
      },

    issueNotice: function(notice, timeout) {
        var errorNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});

        errorNotifWindow.changeHeadline(notice);
        errorNotifWindow.show();
        errorNotifWindow.startCloseTimer(timeout);
    },

    /*
    * Displays appropriate status window if there is an error, fills in URI-M otherwise.
    * 
    */
    call_robust_link_api: function(url, archive, item) {
        
        var notice = "";

        // api_url = "https://www.shawnmjones.org";
        if (archive === null ) {
            api_url = "https://robustlinks.mementoweb.org/api/?" + "url=" + encodeURIComponent(url);
        } else {
            api_url = "https://robustlinks.mementoweb.org/api/?" + "archive=" + encodeURIComponent(archive) + "&url=" + encodeURIComponent(url);
        }
        
        var xhr = new XMLHttpRequest();
        // var xhr = new Object();
        xhr.open("GET", api_url, false);
        Zotero.debug("with xhr, sending " + url + " to " + api_url);
        xhr.send();

        Zotero.debug("extracting RL response and responding ourselves appropriately...");

        xhr.status = 200;

        Zotero.debug("xhr.status is now " + xhr.status);

        switch(xhr.status) {
        case 200:
            notice = "Success! Note contains archived link.";

            jdata = JSON.parse(xhr.responseText);
            Zotero.debug("creating new attachment with " + jdata["data-originalurl"]);
            Zotero.debug("item.id is " + item.id);
            attachments = item.getAttachments();
            Zotero.debug("there are " + attachments.length + " attachments");

            var attachmentPromise = Zotero.Attachments.linkFromURL({
                url: jdata["data-originalurl"],
                parentItemID: item.id,
                title: "Robust Link"
            });

            Zotero.debug("created attachmentPromise...");
            Zotero.debug(attachmentPromise);

            attachmentPromise.then((item) => {
                // Zotero.debug(value);
                // Zotero.debug("methods?");
                // Zotero.debug( getMethods(value) );
                Zotero.debug("successful creation of attachment with id: " + item.id);
                item.setNote(JSON.stringify(jdata));
                item.saveTx();
            },
            (reason) => {
                Zotero.debug("Robust Links failure?");
                Zotero.debug(reason);
            }
            );

            // create "archived" tag so we know this was completed
            // item.addTag("archived");
            // item.saveTx();
            
            break;
        case 400:
            notice = "There was an issue with the value in the URL field.";
            break;
        case 403:
            notice = "Cannot create a memento for the value in the URL field due to legal or policy reasons.";
            break;
        case 404:
        case 405:
            notice = "There is an issue with the Zotero Robust Links Extension. Please contact the extension maintainer.";
            break;
        case 500:
            notice = "There is an issue with the Robust Links service. Please try again later.";
            break;
        case 502:
        case 503:
            notice = "There was an issue creating a memento at " + archive + ". Please try again later.";
            break;
        case 504:
            notice = "The Robust Links service is experiencing issues. Please try again later.";
            break;
        }

        Zotero.debug("expecting output to appear: " + notice);

        this.issueNotice(notice, 5000);

    },

    makeRobustLink : function(archive_name, item) {

        Zotero.debug("starting makeRobustLink");
        var errorNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});

        if (item === null) {
            var pane = Zotero.getActiveZoteroPane();
            var selectedItems = pane.getSelectedItems();
            var item = selectedItems[0];
        }

        Zotero.debug("item.itemTypeID is " + item.itemTypeID);

        var url = item.getField('url');

        Zotero.debug("url is " + url);

        if (item.itemTypeID == 2){
            notice = "Refusing to archive attachment";
            this.issueNotice(notice, 5000);
            return;
        }

        if ( item.itemTypeID == 26) {
            notice = "Refusing to archive note";
            this.issueNotice(notice, 5000);
            return;
        }

        if (url == "") {
            Zotero.debug("no URL field, returning...");
            notice = "Refusing to archive blank URL";
            this.issueNotice(notice, 5000);
            return;
        }

        if (this.checkValidUrl(url)) {
            if (!this.isArchived(item)) {
                
                if (archive_name === null) {
                    notice = "Preserving " + url + " \n at any web archive";
                } else {
                    notice = "Preserving " + url + " \n at web archive " + archive_name;
                }
                
                this.issueNotice(notice, 5000);
                this.call_robust_link_api(url, archive_name, item);
            } else {

                notice = "URL field already archived";
                this.issueNotice(notice, 5000);
            }
        }

    }
}
