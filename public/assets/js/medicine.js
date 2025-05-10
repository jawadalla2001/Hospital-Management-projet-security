/**
 * Hospital Management System
 * Medicine Store JavaScript - Handles dynamic functionality for medicine inventory management
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initializeViewToggle();
    initializeFilters();
    initializeStockAlerts();
    initializeExpiryAlerts();
    initializeBatchActions();
    setupInventoryMetrics();
    setupDataTable();
});

/**
 * Toggle between table view and card view
 */
function initializeViewToggle() {
    const viewToggleButtons = document.querySelectorAll('.view-toggle-btn');
    const tableView = document.getElementById('table-view');
    const cardView = document.getElementById('card-view');

    if (!viewToggleButtons.length || !tableView || !cardView) return;

    viewToggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            viewToggleButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            // Show the selected view and hide the other
            const viewType = this.getAttribute('data-view');
            if (viewType === 'table') {
                tableView.style.display = 'block';
                cardView.style.display = 'none';
            } else {
                tableView.style.display = 'none';
                cardView.style.display = 'block';
            }
        });
    });
}

/**
 * Initialize filter functionality
 */
function initializeFilters() {
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            // Reset all filter inputs
            document.getElementById('medicine-search').value = '';
            document.getElementById('category-filter').value = 'all';
            document.getElementById('stock-filter').value = 'all';
            document.getElementById('expiry-filter').value = 'all';
            
            // Reset the filter display
            filterMedicines();
        });
    }

    // Add event listeners to filter inputs
    const filterInputs = document.querySelectorAll('.filter-input');
    filterInputs.forEach(input => {
        input.addEventListener('change', filterMedicines);
    });

    // Add event listener to search input
    const searchInput = document.getElementById('medicine-search');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            filterMedicines();
        });
    }
}

/**
 * Filter medicines based on selected criteria
 */
function filterMedicines() {
    const searchTerm = (document.getElementById('medicine-search')?.value || '').toLowerCase();
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const stockFilter = document.getElementById('stock-filter')?.value || 'all';
    const expiryFilter = document.getElementById('expiry-filter')?.value || 'all';

    // Filter table rows
    const tableRows = document.querySelectorAll('#medicines-table tbody tr');
    tableRows.forEach(row => {
        const medicineName = row.getAttribute('data-name')?.toLowerCase() || '';
        const category = row.getAttribute('data-category') || '';
        const stockLevel = row.getAttribute('data-stock-level') || '';
        const expiryStatus = row.getAttribute('data-expiry-status') || '';

        const matchesSearch = medicineName.includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
        const matchesStockLevel = stockFilter === 'all' || stockLevel === stockFilter;
        const matchesExpiry = expiryFilter === 'all' || expiryStatus === expiryFilter;

        if (matchesSearch && matchesCategory && matchesStockLevel && matchesExpiry) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    // Filter card items
    const cardItems = document.querySelectorAll('.medicine-card');
    cardItems.forEach(card => {
        const medicineName = card.getAttribute('data-name')?.toLowerCase() || '';
        const category = card.getAttribute('data-category') || '';
        const stockLevel = card.getAttribute('data-stock-level') || '';
        const expiryStatus = card.getAttribute('data-expiry-status') || '';

        const matchesSearch = medicineName.includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
        const matchesStockLevel = stockFilter === 'all' || stockLevel === stockFilter;
        const matchesExpiry = expiryFilter === 'all' || expiryStatus === expiryFilter;

        if (matchesSearch && matchesCategory && matchesStockLevel && matchesExpiry) {
            card.closest('.col-md-4').style.display = '';
        } else {
            card.closest('.col-md-4').style.display = 'none';
        }
    });
    
    // Update inventory metrics based on visible items
    updateInventoryMetrics();
}

/**
 * Initialize stock level visual indicators
 */
function initializeStockAlerts() {
    const stockLevels = document.querySelectorAll('.stock-level');
    
    stockLevels.forEach(level => {
        const quantity = parseInt(level.textContent);
        level.classList.remove('bg-success', 'bg-warning', 'bg-danger');
        
        if (quantity > 50) {
            level.classList.add('bg-success');
        } else if (quantity > 20) {
            level.classList.add('bg-warning');
        } else {
            level.classList.add('bg-danger');
        }
    });
}

/**
 * Initialize expiry date visual indicators
 */
function initializeExpiryAlerts() {
    const expiryDates = document.querySelectorAll('.expiry-date');
    const today = new Date();
    
    expiryDates.forEach(date => {
        const expiryDate = new Date(date.getAttribute('data-date'));
        const monthsUntilExpiry = Math.round((expiryDate - today) / (30 * 24 * 60 * 60 * 1000));
        
        date.classList.remove('text-success', 'text-warning', 'text-danger');
        
        if (monthsUntilExpiry > 6) {
            date.classList.add('text-success');
        } else if (monthsUntilExpiry > 3) {
            date.classList.add('text-warning');
        } else {
            date.classList.add('text-danger');
        }
    });
}

/**
 * Initialize batch actions functionality
 */
function initializeBatchActions() {
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const itemCheckboxes = document.querySelectorAll('.medicine-checkbox');
            itemCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
            updateBatchActionsVisibility();
        });
    }

    // Add event listeners to individual checkboxes
    const itemCheckboxes = document.querySelectorAll('.medicine-checkbox');
    itemCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateBatchActionsVisibility);
    });

    // Add event listeners to batch action buttons
    const batchDeleteBtn = document.getElementById('batch-delete');
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete the selected items?')) {
                // Implement batch delete logic
                const selectedIds = getSelectedItemIds();
                console.log('Batch delete:', selectedIds);
                // You would make an AJAX call here
            }
        });
    }
}

