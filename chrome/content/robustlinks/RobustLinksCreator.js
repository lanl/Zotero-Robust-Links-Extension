
/* for debugging */
// const getMethods = (obj) => {
//     let properties = new Set()
//     let currentObj = obj
//     do {
//       Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
//     } while ((currentObj = Object.getPrototypeOf(currentObj)))
//     return [...properties.keys()].filter(item => typeof obj[item] === 'function')
//   }

Zotero.RobustLinksCreator = {

    /*
     * Indicates whether an item has a 'Robust Link' attachment.
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
        var https = pattern.test(url);
        if (!https) {
          return false;
        }
        return true;
      },

    issueNotice: function(notice_title, notice, timeout) {
        var errorNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});

        errorNotifWindow.changeHeadline(notice_title);
        errorNotifWindow.addLines(notice);
        errorNotifWindow.show();
        errorNotifWindow.startCloseTimer(timeout);
    },

    /*
    * Displays appropriate status window if there is an error, fills in URI-M otherwise.
    * 
    */
    call_robust_link_api: function(url, archive, item, urir_shortcircuit) {
        
        var notice = "";

        if (archive === null ) {
            api_url = "https://robustlinks.mementoweb.org/api/?" + "url=" + encodeURIComponent(url);
        } else {
            api_url = "https://robustlinks.mementoweb.org/api/?" + "archive=" + encodeURIComponent(archive) + "&url=" + encodeURIComponent(url);
        }

        // for testing
        // api_url = "https://robustlinks.mementoweb.org/apii/?" + "archive=testfailarchive&url=" +encodeURIComponent(url);

        if ( urir_shortcircuit === true ){
            api_url = api_url + '&urir_shortcircuit=True';
        }
        
        fetch(api_url).then( (response) => {

            status = response.status;

            Zotero.debug("we have fetched " + api_url + " and got back " + status);

            if (status == 200) {
                Zotero.debug("got a 200, returning response object for .then");
                return response.json();
            } else {
                throw response.status;
            }

        }).then( function(jdata) {

            Zotero.debug("working with jdata...");
            Zotero.debug(jdata);

            attachments = item.getAttachments();

            var attachmentPromise = Zotero.Attachments.linkFromURL({
                url: jdata["data-originalurl"],
                parentItemID: item.id,
                title: "Robust Link"
            });

            Zotero.debug("created attachmentPromise...");
            Zotero.debug(attachmentPromise);

            attachmentPromise.then((item) => {

                Zotero.debug("successful creation of attachment with id: " + item.id);              

                notetext = "";
                // It looks like Zotero swallows <head>, <link>, and <script> elements, this won't work:
                // notetext += '<head>';
                // notetext += '<!-- RobustLinks CSS -->';
                // notetext += '<link rel="stylesheet" type="text/css" href="https://doi.org/10.25776/z58z-r575" />';
                // notetext += '<!-- RobustLinks Javascript -->';
                // notetext += '<script type="text/javascript" src="https://doi.org/10.25776/h1fa-7a28"></script>';
                // notetext += '</head>';

                notetext += "Original URL: " + jdata["robust_links_html"]["original_url_as_href"];
                notetext += "<br>";
                notetext += "Memento URL: " + jdata["robust_links_html"]["memento_url_as_href"];

                notetext += "<hr>";
                notetext += "<strong>Step 1: If you would like to include this Robust Link in your web page, copy the appropriate HTML snippet below.</strong>"
                notetext += "<hr>";
                notetext += "Copy this snippet if you want the link text to lead to the live web resource <" + jdata['data-originalurl'] + ">.";
                notetext += "<br><br>";
                notetext += jdata["robust_links_html"]["original_url_as_href"].replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
                notetext += "<hr>";
                notetext += "Copy this snippet if you want the link text to lead to the memento <" + jdata['data-versionurl'] + ">.";
                notetext += "<br><br>";
                notetext += jdata["robust_links_html"]["memento_url_as_href"].replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");;
                notetext += "<hr>";
                notetext += "<strong>Step 2: If you would like to make your Robust Links actionable, include this HTML in your web page, preferably inside the HEAD tag.</strong>";
                notetext += "<br><br>";
                notetext += "&lt;!-- RobustLinks CSS --&gt;<br>\
                &lt;link rel=&quot;stylesheet&quot; type=&quot;text/css&quot; href=&quot;https://doi.org/10.25776/z58z-r575&quot; /&gt;<br>\
                &lt;!-- RobustLinks Javascript --&gt;<br>\
                &lt;script type=&quot;text/javascript&quot; src=&quot;https://doi.org/10.25776/h1fa-7a28&quot;&gt;&lt;/script&gt;<br>\
                ";

                item.setNote(notetext);
                item.saveTx();

                notice_title = "Robust Links INFO";
                notice = "Success! Note contains Robust Link.";
                notice_duration = 10000;
                var errorNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});
                errorNotifWindow.changeHeadline(notice_title);
                errorNotifWindow.addLines(notice);
                errorNotifWindow.show();
                errorNotifWindow.startCloseTimer(notice_duration);
            },
            (reason) => {
                Zotero.debug("Robust Links failure?");
                Zotero.debug(reason);
            }
            );

        }).catch(function(reason) {

            Zotero.debug('catching failure ' + reason);

            notice_title = "Robust Links ERROR";
            notice = "Generic error";
            notice_duration = 20000;

            switch(reason) {
                case 400:
                    notice = "There was an issue with the value in the URL field.";
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

                    var archive_menu_option = {
                        "archive.org": "Internet Archive",
                        "archive.today": "Archive.Today",
                        null: "Any Web Archive"
                    };
        
                    notice = "There was an issue creating a memento for " + url + " at " + archive_menu_option[archive] + ".\n\n\n\nPlease try archiving the resource again later by right clicking this item and choosing Robustify This Resource -> " + archive_menu_option[archive];
                    notice_duration = 30000;
                    break;
                case 504:
                    notice = "The Robust Links service is experiencing issues. Please try again later.";
                    break;
            }

            var errorNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});
            errorNotifWindow.changeHeadline(notice_title);
            errorNotifWindow.addLines(notice);
            errorNotifWindow.show();
            errorNotifWindow.startCloseTimer(notice_duration);
        });

    },

    getBestURL: function(item) {
        var url = item.getField('url');

        Zotero.debug("detected url [" + url + "]");

        var doi = item.getField('DOI');

        Zotero.debug("detected doi [" + doi + "]");

        Zotero.debug(doi == '');

        if (doi != "") {
            url = "https://doi.org/" + doi;
        }

        Zotero.debug("using url " + url);

        return url;
    },

    /*
     * Make a Robust Link from an item.
     */
    makeRobustLink : function(archive_name, item, display_status) {

        Zotero.debug("starting makeRobustLink");
        Zotero.debug("archive_name = " + archive_name);
        Zotero.debug("display_status = " + display_status);

        if (item === null) {
            var pane = Zotero.getActiveZoteroPane();
            var selectedItems = pane.getSelectedItems();
            var item = selectedItems[0];
        }

        Zotero.debug("item ID = " + item.id);
        Zotero.debug("item.itemTypeID is " + item.itemTypeID);

        var url = this.getBestURL(item);

        if (item.itemTypeID == 2){
            if ( display_status === true ) {
                notice = "Refusing to archive attachment";
                Zotero.debug(notice);
                this.issueNotice("Robust Links WARNING", notice, 5000);    
            }
            return;
        }

        if ( item.itemTypeID == 26) {
            if ( display_status === true ) {
                notice = "Refusing to archive note";
                Zotero.debug(notice);
                this.issueNotice("Robust Links WARNING", notice, 5000);
            }
            return;
        }

        if (url == "") {
            Zotero.debug("no URL field, returning...");
            if ( display_status === true ) {
                notice = "Refusing to archive blank URL";
                Zotero.debug(notice);
                this.issueNotice("Robust Links WARNING", notice, 5000);
            }
            return;
        }

        if (this.checkValidUrl(url)) {
            if (!this.isArchived(item)) {

                /* this is null rather than 'random' so we can fall through */
                if (archive_name === null ) {
                    notice = "Preserving " + url + " \n at any web archive";
                } else if ( archive_name == 'default' ) {
                    archive_name = Zotero.Prefs.get('extensions.robustlinks.whatarchive', true);

                    if ( archive_name == "random" ) {
                        archive_name = null;
                    }

                    if ( typeof archive_name === 'undefined' ) {
                        archive_name = null;
                    }

                    notice = "Preserving " + url + " \n at default web archive " + archive_name;
                } else {
                    notice = "Preserving " + url + " \n at web archive " + archive_name;
                }
                Zotero.debug(notice);
                
                this.issueNotice("Robust Links INFO", notice, 5000);

                always_assume_urir = Zotero.Prefs.get('extensions.robustlinks.alwaysurir', true);

                if ( typeof always_assume_urir === 'undefined' ) {
                    always_assume_urir = 'no';
                }

                Zotero.debug("extensions.robustlinks.alwaysurir is " + always_assume_urir);

                if ( url.includes("doi.org") || ( always_assume_urir === "yes" ) ) {
                    this.call_robust_link_api(url, archive_name, item, true);
                } else {
                    this.call_robust_link_api(url, archive_name, item, false);
                }

            } else {

                notice = "Already preserved at a web archive";
                Zotero.debug(notice);
                this.issueNotice("Robust Links INFO", notice, 5000);
            }
        } else {
            notice = "Refusing to preserve invalid URL " + url;
            Zotero.debug(notice);
            this.issueNotice("Robust Links WARNING", notice, 5000);
        }

    },

}
