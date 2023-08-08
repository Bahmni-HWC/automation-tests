# Inventory

tags: ui, clinic, inventory, regression

## Load a stock in Inventory

* Login to Bahmni as a "pharmacist"
* Goto Clinical application
* Open "Inventory" module
* Click "Load Stock" button on "Inventory" Tab
* Enter Random Item Details in Load Stock popup
* Click "Save" button on "Load Stock" popup
* Validate message "Saved Successfully"
* Click "Inventory" Tab on Inventory
* Validate the inventory page to check the new stocks are loaded

## Dispense a stock from Inventory
* Login to Bahmni location "Nandagudi B" as a "nurse"
* Receptionist creates the patient and starts an OPD
* Logout and Login to Bahmni location "Nandagudi B" as a "pharmacist"
* Goto Clinical application
* Open "Inventory" module
* Click "Dispense" Tab on Inventory
* Click "Dispense" button on "Dispense" Tab
* Select a patient on Dispense popup
* Select a Drug on Dispense popup
* Click "Dispense" button on "Dispense" popup
* Validate message "Dispense successful"
* Click "Inventory" Tab on Inventory
* Validate the inventory page to check the stocks are reduced

## Load more than 50 items to the stock room and verify all the items are displayed in the inventory page
* Login to Bahmni location "Nandagudi PHC" as a "pharmacist"
* Add random items to stock room
* Goto Clinical application
* Open "Inventory" module
* Verify all stock room items are displayed in the inventory page