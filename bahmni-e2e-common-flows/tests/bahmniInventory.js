const httpRequests = require("../../tests/API/util/httpRequest")
const helper = require("../../tests/API/util/helper")
const endpoints = require('../../tests/API/constants/apiConstants').endpoints;
const dateUtil = require('./util/date')
const assert = require("assert");
const { faker } = require('@faker-js/faker/locale/en_IND');
const { write, dropDown, $, below, click, into, waitFor, timeField, clear, scrollTo, text, link, toRightOf, toLeftOf, highlight, textBox, within } = require("taiko");
const taikoHelper = require("./util/taikoHelper");
const { Console } = require("console");
const _ = require('lodash');
const fileExtension = require('./util/fileExtension');
const { format } = require('date-fns');

step("Enter Random Item Details in Load Stock popup", async function () {
	var intQty = faker.datatype.number({ min: 1, max: 10 });
	var invItemDetails = await generateRandomItemDetailsInLoadStockPopup(intQty, false);
	gauge.dataStore.scenarioStore.put("invItemDetails", invItemDetails);
	for (var index = 0; index < invItemDetails.length; index++) {
		if (index !== 0) {
			await click($("//*[@id='stock-table-container']/button"));
		}
		await enterItemName(invItemDetails[index].itemName, index + 1);
		await enterBatchNo(invItemDetails[index].batchNo, index + 1);
		await enterExpiry(invItemDetails[index].expiry, index + 1);
		await enterQuantity(invItemDetails[index].quantity, index + 1);
	}
});
async function enterItemName(itemName, index) {
	await write(itemName, into($("//*[@id='stock-table-container']//tbody/tr[" + index + "]/td[2]//input")));
	await scrollTo($("//*[normalize-space()='" + itemName + "'and @role = 'option']"));
	await waitFor(() => $("//*[normalize-space()='" + itemName + "'and @role = 'option']").isVisible());
	await click($("//*[normalize-space()='" + itemName + "'and @role = 'option']"));
}
async function enterBatchNo(batchNo, index) {
	await write(batchNo, into($("//*[@id='stock-table-container']//tbody/tr[" + index + "]/td[3]//input")));
}
async function enterExpiry(expiry, index) {
	var day = parseInt(expiry.split("/")[0]);
	var month = parseInt(expiry.split("/")[1]);
	var year = parseInt(expiry.split("/")[2]);
	var dateObject = new Date(year, month - 1, day);
	var options = { year: 'numeric', month: 'long', day: 'numeric' };
	var formattedDate = dateObject.toLocaleDateString('en-US', options);
	await click($("//*[@id='stock-table-container']//tbody/tr[" + index + "]/td[4]//input"));
	await clear($("(//input[@aria-label='Year'])[" + (index + 1) + "]"));
	await write(year, into($("(//input[@aria-label='Year'])[" + (index + 1) + "]")));
	var currentMonth = new Date().getMonth() + 1;
	if (currentMonth < month) {
		for (var i = 0; i < month - currentMonth; i++) {
			await click($("(//SPAN[@class='flatpickr-next-month'])[" + (index + 1) + "]"))
		}
	}
	else if (currentMonth > month) {
		for (var i = 0; i < currentMonth - month; i++) {
			await click($("(//SPAN[@class='flatpickr-prev-month'])[" + (index + 1) + "]"))
		}
	}
	await click($("//SPAN[@aria-label='" + formattedDate + "']"));
}
async function enterQuantity(quantity, index) {
	await write(quantity, into($("//*[@id='stock-table-container']//tbody/tr[" + index + "]/td[5]//input")));
}
async function enterDispenseQuantity(quantity, index) {
	await write(quantity, into($("//*[@id='stock-table-container']//tbody/tr[" + index + "]/td[4]//input")));
}
async function generateRandomItemDetailsInLoadStockPopup(totalItems, blnOnlyDrug) {
	var allItemsResponse = await httpRequests.customGet(endpoints.inv_items, "limit=" + (await httpRequests.customGet(endpoints.inv_items, "limit=1")).body.length);
	var allItems = allItemsResponse.body.results;
	var items = [];
	totalItems = totalItems > allItems.length ? allItems.length : totalItems;
	for (var i = 0; i < totalItems; i++) {
		var randomItem;
		if (!blnOnlyDrug)
			randomItem = getRandomJsonArray(allItems, items, "name");
		else {
			filteredItems = allItems.filter(item => item.attributes.filter(attribute => attribute.attributeType.name === "Drug").length > 0);
			totalItems = totalItems > filteredItems.length ? filteredItems.length : totalItems;
			randomItem = getRandomJsonArray(filteredItems, items, "name");
		}
		var ItemDetails = {};
		ItemDetails.itemName = randomItem.name;
		ItemDetails.batchNo = dateUtil.getGetCurrentddmmyyhhmmssms();
		ItemDetails.expiry = dateUtil.generateRandomDate(5);
		ItemDetails.quantity = faker.datatype.number({ min: 1, max: 1000 });
		ItemDetails.drug = randomItem.attributes.filter(attribute => attribute.attributeType.name === "Drug").length > 0 ? true : false;
		items.push(ItemDetails);
	}
	return items;
}

