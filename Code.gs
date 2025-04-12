function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Customer Management')
    .addItem('Add Customer', 'showCustomerForm')
    .addToUi();
  // displayCustomerList();
  updateCustomerTransactions();
}

function showCustomerForm() {
  var html = HtmlService.createHtmlOutputFromFile('CustomerForm')
    .setWidth(300)
    .setHeight(250);
  SpreadsheetApp.getUi().showModalDialog(html, 'Add Customer');
}

function addCustomer(name) {
  if (!name) {
    SpreadsheetApp.getUi().alert('Customer name cannot be empty!');
    return;
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Customer Summary');
  var lastRow = sheet.getLastRow();
  var customerId = (lastRow < 2) ? 1 : sheet.getRange(lastRow, 1).getValue() + 1;
  sheet.appendRow([customerId, name, 0, 0]);
  SpreadsheetApp.getUi().alert('Customer added successfully!');
  updateCustomerTransactions();
}



function getCustomers() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Customer Summary');
  var data = sheet.getDataRange().getValues();
  var customers = [];

  for (var i = 1; i < data.length; i++) { // Skip the header row
    customers.push({
      id: data[i][0], 
      name: data[i][1], 
      received: data[i][2], 
      sent: data[i][3]
    });
  }

  return customers; // Sends data back to the frontend
}




function getTransactions(customerId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions');
  var data = sheet.getDataRange().getValues();
  var transactions = [];

  for (var i = 1; i < data.length; i++) { // Skip the header row
    if (data[i][1] == customerId){
      transactions.push({
        id: data[i][0], 
        customerId: data[i][1], 
        name: data[i][2], 
        received: data[i][3],
        sent: data[i][4], 
        date: data[i][5] ? data[i][5].toLocaleString() : "No Date"
      });
    }
  }

  return transactions; // Sends data back to the frontend
}

function getFilteredTransactions(fromDateStr, toDateStr) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions');
  const data = sheet.getDataRange().getValues();
  const results = [];

  let from_d = new Date(fromDateStr);
  let to = new Date(toDateStr);

  for (let i = 1; i < data.length; i++) {
    let txDate = data[i][5] ? new Date(data[i][5]) : null;

    if (txDate && txDate >= from_d && txDate <= to) {
      results.push({
        id: data[i][0],
        customerId: data[i][1],
        name: data[i][2],
        received: data[i][3],
        sent: data[i][4],
        date: data[i][5].toLocaleString()
      });
    }
  }
  console.log(results)
  return results;

}





function addTransaction(customerId, name, amount, type) {
  var transactionSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions');
  var summarySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Customer Summary');
  var lastRow = transactionSheet.getLastRow();
  var transactionId = (lastRow < 2) ? 1001 : transactionSheet.getRange(lastRow, 1).getValue() + 1;
  if (type == 'Received'){
    transactionSheet.appendRow([transactionId, customerId, name, amount, , new Date()]);
  }
  else if(type == 'Sent'){
    transactionSheet.appendRow([transactionId, customerId, name, , amount, new Date()]);
  }
  var data = summarySheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == customerId) {
      if (type === 'Received') {
        summarySheet.getRange(i + 1, 3).setValue(data[i][2] + amount);
      } else {
        summarySheet.getRange(i + 1, 4).setValue(data[i][3] + amount);
      }
      break;
    }
  }
  
  // SpreadsheetApp.getUi().alert('Transaction added successfully!');
  updateCustomerTransactions();
}

function updateCustomerTransactions() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var transactionsSheet = sheet.getSheetByName('Transactions');
  var customerTransactionsSheet = sheet.getSheetByName('Customer Transactions');
  var summarySheet = sheet.getSheetByName('Customer Summary');
  
  // Fetch customer IDs and names for dropdown
  var customerData = summarySheet.getRange("A2:B" + summarySheet.getLastRow()).getValues();
  var customerList = customerData.map(row => row[0] + " - " + row[1]);
  
  // Set dropdown validation in A2
  var range = customerTransactionsSheet.getRange("A2");
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(customerList, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
  
  // Get selected customer
  var selectedCustomer = customerTransactionsSheet.getRange("A2").getValue();
  if (!selectedCustomer) return;
  
  var selectedCustomerId = parseInt(selectedCustomer.split(" - ")[0], 10);

  // Clear previous transactions
  customerTransactionsSheet.getRange('A3:F').clearContent();

  // Fetch and display transactions for selected customer
  var data = transactionsSheet.getDataRange().getValues();
  var row = 3;
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] == selectedCustomerId) { // Ensure correct comparison
      customerTransactionsSheet.getRange(row, 1, 1, 6).setValues([data[i]]);
      row++;
    }
  }
}

function onEdit(e) {
  var sheet = e.source.getSheetByName('Customer Transactions');
  var range = e.range;

  // Check if the edited cell is A2 (Dropdown)
  if (sheet && range.getA1Notation() === "A2") {
    updateCustomerTransactions();
  }
}

function doGet(e) {
  if (e.parameter.view === "customer") {
    return HtmlService.createHtmlOutputFromFile('Customer');
  } else if (e.parameter.view === "transaction") {
    return HtmlService.createHtmlOutputFromFile('TransactionForm');
  } else {
    return HtmlService.createHtmlOutput("Invalid view parameter.");
  }
}

