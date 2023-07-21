sap.ui.define([
	"sap/ui/core/library",
	"sap/m/GroupHeaderListItem",
	"sap/m/GroupHeaderListItemRenderer"
], function (coreLibrary, GroupHeaderListItem, GroupHeaderListItemRenderer) {
	return GroupHeaderListItem.extend("req.stores.codan.customControl.ExtendedGroupHeaderListItem", {
		metadata: {
			aggregations: {
				rightButton: {
					type: "sap.m.Button",
					multiple: false
				}
			}
		},
		init: function () {

		},
		renderer: {
			renderLIContent: function (rm, oControl) {
				var sTextDir = oControl.getTitleTextDirection();
				rm.write("<span");
				rm.addClass("sapMGHLITitle");
				rm.writeClasses();
				if (sTextDir != coreLibrary.TextDirection.Inherit) {
					rm.attr("dir", sTextDir.toLowerCase());
				}

				rm.write(">");
				rm.write(oControl.getTitle());
				rm.write("</span>");

				rm.write("<span");
				rm.addClass("sapMBtn");
				rm.addClass("floatRight");
				rm.writeClasses();
				if (sTextDir != coreLibrary.TextDirection.Inherit) {
					rm.attr("dir", sTextDir.toLowerCase());
				}

				rm.write(">");
				rm.renderControl(oControl.getRightButton());
				rm.write("</span>");

				var iCount = oControl.getCount() || oControl.getCounter();
				if (iCount) {
					rm.write("<span");
					rm.addClass("sapMGHLICounter");
					rm.writeClasses();
					rm.write(">");
					rm.write(" (" + iCount + ")");
					rm.write("</span>");
				}
			},
		}
	});
});
