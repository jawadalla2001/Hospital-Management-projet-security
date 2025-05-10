/**
 * Hospital Management System
 * Appointment Form JavaScript - Handles all dynamic functionality for appointment creation/editing
 */

$(document).ready(function() {
    // Initialize select2 dropdowns for better UX
    $('.select').select2({
        minimumResultsForSearch: 7
    });

    // Initialize date picker with business days only
    $('.datetimepicker').datetimepicker({
        format: 'DD/MM/YYYY',
        minDate: moment(),
        maxDate: moment().add(60, 'days'),
        disabledDates: [
            // Add holidays or non-working days here
        ],
        daysOfWeekDisabled: [0, 6] // Disable weekends (Sunday, Saturday)
    });

    // Time picker initialization with 30-minute intervals
    $('#datetimepicker3').datetimepicker({
        format: 'LT',
        stepping: 30,
        enabledHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17] // 8 AM to 5 PM
    });

    // Tab navigation
    $('.next-tab').click(function() {
        let activeTab = $('.nav-tabs .active');
        let nextTab = activeTab.parent().next().find('a');
        if (nextTab.length > 0) {
            nextTab.tab('show');
            scrollToTop();
        }
    });

    $('.prev-tab').click(function() {
        let activeTab = $('.nav-tabs .active');
        let prevTab = activeTab.parent().prev().find('a');
        if (prevTab.length > 0) {
            prevTab.tab('show');
            scrollToTop();
        }
    });

    // Department selection changes available doctors
    $('#department-select').change(function() {
        let department = $(this).val();
        let doctorSelect = $('#doctor-select');
        
        // Clear existing options
        doctorSelect.empty().append('<option value="">Select Doctor</option>');
        
        if (department) {
            // Show loading state
            doctorSelect.append('<option value="" disabled>Loading doctors...</option>');
            
            // Simulate AJAX call - replace with actual data fetching
            setTimeout(function() {
                doctorSelect.empty().append('<option value="">Select Doctor</option>');
                
                // Mock data - replace with actual doctors by department
                if (department === "Dentists") {
                    doctorSelect.append('<option value="Dr. John Smith">Dr. John Smith</option>');
                    doctorSelect.append('<option value="Dr. Maria Garcia">Dr. Maria Garcia</option>');
                } else if (department === "Neurology") {
                    doctorSelect.append('<option value="Dr. Robert Chen">Dr. Robert Chen</option>');
                    doctorSelect.append('<option value="Dr. Susan Wong">Dr. Susan Wong</option>');
                } else if (department === "Opthalmology") {
                    doctorSelect.append('<option value="Dr. James Wilson">Dr. James Wilson</option>');
                } else if (department === "Orthopedics") {
                    doctorSelect.append('<option value="Dr. Patricia Johnson">Dr. Patricia Johnson</option>');
                    doctorSelect.append('<option value="Dr. Michael Lee">Dr. Michael Lee</option>');
                } else if (department === "Cancer Department") {
                    doctorSelect.append('<option value="Dr. Elizabeth Taylor">Dr. Elizabeth Taylor</option>');
                } else if (department === "ENT Department") {
                    doctorSelect.append('<option value="Dr. David Rodriguez">Dr. David Rodriguez</option>');
                    doctorSelect.append('<option value="Dr. Sarah Kim">Dr. Sarah Kim</option>');
                }
                
                doctorSelect.select2('destroy').select2({
                    minimumResultsForSearch: 7
                });
            }, 500);
        }
    });

    // Doctor selection opens schedule modal
    $('#doctor-select').change(function() {
        let doctor = $(this).val();
        if (doctor) {
            // Update modal title with doctor name
            $('#scheduleModalLabel').text(doctor + '\'s Schedule');
        }
    });

    // View doctor schedule button
    $('.view-schedule-btn').click(function() {
        let doctor = $('#doctor-select').val();
        if (doctor) {
            $('#doctor-schedule-modal').modal('show');
        } else {
            showError('Please select a doctor first');
        }
    });

    // Patient search button
    $('#search-patient-btn').click(function() {
        let patientId = $('input[name="patient_id"]').val();
        if (patientId) {
            // Show loading state
            $(this).html('<i class="fa fa-spinner fa-spin"></i>');
            
            // Simulate AJAX search - replace with actual patient search
            setTimeout(function() {
                // Mock patient data - replace with actual patient search results
                let patientData = {
                    name: 'John Doe',
                    email: 'johndoe@example.com',
                    phone: '(555) 123-4567',
                    dob: '12/05/1980',
                    gender: 'male'
                };
                
                // Populate form with patient data
                $('input[name="p_name"]').val(patientData.name);
                $('input[name="email"]').val(patientData.email);
                $('input[name="phone"]').val(patientData.phone);
                $('input[name="dob"]').val(patientData.dob);
                $('select[name="gender"]').val(patientData.gender).trigger('change');
                
                // Reset button
                $('#search-patient-btn').html('<i class="fa fa-search"></i>');
                
                showSuccess('Patient information loaded');
            }, 1000);
        } else {
            showError('Please enter a patient ID');
        }
    });

    // Select time from schedule modal
    $('#select-time-btn').click(function() {
        let selectedTime = $('.time-slot .timing.selected').text();
        if (selectedTime) {
            $('#datetimepicker3').val(selectedTime.trim());
            $('#doctor-schedule-modal').modal('hide');
        } else {
            alert('Please select a time slot');
        }
    });

    // Time slot selection in the modal
    $(document).on('click', '.timing', function(e) {
        e.preventDefault();
        $('.timing').removeClass('selected');
        $(this).addClass('selected');
    });

    // Form submission handling
    $('#appointment-form').submit(function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return false;
        }
        
        // Disable submit button to prevent double submission
        $('.submit-btn').prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Creating Appointment...');
        
        // Simulate form submission - replace with actual form handling
        setTimeout(function() {
            // Show success message
            showSuccess('Appointment created successfully!');
            
            // Reset form
            $('#appointment-form')[0].reset();
            $('.select').val('').trigger('change');
            
            // Go back to first tab
            $('.nav-tabs a:first').tab('show');
            
            // Re-enable submit button
            $('.submit-btn').prop('disabled', false).html('Create Appointment');
            
            // Redirect to appointments list after delay
            setTimeout(function() {
                window.location.href = '/appointment';
            }, 2000);
        }, 1500);
    });

    // Helper functions
    function validateForm() {
        let isValid = true;
        
        // Check required fields in current tab only
        let activeTab = $('.tab-pane.active');
        let requiredFields = activeTab.find('[required]');
        
        requiredFields.each(function() {
            if (!$(this).val()) {
                isValid = false;
                $(this).addClass('is-invalid');
                
                // Show error near field
                if ($(this).next('.invalid-feedback').length === 0) {
                    $(this).after('<div class="invalid-feedback">This field is required.</div>');
                }
            } else {
                $(this).removeClass('is-invalid');
                $(this).next('.invalid-feedback').remove();
            }
        });
        
        if (!isValid) {
            showError('Please fill in all required fields');
        }
        
        return isValid;
    }

    function showSuccess(message) {
        $('#success-alert').removeClass('d-none').find('strong').next().text(message);
        scrollToTop();
        
        // Auto hide after 5 seconds
        setTimeout(function() {
            $('#success-alert').addClass('d-none');
        }, 5000);
    }

    function showError(message) {
        $('#error-alert').removeClass('d-none').find('#error-message').text(message);
        scrollToTop();
        
        // Auto hide after 5 seconds
        setTimeout(function() {
            $('#error-alert').addClass('d-none');
        }, 5000);
    }

    function scrollToTop() {
        $('html, body').animate({
            scrollTop: $(".page-title").offset().top
        }, 300);
    }

    // Check for conflicts when selecting date/time
    $('input[name="date"], input[name="time"]').change(function() {
        let date = $('input[name="date"]').val();
        let time = $('input[name="time"]').val();
        let doctor = $('#doctor-select').val();
        
        if (date && time && doctor) {
            // Simulate conflict checking - replace with actual conflict detection
            setTimeout(function() {
                // Random conflict detection (10% chance of conflict for demo)
                if (Math.random() < 0.1) {
                    showError('This time slot is already booked with Dr. ' + doctor + '. Please select another time.');
                    $('input[name="time"]').addClass('is-invalid');
                } else {
                    $('input[name="time"]').removeClass('is-invalid');
                }
            }, 500);
        }
    });
});