const { click, $, goBack } = require("taiko");

step("Click <buttonName> Tab on Inventory", async function (strButtonName) {
	await click($("//BUTTON[normalize-space()='" + strButtonName + "' and @role='tab']"));
});

step("Click browser back button", async function() {
	await goBack();
});