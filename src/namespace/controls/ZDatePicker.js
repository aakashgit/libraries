sap.ui.define([
    "sap/m/DatePicker",
    "sap/ui/model/odata/type/DateTime",
    "sap/ui/model/resource/ResourceModel"
], function(DatePicker, DateTime, ResourceModel) {
    "use strict";

    return DatePicker.extend("codan.libraries.controls.ZDatePicker", {
        metadata: {
            // Inherit all properties, aggregations, and events from sap.m.DatePicker
            // No need to redefine them unless you want to change their types or defaults
        },

        init: function() {
            // Call the parent control's init method
            DatePicker.prototype.init.apply(this, arguments);

            // Set the default displayFormat
            this.setDisplayFormat("dd-MMM-yyyy");
        },

        // Override the bindProperty method to inject default binding parameters for "dateValue"
        bindProperty: function(sName, oBindingInfo) {
            if (sName === "dateValue") {
                // Ensure formatOptions and constraints are set as defaults if not provided
                oBindingInfo.type = oBindingInfo.type || new DateTime({
                    UTC: true
                }, {
                    displayFormat: 'Date'
                });
            }

            // Call the original bindProperty method
            DatePicker.prototype.bindProperty.apply(this, arguments);
        },

        renderer: {} // Use the standard DatePicker renderer
    });
});
