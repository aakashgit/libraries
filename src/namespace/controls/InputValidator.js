sap.ui.define([], function () {
	"use strict";
	/*
	Can be used to have common validation methods for Input fields
	*/
	return {
		validateFloat(inputEvent) {
			//See if text is entered and if so set the value back to 0
			const control = inputEvent.getSource();
			const value = control.getValue();
			const binding = control.getBinding("value");
			try {
				const parsedValue = binding.getType().parseValue(value, binding.sInternalType); // throw error if cannot parse value
				if (parsedValue) {
					//continue with std. onChange without any modifications
				} else {
					//reset the value
					control.setValue("0");
				}
			} catch (err) {
				//reset the value
				control.setValue("0");
			}
		}
	};
});