function getRandomJsonArray(jsonArray, items, propertyName, maxRetries = 100) {
	if (!Array.isArray(jsonArray) || jsonArray.length === 0 || !Array.isArray(items)) {
		return null;
	}
	let retries = 0;
	while (retries < maxRetries) {
		const randomIndex = Math.floor(Math.random() * jsonArray.length);
		const randomObject = jsonArray[randomIndex];
		if (!items.some(item => item.itemName === _.get(randomObject, propertyName))) {
			return randomObject;
		}
		retries++;
	}
	return null; // If maxRetries is reached and no unique object is found.
}

step("Validate the inventory page to check the new stocks are loaded", async function () {
	var invItemDetails = gauge.dataStore.scenarioStore.get("invItemDetails");
	for (var invItem of invItemDetails) {
		assert.ok((await (link(invItem.itemName)).elements()).length === 1);
		await click(invItem.itemName);
		await waitFor(async () => await $("//*[normalize-space()='Stock Details for " + invItem.itemName + "']").isVisible());
		const [day, month, year] = invItem.expiry.split('/');
		gauge.message(`validating ${invItem.itemName} with ${invItem.quantity} with ${day}-${month}-${year} with ${invItem.batchNo}`)
		var tableData = await $("//TD[normalize-space()='" + invItem.batchNo + "']/../td").elements();
		assert.equal(await tableData[0].text(), invItem.itemName);
		assert.equal(await tableData[1].text(), invItem.quantity);
		assert.equal(await tableData[2].text(), `${day}-${month}-${year}`);
		assert.equal(await tableData[3].text(), invItem.batchNo);
		await click($("//button[@title='Close']"));
	}
});

step("Click <arg0> button on <arg0> Tab", async function (buttonName, tabName) {
	await click($("//DIV[@role='tabpanel']//BUTTON[normalize-space()='" + buttonName + "']"));
});

step("Click <arg0> button on <arg0> popup", async function (buttonName, popupName) {
	await click($("//DIV[@role='presentation']//BUTTON[normalize-space()='" + buttonName + "']"));
});

step("Select a patient on Dispense popup", async function () {
	var patientID = gauge.dataStore.scenarioStore.get("patientIdentifier");
	await click($("//*[@placeholder= 'Search and select patient']"));
	await write(patientID, into(textBox({ "placeholder": "Search and select patient" })));
	await waitFor(async () => await $("//DIV[@role='option']/DIV[contains(normalize-space(),'" + patientID + "')]").isVisible());
	await click($("//DIV[@role='option']/DIV[contains(normalize-space(),'" + patientID + "')]"));
});

step("Select a Drug on Dispense popup", async function () {
	var intQty = faker.datatype.number({ min: 1, max: 10 });
	var invDrugDetails = await generateRandomDrugDetailsInDispensePopup(intQty, true);
	gauge.dataStore.scenarioStore.put("invDrugDetails", invDrugDetails);
	for (var index = 0; index < invDrugDetails.length; index++) {
		if (index !== 0) {
			await click($("//*[@id='stock-table-container']/button"));
		}
		await enterItemName(invDrugDetails[index].itemName, index + 1);
		await enterDispenseQuantity(invDrugDetails[index].dispenseQuantity, index + 1);
	}
});

async function generateRandomDrugDetailsInDispensePopup(totalItems, blnOnlyDrug) {
	var loginLocation = gauge.dataStore.scenarioStore.get("loginLocation")
	var stockroomUUID = (await httpRequests.customGet(endpoints.stockroom, { q: loginLocation })).body.results[0].uuid;
	var allItemsResponse = await httpRequests.customGet(endpoints.stock_items, { stockroom_uuid: stockroomUUID, limit: "1" });
	allItemsResponse = await httpRequests.customGet(endpoints.stock_items, { stockroom_uuid: stockroomUUID, limit: allItemsResponse.body.length });
	var allItems = allItemsResponse.body.results;
	totalItems = totalItems > allItems.length ? allItems.length : totalItems;
	var items = [];
	for (var i = 0; i < totalItems; i++) {
		var randomItem;
		if (!blnOnlyDrug)
			randomItem = getRandomJsonArray(allItems, items, "item.name");
		else {
			var filteredItems = allItems.filter(item => {
				return item.details.some(detail => {
					return detail.item.attributes.some(attribute => {
						return attribute.attributeType.name === 'Drug';
					});
				});
			});
			totalItems = totalItems > filteredItems.length ? filteredItems.length : totalItems;
			randomItem = getRandomJsonArray(filteredItems, items, "item.name");
		}
		var ItemDetails = {};
		ItemDetails.itemName = randomItem.item.name;
		ItemDetails.availableQuantity = randomItem.quantity
		ItemDetails.dispenseQuantity = faker.datatype.number({ min: 1, max: ItemDetails.availableQuantity });
		items.push(ItemDetails);
	}
	return items;
}