/**
 * Update batch actions toolbar visibility based on selections
 */
function updateBatchActionsVisibility() {
    const selectedCount = document.querySelectorAll('.medicine-checkbox:checked').length;
    const batchActionsToolbar = document.getElementById('batch-actions');
    
    if (batchActionsToolbar) {
        if (selectedCount > 0) {
            batchActionsToolbar.style.display = 'block';
            const countLabel = batchActionsToolbar.querySelector('.selected-count');
            if (countLabel) {
                countLabel.textContent = selectedCount;
            }
        } else {
            batchActionsToolbar.style.display = 'none';
        }
    }
}

/**
 * Get IDs of selected items
 */
function getSelectedItemIds() {
    const selectedCheckboxes = document.querySelectorAll('.medicine-checkbox:checked');
    return Array.from(selectedCheckboxes).map(checkbox => checkbox.value);
}

/**
 * Calculate and display inventory metrics
 */
function setupInventoryMetrics() {
    updateInventoryMetrics();
    
    // Update metrics periodically
    setInterval(updateInventoryMetrics, 60000); // Update every minute
}

/**
 * Update inventory metrics based on current data
 */
function updateInventoryMetrics() {
    // Total medicine count
    const visibleItems = document.querySelectorAll('#medicines-table tbody tr:not([style*="display: none"])');
    updateMetric('total-medicines', visibleItems.length);
    
    // Expiring soon count
    const expiringSoon = document.querySelectorAll('#medicines-table tbody tr:not([style*="display: none"]) .text-danger.expiry-date');
    updateMetric('expiring-soon', expiringSoon.length);
    
    // Low stock count
    const lowStock = document.querySelectorAll('#medicines-table tbody tr:not([style*="display: none"]) .bg-danger.stock-level');
    updateMetric('low-stock', lowStock.length);
    
    // Calculate inventory value
    let totalValue = 0;
    visibleItems.forEach(item => {
        const price = parseFloat(item.getAttribute('data-price') || 0);
        const quantity = parseInt(item.getAttribute('data-quantity') || 0);
        totalValue += price * quantity;
    });
    updateMetric('inventory-value', totalValue.toFixed(2));
}

/**
 * Update a specific metric on the dashboard
 */
function updateMetric(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Initialize DataTable for better table functionality
 */
function setupDataTable() {
    if ($.fn.DataTable && document.getElementById('medicines-table')) {
        $('#medicines-table').DataTable({
            paging: true,
            searching: false, // We handle searching ourselves
            ordering: true,
            info: true,
            lengthChange: true,
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50, 100],
            dom: '<"top"fl>rt<"bottom"ip><"clear">'
        });
    }
}

/**
 * Export medicine inventory data
 */
function exportMedicineList(format) {
    const visibleItems = document.querySelectorAll('#medicines-table tbody tr:not([style*="display: none"])');
    
    if (visibleItems.length === 0) {
        alert('No data to export');
        return;
    }
    
    if (format === 'csv') {
        // Create CSV content
        let csvContent = 'ID,Name,Category,Purchase Date,Expire Date,Price,Quantity,Value\n';
        
        visibleItems.forEach(item => {
            const id = item.cells[1].textContent.trim();
            const name = item.cells[2].textContent.trim();
            const category = item.getAttribute('data-category') || '';
            const purchaseDate = item.cells[3].textContent.trim();
            const expireDate = item.cells[4].textContent.trim();
            const price = item.cells[5].textContent.trim();
            const quantity = item.cells[6].textContent.trim();
            const value = (parseFloat(price) * parseInt(quantity)).toFixed(2);
            
            csvContent += `"${id}","${name}","${category}","${purchaseDate}","${expireDate}","${price}","${quantity}","${value}"\n`;
        });
        
        // Create a blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'medicine_inventory.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else if (format === 'print') {
        window.print();
    }
}

/**
 * Show medicine details modal
 */
function showMedicineDetails(id) {
    const medicine = document.querySelector(`tr[data-id="${id}"]`) || document.querySelector(`.medicine-card[data-id="${id}"]`);
    
    if (!medicine) return;
    
    // Populate modal with medicine details
    const modal = document.getElementById('medicine-detail-modal');
    if (!modal) return;
    
    const nameElement = modal.querySelector('.medicine-detail-name');
    const imageElement = modal.querySelector('.medicine-detail-img');
    const categoryElement = modal.querySelector('.medicine-detail-category');
    const priceElement = modal.querySelector('.medicine-detail-price');
    const quantityElement = modal.querySelector('.medicine-detail-quantity');
    const purchaseDateElement = modal.querySelector('.medicine-detail-purchase-date');
    const expiryDateElement = modal.querySelector('.medicine-detail-expiry-date');
    const editLinkElement = modal.querySelector('.medicine-detail-edit');
    
    if (nameElement) nameElement.textContent = medicine.getAttribute('data-name') || '';
    if (categoryElement) categoryElement.textContent = medicine.getAttribute('data-category') || '';
    if (priceElement) priceElement.textContent = medicine.getAttribute('data-price') || '';
    if (quantityElement) quantityElement.textContent = medicine.getAttribute('data-quantity') || '';
    if (purchaseDateElement) purchaseDateElement.textContent = medicine.getAttribute('data-purchase-date') || '';
    if (expiryDateElement) expiryDateElement.textContent = medicine.getAttribute('data-expiry-date') || '';
    
    if (editLinkElement) {
        editLinkElement.href = `/store/edit_med/${id}`;
    }
    
    // Show the modal
    $(modal).modal('show');
}