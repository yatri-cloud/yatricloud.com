// Product Management - Google Apps Script
// This script handles product submissions and data retrieval for Yatri Store

// Configuration
const SPREADSHEET_ID = '1fHKV9moStqvkc5LiL1YstH4LfygPAnhg0s6M78mNMcA'; // Your Google Sheet ID
const MAIN_SHEET_NAME = 'add-product';
const CERTIFICATIONS_SUBSHEET = 'certifications';

/**
 * Handle CORS preflight requests
 */
function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST request - Add product
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Open the spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Get or create main sheet
    let mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    if (!mainSheet) {
      mainSheet = ss.insertSheet(MAIN_SHEET_NAME);
      // Add headers
      mainSheet.appendRow([
        'Timestamp',
        'ID',
        'Title',
        'Category',
        'Original Price',
        'Discounted Price',
        'Discount',
        'Image',
        'Description',
        'Exam Code',
        'Level',
        'Status'
      ]);
    }
    
    // Check if headers exist
    const headers = mainSheet.getRange(1, 1, 1, mainSheet.getLastColumn()).getValues()[0];
    if (headers.length === 0 || headers[0] === '') {
      mainSheet.getRange(1, 1, 1, 12).setValues([[
        'Timestamp',
        'ID',
        'Title',
        'Category',
        'Original Price',
        'Discounted Price',
        'Discount',
        'Image',
        'Description',
        'Exam Code',
        'Level',
        'Status'
      ]]);
    }
    
    // Generate ID if not provided
    const productId = data.id || `product-${Date.now()}`;
    const category = data.category || 'AWS';
    const level = data.level || 'Associate';
    
    // Create category-specific subsheet name (e.g., aws-certifications)
    const categorySubsheetName = `${category.toLowerCase()}-certifications`;
    
    // Get or create category subsheet
    let categorySheet = ss.getSheetByName(categorySubsheetName);
    if (!categorySheet) {
      categorySheet = ss.insertSheet(categorySubsheetName);
      // Add headers
      categorySheet.appendRow([
        'Timestamp',
        'ID',
        'Title',
        'Category',
        'Original Price',
        'Discounted Price',
        'Discount',
        'Image',
        'Description',
        'Exam Code',
        'Level',
        'Status'
      ]);
    }
    
    // Prepare row data
    const timestamp = new Date().toISOString();
    const rowData = [
      timestamp,
      productId,
      data.title || '',
      category,
      data.originalPrice || 0,
      data.discountedPrice || 0,
      data.discount || 0,
      data.image || '',
      data.description || '',
      data.examCode || '',
      level,
      data.status || 'active'
    ];
    
    // Add to main sheet
    mainSheet.appendRow(rowData);
    
    // Add to category subsheet
    categorySheet.appendRow(rowData);
    
    // Also add to certifications subsheet if it exists
    let certificationsSheet = ss.getSheetByName(CERTIFICATIONS_SUBSHEET);
    if (!certificationsSheet) {
      certificationsSheet = ss.insertSheet(CERTIFICATIONS_SUBSHEET);
      certificationsSheet.appendRow([
        'Timestamp',
        'ID',
        'Title',
        'Category',
        'Original Price',
        'Discounted Price',
        'Discount',
        'Image',
        'Description',
        'Exam Code',
        'Level',
        'Status'
      ]);
    }
    certificationsSheet.appendRow(rowData);
    
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: 'Product added successfully',
        productId: productId,
        category: category,
        subsheet: categorySubsheetName
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET request - Fetch products
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const allProducts = [];
    
    // Get main sheet
    const mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    if (!mainSheet) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          products: []
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = mainSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          products: []
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const product = {};
      
      headers.forEach((header, index) => {
        const key = header.toLowerCase().replace(/\s+/g, '');
        product[key] = row[index] || '';
      });
      
      // Format product data
      product.id = product['id'] || `product-${i}`;
      product.title = product['title'] || '';
      product.category = product['category'] || 'AWS';
      product.originalPrice = parseFloat(product['originalprice'] || product['original price'] || 0);
      product.discountedPrice = parseFloat(product['discountedprice'] || product['discounted price'] || 0);
      product.discount = parseFloat(product['discount'] || 0);
      product.image = product['image'] || '';
      product.description = product['description'] || '';
      product.examCode = product['examcode'] || product['exam code'] || '';
      product.level = product['level'] || 'Associate';
      product.status = product['status'] || 'active';
      
      // Only include active products
      if (product.status === 'active' || product.status === '') {
        allProducts.push(product);
      }
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        products: allProducts
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString(),
        products: []
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}


