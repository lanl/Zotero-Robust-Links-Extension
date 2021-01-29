{
	"translatorID": "f0c6f80b-1689-45e3-a598-138e3f65d53e",
	"translatorType": 2,
	"label": "Robust Link",
	"creator": "Shawn M. Jones",
	"target": "html",
	"minVersion": "1.0.*",
	"maxVersion": "5.0.*",
	"browserSupport": "gcs",
	"priority": 25,
	"displayOptions": {
		"exportNotes": true,
		"exportFileData": false
	},
	"inRepository": true,
	"lastUpdated": "2021-01-28 20:19:33"
}

function doExport(){
    while (item = Zotero.nextItem()) {
		var foundRobustLink = false;
		var versionurl;
		var versiondate;
		var originalurl;

		if (item.attachments) {
			for (let i = 0; i < item.attachments.length; i++) {
				var attachment = item.attachments[i];

				if ( attachment.title == "Robust Link" ) {
					var parser = new DOMParser();
					var htmlDoc = parser.parseFromString( attachment.note, 'text/html' );
					var anchors = htmlDoc.getElementsByTagName('a');

					for ( var j=0; j < anchors.length; j++ ) {
						if (!versionurl) {
							versionurl = anchors[j].getAttribute('data-versionurl');
						}
						
						if (!versiondate) {
							versiondate = anchors[j].getAttribute('data-versiondate');
						}
						
						if (!originalurl) {
							originalurl = anchors[j].getAttribute('data-originalurl');
						}
						
						foundRobustLink = true;
					}
				}
			}
		}

		if (foundRobustLink === true) {
			Zotero.write('<A HREF="'+originalurl+'" data-versionurl="'+versionurl+'" data-versiondate="'+versiondate+'">'+item.title+'</A>\n');
        } else {
            var errorNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});
            errorNotifWindow.changeHeadline("WARNING");
            errorNotifWindow.addLines("No Robust Link found, nothing to export");
            errorNotifWindow.show();
            errorNotifWindow.startCloseTimer(15000);
        }
	}
}