step("Validate the inventory page to check the stocks are reduced", async function () {
	var invItemDetails = gauge.dataStore.scenarioStore.get("invDrugDetails");
	for (var invItem of invItemDetails) {
		var availableQuantity = (invItem.availableQuantity - invItem.dispenseQuantity);
		if (availableQuantity > 0) {
			assert.ok((await (link(invItem.itemName)).elements()).length === 1);
			assert.equal((await ($("(//TD[normalize-space()='" + invItem.itemName + "']/following::TD)[1]").text())), availableQuantity.toString());
		}
		else {
			assert.ok((await (link(invItem.itemName)).elements()).length === 0);
		}
	}
});

step("Validate message <messsage>", async function (message) {
	var successMessage = "//*[normalize-space()='Success" + message + "']"
	await waitFor(async () => await $(successMessage).isVisible());
	assert.ok(await $(successMessage).isVisible());
	await taikoHelper.repeatUntilNotFound($(successMessage));
	assert.ok(!(await $(successMessage).exists()));
});

step("Add random items to stock room", async function () {
	var loginLocation = gauge.dataStore.scenarioStore.get("loginLocation")
	var stockroomUUID = (await httpRequests.customGet(endpoints.stockroom, { q: loginLocation })).body.results[0].uuid;
	var allItemsResponse = await httpRequests.customGet(endpoints.stock_items, { stockroom_uuid: stockroomUUID, limit: "1" });
	var expectedQuantity = faker.datatype.number({ min: 51, max: 60 });
	var currentStockRoomItemsCount = allItemsResponse.body.length;
	var maxRetries = 100;
	var retries = 0;
	while (currentStockRoomItemsCount < expectedQuantity && retries < maxRetries) {
		var itemsToAdd = expectedQuantity - currentStockRoomItemsCount;
		var randomItems = await generateRandomItemDetails(itemsToAdd, false);
		var payload = JSON.parse(fileExtension.parseContent(`./bahmni-e2e-common-flows/data/inventory/loadStock.json`))
		payload.items = randomItems
		payload.destination = stockroomUUID;
		payload.operationDate = format(new Date(), 'dd-MM-yyyy HH:mm:ss');
		var stockOperationResponse = await httpRequests.customPost(endpoints.stock_operation, payload);
		assert.equal(stockOperationResponse.statusCode, 201);
		allItemsResponse = await httpRequests.customGet(endpoints.stock_items, { stockroom_uuid: stockroomUUID, limit: "1" });
		currentStockRoomItemsCount = allItemsResponse.body.length;
		retries++;
	}
});

async function generateRandomItemDetails(totalItems, blnOnlyDrug) {
	var allItemsResponse = await httpRequests.customGet(endpoints.inv_items, "limit=" + (await httpRequests.customGet(endpoints.inv_items, "limit=1")).body.length);
	var allItems = allItemsResponse.body.results;
	var itemsList = [];
	totalItems = totalItems > allItems.length ? allItems.length : totalItems;
	for (var i = 0; i < totalItems; i++) {
		var randomItem;
		if (!blnOnlyDrug)
			randomItem = getRandomJsonArray(allItems, itemsList, "name");
		else {
			filteredItems = allItems.filter(item => item.attributes.filter(attribute => attribute.attributeType.name === "Drug").length > 0);
			totalItems = totalItems > filteredItems.length ? filteredItems.length : totalItems;
			randomItem = getRandomJsonArray(filteredItems, items, "name");
		}
		var items = {};
		items.item = randomItem.uuid;
		items.batchNumber = dateUtil.getGetCurrentddmmyyhhmmssms();
		items.expiration = dateUtil.generateRandomDate(5).replace(new RegExp('/', 'g'), '-');
		items.quantity = faker.datatype.number({ min: 1, max: 1000 });
		items.calculatedExpiration = true;
		itemsList.push(items);
	}
	return itemsList;
}

step("Verify all stock room items are displayed in the inventory page", async function () {
	var loginLocation = gauge.dataStore.scenarioStore.get("loginLocation")
	var stockroomUUID = (await httpRequests.customGet(endpoints.stockroom, { q: loginLocation })).body.results[0].uuid;
	var allItemsResponse = await httpRequests.customGet(endpoints.stock_items, { stockroom_uuid: stockroomUUID, limit: "1" });
	allItemsResponse = await httpRequests.customGet(endpoints.stock_items, { stockroom_uuid: stockroomUUID, limit: allItemsResponse.body.length });
	var allStocks = allItemsResponse.body.results;
	for (var stock of allStocks) {
		assert.ok((await (link(stock.item.name)).elements()).length === 1, "Item " + stock.item.name + " is not displayed in the inventory page");
		assert.equal((await ($("(//TD[normalize-space()='" + stock.item.name + "']/following::TD)[1]").text())), stock.quantity.toString(), "Quantity of " + stock.item.name + " is not displayed correctly in the inventory page");
	}
});