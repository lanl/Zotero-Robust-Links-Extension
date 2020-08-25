Zotero.RobustLinksCreator = {

    /*
     * Indicates whether an item has an "archived" tag or not.
     *
     * @param {Zotero.Item} item: item to be checked.
     *
     * @return {Boolean}: true if item has "archived" tag. Returns false otherwise.
     */

    isArchived : function(item) {
        console.log("isArchived was called...");
        for (i in item.getTags()) {
            console.log("checking tag " + i );

            tagval = item.getTags()[i]["tag"];

            console.log("get tag " + item.getTags()[i]["tag"]);

            if (tagval == "archived") {
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

    /*
    * Displays appropriate status window if there is an error, fills in URI-M otherwise.
    * 
    */
    call_robust_link_api: function(url, archive, item) {
        var errorNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});
        var notice = "";

        // api_url = "https://www.shawnmjones.org";
        if (archive === null ) {
            api_url = "https://robustlinks.mementoweb.org/api/?" + "url=" + encodeURIComponent(url);
        } else {
            api_url = "https://robustlinks.mementoweb.org/api/?" + "archive=" + encodeURIComponent(archive) + "&url=" + encodeURIComponent(url);
        }
        
        var xhr = new XMLHttpRequest();
        xhr.open("GET", api_url, false);
        console.log("with xhr, sending " + url + " to " + api_url);
        xhr.send();

        console.log("extracting RL response and responding ourselves appropriately...");

        switch(xhr.status) {
        case 200:
            notice = "Success! Note contains archived link.";

            // create note with Robust Link
            var note = new Zotero.Item('note'); 
            // noteText = "Version URL: " + robust_link;
            jdata = JSON.parse(xhr.responseText);
            noteText = "Robust Links Data - DO NOT DELETE\n" + xhr.responseText;
            // TODO: replace < and > in noteText with &lt; and &gt;
            note.setNote(noteText); 
            note.parentID = item.id;
            note.saveTx();

            var note = new Zotero.Item('note');
            noteText = "Robust Link HTML\n" + jdata["robust_links_html"]["original_url_as_href"].replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
            note.setNote(noteText); 
            note.parentID = item.id;
            note.saveTx();

            var note = new Zotero.Item('note');
            noteText = "URI-M: " + jdata["data-versionurl"];
            note.setNote(noteText); 
            note.parentID = item.id;
            note.saveTx();

            // create "archived" tag so we know this was completed
            item.addTag("archived");
            item.saveTx();
            
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

        console.log("expecting output to appear: " + notice);

        errorNotifWindow.changeHeadline(notice);
        errorNotifWindow.show();
        errorNotifWindow.startCloseTimer(5000);
    },

    makeRobustLink : function(archive_name, item) {

        console.log("starting makeRobustLink");

        if (item === null) {
            var pane = Zotero.getActiveZoteroPane();
            var selectedItems = pane.getSelectedItems();
            var item = selectedItems[0];
        }

        var url = item.getField('url');

        var errorNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});

        if (archive_name === null) {
            notice = "submitting url " + url + " to any web archive";
        } else {
            notice = "submitting url " + url + " to web archive " + archive_name;
        }
        
        errorNotifWindow.changeHeadline(notice);
        errorNotifWindow.show();
        errorNotifWindow.startCloseTimer(3000);

        if (this.checkValidUrl(url)) {
            if (!this.isArchived(item)) {
                this.call_robust_link_api(url, archive_name, item);
            }
        }

    }
}
