/**
 * Hospital Management System
 * Doctors Page JavaScript - Handles all dynamic functionality for doctors listing
 */

$(document).ready(function() {
    // Initialize the view toggle buttons
    initViewToggle();
    
    // Initialize filters
    initFilters();
    
    // Initialize sorting
    initSorting();
    
    // Initialize doctor cards actions
    initDoctorCards();
    
    // Initialize datatable for advanced features
    initDatatable();
});

/**
 * Initialize view toggle functionality (table vs card view)
 */
function initViewToggle() {
    $('.view-toggle-btn').on('click', function() {
        var view = $(this).data('view');
        
        // Toggle active state on buttons
        $('.view-toggle-btn').removeClass('active');
        $(this).addClass('active');
        
        // Toggle view containers
        if (view === 'table') {
            $('#table-view').show();
            $('#card-view').hide();
        } else {
            $('#table-view').hide();
            $('#card-view').show();
        }
        
        // Store preference in local storage
        localStorage.setItem('doctors-view-preference', view);
    });
    
    // Check if there's a saved preference
    var viewPreference = localStorage.getItem('doctors-view-preference');
    if (viewPreference) {
        $('.view-toggle-btn[data-view="' + viewPreference + '"]').click();
    }
}

/**
 * Initialize filtering functionality
 */
function initFilters() {
    // Department filter
    $('#department-filter').on('change', function() {
        var department = $(this).val();
        
        if (department === 'all') {
            // Show all doctors
            $('.doctor-card').show();
            $('#table-view tbody tr').show();
        } else {
            // Filter doctors by department
            $('.doctor-card').hide();
            $('.doctor-card[data-department="' + department + '"]').show();
            
            $('#table-view tbody tr').hide();
            $('#table-view tbody tr[data-department="' + department + '"]').show();
        }
    });
    
    // Status filter
    $('#status-filter').on('change', function() {
        var status = $(this).val();
        
        if (status === 'all') {
            // Show all doctors
            $('.doctor-card').show();
            $('#table-view tbody tr').show();
        } else {
            // Filter doctors by status
            $('.doctor-card').hide();
            $('.doctor-card[data-status="' + status + '"]').show();
            
            $('#table-view tbody tr').hide();
            $('#table-view tbody tr[data-status="' + status + '"]').show();
        }
    });
    
    // Search functionality
    $('#doctor-search').on('keyup', function() {
        var searchTerm = $(this).val().toLowerCase();
        
        if (searchTerm === '') {
            // Show all doctors if search is empty
            $('.doctor-card').show();
            $('#table-view tbody tr').show();
        } else {
            // Hide all doctors first
            $('.doctor-card').hide();
            $('#table-view tbody tr').hide();
            
            // Show doctors that match the search term
            $('.doctor-card').each(function() {
                var doctorName = $(this).find('.doctor-name').text().toLowerCase();
                var doctorSpecialty = $(this).find('.doctor-specialty').text().toLowerCase();
                
                if (doctorName.indexOf(searchTerm) > -1 || doctorSpecialty.indexOf(searchTerm) > -1) {
                    $(this).show();
                }
            });
            
            $('#table-view tbody tr').each(function() {
                var doctorName = $(this).find('td:nth-child(3)').text().toLowerCase() + ' ' + 
                                 $(this).find('td:nth-child(4)').text().toLowerCase();
                var doctorSpecialty = $(this).find('td:nth-child(10)').text().toLowerCase();
                
                if (doctorName.indexOf(searchTerm) > -1 || doctorSpecialty.indexOf(searchTerm) > -1) {
                    $(this).show();
                }
            });
        }
    });
    
    // Clear filters button
    $('#clear-filters').on('click', function() {
        // Reset all filter elements
        $('#department-filter').val('all');
        $('#status-filter').val('all');
        $('#doctor-search').val('');
        
        // Show all doctors
        $('.doctor-card').show();
        $('#table-view tbody tr').show();
    });
}

/**
 * Initialize sorting functionality for card view
 */
