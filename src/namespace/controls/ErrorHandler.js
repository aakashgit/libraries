sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	"sap/ui/core/MessageType",
	"sap/m/MessageItem",
	"sap/m/MessageView",
	"sap/ui/model/json/JSONModel",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Bar",
	"sap/m/Text",
	"sap/ui/core/message/Message",
	"sap/ui/core/message/ControlMessageProcessor",
	"sap/ui/core/Core",
	"sap/m/ResponsivePopover",
	"sap/ui/core/IconPool",
	"sap/m/Title"	
], function (Object, MessageBox, MessageType, MessageItem, MessageView, JSONModel, Dialog, Button, Bar, Text, Message,
	ControlMessageProcessor, Core, ResponsivePopover, IconPool, Title) {
	"use strict";
	return Object.extend("namespace.libraries.controls.ErrorHandler", {
		constructor: function (oComponent, models) {
			if (oComponent) {
				this.Parent = oComponent;
				this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
				this._oComponent = oComponent;
				this._bMessageOpen = false;
				this._sErrorText = this._oResourceBundle.getText("errorText");
			}
			// //Initiate message manager
			this.messageProcessor = new ControlMessageProcessor();
			this.messageManager = Core.getMessageManager();
			this.messageManager.registerMessageProcessor(this.messageProcessor);
			this.markUpDescription = false; //By default disabling HTML content
			
			const attachModel = (model) => {
				model.attachMetadataFailed(function (oEvent) {
					const oParams = oEvent.getParameters();
					this._showServiceError(oParams.response);
				}, this);

				model.attachRequestFailed(function (oEvent) {
					const oParams = oEvent.getParameters();
					// An entity that was not found in the service is also throwing a 404 error in oData.
					// We already cover this case with a notFound target so we skip it here.
					// A request that cannot be sent to the server is a technical error that we have to handle though
					if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf(
							"Cannot POST") === 0)) {
						this._showServiceError(oParams.response);
					}
				}, this);
			};
			if (models.length > 0) {
				models.forEach((row) => {
					attachModel(row);
				});
			}
			
			/*   Methods to be consumed by the calling Projects */
			this.removeAllMessages = () => { //Exposed to be called from child projects
				this.messageManager.removeAllMessages(); //remove all messages
			};
			//To open popover message view when Message handler footer button is clicked
			this.onMessagesButtonPress = (evt, delegate) =>{
				this._onMessagesButtonPress(evt, delegate);
			};
		},
		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be display.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showServiceError: function (sDetails) {
			try {
				this.messageManager.removeAllMessages();
				//Get the incomming messages
				const responseObject = JSON.parse(sDetails.responseText);
				const multiMessage = responseObject.error.innererror.errordetails;
				//Convert to internal format
				const multiMessages = this._convertMultiMessage(multiMessage);
				if (multiMessages.length > 0 && multiMessages.length <= 1) {
					const singleMessage = multiMessages[0].message;
					//Show the single message
					this._showSingleError(singleMessage);
				} else if (multiMessages.length > 1) {
					//Show Multiples messages - from message manager
					this._showMultipleMessages();
				} else {
					if (responseObject.error.message.value) {
						//Add messages to the message manager incase if it was used
						this.messageManager.addMessages(
							new Message({
								type: MessageType.Error,
								message: responseObject.error.message.value,
								processor: this.messageProcessor
							}));
						//Show popup	
						this._showSingleError(responseObject.error.message.value);
					} else {
						this._showGenericError(sDetails);
					}
				}

			} catch (err) {
				//Give generic error				
				this._showGenericError(sDetails);
			}
		},
		/**
		 * Shows a {@link sap.m.MessageBox} with sinle message
		 */
		_showSingleError(message) {
			if (this._bMessageOpen) { //Dont show another popup when we already have one.
				return;
			}
			this._bMessageOpen = true;
			MessageBox.error(
				message, {
					id: "serviceErrorMessageBox",
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function () {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
		},

		_showGenericError(message) {
			if (this._bMessageOpen) { //Dont show another popup when we already have one.
				return;
			}
			this._bMessageOpen = true;
			MessageBox.error(
				this._sErrorText, {
					id: "serviceErrorMessageBox",
					details: message,
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function () {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
		},

		/**
		 * Convert multi message to valid format and filtout irrelevant ones.
		 */
		_convertMultiMessage(multiMessage) {
			const msgType = {
				error: MessageType.Error,
				warning: MessageType.Warning,
				info: MessageType.Information,
				success: MessageType.Success
			};

			//Return multiple messages
			const multiMessages = [];
			multiMessage.forEach((messageline) => {
				let type = "";
				const message = messageline.message;
				if (message === "An exception was raised") {
					return;
				}
				//Add messages to the message manager incase if it was used
				this.messageManager.addMessages(
					new Message({
						type: msgType[messageline.severity] === undefined ? MessageType.Error : msgType[messageline.severity], //Get message type
						message: message,
						code: messageline.code,
						additionalText: messageline.propertyref, //making use of this field for grouping
						description: messageline.target, //making use of this field for long text
						processor: this.messageProcessor
					}));
				if (messageline.target) {
					this.markUpDescription = true;
				}
				multiMessages.push({
					type: msgType[messageline.severity] === undefined ? MessageType.Error : msgType[messageline.severity], //Get message type
					message: message
				});
			});

			return multiMessages;
		},
		/**
		 * Shows multi messages using Message view
		 */
		_showMultipleMessages() {
			if (this._bMessageOpen) { //Dont show another popup when we already have one.
				return;
			}
			this._bMessageOpen = true;
			const oMessageTemplate = new MessageItem({
				type: '{type}',
				title: '{message}',
				subtitle: '{code}',
				description: '{description}',
				groupName: '{additionalText}'
			});

			//This enables to show HTML content in detail page.
			oMessageTemplate.setMarkupDescription(this.markUpDescription);

			//Messageview
			this.oMessageView = new MessageView({
				showDetailsPageHeader: false,
				itemSelect: function () {
					oBackButton.setVisible(true);
				},
				items: {
					path: "/",
					template: oMessageTemplate
				},
				groupItems: true
			});

			const oBackButton = new Button({
				icon: sap.ui.core.IconPool.getIconURI("nav-back"),
				visible: false,
				press: function () {
					const content = this.getParent().getParent().getContent();
					if (content.length > 0) {
						content[0].navigateBack();
					}
					this.setVisible(false);
				}
			});

			this.oMessageView.setModel(this.messageManager.getMessageModel());
			const dialogNotOpen = () => {
				this._bMessageOpen = false;
			};
			this.oDialog = new Dialog({
				resizable: true,
				content: this.oMessageView,
				state: 'Error',
				beginButton: new Button({
					press: function () {
						this.getParent().close();
						dialogNotOpen.call(this);
					},
					text: "Close"
				}),
				customHeader: new Bar({
					contentMiddle: [
						new Text({
							text: "Messages"
						})
					],
					contentLeft: [oBackButton]
				}),
				contentHeight: "400px",
				contentWidth: "500px",
				verticalScrolling: false
			});

			this.oDialog.open();
		},
		//Display message on click of messages button
		_onMessagesButtonPress(evt, closeDelegate) {
			this.description = "";

			//Template for displaying the message
			const oMessageTemplate = new MessageItem({
				type: '{type}',
				title: '{message}',
				subtitle: '{code}',
				description: '{description}',
				groupName: '{additionalText}'
			});
			
			//This enables to show HTML content in detail page.
			oMessageTemplate.setMarkupDescription(this.markUpDescription);			

			//Messageview setup
			this.oMessagePopoverView = new MessageView({
				showDetailsPageHeader: false,
				itemSelect: function (evt) {
					oBackButton.setVisible(true);
				}.bind(this),
				items: {
					path: "/",
					template: oMessageTemplate
				},
				groupItems: true
			});

			this.oMessagePopoverView.setModel(this.messageManager.getMessageModel());

			const oBackButton = new Button({
				icon: IconPool.getIconURI("nav-back"),
				visible: false,
				press: function (evt) {
					this.oMessagePopoverView.navigateBack();
					this.oPopover.focus();
					evt.getSource().setVisible(false);
				}.bind(this)
			});

			const oCloseButton = new Button({
					text: "Close",
					press: function () {
						this.oPopover.close();
						if (closeDelegate) {
							closeDelegate.call(this);
						}
					}.bind(this)
				}).addStyleClass("sapUiTinyMarginEnd"),

				oPopoverBar = new Bar({
					contentLeft: [oBackButton],
					contentMiddle: [
						new Title({
							text: "Messages"
						})
					]
				});

			this.oPopover = new ResponsivePopover({
				customHeader: oPopoverBar,
				contentWidth: "500px",
				contentHeight: "40%",
				verticalScrolling: false,
				modal: true,
				content: [this.oMessagePopoverView],
				endButton: oCloseButton
			});
			//open popover
			this.oPopover.openBy(evt.getSource());
		}
	});
});