function initSorting() {
    $('#sort-select').on('change', function() {
        var sortOption = $(this).val();
        var $doctorCards = $('.doctor-card');
        
        // Sort cards based on the selected option
        $doctorCards.sort(function(a, b) {
            var aVal, bVal;
            
            switch(sortOption) {
                case 'name-asc':
                    aVal = $(a).find('.doctor-name').text();
                    bVal = $(b).find('.doctor-name').text();
                    return aVal.localeCompare(bVal);
                case 'name-desc':
                    aVal = $(a).find('.doctor-name').text();
                    bVal = $(b).find('.doctor-name').text();
                    return bVal.localeCompare(aVal);
                case 'department-asc':
                    aVal = $(a).data('department');
                    bVal = $(b).data('department');
                    return aVal.localeCompare(bVal);
                case 'id-asc':
                    aVal = parseInt($(a).data('id'));
                    bVal = parseInt($(b).data('id'));
                    return aVal - bVal;
                case 'id-desc':
                    aVal = parseInt($(a).data('id'));
                    bVal = parseInt($(b).data('id'));
                    return bVal - aVal;
                default:
                    return 0;
            }
        });
        
        // Reattach the sorted items
        $('#card-view .row').html($doctorCards);
    });
}

/**
 * Initialize doctor cards actions
 */
function initDoctorCards() {
    // Doctor card click to show profile
    $('.doctor-card .card-body').on('click', function() {
        var doctorId = $(this).closest('.doctor-card').data('id');
        // Can be changed to redirect to profile page
        showDoctorDetails(doctorId);
    });
    
    // Quick actions on doctor cards
    $('.doctor-action').on('click', function(e) {
        e.stopPropagation(); // Prevent triggering the card click
        
        var action = $(this).data('action');
        var doctorId = $(this).closest('.doctor-card').data('id');
        
        switch (action) {
            case 'edit':
                window.location.href = '/doctors/edit_doctor/' + doctorId;
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this doctor?')) {
                    window.location.href = '/doctors/delete_doctor/' + doctorId;
                }
                break;
            case 'profile':
                // Can be changed to redirect to profile page
                showDoctorDetails(doctorId);
                break;
            case 'schedule':
                // Can be implemented to show schedule modal
                alert('View schedule feature will be implemented soon.');
                break;
        }
    });
}

/**
 * Initialize datatable for table view
 */
function initDatatable() {
    if ($.fn.DataTable) {
        $('#doctors-table').DataTable({
            paging: true,
            searching: false, // We have our own search functionality
            ordering: true,
            info: true,
            lengthChange: true,
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
            language: {
                paginate: {
                    previous: '<i class="fa fa-chevron-left"></i>',
                    next: '<i class="fa fa-chevron-right"></i>'
                }
            },
            responsive: true
        });
    }
}

/**
 * Show doctor details in a modal
 */
function showDoctorDetails(doctorId) {
    // Find doctor card with the matching ID
    var $doctorCard = $('.doctor-card[data-id="' + doctorId + '"]');
    
    // Extract doctor information
    var doctorName = $doctorCard.find('.doctor-name').text();
    var doctorDepartment = $doctorCard.find('.doctor-specialty').text();
    var doctorImg = $doctorCard.find('.doctor-img').attr('src');
    
    // Populate the modal with doctor information
    $('#doctor-detail-modal .modal-title').text(doctorName);
    $('#doctor-detail-modal .doctor-detail-img').attr('src', doctorImg);
    $('#doctor-detail-modal .doctor-detail-department').text(doctorDepartment);
    
    // Show the modal
    $('#doctor-detail-modal').modal('show');
}

/**
 * Export doctor list to CSV
 */
function exportDoctorList() {
    // Create CSV content
    var csvContent = "ID,First Name,Last Name,Email,Phone,Department\n";
    
    // Add each doctor to the CSV
    $('#table-view tbody tr').each(function() {
        var id = $(this).find('td:nth-child(2)').text();
        var firstName = $(this).find('td:nth-child(3)').text();
        var lastName = $(this).find('td:nth-child(4)').text();
        var email = $(this).find('td:nth-child(5)').text();
        var phone = $(this).find('td:nth-child(9)').text();
        var department = $(this).find('td:nth-child(10)').text();
        
        csvContent += id + "," + firstName + "," + lastName + "," + email + "," + phone + "," + department + "\n";
    });
    
    // Create download link
    var encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "doctors_list.csv");
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
}

/**
 * Print doctor list
 */
function printDoctorList() {
    window.print();
}